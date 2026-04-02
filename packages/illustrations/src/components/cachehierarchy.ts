/**
 * @preplai/illustrations — CacheHierarchy Component (Cinematic 5 Pillars)
 *
 * Vertical stack of cache levels (L1, L2, L3, RAM) with glassmorphic depth.
 * Directional lighting, ground shadow, AO, specular, micro-life.
 *
 * Metadata: { levels: [{ name, size? }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureDefs } from '../visual-utils.js';
import {
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { stackLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface CacheLevel {
  name: string;
  size?: string;
}

export function renderCacheHierarchy(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const levelFontSize = getLabelFontSize('value', scale);
  const sublabelFontSize = getLabelFontSize('index', scale);
  const defs = ensureDefs(parentEl);

  const meta = entity.metadata ?? {};
  const levelsData = meta.levels as CacheLevel[] | undefined;

  const levels: CacheLevel[] = levelsData ?? [
    { name: 'L1', size: '32 KB' },
    { name: 'L2', size: '256 KB' },
    { name: 'L3', size: '8 MB' },
    { name: 'RAM', size: '16 GB' },
  ];

  const blockHeight = 28;
  const gap = 6;
  const items = levels.map(l => ({ label: l.name, sublabel: l.size }));
  const blocks = stackLayout(items, { blockWidth: s * 1.8, blockHeight, gap });

  const totalH = blocks.length * blockHeight + (blocks.length - 1) * gap;
  const totalW = s * 1.8;

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `chier-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-totalW * 0.06));
  halo.setAttribute('cy', String(-totalH * 0.05));
  halo.setAttribute('rx', String(totalW * 0.65));
  halo.setAttribute('ry', String(totalH * 0.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `chier-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(totalH / 2 + 6));
  groundShadow.setAttribute('rx', String(totalW * 0.4));
  groundShadow.setAttribute('ry', String(4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `chier-ao-${entityId}`;
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

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `chier-spec-${entityId}`;
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

  blocks.forEach(({ x, y, width, height, label, sublabel }, i) => {
    const clipId = `clip-chier-${entityId}-${i}`;
    let clipEl = defs.querySelector(`#${clipId}`) as SVGClipPathElement | null;
    if (!clipEl) {
      clipEl = document.createElementNS(SVG_NS, 'clipPath');
      clipEl.setAttribute('id', clipId);
      defs.appendChild(clipEl);
    }
    clipEl.innerHTML = '';
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', String(x - width / 2));
    clipRect.setAttribute('y', String(y - height / 2));
    clipRect.setAttribute('width', String(width));
    clipRect.setAttribute('height', String(height));
    clipRect.setAttribute('rx', String(SHAPES.borderRadius));
    clipEl.appendChild(clipRect);

    const blockG = document.createElementNS(SVG_NS, 'g');
    blockG.setAttribute('clip-path', `url(#${clipId})`);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    rect.setAttribute('stroke', cc.stroke);
    rect.setAttribute('stroke-width', '2.5');
    blockG.appendChild(rect);

    // AO overlay per block
    const aoBlock = document.createElementNS(SVG_NS, 'rect');
    aoBlock.setAttribute('x', String(x - width / 2));
    aoBlock.setAttribute('y', String(y - height / 2));
    aoBlock.setAttribute('width', String(width));
    aoBlock.setAttribute('height', String(height));
    aoBlock.setAttribute('rx', String(SHAPES.borderRadius));
    aoBlock.setAttribute('fill', `url(#${aoId})`);
    aoBlock.setAttribute('pointer-events', 'none');
    blockG.appendChild(aoBlock);

    // Specular per block
    const specBlock = document.createElementNS(SVG_NS, 'rect');
    specBlock.setAttribute('x', String(x - width / 2));
    specBlock.setAttribute('y', String(y - height / 2));
    specBlock.setAttribute('width', String(width));
    specBlock.setAttribute('height', String(height));
    specBlock.setAttribute('rx', String(SHAPES.borderRadius));
    specBlock.setAttribute('fill', `url(#${specId})`);
    specBlock.setAttribute('pointer-events', 'none');
    blockG.appendChild(specBlock);

    // Label and sublabel
    const labelY = sublabel ? y - 2 : y + 4;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(levelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    blockG.appendChild(text);

    if (sublabel) {
      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('x', String(x));
      sub.setAttribute('y', String(y + 5));
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
      sub.setAttribute('font-size', String(sublabelFontSize));
      sub.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      sub.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      sub.textContent = sublabel;
      blockG.appendChild(sub);
    }

    innerG.appendChild(blockG);
  });

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `chier-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes chierFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes chierBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .chier-float-${entityId} {
        animation: chierFloat_${entityId} 3.8s ease-in-out infinite;
      }
      .chier-breathe-${entityId} {
        animation: chierBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`chier-float-${entityId}`);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', 'middle');
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
