/**
 * @preplai/illustrations — LoadBalancer Component (Glassmorphic Depth)
 *
 * A crystalline traffic routing hub. Rotated diamond (45° rounded rect) with
 * glow border, flow visualization: entry dot → center → 3-way fan-out.
 * Use for: load balancers, traffic distribution, reverse proxies.
 *
 * Glassmorphic Depth: radial gradient fill, luminous glow border,
 * glowing entry dot, 3-way branching flow with output nodes, pulse ring.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderLoadBalancer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = s * 0.45;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `lb-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hhs1 = document.createElementNS(SVG_NS, 'stop');
    hhs1.setAttribute('offset', '0%');
    hhs1.setAttribute('stop-color', color);
    hhs1.setAttribute('stop-opacity', '0.13');
    const hhs2 = document.createElementNS(SVG_NS, 'stop');
    hhs2.setAttribute('offset', '100%');
    hhs2.setAttribute('stop-color', color);
    hhs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hhs1); haloGrad.appendChild(hhs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-r * 0.12));
  halo.setAttribute('cy', String(-r * 0.08));
  halo.setAttribute('rx', String(r * 1.8));
  halo.setAttribute('ry', String(r * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Ground contact shadow ───────────────────────────────────────────
  const groundShadowId = `lb-gshadow-${entityId}`;
  if (!defs.querySelector(`#${groundShadowId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', groundShadowId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%'); gs1.setAttribute('stop-color', '#000000'); gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%'); gs2.setAttribute('stop-color', '#000000'); gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1); gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(r * 1.05));
  groundShadow.setAttribute('rx', String(r * 0.85));
  groundShadow.setAttribute('ry', String(r * 0.16));
  groundShadow.setAttribute('fill', `url(#${groundShadowId})`);
  innerG.appendChild(groundShadow);

  // ── Ambient occlusion ───────────────────────────────────────────────
  const aoId = `lb-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '60%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.12');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }

  // ── Gradient IDs (unique per instance) ──────────────────────────────
  const diamondFillGradId = `lb-fill-${entityId}`;
  const diamondBorderGradId = `lb-border-${entityId}`;
  const glowFilterId = `lb-glow-${entityId}`;
  const nodeGlowFilterId = `lb-nodeglow-${entityId}`;
  const centerDotGradId = `lb-cdot-${entityId}`;

  // Diamond fill: radial gradient (slightly lit center → dark edges)
  if (!defs.querySelector(`#${diamondFillGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', diamondFillGradId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '40%');
    grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.45');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.15');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Border gradient (luminous diagonal — bright top-left → dim bottom-right)
  if (!defs.querySelector(`#${diamondBorderGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', diamondBorderGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', colorWithAlpha(color, 'ee'));
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', colorWithAlpha(color, '44'));
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Outer glow filter (for diamond + highlight ring)
  if (!defs.querySelector(`#${glowFilterId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', glowFilterId);
    filter.setAttribute('x', '-30%'); filter.setAttribute('y', '-30%');
    filter.setAttribute('width', '160%'); filter.setAttribute('height', '160%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '5');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '0.7');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // Node glow filter (for entry dot + output nodes)
  if (!defs.querySelector(`#${nodeGlowFilterId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', nodeGlowFilterId);
    filter.setAttribute('x', '-100%'); filter.setAttribute('y', '-100%');
    filter.setAttribute('width', '300%'); filter.setAttribute('height', '300%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '3');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '1');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // Center dot radial gradient (white center → color → transparent)
  if (!defs.querySelector(`#${centerDotGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', centerDotGradId);
    [['0%', '#ffffff', '0.95'], ['60%', color, '0.7'], ['100%', color, '0']].forEach(([off, col, op]) => {
      const st = document.createElementNS(SVG_NS, 'stop');
      st.setAttribute('offset', off);
      st.setAttribute('stop-color', col);
      st.setAttribute('stop-opacity', op);
      grad.appendChild(st);
    });
    defs.appendChild(grad);
  }

  // ── Diamond dimensions ──────────────────────────────────────────────
  const diamondSize = r * 1.2;
  const cornerRadius = r * 0.25;
  const halfDiamond = diamondSize / 2;

  // ── Highlight glow ring ──────────────────────────────────────────────
  if (entity.highlight) {
    const glowDiamond = document.createElementNS(SVG_NS, 'rect');
    const glowSize = diamondSize + 10;
    const glowHalf = glowSize / 2;
    glowDiamond.setAttribute('x', String(-glowHalf));
    glowDiamond.setAttribute('y', String(-glowHalf));
    glowDiamond.setAttribute('width', String(glowSize));
    glowDiamond.setAttribute('height', String(glowSize));
    glowDiamond.setAttribute('rx', String(cornerRadius + 2));
    glowDiamond.setAttribute('ry', String(cornerRadius + 2));
    glowDiamond.setAttribute('transform', 'rotate(45)');
    glowDiamond.setAttribute('stroke-width', String(STROKE.default));
    glowDiamond.setAttribute('stroke-dasharray', '4,4');
    glowDiamond.setAttribute('filter', `url(#${glowFilterId})`);
    applyGlowColors(glowDiamond, cc);
    innerG.appendChild(glowDiamond);
  }

  // ── Diamond fill (radial gradient glass) + outer glow shadow ────────
  const glassUrl = ensureGlassFilter(parentEl);
  const diamondFill = document.createElementNS(SVG_NS, 'rect');
  diamondFill.setAttribute('x', String(-halfDiamond));
  diamondFill.setAttribute('y', String(-halfDiamond));
  diamondFill.setAttribute('width', String(diamondSize));
  diamondFill.setAttribute('height', String(diamondSize));
  diamondFill.setAttribute('rx', String(cornerRadius));
  diamondFill.setAttribute('ry', String(cornerRadius));
  diamondFill.setAttribute('transform', 'rotate(45)');
  diamondFill.setAttribute('fill', `url(#${diamondFillGradId})`);
  diamondFill.setAttribute('stroke', 'none');
  diamondFill.setAttribute('filter', `url(#${glowFilterId})`);
  innerG.appendChild(diamondFill);

  // Glass overlay on diamond
  const glassDiamond = document.createElementNS(SVG_NS, 'rect');
  glassDiamond.setAttribute('x', String(-halfDiamond));
  glassDiamond.setAttribute('y', String(-halfDiamond));
  glassDiamond.setAttribute('width', String(diamondSize));
  glassDiamond.setAttribute('height', String(diamondSize));
  glassDiamond.setAttribute('rx', String(cornerRadius));
  glassDiamond.setAttribute('ry', String(cornerRadius));
  glassDiamond.setAttribute('transform', 'rotate(45)');
  glassDiamond.setAttribute('fill', 'none');
  glassDiamond.setAttribute('filter', glassUrl);
  glassDiamond.setAttribute('pointer-events', 'none');
  innerG.appendChild(glassDiamond);

  // ── Ambient occlusion overlay on diamond ────────────────────────────
  const aoDiamond = document.createElementNS(SVG_NS, 'rect');
  aoDiamond.setAttribute('x', String(-halfDiamond));
  aoDiamond.setAttribute('y', String(-halfDiamond));
  aoDiamond.setAttribute('width', String(diamondSize));
  aoDiamond.setAttribute('height', String(diamondSize));
  aoDiamond.setAttribute('rx', String(cornerRadius));
  aoDiamond.setAttribute('ry', String(cornerRadius));
  aoDiamond.setAttribute('transform', 'rotate(45)');
  aoDiamond.setAttribute('fill', `url(#${aoId})`);
  aoDiamond.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoDiamond);

  // ── Material texture: 3 subtle diagonal facet lines ─────────────────
  for (let i = 0; i < 3; i++) {
    const offset = -r * 0.35 + (r * 0.35) * i;
    const facet = document.createElementNS(SVG_NS, 'line');
    facet.setAttribute('x1', String(offset - r * 0.3));
    facet.setAttribute('y1', String(-r * 0.5));
    facet.setAttribute('x2', String(offset + r * 0.3));
    facet.setAttribute('y2', String(r * 0.5));
    facet.setAttribute('stroke', '#ffffff');
    facet.setAttribute('stroke-width', '0.5');
    facet.setAttribute('stroke-opacity', '0.04');
    facet.setAttribute('pointer-events', 'none');
    innerG.appendChild(facet);
  }

  // ── Diamond border (gradient stroke — luminous edge) ────────────────
  const diamondBorder = document.createElementNS(SVG_NS, 'rect');
  diamondBorder.setAttribute('x', String(-halfDiamond));
  diamondBorder.setAttribute('y', String(-halfDiamond));
  diamondBorder.setAttribute('width', String(diamondSize));
  diamondBorder.setAttribute('height', String(diamondSize));
  diamondBorder.setAttribute('rx', String(cornerRadius));
  diamondBorder.setAttribute('ry', String(cornerRadius));
  diamondBorder.setAttribute('transform', 'rotate(45)');
  diamondBorder.setAttribute('fill', 'none');
  diamondBorder.setAttribute('stroke', `url(#${diamondBorderGradId})`);
  diamondBorder.setAttribute('stroke-width', String(STROKE.emphasized));
  diamondBorder.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(diamondBorder);

  // ── Pulse ring around diamond ───────────────────────────────────────
  const pulseR = r * 0.7;
  const pulseRing = document.createElementNS(SVG_NS, 'circle');
  pulseRing.setAttribute('cx', '0');
  pulseRing.setAttribute('cy', '0');
  pulseRing.setAttribute('r', String(pulseR));
  pulseRing.setAttribute('fill', 'none');
  pulseRing.setAttribute('stroke', color);
  pulseRing.setAttribute('stroke-width', '1.5');
  pulseRing.setAttribute('opacity', '0.4');
  pulseRing.setAttribute('id', `lbPulse_${entityId}`);
  innerG.appendChild(pulseRing);

  // ── Glowing center dot ──────────────────────────────────────────────
  const centerDotR = r * 0.2;
  const centerDot = document.createElementNS(SVG_NS, 'circle');
  centerDot.setAttribute('cx', '0');
  centerDot.setAttribute('cy', '0');
  centerDot.setAttribute('r', String(centerDotR));
  centerDot.setAttribute('fill', `url(#${centerDotGradId})`);
  centerDot.setAttribute('filter', `url(#${nodeGlowFilterId})`);
  centerDot.setAttribute('id', `lbCenter_${entityId}`);
  innerG.appendChild(centerDot);

  // ── Flow visualization: input dot → center → 3-way fan-out ─────────
  const inputY = -r * 1.1;
  const nodeR = 4;

  // Output positions (relative to center)
  const outLeft = { x: -r * 0.8, y: r * 0.9 };
  const outCenter = { x: 0, y: r * 1.1 };
  const outRight = { x: r * 0.8, y: r * 0.9 };

  // Input line (top down to center)
  const lineIn = document.createElementNS(SVG_NS, 'line');
  lineIn.setAttribute('x1', '0');
  lineIn.setAttribute('y1', String(inputY + nodeR + 1));
  lineIn.setAttribute('x2', '0');
  lineIn.setAttribute('y2', '0');
  lineIn.setAttribute('stroke', cc.stroke);
  lineIn.setAttribute('stroke-width', String(STROKE.emphasized));
  lineIn.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineIn);

  // Input dot (glowing) at top
  const inputDot = document.createElementNS(SVG_NS, 'circle');
  inputDot.setAttribute('cx', '0');
  inputDot.setAttribute('cy', String(inputY));
  inputDot.setAttribute('r', String(nodeR + 1));
  inputDot.setAttribute('fill', color);
  inputDot.setAttribute('filter', `url(#${nodeGlowFilterId})`);
  inputDot.setAttribute('id', `lbEntry_${entityId}`);
  innerG.appendChild(inputDot);

  // ── 3-way fan-out lines from center ─────────────────────────────────
  // Left diagonal
  const lineLeft = document.createElementNS(SVG_NS, 'line');
  lineLeft.setAttribute('x1', '0');
  lineLeft.setAttribute('y1', '0');
  lineLeft.setAttribute('x2', String(outLeft.x));
  lineLeft.setAttribute('y2', String(outLeft.y - nodeR));
  lineLeft.setAttribute('stroke', cc.strokeSoft);
  lineLeft.setAttribute('stroke-width', String(STROKE.default));
  lineLeft.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineLeft);

  // Center straight down
  const lineCtr = document.createElementNS(SVG_NS, 'line');
  lineCtr.setAttribute('x1', '0');
  lineCtr.setAttribute('y1', '0');
  lineCtr.setAttribute('x2', String(outCenter.x));
  lineCtr.setAttribute('y2', String(outCenter.y - nodeR));
  lineCtr.setAttribute('stroke', cc.strokeSoft);
  lineCtr.setAttribute('stroke-width', String(STROKE.default));
  lineCtr.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineCtr);

  // Right diagonal
  const lineRight = document.createElementNS(SVG_NS, 'line');
  lineRight.setAttribute('x1', '0');
  lineRight.setAttribute('y1', '0');
  lineRight.setAttribute('x2', String(outRight.x));
  lineRight.setAttribute('y2', String(outRight.y - nodeR));
  lineRight.setAttribute('stroke', cc.strokeSoft);
  lineRight.setAttribute('stroke-width', String(STROKE.default));
  lineRight.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineRight);

  // ── 3 output nodes (with glow) ──────────────────────────────────────
  for (const pos of [outLeft, outCenter, outRight]) {
    const node = document.createElementNS(SVG_NS, 'circle');
    node.setAttribute('cx', String(pos.x));
    node.setAttribute('cy', String(pos.y));
    node.setAttribute('r', String(nodeR));
    node.setAttribute('fill', colorWithAlpha(color, '44'));
    node.setAttribute('stroke', cc.strokeSoft);
    node.setAttribute('stroke-width', '1');
    node.setAttribute('filter', `url(#${nodeGlowFilterId})`);
    innerG.appendChild(node);
  }

  // ── Specular highlight on diamond ───────────────────────────────────
  const specId = `lb-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.15');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const spec = document.createElementNS(SVG_NS, 'ellipse');
  spec.setAttribute('cx', String(-r * 0.18));
  spec.setAttribute('cy', String(-r * 0.28));
  spec.setAttribute('rx', String(r * 0.4));
  spec.setAttribute('ry', String(r * 0.25));
  spec.setAttribute('fill', `url(#${specId})`);
  spec.setAttribute('pointer-events', 'none');
  innerG.appendChild(spec);

  // ── Animations: entry dot breathe + pulse ring expand ───────────────
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  const styleId = `lb-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes lbBreathe_${entityId} {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.5); }
      }
      @keyframes lbPulse_${entityId} {
        0% { r: ${pulseR}; opacity: 0.5; stroke-width: 2; }
        100% { r: ${pulseR * 2.2}; opacity: 0; stroke-width: 0.5; }
      }
      @keyframes lbCenterGlow_${entityId} {
        0%, 100% { opacity: 0.7; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.25); }
      }
      #lbEntry_${entityId} {
        transform-origin: 0px ${inputY}px;
        animation: lbBreathe_${entityId} 2s ease-in-out infinite;
      }
      #lbPulse_${entityId} { animation: lbPulse_${entityId} 2.5s ease-out infinite; }
      #lbCenter_${entityId} { animation: lbCenterGlow_${entityId} 2s ease-in-out infinite; }
    `;
    svg.prepend(style);
  }

  // ── Label below ──────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
