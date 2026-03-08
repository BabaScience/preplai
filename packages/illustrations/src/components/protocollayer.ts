/**
 * @preplai/illustrations — ProtocolLayer Component
 *
 * Single protocol layer block (e.g. Transport, TCP, IP).
 * Use multiple ProtocolLayer entities stacked with Arrows for full protocol stacks.
 *
 * Metadata:
 *   label?: string — layer name (e.g. Transport, Network)
 *   protocol?: string — protocol(s) in this layer (e.g. TCP, IP)
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
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderProtocolLayer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('thin', scale);
  const labelFontSize = getLabelFontSize('value', scale);
  const sublabelFontSize = getLabelFontSize('inline', scale);
  const color = entity.color ?? getCategoryColor('ProtocolLayer');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-pl-${entity.id.replace(/[^a-z0-9]/gi, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? 'Layer';
  const protocol = meta.protocol as string | undefined;

  const w = s * 2.2;
  const h = s * 0.6;
  const stubLen = s * 0.12;

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

  const labelText = document.createElementNS(SVG_NS, 'text');
  labelText.setAttribute('x', '0');
  labelText.setAttribute('y', protocol ? String(-2) : String(4));
  labelText.setAttribute('text-anchor', 'middle');
  labelText.setAttribute('fill', color);
  labelText.setAttribute('font-size', String(labelFontSize));
  labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  labelText.textContent = label.length > 14 ? label.slice(0, 12) + '…' : label;
  innerG.appendChild(labelText);

  if (protocol) {
    const subText = document.createElementNS(SVG_NS, 'text');
    subText.setAttribute('x', '0');
    subText.setAttribute('y', String(10));
    subText.setAttribute('text-anchor', 'middle');
    subText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    subText.setAttribute('font-size', String(sublabelFontSize));
    subText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    subText.textContent = protocol.length > 12 ? protocol.slice(0, 10) + '…' : protocol;
    innerG.appendChild(subText);
  }

  const topStub = document.createElementNS(SVG_NS, 'line');
  topStub.setAttribute('x1', '0');
  topStub.setAttribute('y1', String(-h / 2 - stubLen));
  topStub.setAttribute('x2', '0');
  topStub.setAttribute('y2', String(-h / 2));
  topStub.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
  topStub.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(topStub);

  const bottomStub = document.createElementNS(SVG_NS, 'line');
  bottomStub.setAttribute('x1', '0');
  bottomStub.setAttribute('y1', String(h / 2));
  bottomStub.setAttribute('x2', '0');
  bottomStub.setAttribute('y2', String(h / 2 + stubLen));
  bottomStub.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
  bottomStub.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(bottomStub);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
