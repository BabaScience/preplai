/**
 * @preplai/illustrations — Certificate Component
 * SSL/TLS certificate: card with shield icon + issuer + validity
 * Metadata: { issuer?: string, domain?: string, valid?: boolean }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, COLORS, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCertificate(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Certificate');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cert-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const domain = (meta.domain as string) ?? entity.label ?? '*.example.com';
  const valid = meta.valid !== false;

  const w = s * 1.4;
  const h = s * 0.8;
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

  // Shield icon
  const shield = document.createElementNS(SVG_NS, 'path');
  shield.setAttribute('d', `M ${-hw + 18} ${-8} L ${-hw + 10} ${-5} L ${-hw + 10} ${3} Q ${-hw + 10} ${8} ${-hw + 18} ${10} Q ${-hw + 26} ${8} ${-hw + 26} ${3} L ${-hw + 26} ${-5} Z`);
  shield.setAttribute('fill', 'none');
  shield.setAttribute('stroke', valid ? COLORS.green : COLORS.red);
  shield.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(shield);

  // Checkmark or X
  if (valid) {
    const check = document.createElementNS(SVG_NS, 'path');
    check.setAttribute('d', `M ${-hw + 14} ${0} L ${-hw + 17} ${3} L ${-hw + 22} ${-3}`);
    check.setAttribute('fill', 'none');
    check.setAttribute('stroke', COLORS.green);
    check.setAttribute('stroke-width', String(STROKE.emphasized));
    innerG.appendChild(check);
  }

  // Domain name
  const domainText = document.createElementNS(SVG_NS, 'text');
  domainText.setAttribute('x', String(-hw + 34));
  domainText.setAttribute('y', String(-2));
  domainText.setAttribute('text-anchor', 'start');
  domainText.setAttribute('fill', color);
  domainText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  domainText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  domainText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  domainText.textContent = domain;
  innerG.appendChild(domainText);

  // SSL/TLS label
  const sslText = document.createElementNS(SVG_NS, 'text');
  sslText.setAttribute('x', String(-hw + 34));
  sslText.setAttribute('y', String(12));
  sslText.setAttribute('text-anchor', 'start');
  sslText.setAttribute('fill', color);
  sslText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  sslText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  sslText.setAttribute('opacity', '0.6');
  sslText.textContent = 'TLS Certificate';
  innerG.appendChild(sslText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
