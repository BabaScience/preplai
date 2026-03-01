/**
 * @pre/illustrations — Generic Component Factory
 *
 * Creates render functions for entity types not yet fully implemented.
 * Uses gradients for depth, supports visualStyle metadata, and improved typography.
 *
 * @param defaultColor - Default color for this entity type
 * @param shape - 'rect' | 'circle' | 'diamond' | 'hexagon'
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  createLinearGradient,
  createRadialGradient,
  ensureDefs,
} from '../visual-utils.js';
import { colorWithAlpha, OPACITY, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

type VisualStyle = 'default' | 'minimal' | 'emphasized';

function getVisualStyle(entity: VisualEntity): VisualStyle {
  const meta = entity.metadata ?? {};
  const style = meta.visualStyle as string | undefined;
  if (style === 'minimal' || style === 'emphasized') return style;
  return 'default';
}

function safeGradientId(color: string, suffix: string): string {
  return `grad-${suffix}-${color.replace(/[^a-fA-F0-9]/g, '')}`;
}

export function createGenericRenderer(
  defaultColor: string,
  shape: 'rect' | 'circle' | 'diamond' | 'hexagon' = 'rect',
) {
  return function genericRender(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
    const { outerG, innerG } = buildEntityGroup(entity);

    const s = getSizeParam(entity);
    const color = entity.color ?? defaultColor;
    const visualStyle = getVisualStyle(entity);
    const showBadge = visualStyle !== 'minimal';
    const strokeWidth =
      visualStyle === 'emphasized' ? SHAPES.strokeWidthHeavy : SHAPES.strokeWidth;
    const fillAlpha = visualStyle === 'emphasized' ? OPACITY.fillMedium : OPACITY.fillLight;

    const defs = ensureDefs(parentEl);

    if (shape === 'circle') {
      const gradId = safeGradientId(color, 'rad');
      createRadialGradient(gradId, color, defs);

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', String(s / 2));
      circle.setAttribute('fill', `url(#${gradId})`);
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(circle);

      if (entity.highlight) {
        const glow = document.createElementNS(SVG_NS, 'circle');
        glow.setAttribute('cx', '0');
        glow.setAttribute('cy', '0');
        glow.setAttribute('r', String(s / 2 + 4));
        glow.setAttribute('fill', 'none');
        glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
        glow.setAttribute('stroke-width', '2');
        glow.setAttribute('stroke-dasharray', '4,4');
        innerG.insertBefore(glow, circle);
      }
    } else if (shape === 'diamond') {
      const gradId = safeGradientId(color, 'lin');
      createLinearGradient(gradId, color, 'vertical', defs);

      const d = s / 2;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', `0,${-d} ${d},0 0,${d} ${-d},0`);
      polygon.setAttribute('fill', `url(#${gradId})`);
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(polygon);
    } else if (shape === 'hexagon') {
      const gradId = safeGradientId(color, 'lin');
      createLinearGradient(gradId, color, 'vertical', defs);

      const hexPoints = [0, 1, 2, 3, 4, 5]
        .map(i => {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          return `${(Math.cos(angle) * s * 0.5).toFixed(1)},${(Math.sin(angle) * s * 0.5).toFixed(1)}`;
        })
        .join(' ');
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', hexPoints);
      polygon.setAttribute('fill', `url(#${gradId})`);
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(polygon);
    } else {
      // Default: rounded rect
      const gradId = safeGradientId(color, 'lin');
      createLinearGradient(gradId, color, 'vertical', defs);

      const w = s * 1.4;
      const h = s;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-w / 2));
      rect.setAttribute('y', String(-h / 2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', `url(#${gradId})`);
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(rect);

      if (entity.highlight) {
        const glow = document.createElementNS(SVG_NS, 'rect');
        glow.setAttribute('x', String(-w / 2 - 3));
        glow.setAttribute('y', String(-h / 2 - 3));
        glow.setAttribute('width', String(w + 6));
        glow.setAttribute('height', String(h + 6));
        glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
        glow.setAttribute('fill', 'none');
        glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
        glow.setAttribute('stroke-width', '2');
        glow.setAttribute('stroke-dasharray', '4,4');
        innerG.insertBefore(glow, rect);
      }
    }

    // Type badge (9px, better contrast)
    if (showBadge) {
      const badge = document.createElementNS(SVG_NS, 'text');
      badge.setAttribute('x', '0');
      badge.setAttribute('y', '-2');
      badge.setAttribute('text-anchor', 'middle');
      badge.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
      badge.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
      badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      badge.textContent = entity.type;
      innerG.appendChild(badge);
    }

    // Label
    if (entity.label) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(s / 2 + 18));
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
  };
}
