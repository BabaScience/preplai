/**
 * @preplai/illustrations — NeuralNetwork Component (Cinematic Depth)
 *
 * Neural network layer diagram: columns of circle neurons per layer (input, hidden, output)
 * with weighted edge lines between layers.
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animations.
 *
 * Metadata:
 *   layers: number[] — neuron count per layer, e.g. [3, 4, 3, 2]
 *   layerLabels?: string[] — optional labels for each layer
 *   showWeights?: boolean — show weight indicators on connections (default: false)
 *   highlightNeuron?: { layer: number, index: number } — highlight a specific neuron
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

function parseLayers(meta: Record<string, unknown>): number[] {
  const raw = meta.layers as number[] | undefined;
  if (!Array.isArray(raw) || raw.length < 2) {
    return [3, 4, 3, 2];
  }
  return raw
    .slice(0, 8)
    .map((n) => (typeof n === 'number' && !Number.isNaN(n) && n >= 1 ? Math.min(Math.round(n), 12) : 3));
}

export function renderNeuralNetwork(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('thin', scale);
  const strokeEmphasized = getStrokeWidth('default', scale);
  const labelFontSize = getLabelFontSize('inline', scale);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const layers = parseLayers(meta);
  const layerLabels = (meta.layerLabels as string[] | undefined) ?? [];
  const showWeights = meta.showWeights === true;
  const highlightNeuron = meta.highlightNeuron as { layer: number; index: number } | undefined;

  const numLayers = layers.length;
  const sizeScale = 1.5;
  const neuronRadius = Math.min(s * 0.08 * sizeScale, 8 * scale);
  const layerSpacing = s * 0.5 * sizeScale;
  const verticalSpacing = s * 0.18 * sizeScale;
  const totalWidth = (numLayers - 1) * layerSpacing;
  const startX = -totalWidth / 2;

  // Build neuron positions
  const positions: { x: number; y: number }[][] = [];
  for (let l = 0; l < numLayers; l++) {
    const count = layers[l];
    const x = startX + l * layerSpacing;
    const colHeight = (count - 1) * verticalSpacing;
    const startY = -colHeight / 2;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      pts.push({ x, y: startY + i * verticalSpacing });
    }
    positions.push(pts);
  }

  const maxY = Math.max(...positions.flat().map((p) => p.y));
  const minY = Math.min(...positions.flat().map((p) => p.y));
  const netH = maxY - minY + neuronRadius * 4;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `neural-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-totalWidth * 0.08));
  halo.setAttribute('cy', String(minY));
  halo.setAttribute('rx', String(totalWidth * 0.65));
  halo.setAttribute('ry', String(netH * 0.55));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `neural-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
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
  groundShadow.setAttribute('cy', String(maxY + neuronRadius + 8 * scale));
  groundShadow.setAttribute('rx', String(totalWidth * 0.4));
  groundShadow.setAttribute('ry', String(5 * scale));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `neural-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(startX - neuronRadius));
  aoRect.setAttribute('y', String(minY - neuronRadius));
  aoRect.setAttribute('width', String(totalWidth + neuronRadius * 2));
  aoRect.setAttribute('height', String(netH));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Draw connections (behind neurons) ──────────────────────────────
  const connOpacity = colorWithAlpha(color, OPACITY.strokeSoft);
  for (let l = 0; l < numLayers - 1; l++) {
    const fromLayer = positions[l];
    const toLayer = positions[l + 1];
    for (let i = 0; i < fromLayer.length; i++) {
      for (let j = 0; j < toLayer.length; j++) {
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', String(fromLayer[i].x));
        line.setAttribute('y1', String(fromLayer[i].y));
        line.setAttribute('x2', String(toLayer[j].x));
        line.setAttribute('y2', String(toLayer[j].y));
        line.setAttribute('stroke', connOpacity);
        line.setAttribute('stroke-width', String(strokeWidth * 0.6));
        innerG.appendChild(line);
        if (showWeights) {
          const midX = (fromLayer[i].x + toLayer[j].x) / 2;
          const midY = (fromLayer[i].y + toLayer[j].y) / 2;
          const w = document.createElementNS(SVG_NS, 'text');
          w.setAttribute('x', String(midX));
          w.setAttribute('y', String(midY + 3));
          w.setAttribute('text-anchor', 'middle');
          w.setAttribute('fill', connOpacity);
          w.setAttribute('font-size', String(Math.max(8, labelFontSize - 2)));
          w.setAttribute('font-family', TYPOGRAPHY.fontBadge);
          w.textContent = 'w';
          innerG.appendChild(w);
        }
      }
    }
  }

  // ── Draw neurons (circles) ─────────────────────────────────────────
  for (let l = 0; l < numLayers; l++) {
    for (let i = 0; i < positions[l].length; i++) {
      const { x, y } = positions[l][i];
      const isHighlighted =
        highlightNeuron && highlightNeuron.layer === l && highlightNeuron.index === i;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(x));
      circle.setAttribute('cy', String(y));
      circle.setAttribute('r', String(neuronRadius));
      circle.setAttribute('fill', cc.fill);
      circle.setAttribute('stroke', isHighlighted ? cc.stroke : cc.strokeSoft);
      circle.setAttribute('stroke-width', String(isHighlighted ? strokeEmphasized : 2.5));
      innerG.appendChild(circle);
    }
  }

  // ── Layer labels below each column ─────────────────────────────────
  for (let l = 0; l < numLayers; l++) {
    const label = layerLabels[l] ?? (l === 0 ? 'Input' : l === numLayers - 1 ? 'Output' : `H${l}`);
    const x = positions[l][0]?.x ?? startX + l * layerSpacing;
    const layerMaxY = positions[l].length > 0 ? Math.max(...positions[l].map((p) => p.y)) : 0;
    const labelY = layerMaxY + neuronRadius + 4 * scale;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textSecondary);
    text.setAttribute('font-size', String(labelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = label;
    innerG.appendChild(text);
  }

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `neural-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(startX + totalWidth * 0.25));
  specular.setAttribute('cy', String(minY - neuronRadius));
  specular.setAttribute('rx', String(totalWidth * 0.3));
  specular.setAttribute('ry', String(netH * 0.15));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animations ────────────────────────────────
  const styleId = `neural-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const styleEl = document.createElementNS(SVG_NS, 'style');
    styleEl.setAttribute('id', styleId);
    styleEl.textContent = `
      @keyframes neuralFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes neuralPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .neural-float-${entityId} {
        animation: neuralFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .neural-pulse-${entityId} {
        animation: neuralPulse_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(styleEl, svg.firstChild);
  }
  innerG.classList.add(`neural-float-${entityId}`);

  // ── Entity label ───────────────────────────────────────────────────
  if (entity.label) {
    const bottomY = maxY + neuronRadius + 12 * scale;
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(bottomY + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
