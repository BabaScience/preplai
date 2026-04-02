/**
 * @preplai/illustrations — EREntity Component (Cinematic Depth)
 *
 * Multi-compartment rectangle for ER diagrams: entity name header + typed columns
 * with key indicators. 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animations.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getLabelFontSize, TYPOGRAPHY, STROKE, COLORS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface Column {
  name: string;
  type: string;
  key?: 'PK' | 'FK' | 'UK';
}

const defaultColumns: Column[] = [
  { name: 'id', type: 'uuid', key: 'PK' },
  { name: 'name', type: 'varchar(255)' },
  { name: 'email', type: 'varchar(255)', key: 'UK' },
  { name: 'created_at', type: 'timestamp' },
];

const KEY_COLORS: Record<string, string> = {
  PK: COLORS.gold,
  FK: COLORS.blue,
  UK: COLORS.green,
};

export function renderEREntity(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const meta = (entity.metadata ?? {}) as { tableName?: string; columns?: Column[] };

  const scale = size / 50;
  const baseW = 160 * scale;
  const rowH = 20 * scale;
  const headerH = 28 * scale;
  const padX = 8 * scale;
  const keyBadgeW = 20 * scale;

  const tableName = meta.tableName ?? entity.label ?? 'Entity';
  const columns = meta.columns?.length ? meta.columns : defaultColumns;

  const totalH = headerH + columns.length * rowH;
  const startX = -baseW / 2;
  const startY = -totalH / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `erEnt-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-baseW * 0.1));
  halo.setAttribute('cy', String(startY + totalH * 0.3));
  halo.setAttribute('rx', String(baseW * 0.9));
  halo.setAttribute('ry', String(totalH * 0.7));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `erEnt-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%'); gs1.setAttribute('stop-color', '#000000'); gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%'); gs2.setAttribute('stop-color', '#000000'); gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1); gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(startY + totalH + 6 * scale));
  groundShadow.setAttribute('rx', String(baseW * 0.5));
  groundShadow.setAttribute('ry', String(5 * scale));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `erEnt-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(startX));
  aoRect.setAttribute('y', String(startY));
  aoRect.setAttribute('width', String(baseW));
  aoRect.setAttribute('height', String(totalH));
  aoRect.setAttribute('rx', '4');
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(startX - 3));
    glowRect.setAttribute('y', String(startY - 3));
    glowRect.setAttribute('width', String(baseW + 6));
    glowRect.setAttribute('height', String(totalH + 6));
    glowRect.setAttribute('rx', '6');
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Background rect ───────────────────────────────────────────────
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(startX));
  bg.setAttribute('y', String(startY));
  bg.setAttribute('width', String(baseW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', '4');
  bg.setAttribute('ry', '4');
  bg.setAttribute('fill', cc.fill);
  bg.setAttribute('stroke', cc.stroke);
  bg.setAttribute('stroke-width', '2.5');
  innerG.appendChild(bg);

  // ── Header fill ───────────────────────────────────────────────────
  const headerBg = document.createElementNS(SVG_NS, 'rect');
  headerBg.setAttribute('x', String(startX));
  headerBg.setAttribute('y', String(startY));
  headerBg.setAttribute('width', String(baseW));
  headerBg.setAttribute('height', String(headerH));
  headerBg.setAttribute('rx', '4');
  headerBg.setAttribute('ry', '4');
  headerBg.setAttribute('fill', cc.fillMedium);
  innerG.appendChild(headerBg);

  const headerOverlap = document.createElementNS(SVG_NS, 'rect');
  headerOverlap.setAttribute('x', String(startX));
  headerOverlap.setAttribute('y', String(startY + headerH - 4 * scale));
  headerOverlap.setAttribute('width', String(baseW));
  headerOverlap.setAttribute('height', String(4 * scale));
  headerOverlap.setAttribute('fill', cc.fillMedium);
  innerG.appendChild(headerOverlap);

  // ── Header text ───────────────────────────────────────────────────
  const headerText = document.createElementNS(SVG_NS, 'text');
  headerText.setAttribute('x', '0');
  headerText.setAttribute('y', String(startY + headerH / 2 + 4 * scale));
  headerText.setAttribute('text-anchor', 'middle');
  headerText.setAttribute('fill', cc.textPrimary);
  headerText.setAttribute('font-size', String(getLabelFontSize('title', scale)));
  headerText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  headerText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  headerText.textContent = tableName;
  innerG.appendChild(headerText);

  // ── Divider line ──────────────────────────────────────────────────
  const divider = document.createElementNS(SVG_NS, 'line');
  divider.setAttribute('x1', String(startX));
  divider.setAttribute('y1', String(startY + headerH));
  divider.setAttribute('x2', String(startX + baseW));
  divider.setAttribute('y2', String(startY + headerH));
  divider.setAttribute('stroke', cc.strokeSoft);
  divider.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(divider);

  // ── Column rows ───────────────────────────────────────────────────
  const bodyStartY = startY + headerH;
  const fontSize = getLabelFontSize('value', scale);

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const rowY = bodyStartY + i * rowH + rowH / 2 + 3 * scale;
    let textStartX = startX + padX;

    if (col.key) {
      const badgeColor = KEY_COLORS[col.key] ?? color;
      const badgeX = startX + padX;
      const badgeY = bodyStartY + i * rowH + rowH / 2 - 5 * scale;
      const badgeH = 12 * scale;

      const badge = document.createElementNS(SVG_NS, 'rect');
      badge.setAttribute('x', String(badgeX));
      badge.setAttribute('y', String(badgeY));
      badge.setAttribute('width', String(keyBadgeW));
      badge.setAttribute('height', String(badgeH));
      badge.setAttribute('rx', '2');
      badge.setAttribute('ry', '2');
      badge.setAttribute('fill', colorWithAlpha(badgeColor, OPACITY.fillHeavy));
      innerG.appendChild(badge);

      const badgeText = document.createElementNS(SVG_NS, 'text');
      badgeText.setAttribute('x', String(badgeX + keyBadgeW / 2));
      badgeText.setAttribute('y', String(badgeY + badgeH / 2 + 3 * scale));
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('fill', badgeColor);
      badgeText.setAttribute('font-size', String(getLabelFontSize('index', scale)));
      badgeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
      badgeText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      badgeText.textContent = col.key;
      innerG.appendChild(badgeText);

      textStartX += keyBadgeW + 4 * scale;
    }

    const nameEl = document.createElementNS(SVG_NS, 'text');
    nameEl.setAttribute('x', String(textStartX));
    nameEl.setAttribute('y', String(rowY));
    nameEl.setAttribute('text-anchor', 'start');
    nameEl.setAttribute('fill', cc.textPrimary);
    nameEl.setAttribute('font-size', String(fontSize));
    nameEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    nameEl.setAttribute('font-family', TYPOGRAPHY.fontCode);
    nameEl.textContent = col.name;
    innerG.appendChild(nameEl);

    const typeEl = document.createElementNS(SVG_NS, 'text');
    typeEl.setAttribute('x', String(startX + baseW - padX));
    typeEl.setAttribute('y', String(rowY));
    typeEl.setAttribute('text-anchor', 'end');
    typeEl.setAttribute('fill', cc.textSecondary);
    typeEl.setAttribute('font-size', String(fontSize));
    typeEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    typeEl.setAttribute('font-family', TYPOGRAPHY.fontCode);
    typeEl.textContent = col.type;
    innerG.appendChild(typeEl);
  }

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `erEnt-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(startX + baseW * 0.3));
  specular.setAttribute('cy', String(startY + totalH * 0.2));
  specular.setAttribute('rx', String(baseW * 0.35));
  specular.setAttribute('ry', String(totalH * 0.2));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animations ────────────────────────────────
  const styleId = `erEnt-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes erEntFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes erEntBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .erEnt-float-${entityId} {
        animation: erEntFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .erEnt-breathe-${entityId} {
        animation: erEntBreathe_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`erEnt-float-${entityId}`);

  // ── Entity label (below if different from tableName) ──────────────
  if (entity.label && entity.label !== tableName) {
    const labelY = startY + totalH + 18 * scale;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
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
