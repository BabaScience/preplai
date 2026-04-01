/**
 * @preplai/illustrations — Cloud Component
 *
 * Clean cloud silhouette with atmospheric depth gradient fill.
 * Use for: cloud computing, SaaS, AWS/GCP/Azure, distributed systems.
 *
 * Visual depth: radial halo, gradient fills on bumps, white highlight.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

const CLOUD_ELLIPSES = [
  { cx: -0.18, cy: 0.02, rx: 0.28, ry: 0.20 },
  { cx: 0.06, cy: -0.08, rx: 0.34, ry: 0.24 },
  { cx: 0.22, cy: 0.04, rx: 0.24, ry: 0.18 },
];
const CLOUD_BASE = { cx: 0.02, cy: 0.14, rx: 0.38, ry: 0.10 };

export function renderCloud(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `cloud-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '60%');
    grad.setAttribute('r', '55%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    grad.appendChild(hs1); grad.appendChild(hs2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(0.04 * s));
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(s * 0.75));
  halo.setAttribute('ry', String(s * 0.55));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Depth gradient for cloud fill ────────────────────────────────────
  const cloudDepthId = `cloudDepth_${entityId}`;
  if (!defs.querySelector(`#${cloudDepthId}`)) {
    const cloudDepthGrad = document.createElementNS(SVG_NS, 'radialGradient');
    cloudDepthGrad.setAttribute('id', cloudDepthId);
    cloudDepthGrad.setAttribute('cx', '50%'); cloudDepthGrad.setAttribute('cy', '60%');
    cloudDepthGrad.setAttribute('r', '55%');
    const cd1 = document.createElementNS(SVG_NS, 'stop');
    cd1.setAttribute('offset', '0%');
    cd1.setAttribute('stop-color', color);
    cd1.setAttribute('stop-opacity', '0.55');
    const cd2 = document.createElementNS(SVG_NS, 'stop');
    cd2.setAttribute('offset', '100%');
    cd2.setAttribute('stop-color', color);
    cd2.setAttribute('stop-opacity', '0.22');
    cloudDepthGrad.appendChild(cd1); cloudDepthGrad.appendChild(cd2);
    defs.appendChild(cloudDepthGrad);
  }

  // Highlight glow
  if (entity.highlight) {
    for (const e of CLOUD_ELLIPSES) {
      const el = document.createElementNS(SVG_NS, 'ellipse');
      el.setAttribute('cx', String(e.cx * s));
      el.setAttribute('cy', String(e.cy * s));
      el.setAttribute('rx', String((e.rx + 0.04) * s));
      el.setAttribute('ry', String((e.ry + 0.04) * s));
      el.setAttribute('stroke-width', String(STROKE.default));
      el.setAttribute('stroke-dasharray', '4,4');
      applyGlowColors(el, cc);
      innerG.appendChild(el);
    }
  }

  // Outer color glow on cloud shape
  const glowUrl = ensureGlowFilter(parentEl, color);

  // Cloud bumps with depth gradient fill
  for (let i = 0; i < CLOUD_ELLIPSES.length; i++) {
    const e = CLOUD_ELLIPSES[i];
    const el = document.createElementNS(SVG_NS, 'ellipse');
    el.setAttribute('cx', String(e.cx * s));
    el.setAttribute('cy', String(e.cy * s));
    el.setAttribute('rx', String(e.rx * s));
    el.setAttribute('ry', String(e.ry * s));
    el.setAttribute('fill', `url(#${cloudDepthId})`);
    el.setAttribute('stroke', cc.strokeSoft);
    el.setAttribute('stroke-width', String(STROKE.default));
    if (i === 0) {
      el.setAttribute('data-morph-target', 'true');
      el.setAttribute('filter', glowUrl);
    }
    innerG.appendChild(el);
  }

  // Flat base
  const base = document.createElementNS(SVG_NS, 'ellipse');
  base.setAttribute('cx', String(CLOUD_BASE.cx * s));
  base.setAttribute('cy', String(CLOUD_BASE.cy * s));
  base.setAttribute('rx', String(CLOUD_BASE.rx * s));
  base.setAttribute('ry', String(CLOUD_BASE.ry * s));
  base.setAttribute('fill', `url(#${cloudDepthId})`);
  base.setAttribute('stroke', 'none');
  innerG.appendChild(base);

  // White highlight on top-center bump
  const topBump = CLOUD_ELLIPSES[1]; // center-top bump
  const highlightLine = document.createElementNS(SVG_NS, 'ellipse');
  highlightLine.setAttribute('cx', String(topBump.cx * s));
  highlightLine.setAttribute('cy', String((topBump.cy - topBump.ry * 0.6) * s));
  highlightLine.setAttribute('rx', String(s * 0.10));
  highlightLine.setAttribute('ry', String(s * 0.04));
  highlightLine.setAttribute('fill', 'rgba(255,255,255,0.18)');
  innerG.appendChild(highlightLine);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + LABEL_DEFAULTS.offsetBelow));
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
