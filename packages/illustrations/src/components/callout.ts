/**
 * @preplai/illustrations — Callout Component
 * SVG icon + type (tip/warning/note/important) + accent bar + body text
 */

import {
  SVG_NS,
  buildEntityGroup,
  applyEntranceAnimation,
  getSizeParam,
  wrapBodyText,
  CHAR_WIDTH_RATIO,
} from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** Draw SVG icon into a group at (0,0). Caller positions via transform. */
function drawCalloutIcon(
  parent: SVGElement,
  type: string,
  color: string,
): void {
  const sw = '1';
  switch (type) {
    case 'tip': {
      // Circle with dot (info icon)
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', '0'); c.setAttribute('cy', '0');
      c.setAttribute('r', '5'); c.setAttribute('fill', 'none');
      c.setAttribute('stroke', color); c.setAttribute('stroke-width', sw);
      parent.appendChild(c);
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', '0'); dot.setAttribute('cy', '0');
      dot.setAttribute('r', '1.5'); dot.setAttribute('fill', color);
      parent.appendChild(dot);
      break;
    }
    case 'warning': {
      // Triangle + exclamation
      const tri = document.createElementNS(SVG_NS, 'path');
      tri.setAttribute('d', 'M 0,-5 L 5,4 L -5,4 Z');
      tri.setAttribute('fill', 'none');
      tri.setAttribute('stroke', color); tri.setAttribute('stroke-width', sw);
      tri.setAttribute('stroke-linejoin', 'round');
      parent.appendChild(tri);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', '0'); line.setAttribute('y1', '-2');
      line.setAttribute('x2', '0'); line.setAttribute('y2', '1');
      line.setAttribute('stroke', color); line.setAttribute('stroke-width', '1.2');
      parent.appendChild(line);
      const d = document.createElementNS(SVG_NS, 'circle');
      d.setAttribute('cx', '0'); d.setAttribute('cy', '3');
      d.setAttribute('r', '0.7'); d.setAttribute('fill', color);
      parent.appendChild(d);
      break;
    }
    case 'important': {
      // Circle + exclamation mark
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', '0'); c.setAttribute('cy', '0');
      c.setAttribute('r', '5'); c.setAttribute('fill', 'none');
      c.setAttribute('stroke', color); c.setAttribute('stroke-width', sw);
      parent.appendChild(c);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', '0'); line.setAttribute('y1', '-3');
      line.setAttribute('x2', '0'); line.setAttribute('y2', '1');
      line.setAttribute('stroke', color); line.setAttribute('stroke-width', '1.5');
      parent.appendChild(line);
      const d = document.createElementNS(SVG_NS, 'circle');
      d.setAttribute('cx', '0'); d.setAttribute('cy', '3');
      d.setAttribute('r', '1'); d.setAttribute('fill', color);
      parent.appendChild(d);
      break;
    }
    default: { // note
      // Document with folded corner
      const doc = document.createElementNS(SVG_NS, 'path');
      doc.setAttribute('d', 'M -4,-5 L 2,-5 L 4,-3 L 4,5 L -4,5 Z');
      doc.setAttribute('fill', 'none');
      doc.setAttribute('stroke', color); doc.setAttribute('stroke-width', sw);
      doc.setAttribute('stroke-linejoin', 'round');
      parent.appendChild(doc);
      const fold = document.createElementNS(SVG_NS, 'path');
      fold.setAttribute('d', 'M 2,-5 L 2,-3 L 4,-3');
      fold.setAttribute('fill', 'none');
      fold.setAttribute('stroke', color); fold.setAttribute('stroke-width', sw);
      parent.appendChild(fold);
      break;
    }
  }
}

export function renderCallout(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Callout');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-callout-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const calloutType = ((meta.calloutType as string) ?? 'note').toLowerCase();
  const body = (meta.body as string) ?? entity.textContent ?? entity.label ?? '';

  const w = s * 2;
  const h = s * 1.2;

  const clipId = `clip-callout-${entity.id.replace(/[^a-zA-Z0-9-]/g, '')}`;
  const clipPathEl = document.createElementNS(SVG_NS, 'clipPath');
  clipPathEl.setAttribute('id', clipId);
  const clipRect = document.createElementNS(SVG_NS, 'rect');
  clipRect.setAttribute('x', String(-w / 2));
  clipRect.setAttribute('y', String(-h / 2));
  clipRect.setAttribute('width', String(w));
  clipRect.setAttribute('height', String(h));
  clipRect.setAttribute('rx', String(SHAPES.borderRadius));
  clipPathEl.appendChild(clipRect);
  defs.appendChild(clipPathEl);

  innerG.setAttribute('clip-path', `url(#${clipId})`);

  // ── Card background ──
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-w / 2));
  card.setAttribute('y', String(-h / 2));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
  innerG.appendChild(card);

  // ── Left accent bar ──
  const accentBar = document.createElementNS(SVG_NS, 'rect');
  accentBar.setAttribute('x', String(-w / 2));
  accentBar.setAttribute('y', String(-h / 2));
  accentBar.setAttribute('width', '3');
  accentBar.setAttribute('height', String(h));
  accentBar.setAttribute('fill', color);
  accentBar.setAttribute('opacity', '0.7');
  innerG.appendChild(accentBar);

  // ── SVG icon (replaces emoji) ──
  const iconG = document.createElementNS(SVG_NS, 'g') as SVGGElement;
  iconG.setAttribute('transform', `translate(${-w / 2 + 20}, ${-h / 2 + 18})`);
  drawCalloutIcon(iconG, calloutType, color);
  innerG.appendChild(iconG);

  // ── Type label ──
  const typeFontSize = getLabelFontSize('title', scale);
  const typeLabel = document.createElementNS(SVG_NS, 'text');
  typeLabel.setAttribute('x', String(-w / 2 + 34));
  typeLabel.setAttribute('y', String(-h / 2 + 22));
  typeLabel.setAttribute('fill', color);
  typeLabel.setAttribute('font-size', String(typeFontSize));
  typeLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
  typeLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  typeLabel.textContent = calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
  innerG.appendChild(typeLabel);

  // ── Body text ──
  if (body) {
    const bodyFontSize = getLabelFontSize('value', scale);
    const bodyStartX = -w / 2 + 20;
    const bodyStartY = -h / 2 + 44;
    const availableWidth = Math.max(60, w - 40);
    const maxCharsPerLine = Math.max(8, Math.floor(availableWidth / (bodyFontSize * CHAR_WIDTH_RATIO)));
    const maxLines = 8;
    const { lines } = wrapBodyText(body, maxCharsPerLine, maxLines);
    const lineHeight = bodyFontSize * LABEL_DEFAULTS.lineHeight;

    const bodyGroup = document.createElementNS(SVG_NS, 'text');
    bodyGroup.setAttribute('text-anchor', 'start');
    bodyGroup.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    bodyGroup.setAttribute('font-size', String(bodyFontSize));
    bodyGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    bodyGroup.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));

    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(bodyStartX));
      tspan.setAttribute('y', String(bodyStartY + i * lineHeight));
      tspan.textContent = line;
      bodyGroup.appendChild(tspan);
    });
    innerG.appendChild(bodyGroup);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
