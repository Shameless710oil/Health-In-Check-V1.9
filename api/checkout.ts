const TIER_CONFIG: Record<
  string,
  {
    name: string;
    unitAmountCents: number;
    mode: 'payment' | 'subscription';
    priceEnvKey: string;
    linkEnvKey: string;
  }
> = {
  PASS: {
    name: 'Health-In-Check 30-Day Pantry Cleanout Pass (@food.chem.intel)',
    unitAmountCents: 999,
    mode: 'payment',
    priceEnvKey: 'STRIPE_PRICE_PASS',
    linkEnvKey: 'VITE_STRIPE_PASS_URL'
  },
  STANDARD: {
    name: 'Health-In-Check Standard Watchdog Monthly (@food.chem.intel)',
    unitAmountCents: 499,
    mode: 'subscription',
    priceEnvKey: 'STRIPE_PRICE_STANDARD',
    linkEnvKey: 'VITE_STRIPE_STANDARD_URL'
  },
  ULTRA: {
    name: 'Health-In-Check Ultra Health Monthly (@food.chem.intel)',
    unitAmountCents: 1999,
    mode: 'subscription',
    priceEnvKey: 'STRIPE_PRICE_ULTRA',
    linkEnvKey: 'VITE_STRIPE_ULTRA_URL'
  }
};

export default async function handler(req: any, res: any) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (req.method === 'GET') {
    const sessionId = req.query?.session_id;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session_id parameter' });
    }
    if (!stripeSecret) {
      return res.status(503).json({ verified: false, configured: false, error: 'Stripe secret key not configured' });
    }
    try {
      const verifyRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(String(sessionId))}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${stripeSecret}`
        }
      });
      if (!verifyRes.ok) {
        return res.status(400).json({ verified: false, error: 'Unable to verify checkout session' });
      }
      const session = await verifyRes.json();
      return res.status(200).json({
        verified: session.payment_status === 'paid' || session.status === 'complete',
        tier: session.metadata?.tier || null,
        customerEmail: session.customer_details?.email || null
      });
    } catch (err: any) {
      return res.status(500).json({ verified: false, error: err.message || 'Verification failed' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { tier, email, origin } = req.body || {};
  const tierSpec = TIER_CONFIG[String(tier || '').toUpperCase()];
  if (!tierSpec) {
    return res.status(400).json({ error: 'Invalid subscription tier requested' });
  }

  const baseOrigin = String(origin || req.headers?.origin || 'http://localhost:3000').replace(/\/+$/, '');

  // Priority 1: Server-side Stripe Checkout Session via STRIPE_SECRET_KEY
  if (stripeSecret) {
    try {
      const params = new URLSearchParams();
      params.append('mode', tierSpec.mode);
      params.append('success_url', `${baseOrigin}/?checkout=success&tier=${encodeURIComponent(tier)}&session_id={CHECKOUT_SESSION_ID}`);
      params.append('cancel_url', `${baseOrigin}/?checkout=cancelled`);
      params.append('metadata[tier]', String(tier));
      if (email) {
        params.append('customer_email', String(email));
      }

      const explicitPriceId = process.env[tierSpec.priceEnvKey];
      if (explicitPriceId) {
        params.append('line_items[0][price]', explicitPriceId);
        params.append('line_items[0][quantity]', '1');
      } else {
        params.append('line_items[0][price_data][currency]', 'usd');
        params.append('line_items[0][price_data][product_data][name]', tierSpec.name);
        params.append('line_items[0][price_data][unit_amount]', String(tierSpec.unitAmountCents));
        if (tierSpec.mode === 'subscription') {
          params.append('line_items[0][price_data][recurring][interval]', 'month');
        }
        params.append('line_items[0][quantity]', '1');
      }

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await stripeRes.json();
      if (!stripeRes.ok || !data.url) {
        return res.status(502).json({ error: data.error?.message || 'Stripe session creation failed' });
      }
      return res.status(200).json({ url: data.url, sessionId: data.id, mode: 'stripe_session', configured: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Stripe request failed' });
    }
  }

  // Priority 2: Configured Stripe Payment Link URL
  const paymentLink = process.env[tierSpec.linkEnvKey];
  if (paymentLink) {
    const separator = paymentLink.includes('?') ? '&' : '?';
    const fullUrl = email ? `${paymentLink}${separator}prefilled_email=${encodeURIComponent(email)}` : paymentLink;
    return res.status(200).json({ url: fullUrl, mode: 'payment_link', configured: true });
  }

  return res.status(503).json({
    configured: false,
    error: 'Stripe keys not configured on server'
  });
}
