// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { TelemetryProvider } from '../telemetry/TelemetryProvider';
import { shareOrDownloadReportCard } from '../services/shareCardService';
import { AnalysisReport } from '../types';

describe('Task 4: Instant Guest Mode & Viral @food.chem.intel Story Card', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('fci_legal_accepted', 'true');
    sessionStorage.setItem('fci_beta_welcome', 'true');
    vi.restoreAllMocks();
  });

  it('boots directly into Guest Scanner mode without SetupGuide or AuthView walls even when Supabase env vars are unset', async () => {
    render(
      <TelemetryProvider>
        <App />
      </TelemetryProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/INITIATE SCAN/i)).toBeTruthy();
    });
    expect(screen.queryByText(/System Offline/i)).toBeNull();
  });

  it('renders a 1080x1920 @food.chem.intel Story Card and falls back to PNG download when navigator.canShare is unavailable', async () => {
    const sampleReport: AnalysisReport = {
      product_name: 'Neon Fruit Loops',
      ingredients_detected: ['Sugar', 'Red 40', 'BHT'],
      hazards: [
        {
          name: 'Red 40',
          risk_level: 'MODERATE',
          function: 'Synthetic Dye',
          health_impact: 'Hyperactivity link',
          regulatory_status: '🇺🇸 USA: Legal | 🇪🇺 EU: Warning Label Required',
          verdict: 'CAUTION',
          citation_source: 'CSPI',
          citation_url: 'https://pubmed.ncbi.nlm.nih.gov/23026007/'
        }
      ],
      positives: [],
      blockers: [],
      substitutions: [],
      recalls: [],
      exercise_tip: 'Walk 10 mins',
      summary: 'Contains synthetic dye Red 40.',
      overall_score: 54
    };

    const clickedAnchors: { download: string; href: string }[] = [];
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const c = origCreateElement('canvas') as HTMLCanvasElement;
        c.getContext = (() => ({
          createLinearGradient: () => ({ addColorStop: () => {} }),
          fillRect: () => {},
          strokeRect: () => {},
          fillText: () => {},
          beginPath: () => {},
          arc: () => {},
          fill: () => {},
          stroke: () => {},
          roundRect: () => {}
        })) as any;
        c.toDataURL = () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        return c;
      }
      if (tag === 'a') {
        const a = origCreateElement('a') as HTMLAnchorElement;
        a.click = () => {
          clickedAnchors.push({ download: a.download, href: a.href });
        };
        return a;
      }
      return origCreateElement(tag);
    });

    const res = await shareOrDownloadReportCard(sampleReport, { nav: {} });
    expect(res.method).toBe('download');
    expect(res.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(clickedAnchors).toHaveLength(1);
    expect(clickedAnchors[0].download).toContain('food-chem-intel-neon-fruit-loops.png');
  });
});
