/**
 * @preplai/illustrations — LinkedList Component
 *
 * Clean chain of node boxes with arrow connectors.
 * Use for: linked lists, chains, sequences.
 *
 * Metadata: { values: (string|number)[] }
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
  getLabelFontSize,
  getStrokeWidth,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderLinkedList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('LinkedList');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ll-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const values = ((meta.values as (string | number)[]) ?? [1, 2, 3]).slice(0, 6);

  const nodeW = 28 * scale;
  const nodeH = 20 * scale;
  const gap = 16 * scale;
  const totalW = values.length * nodeW + (values.length - 1) * gap;
  const startX = -totalW / 2 + nodeW / 2;

  // Arrow marker
  const markerId = `arrow-ll-${entity.id.replace(/[^a-z0-9]/gi, '')}`;
  if (!defs.querySelector(`#${markerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '4');
    marker.setAttribute('refX', '5');
    marker.setAttribute('refY', '2');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '0 0, 6 2, 0 4');
    poly.setAttribute('fill', color);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-totalW / 2 - 3));
    glow.setAttribute('y', String(-nodeH / 2 - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(nodeH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  values.forEach((val, i) => {
    const x = startX + i * (nodeW + gap);

    const node = document.createElementNS(SVG_NS, 'rect');
    node.setAttribute('x', String(x - nodeW / 2));
    node.setAttribute('y', String(-nodeH / 2));
    node.setAttribute('width', String(nodeW));
    node.setAttribute('height', String(nodeH));
    node.setAttribute('rx', String(SHAPES.borderRadius));
    node.setAttribute('fill', `url(#${gradId})`);
    node.setAttribute('stroke', color);
    node.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
    innerG.appendChild(node);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', color);
    valueText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valueText.textContent = String(val).slice(0, 6);
    innerG.appendChild(valueText);

    // Arrow to next node
    if (i < values.length - 1) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(x + nodeW / 2));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(x + nodeW / 2 + gap));
      line.setAttribute('y2', '0');
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale)));
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('marker-end', `url(#${markerId})`);
      innerG.appendChild(line);
    }
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(nodeH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
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
