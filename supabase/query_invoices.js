const supabaseUrl = 'https://atcdcbcybgturgswfjjo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Y2RjYmN5Ymd0dXJnc3dmampvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQxNjk1NSwiZXhwIjoyMDk2OTkyOTU1fQ.NQ4EKU7FQTsaGJ-fgfNftNHMOiJnvUode26cuLlH3Dg';

async function run() {
  const custRes = await fetch(`${supabaseUrl}/rest/v1/customers?name=ilike.*Shankar*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const customers = await custRes.json();
  console.log("CUSTOMERS:", customers);
  if (customers.length === 0) return;

  const phone = customers[0].phone;

  const invRes = await fetch(`${supabaseUrl}/rest/v1/invoices?customer_phone=eq.${phone}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const invoices = await invRes.json();
  console.log("INVOICES:");
  invoices.forEach(inv => {
    console.log({
      id: inv.id,
      invoice_number: inv.invoice_number,
      status: inv.status,
      payment_status: inv.payment_status,
      total: inv.total,
      amount_paid: inv.amount_paid,
      uses_payments_table: inv.uses_payments_table
    });
  });

  const invoiceIds = invoices.map(i => i.id);
  if (invoiceIds.length > 0) {
    const payRes = await fetch(`${supabaseUrl}/rest/v1/payments?invoice_id=in.(${invoiceIds.join(',')})`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const payments = await payRes.json();
    console.log("PAYMENTS:", payments);
  }
}

run();
