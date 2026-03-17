/**
 * @preplai/illustrations — GPU Component
 * A processor/accelerator icon with parallel cores grid and heat sink.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGPU(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('GPU');

  const meta = entity.metadata ?? {};
  const model = (meta.model as string) ?? 'A100';
  const memory = (meta.memory as string) ?? '80GB';

  const scale = size / 50;
  const w = 90 * scale;
  const h = 60 * scale;
  const rx = 4 * scale;

  // ── Main body rectangle ──
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(body);

  // ── Heat sink lines on top (3 vertical thin rectangles) ──
  const sinkW = 4 * scale;
  const sinkH = 8 * scale;
  const sinkGap = 14 * scale;
  const sinkY = -h / 2 - sinkH;
  for (let i = -1; i <= 1; i++) {
    const sink = document.createElementNS(SVG_NS, 'rect');
    sink.setAttribute('x', String(i * sinkGap - sinkW / 2));
    sink.setAttribute('y', String(sinkY));
    sink.setAttribute('width', String(sinkW));
    sink.setAttribute('height', String(sinkH));
    sink.setAttribute('rx', String(1 * scale));
    sink.setAttribute('fill', color);
    sink.setAttribute('opacity', '0.5');
    innerG.appendChild(sink);
  }

  // ── Grid of cores (4x3 = 12 small filled squares) ──
  const coreCols = 4;
  const coreRows = 3;
  const coreSize = 6 * scale;
  const coreGap = 4 * scale;
  const gridW = coreCols * coreSize + (coreCols - 1) * coreGap;
  const gridH = coreRows * coreSize + (coreRows - 1) * coreGap;
  const gridStartX = -gridW / 2;
  const gridStartY = -h / 2 + 8 * scale;

  for (let row = 0; row < coreRows; row++) {
    for (let col = 0; col < coreCols; col++) {
      const cx = gridStartX + col * (coreSize + coreGap);
      const cy = gridStartY + row * (coreSize + coreGap);
      const core = document.createElementNS(SVG_NS, 'rect');
      core.setAttribute('x', String(cx));
      core.setAttribute('y', String(cy));
      core.setAttribute('width', String(coreSize));
      core.setAttribute('height', String(coreSize));
      core.setAttribute('rx', String(1 * scale));
      core.setAttribute('fill', color);
      core.setAttribute('opacity', '0.6');
      innerG.appendChild(core);
    }
  }

  // ── Model name (bold) below grid ──
  const modelText = document.createElementNS(SVG_NS, 'text');
  modelText.setAttribute('x', '0');
  modelText.setAttribute('y', String(gridStartY + gridH + 12 * scale));
  modelText.setAttribute('text-anchor', 'middle');
  modelText.setAttribute('fill', color);
  modelText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue * scale));
  modelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  modelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  modelText.textContent = model;
  innerG.appendChild(modelText);

  // ── Memory text (small monospace) ──
  const memText = document.createElementNS(SVG_NS, 'text');
  memText.setAttribute('x', '0');
  memText.setAttribute('y', String(h / 2 - 4 * scale));
  memText.setAttribute('text-anchor', 'middle');
  memText.setAttribute('fill', color);
  memText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  memText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  memText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  memText.setAttribute('opacity', '0.7');
  memText.textContent = memory;
  innerG.appendChild(memText);

  // ── Entity label below ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 18));
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
