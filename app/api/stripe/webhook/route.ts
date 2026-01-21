import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
};

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(url, serviceKey);
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as 'monthly' | 'annual';
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (userId && plan && subscriptionId) {
          const stripe = getStripeClient();
          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
          const subObj = subscriptionResponse as unknown as Record<string, unknown>;
          const currentPeriodStart = subObj.current_period_start as number;
          const currentPeriodEnd = subObj.current_period_end as number;

          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan: plan,
              status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
              current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          if (error) {
            console.error('Error updating subscription:', error);
            throw error;
          }
          console.log('Subscription activated for user ' + userId + ': ' + plan);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const subObj = subscription as unknown as Record<string, unknown>;
        const currentPeriodStart = subObj.current_period_start as number;
        const currentPeriodEnd = subObj.current_period_end as number;
        const cancelAtPeriodEnd = subObj.cancel_at_period_end as boolean;
        const subStatus = subObj.status as string;

        if (userId) {
          const status = subStatus === 'active' ? 'active' : 
                        subStatus === 'past_due' ? 'past_due' :
                        subStatus === 'canceled' ? 'canceled' : 'inactive';

          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: status,
              current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
              current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
              cancel_at_period_end: cancelAtPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          if (error) console.error('Error updating subscription:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled', plan: 'free', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);
        if (error) console.error('Error canceling subscription:', error);
        break;
      }

      case 'invoice.payment_failed': {
        const invoiceData = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoiceData.subscription as string | null;
        if (subscriptionId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subscriptionId);
          if (error) console.error('Error updating subscription status:', error);
        }
        break;
      }

      default:
        console.log('Unhandled event type: ' + event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
