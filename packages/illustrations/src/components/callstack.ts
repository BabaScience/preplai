/**
 * @preplai/illustrations — CallStack Component (Cinematic Depth)
 *
 * Vertical stack of stack frames (function name + optional locals).
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (frame breathe + stack float).
 *
 * Metadata: { frames: [{ name, locals? }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface StackFrame {
  name: string;
  locals?: string;
}

export function renderCallStack(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const _scale = size / 50;
  const labelFontSize = TYPOGRAPHY.fontSizeValue;
  const sublabelFontSize = TYPOGRAPHY.fontSizeBadge;

  const meta = entity.metadata ?? {};
  const framesData = meta.frames as StackFrame[] | undefined;
  const frames: StackFrame[] = framesData ?? [
    { name: 'main()' },
    { name: 'processRequest()', locals: 'req, res' },
    { name: 'handleQuery()', locals: 'sql' },
  ];

  const blockWidth = size * 2.8;
  const blockHeight = 28;
  const gap = 6;
  const totalH = frames.length * blockHeight + (frames.length - 1) * gap;
  const startY = -totalH / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `cstack-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', haloId);
    g.setAttribute('cx', '38%'); g.setAttribute('cy', '38%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const halo = document.createElementNS(SVG_NS, 'rect');
  halo.setAttribute('x', String(-blockWidth / 2 - 10));
  halo.setAttribute('y', String(startY - 10));
  halo.setAttribute('width', String(blockWidth + 20));
  halo.setAttribute('height', String(totalH + 20));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `cstack-gs-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', gsId);
    g.setAttribute('cx', '50%'); g.setAttribute('cy', '50%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const gs = document.createElementNS(SVG_NS, 'ellipse');
  gs.setAttribute('cx', '0');
  gs.setAttribute('cy', String(totalH / 2 + 6));
  gs.setAttribute('rx', String(blockWidth * 0.4));
  gs.setAttribute('ry', String(totalH * 0.05));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `cstack-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', aoId);
    g.setAttribute('cx', '70%'); g.setAttribute('cy', '75%'); g.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `cstack-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', specId);
    g.setAttribute('cx', '35%'); g.setAttribute('cy', '25%'); g.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }

  // ── Highlight glow ─────────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-blockWidth / 2 - 4));
    glow.setAttribute('y', String(startY - 4));
    glow.setAttribute('width', String(blockWidth + 8));
    glow.setAttribute('height', String(totalH + 8));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Frames ─────────────────────────────────────────────────────────
  frames.forEach((frame, i) => {
    const x = 0;
    const y = startY + i * (blockHeight + gap) + blockHeight / 2;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - blockWidth / 2));
    rect.setAttribute('y', String(y - blockHeight / 2));
    rect.setAttribute('width', String(blockWidth));
    rect.setAttribute('height', String(blockHeight));
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', cc.fill);
    rect.setAttribute('stroke', cc.stroke);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    // AO overlay on frame
    const aoOverlay = document.createElementNS(SVG_NS, 'rect');
    aoOverlay.setAttribute('x', String(x - blockWidth / 2));
    aoOverlay.setAttribute('y', String(y - blockHeight / 2));
    aoOverlay.setAttribute('width', String(blockWidth));
    aoOverlay.setAttribute('height', String(blockHeight));
    aoOverlay.setAttribute('rx', '4');
    aoOverlay.setAttribute('fill', `url(#${aoId})`);
    aoOverlay.setAttribute('pointer-events', 'none');
    innerG.appendChild(aoOverlay);

    // Specular on frame
    const specRect = document.createElementNS(SVG_NS, 'rect');
    specRect.setAttribute('x', String(x - blockWidth / 2));
    specRect.setAttribute('y', String(y - blockHeight / 2));
    specRect.setAttribute('width', String(blockWidth));
    specRect.setAttribute('height', String(blockHeight * 0.45));
    specRect.setAttribute('rx', '4');
    specRect.setAttribute('fill', `url(#${specId})`);
    specRect.setAttribute('pointer-events', 'none');
    innerG.appendChild(specRect);

    // Truncate label
    const approxCharWidth = labelFontSize * 0.6;
    const maxChars = Math.max(5, Math.floor((blockWidth - 16) / approxCharWidth));
    const displayLabel = frame.name.length > maxChars ? frame.name.slice(0, maxChars - 3) + '...' : frame.name;

    const hasSub = !!frame.locals;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(hasSub ? y - 2 : y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(labelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = displayLabel;
    innerG.appendChild(text);

    if (frame.locals) {
      const subApproxCharWidth = sublabelFontSize * 0.6;
      const subMaxChars = Math.max(5, Math.floor((blockWidth - 16) / subApproxCharWidth));
      const displaySub = frame.locals.length > subMaxChars ? frame.locals.slice(0, subMaxChars - 3) + '...' : frame.locals;

      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('x', String(x));
      sub.setAttribute('y', String(y + 5));
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', cc.textSecondary);
      sub.setAttribute('font-size', String(sublabelFontSize));
      sub.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      sub.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      sub.textContent = displaySub;
      innerG.appendChild(sub);
    }
  });

  // ── Pillar 5: Micro-Life ───────────────────────────────────────────
  const styleId = `cstack-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cstackFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes cstackBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .cstack-float-${entityId} {
        animation: cstackFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`cstack-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
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
