import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { isRateLimited } from '@/lib/rate-limit';
import { autoExpireOutdatedSubscriptions } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { limited } = isRateLimited(`admin-limit:${ip}`, 100, 60000);
  if (limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Auto-expire trials/subscriptions before fetching subscription listings
  await autoExpireOutdatedSubscriptions();

  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  // All shops
  const { data: allShops } = await admin
    .from('shops')
    .select('id, name, shop_type, phone, subscription_status, subscription_ends_at, trial_ends_at, created_at');

  const shops = allShops || [];

  // Active subscriptions
  const active = shops.filter(s => s.subscription_status === 'active');
  const trial = shops.filter(s => s.subscription_status === 'trial');

  // Trials ending within 7 days
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const trialsEndingSoon = trial
    .filter(s => {
      if (!s.trial_ends_at) return false;
      const end = new Date(s.trial_ends_at);
      return end <= weekFromNow && end >= now;
    })
    .map(s => ({
      ...s,
      days_left: Math.max(0, Math.ceil(
        (new Date(s.trial_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )),
    }))
    .sort((a, b) => a.days_left - b.days_left);

  // Renewals due within 30 days
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const renewalsDue = active
    .filter(s => {
      if (!s.subscription_ends_at) return false;
      const end = new Date(s.subscription_ends_at);
      return end <= thirtyDaysFromNow;
    })
    .map(s => ({
      ...s,
      days_left: Math.max(0, Math.ceil(
        (new Date(s.subscription_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )),
    }))
    .sort((a, b) => a.days_left - b.days_left);

  // Expired this month
  const expiredThisMonth = shops.filter(s =>
    s.subscription_status === 'expired'
  );

  // Trials expiring soon (<= 3 days)
  const trialsExpiringSoonCount = trialsEndingSoon.filter(s => s.days_left <= 3).length;

  // Renewals due (<= 7 days)
  const renewalsDueCount = renewalsDue.filter(s => s.days_left <= 7).length;

  return NextResponse.json({
    summary: {
      active_subscriptions: active.length,
      mrr: active.length * 349,
      trials_ending_soon: trialsExpiringSoonCount,
      renewals_due: renewalsDueCount,
    },
    renewals_due: renewalsDue,
    expired_this_month: expiredThisMonth,
    trials_ending_soon: trialsEndingSoon,
    all_shops: shops,
  });
}
