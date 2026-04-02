/**
 * @preplai/illustrations — Device Component (Cinematic 5-Pillar)
 *
 * Monitor + stand + base silhouette with full cinematic depth treatment.
 * Use for: monitors, desktops, client devices, workstations, displays.
 *
 * 5 Pillars:
 *   1. Directional Lighting — radial halo behind entity
 *   2. Ground Shadow — soft ellipse below base
 *   3. Ambient Occlusion — dark overlay on screen lower-right
 *   4. Specular Highlight — bright spot upper-left on screen
 *   5. Micro-Life — float whole entity, power LED blink, scan line shimmer
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDevice(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  // ── Dimensions ────────────────────────────────────────────────────────
  const screenW = s * 0.9;
  const screenH = s * 0.6;
  const standW = s * 0.12;
  const standH = s * 0.15;
  const baseW = screenW * 0.5;
  const baseH = s * 0.05;

  const totalH = screenH + standH + baseH;
  const screenTop = -totalH / 2;
  const standTop = screenTop + screenH;
  const baseTop = standTop + standH;

  const defs = ensureDefs(parentEl);

  // ── Glass & glow filters ──────────────────────────────────────────────
  const glassUrl = ensureGlassFilter(parentEl);
  const glowUrl = ensureGlowFilter(parentEl, color, `dev-glow-${entityId}`);

  // ══════════════════════════════════════════════════════════════════════
  // PILLAR 1 — Directional Lighting (radial halo behind entity)
  // ══════════════════════════════════════════════════════════════════════
  const haloId = `dev-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-screenW * 0.08));
  halo.setAttribute('cy', String(screenTop + screenH * 0.35));
  halo.setAttribute('rx', String(screenW * 1.1));
  halo.setAttribute('ry', String(screenH * 1.1));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ══════════════════════════════════════════════════════════════════════
  // PILLAR 2 — Ground Shadow (ellipse below base)
  // ══════════════════════════════════════════════════════════════════════
  const gsId = `dev-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', gsId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(baseTop + baseH + 4));
  groundShadow.setAttribute('rx', String(baseW * 0.9));
  groundShadow.setAttribute('ry', String(baseH * 1.2));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ──────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-screenW / 2 - 4));
    glowRect.setAttribute('y', String(screenTop - 4));
    glowRect.setAttribute('width', String(screenW + 8));
    glowRect.setAttribute('height', String(totalH + 8));
    glowRect.setAttribute('rx', '8');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SCREEN — rounded rect with radial fill, gradient stroke, glass + glow
  // ══════════════════════════════════════════════════════════════════════

  // Screen fill gradient (radial, directional-lit)
  const screenFillId = `dev-scrfill-${entityId}`;
  if (!defs.querySelector(`#${screenFillId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', screenFillId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%'); grad.setAttribute('r', '65%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Screen stroke gradient (linear 135deg, color 0.9→0.3)
  const screenStrokeId = `dev-scrstroke-${entityId}`;
  if (!defs.querySelector(`#${screenStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', screenStrokeId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  const screen = document.createElementNS(SVG_NS, 'rect');
  screen.setAttribute('x', String(-screenW / 2));
  screen.setAttribute('y', String(screenTop));
  screen.setAttribute('width', String(screenW));
  screen.setAttribute('height', String(screenH));
  screen.setAttribute('rx', '6');
  screen.setAttribute('fill', `url(#${screenFillId})`);
  screen.setAttribute('stroke', `url(#${screenStrokeId})`);
  screen.setAttribute('stroke-width', '2');
  screen.setAttribute('filter', `${glowUrl} ${glassUrl}`);
  innerG.appendChild(screen);

  // ══════════════════════════════════════════════════════════════════════
  // PILLAR 3 — Ambient Occlusion (dark overlay on screen lower-right)
  // ══════════════════════════════════════════════════════════════════════
  const aoId = `dev-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', aoId);
    grad.setAttribute('cx', '70%'); grad.setAttribute('cy', '75%'); grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-screenW / 2));
  ao.setAttribute('y', String(screenTop));
  ao.setAttribute('width', String(screenW));
  ao.setAttribute('height', String(screenH));
  ao.setAttribute('rx', '6');
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ══════════════════════════════════════════════════════════════════════
  // PILLAR 4 — Specular Highlight (bright spot upper-left on screen)
  // ══════════════════════════════════════════════════════════════════════
  const specId = `dev-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', specId);
    grad.setAttribute('cx', '35%'); grad.setAttribute('cy', '25%'); grad.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-screenW * 0.12));
  specular.setAttribute('cy', String(screenTop + screenH * 0.3));
  specular.setAttribute('rx', String(screenW * 0.35));
  specular.setAttribute('ry', String(screenH * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Scan lines inside screen (2 thin rects) ──────────────────────────
  const scanClass1 = `dev-scan1-${entityId}`;
  const scanClass2 = `dev-scan2-${entityId}`;

  const scan1 = document.createElementNS(SVG_NS, 'rect');
  scan1.setAttribute('x', String(-screenW * 0.35));
  scan1.setAttribute('y', String(screenTop + screenH * 0.35));
  scan1.setAttribute('width', String(screenW * 0.6));
  scan1.setAttribute('height', '1.5');
  scan1.setAttribute('rx', '0.75');
  scan1.setAttribute('fill', colorWithAlpha(color, '4D'));
  scan1.setAttribute('opacity', '0.3');
  scan1.setAttribute('pointer-events', 'none');
  scan1.classList.add(scanClass1);
  innerG.appendChild(scan1);

  const scan2 = document.createElementNS(SVG_NS, 'rect');
  scan2.setAttribute('x', String(-screenW * 0.25));
  scan2.setAttribute('y', String(screenTop + screenH * 0.6));
  scan2.setAttribute('width', String(screenW * 0.45));
  scan2.setAttribute('height', '1.5');
  scan2.setAttribute('rx', '0.75');
  scan2.setAttribute('fill', colorWithAlpha(color, '26'));
  scan2.setAttribute('opacity', '0.3');
  scan2.setAttribute('pointer-events', 'none');
  scan2.classList.add(scanClass2);
  innerG.appendChild(scan2);

  // ── Power LED on screen (bottom-center) ──────────────────────────────
  const ledClass = `dev-led-${entityId}`;

  const led = document.createElementNS(SVG_NS, 'circle');
  led.setAttribute('cx', '0');
  led.setAttribute('cy', String(screenTop + screenH - 6));
  led.setAttribute('r', '3');
  led.setAttribute('fill', color);
  led.setAttribute('filter', glowUrl);
  led.classList.add(ledClass);
  innerG.appendChild(led);

  // ══════════════════════════════════════════════════════════════════════
  // STAND — thin rect below screen
  // ══════════════════════════════════════════════════════════════════════
  const stand = document.createElementNS(SVG_NS, 'rect');
  stand.setAttribute('x', String(-standW / 2));
  stand.setAttribute('y', String(standTop));
  stand.setAttribute('width', String(standW));
  stand.setAttribute('height', String(standH));
  stand.setAttribute('fill', colorWithAlpha(color, '33'));
  stand.setAttribute('stroke', colorWithAlpha(color, '66'));
  stand.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(stand);

  // ══════════════════════════════════════════════════════════════════════
  // BASE — wider rect at bottom
  // ══════════════════════════════════════════════════════════════════════
  const base = document.createElementNS(SVG_NS, 'rect');
  base.setAttribute('x', String(-baseW / 2));
  base.setAttribute('y', String(baseTop));
  base.setAttribute('width', String(baseW));
  base.setAttribute('height', String(baseH));
  base.setAttribute('rx', '3');
  base.setAttribute('fill', colorWithAlpha(color, '40'));
  base.setAttribute('stroke', colorWithAlpha(color, '80'));
  base.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(base);

  // ══════════════════════════════════════════════════════════════════════
  // PILLAR 5 — Micro-Life Animations
  // ══════════════════════════════════════════════════════════════════════
  const floatClass = `dev-float-${entityId}`;
  const styleId = `dev-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);

  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes devFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes devLedBlink_${entityId} {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(0.6); opacity: 0.6; }
      }
      @keyframes devScanShimmer_${entityId} {
        0%, 100% { opacity: 0.3; transform: translateX(-3px); }
        50% { opacity: 0.8; transform: translateX(3px); }
      }
      .${floatClass} {
        animation: devFloat_${entityId} 4s ease-in-out infinite;
      }
      .${ledClass} {
        animation: devLedBlink_${entityId} 2s ease-in-out infinite;
        transform-origin: 0px ${screenTop + screenH - 6}px;
      }
      .${scanClass1}, .${scanClass2} {
        animation: devScanShimmer_${entityId} 3s ease-in-out infinite;
      }
      .${scanClass2} {
        animation-delay: 0.8s;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  innerG.classList.add(floatClass);

  // ── Label below ──────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(baseTop + baseH + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
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
