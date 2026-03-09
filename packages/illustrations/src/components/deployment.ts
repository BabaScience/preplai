/**
 * @preplai/illustrations — Deployment Component
 * Deployment target: card with rocket/upload icon + environment + version
 * Metadata: { environment?: string, version?: string, status?: 'live'|'rolling'|'failed' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, COLORS, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDeployment(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Deployment');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-deploy-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const env = (meta.environment as string) ?? entity.label ?? 'production';
  const version = (meta.version as string) ?? '';
  const status = (meta.status as string) ?? 'live';

  const w = s * 1.4;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  // Card
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

  // Upload/rocket icon (upward arrow)
  const rocketG = document.createElementNS(SVG_NS, 'g');
  rocketG.setAttribute('transform', `translate(${-hw + 18}, 0)`);
  const rocketArrow = document.createElementNS(SVG_NS, 'path');
  rocketArrow.setAttribute('d', 'M 0 8 L 0 -6 M -4 -2 L 0 -6 L 4 -2');
  rocketArrow.setAttribute('stroke', color);
  rocketArrow.setAttribute('stroke-width', String(STROKE.emphasized));
  rocketArrow.setAttribute('fill', 'none');
  rocketArrow.setAttribute('stroke-linecap', 'round');
  rocketG.appendChild(rocketArrow);
  // Base line
  const base = document.createElementNS(SVG_NS, 'line');
  base.setAttribute('x1', '-5');
  base.setAttribute('y1', '8');
  base.setAttribute('x2', '5');
  base.setAttribute('y2', '8');
  base.setAttribute('stroke', color);
  base.setAttribute('stroke-width', String(STROKE.default));
  base.setAttribute('opacity', '0.5');
  rocketG.appendChild(base);
  innerG.appendChild(rocketG);

  // Environment name
  const envText = document.createElementNS(SVG_NS, 'text');
  envText.setAttribute('x', String(-hw + 34));
  envText.setAttribute('y', String(-2));
  envText.setAttribute('text-anchor', 'start');
  envText.setAttribute('fill', color);
  envText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  envText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  envText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  envText.textContent = env;
  innerG.appendChild(envText);

  // Version + status
  const statusColor = status === 'live' ? COLORS.green : status === 'failed' ? COLORS.red : COLORS.orange;
  const infoStr = version ? `${version} · ${status}` : status;
  const infoText = document.createElementNS(SVG_NS, 'text');
  infoText.setAttribute('x', String(-hw + 34));
  infoText.setAttribute('y', String(12));
  infoText.setAttribute('text-anchor', 'start');
  infoText.setAttribute('fill', statusColor);
  infoText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  infoText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  infoText.setAttribute('opacity', '0.8');
  infoText.textContent = infoStr;
  innerG.appendChild(infoText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
