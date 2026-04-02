/**
 * @preplai/illustrations — StepList Component (Cinematic Depth)
 * Numbered steps + connecting lines
 *
 * Cinematic Depth: directional lighting halo, ground shadow, ambient occlusion,
 * specular highlight on step circles, micro-life float animation.
 *
 * Layout in design units; uniform scale transform so size changes scale the whole illustration.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam, wrapBodyText } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  STROKE,
} from '../design-tokens.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

/* ── Design-space constants (before scale) ─────────────────────── */
const NUM_R = 14;              // circle radius for step number
const LEFT_X = -80;            // circle center X
const TEXT_LEFT = LEFT_X + NUM_R + 16;  // text start X
const STEP_GAP = 12;           // min gap between rows
const STEP_FONT = 8;           // step description font size (design units)
const NUM_FONT = 7;            // number inside circle
const TITLE_FONT = 10;         // title above list
const LINE_H = STEP_FONT * 1.45; // line height for wrapped text
const MAX_CHARS = 26;          // max chars per line before wrap

/** Wrap text into lines (delegates to canonical wrapBodyText, capped at 3 lines). */
function wrapText(text: string, maxChars: number): string[] {
  return wrapBodyText(text, maxChars, 3).lines;
}

export function renderStepList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('StepList');
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const steps = (meta.steps as string[]) ??
    (entity.textContent ? entity.textContent.split('\n') : ['Step 1', 'Step 2', 'Step 3']);
  const visibleSteps = steps.slice(0, 5);
  const currentStep = typeof meta.currentStep === 'number' ? meta.currentStep : -1;
  const checkmarks = meta.checkmarks === true;

  const scale = s / 50;
  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────
  const haloId = `step-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────
  const gsId = `step-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const g1 = document.createElementNS(SVG_NS, 'stop');
    g1.setAttribute('offset', '0%'); g1.setAttribute('stop-color', '#000000'); g1.setAttribute('stop-opacity', '0.18');
    const g2 = document.createElementNS(SVG_NS, 'stop');
    g2.setAttribute('offset', '100%'); g2.setAttribute('stop-color', '#000000'); g2.setAttribute('stop-opacity', '0');
    gsg.appendChild(g1); gsg.appendChild(g2);
    defs.appendChild(gsg);
  }

  // ── Pillar 3: Ambient Occlusion (applied per circle) ──────────────
  const aoId = `step-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const a1 = document.createElementNS(SVG_NS, 'stop');
    a1.setAttribute('offset', '0%'); a1.setAttribute('stop-color', '#000000'); a1.setAttribute('stop-opacity', '0.10');
    const a2 = document.createElementNS(SVG_NS, 'stop');
    a2.setAttribute('offset', '100%'); a2.setAttribute('stop-color', '#000000'); a2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(a1); aoGrad.appendChild(a2);
    defs.appendChild(aoGrad);
  }

  // ── Pillar 4: Specular Highlight (applied per circle) ─────────────
  const specId = `step-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }

  // Pre-compute wrapped lines for each step to determine row heights
  const stepData = visibleSteps.map((step) => {
    const lines = wrapText(step, MAX_CHARS);
    const textBlockH = lines.length * LINE_H;
    const rowH = Math.max(NUM_R * 2 + 4, textBlockH + 6);
    return { lines, rowH };
  });

  // Compute Y positions (centered vertically)
  const totalH = stepData.reduce((sum, d, i) =>
    sum + d.rowH + (i < stepData.length - 1 ? STEP_GAP : 0), 0);
  const stepYs: number[] = [];
  let cumY = -totalH / 2 + stepData[0].rowH / 2;
  for (let i = 0; i < stepData.length; i++) {
    stepYs.push(cumY);
    if (i < stepData.length - 1) {
      cumY += stepData[i].rowH / 2 + STEP_GAP + stepData[i + 1].rowH / 2;
    }
  }

  // Directional halo behind everything
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(LEFT_X - 10));
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(80));
  halo.setAttribute('ry', String(totalH * 0.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  scaleGroup.appendChild(halo);

  // Ground shadow at bottom
  const lastY = stepYs[stepYs.length - 1];
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(lastY + NUM_R + 8));
  groundShadow.setAttribute('rx', String(70));
  groundShadow.setAttribute('ry', String(6));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  scaleGroup.appendChild(groundShadow);

  visibleSteps.forEach((_step, i) => {
    const y = stepYs[i];
    const { lines } = stepData[i];
    const isCompleted = checkmarks && currentStep >= 0 && i < currentStep;
    const isCurrent = currentStep >= 0 && i === currentStep;
    const isFuture = currentStep >= 0 && i > currentStep;

    // ── Connecting line to previous step ──
    if (i > 0) {
      const prevY = stepYs[i - 1];
      const conn = document.createElementNS(SVG_NS, 'line');
      conn.setAttribute('x1', String(LEFT_X));
      conn.setAttribute('y1', String(prevY + NUM_R + 2));
      conn.setAttribute('x2', String(LEFT_X));
      conn.setAttribute('y2', String(y - NUM_R - 2));
      conn.setAttribute('stroke', color);
      conn.setAttribute('stroke-width', String(STROKE.thin));
      conn.setAttribute('opacity', isCompleted || isCurrent ? '0.6' : '0.25');
      if (isFuture) {
        conn.setAttribute('stroke-dasharray', '4 4');
      }
      scaleGroup.appendChild(conn);
    }

    // ── Circle ──
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(LEFT_X));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(NUM_R));

    if (isCompleted) {
      circle.setAttribute('fill', color);
      circle.setAttribute('opacity', '0.85');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(STROKE.thin));
    } else if (isCurrent) {
      circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(getStrokeWidth('selected', 1)));
    } else {
      circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(STROKE.thin));
      if (isFuture) {
        circle.setAttribute('opacity', '0.5');
      }
    }
    scaleGroup.appendChild(circle);

    // AO overlay on circle
    const aoCircle = document.createElementNS(SVG_NS, 'circle');
    aoCircle.setAttribute('cx', String(LEFT_X));
    aoCircle.setAttribute('cy', String(y));
    aoCircle.setAttribute('r', String(NUM_R));
    aoCircle.setAttribute('fill', `url(#${aoId})`);
    aoCircle.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(aoCircle);

    // Specular overlay on circle
    const specCircle = document.createElementNS(SVG_NS, 'circle');
    specCircle.setAttribute('cx', String(LEFT_X));
    specCircle.setAttribute('cy', String(y));
    specCircle.setAttribute('r', String(NUM_R));
    specCircle.setAttribute('fill', `url(#${specId})`);
    specCircle.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(specCircle);

    // ── Number or checkmark inside circle ──
    if (isCompleted) {
      const check = document.createElementNS(SVG_NS, 'path');
      check.setAttribute('d', `M ${LEFT_X - 5} ${y} L ${LEFT_X - 1.5} ${y + 4} L ${LEFT_X + 6} ${y - 4}`);
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', '#ffffff');
      check.setAttribute('stroke-width', String(STROKE.emphasized));
      check.setAttribute('stroke-linecap', 'round');
      check.setAttribute('stroke-linejoin', 'round');
      scaleGroup.appendChild(check);
    } else {
      const num = document.createElementNS(SVG_NS, 'text');
      num.setAttribute('x', String(LEFT_X));
      num.setAttribute('y', String(y + NUM_FONT * 0.35));
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('fill', color);
      num.setAttribute('font-size', String(NUM_FONT));
      num.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      num.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      if (isFuture) {
        num.setAttribute('opacity', '0.5');
      }
      num.textContent = String(i + 1);
      scaleGroup.appendChild(num);
    }

    // ── Step text ──
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(TEXT_LEFT));
    text.setAttribute('y', String(y));
    text.setAttribute('text-anchor', 'start');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(STEP_FONT));
    text.setAttribute('font-weight', String(isCurrent ? TYPOGRAPHY.fontWeightEmphasis : TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    if (isFuture) {
      text.setAttribute('opacity', '0.5');
    }

    if (lines.length === 1) {
      text.setAttribute('dominant-baseline', 'central');
      text.textContent = lines[0];
    } else {
      const firstLineY = y - ((lines.length - 1) * LINE_H) / 2;
      lines.forEach((line, li) => {
        const tspan = document.createElementNS(SVG_NS, 'tspan');
        tspan.setAttribute('x', String(TEXT_LEFT));
        tspan.setAttribute('y', String(firstLineY + li * LINE_H));
        tspan.textContent = line;
        text.appendChild(tspan);
      });
    }
    scaleGroup.appendChild(text);
  });

  // ── Title above ──
  if (entity.label) {
    const topY = stepYs[0];
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', String(TEXT_LEFT));
    title.setAttribute('y', String(topY - NUM_R - 16));
    title.setAttribute('text-anchor', 'start');
    title.setAttribute('fill', color);
    title.setAttribute('font-size', String(TITLE_FONT));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    scaleGroup.appendChild(title);
  }

  innerG.appendChild(scaleGroup);

  // ── Pillar 5: Micro-Life (float animation) ────────────────────────
  const styleId = `step-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes stepFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-1.5px); }
      }
      .step-float-${entityId} {
        animation: stepFloat_${entityId} 4s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`step-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
