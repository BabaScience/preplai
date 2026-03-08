/**
 * @preplai/illustrations — NeuralNetwork Component
 *
 * Neural network layer diagram: columns of circle neurons per layer (input, hidden×N, output)
 * with weighted edge lines between layers. Uses metadata.layers (neuron counts per layer).
 *
 * Metadata:
 *   layers: number[] — neuron count per layer, e.g. [3, 4, 3, 2] (input 3, hidden 4, hidden 3, output 2)
 *   layerLabels?: string[] — optional labels for each layer
 *   showWeights?: boolean — show weight indicators on connections (default: false)
 *   highlightNeuron?: { layer: number, index: number } — highlight a specific neuron
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
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
  const color = entity.color ?? getCategoryColor('NeuralNetwork');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-nn-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const layers = parseLayers(meta);
  const layerLabels = (meta.layerLabels as string[] | undefined) ?? [];
  const showWeights = meta.showWeights === true;
  const highlightNeuron = meta.highlightNeuron as { layer: number; index: number } | undefined;

  const numLayers = layers.length;
  const _maxNeurons = Math.max(...layers, 1);
  const sizeScale = 1.5;
  const neuronRadius = Math.min(s * 0.08 * sizeScale, 8 * scale);
  const layerSpacing = s * 0.5 * sizeScale;
  const verticalSpacing = s * 0.18 * sizeScale;
  const totalWidth = (numLayers - 1) * layerSpacing;
  const startX = -totalWidth / 2;

  // Build neuron positions: layerIdx -> [ { x, y } ]
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

  // Draw connections (behind neurons)
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

  // Draw neurons (circles)
  for (let l = 0; l < numLayers; l++) {
    for (let i = 0; i < positions[l].length; i++) {
      const { x, y } = positions[l][i];
      const isHighlighted =
        highlightNeuron && highlightNeuron.layer === l && highlightNeuron.index === i;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(x));
      circle.setAttribute('cy', String(y));
      circle.setAttribute('r', String(neuronRadius));
      circle.setAttribute('fill', `url(#${gradId})`);
      circle.setAttribute('stroke', isHighlighted ? color : colorWithAlpha(color, OPACITY.strokeSoft));
      circle.setAttribute('stroke-width', String(isHighlighted ? strokeEmphasized : strokeWidth));
      innerG.appendChild(circle);
    }
  }

  // Layer labels below each column
  for (let l = 0; l < numLayers; l++) {
    const label = layerLabels[l] ?? (l === 0 ? 'Input' : l === numLayers - 1 ? 'Output' : `H${l}`);
    const x = positions[l][0]?.x ?? startX + l * layerSpacing;
    const maxY = positions[l].length > 0 ? Math.max(...positions[l].map((p) => p.y)) : 0;
    const labelY = maxY + neuronRadius + 4 * scale;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    text.setAttribute('font-size', String(labelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = label;
    innerG.appendChild(text);
  }

  if (entity.label) {
    const bottomY = Math.max(...positions.flat().map((p) => p.y)) + neuronRadius + 12 * scale;
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(bottomY + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', color);
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
