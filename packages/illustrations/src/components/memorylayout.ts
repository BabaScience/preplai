/**
 * @preplai/illustrations — MemoryLayout Component (Cinematic Depth)
 *
 * Stack and heap regions side by side with cinematic lighting treatment.
 *
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animation.
 *
 * Metadata: { stack: string[], heap: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import { stackLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMemoryLayout(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const stackData = (meta.stack as string[]) ?? ['main', 'foo()', 'bar()'];
  const heapData = (meta.heap as string[]) ?? ['obj1', 'arr', 'node'];

  const stackItems = stackData.slice(0, 6).map((l) => ({ label: l, sublabel: undefined }));
  const heapItems = heapData.slice(0, 6).map((l) => ({ label: l, sublabel: undefined }));

  const blockH = 24 * scale;
  const stackBlocks = stackLayout(stackItems, { blockWidth: s * 1.2, blockHeight: blockH, gap: 4 });
  const heapBlocks = stackLayout(heapItems, { blockWidth: s * 1.2, blockHeight: blockH, gap: 4 });

  const offsetX = s * 0.7;
  const bottomY = Math.max(
    stackBlocks.length ? stackBlocks[stackBlocks.length - 1].y + blockH / 2 : 0,
    heapBlocks.length ? heapBlocks[heapBlocks.length - 1].y + blockH / 2 : 0,
  );
  const topY = -s * 0.5 - 10;

  const labelFontSize = TYPOGRAPHY.fontSizeInline * scale;
  const blockFontSize = TYPOGRAPHY.fontSizeValue * scale;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `memlyt-halo-${entityId}`;
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
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(offsetX * 2));
  halo.setAttribute('ry', String(bottomY * 0.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `memlyt-gshadow-${entityId}`;
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
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(bottomY + blockH * 0.3));
  groundShadow.setAttribute('rx', String(offsetX * 1.2));
  groundShadow.setAttribute('ry', String(blockH * 0.35));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `memlyt-ao-${entityId}`;
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

  // ── Stack (left) ────────────────────────────────────────────────────
  const stackLabel = document.createElementNS(SVG_NS, 'text');
  stackLabel.setAttribute('x', String(-offsetX));
  stackLabel.setAttribute('y', String(topY));
  stackLabel.setAttribute('text-anchor', 'middle');
  stackLabel.setAttribute('fill', cc.textPrimary);
  stackLabel.setAttribute('font-size', String(labelFontSize));
  stackLabel.setAttribute('font-weight', '600');
  stackLabel.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  stackLabel.textContent = 'Stack';
  innerG.appendChild(stackLabel);

  stackBlocks.forEach(({ x, y, width, height, label }) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-offsetX + x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', cc.fill);
    rect.setAttribute('stroke', cc.stroke);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    // AO overlay
    const aoRect = document.createElementNS(SVG_NS, 'rect');
    aoRect.setAttribute('x', String(-offsetX + x - width / 2));
    aoRect.setAttribute('y', String(y - height / 2));
    aoRect.setAttribute('width', String(width));
    aoRect.setAttribute('height', String(height));
    aoRect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    aoRect.setAttribute('fill', `url(#${aoId})`);
    aoRect.setAttribute('pointer-events', 'none');
    innerG.appendChild(aoRect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(-offsetX + x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(blockFontSize));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  });

  // ── Heap (right) ────────────────────────────────────────────────────
  const heapLabel = document.createElementNS(SVG_NS, 'text');
  heapLabel.setAttribute('x', String(offsetX));
  heapLabel.setAttribute('y', String(topY));
  heapLabel.setAttribute('text-anchor', 'middle');
  heapLabel.setAttribute('fill', cc.textPrimary);
  heapLabel.setAttribute('font-size', String(labelFontSize));
  heapLabel.setAttribute('font-weight', '600');
  heapLabel.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  heapLabel.textContent = 'Heap';
  innerG.appendChild(heapLabel);

  heapBlocks.forEach(({ x, y, width, height, label }) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(offsetX + x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', cc.fill);
    rect.setAttribute('stroke', cc.stroke);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    // AO overlay
    const aoRect = document.createElementNS(SVG_NS, 'rect');
    aoRect.setAttribute('x', String(offsetX + x - width / 2));
    aoRect.setAttribute('y', String(y - height / 2));
    aoRect.setAttribute('width', String(width));
    aoRect.setAttribute('height', String(height));
    aoRect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    aoRect.setAttribute('fill', `url(#${aoId})`);
    aoRect.setAttribute('pointer-events', 'none');
    innerG.appendChild(aoRect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(offsetX + x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(blockFontSize));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `memlyt-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-offsetX - s * 0.6));
  specular.setAttribute('y', String(topY - 5));
  specular.setAttribute('width', String(offsetX * 2 + s * 1.2));
  specular.setAttribute('height', String(bottomY - topY + 10));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animation ──────────────────────────────────
  const styleId = `memlyt-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes memlytFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .memlyt-float-${entityId} {
        animation: memlytFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`memlyt-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(bottomY + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * scale));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
