export const EVENT_CONFIG: Record<string, {
  emoji: string;
  label: (meta: Record<string, any>, bizName: string, city: string) => string;
  color: string;
}> = {
  INVOICE_CREATED: {
    emoji: '⚡',
    label: (m, biz, city) =>
      `${biz} generated ${m.invoice_no} (₹${Number(m.amount || 0).toLocaleString('en-IN')}) — ${city || 'Unknown'}`,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  STOCK_ADDED: {
    emoji: '📦',
    label: (m, biz, city) =>
      `${biz} added ${m.units_added} units of ${m.product_name} — ${city || 'Unknown'}`,
    color: 'text-green-700 bg-green-50 border-green-200',
  },
  NEW_SIGNUP: {
    emoji: '🎉',
    label: (m, biz, city) =>
      `${biz} joined TruBill on free trial — ${city || 'Unknown'}`,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  PAYMENT_RECEIVED: {
    emoji: '💰',
    label: (m, biz, city) =>
      `${biz} upgraded to paid plan — ${city || 'Unknown'}`,
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  },
  MSP_OVERRIDE: {
    emoji: '⚠️',
    label: (m, biz, city) =>
      `${biz} — manager override on ${m.product_name} (₹${m.override_price}) — ${city || 'Unknown'}`,
    color: 'text-orange-700 bg-orange-50 border-orange-200',
  },
};
