import { GoogleGenAI } from "@google/genai";

const rateLimitCache = new Map<string, { count: number; startTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

export function normalizeGeminiModel(model?: string): string {
  const m = String(model || '').trim().toLowerCase();
  if (!m) return 'gemini-3-flash-preview';
  if (m === 'gemini-3.8-flash' || m === 'gemini-3.5-flash') return m;
  if (
    m === 'gemini-2.5-flash' ||
    m === 'gemini-2.5-pro' ||
    m === 'gemini-3-pro-preview' ||
    m === 'gemini-3-flash-preview' ||
    m.includes('2.5') ||
    m.includes('pro') ||
    m.includes('flash') ||
    m.startsWith('gemini-3')
  ) {
    return 'gemini-3-flash-preview';
  }
  return model!;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');
  const currentTime = Date.now();

  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, { count: 1, startTime: currentTime });
  } else {
    const rateData = rateLimitCache.get(ip)!;
    if (currentTime - rateData.startTime < RATE_LIMIT_WINDOW_MS) {
      if (rateData.count >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }
      rateData.count += 1;
    } else {
      rateLimitCache.set(ip, { count: 1, startTime: currentTime });
    }
  }

  if (Math.random() < 0.01) {
    for (const [key, data] of rateLimitCache.entries()) {
      if (currentTime - data.startTime > RATE_LIMIT_WINDOW_MS) {
        rateLimitCache.delete(key);
      }
    }
  }

  try {
    const { model, contents, config } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing on the server.");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const normalizedModel = normalizeGeminiModel(model);
    const fallbackChain = Array.from(
      new Set([normalizedModel, 'gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-3.8-flash'])
    );

    let response: any;
    let usedModel = normalizedModel;
    let lastError: any;

    for (const candidateModel of fallbackChain) {
      try {
        response = await ai.models.generateContent({
          model: candidateModel,
          contents,
          config
        });
        usedModel = candidateModel;
        break;
      } catch (candidateErr: any) {
        lastError = candidateErr;
        console.warn(`[api/generate] Model ${candidateModel} failed:`, candidateErr?.message || candidateErr);
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini model candidates failed');
    }

    let text = "";
    if (typeof (response as any).text === 'function') {
      text = (response as any).text();
    } else if (typeof response.text === 'string') {
      text = response.text;
    } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }

    return res.status(200).json({ text, model: usedModel });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
