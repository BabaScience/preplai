/**
 * @preplai/illustrations — CPU Component
 *
 * Chip/silicon die shape with pins on edges. Use for: computer architecture,
 * processor diagrams, CPU vs GPU comparisons, instruction pipelines.
 *
 * Metadata:
 *   model?: string — e.g. "x86", "ARM"
 *   cores?: number — core count (shown if provided)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
  getStrokeWidth,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const PIN_COUNT = 3; // pins per side
const PIN_LENGTH = 2;
const PIN_GAP = 1.5;

export function renderCPU(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('CPU');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cpu-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const dieSize = s * 0.6;
  const half = dieSize / 2;

  // ── Main die (rounded square) — draw first so pins appear to extend from edges
  const die = document.createElementNS(SVG_NS, 'rect');
  die.setAttribute('x', String(-half));
  die.setAttribute('y', String(-half));
  die.setAttribute('width', String(dieSize));
  die.setAttribute('height', String(dieSize));
  die.setAttribute('rx', String(SHAPES.borderRadius));
  die.setAttribute('fill', `url(#${gradId})`);
  die.setAttribute('stroke', color);
  die.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  die.setAttribute('stroke-linejoin', 'round');
  die.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(die);

  // ── Inner symbol: simplified processor grid (2×2 squares) or "CPU" text
  const meta = entity.metadata ?? {};
  const cores = meta.cores as number | undefined;
  const model = meta.model as string | undefined;

  if (cores != null && cores > 0) {
    // Grid of small squares suggesting cores
    const gridN = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(cores))));
    const cellSize = (dieSize * 0.5) / gridN;
    const gridOffset = -((gridN * cellSize) / 2) + cellSize / 2;
    for (let row = 0; row < gridN; row++) {
      for (let col = 0; col < gridN; col++) {
        if (row * gridN + col >= cores) break;
        const cell = document.createElementNS(SVG_NS, 'rect');
        cell.setAttribute('x', String(gridOffset + col * cellSize - cellSize * 0.35));
        cell.setAttribute('y', String(gridOffset + row * cellSize - cellSize * 0.35));
        cell.setAttribute('width', String(cellSize * 0.7));
        cell.setAttribute('height', String(cellSize * 0.7));
        cell.setAttribute('rx', '1');
        cell.setAttribute('fill', `${color}50`);
        cell.setAttribute('stroke', color);
        cell.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale)));
        innerG.appendChild(cell);
      }
    }
  } else {
    // Default: "CPU" or model text
    const hubText = model ?? 'CPU';
    const hubFontSize = Math.min(TYPOGRAPHY.fontSizeValue, Math.floor(s * LABEL_DEFAULTS.hubScaleFactor * 1.2));
    const hub = document.createElementNS(SVG_NS, 'text');
    hub.setAttribute('x', '0');
    hub.setAttribute('y', String(LABEL_DEFAULTS.hubOffsetY));
    hub.setAttribute('text-anchor', 'middle');
    hub.setAttribute('fill', color);
    hub.setAttribute('font-size', String(hubFontSize));
    hub.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    hub.setAttribute('font-family', TYPOGRAPHY.fontCode);
    hub.setAttribute('opacity', '0.95');
    hub.textContent = hubText;
    innerG.appendChild(hub);
  }

  // ── Pins (small rectangles along each edge, extending outward)
  const pinStroke = getStrokeWidth('thin', scale);
  const totalSpan = dieSize - PIN_GAP * (PIN_COUNT - 1);
  const pinW = Math.max(2, (totalSpan - PIN_GAP * (PIN_COUNT - 1)) / PIN_COUNT);
  const start = -half + PIN_GAP / 2 + pinW / 2;

  for (let i = 0; i < PIN_COUNT; i++) {
    const t = start + i * (pinW + PIN_GAP);
    // Top
    const topPin = document.createElementNS(SVG_NS, 'rect');
    topPin.setAttribute('x', String(t - pinW / 2));
    topPin.setAttribute('y', String(-half - PIN_LENGTH));
    topPin.setAttribute('width', String(pinW));
    topPin.setAttribute('height', String(PIN_LENGTH));
    topPin.setAttribute('rx', '1');
    topPin.setAttribute('fill', `${color}40`);
    topPin.setAttribute('stroke', color);
    topPin.setAttribute('stroke-width', String(pinStroke));
    innerG.appendChild(topPin);
    // Bottom
    const botPin = document.createElementNS(SVG_NS, 'rect');
    botPin.setAttribute('x', String(t - pinW / 2));
    botPin.setAttribute('y', String(half));
    botPin.setAttribute('width', String(pinW));
    botPin.setAttribute('height', String(PIN_LENGTH));
    botPin.setAttribute('rx', '1');
    botPin.setAttribute('fill', `${color}40`);
    botPin.setAttribute('stroke', color);
    botPin.setAttribute('stroke-width', String(pinStroke));
    innerG.appendChild(botPin);
    // Left
    const leftPin = document.createElementNS(SVG_NS, 'rect');
    leftPin.setAttribute('x', String(-half - PIN_LENGTH));
    leftPin.setAttribute('y', String(t - pinW / 2));
    leftPin.setAttribute('width', String(PIN_LENGTH));
    leftPin.setAttribute('height', String(pinW));
    leftPin.setAttribute('rx', '1');
    leftPin.setAttribute('fill', `${color}40`);
    leftPin.setAttribute('stroke', color);
    leftPin.setAttribute('stroke-width', String(pinStroke));
    innerG.appendChild(leftPin);
    // Right
    const rightPin = document.createElementNS(SVG_NS, 'rect');
    rightPin.setAttribute('x', String(half));
    rightPin.setAttribute('y', String(t - pinW / 2));
    rightPin.setAttribute('width', String(PIN_LENGTH));
    rightPin.setAttribute('height', String(pinW));
    rightPin.setAttribute('rx', '1');
    rightPin.setAttribute('fill', `${color}40`);
    rightPin.setAttribute('stroke', color);
    rightPin.setAttribute('stroke-width', String(pinStroke));
    innerG.appendChild(rightPin);
  }

  // ── Label below
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(half + LABEL_DEFAULTS.offsetBelow));
    label.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
