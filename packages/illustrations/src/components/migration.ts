/**
 * @preplai/illustrations — Migration Component
 * Database migration: before→after with arrow between
 * Metadata: { version?: string, description?: string, direction?: 'up'|'down' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, COLORS, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMigration(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Migration');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-mig-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const version = (meta.version as string) ?? '';
  const description = (meta.description as string) ?? entity.label ?? 'Migration';
  const direction = (meta.direction as string) ?? 'up';

  const w = s * 1.6;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // Left accent
  const accent = document.createElementNS(SVG_NS, 'rect');
  accent.setAttribute('x', String(-hw));
  accent.setAttribute('y', String(-hh));
  accent.setAttribute('width', '3');
  accent.setAttribute('height', String(h));
  accent.setAttribute('fill', color);
  accent.setAttribute('opacity', '0.7');
  innerG.appendChild(accent);

  // Arrow icon (up or down)
  const arrowDir = direction === 'down' ? 1 : -1;
  const arrowPath = document.createElementNS(SVG_NS, 'path');
  arrowPath.setAttribute('d', `M ${-hw + 16} ${arrowDir * 5} L ${-hw + 16} ${arrowDir * -5} L ${-hw + 12} ${arrowDir * -1} M ${-hw + 16} ${arrowDir * -5} L ${-hw + 20} ${arrowDir * -1}`);
  arrowPath.setAttribute('stroke', direction === 'up' ? COLORS.green : COLORS.red);
  arrowPath.setAttribute('stroke-width', String(STROKE.emphasized));
  arrowPath.setAttribute('fill', 'none');
  innerG.appendChild(arrowPath);

  // Version badge
  if (version) {
    const vText = document.createElementNS(SVG_NS, 'text');
    vText.setAttribute('x', String(hw - 10));
    vText.setAttribute('y', String(-hh + 14));
    vText.setAttribute('text-anchor', 'end');
    vText.setAttribute('fill', color);
    vText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    vText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    vText.setAttribute('opacity', '0.6');
    vText.textContent = version;
    innerG.appendChild(vText);
  }

  // Description
  const descText = document.createElementNS(SVG_NS, 'text');
  descText.setAttribute('x', String(-hw + 28));
  descText.setAttribute('y', String(4));
  descText.setAttribute('text-anchor', 'start');
  descText.setAttribute('fill', color);
  descText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  descText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  descText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  descText.textContent = description;
  innerG.appendChild(descText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
