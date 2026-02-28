/**
 * @pre/illustrations — Generic Component Factory
 *
 * Creates simple placeholder render functions for entity types that
 * haven't been fully implemented yet. Each renders as a rounded rect
 * with the entity type name and label.
 *
 * As components are fleshed out, they graduate from this factory to
 * dedicated component files.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import type { VisualEntity } from '@pre/shared';

/**
 * Creates a standard render function for a given entity type.
 * The visual is: rounded rect + type badge + label text.
 *
 * @param defaultColor - Default color for this entity type
 * @param shape - 'rect' | 'circle' | 'diamond' | 'hexagon'
 */
export function createGenericRenderer(
  defaultColor: string,
  shape: 'rect' | 'circle' | 'diamond' | 'hexagon' = 'rect',
) {
  return function genericRender(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
    const { outerG, innerG } = buildEntityGroup(entity);

    const s = getSizeParam(entity);
    const color = entity.color ?? defaultColor;

    if (shape === 'circle') {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', String(s / 2));
      circle.setAttribute('fill', `${color}15`);
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '2');
      innerG.appendChild(circle);
    } else if (shape === 'diamond') {
      const d = s / 2;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', `0,${-d} ${d},0 0,${d} ${-d},0`);
      polygon.setAttribute('fill', `${color}15`);
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', '2');
      innerG.appendChild(polygon);
    } else if (shape === 'hexagon') {
      const hexPoints = [0, 1, 2, 3, 4, 5].map(i => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${(Math.cos(angle) * s * 0.5).toFixed(1)},${(Math.sin(angle) * s * 0.5).toFixed(1)}`;
      }).join(' ');
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', hexPoints);
      polygon.setAttribute('fill', `${color}15`);
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', '2');
      innerG.appendChild(polygon);
    } else {
      // Default: rounded rect
      const w = s * 1.4;
      const h = s;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-w / 2));
      rect.setAttribute('y', String(-h / 2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', '6');
      rect.setAttribute('fill', `${color}15`);
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', '2');
      innerG.appendChild(rect);
    }

    // Type badge (small text showing entity type)
    const badge = document.createElementNS(SVG_NS, 'text');
    badge.setAttribute('x', '0');
    badge.setAttribute('y', '-2');
    badge.setAttribute('text-anchor', 'middle');
    badge.setAttribute('fill', `${color}60`);
    badge.setAttribute('font-size', '8');
    badge.setAttribute('font-family', 'Geist Mono, monospace');
    badge.textContent = entity.type;
    innerG.appendChild(badge);

    // Label
    if (entity.label) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(s / 2 + 18));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '500');
      text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
      text.textContent = entity.label;
      innerG.appendChild(text);
    }

    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  };
}
