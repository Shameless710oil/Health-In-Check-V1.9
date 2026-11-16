import { AnalysisReport } from '../types';

function slugify(input: string): string {
  return (
    String(input || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'product'
  );
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const b64 = parts.length > 1 ? parts[1] : '';
  if (!b64) return new Uint8Array(0);
  const binStr = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

export function renderShareCardDataUrl(report: AnalysisReport, doc: Document = document): string {
  const canvas = doc.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return 'data:image/png;base64,';
  }

  // 1. Background gradient (9:16 vertical Story format)
  const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, '#020617');
  bg.addColorStop(0.5, '#0f172a');
  bg.addColorStop(1, '#064e3b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Top @food.chem.intel Brand Header
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 34px Inter, system-ui, sans-serif';
  ctx.fillText('@FOOD.CHEM.INTEL // HEALTH-IN-CHECK WATCHDOG', 80, 130);

  // 3. Product Name
  const productName = (report.product_name || 'SCANNED FOOD PRODUCT').toUpperCase();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 58px Inter, system-ui, sans-serif';
  ctx.fillText(productName.slice(0, 28), 80, 230);

  // 4. Score Badge
  const score = typeof report.overall_score === 'number' ? report.overall_score : 50;
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const verdictLabel =
    score >= 80 ? 'CLEAN LABEL INTEGRITY' : score >= 50 ? 'MODERATE CHEMICAL CAUTION' : 'HIGH TOXICOLOGY ALERT';

  ctx.fillStyle = scoreColor;
  ctx.fillRect(80, 300, 920, 280);

  ctx.fillStyle = '#020617';
  ctx.font = '900 150px Inter, system-ui, sans-serif';
  ctx.fillText(`${score}/100`, 130, 485);

  ctx.font = 'bold 34px Inter, system-ui, sans-serif';
  ctx.fillText(verdictLabel, 130, 545);

  // 5. Flagged Additives & Regulatory Status (up to 4 items)
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 30px Inter, system-ui, sans-serif';
  ctx.fillText('FLAGGED ADDITIVES & GLOBAL REGULATORY STATUS', 80, 670);

  const topHazards = (report.hazards || []).slice(0, 4);
  if (topHazards.length === 0) {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(80, 710, 920, 160);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 40px Inter, system-ui, sans-serif';
    ctx.fillText('ZERO SYNTHETIC HAZARDS DETECTED', 120, 805);
  } else {
    topHazards.forEach((h, idx) => {
      const y = 710 + idx * 210;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(80, y, 920, 185);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 42px Inter, system-ui, sans-serif';
      ctx.fillText(`${h.name.toUpperCase()} [${h.risk_level}]`, 115, y + 68);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 28px Inter, system-ui, sans-serif';
      const regStatus = h.regulatory_status || h.verdict || '';
      ctx.fillText(regStatus.slice(0, 58), 115, y + 125);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 24px Inter, system-ui, sans-serif';
      ctx.fillText((h.verdict || '').slice(0, 68), 115, y + 165);
    });
  }

  // 6. Recall Status Strip
  const hasRecalls = Array.isArray(report.recalls) && report.recalls.length > 0;
  ctx.fillStyle = hasRecalls ? '#7f1d1d' : '#064e3b';
  ctx.fillRect(80, 1590, 920, 110);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Inter, system-ui, sans-serif';
  ctx.fillText(
    hasRecalls ? `ALERT: ${report.recalls.length} ACTIVE FDA RECALL MATCH(ES)` : 'FDA RECALL REGISTRY: CLEAR',
    120,
    1658
  );

  // 7. Viral CTA Footer
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 32px Inter, system-ui, sans-serif';
  ctx.fillText('SCAN YOUR PANTRY FREE • LINK IN @FOOD.CHEM.INTEL BIO', 80, 1810);

  return canvas.toDataURL('image/png');
}

export async function shareOrDownloadReportCard(
  report: AnalysisReport,
  env?: { nav?: any; doc?: Document }
): Promise<{ method: 'web_share' | 'download'; dataUrl: string }> {
  const doc = env?.doc || document;
  const nav = env?.nav || (typeof navigator !== 'undefined' ? navigator : {});
  const dataUrl = renderShareCardDataUrl(report, doc);
  const fileName = `food-chem-intel-${slugify(report.product_name || 'report')}.png`;

  if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && typeof File === 'function') {
    try {
      const bytes = dataUrlToUint8Array(dataUrl);
      const file = new File([bytes], fileName, { type: 'image/png' });
      if (nav.canShare({ files: [file] })) {
        await nav.share({
          title: `${report.product_name || 'Food'} Audit — @food.chem.intel`,
          text: `Scored ${report.overall_score}/100 on Health-In-Check (@food.chem.intel).`,
          files: [file]
        });
        return { method: 'web_share', dataUrl };
      }
    } catch (_) {
      // Fall back to direct PNG download
    }
  }

  const link = doc.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();

  return { method: 'download', dataUrl };
}
