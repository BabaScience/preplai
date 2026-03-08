/**
 * @preplai/illustrations — Pod Component
 *
 * Kubernetes pod: rect with inner container rects and status dots.
 *
 * Metadata:
 *   containers?: string[] — container names/labels (1–3 shown)
 *   status?: 'running' | 'pending' | 'failed' — pod status (affects status dot)
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
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type PodStatus = 'running' | 'pending' | 'failed';

const STATUS_COLORS: Record<PodStatus, string> = {
  running: '#00e676',
  pending: '#ffab00',
  failed: '#ff5252',
};

function parseContainers(meta: Record<string, unknown>): string[] {
  const raw = meta.containers as string[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return ['app', 'sidecar'];
  }
  return raw.slice(0, 3).map((c) => String(c ?? '?'));
}

export function renderPod(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('thin', scale);
  const color = entity.color ?? getCategoryColor('Pod');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-pod-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const containers = parseContainers(meta);
  const status = (meta.status as PodStatus) ?? 'running';

  const w = s * 1.5;
  const h = s * 1.1;
  const pad = 6 * scale;

  const border = document.createElementNS(SVG_NS, 'rect');
  border.setAttribute('x', String(-w / 2));
  border.setAttribute('y', String(-h / 2));
  border.setAttribute('width', String(w));
  border.setAttribute('height', String(h));
  border.setAttribute('rx', String(SHAPES.borderRadius));
  border.setAttribute('fill', `url(#${gradId})`);
  border.setAttribute('stroke', color);
  border.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(border);

  const n = containers.length;
  const totalContentW = w - 2 * pad;
  const blockW = Math.max(20, (totalContentW - (n - 1) * pad) / n);
  const blockH = h * 0.25;
  const totalBlocksW = n * blockW + (n - 1) * pad;
  const startX = -totalBlocksW / 2 + blockW / 2;

  containers.forEach((name, i) => {
    const bx = startX + i * (blockW + pad);
    const block = document.createElementNS(SVG_NS, 'rect');
    block.setAttribute('x', String(bx - blockW / 2));
    block.setAttribute('y', String(-blockH / 2));
    block.setAttribute('width', String(Math.max(blockW, 12)));
    block.setAttribute('height', String(blockH));
    block.setAttribute('rx', '2');
    block.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    block.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
    block.setAttribute('stroke-width', String(strokeWidth * 0.8));
    innerG.appendChild(block);

    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', String(bx));
    labelText.setAttribute('y', String(4));
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('fill', color);
    labelText.setAttribute('font-size', String(Math.max(8, getLabelFontSize('inline', scale) * 0.8)));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    labelText.textContent = name.length > 8 ? name.slice(0, 6) + '…' : name;
    innerG.appendChild(labelText);
  });

  const dotR = 4 * scale;
  const dotX = w / 2 - pad - dotR;
  const dotY = -h / 2 + pad + dotR;
  const dotColor = STATUS_COLORS[status] ?? STATUS_COLORS.running;
  const statusDot = document.createElementNS(SVG_NS, 'circle');
  statusDot.setAttribute('cx', String(dotX));
  statusDot.setAttribute('cy', String(dotY));
  statusDot.setAttribute('r', String(dotR));
  statusDot.setAttribute('fill', dotColor);
  statusDot.setAttribute('stroke', colorWithAlpha(dotColor, OPACITY.strokeSoft));
  statusDot.setAttribute('stroke-width', String(strokeWidth * 0.5));
  innerG.appendChild(statusDot);

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(h / 2 + LABEL_DEFAULTS.offsetBelow));
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
