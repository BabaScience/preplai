/**
 * @preplai/illustrations — VennDiagram Component
 *
 * 2 or 3 overlapping circles with set labels.
 * Use for: set theory, intersections, unions, logic diagrams.
 *
 * Metadata: { sets: Array<{label: string, color?: string}> | string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
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

const VENN_COLORS = ['#00bcd4', '#9B59B6', '#00e676'];

interface SetSpec {
  label: string;
  color?: string;
}

function parseSets(meta: Record<string, unknown>, _defaultColor: string): SetSpec[] {
  const raw = meta.sets as SetSpec[] | string[] | undefined;
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [
      { label: 'A', color: VENN_COLORS[0] },
      { label: 'B', color: VENN_COLORS[1] },
    ];
  }
  const n = Math.min(raw.length, 3);
  return raw.slice(0, n).map((s, i) => {
    if (typeof s === 'string') {
      return { label: s, color: VENN_COLORS[i % VENN_COLORS.length] };
    }
    return {
      label: String((s as SetSpec)?.label ?? '?'),
      color: (s as SetSpec)?.color ?? VENN_COLORS[i % VENN_COLORS.length],
    };
  });
}

export function renderVennDiagram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const defaultColor = entity.color ?? getCategoryColor('VennDiagram');
  const strokeWidth = getStrokeWidth('thin', scale);
  const labelFontSize = getLabelFontSize('value', scale);

  const meta = entity.metadata ?? {};
  const sets = parseSets(meta, defaultColor);
  const numSets = sets.length;

  const r = s * 0.55;
  const overlap = 0.35;
  const centerDist = r * (1 - overlap * 0.7);

  if (numSets === 2) {
    const d = r * (1 - overlap);
    const cx1 = -d;
    const cx2 = d;
    const cy = 0;

    sets.forEach((set, i) => {
      const cx = i === 0 ? cx1 : cx2;
      const color = set.color ?? defaultColor;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(cx));
      circle.setAttribute('cy', String(cy));
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(circle);

      const labelX = i === 0 ? cx - r * 0.6 : cx + r * 0.6;
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(labelX));
      text.setAttribute('y', String(cy + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(labelFontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = set.label.length > 4 ? set.label.slice(0, 3) + '…' : set.label;
      innerG.appendChild(text);
    });
  } else {
    const angleOffset = -Math.PI / 2;
    const positions = [0, 1, 2].map((i) => {
      const a = angleOffset + (i * 2 * Math.PI) / 3;
      return {
        x: Math.cos(a) * centerDist,
        y: Math.sin(a) * centerDist,
      };
    });

    sets.forEach((set, i) => {
      const { x: cx, y: cy } = positions[i];
      const color = set.color ?? defaultColor;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(cx));
      circle.setAttribute('cy', String(cy));
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(circle);

      const labelAngle = Math.atan2(cy, cx);
      const labelDist = r * 0.75;
      const lx = Math.cos(labelAngle) * labelDist;
      const ly = Math.sin(labelAngle) * labelDist;
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(lx));
      text.setAttribute('y', String(ly + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(labelFontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = set.label.length > 4 ? set.label.slice(0, 3) + '…' : set.label;
      innerG.appendChild(text);
    });
  }

  if (entity.label) {
    const boundsY = numSets === 2 ? r : r + centerDist;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(boundsY + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', defaultColor);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
