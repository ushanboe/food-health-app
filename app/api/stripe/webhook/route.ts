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
    throw new Error(`Supabase configuration missing - URL: ${!!url}, ServiceKey: ${!!serviceKey}`);
  }
  
  return createClient(url, serviceKey);
};

// Safe timestamp conversion - handles null/undefined/invalid values
const safeTimestamp = (timestamp: unknown): string | null => {
  if (timestamp === null || timestamp === undefined) return null;
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return null;
  try {
    return new Date(num * 1000).toISOString();
  } catch {
    return null;
  }
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
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Record<string, unknown>;
          
          console.log('Subscription data keys:', Object.keys(subscriptionData));
          
          const currentPeriodStart = safeTimestamp(subscriptionData.current_period_start);
          const currentPeriodEnd = safeTimestamp(subscriptionData.current_period_end);

          console.log('Parsed timestamps:', { currentPeriodStart, currentPeriodEnd });

          const upsertData: Record<string, unknown> = {
            user_id: userId,
            plan: plan,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          };
          
          // Only add timestamps if they're valid
          if (currentPeriodStart) upsertData.current_period_start = currentPeriodStart;
          if (currentPeriodEnd) upsertData.current_period_end = currentPeriodEnd;
          
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
        const subscription = event.data.object as unknown as Record<string, unknown>;
        const subStatus = subscription.status as string;
        
        const currentPeriodStart = safeTimestamp(subscription.current_period_start);
        const currentPeriodEnd = safeTimestamp(subscription.current_period_end);
        const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean;

        const status = subStatus === 'active' ? 'active' :
                      subStatus === 'canceled' ? 'canceled' : 'inactive';

        const updateData: Record<string, unknown> = {
          status: status,
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString(),
        };
        
        if (currentPeriodStart) updateData.current_period_start = currentPeriodStart;
        if (currentPeriodEnd) updateData.current_period_end = currentPeriodEnd;

        const { error } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id as string);

        if (error) console.error('Error updating subscription:', error);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled', plan: 'free', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id as string);
        if (error) console.error('Error canceling subscription:', error);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoice.subscription as string | null;
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
