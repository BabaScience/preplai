/**
 * @preplai/illustrations — ConfigFile Component
 * Configuration file: card with gear icon + filename + key-value pairs
 * Metadata: { filename?: string, entries?: Array<{key: string, value: string}> }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderConfigFile(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('ConfigFile');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cfg-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const filename = (meta.filename as string) ?? entity.label ?? '.env';
  const entries = (meta.entries as Array<{key: string; value: string}>) ?? [];

  const w = s * 1.4;
  const rowH = 13;
  const headerH = 20;
  const h = Math.max(s * 0.7, headerH + entries.length * rowH + 8);
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

  // Header
  const headerBar = document.createElementNS(SVG_NS, 'rect');
  headerBar.setAttribute('x', String(-hw));
  headerBar.setAttribute('y', String(-hh));
  headerBar.setAttribute('width', String(w));
  headerBar.setAttribute('height', String(headerH));
  headerBar.setAttribute('rx', String(SHAPES.borderRadius));
  headerBar.setAttribute('fill', color);
  headerBar.setAttribute('opacity', '0.15');
  innerG.appendChild(headerBar);

  // Gear icon (circle + 4 teeth)
  const gearG = document.createElementNS(SVG_NS, 'g');
  gearG.setAttribute('transform', `translate(${-hw + 14}, ${-hh + headerH / 2})`);
  const gearCircle = document.createElementNS(SVG_NS, 'circle');
  gearCircle.setAttribute('cx', '0');
  gearCircle.setAttribute('cy', '0');
  gearCircle.setAttribute('r', '4');
  gearCircle.setAttribute('fill', 'none');
  gearCircle.setAttribute('stroke', color);
  gearCircle.setAttribute('stroke-width', String(STROKE.default));
  gearG.appendChild(gearCircle);
  // Teeth
  for (let i = 0; i < 4; i++) {
    const angle = (i * 90) * Math.PI / 180;
    const tooth = document.createElementNS(SVG_NS, 'line');
    tooth.setAttribute('x1', String(Math.cos(angle) * 4));
    tooth.setAttribute('y1', String(Math.sin(angle) * 4));
    tooth.setAttribute('x2', String(Math.cos(angle) * 7));
    tooth.setAttribute('y2', String(Math.sin(angle) * 7));
    tooth.setAttribute('stroke', color);
    tooth.setAttribute('stroke-width', String(STROKE.default));
    gearG.appendChild(tooth);
  }
  innerG.appendChild(gearG);

  // Filename
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 26));
  nameText.setAttribute('y', String(-hh + 14));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  nameText.textContent = filename;
  innerG.appendChild(nameText);

  // Key-value pairs
  const fontSize = getLabelFontSize('inline', scale);
  const maxEntries = Math.min(entries.length, 5);
  for (let i = 0; i < maxEntries; i++) {
    const entry = entries[i];
    const y = -hh + headerH + 12 + i * rowH;

    const keyText = document.createElementNS(SVG_NS, 'text');
    keyText.setAttribute('x', String(-hw + 10));
    keyText.setAttribute('y', String(y));
    keyText.setAttribute('text-anchor', 'start');
    keyText.setAttribute('fill', color);
    keyText.setAttribute('font-size', String(fontSize));
    keyText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    keyText.textContent = entry.key;
    innerG.appendChild(keyText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(hw - 8));
    valText.setAttribute('y', String(y));
    valText.setAttribute('text-anchor', 'end');
    valText.setAttribute('fill', color);
    valText.setAttribute('font-size', String(fontSize));
    valText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    valText.setAttribute('opacity', '0.5');
    valText.textContent = entry.value;
    innerG.appendChild(valText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
