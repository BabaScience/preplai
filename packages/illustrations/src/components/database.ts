/**
 * @preplai/illustrations — Database Component
 * Emerald cylinder with dot grid (structured data) + grounded base highlight
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE } from '../design-tokens.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDatabase(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Database');
  const gradId = `grad-db-${color.replace(/[^a-fA-F0-9]/g, '')}`;

  renderCylinderBase(innerG, parentEl, {
    size,
    color,
    gradId,
    stripeOffsets: [],   // no stripes — dot grid instead
    glass: true,
  });

  // ── 3×3 dot grid inside cylinder body (structured/tabular data) ──
  const rx = size / 2;
  const bodyH = size * 0.55;
  const topY = -size / 3;
  const cols = [-rx * 0.45, 0, rx * 0.45];
  const rows = [topY + bodyH * 0.25, topY + bodyH * 0.5, topY + bodyH * 0.75];
  for (const dy of rows) {
    for (const dx of cols) {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(dx));
      dot.setAttribute('cy', String(dy));
      dot.setAttribute('r', '2');
      dot.setAttribute('fill', color);
      dot.setAttribute('opacity', '0.5');
      innerG.appendChild(dot);
    }
  }

  // ── Grounded base highlight (thicker bottom ellipse) ──
  const ry = size / 6;
  const botY = topY + bodyH;
  const baseHighlight = document.createElementNS(SVG_NS, 'ellipse');
  baseHighlight.setAttribute('cx', '0');
  baseHighlight.setAttribute('cy', String(botY));
  baseHighlight.setAttribute('rx', String(rx));
  baseHighlight.setAttribute('ry', String(ry));
  baseHighlight.setAttribute('fill', 'none');
  baseHighlight.setAttribute('stroke', color);
  baseHighlight.setAttribute('stroke-width', String(STROKE.emphasized));
  baseHighlight.setAttribute('opacity', '0.3');
  innerG.appendChild(baseHighlight);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
