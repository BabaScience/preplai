/**
 * @preplai/illustrations — Dependency Component
 * Package dependency: pill with version badge + package name
 * Metadata: { version?: string, scope?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDependency(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Dependency');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-dep-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'express';
  const meta = entity.metadata ?? {};
  const version = (meta.version as string) ?? '^4.18.2';

  const w = s * 1.4;
  const h = s * 0.45;
  const hw = w / 2;
  const hh = h / 2;

  // Pill
  const pill = document.createElementNS(SVG_NS, 'rect');
  pill.setAttribute('x', String(-hw));
  pill.setAttribute('y', String(-hh));
  pill.setAttribute('width', String(w));
  pill.setAttribute('height', String(h));
  pill.setAttribute('rx', String(h / 2));
  pill.setAttribute('fill', `url(#${gradId})`);
  pill.setAttribute('stroke', color);
  pill.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(pill);

  // Package icon (cube-like: small rect with depth lines)
  const iconG = document.createElementNS(SVG_NS, 'g');
  iconG.setAttribute('transform', `translate(${-hw + 16}, 0)`);
  const pkgRect = document.createElementNS(SVG_NS, 'rect');
  pkgRect.setAttribute('x', '-5');
  pkgRect.setAttribute('y', '-5');
  pkgRect.setAttribute('width', '10');
  pkgRect.setAttribute('height', '10');
  pkgRect.setAttribute('rx', '2');
  pkgRect.setAttribute('fill', 'none');
  pkgRect.setAttribute('stroke', color);
  pkgRect.setAttribute('stroke-width', String(STROKE.default));
  iconG.appendChild(pkgRect);
  // Cross lines inside
  const hLine = document.createElementNS(SVG_NS, 'line');
  hLine.setAttribute('x1', '-5'); hLine.setAttribute('y1', '0');
  hLine.setAttribute('x2', '5'); hLine.setAttribute('y2', '0');
  hLine.setAttribute('stroke', color); hLine.setAttribute('stroke-width', String(STROKE.thin));
  hLine.setAttribute('opacity', '0.4');
  iconG.appendChild(hLine);
  const vLine = document.createElementNS(SVG_NS, 'line');
  vLine.setAttribute('x1', '0'); vLine.setAttribute('y1', '-5');
  vLine.setAttribute('x2', '0'); vLine.setAttribute('y2', '5');
  vLine.setAttribute('stroke', color); vLine.setAttribute('stroke-width', String(STROKE.thin));
  vLine.setAttribute('opacity', '0.4');
  iconG.appendChild(vLine);
  innerG.appendChild(iconG);

  // Package name
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 30));
  nameText.setAttribute('y', String(4));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  nameText.textContent = label;
  innerG.appendChild(nameText);

  // Version badge
  const verText = document.createElementNS(SVG_NS, 'text');
  verText.setAttribute('x', String(hw - 10));
  verText.setAttribute('y', String(4));
  verText.setAttribute('text-anchor', 'end');
  verText.setAttribute('fill', color);
  verText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  verText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  verText.setAttribute('opacity', '0.5');
  verText.textContent = version;
  innerG.appendChild(verText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
