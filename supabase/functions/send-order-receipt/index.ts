// Supabase Edge Function: send-order-receipt
//
// Triggered by a database webhook on `orders` INSERT (see supabase/SETUP.md
// for how to wire that up). Sends the buyer a plain confirmation email via
// Resend. Not payment confirmation — just "we received your order."
//
// Required secrets (set with `supabase secrets set`):
//   RESEND_API_KEY   - Resend API key
//   RECEIPT_FROM     - verified "from" address, e.g. "Rho Delta Chi Shop <shop@yourdomain.com>"
//   WEBHOOK_SECRET   - shared secret; must match the header the webhook sends

interface OrderItem {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

interface OrderRecord {
  id: string;
  buyer_name: string;
  email: string;
  items: OrderItem[];
  total: number;
  created_at: string;
}

interface WebhookPayload {
  type: string;
  table: string;
  record: OrderRecord;
}

function renderReceiptHtml(order: OrderRecord): string {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;">${item.productName} (${item.size}, ${item.color}) x${item.quantity}</td>
          <td style="padding:6px 0; text-align:right;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `
    <div style="font-family:sans-serif; max-width:480px; margin:0 auto;">
      <h2>Thanks for your order, ${order.buyer_name}!</h2>
      <p>We've received your order and payment screenshot. Here's a summary:</p>
      <table style="width:100%; border-collapse:collapse;">
        ${rows}
        <tr>
          <td style="padding:10px 0; border-top:1px solid #ddd; font-weight:bold;">Total</td>
          <td style="padding:10px 0; border-top:1px solid #ddd; text-align:right; font-weight:bold;">
            $${order.total.toFixed(2)}
          </td>
        </tr>
      </table>
      <p style="color:#666; font-size:13px;">
        Order ID: ${order.id}<br/>
        This confirms we received your submission — your payment screenshot will be
        reviewed by the exec board before your order is fulfilled.
      </p>
    </div>`;
}

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  if (webhookSecret && req.headers.get('x-webhook-secret') !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  if (payload.table !== 'orders' || payload.type !== 'INSERT') {
    return new Response('Ignored', { status: 200 });
  }

  const order = payload.record;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RECEIPT_FROM');
  if (!resendApiKey || !from) {
    console.error('Missing RESEND_API_KEY or RECEIPT_FROM secret');
    return new Response('Server misconfigured', { status: 500 });
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: order.email,
      reply_to: Deno.env.get('RECEIPT_REPLY_TO') || undefined,
      subject: 'Your Rho Delta Chi merch order is in!',
      html: renderReceiptHtml(order),
    }),
  });

  if (!emailRes.ok) {
    console.error('Resend error', await emailRes.text());
    return new Response('Failed to send email', { status: 502 });
  }

  return new Response('OK', { status: 200 });
});
