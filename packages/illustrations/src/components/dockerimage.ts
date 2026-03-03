/**
 * @preplai/illustrations — Docker Image Component
 * Stacked layers (3-4 horizontal bands) — layered image
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDockerImage(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('DockerImage');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-dockerimg-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 1.4;
  const layerCount = 4;
  const layerH = (s * 0.9) / layerCount;
  const startY = -s * 0.45;

  for (let i = 0; i < layerCount; i++) {
    const y = startY + i * layerH;
    const layer = document.createElementNS(SVG_NS, 'rect');
    layer.setAttribute('x', String(-w / 2));
    layer.setAttribute('y', String(y));
    layer.setAttribute('width', String(w));
    layer.setAttribute('height', String(layerH - 2));
    layer.setAttribute('rx', '2');
    const alphas = ['15', '20', '28', '35'];
    layer.setAttribute('fill', `${color}${alphas[i] ?? '25'}`);
    layer.setAttribute('stroke', color);
    layer.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(layer);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
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
