/**
 * @preplai/illustrations — Histogram Component (minimalist)
 *
 * Clean vertical bars for distribution bins. No gradients.
 * Metadata: { bins: [{ label, count }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  getLabelFontSize,
  getStrokeWidth,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface BinSpec { label: string; count: number; }

function parseBins(meta: Record<string, unknown>): BinSpec[] {
  const raw = meta.bins as Array<{ label?: string; count?: number; value?: number }> | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { label: '0-10', count: 5 },
      { label: '10-20', count: 12 },
      { label: '20-30', count: 8 },
      { label: '30-40', count: 15 },
      { label: '40-50', count: 6 },
    ];
  }
  return raw.slice(0, 12).map((b) => ({
    label: String(b?.label ?? '?'),
    count: Number(b?.count ?? b?.value ?? 0),
  }));
}

export function renderHistogram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('inline', scale);
  const defaultColor = entity.color ?? getCategoryColor('Histogram');
  const strokeWidth = getStrokeWidth('thin', scale);

  const meta = entity.metadata ?? {};
  const bins = parseBins(meta);

  const padLeft = 32;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 24;
  const chartW = s * 3 - padLeft - padRight;
  const chartH = s * 2 - padTop - padBottom;

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const n = bins.length;
  const barGap = 4;
  const barW = Math.max(6, (chartW - (n - 1) * barGap) / n);
  const barAreaH = chartH - 14;

  bins.forEach((bin, i) => {
    const x = -chartW / 2 + padLeft + i * (barW + barGap) + barW / 2;
    const height = (bin.count / maxCount) * barAreaH;
    const yBase = chartH / 2 - padBottom;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - barW / 2));
    rect.setAttribute('y', String(yBase - height));
    rect.setAttribute('width', String(barW));
    rect.setAttribute('height', String(Math.max(height, 2)));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(defaultColor, OPACITY.fillMedium));
    rect.setAttribute('stroke', defaultColor);
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', String(x));
    labelText.setAttribute('y', String(yBase + 12));
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('fill', colorWithAlpha(defaultColor, OPACITY.strokeSoft));
    labelText.setAttribute('font-size', String(labelFontSize));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    labelText.textContent = bin.label.length > 8 ? bin.label.slice(0, 6) + '\u2026' : bin.label;
    innerG.appendChild(labelText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(x));
    valText.setAttribute('y', String(yBase - height - 3));
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('fill', colorWithAlpha(defaultColor, OPACITY.strokeSoft));
    valText.setAttribute('font-size', String(labelFontSize * 0.9));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.textContent = String(bin.count);
    innerG.appendChild(valText);
  });

  // Axis line
  const axisColor = colorWithAlpha(defaultColor, OPACITY.strokeMuted);
  const axisStroke = getStrokeWidth('minimal', scale);
  const lineX = -chartW / 2 + padLeft - 6;
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(lineX));
  line.setAttribute('y1', String(-chartH / 2 + padTop));
  line.setAttribute('x2', String(lineX));
  line.setAttribute('y2', String(chartH / 2 - padBottom));
  line.setAttribute('stroke', axisColor);
  line.setAttribute('stroke-width', String(axisStroke));
  innerG.appendChild(line);

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-chartH / 2 - 6));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', defaultColor);
    title.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
