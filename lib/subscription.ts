import { Shop } from '@/lib/types';

export type SubscriptionStatus =
  'trial' | 'active' | 'expired' | 'cancelled';

export interface SubscriptionAccess {
  canSendInvoices: boolean;
  status: SubscriptionStatus;
  daysRemaining: number | null;
  trialActive: boolean;
  message: string;
  urgency: 'none' | 'warning' | 'critical' | 'blocked';
}

export function getSubscriptionAccess(
  shop: Pick<Shop,
    'subscription_status' |
    'trial_ends_at' |
    'subscription_ends_at'> & { auth_user_id?: string | null }
): SubscriptionAccess {
  const now = new Date();

  // Admin permanent active check
  if (
    shop.auth_user_id === 'a24f626f-c941-4759-b9d4-6e4f3039555e' ||
    shop.subscription_status === 'lifetime'
  ) {
    return {
      canSendInvoices: true,
      status: 'active',
      daysRemaining: null,
      trialActive: false,
      message: 'Permanent Free Admin Account',
      urgency: 'none'
    };
  }

  // If status is empty, default to trial
  const status = (shop.subscription_status || 'trial') as SubscriptionStatus;

  // TRIAL
  if (status === 'trial') {
    if (!shop.trial_ends_at) {
      return {
        canSendInvoices: true,
        status: 'trial',
        daysRemaining: 7,
        trialActive: true,
        message: 'Free trial active',
        urgency: 'none'
      };
    }
    const trialEnd = new Date(shop.trial_ends_at);
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft > 3) return {
      canSendInvoices: true,
      status: 'trial',
      daysRemaining: daysLeft,
      trialActive: true,
      message: `Free trial — ${daysLeft} days remaining`,
      urgency: 'none'
    };

    if (daysLeft > 0) return {
      canSendInvoices: true,
      status: 'trial',
      daysRemaining: daysLeft,
      trialActive: true,
      message: `Trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      urgency: 'warning'
    };

    // Trial expired
    return {
      canSendInvoices: false,
      status: 'expired',
      daysRemaining: 0,
      trialActive: false,
      message: 'Your free trial has ended',
      urgency: 'blocked'
    };
  }

  // ACTIVE
  if (status === 'active') {
    if (!shop.subscription_ends_at) return {
      canSendInvoices: true,
      status: 'active',
      daysRemaining: null,
      trialActive: false,
      message: 'Subscription active',
      urgency: 'none'
    };

    const subEnd = new Date(shop.subscription_ends_at);
    const daysLeft = Math.ceil(
      (subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft > 7) return {
      canSendInvoices: true,
      status: 'active',
      daysRemaining: daysLeft,
      trialActive: false,
      message: `Active — renews ${subEnd.toLocaleDateString('en-IN')}`,
      urgency: 'none'
    };

    if (daysLeft > 0) return {
      canSendInvoices: true,
      status: 'active',
      daysRemaining: daysLeft,
      trialActive: false,
      message: `Subscription renews in ${daysLeft} days`,
      urgency: 'warning'
    };

    return {
      canSendInvoices: false,
      status: 'expired',
      daysRemaining: 0,
      trialActive: false,
      message: 'Subscription expired',
      urgency: 'blocked'
    };
  }

  // EXPIRED or CANCELLED
  return {
    canSendInvoices: false,
    status: status,
    daysRemaining: 0,
    trialActive: false,
    message: status === 'cancelled'
      ? 'Subscription cancelled'
      : 'Subscription expired — renew to continue',
    urgency: 'blocked'
  };
}

export async function syncSubscriptionStatus(
  shopId: string,
  shop: Pick<Shop,
    'subscription_status' |
    'trial_ends_at' |
    'subscription_ends_at'>
): Promise<void> {
  const status = shop.subscription_status || 'trial';

  // Auto-expire trial in DB
  if (
    status === 'trial' &&
    shop.trial_ends_at &&
    new Date(shop.trial_ends_at) < new Date()
  ) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient() as any;
      await admin
        .from('shops')
        .update({ subscription_status: 'expired' })
        .eq('id', shopId);
    } catch (e) {
      console.error('syncSubscriptionStatus (trial) error:', e);
    }
  }

  // Auto-expire active subscription in DB
  if (
    status === 'active' &&
    shop.subscription_ends_at &&
    new Date(shop.subscription_ends_at) < new Date()
  ) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient() as any;
      await admin
        .from('shops')
        .update({ subscription_status: 'expired' })
        .eq('id', shopId);
    } catch (e) {
      console.error('syncSubscriptionStatus (active) error:', e);
    }
  }
}

export async function autoExpireOutdatedSubscriptions(): Promise<void> {
  if (typeof window !== 'undefined') return;
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient() as any;
    const nowStr = new Date().toISOString();

    // Expire trials that have ended
    await admin
      .from('shops')
      .update({ subscription_status: 'expired' })
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', nowStr);

    // Expire active subscriptions that have ended
    await admin
      .from('shops')
      .update({ subscription_status: 'expired' })
      .eq('subscription_status', 'active')
      .lt('subscription_ends_at', nowStr);
  } catch (e) {
    console.error('autoExpireOutdatedSubscriptions error:', e);
  }
}
