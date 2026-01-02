import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
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
    // We need to verify if we can serialize it directly.

    // To be safe and generic, we return the serializable part.
    // However, the SDK response object might be complex.
    // Let's see what the client expects.
    // Client does: `const result = JSON.parse(response.text || "{}");`
    // effectively `response.text()` getter in the SDK returns the string.

    const text = response.text(); // Get the text from the response
    return res.status(200).json({ text });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
