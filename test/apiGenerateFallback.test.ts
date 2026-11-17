import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: generateContentMock
      };
    }
  };
});

import handler from '../api/generate';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

describe('api/generate model fallback chain', () => {
  const origApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.GEMINI_API_KEY = origApiKey;
  });

  it('retries fallback models when primary model returns 404 or 503 and returns the succeeding model', async () => {
    generateContentMock
      .mockRejectedValueOnce(new Error('404 models/gemini-3-flash-preview not found'))
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce({ text: '{"ok":true}' });

    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1' },
      body: { model: 'gemini-2.5-flash', contents: { text: 'hello' } }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(generateContentMock.mock.calls.map(c => c[0].model)).toEqual([
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
      'gemini-3.5-flash'
    ]);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ text: '{"ok":true}', model: 'gemini-3.5-flash' });
  });

  it('deduplicates candidate models when an explicit fallback model is requested first', async () => {
    generateContentMock
      .mockRejectedValueOnce(new Error('503 high demand'))
      .mockResolvedValueOnce({ text: 'ok' });

    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.2' },
      body: { model: 'gemini-3.5-flash', contents: { text: 'hello' } }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(generateContentMock.mock.calls.map(c => c[0].model)).toEqual([
      'gemini-3.5-flash',
      'gemini-3-flash-preview'
    ]);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ text: 'ok', model: 'gemini-3-flash-preview' });
  });

  it('times out a hanging model candidate and falls back to the next model', async () => {
    vi.useFakeTimers();
    generateContentMock
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce({ text: 'recovered' });

    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.3' },
      body: { model: 'gemini-3-flash-preview', contents: { text: 'hello' } }
    };
    const res = createMockRes();

    const handlerPromise = handler(req, res);
    await vi.advanceTimersByTimeAsync(12000);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(23000);
    await handlerPromise;

    expect(generateContentMock.mock.calls.map(c => c[0].model)).toEqual([
      'gemini-3-flash-preview',
      'gemini-3.8-flash'
    ]);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ text: 'recovered', model: 'gemini-3.8-flash' });
  });
});
