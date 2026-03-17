/**
 * @preplai/illustrations — ComponentNode Component
 * React/Vue/Angular component icon for frontend architecture diagrams.
 * Rounded rectangle body with angle bracket icon, framework badge, and optional prop pills.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import { getCategoryColor, colorWithAlpha, TYPOGRAPHY, STROKE, OPACITY, COLORS, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** Framework → badge color mapping */
const FRAMEWORK_COLORS: Record<string, string> = {
  react: COLORS.cyan,
  vue: COLORS.green,
  angular: COLORS.red,
};

export function renderComponentNode(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('ComponentNode');
  const meta = (entity.metadata ?? {}) as { framework?: string; props?: string[] };

  const defs = ensureDefs(parentEl);
  const gradId = `grad-compnode-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = size * 2.4;   // ~120px at size=50
  const h = size * 1.4;   // ~70px at size=50
  const headerH = h * 0.4;

  // ── Component body (rounded rectangle) ──
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(SHAPES.borderRadius));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(STROKE.default));
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // ── Header divider line ──
  const dividerY = -h / 2 + headerH;
  const divider = document.createElementNS(SVG_NS, 'line');
  divider.setAttribute('x1', String(-w / 2 + 4));
  divider.setAttribute('y1', String(dividerY));
  divider.setAttribute('x2', String(w / 2 - 4));
  divider.setAttribute('y2', String(dividerY));
  divider.setAttribute('stroke', color);
  divider.setAttribute('stroke-width', String(STROKE.minimal));
  divider.setAttribute('opacity', '0.3');
  innerG.appendChild(divider);

  // ── Angle bracket icon </> in header ──
  const bracketX = -w / 2 + 14;
  const bracketY = -h / 2 + headerH / 2;
  const bracketText = document.createElementNS(SVG_NS, 'text');
  bracketText.setAttribute('x', String(bracketX));
  bracketText.setAttribute('y', String(bracketY + 3.5));
  bracketText.setAttribute('text-anchor', 'middle');
  bracketText.setAttribute('fill', color);
  bracketText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline));
  bracketText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  bracketText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  bracketText.setAttribute('opacity', '0.7');
  bracketText.textContent = '</>';
  innerG.appendChild(bracketText);

  // ── Component name (bold, in header area) ──
  const nameText = entity.label ?? entity.type;
  const nameEl = document.createElementNS(SVG_NS, 'text');
  nameEl.setAttribute('x', String(bracketX + 18));
  nameEl.setAttribute('y', String(bracketY + 3.5));
  nameEl.setAttribute('text-anchor', 'start');
  nameEl.setAttribute('fill', color);
  nameEl.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
  nameEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  nameEl.textContent = nameText.length > 14 ? nameText.slice(0, 13) + '…' : nameText;
  innerG.appendChild(nameEl);

  // ── Framework badge (colored dot in top-right corner) ──
  const framework = meta.framework?.toLowerCase() ?? '';
  const badgeColor = FRAMEWORK_COLORS[framework] ?? color;
  const badge = document.createElementNS(SVG_NS, 'circle');
  badge.setAttribute('cx', String(w / 2 - 10));
  badge.setAttribute('cy', String(-h / 2 + headerH / 2));
  badge.setAttribute('r', '4');
  badge.setAttribute('fill', badgeColor);
  badge.setAttribute('opacity', '0.9');
  innerG.appendChild(badge);

  // ── Props pills (small monospace pills below header) ──
  const props = meta.props ?? [];
  if (props.length > 0) {
    const maxProps = Math.min(props.length, 3);
    const pillY = dividerY + 10;
    const pillSpacing = 10;
    // Calculate total width to center pills
    const pillFontSize = TYPOGRAPHY.fontSizeInline;

    for (let i = 0; i < maxProps; i++) {
      const propName = props[i].length > 10 ? props[i].slice(0, 9) + '…' : props[i];
      const pillW = propName.length * 5.5 + 10;
      const pillX = -w / 2 + 8 + i * (pillW + 4);
      const py = pillY + i * pillSpacing;

      // Pill background
      const pillBg = document.createElementNS(SVG_NS, 'rect');
      pillBg.setAttribute('x', String(pillX));
      pillBg.setAttribute('y', String(py));
      pillBg.setAttribute('width', String(pillW));
      pillBg.setAttribute('height', String(pillFontSize + 4));
      pillBg.setAttribute('rx', '3');
      pillBg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      pillBg.setAttribute('stroke', color);
      pillBg.setAttribute('stroke-width', String(STROKE.minimal));
      pillBg.setAttribute('opacity', '0.4');
      innerG.appendChild(pillBg);

      // Pill text
      const pillText = document.createElementNS(SVG_NS, 'text');
      pillText.setAttribute('x', String(pillX + pillW / 2));
      pillText.setAttribute('y', String(py + pillFontSize));
      pillText.setAttribute('text-anchor', 'middle');
      pillText.setAttribute('fill', color);
      pillText.setAttribute('font-size', String(pillFontSize));
      pillText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      pillText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      pillText.setAttribute('opacity', '0.7');
      pillText.textContent = propName;
      innerG.appendChild(pillText);
    }
  }

  // ── Entity label below ──
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(h / 2 + 20));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
