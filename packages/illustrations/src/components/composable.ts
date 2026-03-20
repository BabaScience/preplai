/**
 * @preplai/illustrations — Composable Component
 *
 * The Tier 2 illustration engine: combines Shape + Icon + Color into unique visuals.
 * Instead of hand-crafting a renderer for every entity type, the AI agent specifies:
 *   - metadata.shape: "shield" | "hexagon" | "circle" | ... (15 shapes)
 *   - metadata.icon:  "landmark" | "briefcase" | "users" | ... (100+ icons)
 *   - metadata.style: "default" | "minimal" | "emphasized" | "outlined"
 *
 * One renderer, 4,500+ unique visual combinations.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, colorWithAlpha, OPACITY, STROKE, TYPOGRAPHY } from '../design-tokens.js';
import {} from '../visual-utils.js';
import { renderShape, COMPOSABLE_SHAPES } from './composable-shapes.js';
import { ICON_PATHS } from './icon-paths.js';
import type { ComposableShape } from './composable-shapes.js';
import type { VisualEntity } from '@preplai/shared';

// ── Types ───────────────────────────────────────────────────────────────

type ComposableStyle = 'default' | 'minimal' | 'emphasized' | 'outlined';

// ── Helpers ─────────────────────────────────────────────────────────────

function getComposableShape(entity: VisualEntity): ComposableShape {
  const raw = (entity.metadata?.shape as string) ?? 'rect';
  if (COMPOSABLE_SHAPES.includes(raw as ComposableShape)) return raw as ComposableShape;
  return 'rect';
}

function getComposableStyle(entity: VisualEntity): ComposableStyle {
  const raw = (entity.metadata?.style as string) ?? 'default';
  if (['default', 'minimal', 'emphasized', 'outlined'].includes(raw)) return raw as ComposableStyle;
  return 'default';
}

function getIconName(entity: VisualEntity): string | null {
  const raw = (entity.metadata?.icon as string) ?? null;
  if (raw && ICON_PATHS[raw]) return raw;
  return null;
}

// ── Render function ─────────────────────────────────────────────────────

export function renderComposable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor(entity.type);
  const shape = getComposableShape(entity);
  const style = getComposableStyle(entity);
  const iconName = getIconName(entity);

  const strokeWidth = style === 'emphasized' ? STROKE.emphasized : STROKE.default;

  // ── 1. Render shape ──────────────────────────────────────────────────
  const { width: shapeW, height: shapeH } = renderShape(shape, innerG, parentEl, {
    size: s,
    color,
    strokeWidth,
    highlight: entity.highlight,
  });

  // ── 2. Render icon (centered inside shape) ──────────────────────────
  if (iconName) {
    const iconPath = ICON_PATHS[iconName];
    const iconColor = (entity.metadata?.iconColor as string) ?? color;

    // Scale icon to fit ~40% of the smaller shape dimension
    const iconFit = Math.min(shapeW, shapeH) * 0.4;
    const iconScale = iconFit / 24; // icons are 24×24 viewBox

    const iconG = document.createElementNS(SVG_NS, 'g');
    // Center the 24×24 icon: translate so (12,12) maps to (0,0), then scale
    iconG.setAttribute(
      'transform',
      `scale(${iconScale.toFixed(3)}) translate(-12, -12)`,
    );

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', iconPath);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', iconColor);
    path.setAttribute('stroke-width', String(Math.max(1.5, 2 / iconScale)));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    iconG.appendChild(path);

    innerG.appendChild(iconG);
  }

  // ── 3. Type badge (subtle, mono, above shape) ───────────────────────
  if (style !== 'minimal') {
    const badgeText = (entity.metadata?.badgeLabel as string) ?? null;
    if (badgeText) {
      const badge = document.createElementNS(SVG_NS, 'text');
      badge.setAttribute('x', '0');
      badge.setAttribute('y', String(-shapeH / 2 - 6));
      badge.setAttribute('text-anchor', 'middle');
      badge.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
      badge.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
      badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      badge.textContent = badgeText;
      innerG.appendChild(badge);
    }
  }

  // ── 4. Label (below shape) ──────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(shapeH / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  // ── 5. Outlined style: make shape fill transparent ──────────────────
  if (style === 'outlined') {
    // Walk innerG children, set fill to very transparent for shape elements
    const firstChild = innerG.firstElementChild;
    if (firstChild && (firstChild.tagName === 'rect' || firstChild.tagName === 'circle' ||
        firstChild.tagName === 'polygon' || firstChild.tagName === 'path' ||
        firstChild.tagName === 'ellipse')) {
      (firstChild as SVGElement).setAttribute('fill', colorWithAlpha(color, '08'));
    }
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
