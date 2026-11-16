import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runOCRAgent, runAnalysisAgent, TEXT_MODEL, PRO_MODEL } from '../services/geminiService';
import * as recallService from '../services/recallService';
import { normalizeGeminiModel } from '../api/generate';

describe('Task 2: Hybrid Gemini 2.5 Service & Deterministic Fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses gemini-2.5-flash and gemini-2.5-pro and normalizes legacy gemini-3 model IDs', () => {
    expect(TEXT_MODEL).toBe('gemini-2.5-flash');
    expect(PRO_MODEL).toBe('gemini-2.5-pro');
    expect(normalizeGeminiModel('gemini-3-flash-preview')).toBe('gemini-2.5-flash');
    expect(normalizeGeminiModel('gemini-3-pro-preview')).toBe('gemini-2.5-pro');
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

  it('returns offline demo OCR fallback when /api/generate is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));

    const ocr = await runOCRAgent('base64data', 'https://example.com/qr');
    expect(ocr.productName).toBe('Scanned Grocery Item (Offline OCR Demo)');
    expect(ocr.ingredients).toEqual([
      'Enriched Flour (Potassium Bromate)',
      'High Fructose Corn Syrup',
      'Red 40',
      'BHT',
      'Natural Flavors',
      'Citric Acid'
    ]);
    expect(ocr.qrData).toBe('https://example.com/qr');
  });
});
