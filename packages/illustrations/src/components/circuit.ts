/**
 * @preplai/illustrations — Circuit Component
 *
 * Renders an electronic circuit diagram with battery, resistor, capacitor, bulb, switch.
 * Use for: physics (Ohm's law, RC circuits), electronics education.
 *
 * @see METADATA_SCHEMAS.md#circuit
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 *
 * Metadata:
 *   components: Array<{type: string, label?: string}> — types: battery|voltage|v|cell, resistor|r,
 *     capacitor|c, bulb|lamp|light, switch|s. Order = left-to-right layout.
 *   connections: Array<{from: number, to: number}> — indices into components; draws wires.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createDarkGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type CircuitComponent = { type: string; label?: string };
type CircuitConnection = { from: number; to: number };

const SPACING = 70;

function drawBattery(g: SVGGElement, x: number, y: number, size: number, color: string) {
  const h = size * 0.4;
  const w = size * 0.15;
  // Short line (negative)
  const l1 = document.createElementNS(SVG_NS, 'line');
  l1.setAttribute('x1', String(x - w));
  l1.setAttribute('y1', String(y));
  l1.setAttribute('x2', String(x + w));
  l1.setAttribute('y2', String(y));
  l1.setAttribute('stroke', color);
  l1.setAttribute('stroke-width', '2');
  g.appendChild(l1);
  // Long line (positive)
  const l2 = document.createElementNS(SVG_NS, 'line');
  l2.setAttribute('x1', String(x - w));
  l2.setAttribute('y1', String(y + h));
  l2.setAttribute('x2', String(x + w));
  l2.setAttribute('y2', String(y + h));
  l2.setAttribute('stroke', color);
  l2.setAttribute('stroke-width', '2');
  g.appendChild(l2);
  // Vertical connector
  const v = document.createElementNS(SVG_NS, 'line');
  v.setAttribute('x1', String(x));
  v.setAttribute('y1', String(y));
  v.setAttribute('x2', String(x));
  v.setAttribute('y2', String(y + h));
  v.setAttribute('stroke', color);
  v.setAttribute('stroke-width', '1.5');
  g.appendChild(v);
}

function drawResistor(g: SVGGElement, x: number, y: number, size: number, color: string) {
  const w = size * 0.5;
  const h = size * 0.15;
  const zigzag = document.createElementNS(SVG_NS, 'path');
  const d = `M ${x - w / 2} ${y} L ${x - w / 6} ${y - h} L ${x} ${y + h} L ${x + w / 6} ${y - h} L ${x + w / 2} ${y}`;
  zigzag.setAttribute('d', d);
  zigzag.setAttribute('fill', 'none');
  zigzag.setAttribute('stroke', color);
  zigzag.setAttribute('stroke-width', '2');
  zigzag.setAttribute('stroke-linecap', 'round');
  zigzag.setAttribute('stroke-linejoin', 'round');
  g.appendChild(zigzag);
}

function drawCapacitor(g: SVGGElement, x: number, y: number, size: number, color: string) {
  const h = size * 0.35;
  const gap = size * 0.08;
  const l1 = document.createElementNS(SVG_NS, 'line');
  l1.setAttribute('x1', String(x - h));
  l1.setAttribute('y1', String(y - gap / 2));
  l1.setAttribute('x2', String(x + h));
  l1.setAttribute('y2', String(y - gap / 2));
  l1.setAttribute('stroke', color);
  l1.setAttribute('stroke-width', '2');
  g.appendChild(l1);
  const l2 = document.createElementNS(SVG_NS, 'line');
  l2.setAttribute('x1', String(x - h));
  l2.setAttribute('y1', String(y + gap / 2));
  l2.setAttribute('x2', String(x + h));
  l2.setAttribute('y2', String(y + gap / 2));
  l2.setAttribute('stroke', color);
  l2.setAttribute('stroke-width', '2');
  g.appendChild(l2);
}

function drawBulb(g: SVGGElement, x: number, y: number, size: number, color: string) {
  const r = size * 0.2;
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', String(x));
  circle.setAttribute('cy', String(y));
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', '2');
  g.appendChild(circle);
  const x1 = document.createElementNS(SVG_NS, 'line');
  x1.setAttribute('x1', String(x - r * 0.7));
  x1.setAttribute('y1', String(y - r * 0.7));
  x1.setAttribute('x2', String(x + r * 0.7));
  x1.setAttribute('y2', String(y + r * 0.7));
  x1.setAttribute('stroke', color);
  x1.setAttribute('stroke-width', '1.5');
  g.appendChild(x1);
  const x2 = document.createElementNS(SVG_NS, 'line');
  x2.setAttribute('x1', String(x + r * 0.7));
  x2.setAttribute('y1', String(y - r * 0.7));
  x2.setAttribute('x2', String(x - r * 0.7));
  x2.setAttribute('y2', String(y + r * 0.7));
  x2.setAttribute('stroke', color);
  x2.setAttribute('stroke-width', '1.5');
  g.appendChild(x2);
}

function drawSwitch(g: SVGGElement, x: number, y: number, size: number, color: string, closed = true) {
  const d = size * 0.25;
  if (closed) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x - d));
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(x + d));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    g.appendChild(line);
  } else {
    const l1 = document.createElementNS(SVG_NS, 'line');
    l1.setAttribute('x1', String(x - d));
    l1.setAttribute('y1', String(y));
    l1.setAttribute('x2', String(x));
    l1.setAttribute('y2', String(y + d * 0.8));
    l1.setAttribute('stroke', color);
    l1.setAttribute('stroke-width', '2');
    g.appendChild(l1);
    const l2 = document.createElementNS(SVG_NS, 'line');
    l2.setAttribute('x1', String(x + d));
    l2.setAttribute('y1', String(y));
    l2.setAttribute('x2', String(x));
    l2.setAttribute('y2', String(y + d * 0.8));
    l2.setAttribute('stroke', color);
    l2.setAttribute('stroke-width', '2');
    g.appendChild(l2);
  }
}

function drawComponent(
  g: SVGGElement,
  comp: CircuitComponent,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const t = (comp.type || 'resistor').toLowerCase();
  if (t === 'battery' || t === 'voltage' || t === 'v' || t === 'cell') {
    drawBattery(g, x, y, size, color);
  } else if (t === 'resistor' || t === 'r') {
    drawResistor(g, x, y, size, color);
  } else if (t === 'capacitor' || t === 'c') {
    drawCapacitor(g, x, y, size, color);
  } else if (t === 'bulb' || t === 'lamp' || t === 'light') {
    drawBulb(g, x, y, size, color);
  } else if (t === 'switch' || t === 's') {
    drawSwitch(g, x, y, size, color, true);
  } else {
    drawResistor(g, x, y, size, color);
  }

  if (comp.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + size * 0.5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', `${color}cc`);
    text.setAttribute('font-size', String(Math.round(10 * (size / 50))));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = comp.label;
    g.appendChild(text);
  }
}

export function renderCircuit(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const meta = entity.metadata ?? {};
  const components = (meta.components as CircuitComponent[]) ?? [
    { type: 'battery', label: 'V' },
    { type: 'resistor', label: 'R' },
    { type: 'capacitor', label: 'C' },
  ];
  const connections = (meta.connections as CircuitConnection[]) ?? [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
  ];

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Circuit');
  const defs = ensureDefs(parentEl);
  const bgGradId = `grad-circuit-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createDarkGradient(bgGradId, defs, color);

  const n = components.length;
  const totalW = Math.max((n - 1) * SPACING, SPACING * 2);
  const totalH = s * 1.8;
  const startX = -totalW / 2;
  const cy = 0;

  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    positions.push({ x: startX + i * SPACING, y: cy });
  }

  // Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(-totalW / 2 - 20));
  bg.setAttribute('y', String(-totalH / 2));
  bg.setAttribute('width', String(totalW + 40));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', '8');
  bg.setAttribute('fill', `url(#${bgGradId})`);
  bg.setAttribute('stroke', color);
  bg.setAttribute('stroke-width', '1');
  innerG.appendChild(bg);

  // Wires (connections)
  const wireColor = `${color}99`;
  for (const conn of connections) {
    const a = positions[conn.from];
    const b = positions[conn.to];
    if (!a || !b) continue;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(a.x));
    line.setAttribute('y1', String(a.y));
    line.setAttribute('x2', String(b.x));
    line.setAttribute('y2', String(b.y));
    line.setAttribute('stroke', wireColor);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(line);
  }

  // Components (on top of wires)
  components.forEach((comp, i) => {
    const pos = positions[i];
    if (!pos) return;
    drawComponent(innerG, comp, pos.x, pos.y, s, color);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + 18));
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
