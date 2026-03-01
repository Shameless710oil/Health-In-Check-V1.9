import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import generateHandler from '../api/generate';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per \`window\` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the \`RateLimit-*\` headers
  legacyHeaders: false, // Disable the \`X-RateLimit-*\` headers
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all /api routes
app.use('/api', limiter);

// Mimic Vercel's API route handling
app.post('/api/generate', async (req, res) => {
  try {
    // Vercel handlers are (req, res) => void | Promise<void>
    // We pass the express req/res objects directly as they are compatible enough
    await generateHandler(req, res);
  } catch (error) {
    console.error('Local API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error in Local API' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
});
