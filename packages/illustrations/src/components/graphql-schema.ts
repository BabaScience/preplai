/**
 * @preplai/illustrations — GraphQLSchema Component (Cinematic 5-Pillar)
 *
 * Card with schema type notation (type/query/mutation fields).
 * Handles varied field counts gracefully with overflow indicator.
 *
 * Cinematic Depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life float animation.
 *
 * Metadata: { schemaType?: 'type'|'query'|'mutation', fields?: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, STROKE } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGraphQLSchema(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const schemaType = (meta.schemaType as string) ?? 'type';
  const fields = (meta.fields as string[]) ?? [];
  const name = entity.label ?? 'Schema';

  const w = s * 1.8;
  const h = s * 1.2;
  const hw = w / 2;
  const hh = h / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `gql-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.1));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.4));
  halo.setAttribute('ry', String(hh * 1.3));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `gql-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const g1 = document.createElementNS(SVG_NS, 'stop');
    g1.setAttribute('offset', '0%'); g1.setAttribute('stop-color', '#000000'); g1.setAttribute('stop-opacity', '0.18');
    const g2 = document.createElementNS(SVG_NS, 'stop');
    g2.setAttribute('offset', '100%'); g2.setAttribute('stop-color', '#000000'); g2.setAttribute('stop-opacity', '0');
    gsg.appendChild(g1); gsg.appendChild(g2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(hh + 6));
  groundShadow.setAttribute('rx', String(hw * 0.85));
  groundShadow.setAttribute('ry', String(hh * 0.15));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `gql-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const a1 = document.createElementNS(SVG_NS, 'stop');
    a1.setAttribute('offset', '0%'); a1.setAttribute('stop-color', '#000000'); a1.setAttribute('stop-opacity', '0.10');
    const a2 = document.createElementNS(SVG_NS, 'stop');
    a2.setAttribute('offset', '100%'); a2.setAttribute('stop-color', '#000000'); a2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(a1); aoGrad.appendChild(a2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(SHAPES.borderRadius));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Highlight glow ──────────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Card body ───────────────────────────────────────────────────────
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', cc.fill);
  card.setAttribute('stroke', cc.stroke);
  card.setAttribute('stroke-width', '2.5');
  innerG.appendChild(card);

  // ── Type header ─────────────────────────────────────────────────────
  const headerFontSize = Math.max(9, 10 * scale);
  const headerText = document.createElementNS(SVG_NS, 'text');
  headerText.setAttribute('x', String(-hw + 10));
  headerText.setAttribute('y', String(-hh + 18));
  headerText.setAttribute('text-anchor', 'start');
  headerText.setAttribute('fill', cc.textPrimary);
  headerText.setAttribute('font-size', String(headerFontSize));
  headerText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  headerText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  headerText.textContent = `${schemaType} ${name} {`;
  innerG.appendChild(headerText);

  // ── Divider ─────────────────────────────────────────────────────────
  const divider = document.createElementNS(SVG_NS, 'line');
  divider.setAttribute('x1', String(-hw + 8));
  divider.setAttribute('y1', String(-hh + 24));
  divider.setAttribute('x2', String(hw - 8));
  divider.setAttribute('y2', String(-hh + 24));
  divider.setAttribute('stroke', cc.strokeSoft);
  divider.setAttribute('stroke-width', String(STROKE.minimal));
  divider.setAttribute('opacity', '0.3');
  innerG.appendChild(divider);

  // ── Fields ──────────────────────────────────────────────────────────
  const fieldFontSize = Math.max(8, 9 * scale);
  const lineHeight = fieldFontSize + 4;
  const maxFields = Math.min(fields.length, 5);
  for (let i = 0; i < maxFields; i++) {
    const field = document.createElementNS(SVG_NS, 'text');
    field.setAttribute('x', String(-hw + 18));
    field.setAttribute('y', String(-hh + 38 + i * lineHeight));
    field.setAttribute('text-anchor', 'start');
    field.setAttribute('fill', cc.textSecondary);
    field.setAttribute('font-size', String(fieldFontSize));
    field.setAttribute('font-family', TYPOGRAPHY.fontCode);
    field.setAttribute('opacity', '0.7');
    field.textContent = fields[i].length > 30 ? fields[i].slice(0, 30) + '...' : fields[i];
    innerG.appendChild(field);
  }

  // Overflow indicator
  if (fields.length > 5) {
    const more = document.createElementNS(SVG_NS, 'text');
    more.setAttribute('x', String(-hw + 18));
    more.setAttribute('y', String(-hh + 38 + maxFields * lineHeight));
    more.setAttribute('text-anchor', 'start');
    more.setAttribute('fill', cc.textTertiary);
    more.setAttribute('font-size', String(fieldFontSize));
    more.setAttribute('font-family', TYPOGRAPHY.fontCode);
    more.textContent = `... +${fields.length - 5} more`;
    innerG.appendChild(more);
  }

  // ── Closing brace ───────────────────────────────────────────────────
  const closeBrace = document.createElementNS(SVG_NS, 'text');
  closeBrace.setAttribute('x', String(-hw + 10));
  closeBrace.setAttribute('y', String(hh - 8));
  closeBrace.setAttribute('text-anchor', 'start');
  closeBrace.setAttribute('fill', cc.textPrimary);
  closeBrace.setAttribute('font-size', String(headerFontSize));
  closeBrace.setAttribute('font-family', TYPOGRAPHY.fontCode);
  closeBrace.textContent = '}';
  innerG.appendChild(closeBrace);

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `gql-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-hw));
  specular.setAttribute('y', String(-hh));
  specular.setAttribute('width', String(w));
  specular.setAttribute('height', String(h * 0.45));
  specular.setAttribute('rx', String(SHAPES.borderRadius));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `gql-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes gqlFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .gql-float-${entityId} {
        animation: gqlFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`gql-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
