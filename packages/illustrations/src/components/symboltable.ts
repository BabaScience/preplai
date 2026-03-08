/**
 * @preplai/illustrations — SymbolTable Component
 *
 * Compiler/interpreter symbol table with name → type entries.
 *
 * Metadata:
 *   entries?: Array<{ name: string; type: string; scope?: string }> — symbol entries
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, createDarkGradient, ensureDefs } from '../visual-utils.js';
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

interface SymbolEntry {
  name: string;
  type: string;
  scope?: string;
}

export function renderSymbolTable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('SymbolTable');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-sym-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);
  const darkGradId = `grad-sym-dark-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createDarkGradient(darkGradId, defs, color);

  const meta = entity.metadata ?? {};
  const entries: SymbolEntry[] = (meta.entries as SymbolEntry[]) ?? [
    { name: 'x', type: 'int' },
    { name: 'name', type: 'string' },
    { name: 'sum', type: 'float' },
  ];
  const label = entity.label ?? 'SymbolTable';

  const maxEntries = Math.min(entries.length, 6);
  const sw = getStrokeWidth('thin', scale);
  const rowH = Math.max(16, 20 * scale);
  const headerH = Math.max(18, 22 * scale);
  const nameColW = s * 0.9;
  const typeColW = s * 0.7;
  const w = nameColW + typeColW;
  const h = headerH + maxEntries * rowH + 4 * scale;
  const halfW = w / 2;
  const halfH = h / 2;

  // Outer frame
  const frame = document.createElementNS(SVG_NS, 'rect');
  frame.setAttribute('x', String(-halfW));
  frame.setAttribute('y', String(-halfH));
  frame.setAttribute('width', String(w));
  frame.setAttribute('height', String(h));
  frame.setAttribute('rx', String(SHAPES.borderRadius));
  frame.setAttribute('fill', `url(#${darkGradId})`);
  frame.setAttribute('stroke', color);
  frame.setAttribute('stroke-width', String(sw));
  innerG.appendChild(frame);

  // Header row
  const headerY = -halfH;
  const headerBg = document.createElementNS(SVG_NS, 'rect');
  headerBg.setAttribute('x', String(-halfW));
  headerBg.setAttribute('y', String(headerY));
  headerBg.setAttribute('width', String(w));
  headerBg.setAttribute('height', String(headerH));
  headerBg.setAttribute('rx', String(SHAPES.borderRadius));
  headerBg.setAttribute('fill', `url(#${gradId})`);
  innerG.appendChild(headerBg);

  // Clip the bottom corners of the header (cover with a small rect)
  const headerPatch = document.createElementNS(SVG_NS, 'rect');
  headerPatch.setAttribute('x', String(-halfW));
  headerPatch.setAttribute('y', String(headerY + headerH - 4));
  headerPatch.setAttribute('width', String(w));
  headerPatch.setAttribute('height', '4');
  headerPatch.setAttribute('fill', `url(#${gradId})`);
  innerG.appendChild(headerPatch);

  // Header divider line
  const headerLine = document.createElementNS(SVG_NS, 'line');
  headerLine.setAttribute('x1', String(-halfW));
  headerLine.setAttribute('y1', String(headerY + headerH));
  headerLine.setAttribute('x2', String(halfW));
  headerLine.setAttribute('y2', String(headerY + headerH));
  headerLine.setAttribute('stroke', color);
  headerLine.setAttribute('stroke-width', String(sw));
  headerLine.setAttribute('opacity', '0.4');
  innerG.appendChild(headerLine);

  // Column divider
  const colDivX = -halfW + nameColW;
  const colDiv = document.createElementNS(SVG_NS, 'line');
  colDiv.setAttribute('x1', String(colDivX));
  colDiv.setAttribute('y1', String(headerY));
  colDiv.setAttribute('x2', String(colDivX));
  colDiv.setAttribute('y2', String(headerY + h));
  colDiv.setAttribute('stroke', color);
  colDiv.setAttribute('stroke-width', String(sw));
  colDiv.setAttribute('opacity', '0.2');
  innerG.appendChild(colDiv);

  const headerFontSize = Math.min(getLabelFontSize('value', scale), 11);
  const cellFontSize = Math.min(getLabelFontSize('value', scale), 10);

  // Header labels
  const hName = document.createElementNS(SVG_NS, 'text');
  hName.setAttribute('x', String(-halfW + nameColW / 2));
  hName.setAttribute('y', String(headerY + headerH / 2 + 4 * scale));
  hName.setAttribute('text-anchor', 'middle');
  hName.setAttribute('fill', color);
  hName.setAttribute('font-size', String(headerFontSize));
  hName.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  hName.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  hName.textContent = 'Name';
  innerG.appendChild(hName);

  const hType = document.createElementNS(SVG_NS, 'text');
  hType.setAttribute('x', String(colDivX + typeColW / 2));
  hType.setAttribute('y', String(headerY + headerH / 2 + 4 * scale));
  hType.setAttribute('text-anchor', 'middle');
  hType.setAttribute('fill', color);
  hType.setAttribute('font-size', String(headerFontSize));
  hType.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  hType.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  hType.textContent = 'Type';
  innerG.appendChild(hType);

  // Entries
  for (let i = 0; i < maxEntries; i++) {
    const entry = entries[i];
    const rowY = headerY + headerH + i * rowH;

    // Row separator
    if (i > 0) {
      const rowLine = document.createElementNS(SVG_NS, 'line');
      rowLine.setAttribute('x1', String(-halfW + 4));
      rowLine.setAttribute('y1', String(rowY));
      rowLine.setAttribute('x2', String(halfW - 4));
      rowLine.setAttribute('y2', String(rowY));
      rowLine.setAttribute('stroke', color);
      rowLine.setAttribute('stroke-width', String(sw * 0.5));
      rowLine.setAttribute('opacity', '0.12');
      innerG.appendChild(rowLine);
    }

    // Name
    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(-halfW + nameColW / 2));
    nameText.setAttribute('y', String(rowY + rowH / 2 + 3.5 * scale));
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', colorWithAlpha('#ffffff', OPACITY.strokeSoft));
    nameText.setAttribute('font-size', String(cellFontSize));
    nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    const nameStr = entry.name ?? '';
    nameText.textContent = nameStr.length > 10 ? nameStr.slice(0, 8) + '…' : nameStr;
    innerG.appendChild(nameText);

    // Type
    const typeText = document.createElementNS(SVG_NS, 'text');
    typeText.setAttribute('x', String(colDivX + typeColW / 2));
    typeText.setAttribute('y', String(rowY + rowH / 2 + 3.5 * scale));
    typeText.setAttribute('text-anchor', 'middle');
    typeText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    typeText.setAttribute('font-size', String(cellFontSize));
    typeText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    const typeStr = entry.type ?? '';
    typeText.textContent = typeStr.length > 8 ? typeStr.slice(0, 6) + '…' : typeStr;
    innerG.appendChild(typeText);
  }

  // Label below shape
  const labelText = document.createElementNS(SVG_NS, 'text');
  labelText.setAttribute('x', '0');
  labelText.setAttribute('y', String(halfH + LABEL_DEFAULTS.offsetBelow));
  labelText.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
  labelText.setAttribute('fill', color);
  labelText.setAttribute('font-size', String(getLabelFontSize('label', scale)));
  labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  labelText.textContent = label.length > 14 ? label.slice(0, 12) + '…' : label;
  innerG.appendChild(labelText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
