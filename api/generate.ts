import { GoogleGenAI } from "@google/genai";

// Basic in-memory rate limiting for serverless function (per instance)
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting Logic
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const currentTime = Date.now();

  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, { count: 1, startTime: currentTime });
  } else {
    const rateData = rateLimitCache.get(ip);
    if (currentTime - rateData.startTime < RATE_LIMIT_WINDOW_MS) {
      if (rateData.count >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }
      rateData.count += 1;
    } else {
      // Reset window
      rateLimitCache.set(ip, { count: 1, startTime: currentTime });
    }
  }

  // Cleanup old cache entries periodically (1 in 100 requests to save overhead)
  if (Math.random() < 0.01) {
    for (const [key, data] of rateLimitCache.entries()) {
      if (currentTime - data.startTime > RATE_LIMIT_WINDOW_MS) {
        rateLimitCache.delete(key);
      }
    }
  }

  try {
    const { model, contents, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing on the server.");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Call the Google GenAI API
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: config
    });

    // Send back the response text (or full object if needed)
    // The client expects { text: "..." } structure usually from the SDK,
    // but here we are returning the JSON result directly.
    // Let's inspect what the SDK returns.
    // Usually response.text is a getter function or property on the result object.
    // We will return the full structure needed by the client.

    // The client code uses `response.text` property.
    // The SDK's generateContent returns a GenerateContentResult.
    // The response.text property in SDK might be a getter or a function.
    // The actual text may be in response.text if it's a string, or response.text() if it's a function.

    let text = "";
    if (typeof response.text === 'function') {
      text = response.text();
    } else if (typeof response.text === 'string') {
      text = response.text;
    } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }

    return res.status(200).json({ text });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
