export const getSystemStatus = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const isBillingLive = process.env.NEXT_PUBLIC_BILLING_MODE === 'live';
  const isGSTLive = process.env.NEXT_PUBLIC_GST_VALIDATION === 'enabled';

  return {
    environment: isProd ? 'production' : 'sandbox',
    billing: isBillingLive ? 'Billing Enforced' : 'Sandbox Mode',
    billingVariant: isBillingLive ? 'green' : 'yellow',
    gst: isGSTLive ? 'GST Validation Live' : 'GST Validation Off',
    gstVariant: isGSTLive ? 'green' : 'yellow',
  } as const;
};
