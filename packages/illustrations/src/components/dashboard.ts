/**
 * @preplai/illustrations — Dashboard Component
 * Monitoring dashboard: card with mini chart panels + title
 * Metadata: { panels?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDashboard(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Dashboard');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-dash-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'Monitoring';
  const meta = entity.metadata ?? {};
  const panels = (meta.panels as number) ?? 4;

  const w = s * 1.6;
  const h = s * 1.2;
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

  // Title bar
  const titleBar = document.createElementNS(SVG_NS, 'rect');
  titleBar.setAttribute('x', String(-hw));
  titleBar.setAttribute('y', String(-hh));
  titleBar.setAttribute('width', String(w));
  titleBar.setAttribute('height', '18');
  titleBar.setAttribute('rx', String(SHAPES.borderRadius));
  titleBar.setAttribute('fill', color);
  titleBar.setAttribute('opacity', '0.15');
  innerG.appendChild(titleBar);

  // Title text
  const titleText = document.createElementNS(SVG_NS, 'text');
  titleText.setAttribute('x', String(-hw + 8));
  titleText.setAttribute('y', String(-hh + 13));
  titleText.setAttribute('text-anchor', 'start');
  titleText.setAttribute('fill', color);
  titleText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  titleText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  titleText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  titleText.textContent = label;
  innerG.appendChild(titleText);

  // Mini panels (2x2 grid)
  const panelW = (w - 16) / 2;
  const panelH = (h - 30) / 2;
  const startY = -hh + 22;
  const startX = -hw + 6;
  const numPanels = Math.min(panels, 4);

  for (let i = 0; i < numPanels; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = startX + col * (panelW + 4);
    const py = startY + row * (panelH + 4);

    // Panel bg
    const panel = document.createElementNS(SVG_NS, 'rect');
    panel.setAttribute('x', String(px));
    panel.setAttribute('y', String(py));
    panel.setAttribute('width', String(panelW));
    panel.setAttribute('height', String(panelH));
    panel.setAttribute('rx', '3');
    panel.setAttribute('fill', color);
    panel.setAttribute('opacity', '0.08');
    innerG.appendChild(panel);

    // Mini sparkline inside each panel
    const lineY = py + panelH * 0.5;
    const points: string[] = [];
    for (let j = 0; j <= 6; j++) {
      const lx = px + 3 + (j / 6) * (panelW - 6);
      // Deterministic "random" based on panel index + point index
      const ly = lineY + Math.sin(i * 2 + j * 1.3) * (panelH * 0.25);
      points.push(`${lx},${ly}`);
    }
    const sparkline = document.createElementNS(SVG_NS, 'polyline');
    sparkline.setAttribute('points', points.join(' '));
    sparkline.setAttribute('fill', 'none');
    sparkline.setAttribute('stroke', color);
    sparkline.setAttribute('stroke-width', String(STROKE.thin));
    sparkline.setAttribute('opacity', '0.5');
    innerG.appendChild(sparkline);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
