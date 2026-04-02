/**
 * @preplai/illustrations — FlowDiagram Component (Cinematic Depth)
 *
 * Vertical flowchart: rect/diamond steps connected by arrows.
 * 5 Cinematic Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float + breathe).
 *
 * Use for: process flows, decision trees, algorithms.
 * Metadata: { steps: Array<{ label: string, type?: 'default' | 'decision' }> }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

type StepDef = { label: string; type?: 'default' | 'decision' };

const STEP_H = 32;
const BOX_W = 70;
const BOX_H = 24;
const DIAMOND_R = 18;

export function renderFlowDiagram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('FlowDiagram');
  const defs = ensureDefs(parentEl);
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const stepsRaw = (meta.steps as StepDef[] | undefined) ?? [
    { label: 'Start', type: 'default' },
    { label: 'Condition?', type: 'decision' },
    { label: 'Process', type: 'default' },
    { label: 'End', type: 'default' },
  ];
  type StepInput = { label?: unknown; name?: unknown; type?: unknown };
  const steps: StepDef[] = Array.isArray(stepsRaw)
    ? (stepsRaw as StepInput[])
        .filter((st) => st != null && typeof st === 'object' && (st.label != null || st.name != null))
        .map((st) => ({
          label: String(st.label ?? st.name ?? 'Step'),
          type: (st.type === 'decision' ? 'decision' : 'default') as 'default' | 'decision',
        }))
    : [{ label: 'Start', type: 'default' }];

  const strokeWidth = Math.max(0.4, getStrokeWidth('minimal', scale) * 0.5);
  const _shapeStrokeWidth = Math.max(0.5, getStrokeWidth('minimal', scale) * 0.67);
  const fontSize = getLabelFontSize('value', 1) / scale;

  const totalH = steps.length * STEP_H - 4;
  const startY = -totalH / 2 + STEP_H / 2;
  const diagramW = BOX_W * scale * 1.5;
  const diagramH = totalH * scale;

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `flow-halo-${entityId}`;
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
  halo.setAttribute('rx', String(diagramW * 0.7));
  halo.setAttribute('ry', String(diagramH * 0.55));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `flow-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(diagramH / 2 + 4));
  groundShadow.setAttribute('rx', String(diagramW * 0.4));
  groundShadow.setAttribute('ry', String(diagramH * 0.04));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `flow-ao-${entityId}`;
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
  aoRect.setAttribute('x', String(-diagramW / 2));
  aoRect.setAttribute('y', String(-diagramH / 2));
  aoRect.setAttribute('width', String(diagramW));
  aoRect.setAttribute('height', String(diagramH));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `flow-spec-${entityId}`;
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

  // ── Arrow marker ──────────────────────────────────────────────────────
  const markerId = `arrow-fd-${entityId}`;
  if (!defs.querySelector(`#${markerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '0 0, 8 3, 0 6');
    poly.setAttribute('fill', color);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  steps.forEach((step, i) => {
    const y = startY + i * STEP_H;
    const isDecision = step.type === 'decision';

    if (i > 0) {
      const prevY = startY + (i - 1) * STEP_H;
      const prevIsDecision = (steps[i - 1] as StepDef).type === 'decision';
      const prevBottom = prevIsDecision ? prevY + DIAMOND_R : prevY + BOX_H / 2;
      const top = isDecision ? y - DIAMOND_R : y - BOX_H / 2;

      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(prevBottom));
      line.setAttribute('x2', '0');
      line.setAttribute('y2', String(top));
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', String(strokeWidth));
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('marker-end', `url(#${markerId})`);
      scaleGroup.appendChild(line);
    }

    const displayLabel = step.label.length > 14 ? step.label.slice(0, 11) + '\u2026' : step.label;

    if (isDecision) {
      const stepG = document.createElementNS(SVG_NS, 'g');
      stepG.setAttribute('transform', `translate(0, ${y})`);

      const dR = DIAMOND_R;
      const points = `0,${-dR} ${dR},0 0,${dR} ${-dR},0`;
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', points);
      poly.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      poly.setAttribute('stroke', color);
      poly.setAttribute('stroke-width', '2.5');
      poly.setAttribute('stroke-linejoin', 'round');
      poly.setAttribute('stroke-linecap', 'round');
      stepG.appendChild(poly);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '4');
      text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(fontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      text.textContent = displayLabel;
      stepG.appendChild(text);

      scaleGroup.appendChild(stepG);
    } else {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-BOX_W / 2));
      rect.setAttribute('y', String(y - BOX_H / 2));
      rect.setAttribute('width', String(BOX_W));
      rect.setAttribute('height', String(BOX_H));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', '2.5');
      rect.setAttribute('stroke-linejoin', 'round');
      scaleGroup.appendChild(rect);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(y));
      text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(fontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      text.textContent = displayLabel;
      scaleGroup.appendChild(text);
    }
  });

  innerG.appendChild(scaleGroup);

  // Specular overlay
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-diagramW / 2));
  specular.setAttribute('y', String(-diagramH / 2));
  specular.setAttribute('width', String(diagramW));
  specular.setAttribute('height', String(diagramH));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 * scale + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `flow-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes flowFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes flowBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.008); }
      }
      .flow-float-${entityId} {
        animation: flowFloat_${entityId} 4s ease-in-out infinite;
      }
      .flow-breathe-${entityId} {
        animation: flowBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`flow-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
