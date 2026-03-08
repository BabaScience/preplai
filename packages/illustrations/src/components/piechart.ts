/**
 * @preplai/illustrations — PieChart Component
 *
 * Pie or donut chart with SVG arc segments and external labels.
 *
 * Metadata:
 *   slices: Array<{label: string, value: number, color?: string}>
 *   donut?: boolean — inner hole (donut style)
 *   showPercentages?: boolean — show % on labels
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface SliceSpec {
  label: string;
  value: number;
  color?: string;
}

const SLICE_COLORS = ['#00e5ff', '#7c4dff', '#00e676', '#ffab00', '#ff5252', '#e040fb', '#18ffff', '#76ff03'];

function parseSlices(meta: Record<string, unknown>, _defaultColor: string): SliceSpec[] {
  const raw = (meta.slices ?? meta.segments) as SliceSpec[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { label: 'A', value: 30 },
      { label: 'B', value: 25 },
      { label: 'C', value: 20 },
      { label: 'D', value: 15 },
      { label: 'E', value: 10 },
    ];
  }
  return raw.slice(0, 12).map((s, i) => ({
    label: String(s?.label ?? '?'),
    value: Math.max(0, Number(s?.value) || 0),
    color: s?.color ?? SLICE_COLORS[i % SLICE_COLORS.length],
  }));
}

/** Polar to Cartesian, 0° at top, clockwise */
function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function renderPieChart(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('inline', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const defaultColor = entity.color ?? getCategoryColor('PieChart');
  const defs = ensureDefs(parentEl);

  const meta = entity.metadata ?? {};
  const slices = parseSlices(meta, defaultColor);
  const donut = meta.donut === true;
  const showPercentages = meta.showPercentages !== false;

  const total = slices.reduce((sum, sl) => sum + sl.value, 0) || 1;
  const cx = 0;
  const cy = 0;
  const outerR = s * 1.1;
  const innerR = donut ? outerR * 0.5 : 0;
  const labelR = outerR + 14 * scale;

  let startDeg = 0;
  slices.forEach((slice, i) => {
    const angle = (slice.value / total) * 360;
    const endDeg = startDeg + angle;
    if (angle <= 0) {
      startDeg = endDeg;
      return;
    }

    const color = slice.color ?? defaultColor;
    const gradId = `grad-pie-${entity.id.replace(/[^a-z0-9]/gi, '')}-${i}`;
    if (!defs.querySelector(`#${gradId}`)) {
      createLinearGradient(gradId, color, 'vertical', defs);
    }

    const p1 = polar(cx, cy, outerR, startDeg);
    const p2 = polar(cx, cy, outerR, endDeg);
    const largeArc = angle >= 180 ? 1 : 0;

    let d: string;
    if (donut && innerR > 0) {
      const p3 = polar(cx, cy, innerR, endDeg);
      const p4 = polar(cx, cy, innerR, startDeg);
      d = [
        `M ${p1.x} ${p1.y}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
        `L ${p3.x} ${p3.y}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
        'Z',
      ].join(' ');
    } else {
      d = [
        `M ${cx} ${cy}`,
        `L ${p1.x} ${p1.y}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
        'Z',
      ].join(' ');
    }

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', `url(#${gradId})`);
    path.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
    path.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(path);

    const midDeg = startDeg + angle / 2;
    const labelPos = polar(cx, cy, labelR, midDeg);
    const pct = showPercentages ? ` ${Math.round((slice.value / total) * 100)}%` : '';
    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', String(labelPos.x));
    labelText.setAttribute('y', String(labelPos.y + 4));
    labelText.setAttribute('text-anchor', labelPos.x >= cx ? 'start' : 'end');
    labelText.setAttribute('fill', color);
    labelText.setAttribute('font-size', String(labelFontSize));
    labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    labelText.textContent = `${slice.label}${pct}`;
    innerG.appendChild(labelText);

    startDeg = endDeg;
  });

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(outerR + LABEL_DEFAULTS.offsetBelow + 16 * scale));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', defaultColor);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
