/**
 * @preplai/illustrations — LinkedList Component (Cinematic Depth)
 *
 * Three circular nodes with arrow connectors and null terminator.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (arrow flow + node pulse + float).
 *
 * Metadata: { values: (string|number)[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderLinkedList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const values = ((meta.values as (string | number)[]) ?? [1, 2, 3]).slice(0, 6);

  const scale = size / 50;
  const nodeR = 12 * scale;
  const gap = 22 * scale;
  const totalW = values.length * nodeR * 2 + (values.length - 1) * gap + gap; // +gap for null
  const startX = -totalW / 2 + nodeR;

  const defs = ensureDefs(parentEl);

  // ── Arrow marker ────────────────────────────────────────────────────
  const markerId = `ll-arrow-${entityId}`;
  if (!defs.querySelector(`#${markerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '6'); marker.setAttribute('markerHeight', '4');
    marker.setAttribute('refX', '5'); marker.setAttribute('refY', '2');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '0 0, 6 2, 0 4');
    poly.setAttribute('fill', color);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `ll-halo-${entityId}`;
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
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-totalW * 0.08));
  halo.setAttribute('cy', String(-size * 0.05));
  halo.setAttribute('rx', String(totalW * 0.6));
  halo.setAttribute('ry', String(nodeR * 2.5));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `ll-gs-${entityId}`;
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
  gsEl.setAttribute('cy', String(nodeR + nodeR * 0.4));
  gsEl.setAttribute('rx', String(totalW * 0.5));
  gsEl.setAttribute('ry', String(nodeR * 0.3));
  gsEl.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gsEl);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `ll-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-totalW / 2));
  ao.setAttribute('y', String(-nodeR));
  ao.setAttribute('width', String(totalW));
  ao.setAttribute('height', String(nodeR * 2));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Body fill + stroke gradients ────────────────────────────────────
  const bodyFillId = `ll-bf-${entityId}`;
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
  const bodyStrokeId = `ll-bs-${entityId}`;
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
    glow.setAttribute('x', String(-totalW / 2 - 3));
    glow.setAttribute('y', String(-nodeR - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(nodeR * 2 + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Nodes + arrows ──────────────────────────────────────────────────
  values.forEach((val, i) => {
    const x = startX + i * (nodeR * 2 + gap);

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(nodeR));
    circle.setAttribute('fill', `url(#${bodyFillId})`);
    circle.setAttribute('stroke', `url(#${bodyStrokeId})`);
    circle.setAttribute('stroke-width', String(STROKE.default));
    circle.classList.add(`ll-node-${entityId}`);
    circle.style.animationDelay = `${i * 0.3}s`;
    innerG.appendChild(circle);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4 * scale));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', cc.textPrimary);
    valueText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    valueText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    valueText.textContent = String(val).slice(0, 6);
    innerG.appendChild(valueText);

    // Arrow to next node
    if (i < values.length - 1) {
      const ax1 = x + nodeR;
      const ax2 = x + nodeR * 2 + gap - nodeR;
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(ax1));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(ax2));
      line.setAttribute('y2', '0');
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', String(STROKE.default * 0.7));
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('marker-end', `url(#${markerId})`);
      line.classList.add(`ll-arrow-${entityId}`);
      innerG.appendChild(line);
    }
  });

  // ── Null terminator ─────────────────────────────────────────────────
  const nullX = startX + values.length * (nodeR * 2 + gap) - gap + gap * 0.6;
  const nullLine1 = document.createElementNS(SVG_NS, 'line');
  nullLine1.setAttribute('x1', String(nullX)); nullLine1.setAttribute('y1', String(-nodeR * 0.5));
  nullLine1.setAttribute('x2', String(nullX)); nullLine1.setAttribute('y2', String(nodeR * 0.5));
  nullLine1.setAttribute('stroke', colorWithAlpha(color, '66'));
  nullLine1.setAttribute('stroke-width', String(STROKE.default * 0.8));
  innerG.appendChild(nullLine1);
  const nullLine2 = document.createElementNS(SVG_NS, 'line');
  nullLine2.setAttribute('x1', String(nullX + 3 * scale)); nullLine2.setAttribute('y1', String(-nodeR * 0.35));
  nullLine2.setAttribute('x2', String(nullX + 3 * scale)); nullLine2.setAttribute('y2', String(nodeR * 0.35));
  nullLine2.setAttribute('stroke', colorWithAlpha(color, '44'));
  nullLine2.setAttribute('stroke-width', String(STROKE.default * 0.6));
  innerG.appendChild(nullLine2);

  // Arrow from last node to null
  if (values.length > 0) {
    const lastX = startX + (values.length - 1) * (nodeR * 2 + gap);
    const aLine = document.createElementNS(SVG_NS, 'line');
    aLine.setAttribute('x1', String(lastX + nodeR));
    aLine.setAttribute('y1', '0');
    aLine.setAttribute('x2', String(nullX - 3 * scale));
    aLine.setAttribute('y2', '0');
    aLine.setAttribute('stroke', color);
    aLine.setAttribute('stroke-width', String(STROKE.default * 0.7));
    aLine.setAttribute('stroke-linecap', 'round');
    aLine.setAttribute('marker-end', `url(#${markerId})`);
    aLine.classList.add(`ll-arrow-${entityId}`);
    innerG.appendChild(aLine);
  }

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `ll-spec-${entityId}`;
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
  const spec = document.createElementNS(SVG_NS, 'ellipse');
  spec.setAttribute('cx', String(-totalW * 0.12));
  spec.setAttribute('cy', String(-nodeR * 0.4));
  spec.setAttribute('rx', String(totalW * 0.3));
  spec.setAttribute('ry', String(nodeR * 0.5));
  spec.setAttribute('fill', `url(#${specId})`);
  spec.setAttribute('pointer-events', 'none');
  innerG.appendChild(spec);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `ll-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes llArrowFlow_${entityId} {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(3px); }
      }
      @keyframes llNodePulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.06); }
      }
      @keyframes llFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .ll-arrow-${entityId} {
        animation: llArrowFlow_${entityId} 2s ease-in-out infinite;
      }
      .ll-node-${entityId} {
        animation: llNodePulse_${entityId} 2.6s ease-in-out infinite;
      }
      .ll-float-${entityId} {
        animation: llFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`ll-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(nodeR + LABEL_DEFAULTS.offsetBelow));
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
