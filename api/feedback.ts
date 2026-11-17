import crypto from 'node:crypto';

const VALID_TYPES = new Set(['BUG', 'FEATURE', 'OTHER']);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, message } = req.body || {};
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedMessage) {
    return res.status(400).json({ error: 'Feedback message is required.' });
  }

  const normalizedType = VALID_TYPES.has(type) ? type : 'OTHER';
  const id = crypto.randomUUID ? crypto.randomUUID() : `fb-${Date.now()}`;

  console.info('[BETA_FEEDBACK]', JSON.stringify({
    id,
    type: normalizedType,
    message: trimmedMessage,
    createdAt: new Date().toISOString()
  }));

  return res.status(200).json({ ok: true, id });
}
