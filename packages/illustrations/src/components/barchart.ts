/**
 * @preplai/illustrations — BarChart Component (minimalist)
 *
 * Clean vertical or horizontal bar chart with thin axes and value labels.
 * Metadata: { bars: [{ label, value, color? }], xLabel?, yLabel?, horizontal?: boolean }
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

interface BarSpec { label: string; value: number; color?: string; }

function parseBars(meta: Record<string, unknown>): BarSpec[] {
  const raw = meta.bars as Array<{ label?: string; value?: number; color?: string }> | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { label: 'Jan', value: 10 },
      { label: 'Feb', value: 25 },
      { label: 'Mar', value: 15 },
      { label: 'Apr', value: 30 },
      { label: 'May', value: 22 },
    ];
  }
  return raw.slice(0, 12).map((b) => ({
    label: String(b?.label ?? '?'),
    value: Number(b?.value) || 0,
    color: b?.color,
  }));
}

export function renderBarChart(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('inline', scale);
  const defaultColor = entity.color ?? getCategoryColor('BarChart');
  const strokeWidth = getStrokeWidth('thin', scale);

  const meta = entity.metadata ?? {};
  const bars = parseBars(meta);
  const horizontal = meta.horizontal === true;

  const padLeft = 36;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 28;
  const chartW = s * 3.2 - padLeft - padRight;
  const chartH = s * 2.2 - padTop - padBottom;

  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const n = bars.length;
  const barGap = 6;

  if (horizontal) {
    const labelW = 40;
    const barAreaW = chartW - labelW - 24;
    const barH = Math.max(12, (chartH - (n - 1) * barGap) / n);

    bars.forEach((bar, i) => {
      const y = -chartH / 2 + padTop + i * (barH + barGap) + barH / 2;
      const barColor = bar.color ?? defaultColor;
      const width = (bar.value / maxVal) * barAreaW;
      const x = -chartW / 2 + padLeft + labelW;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y - barH / 2));
      rect.setAttribute('width', String(Math.max(width, 2)));
      rect.setAttribute('height', String(barH));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(barColor, OPACITY.fillMedium));
      rect.setAttribute('stroke', barColor);
      rect.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(rect);

      const labelText = document.createElementNS(SVG_NS, 'text');
      labelText.setAttribute('x', String(x - 4));
      labelText.setAttribute('y', String(y + 4));
      labelText.setAttribute('text-anchor', 'end');
      labelText.setAttribute('fill', colorWithAlpha(barColor, OPACITY.strokeSoft));
      labelText.setAttribute('font-size', String(labelFontSize));
      labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      labelText.textContent = bar.label;
      innerG.appendChild(labelText);

      const valText = document.createElementNS(SVG_NS, 'text');
      valText.setAttribute('x', String(x + Math.max(width, 2) + 6));
      valText.setAttribute('y', String(y + 4));
      valText.setAttribute('fill', colorWithAlpha(barColor, OPACITY.strokeSoft));
      valText.setAttribute('font-size', String(labelFontSize));
      valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      valText.textContent = String(bar.value);
      innerG.appendChild(valText);
    });
  } else {
    const barW = Math.max(8, (chartW - (n - 1) * barGap) / n);
    const barAreaH = chartH - 16;

    bars.forEach((bar, i) => {
      const x = -chartW / 2 + padLeft + i * (barW + barGap) + barW / 2;
      const barColor = bar.color ?? defaultColor;
      const height = (bar.value / maxVal) * barAreaH;
      const yBase = chartH / 2 - padBottom;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x - barW / 2));
      rect.setAttribute('y', String(yBase - height));
      rect.setAttribute('width', String(barW));
      rect.setAttribute('height', String(Math.max(height, 2)));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(barColor, OPACITY.fillMedium));
      rect.setAttribute('stroke', barColor);
      rect.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(rect);

      const labelText = document.createElementNS(SVG_NS, 'text');
      labelText.setAttribute('x', String(x));
      labelText.setAttribute('y', String(yBase + 14));
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('fill', colorWithAlpha(barColor, OPACITY.strokeSoft));
      labelText.setAttribute('font-size', String(labelFontSize));
      labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      labelText.textContent = bar.label;
      innerG.appendChild(labelText);

      const valText = document.createElementNS(SVG_NS, 'text');
      valText.setAttribute('x', String(x));
      valText.setAttribute('y', String(yBase - height - 4));
      valText.setAttribute('text-anchor', 'middle');
      valText.setAttribute('fill', colorWithAlpha(barColor, OPACITY.strokeSoft));
      valText.setAttribute('font-size', String(labelFontSize));
      valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      valText.textContent = String(bar.value);
      innerG.appendChild(valText);
    });
  }

  // Axis line
  const axisColor = colorWithAlpha(defaultColor, OPACITY.strokeMuted);
  const axisStroke = getStrokeWidth('minimal', scale);
  if (horizontal) {
    const lineY = -chartH / 2 + padTop - 4;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-chartW / 2 + padLeft));
    line.setAttribute('y1', String(lineY));
    line.setAttribute('x2', String(chartW / 2 - padRight));
    line.setAttribute('y2', String(lineY));
    line.setAttribute('stroke', axisColor);
    line.setAttribute('stroke-width', String(axisStroke));
    innerG.appendChild(line);
  } else {
    const lineX = -chartW / 2 + padLeft - 8;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(lineX));
    line.setAttribute('y1', String(-chartH / 2 + padTop));
    line.setAttribute('x2', String(lineX));
    line.setAttribute('y2', String(chartH / 2 - padBottom));
    line.setAttribute('stroke', axisColor);
    line.setAttribute('stroke-width', String(axisStroke));
    innerG.appendChild(line);
  }

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-chartH / 2 - 8));
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
