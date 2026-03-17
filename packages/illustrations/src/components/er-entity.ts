/**
 * @preplai/illustrations — EREntity Component
 * Multi-compartment rectangle for ER diagrams: entity name header + typed columns with key indicators.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, COLORS, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface Column {
  name: string;
  type: string;
  key?: 'PK' | 'FK' | 'UK';
}

const defaultColumns: Column[] = [
  { name: 'id', type: 'uuid', key: 'PK' },
  { name: 'name', type: 'varchar(255)' },
  { name: 'email', type: 'varchar(255)', key: 'UK' },
  { name: 'created_at', type: 'timestamp' },
];

const KEY_COLORS: Record<string, string> = {
  PK: COLORS.gold,
  FK: COLORS.blue,
  UK: COLORS.green,
};

export function renderEREntity(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('EREntity');
  const meta = (entity.metadata ?? {}) as { tableName?: string; columns?: Column[] };

  const scale = size / 50;
  const baseW = 160 * scale;
  const rowH = 20 * scale;
  const headerH = 28 * scale;
  const padX = 8 * scale;
  const keyBadgeW = 20 * scale;

  const tableName = meta.tableName ?? entity.label ?? 'Entity';
  const columns = meta.columns?.length ? meta.columns : defaultColumns;

  const totalH = headerH + columns.length * rowH;
  const startX = -baseW / 2;
  const startY = -totalH / 2;

  // ── Background rect ──
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(startX));
  bg.setAttribute('y', String(startY));
  bg.setAttribute('width', String(baseW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', '4');
  bg.setAttribute('ry', '4');
  bg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  bg.setAttribute('stroke', color);
  bg.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(bg);

  // ── Header fill ──
  const headerBg = document.createElementNS(SVG_NS, 'rect');
  headerBg.setAttribute('x', String(startX));
  headerBg.setAttribute('y', String(startY));
  headerBg.setAttribute('width', String(baseW));
  headerBg.setAttribute('height', String(headerH));
  headerBg.setAttribute('rx', '4');
  headerBg.setAttribute('ry', '4');
  headerBg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
  innerG.appendChild(headerBg);

  // Clip bottom corners of header (overlap with body)
  const headerOverlap = document.createElementNS(SVG_NS, 'rect');
  headerOverlap.setAttribute('x', String(startX));
  headerOverlap.setAttribute('y', String(startY + headerH - 4 * scale));
  headerOverlap.setAttribute('width', String(baseW));
  headerOverlap.setAttribute('height', String(4 * scale));
  headerOverlap.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
  innerG.appendChild(headerOverlap);

  // ── Header text ──
  const headerText = document.createElementNS(SVG_NS, 'text');
  headerText.setAttribute('x', '0');
  headerText.setAttribute('y', String(startY + headerH / 2 + 4 * scale));
  headerText.setAttribute('text-anchor', 'middle');
  headerText.setAttribute('fill', color);
  headerText.setAttribute('font-size', String(Math.round(14 * scale)));
  headerText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  headerText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  headerText.textContent = tableName;
  innerG.appendChild(headerText);

  // ── Divider line ──
  const divider = document.createElementNS(SVG_NS, 'line');
  divider.setAttribute('x1', String(startX));
  divider.setAttribute('y1', String(startY + headerH));
  divider.setAttribute('x2', String(startX + baseW));
  divider.setAttribute('y2', String(startY + headerH));
  divider.setAttribute('stroke', color);
  divider.setAttribute('stroke-width', String(STROKE.thin));
  divider.setAttribute('opacity', '0.5');
  innerG.appendChild(divider);

  // ── Column rows ──
  const bodyStartY = startY + headerH;
  const fontSize = Math.round(12 * scale);

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const rowY = bodyStartY + i * rowH + rowH / 2 + 3 * scale;
    let textStartX = startX + padX;

    // Key badge
    if (col.key) {
      const badgeColor = KEY_COLORS[col.key] ?? color;
      const badgeX = startX + padX;
      const badgeY = bodyStartY + i * rowH + rowH / 2 - 5 * scale;
      const badgeH = 12 * scale;

      const badge = document.createElementNS(SVG_NS, 'rect');
      badge.setAttribute('x', String(badgeX));
      badge.setAttribute('y', String(badgeY));
      badge.setAttribute('width', String(keyBadgeW));
      badge.setAttribute('height', String(badgeH));
      badge.setAttribute('rx', '2');
      badge.setAttribute('ry', '2');
      badge.setAttribute('fill', colorWithAlpha(badgeColor, OPACITY.fillHeavy));
      innerG.appendChild(badge);

      const badgeText = document.createElementNS(SVG_NS, 'text');
      badgeText.setAttribute('x', String(badgeX + keyBadgeW / 2));
      badgeText.setAttribute('y', String(badgeY + badgeH / 2 + 3 * scale));
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('fill', badgeColor);
      badgeText.setAttribute('font-size', String(Math.round(8 * scale)));
      badgeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
      badgeText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      badgeText.textContent = col.key;
      innerG.appendChild(badgeText);

      textStartX += keyBadgeW + 4 * scale;
    }

    // Column name (left-aligned)
    const nameEl = document.createElementNS(SVG_NS, 'text');
    nameEl.setAttribute('x', String(textStartX));
    nameEl.setAttribute('y', String(rowY));
    nameEl.setAttribute('text-anchor', 'start');
    nameEl.setAttribute('fill', color);
    nameEl.setAttribute('font-size', String(fontSize));
    nameEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    nameEl.setAttribute('font-family', TYPOGRAPHY.fontCode);
    nameEl.textContent = col.name;
    innerG.appendChild(nameEl);

    // Column type (right-aligned, dimmer)
    const typeEl = document.createElementNS(SVG_NS, 'text');
    typeEl.setAttribute('x', String(startX + baseW - padX));
    typeEl.setAttribute('y', String(rowY));
    typeEl.setAttribute('text-anchor', 'end');
    typeEl.setAttribute('fill', color);
    typeEl.setAttribute('font-size', String(fontSize));
    typeEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    typeEl.setAttribute('font-family', TYPOGRAPHY.fontCode);
    typeEl.setAttribute('opacity', '0.6');
    typeEl.textContent = col.type;
    innerG.appendChild(typeEl);
  }

  // ── Entity label (below if different from tableName) ──
  if (entity.label && entity.label !== tableName) {
    const labelY = startY + totalH + 18 * scale;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
