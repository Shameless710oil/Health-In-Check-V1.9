import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateHandler from '../api/generate';
import checkoutHandler from '../api/checkout';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Zero-dependency in-memory rate limiter (100 req / 15 min per IP)
const rateWindows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQ = 100;

app.use('/api', (req, res, next) => {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local');
  const now = Date.now();
  const entry = rateWindows.get(ip);
  if (!entry || now > entry.resetAt) {
    rateWindows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (entry.count >= MAX_REQ) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  entry.count += 1;
  return next();
});

app.post('/api/generate', async (req, res) => {
  try {
    await generateHandler(req, res);
  } catch (error) {
    console.error('Local API Error (/api/generate):', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error in Local API' });
    }
  }
});

app.all('/api/checkout', async (req, res) => {
  try {
    await checkoutHandler(req, res);
  } catch (error) {
    console.error('Local API Error (/api/checkout):', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error in Local Checkout API' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
});
