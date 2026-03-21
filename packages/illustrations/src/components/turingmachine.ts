/**
 * @preplai/illustrations — TuringMachine Component
 *
 * Tape (row of cells) + read/write head + current state.
 * Use for: automata theory, computation, algorithm visualization.
 *
 * Metadata: { tape: string[], headPosition: number, state: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
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

const CELL_W = 28;
const CELL_H = 26;
const GAP = 4;
const HEAD_SIZE = 10;

function parseTape(meta: Record<string, unknown>): string[] {
  const raw = (meta.tape ?? meta.cells ?? meta.values) as string[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return ['a', 'b', '_', 'a', 'b', '_'];
  }
  return raw.slice(0, 9).map((v) => String(v ?? '_'));
}

export function renderTuringMachine(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('TuringMachine');

  const meta = entity.metadata ?? {};
  const tape = parseTape(meta);
  const headPos = Math.max(0, Math.min(tape.length - 1, Math.floor(Number(meta.headPosition ?? 2))));
  const state = String(meta.state ?? 'q0');

  const totalW = tape.length * (CELL_W + GAP) - GAP;
  const startX = -totalW / 2 + (CELL_W + GAP) / 2;

  const strokeWidth = getStrokeWidth('thin', 1);
  const valueFontSize = getLabelFontSize('value', 1) / scale;
  const stateFontSize = getLabelFontSize('inline', 1) / scale;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  tape.forEach((sym, i) => {
    const x = startX + i * (CELL_W + GAP);
    const isHead = i === headPos;

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - CELL_W / 2 + 2));
    cell.setAttribute('y', String(-CELL_H / 2));
    cell.setAttribute('width', String(CELL_W - 4));
    cell.setAttribute('height', String(CELL_H));
    cell.setAttribute('rx', String(Math.max(1, SHAPES.borderRadius - 2)));
    cell.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    cell.setAttribute('stroke', isHead ? color : colorWithAlpha(color, OPACITY.strokeSoft));
    cell.setAttribute('stroke-width', String(isHead ? getStrokeWidth('emphasized', 1) : strokeWidth));
    if (isHead) {
      cell.setAttribute('filter', `drop-shadow(0 0 ${3 * scale}px ${color})`);
    }
    scaleGroup.appendChild(cell);

    const displaySym = sym === '_' || sym === ' ' ? '\u25A1' : (sym.length > 1 ? sym[0] : sym);
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(valueFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = displaySym;
    scaleGroup.appendChild(text);
  });

  const headX = startX + headPos * (CELL_W + GAP);
  const headY = -CELL_H / 2 - HEAD_SIZE;
  const head = document.createElementNS(SVG_NS, 'polygon');
  head.setAttribute(
    'points',
    `${headX},${headY + HEAD_SIZE} ${headX - HEAD_SIZE / 2},${headY} ${headX + HEAD_SIZE / 2},${headY}`,
  );
  head.setAttribute('fill', color);
  head.setAttribute('stroke', color);
  head.setAttribute('stroke-width', String(strokeWidth));
  scaleGroup.appendChild(head);

  const stateY = CELL_H / 2 + 14;
  const stateText = document.createElementNS(SVG_NS, 'text');
  stateText.setAttribute('x', '0');
  stateText.setAttribute('y', String(stateY));
  stateText.setAttribute('text-anchor', 'middle');
  stateText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  stateText.setAttribute('font-size', String(stateFontSize));
  stateText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  stateText.textContent = `state: ${state.length > 12 ? state.slice(0, 11) + '…' : state}`;
  scaleGroup.appendChild(stateText);

  innerG.appendChild(scaleGroup);

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(stateY + CELL_H / 2 * scale + LABEL_DEFAULTS.offsetBelow));
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
