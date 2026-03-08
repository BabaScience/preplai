/**
 * @preplai/illustrations — Subnet Component
 *
 * Network subnet: large dashed rect + CIDR badge.
 * Represents a logical network boundary (e.g. VPC subnet, LAN segment).
 *
 * Metadata:
 *   cidr?: string — CIDR notation (e.g. 192.168.1.0/24)
 *   label?: string — subnet name (or use entity.label)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSubnet(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Subnet');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-subnet-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const cidr = (meta.cidr as string) ?? '192.168.1.0/24';
  const label = (meta.label as string) ?? entity.label ?? '';

  const w = s * 2.2;
  const h = s * 1.4;
  const strokeWidth = getStrokeWidth('thin', scale);

  const border = document.createElementNS(SVG_NS, 'rect');
  border.setAttribute('x', String(-w / 2));
  border.setAttribute('y', String(-h / 2));
  border.setAttribute('width', String(w));
  border.setAttribute('height', String(h));
  border.setAttribute('rx', String(SHAPES.borderRadius));
  border.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  border.setAttribute('stroke', color);
  border.setAttribute('stroke-width', String(strokeWidth));
  border.setAttribute('stroke-dasharray', '8,6');
  innerG.appendChild(border);

  const cidrFontSize = getLabelFontSize('value', scale);
  const cidrText = document.createElementNS(SVG_NS, 'text');
  cidrText.setAttribute('x', '0');
  cidrText.setAttribute('y', label ? '-4' : '4');
  cidrText.setAttribute('text-anchor', 'middle');
  cidrText.setAttribute('fill', color);
  cidrText.setAttribute('font-size', String(cidrFontSize));
  cidrText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  cidrText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  cidrText.textContent = cidr.length > 18 ? cidr.slice(0, 16) + '…' : cidr;
  innerG.appendChild(cidrText);

  if (label) {
    const labelFontSize = getLabelFontSize('inline', scale);
    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', '0');
    labelText.setAttribute('y', String(14));
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    labelText.setAttribute('font-size', String(labelFontSize));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelText.textContent = label.length > 16 ? label.slice(0, 14) + '…' : label;
    innerG.appendChild(labelText);
  }

  if (entity.label) {
    const belowLabel = document.createElementNS(SVG_NS, 'text');
    belowLabel.setAttribute('x', '0');
    belowLabel.setAttribute('y', String(h / 2 + LABEL_DEFAULTS.offsetBelow));
    belowLabel.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    belowLabel.setAttribute('fill', color);
    belowLabel.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    belowLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    belowLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    belowLabel.textContent = entity.label;
    innerG.appendChild(belowLabel);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
