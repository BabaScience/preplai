/**
 * @preplai/illustrations — ClassNode Component
 * Three-compartment UML class diagram box: class name / attributes / methods.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, COLORS, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface Attribute {
  visibility?: '+' | '-' | '#';
  name: string;
  type: string;
}

interface Method {
  visibility?: '+' | '-' | '#';
  name: string;
  params?: string;
  returnType?: string;
}

const defaultAttrs: Attribute[] = [
  { visibility: '-', name: 'id', type: 'string' },
  { visibility: '-', name: 'name', type: 'string' },
  { visibility: '+', name: 'email', type: 'string' },
];

const defaultMethods: Method[] = [
  { visibility: '+', name: 'save', params: '', returnType: 'void' },
  { visibility: '+', name: 'validate', params: '', returnType: 'boolean' },
  { visibility: '#', name: 'hashPassword', params: 'pwd: string', returnType: 'string' },
];

const VISIBILITY_COLORS: Record<string, string> = {
  '+': COLORS.green,
  '-': COLORS.red,
  '#': COLORS.gold,
};

export function renderClassNode(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('ClassNode');
  const meta = (entity.metadata ?? {}) as {
    className?: string;
    stereotype?: string;
    attributes?: Attribute[];
    methods?: Method[];
  };

  const scale = size / 50;
  const baseW = 180 * scale;
  const rowH = 18 * scale;
  const headerBaseH = 28 * scale;
  const stereotypeH = meta.stereotype ? 14 * scale : 0;
  const headerH = headerBaseH + stereotypeH;
  const padX = 8 * scale;

  const className = meta.className ?? entity.label ?? 'Class';
  const attributes = meta.attributes?.length ? meta.attributes : defaultAttrs;
  const methods = meta.methods?.length ? meta.methods : defaultMethods;

  const attrSectionH = attributes.length > 0 ? attributes.length * rowH + 6 * scale : 0;
  const methodSectionH = methods.length > 0 ? methods.length * rowH + 6 * scale : 0;
  const totalH = headerH + attrSectionH + methodSectionH;

  const startX = -baseW / 2;
  const startY = -totalH / 2;

  // ── Background rect ──
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(startX));
  bg.setAttribute('y', String(startY));
  bg.setAttribute('width', String(baseW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', '4');
  bg.setAttribute('ry', '4');
  bg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  bg.setAttribute('stroke', color);
  bg.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(bg);

  // ── Header fill ──
  const headerBg = document.createElementNS(SVG_NS, 'rect');
  headerBg.setAttribute('x', String(startX));
  headerBg.setAttribute('y', String(startY));
  headerBg.setAttribute('width', String(baseW));
  headerBg.setAttribute('height', String(headerH));
  headerBg.setAttribute('rx', '4');
  headerBg.setAttribute('ry', '4');
  headerBg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  innerG.appendChild(headerBg);

  // Overlap to square off bottom corners of header
  const headerOverlap = document.createElementNS(SVG_NS, 'rect');
  headerOverlap.setAttribute('x', String(startX));
  headerOverlap.setAttribute('y', String(startY + headerH - 4 * scale));
  headerOverlap.setAttribute('width', String(baseW));
  headerOverlap.setAttribute('height', String(4 * scale));
  headerOverlap.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  innerG.appendChild(headerOverlap);

  // ── Stereotype text (if provided) ──
  let headerTextY = startY + headerH / 2 + 4 * scale;
  if (meta.stereotype) {
    const stereoEl = document.createElementNS(SVG_NS, 'text');
    stereoEl.setAttribute('x', '0');
    stereoEl.setAttribute('y', String(startY + 14 * scale));
    stereoEl.setAttribute('text-anchor', 'middle');
    stereoEl.setAttribute('fill', color);
    stereoEl.setAttribute('font-size', String(Math.round(10 * scale)));
    stereoEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    stereoEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    stereoEl.setAttribute('font-style', 'italic');
    stereoEl.setAttribute('opacity', '0.7');
    stereoEl.textContent = meta.stereotype;
    innerG.appendChild(stereoEl);
    headerTextY = startY + stereotypeH + headerBaseH / 2 + 4 * scale;
  }

  // ── Class name ──
  const nameEl = document.createElementNS(SVG_NS, 'text');
  nameEl.setAttribute('x', '0');
  nameEl.setAttribute('y', String(headerTextY));
  nameEl.setAttribute('text-anchor', 'middle');
  nameEl.setAttribute('fill', color);
  nameEl.setAttribute('font-size', String(Math.round(14 * scale)));
  nameEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  nameEl.textContent = className;
  innerG.appendChild(nameEl);

  // ── Divider after header ──
  const divider1Y = startY + headerH;
  const divider1 = document.createElementNS(SVG_NS, 'line');
  divider1.setAttribute('x1', String(startX));
  divider1.setAttribute('y1', String(divider1Y));
  divider1.setAttribute('x2', String(startX + baseW));
  divider1.setAttribute('y2', String(divider1Y));
  divider1.setAttribute('stroke', color);
  divider1.setAttribute('stroke-width', String(STROKE.thin));
  divider1.setAttribute('opacity', '0.5');
  innerG.appendChild(divider1);

  const fontSize = Math.round(12 * scale);

  // ── Attributes compartment ──
  if (attributes.length > 0) {
    const attrStartY = divider1Y + 3 * scale;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      const rowY = attrStartY + i * rowH + rowH / 2 + 3 * scale;
      const vis = attr.visibility ?? '+';
      const visColor = VISIBILITY_COLORS[vis] ?? color;

      // Visibility symbol
      const visEl = document.createElementNS(SVG_NS, 'text');
      visEl.setAttribute('x', String(startX + padX));
      visEl.setAttribute('y', String(rowY));
      visEl.setAttribute('text-anchor', 'start');
      visEl.setAttribute('fill', visColor);
      visEl.setAttribute('font-size', String(fontSize));
      visEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
      visEl.setAttribute('font-family', TYPOGRAPHY.fontCode);
      visEl.textContent = vis;
      innerG.appendChild(visEl);

      // Attribute text: name: type
      const attrText = document.createElementNS(SVG_NS, 'text');
      attrText.setAttribute('x', String(startX + padX + 12 * scale));
      attrText.setAttribute('y', String(rowY));
      attrText.setAttribute('text-anchor', 'start');
      attrText.setAttribute('fill', color);
      attrText.setAttribute('font-size', String(fontSize));
      attrText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      attrText.setAttribute('font-family', TYPOGRAPHY.fontCode);
      attrText.textContent = `${attr.name}: ${attr.type}`;
      innerG.appendChild(attrText);
    }
  }

  // ── Divider between attributes and methods ──
  if (attributes.length > 0 && methods.length > 0) {
    const divider2Y = divider1Y + attrSectionH;
    const divider2 = document.createElementNS(SVG_NS, 'line');
    divider2.setAttribute('x1', String(startX));
    divider2.setAttribute('y1', String(divider2Y));
    divider2.setAttribute('x2', String(startX + baseW));
    divider2.setAttribute('y2', String(divider2Y));
    divider2.setAttribute('stroke', color);
    divider2.setAttribute('stroke-width', String(STROKE.thin));
    divider2.setAttribute('opacity', '0.5');
    innerG.appendChild(divider2);
  }

  // ── Methods compartment ──
  if (methods.length > 0) {
    const methodStartY = divider1Y + attrSectionH + 3 * scale;
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      const rowY = methodStartY + i * rowH + rowH / 2 + 3 * scale;
      const vis = method.visibility ?? '+';
      const visColor = VISIBILITY_COLORS[vis] ?? color;

      // Visibility symbol
      const visEl = document.createElementNS(SVG_NS, 'text');
      visEl.setAttribute('x', String(startX + padX));
      visEl.setAttribute('y', String(rowY));
      visEl.setAttribute('text-anchor', 'start');
      visEl.setAttribute('fill', visColor);
      visEl.setAttribute('font-size', String(fontSize));
      visEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
      visEl.setAttribute('font-family', TYPOGRAPHY.fontCode);
      visEl.textContent = vis;
      innerG.appendChild(visEl);

      // Method text: name(params): returnType
      const params = method.params ?? '';
      const ret = method.returnType ? `: ${method.returnType}` : '';
      const methodText = document.createElementNS(SVG_NS, 'text');
      methodText.setAttribute('x', String(startX + padX + 12 * scale));
      methodText.setAttribute('y', String(rowY));
      methodText.setAttribute('text-anchor', 'start');
      methodText.setAttribute('fill', color);
      methodText.setAttribute('font-size', String(fontSize));
      methodText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      methodText.setAttribute('font-family', TYPOGRAPHY.fontCode);
      methodText.textContent = `${method.name}(${params})${ret}`;
      innerG.appendChild(methodText);
    }
  }

  // ── Entity label (below box, only if different from className) ──
  if (entity.label && entity.label !== className) {
    const labelY = startY + totalH + 18 * scale;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
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
