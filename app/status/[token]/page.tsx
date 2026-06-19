import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getInvoiceData(token: string) {
  if (!token) return null;

  const supabaseAdmin = createAdminClient();

  // Query invoice and joined shop details
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      shop:shops (
        id,
        name,
        address,
        phone,
        logo_url,
        gst_registered,
        gstin
      )
    `)
    .eq('public_token', token)
    .single();

  if (error || !invoice) {
    return null;
  }

  // Hide draft and failed status
  if (invoice.status === 'draft' || invoice.status === 'failed') {
    return null;
  }

  // Fetch invoice items
  const { data: items } = await supabaseAdmin
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoice.id);

  return {
    invoice,
    shop: invoice.shop,
    items: items || []
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getInvoiceData(token);

  if (!data) {
    return {
      title: 'Invoice Not Found',
    };
  }

  const { invoice, shop } = data;
  const amount = Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const statusStr = invoice.payment_status?.toUpperCase() || 'UNPAID';

  return {
    title: `${invoice.invoice_number} from ${shop.name} — TruBill`,
    openGraph: {
      title: `Invoice ${invoice.invoice_number} from ${shop.name}`,
      description: `Total: ₹${amount} · Status: ${statusStr}`,
      type: 'website',
    },
  };
}

export default async function PublicStatusPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getInvoiceData(token);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Invoice Not Found</h1>
        <p className="text-xs text-gray-500 max-w-xs">
          The link is invalid, expired, or the invoice does not exist.
        </p>
      </div>
    );
  }

  const { invoice, shop, items } = data;
  const balanceDue = Number(invoice.total) - Number(invoice.amount_paid || 0);
  const isPaid = invoice.payment_status === 'paid';
  const isPartial = invoice.payment_status === 'partial';

  const dateString = new Date(invoice.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#f5f6fa] pb-12 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-8">
        {/* Header Block */}
        <div className="bg-white border border-[#e5e7eb] p-6 mb-4 shadow-sm text-center">
          {shop.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={shop.logo_url} 
              alt="Shop Logo" 
              className="max-h-[60px] object-contain mx-auto mb-3"
            />
          )}
          <h1 className="text-xl font-black text-gray-900 uppercase font-heading tracking-tight">
            {shop.name}
          </h1>
          {shop.phone && (
            <p className="text-[11px] text-gray-500 font-semibold mt-1">
              Contact: +91 {shop.phone}
            </p>
          )}
          {shop.address && (
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {shop.address}
            </p>
          )}
          <div className="inline-block mt-4 px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
            Tax Invoice
          </div>
        </div>

        {/* Payment Status Banner */}
        {isPaid ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 mb-4 text-center">
            <span className="text-sm font-extrabold uppercase tracking-wide block">
              ✅ Fully Paid
            </span>
            <span className="text-[11px] font-semibold mt-1 block">
              Thank you for your payment!
            </span>
          </div>
        ) : isPartial ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 mb-4 text-center">
            <span className="text-sm font-extrabold uppercase tracking-wide block">
              🔄 Partially Paid
            </span>
            <span className="text-[11px] font-semibold mt-1 block">
              Paid: ₹{Number(invoice.amount_paid).toLocaleString('en-IN')} | Balance: ₹{balanceDue.toLocaleString('en-IN')}
            </span>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 mb-4 text-center">
            <span className="text-sm font-extrabold uppercase tracking-wide block">
              ⏳ Payment Pending
            </span>
            <span className="text-[11px] font-bold mt-1 block">
              Balance Due: ₹{balanceDue.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Invoice Info */}
        <div className="bg-white border border-[#e5e7eb] p-6 mb-4 shadow-sm space-y-3">
          <div className="flex justify-between border-b border-[#f3f4f6] pb-3 text-xs">
            <div>
              <span className="text-gray-450 font-bold uppercase text-[9px] block">Invoice Number</span>
              <span className="font-extrabold text-gray-900">{invoice.invoice_number}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-450 font-bold uppercase text-[9px] block">Date Issued</span>
              <span className="font-bold text-gray-800">{dateString}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {items.map((item) => (
                  <tr key={item.id} className="text-gray-850 font-semibold">
                    <td className="py-3">
                      <span className="block font-bold text-gray-900">{item.name}</span>
                      {item.hsn_code && (
                        <span className="text-[9px] text-gray-400 font-medium">HSN: {item.hsn_code}</span>
                      )}
                    </td>
                    <td className="py-3 text-center text-gray-700">{item.qty}</td>
                    <td className="py-3 text-right text-gray-700">₹{Number(item.price).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-gray-950">₹{Number(item.line_total).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="border-t border-[#e5e7eb] pt-4 space-y-2 text-xs font-semibold text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-gray-900">₹{Number(invoice.subtotal || invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {shop.gst_registered && Number(invoice.total_gst || 0) > 0 && (
              <>
                <div className="flex justify-between text-[11px]">
                  <span>CGST</span>
                  <span>₹{Number(invoice.total_cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>SGST</span>
                  <span>₹{Number(invoice.total_sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-[#f3f4f6] pb-2">
                  <span>Total GST</span>
                  <span>₹{Number(invoice.total_gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm font-black text-gray-900 pt-1">
              <span>Total Amount</span>
              <span>₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-2 mt-6">
          <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">
            Powered by TruBill Invoice
          </p>
          <p className="text-[9px] text-gray-450 italic max-w-xs mx-auto">
            This is a read-only invoice status page. Contact {shop.name} for queries.
          </p>
        </div>
      </div>
    </div>
  );
}
