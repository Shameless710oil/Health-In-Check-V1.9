import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 5: Installable PWA Assets & Sentry-Free Entrypoint', () => {
  const root = path.resolve(__dirname, '..');

  it('provides a valid standalone Web App Manifest in public/manifest.json and links it in index.html', () => {
    const manifestPath = path.join(root, 'public', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.name).toContain('Health-In-Check');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#10b981');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);

    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toContain('rel="manifest"');
  });

  it('ships public/sw.js with shell and OpenFDA caching and removes unconfigured @sentry/react from index.tsx', () => {
    const swPath = path.join(root, 'public', 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);
    const swCode = fs.readFileSync(swPath, 'utf8');
    expect(swCode).toContain('api.fda.gov');
    expect(swCode).toContain('caches.open');

    const indexTsx = fs.readFileSync(path.join(root, 'index.tsx'), 'utf8');
    expect(indexTsx).not.toContain('@sentry/react');
    expect(indexTsx).toContain('serviceWorker');
  });
});
