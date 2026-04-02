/**
 * @preplai/illustrations — Schema Component (Cinematic Depth)
 *
 * Document rect with field rows and key icon.
 * Use for: database schemas, table definitions, data models.
 *
 * Micro-life: field shimmer translateX, key pulse, float.
 * Metadata: { tableName?: string, columns?: Array<{name: string, type: string}> }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderSchema(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const tableName = (meta.tableName as string) ?? entity.label ?? 'users';
  const columns = (meta.columns as Array<{name: string; type: string}>) ?? [];

  const w = size * 1.6;
  const rowH = 14;
  const headerH = 22;
  const h = Math.max(size * 0.8, headerH + columns.length * rowH + 10);
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ───────────────────────────────────────────
  const haloId = `schema-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.5));
  halo.setAttribute('ry', String(hh * 1.3));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ──────────────────────────────────────────────────
  const gsId = `schema-gshadow-${entityId}`;
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
  const gShadow = document.createElementNS(SVG_NS, 'ellipse');
  gShadow.setAttribute('cx', '0');
  gShadow.setAttribute('cy', String(hh + 4));
  gShadow.setAttribute('rx', String(hw * 0.85));
  gShadow.setAttribute('ry', String(hh * 0.15));
  gShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gShadow);

  // ── 3. Ambient Occlusion ──────────────────────────────────────────────
  const aoId = `schema-ao-${entityId}`;
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
  ao.setAttribute('x', String(-hw)); ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w)); ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Body fill gradient ────────────────────────────────────────────────
  const bodyGradId = `schema-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyGradId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body stroke gradient ──────────────────────────────────────────────
  const strokeGradId = `schema-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Highlight glow ring ───────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-hw - 3));
    glowRect.setAttribute('y', String(-hh - 3));
    glowRect.setAttribute('width', String(w + 6));
    glowRect.setAttribute('height', String(h + 6));
    glowRect.setAttribute('rx', String(rx + 2));
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Document rect body ────────────────────────────────────────────────
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw)); card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w)); card.setAttribute('height', String(h));
  card.setAttribute('rx', String(rx));
  card.setAttribute('fill', `url(#${bodyGradId})`);
  card.setAttribute('stroke', `url(#${strokeGradId})`);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // ── Header bar ────────────────────────────────────────────────────────
  const headerBar = document.createElementNS(SVG_NS, 'rect');
  headerBar.setAttribute('x', String(-hw));
  headerBar.setAttribute('y', String(-hh));
  headerBar.setAttribute('width', String(w));
  headerBar.setAttribute('height', String(headerH));
  headerBar.setAttribute('rx', String(rx));
  headerBar.setAttribute('fill', color);
  headerBar.setAttribute('opacity', '0.2');
  innerG.appendChild(headerBar);

  // ── Key icon (in header, left) ────────────────────────────────────────
  const keyX = -hw + 12;
  const keyY = -hh + 11;
  const keyIcon = document.createElementNS(SVG_NS, 'g');
  keyIcon.setAttribute('transform', `translate(${keyX}, ${keyY})`);
  // Key circle head
  const keyHead = document.createElementNS(SVG_NS, 'circle');
  keyHead.setAttribute('cx', '0'); keyHead.setAttribute('cy', '0'); keyHead.setAttribute('r', '3');
  keyHead.setAttribute('fill', 'none'); keyHead.setAttribute('stroke', color);
  keyHead.setAttribute('stroke-width', '1');
  keyIcon.appendChild(keyHead);
  // Key shaft
  const keyShaft = document.createElementNS(SVG_NS, 'line');
  keyShaft.setAttribute('x1', '3'); keyShaft.setAttribute('y1', '0');
  keyShaft.setAttribute('x2', '8'); keyShaft.setAttribute('y2', '0');
  keyShaft.setAttribute('stroke', color); keyShaft.setAttribute('stroke-width', '1');
  keyIcon.appendChild(keyShaft);
  // Key teeth
  const keyTooth = document.createElementNS(SVG_NS, 'line');
  keyTooth.setAttribute('x1', '6'); keyTooth.setAttribute('y1', '0');
  keyTooth.setAttribute('x2', '6'); keyTooth.setAttribute('y2', '2');
  keyTooth.setAttribute('stroke', color); keyTooth.setAttribute('stroke-width', '1');
  keyIcon.appendChild(keyTooth);
  keyIcon.classList.add(`schema-key-${entityId}`);
  innerG.appendChild(keyIcon);

  // ── Table name ────────────────────────────────────────────────────────
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 24));
  nameText.setAttribute('y', String(-hh + 15));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', cc.textPrimary);
  nameText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  nameText.textContent = tableName;
  innerG.appendChild(nameText);

  // ── Field rows ────────────────────────────────────────────────────────
  const maxCols = Math.min(columns.length, 6);
  for (let i = 0; i < maxCols; i++) {
    const col = columns[i];
    const y = -hh + headerH + 12 + i * rowH;

    // Field name
    const colName = document.createElementNS(SVG_NS, 'text');
    colName.setAttribute('x', String(-hw + 12));
    colName.setAttribute('y', String(y));
    colName.setAttribute('text-anchor', 'start');
    colName.setAttribute('fill', cc.textPrimary);
    colName.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    colName.setAttribute('font-family', TYPOGRAPHY.fontCode);
    colName.classList.add(`schema-field-${entityId}`);
    colName.style.animationDelay = `${i * 0.12}s`;
    colName.textContent = col.name;
    innerG.appendChild(colName);

    // Field type
    const colType = document.createElementNS(SVG_NS, 'text');
    colType.setAttribute('x', String(hw - 10));
    colType.setAttribute('y', String(y));
    colType.setAttribute('text-anchor', 'end');
    colType.setAttribute('fill', cc.textSecondary);
    colType.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    colType.setAttribute('font-family', TYPOGRAPHY.fontCode);
    colType.setAttribute('opacity', '0.5');
    colType.textContent = col.type;
    innerG.appendChild(colType);

    // Divider
    if (i < maxCols - 1) {
      const div = document.createElementNS(SVG_NS, 'line');
      div.setAttribute('x1', String(-hw + 8));
      div.setAttribute('y1', String(y + 5));
      div.setAttribute('x2', String(hw - 8));
      div.setAttribute('y2', String(y + 5));
      div.setAttribute('stroke', colorWithAlpha(color, '22'));
      div.setAttribute('stroke-width', String(STROKE.minimal));
      innerG.appendChild(div);
    }
  }

  // ── 4. Specular Highlight ─────────────────────────────────────────────
  const specId = `schema-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hw * 0.3));
  specular.setAttribute('cy', String(-hh * 0.4));
  specular.setAttribute('rx', String(hw * 0.5));
  specular.setAttribute('ry', String(hh * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life Animations ──────────────────────────────────────────
  const styleId = `schema-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes schemaFieldShimmer_${entityId} {
        0%, 100% { transform: translateX(0); opacity: 0.8; }
        50% { transform: translateX(2px); opacity: 1; }
      }
      @keyframes schemaKeyPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      @keyframes schemaFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .schema-field-${entityId} {
        animation: schemaFieldShimmer_${entityId} 2.5s ease-in-out infinite;
      }
      .schema-key-${entityId} {
        animation: schemaKeyPulse_${entityId} 2s ease-in-out infinite;
      }
      .schema-float-${entityId} {
        animation: schemaFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`schema-float-${entityId}`);

  // ── Label below ───────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
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
