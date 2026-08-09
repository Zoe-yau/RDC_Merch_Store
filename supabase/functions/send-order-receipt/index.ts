// Sends the order confirmation email via Brevo's transactional email API.
// Runs server-side so the Brevo API key never reaches the browser bundle.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  buyerName: string;
  email: string;
  items: string;
  total: string;
  orderId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { buyerName, email, items, total, orderId } = (await req.json()) as RequestBody;
    if (!email || !buyerName) {
      return new Response(JSON.stringify({ error: 'Missing buyerName or email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('BREVO_API_KEY');
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL');
    const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Rho Delta Chi';
    const templateId = Deno.env.get('BREVO_TEMPLATE_ID');
    if (!apiKey || !senderEmail || !templateId) {
      throw new Error('BREVO_API_KEY / BREVO_SENDER_EMAIL / BREVO_TEMPLATE_ID secrets are not set');
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email, name: buyerName }],
        templateId: Number(templateId),
        params: {
          BUYER_NAME: buyerName,
          ITEMS: items,
          TOTAL: total,
          ORDER_ID: orderId.slice(0, 8).toUpperCase(),
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Brevo API error ${res.status}: ${body}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-order-receipt failed:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});