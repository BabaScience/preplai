/**
 * @preplai/illustrations — Schema Component
 * Database table schema: card with columns list + types
 * Metadata: { tableName?: string, columns?: Array<{name: string, type: string}> }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  colorWithAlpha, OPACITY,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSchema(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Schema');

  const meta = entity.metadata ?? {};
  const tableName = (meta.tableName as string) ?? entity.label ?? 'users';
  const columns = (meta.columns as Array<{name: string; type: string}>) ?? [];

  const w = s * 1.6;
  const rowH = 14;
  const headerH = 22;
  const h = Math.max(s * 0.8, headerH + columns.length * rowH + 10);
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

  // Header bar
  const headerBar = document.createElementNS(SVG_NS, 'rect');
  headerBar.setAttribute('x', String(-hw));
  headerBar.setAttribute('y', String(-hh));
  headerBar.setAttribute('width', String(w));
  headerBar.setAttribute('height', String(headerH));
  headerBar.setAttribute('rx', String(SHAPES.borderRadius));
  headerBar.setAttribute('fill', color);
  headerBar.setAttribute('opacity', '0.2');
  innerG.appendChild(headerBar);

  // Table name
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 10));
  nameText.setAttribute('y', String(-hh + 15));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  nameText.textContent = tableName;
  innerG.appendChild(nameText);

  // Columns
  const fontSize = getLabelFontSize('inline', scale);
  const maxCols = Math.min(columns.length, 6);
  for (let i = 0; i < maxCols; i++) {
    const col = columns[i];
    const y = -hh + headerH + 12 + i * rowH;

    // Column name
    const colName = document.createElementNS(SVG_NS, 'text');
    colName.setAttribute('x', String(-hw + 12));
    colName.setAttribute('y', String(y));
    colName.setAttribute('text-anchor', 'start');
    colName.setAttribute('fill', color);
    colName.setAttribute('font-size', String(fontSize));
    colName.setAttribute('font-family', TYPOGRAPHY.fontCode);
    colName.textContent = col.name;
    innerG.appendChild(colName);

    // Column type
    const colType = document.createElementNS(SVG_NS, 'text');
    colType.setAttribute('x', String(hw - 10));
    colType.setAttribute('y', String(y));
    colType.setAttribute('text-anchor', 'end');
    colType.setAttribute('fill', color);
    colType.setAttribute('font-size', String(fontSize));
    colType.setAttribute('font-family', TYPOGRAPHY.fontCode);
    colType.setAttribute('opacity', '0.5');
    colType.textContent = col.type;
    innerG.appendChild(colType);

    // Divider
    if (i < maxCols - 1) {
      const div = document.createElementNS(SVG_NS, 'line');
      div.setAttribute('x1', String(-hw + 8));
      div.setAttribute('y1', String(y + 5));
      div.setAttribute('x2', String(hw - 8));
      div.setAttribute('y2', String(y + 5));
      div.setAttribute('stroke', color);
      div.setAttribute('stroke-width', String(STROKE.minimal));
      div.setAttribute('opacity', '0.15');
      innerG.appendChild(div);
    }
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
