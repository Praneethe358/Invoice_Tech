import { Shop } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';

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
    'subscription_ends_at'>
): SubscriptionAccess {
  const now = new Date();

  // If status is empty, default to trial
  const status = (shop.subscription_status || 'trial') as SubscriptionStatus;

  // TRIAL
  if (status === 'trial') {
    if (!shop.trial_ends_at) {
      return {
        canSendInvoices: true,
        status: 'trial',
        daysRemaining: 14,
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
      const admin = createAdminClient();
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
      const admin = createAdminClient();
      await admin
        .from('shops')
        .update({ subscription_status: 'expired' })
        .eq('id', shopId);
    } catch (e) {
      console.error('syncSubscriptionStatus (active) error:', e);
    }
  }
}
