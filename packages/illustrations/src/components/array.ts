/**
 * @preplai/illustrations — Array Component
 * Row of cells with indices. Fully customizable via metadata.
 *
 * Metadata:
 *   values: (string|number)[] — cell values (agent can display anything)
 *   cells: { value: string|number, enabled?: boolean, selected?: boolean }[] — rich format
 *   disabledIndexes: number[] — 0-based indexes to show as disabled (dimmed)
 *   selectedIndexes: number[] — 0-based indexes to highlight (e.g. current comparison in binary search)
 *
 * If both values and cells are provided, cells takes precedence.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type CellSpec = { value: string | number; enabled?: boolean; selected?: boolean };

function parseCells(meta: Record<string, unknown>): CellSpec[] {
  const rawCells = meta.cells as Array<{ value: string | number; enabled?: boolean; selected?: boolean }> | undefined;
  if (Array.isArray(rawCells)) {
    return rawCells.slice(0, 8).map((c) =>
      typeof c === 'object' && c !== null && 'value' in c
        ? { value: c.value, enabled: c.enabled !== false, selected: c.selected === true }
        : { value: String(c), enabled: true, selected: false },
    );
  }

  const values = (meta.values as (string | number)[]) ?? (meta.cells as (string | number)[]) ?? [1, 2, 3, 4, 5];
  const disabledSet = new Set((meta.disabledIndexes as number[]) ?? []);
  const selectedSet = new Set((meta.selectedIndexes as number[]) ?? []);
  return values.slice(0, 8).map((val, i) => ({
    value: val,
    enabled: !disabledSet.has(i),
    selected: selectedSet.has(i),
  }));
}

export function renderArray(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Array');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-array-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const cells = parseCells(meta);

  const scale = s / 50;
  const cellW = 28 * scale;
  const cellH = 24 * scale;
  const totalW = cells.length * cellW;
  const startX = -totalW / 2 + cellW / 2;

  const dimFilterId = `array-dim-${entity.id}`;
  if (cells.some((c) => !c.enabled)) {
    let filterEl = defs.querySelector(`#${dimFilterId}`) as SVGFilterElement | null;
    if (!filterEl) {
      filterEl = document.createElementNS(SVG_NS, 'filter');
      filterEl.setAttribute('id', dimFilterId);
      filterEl.setAttribute('x', '-20%');
      filterEl.setAttribute('y', '-20%');
      filterEl.setAttribute('width', '140%');
      filterEl.setAttribute('height', '140%');
      const feColorMatrix = document.createElementNS(SVG_NS, 'feColorMatrix');
      feColorMatrix.setAttribute('type', 'matrix');
      feColorMatrix.setAttribute('values', '0.4 0 0 0 0  0 0.4 0 0 0  0 0 0.4 0 0  0 0 0 1 0');
      filterEl.appendChild(feColorMatrix);
      defs.appendChild(filterEl);
    }
  }

  cells.forEach(({ value, enabled, selected }, i) => {
    const x = startX + i * cellW;

    const pad = 2 * scale;
    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2 + pad));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW - pad * 2));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', String(Math.max(1, 2 * scale)));
    cell.setAttribute('fill', `url(#${gradId})`);
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', String(Math.max(1, (selected ? 3 : 1.5) * scale)));
    if (!enabled) {
      cell.setAttribute('filter', `url(#${dimFilterId})`);
      cell.setAttribute('stroke-dasharray', '3,3');
    } else if (selected) {
      cell.setAttribute('filter', `drop-shadow(0 0 ${4 * scale}px ${color})`);
    }
    innerG.appendChild(cell);

    const indexText = document.createElementNS(SVG_NS, 'text');
    indexText.setAttribute('x', String(x));
    indexText.setAttribute('y', String(-cellH / 2 - 6));
    indexText.setAttribute('text-anchor', 'middle');
    indexText.setAttribute('fill', `${color}99`);
    indexText.setAttribute('font-size', String(Math.round(9 * scale)));
    indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    if (!enabled) {
      indexText.setAttribute('filter', `url(#${dimFilterId})`);
    }
    indexText.textContent = String(i);
    innerG.appendChild(indexText);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', color);
    valueText.setAttribute('font-size', String(Math.round(11 * scale)));
    valueText.setAttribute('font-weight', '600');
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    if (!enabled) {
      valueText.setAttribute('filter', `url(#${dimFilterId})`);
    }
    valueText.textContent = String(value);
    innerG.appendChild(valueText);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(cellH / 2 + 18 * scale));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(Math.round(TYPOGRAPHY.fontSizeLabel * scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
