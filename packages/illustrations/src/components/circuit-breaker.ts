/**
 * @preplai/illustrations — CircuitBreaker Component
 *
 * Inline switch/breaker icon showing the circuit breaker pattern with 3 states.
 * Iconic microservices pattern: closed (healthy), open (tripped), half-open (testing).
 *
 * Metadata:
 *   state?:       "closed"|"open"|"half-open" — default "closed"
 *   failureRate?: string                      — e.g. "12%"
 *   threshold?:   string                      — e.g. "50%"
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
  COLORS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

// ── State color mapping ─────────────────────────────────────────────

const STATE_COLORS: Record<string, string> = {
  closed: COLORS.green,     // #00e676 — healthy
  open: COLORS.red,         // #ff6b6b — tripped
  'half-open': COLORS.orange, // #ffab00 — testing
};

const STATE_LABELS: Record<string, string> = {
  closed: 'CLOSED',
  open: 'OPEN',
  'half-open': 'HALF-OPEN',
};

export function renderCircuitBreaker(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('CircuitBreaker');

  const meta = (entity.metadata ?? {}) as Record<string, unknown>;
  const state = (meta.state as string) ?? 'closed';
  const failureRate = (meta.failureRate as string) ?? '';
  const threshold = (meta.threshold as string) ?? '';

  const stateColor = STATE_COLORS[state] ?? STATE_COLORS.closed;
  const stateLabel = STATE_LABELS[state] ?? STATE_LABELS.closed;

  // ── Dimensions ────────────────────────────────────────────────────
  const scale = size / 50;
  const r = 20 * scale;          // circle radius (~40px diameter base)
  const connDotR = 3 * scale;    // connection dot radius
  const strokeW = 2.5 * scale;
  const armLen = r * 0.8;        // switch arm length

  // ── Glow filter ───────────────────────────────────────────────────
  const defs = ensureDefs(parentEl);
  const filterId = `cb-glow-${entity.id.replace(/[^a-zA-Z0-9-]/g, '')}`;
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', filterId);
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');
  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', String(3 * scale));
  filter.appendChild(blur);
  defs.appendChild(filter);

  // ── Glow circle (behind main circle) ──────────────────────────────
  const glow = document.createElementNS(SVG_NS, 'circle');
  glow.setAttribute('cx', '0');
  glow.setAttribute('cy', '0');
  glow.setAttribute('r', String(r));
  glow.setAttribute('fill', stateColor);
  glow.setAttribute('opacity', '0.25');
  glow.setAttribute('filter', `url(#${filterId})`);
  innerG.appendChild(glow);

  // ── Main circle ───────────────────────────────────────────────────
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', colorWithAlpha(stateColor, '1A')); // ~10% opacity
  circle.setAttribute('stroke', stateColor);
  circle.setAttribute('stroke-width', String(strokeW));
  innerG.appendChild(circle);

  // ── Connection dots (left and right wire endpoints) ───────────────
  const dotLeft = document.createElementNS(SVG_NS, 'circle');
  dotLeft.setAttribute('cx', String(-r - connDotR * 2));
  dotLeft.setAttribute('cy', '0');
  dotLeft.setAttribute('r', String(connDotR));
  dotLeft.setAttribute('fill', stateColor);
  innerG.appendChild(dotLeft);

  const dotRight = document.createElementNS(SVG_NS, 'circle');
  dotRight.setAttribute('cx', String(r + connDotR * 2));
  dotRight.setAttribute('cy', '0');
  dotRight.setAttribute('r', String(connDotR));
  dotRight.setAttribute('fill', stateColor);
  innerG.appendChild(dotRight);

  // ── Wire stubs (lines from dots to circle edge) ───────────────────
  const wireLeft = document.createElementNS(SVG_NS, 'line');
  wireLeft.setAttribute('x1', String(-r - connDotR * 2));
  wireLeft.setAttribute('y1', '0');
  wireLeft.setAttribute('x2', String(-r));
  wireLeft.setAttribute('y2', '0');
  wireLeft.setAttribute('stroke', stateColor);
  wireLeft.setAttribute('stroke-width', String(STROKE.default * scale));
  innerG.appendChild(wireLeft);

  const wireRight = document.createElementNS(SVG_NS, 'line');
  wireRight.setAttribute('x1', String(r));
  wireRight.setAttribute('y1', '0');
  wireRight.setAttribute('x2', String(r + connDotR * 2));
  wireRight.setAttribute('y2', '0');
  wireRight.setAttribute('stroke', stateColor);
  wireRight.setAttribute('stroke-width', String(STROKE.default * scale));
  innerG.appendChild(wireRight);

  // ── Switch arm ────────────────────────────────────────────────────
  // The arm starts from the bottom of the circle interior and rotates:
  //   closed:    vertical (0deg) — line straight up
  //   open:      angled 45deg — break in the circuit
  //   half-open: angled ~20deg — partially reconnected
  let armAngleDeg = 0;
  if (state === 'open') armAngleDeg = -45;
  else if (state === 'half-open') armAngleDeg = -20;

  const armGroup = document.createElementNS(SVG_NS, 'g');
  // Pivot from bottom center of circle interior
  armGroup.setAttribute('transform', `rotate(${armAngleDeg}, 0, ${r * 0.4})`);

  const arm = document.createElementNS(SVG_NS, 'line');
  arm.setAttribute('x1', '0');
  arm.setAttribute('y1', String(r * 0.4));
  arm.setAttribute('x2', '0');
  arm.setAttribute('y2', String(r * 0.4 - armLen));
  arm.setAttribute('stroke', stateColor);
  arm.setAttribute('stroke-width', String(strokeW));
  arm.setAttribute('stroke-linecap', 'round');
  armGroup.appendChild(arm);

  // Small knob at the tip of the arm
  const knob = document.createElementNS(SVG_NS, 'circle');
  knob.setAttribute('cx', '0');
  knob.setAttribute('cy', String(r * 0.4 - armLen));
  knob.setAttribute('r', String(3 * scale));
  knob.setAttribute('fill', stateColor);
  armGroup.appendChild(knob);

  innerG.appendChild(armGroup);

  // ── State label (below circle) ────────────────────────────────────
  let yOffset = r + LABEL_DEFAULTS.offsetBelow * scale;

  const stateLabelEl = document.createElementNS(SVG_NS, 'text');
  stateLabelEl.setAttribute('x', '0');
  stateLabelEl.setAttribute('y', String(yOffset));
  stateLabelEl.setAttribute('text-anchor', 'middle');
  stateLabelEl.setAttribute('fill', stateColor);
  stateLabelEl.setAttribute('font-size', String(10 * scale));
  stateLabelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  stateLabelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  stateLabelEl.setAttribute('letter-spacing', '0.05em');
  stateLabelEl.textContent = stateLabel;
  innerG.appendChild(stateLabelEl);
  yOffset += 14 * scale;

  // ── Failure rate / threshold (below state label, dimmer) ──────────
  const infoText = failureRate || threshold;
  if (infoText) {
    const info = document.createElementNS(SVG_NS, 'text');
    info.setAttribute('x', '0');
    info.setAttribute('y', String(yOffset));
    info.setAttribute('text-anchor', 'middle');
    info.setAttribute('fill', color);
    info.setAttribute('opacity', '0.55');
    info.setAttribute('font-size', String(11 * scale));
    info.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    info.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    info.textContent = failureRate ? `Fail: ${failureRate}` : `Threshold: ${threshold}`;
    innerG.appendChild(info);
    yOffset += 14 * scale;
  }

  // ── Entity label (below everything, standard gap) ─────────────────
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(yOffset + 4 * scale));
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
