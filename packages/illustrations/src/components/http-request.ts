/**
 * @preplai/illustrations — HTTPRequest / HTTPResponse Component
 * Card showing request or response with headers and body preview
 * Metadata: { method?: string, url?: string, statusCode?: number, headers?: string, bodyPreview?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderHTTPRequest(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('HTTPRequest');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-http-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const method = ((meta.method as string) ?? '').toUpperCase();
  const url = (meta.url as string) ?? entity.label ?? '';
  const headerText = (meta.headers as string) ?? '';
  const bodyPreview = (meta.bodyPreview as string) ?? '';

  const w = s * 2;
  const h = s * 1.1;
  const hw = w / 2;
  const hh = h / 2;

  // Card
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // Top bar
  const topBar = document.createElementNS(SVG_NS, 'rect');
  topBar.setAttribute('x', String(-hw));
  topBar.setAttribute('y', String(-hh));
  topBar.setAttribute('width', String(w));
  topBar.setAttribute('height', '3');
  topBar.setAttribute('fill', color);
  topBar.setAttribute('opacity', '0.7');
  innerG.appendChild(topBar);

  // Arrow icon (→ for request, ← for response)
  const isResponse = entity.type === 'HTTPResponse';
  const arrowIcon = document.createElementNS(SVG_NS, 'text');
  arrowIcon.setAttribute('x', String(-hw + 12));
  arrowIcon.setAttribute('y', String(-hh + 20));
  arrowIcon.setAttribute('fill', color);
  arrowIcon.setAttribute('font-size', String(getLabelFontSize('title', scale)));
  arrowIcon.setAttribute('font-family', TYPOGRAPHY.fontCode);
  arrowIcon.textContent = isResponse ? '\u2190' : '\u2192';
  innerG.appendChild(arrowIcon);

  // Method + URL / Status line
  const titleLine = method ? `${method} ${url}` : (url || entity.label || entity.type);
  const titleText = document.createElementNS(SVG_NS, 'text');
  titleText.setAttribute('x', String(-hw + 26));
  titleText.setAttribute('y', String(-hh + 20));
  titleText.setAttribute('text-anchor', 'start');
  titleText.setAttribute('fill', color);
  titleText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  titleText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  titleText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  titleText.textContent = titleLine.length > 30 ? titleLine.slice(0, 30) + '...' : titleLine;
  innerG.appendChild(titleText);

  // Divider
  const divider = document.createElementNS(SVG_NS, 'line');
  divider.setAttribute('x1', String(-hw + 8));
  divider.setAttribute('y1', String(-hh + 28));
  divider.setAttribute('x2', String(hw - 8));
  divider.setAttribute('y2', String(-hh + 28));
  divider.setAttribute('stroke', color);
  divider.setAttribute('stroke-width', String(STROKE.minimal));
  divider.setAttribute('opacity', '0.3');
  innerG.appendChild(divider);

  // Headers or body preview
  const content = headerText || bodyPreview || '';
  if (content) {
    const lines = content.split('\n').slice(0, 3);
    const fontSize = getLabelFontSize('inline', scale);
    lines.forEach((line, i) => {
      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', String(-hw + 12));
      t.setAttribute('y', String(-hh + 42 + i * (fontSize + 3)));
      t.setAttribute('text-anchor', 'start');
      t.setAttribute('fill', color);
      t.setAttribute('font-size', String(fontSize));
      t.setAttribute('font-family', TYPOGRAPHY.fontCode);
      t.setAttribute('opacity', '0.6');
      t.textContent = line.length > 35 ? line.slice(0, 35) + '...' : line;
      innerG.appendChild(t);
    });
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}

export function renderHTTPResponse(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  return renderHTTPRequest(entity, parentEl);
}
