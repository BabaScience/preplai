/**
 * @preplai/illustrations — DataWarehouse Component
 * Tall, layered cylinder with horizontal ruled lines and grid icon
 * representing structured analytical storage.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE } from '../design-tokens.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDataWarehouse(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('DataWarehouse');
  const meta = (entity.metadata ?? {}) as { provider?: string };
  const gradId = `grad-dwh-${color.replace(/[^a-fA-F0-9]/g, '')}`;

  // Slightly wider than Database (~90px vs 80px base at size=50)
  const rx = size * 0.9;
  const bodyH = size * 0.65;

  renderCylinderBase(innerG, parentEl, {
    size,
    color,
    gradId,
    stripeOffsets: [],
    rx,
    bodyH,
    glass: true,
  });

  const topY = -size / 3;

  // ── 3 horizontal ruled lines (structured layers/tables) ──
  const lineWidth = rx * 0.85;
  const linePositions = [0.25, 0.5, 0.75];
  for (const t of linePositions) {
    const ly = topY + bodyH * t;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-lineWidth));
    line.setAttribute('y1', String(ly));
    line.setAttribute('x2', String(lineWidth));
    line.setAttribute('y2', String(ly));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.thin));
    line.setAttribute('opacity', '0.4');
    innerG.appendChild(line);
  }

  // ── Small grid/table icon at center (4 columns x 3 rows of dots) ──
  const gridCenterY = topY + bodyH * 0.5;
  const gridCols = 4;
  const gridRows = 3;
  const gridSpacingX = rx * 0.2;
  const gridSpacingY = bodyH * 0.08;
  const gridStartX = -(gridCols - 1) * gridSpacingX / 2;
  const gridStartY = gridCenterY - (gridRows - 1) * gridSpacingY / 2;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(gridStartX + col * gridSpacingX));
      dot.setAttribute('cy', String(gridStartY + row * gridSpacingY));
      dot.setAttribute('r', '1.5');
      dot.setAttribute('fill', color);
      dot.setAttribute('opacity', '0.5');
      innerG.appendChild(dot);
    }
  }

  // ── Provider badge (below grid, small text) ──
  if (meta.provider) {
    const badge = document.createElementNS(SVG_NS, 'text');
    badge.setAttribute('x', '0');
    badge.setAttribute('y', String(topY + bodyH * 0.92));
    badge.setAttribute('text-anchor', 'middle');
    badge.setAttribute('fill', color);
    badge.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    badge.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    badge.setAttribute('opacity', '0.6');
    badge.textContent = meta.provider;
    innerG.appendChild(badge);
  }

  // ── Entity label below ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size, bodyH)));
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
