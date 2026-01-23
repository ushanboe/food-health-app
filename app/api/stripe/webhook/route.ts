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
  
  console.log('Supabase URL exists:', !!url);
  console.log('Service Key exists:', !!serviceKey);
  console.log('Service Key length:', serviceKey?.length || 0);
  
  if (!url || !serviceKey) {
    throw new Error(`Supabase configuration missing - URL: ${!!url}, ServiceKey: ${!!serviceKey}`);
  }
  
  return createClient(url, serviceKey);
};

export async function POST(request: NextRequest) {
  console.log('Webhook received');
  
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
    console.log('Event verified:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    console.log('Supabase client created');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as 'monthly' | 'annual';
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        console.log('Processing checkout.session.completed:', { userId, plan, subscriptionId, customerId });

        if (userId && plan && subscriptionId) {
          const stripe = getStripeClient();
          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
          const subObj = subscriptionResponse as unknown as Record<string, unknown>;
          const currentPeriodStart = subObj.current_period_start as number;
          const currentPeriodEnd = subObj.current_period_end as number;

          console.log('Subscription details:', { currentPeriodStart, currentPeriodEnd });

          const upsertData = {
            user_id: userId,
            plan: plan,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
            current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log('Upserting data:', JSON.stringify(upsertData));

          const { data, error } = await supabase
            .from('subscriptions')
            .upsert(upsertData, { onConflict: 'user_id' })
            .select();

          if (error) {
            console.error('Supabase upsert error:', JSON.stringify(error));
            throw error;
          }
          console.log('Subscription activated for user ' + userId + ': ' + plan, data);
        } else {
          console.log('Missing required fields:', { userId, plan, subscriptionId });
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
                        subStatus === 'past_due' ? 'inactive' :
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
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Webhook handler failed', details: errorMessage }, { status: 500 });
  }
}
