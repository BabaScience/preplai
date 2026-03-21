/**
 * @preplai/illustrations — Token Component
 * JWT/API key visual: pill with key icon + masked value
 * Metadata: { tokenType?: 'jwt'|'api_key'|'session', value?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  colorWithAlpha, OPACITY,
  TYPOGRAPHY, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderToken(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Token');

  const meta = entity.metadata ?? {};
  const tokenType = (meta.tokenType as string) ?? 'jwt';
  const value = (meta.value as string) ?? '';
  const label = entity.label ?? tokenType.toUpperCase();

  const w = s * 1.5;
  const h = s * 0.5;
  const hw = w / 2;
  const hh = h / 2;

  // Pill shape
  const pill = document.createElementNS(SVG_NS, 'rect');
  pill.setAttribute('x', String(-hw));
  pill.setAttribute('y', String(-hh));
  pill.setAttribute('width', String(w));
  pill.setAttribute('height', String(h));
  pill.setAttribute('rx', String(h / 2));
  pill.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  pill.setAttribute('stroke', color);
  pill.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(pill);

  // Key icon (SVG)
  const keyG = document.createElementNS(SVG_NS, 'g');
  keyG.setAttribute('transform', `translate(${-hw + 16}, 0)`);
  const keyCircle = document.createElementNS(SVG_NS, 'circle');
  keyCircle.setAttribute('cx', '0');
  keyCircle.setAttribute('cy', '0');
  keyCircle.setAttribute('r', '4');
  keyCircle.setAttribute('fill', 'none');
  keyCircle.setAttribute('stroke', color);
  keyCircle.setAttribute('stroke-width', String(STROKE.default));
  keyG.appendChild(keyCircle);
  const keyShaft = document.createElementNS(SVG_NS, 'line');
  keyShaft.setAttribute('x1', '4');
  keyShaft.setAttribute('y1', '0');
  keyShaft.setAttribute('x2', '12');
  keyShaft.setAttribute('y2', '0');
  keyShaft.setAttribute('stroke', color);
  keyShaft.setAttribute('stroke-width', String(STROKE.default));
  keyG.appendChild(keyShaft);
  // Teeth
  for (const tx of [8, 11]) {
    const tooth = document.createElementNS(SVG_NS, 'line');
    tooth.setAttribute('x1', String(tx));
    tooth.setAttribute('y1', '0');
    tooth.setAttribute('x2', String(tx));
    tooth.setAttribute('y2', '3');
    tooth.setAttribute('stroke', color);
    tooth.setAttribute('stroke-width', String(STROKE.default));
    keyG.appendChild(tooth);
  }
  innerG.appendChild(keyG);

  // Label / masked value
  const displayText = value ? `${label} ${value.slice(0, 4)}${'*'.repeat(6)}` : label;
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', String(-hw + 36));
  text.setAttribute('y', String(4));
  text.setAttribute('text-anchor', 'start');
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  text.setAttribute('font-family', TYPOGRAPHY.fontCode);
  text.textContent = displayText;
  innerG.appendChild(text);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
