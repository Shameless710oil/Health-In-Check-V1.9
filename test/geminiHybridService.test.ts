import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runOCRAgent, runAnalysisAgent, TEXT_MODEL, PRO_MODEL } from '../services/geminiService';
import * as recallService from '../services/recallService';
import { normalizeGeminiModel } from '../api/generate';

describe('Task 2: Hybrid Gemini 3 Service, Literal OCR & Anti-Hallucination Guards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses gemini-3-flash-preview and normalizes legacy gemini-2.5/3 model IDs while preserving explicit 3.5/3.8 flash models', () => {
    expect(TEXT_MODEL).toBe('gemini-3-flash-preview');
    expect(PRO_MODEL).toBe('gemini-3-flash-preview');
    expect(normalizeGeminiModel()).toBe('gemini-3-flash-preview');
    expect(normalizeGeminiModel('')).toBe('gemini-3-flash-preview');
    expect(normalizeGeminiModel('gemini-2.5-flash')).toBe('gemini-3-flash-preview');
    expect(normalizeGeminiModel('gemini-2.5-pro')).toBe('gemini-3-flash-preview');
    expect(normalizeGeminiModel('gemini-3-pro-preview')).toBe('gemini-3-flash-preview');
    expect(normalizeGeminiModel('gemini-3-flash-preview')).toBe('gemini-3-flash-preview');
    expect(normalizeGeminiModel('gemini-3.8-flash')).toBe('gemini-3.8-flash');
    expect(normalizeGeminiModel('gemini-3.5-flash')).toBe('gemini-3.5-flash');
  });

  it('injects deterministic KNOWLEDGE_BASE matches into Gemini prompt without simulated recall instructions and preserves citations', async () => {
    vi.spyOn(recallService, 'fetchRealRecalls').mockResolvedValue([]);
    let capturedBody: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, init?: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          text: JSON.stringify({
            product_name: 'Bread Loaf',
            hazards: [{ name: 'Potassium Bromate', risk_level: 'CRITICAL', health_impact: 'Carcinogen', verdict: 'AVOID' }],
            positives: [],
            recalls: [{ reason: 'Hallucinated Recall', date: '2026-01-01', description: 'Fake', source: 'AI' }],
            summary: 'Avoid potassium bromate.',
            overall_score: 42
          })
        })
      };
    }));

    const report = await runAnalysisAgent(['Unbleached Flour', 'Potassium Bromate'], undefined, undefined, 'Bread Loaf');
    expect(capturedBody.contents.text).not.toContain('Recalls must be simulated');
    expect(report.recalls).toEqual([]); // Only real verified OpenFDA recalls are kept
    expect(report.hazards[0].regulatory_status).toContain('EU: BANNED');
    expect(report.hazards[0].citation_url).toContain('iarc.who.int');
  });

  it('returns the complete deterministic report when /api/generate fails with 500 or network error', async () => {
    vi.spyOn(recallService, 'fetchRealRecalls').mockResolvedValue([]);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

    const report = await runAnalysisAgent(['Water', 'Red 40', 'Sodium Nitrite'], undefined, undefined, 'Deli Ham');
    expect(report.product_name).toBe('Deli Ham');
    expect(report.hazards.map(h => h.name.toLowerCase())).toEqual(expect.arrayContaining(['red 40', 'sodium nitrite']));
    expect(report.recalls).toEqual([]);
    expect(report.overall_score).toBeLessThan(80);
  });

  it('bypasses /api/generate when runOCRAgent receives structured JSON ingredients', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const ocr = await runOCRAgent(
      '',
      JSON.stringify({ productName: 'Neon Nacho Cheese Chips', ingredients: ['Yellow 6', 'Red 40', 'TBHQ'] })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(ocr).toEqual({
      productName: 'Neon Nacho Cheese Chips',
      ingredients: ['Yellow 6', 'Red 40', 'TBHQ'],
      qrData: undefined
    });
  });

  it('throws an explicit error and NEVER returns fake demo ingredients when /api/generate fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));

    let thrown: any = null;
    try {
      await runOCRAgent('base64data', 'https://example.com/qr');
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.message).not.toMatch(/Potassium Bromate|Red 40/i);
  });

  it('throws an explicit error and NEVER returns fake ingredients when /api/generate returns HTTP 404/500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Model not found' })
      })
    );

    await expect(runOCRAgent('base64data', null)).rejects.toThrow(/Model not found/i);
  });

  it('throws an explicit readable error when OCR returns an empty or blank ingredients list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          text: JSON.stringify({
            productName: 'Mystery Front Label',
            ingredients: ['   ', '']
          })
        })
      })
    );

    await expect(runOCRAgent('base64data', null)).rejects.toThrow(
      /No readable 'Ingredients:' list was found in this photo/i
    );
  });

  it('locks ingredients_detected to OCR-extracted ingredients and strips AI-hallucinated hazards not present in extracted ingredients', async () => {
    vi.spyOn(recallService, 'fetchRealRecalls').mockResolvedValue([]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          text: JSON.stringify({
            product_name: 'Simple Oats',
            ingredients_detected: ['Rolled Oats', 'Potassium Bromate', 'Red 40'],
            hazards: [
              { name: 'Potassium Bromate', risk_level: 'CRITICAL', health_impact: 'Hallucinated', verdict: 'AVOID' },
              { name: 'Red 40', risk_level: 'HIGH', health_impact: 'Hallucinated', verdict: 'AVOID' },
              { name: 'Carrageenan', risk_level: 'MODERATE', health_impact: 'Gut irritant', verdict: 'CAUTION' }
            ],
            positives: [{ name: 'Whole Grain Fiber', benefit: 'Supports lipid clearance.' }],
            recalls: [],
            summary: 'Clean oats with carrageenan.',
            overall_score: 88
          })
        })
      })
    );

    const report = await runAnalysisAgent(['Organic Rolled Oats', 'Carrageenan', 'Sea Salt'], undefined, undefined, 'Simple Oats');

    expect(report.ingredients_detected).toEqual(['Organic Rolled Oats', 'Carrageenan', 'Sea Salt']);
    expect(report.ingredients_detected).not.toContain('Potassium Bromate');
    expect(report.ingredients_detected).not.toContain('Red 40');
    expect(report.hazards.map(h => h.name)).toEqual(['Carrageenan']);
  });
});
