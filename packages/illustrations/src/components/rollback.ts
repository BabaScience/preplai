/**
 * @preplai/illustrations — Rollback Component
 * Rollback action: card with undo arrow + version info
 * Metadata: { fromVersion?: string, toVersion?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  colorWithAlpha, OPACITY,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderRollback(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Rollback');

  const meta = entity.metadata ?? {};
  const fromVersion = (meta.fromVersion as string) ?? '';
  const toVersion = (meta.toVersion as string) ?? '';
  const label = entity.label ?? 'Rollback';

  const w = s * 1.4;
  const h = s * 0.6;
  const hw = w / 2;
  const hh = h / 2;

  // Card
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // Undo arrow icon (curved arrow pointing left/back)
  const undoG = document.createElementNS(SVG_NS, 'g');
  undoG.setAttribute('transform', `translate(${-hw + 18}, 0)`);
  const undoPath = document.createElementNS(SVG_NS, 'path');
  undoPath.setAttribute('d', 'M -5 0 A 6 6 0 1 1 5 -6 M -5 0 L -2 -4 M -5 0 L -1 2');
  undoPath.setAttribute('stroke', color);
  undoPath.setAttribute('stroke-width', String(STROKE.emphasized));
  undoPath.setAttribute('fill', 'none');
  undoPath.setAttribute('stroke-linecap', 'round');
  undoG.appendChild(undoPath);
  innerG.appendChild(undoG);

  // Label
  const titleText = document.createElementNS(SVG_NS, 'text');
  titleText.setAttribute('x', String(-hw + 34));
  titleText.setAttribute('y', String(-2));
  titleText.setAttribute('text-anchor', 'start');
  titleText.setAttribute('fill', color);
  titleText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  titleText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  titleText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  titleText.textContent = label;
  innerG.appendChild(titleText);

  // Version info
  if (fromVersion || toVersion) {
    const versionStr = fromVersion && toVersion ? `${fromVersion} → ${toVersion}` : (toVersion || fromVersion);
    const vText = document.createElementNS(SVG_NS, 'text');
    vText.setAttribute('x', String(-hw + 34));
    vText.setAttribute('y', String(12));
    vText.setAttribute('text-anchor', 'start');
    vText.setAttribute('fill', color);
    vText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    vText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    vText.setAttribute('opacity', '0.6');
    vText.textContent = versionStr;
    innerG.appendChild(vText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
