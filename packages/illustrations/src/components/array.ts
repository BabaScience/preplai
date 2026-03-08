/**
 * @preplai/illustrations — Array Component
 * Row of cells with indices. Fully customizable via metadata.
 *
 * Metadata:
 *   values: (string|number)[] — cell values (agent can display anything)
 *   cells: { value, enabled?, selected?, state? }[] — rich format; state: default|active|compare|swap|done
 *   disabledIndexes: number[] — 0-based indexes to show as disabled (dimmed)
 *   selectedIndexes: number[] — 0-based indexes to highlight (active/current pointer)
 *   compareIndexes: number[] — cells being compared (gold accent)
 *   swapIndexes: number[] — cells being swapped (dashed)
 *   doneIndexes: number[] — sorted/finalized cells (dimmed)
 *   pointerLabels: {index, label, color?, value?, showValue?, highlight?}[] — labels below cells
 *
 * If both values and cells are provided, cells takes precedence.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, COLORS, colorWithAlpha, OPACITY, STROKE, getStrokeWidth, getLabelFontSize } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type CellState = 'default' | 'active' | 'compare' | 'swap' | 'done';

function getStateColor(state: CellState, baseColor: string): string {
  switch (state) {
    case 'active':
      return baseColor;
    case 'compare':
      return COLORS.gold;
    case 'swap':
      return COLORS.orange;
    case 'done':
      return colorWithAlpha(baseColor, OPACITY.strokeSoft);
    default:
      return baseColor;
  }
}

type PointerLabelSpec = {
  index: number;
  label: string;
  color?: string;
  value?: string | number;
  showValue?: boolean;
  showIndex?: boolean;
  highlight?: boolean;
};

function getPointerColor(label: string, override?: string): string {
  if (override) return override;
  const l = label.toLowerCase();
  if (l.includes('low')) return COLORS.green;
  if (l.includes('mid')) return COLORS.gold;
  if (l.includes('high')) return COLORS.red;
  return COLORS.cyan;
}

type CellSpec = { value: string | number; enabled?: boolean; selected?: boolean; state?: CellState };

function parseCells(meta: Record<string, unknown>): CellSpec[] {
  const rawCells = meta.cells as Array<{ value: string | number; enabled?: boolean; selected?: boolean; state?: string }> | undefined;
  if (Array.isArray(rawCells)) {
    return rawCells.slice(0, 8).map((c) => {
      if (typeof c === 'object' && c !== null && 'value' in c) {
        const state = ['default', 'active', 'compare', 'swap', 'done'].includes(c.state as string)
          ? (c.state as CellState)
          : undefined;
        return {
          value: c.value,
          enabled: c.enabled !== false,
          selected: c.selected === true,
          state,
        };
      }
      return { value: String(c), enabled: true, selected: false, state: undefined };
    });
  }

  const values = (meta.values as (string | number)[]) ?? (meta.cells as (string | number)[]) ?? [1, 2, 3, 4, 5];
  const disabledSet = new Set((meta.disabledIndexes as number[]) ?? []);
  const selectedSet = new Set((meta.selectedIndexes as number[]) ?? []);
  const compareSet = new Set((meta.compareIndexes as number[]) ?? []);
  const swapSet = new Set((meta.swapIndexes as number[]) ?? []);
  const doneSet = new Set((meta.doneIndexes as number[]) ?? []);

  return values.slice(0, 8).map((val, i) => {
    let state: CellState | undefined;
    if (doneSet.has(i)) state = 'done';
    else if (swapSet.has(i)) state = 'swap';
    else if (compareSet.has(i)) state = 'compare';
    else if (selectedSet.has(i)) state = 'active';
    return {
      value: val,
      enabled: !disabledSet.has(i),
      selected: selectedSet.has(i),
      state,
    };
  });
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

  cells.forEach(({ value, enabled, selected, state: cellState }, i) => {
    const x = startX + i * cellW;

    const effectiveState: CellState =
      cellState ?? (selected ? 'active' : enabled ? 'default' : 'done');
    const cellColor = getStateColor(effectiveState, color);
    const pad = 2 * scale;
    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2 + pad));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW - pad * 2));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', String(Math.max(1, 2 * scale)));
    cell.setAttribute('fill', `url(#${gradId})`);
    cell.setAttribute('stroke', cellColor);
    cell.setAttribute('stroke-width', String(getStrokeWidth(effectiveState === 'active' || effectiveState === 'compare' ? 'selected' : 'thin', scale)));
    if (effectiveState === 'done' || !enabled) {
      cell.setAttribute('opacity', effectiveState === 'done' ? '0.6' : '1');
      cell.setAttribute('filter', `url(#${dimFilterId})`);
    } else if (effectiveState === 'active' || effectiveState === 'compare') {
      cell.setAttribute('filter', `drop-shadow(0 0 ${4 * scale}px ${cellColor})`);
    }
    if (effectiveState === 'swap') {
      cell.setAttribute('stroke-dasharray', '4,3');
    }
    innerG.appendChild(cell);

    const indexText = document.createElementNS(SVG_NS, 'text');
    indexText.setAttribute('x', String(x));
    indexText.setAttribute('y', String(-cellH / 2 - 6));
    indexText.setAttribute('text-anchor', 'middle');
    indexText.setAttribute('fill', effectiveState === 'done' ? `${cellColor}60` : `${cellColor}99`);
    indexText.setAttribute('font-size', String(getLabelFontSize('index', scale)));
    indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    if (effectiveState === 'done' || !enabled) {
      indexText.setAttribute('filter', `url(#${dimFilterId})`);
    }
    indexText.textContent = String(i);
    innerG.appendChild(indexText);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', cellColor);
    valueText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    if (effectiveState === 'done' || !enabled) {
      valueText.setAttribute('filter', `url(#${dimFilterId})`);
    }
    valueText.textContent = String(value);
    innerG.appendChild(valueText);
  });

  const rawPointerLabels = (meta.pointerLabels as Array<Record<string, unknown>>) ?? [];
  const pointerLabels: PointerLabelSpec[] = rawPointerLabels
    .filter((p): p is Record<string, unknown> => typeof p?.index === 'number' && typeof p?.label === 'string')
    .slice(0, 4)
    .map((p) => ({
      index: p.index as number,
      label: p.label as string,
      color: typeof p.color === 'string' ? p.color : undefined,
      value: typeof p.value === 'string' || typeof p.value === 'number' ? p.value : undefined,
      showValue: p.showValue === true,
      showIndex: p.showIndex !== false,
      highlight: p.highlight === true,
    }));

  if (pointerLabels.length > 0) {
    const connectorLen = 8 * scale;
    const labelY = cellH / 2 + connectorLen + 12;
    const fontSize = getLabelFontSize('inline', scale);

    pointerLabels.forEach((ptr) => {
      const { index, label, value, showValue, showIndex, highlight } = ptr;
      if (index < 0 || index >= cells.length) return;

      const ptrColor = getPointerColor(label, ptr.color);
      const x = startX + index * cellW;

      const displayValue = value !== undefined ? value : (showValue ? cells[index].value : undefined);
      const displayText =
        displayValue !== undefined
          ? `${label}${showIndex ? ` = ${index}` : ''} → ${displayValue}`
          : showIndex
            ? `${label} = ${index}`
            : label;

      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(x));
      line.setAttribute('y1', String(cellH / 2));
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(cellH / 2 + connectorLen));
      line.setAttribute('stroke', ptrColor);
      line.setAttribute('stroke-width', String(getStrokeWidth(highlight ? 'emphasized' : 'thin', scale)));
      line.setAttribute('opacity', highlight ? '1' : '0.75');
      innerG.appendChild(line);

      const labelGroup = document.createElementNS(SVG_NS, 'g');
      labelGroup.setAttribute('transform', `translate(${x}, ${labelY})`);

      const textEl = document.createElementNS(SVG_NS, 'text');
      textEl.setAttribute('x', '0');
      textEl.setAttribute('y', '0');
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'middle');
      textEl.setAttribute('fill', ptrColor);
      textEl.setAttribute('font-size', String(fontSize));
      textEl.setAttribute('font-weight', String(highlight ? TYPOGRAPHY.fontWeightEmphasis : TYPOGRAPHY.fontWeightLabel));
      textEl.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      textEl.textContent = displayText;

      const textWidth = displayText.length * (fontSize * 0.6);
      const pillW = Math.max(textWidth + 12, 24);
      const pillH = fontSize + 8;

      const pill = document.createElementNS(SVG_NS, 'rect');
      pill.setAttribute('x', String(-pillW / 2));
      pill.setAttribute('y', String(-pillH / 2 - 2));
      pill.setAttribute('width', String(pillW));
      pill.setAttribute('height', String(pillH));
      pill.setAttribute('rx', String(pillH / 2));
      pill.setAttribute('fill', 'rgba(12, 13, 20, 0.9)');
      pill.setAttribute('stroke', `${ptrColor}80`);
      pill.setAttribute('stroke-width', String(highlight ? STROKE.default : STROKE.minimal));
      labelGroup.appendChild(pill);
      labelGroup.appendChild(textEl);
      innerG.appendChild(labelGroup);
    });
  }

  const labelOffsetY = pointerLabels.length > 0 ? cellH / 2 + 28 * scale : cellH / 2 + 18 * scale;
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelOffsetY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
