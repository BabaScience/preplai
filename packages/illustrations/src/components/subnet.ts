/**
 * @preplai/illustrations — Subnet Component
 *
 * Clean dashed-border rectangle with CIDR notation inside.
 * Use for: VPC subnets, LAN segments, network boundaries.
 *
 * Metadata:
 *   cidr?: string — CIDR notation (e.g. 192.168.1.0/24)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  STROKE,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSubnet(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Subnet');

  const meta = entity.metadata ?? {};
  const cidr = (meta.cidr as string) ?? '192.168.1.0/24';

  const w = s * 1.8;
  const h = s * 1.1;
  const hw = w / 2;
  const hh = h / 2;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Dashed boundary
  const border = document.createElementNS(SVG_NS, 'rect');
  border.setAttribute('x', String(-hw));
  border.setAttribute('y', String(-hh));
  border.setAttribute('width', String(w));
  border.setAttribute('height', String(h));
  border.setAttribute('rx', String(SHAPES.borderRadius));
  border.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  border.setAttribute('stroke', color);
  border.setAttribute('stroke-width', String(STROKE.default));
  border.setAttribute('stroke-dasharray', '8,6');
  innerG.appendChild(border);

  // CIDR text centered
  const cidrFontSize = getLabelFontSize('value', scale);
  const cidrText = document.createElementNS(SVG_NS, 'text');
  cidrText.setAttribute('x', '0');
  cidrText.setAttribute('y', '4');
  cidrText.setAttribute('text-anchor', 'middle');
  cidrText.setAttribute('fill', color);
  cidrText.setAttribute('font-size', String(cidrFontSize));
  cidrText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  cidrText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  cidrText.textContent = cidr.length > 18 ? cidr.slice(0, 16) + '…' : cidr;
  innerG.appendChild(cidrText);

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', color);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
