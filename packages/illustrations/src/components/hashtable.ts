/**
 * @preplai/illustrations — HashTable Component (Cinematic Depth)
 *
 * Hash function box h(k) + arrow + indexed buckets.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (hash scatter + bucket pulse + float).
 *
 * Metadata: { pairs: [string, string][], cols?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderHashTable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const pairs = ((meta.pairs as [string, string][]) ?? [['a', '1'], ['b', '2'], ['k', 'v']]).slice(0, 8);

  // Layout: hash box on left, arrow, buckets on right
  const bucketH = 18 * scale;
  const bucketW = 40 * scale;
  const bucketGap = 3 * scale;
  const totalBucketH = pairs.length * (bucketH + bucketGap) - bucketGap;
  const hashBoxW = 30 * scale;
  const hashBoxH = 24 * scale;
  const arrowLen = 16 * scale;
  const layoutW = hashBoxW + arrowLen + bucketW;
  const hashBoxX = -layoutW / 2;
  const bucketsX = hashBoxX + hashBoxW + arrowLen;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `ht-halo-${entityId}`;
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
  const haloEl = document.createElementNS(SVG_NS, 'ellipse');
  haloEl.setAttribute('cx', String(-layoutW * 0.1));
  haloEl.setAttribute('cy', String(-size * 0.05));
  haloEl.setAttribute('rx', String(layoutW * 0.65));
  haloEl.setAttribute('ry', String(totalBucketH * 0.55));
  haloEl.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(haloEl);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `ht-gs-${entityId}`;
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
  const gsEl = document.createElementNS(SVG_NS, 'ellipse');
  gsEl.setAttribute('cx', '0');
  gsEl.setAttribute('cy', String(totalBucketH / 2 + bucketH * 0.3));
  gsEl.setAttribute('rx', String(layoutW * 0.5));
  gsEl.setAttribute('ry', String(bucketH * 0.3));
  gsEl.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gsEl);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `ht-ao-${entityId}`;
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
  const aoEl = document.createElementNS(SVG_NS, 'rect');
  aoEl.setAttribute('x', String(-layoutW / 2));
  aoEl.setAttribute('y', String(-totalBucketH / 2));
  aoEl.setAttribute('width', String(layoutW));
  aoEl.setAttribute('height', String(totalBucketH));
  aoEl.setAttribute('fill', `url(#${aoId})`);
  aoEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoEl);

  // ── Body gradients ──────────────────────────────────────────────────
  const bodyFillId = `ht-bf-${entityId}`;
  if (!defs.querySelector(`#${bodyFillId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', bodyFillId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const bodyStrokeId = `ht-bst-${entityId}`;
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const g = document.createElementNS(SVG_NS, 'linearGradient');
    g.setAttribute('id', bodyStrokeId);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%'); g.setAttribute('x2', '100%'); g.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-layoutW / 2 - 3));
    glow.setAttribute('y', String(-totalBucketH / 2 - 3));
    glow.setAttribute('width', String(layoutW + 6));
    glow.setAttribute('height', String(totalBucketH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Hash function box ───────────────────────────────────────────────
  const hbx = hashBoxX;
  const hby = -hashBoxH / 2;
  const hashBox = document.createElementNS(SVG_NS, 'rect');
  hashBox.setAttribute('x', String(hbx));
  hashBox.setAttribute('y', String(hby));
  hashBox.setAttribute('width', String(hashBoxW));
  hashBox.setAttribute('height', String(hashBoxH));
  hashBox.setAttribute('rx', String(3 * scale));
  hashBox.setAttribute('fill', `url(#${bodyFillId})`);
  hashBox.setAttribute('stroke', `url(#${bodyStrokeId})`);
  hashBox.setAttribute('stroke-width', String(STROKE.default));
  hashBox.classList.add(`ht-hash-${entityId}`);
  innerG.appendChild(hashBox);

  const hashLabel = document.createElementNS(SVG_NS, 'text');
  hashLabel.setAttribute('x', String(hbx + hashBoxW / 2));
  hashLabel.setAttribute('y', String(4 * scale));
  hashLabel.setAttribute('text-anchor', 'middle');
  hashLabel.setAttribute('fill', cc.textPrimary);
  hashLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.85));
  hashLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
  hashLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  hashLabel.textContent = 'h(k)';
  innerG.appendChild(hashLabel);

  // ── Arrow from hash box to buckets ──────────────────────────────────
  const arrowMarkerId = `ht-am-${entityId}`;
  if (!defs.querySelector(`#${arrowMarkerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', arrowMarkerId);
    marker.setAttribute('markerWidth', '6'); marker.setAttribute('markerHeight', '4');
    marker.setAttribute('refX', '5'); marker.setAttribute('refY', '2');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '0 0, 6 2, 0 4');
    poly.setAttribute('fill', color);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }
  const arrow = document.createElementNS(SVG_NS, 'line');
  arrow.setAttribute('x1', String(hashBoxX + hashBoxW));
  arrow.setAttribute('y1', '0');
  arrow.setAttribute('x2', String(bucketsX));
  arrow.setAttribute('y2', '0');
  arrow.setAttribute('stroke', color);
  arrow.setAttribute('stroke-width', String(STROKE.default * 0.8));
  arrow.setAttribute('marker-end', `url(#${arrowMarkerId})`);
  innerG.appendChild(arrow);

  // ── Buckets ─────────────────────────────────────────────────────────
  pairs.forEach(([key, val], i) => {
    const by = -totalBucketH / 2 + i * (bucketH + bucketGap);

    // Index label
    const idxText = document.createElementNS(SVG_NS, 'text');
    idxText.setAttribute('x', String(bucketsX - 4 * scale));
    idxText.setAttribute('y', String(by + bucketH / 2 + 4 * scale));
    idxText.setAttribute('text-anchor', 'end');
    idxText.setAttribute('fill', cc.textSecondary);
    idxText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.65));
    idxText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    idxText.textContent = String(i);
    innerG.appendChild(idxText);

    const bucket = document.createElementNS(SVG_NS, 'rect');
    bucket.setAttribute('x', String(bucketsX));
    bucket.setAttribute('y', String(by));
    bucket.setAttribute('width', String(bucketW));
    bucket.setAttribute('height', String(bucketH));
    bucket.setAttribute('rx', String(2 * scale));
    bucket.setAttribute('fill', `url(#${bodyFillId})`);
    bucket.setAttribute('stroke', `url(#${bodyStrokeId})`);
    bucket.setAttribute('stroke-width', String(STROKE.default));
    bucket.classList.add(`ht-bucket-${entityId}`);
    bucket.style.animationDelay = `${i * 0.2}s`;
    innerG.appendChild(bucket);

    // Key:value text
    const kvText = document.createElementNS(SVG_NS, 'text');
    kvText.setAttribute('x', String(bucketsX + bucketW / 2));
    kvText.setAttribute('y', String(by + bucketH / 2 + 4 * scale));
    kvText.setAttribute('text-anchor', 'middle');
    kvText.setAttribute('fill', cc.textPrimary);
    kvText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.75));
    kvText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    kvText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    kvText.textContent = `${key.slice(0, 4)}:${val.slice(0, 4)}`;
    innerG.appendChild(kvText);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `ht-spec-${entityId}`;
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
  const specEl = document.createElementNS(SVG_NS, 'ellipse');
  specEl.setAttribute('cx', String(-layoutW * 0.1));
  specEl.setAttribute('cy', String(-totalBucketH * 0.3));
  specEl.setAttribute('rx', String(layoutW * 0.3));
  specEl.setAttribute('ry', String(totalBucketH * 0.2));
  specEl.setAttribute('fill', `url(#${specId})`);
  specEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(specEl);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `ht-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes htHashScatter_${entityId} {
        0%, 100% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.06) rotate(2deg); }
      }
      @keyframes htBucketPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      @keyframes htFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .ht-hash-${entityId} {
        animation: htHashScatter_${entityId} 2.5s ease-in-out infinite;
      }
      .ht-bucket-${entityId} {
        animation: htBucketPulse_${entityId} 2.2s ease-in-out infinite;
      }
      .ht-float-${entityId} {
        animation: htFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`ht-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalBucketH / 2 + LABEL_DEFAULTS.offsetBelow));
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
