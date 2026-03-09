/**
 * @preplai/illustrations — Cache Component
 * Blue cylinder with prominent lightning bolt + dashed stripes (volatile/fast storage)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import { ensureDefs } from '../visual-utils.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCache(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Cache');
  const gradId = `grad-cache-${color.replace(/[^a-fA-F0-9]/g, '')}`;

  renderCylinderBase(innerG, parentEl, {
    size,
    color,
    gradId,
    stripeOffsets: [],   // no solid stripes — dashed lines instead
    glass: true,
  });

  // ── Dashed horizontal lines (suggests transient/volatile data) ──
  const rx = size / 2;
  const bodyH = size * 0.55;
  const topY = -size / 3;
  const stripeWidth = rx * 0.85;
  for (const t of [0.3, 0.65]) {
    const sy = topY + bodyH * t;
    const stripe = document.createElementNS(SVG_NS, 'line');
    stripe.setAttribute('x1', String(-stripeWidth));
    stripe.setAttribute('y1', String(sy));
    stripe.setAttribute('x2', String(stripeWidth));
    stripe.setAttribute('y2', String(sy));
    stripe.setAttribute('stroke', color);
    stripe.setAttribute('stroke-width', '1.5');
    stripe.setAttribute('opacity', '0.5');
    stripe.setAttribute('stroke-dasharray', '4,3');
    innerG.appendChild(stripe);
  }

  // ── Lightning bolt glow (subtle blur behind bolt) ──
  const boltScale = rx * 0.5;
  const boltD = [
    `M 0 ${-boltScale}`,
    `L ${boltScale * 0.5} 0`,
    `L ${-boltScale * 0.3} ${boltScale * 0.3}`,
    `L ${boltScale * 0.2} ${boltScale}`,
    `L ${-boltScale * 0.5} ${boltScale * 0.2}`,
    `L 0 0`,
    'Z',
  ].join(' ');

  const defs = ensureDefs(parentEl);
  const filterId = `bolt-glow-${entity.id.replace(/[^a-zA-Z0-9-]/g, '')}`;
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', filterId);
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');
  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '2');
  filter.appendChild(blur);
  defs.appendChild(filter);

  const boltGlow = document.createElementNS(SVG_NS, 'path');
  boltGlow.setAttribute('d', boltD);
  boltGlow.setAttribute('fill', color);
  boltGlow.setAttribute('opacity', '0.4');
  boltGlow.setAttribute('filter', `url(#${filterId})`);
  innerG.appendChild(boltGlow);

  // ── Lightning bolt (prominent) ──
  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d', boltD);
  bolt.setAttribute('fill', color);
  bolt.setAttribute('opacity', '1');
  innerG.appendChild(bolt);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
