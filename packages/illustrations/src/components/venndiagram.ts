/**
 * @preplai/illustrations — VennDiagram Component (Cinematic Depth)
 *
 * 2 or 3 overlapping circles with set labels.
 * 5 Cinematic Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float + breathe).
 *
 * Use for: set theory, intersections, unions, logic diagrams.
 * Metadata: { sets: Array<{label: string, color?: string}> | string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

const VENN_COLORS = ['#00bcd4', '#9B59B6', '#00e676'];

interface SetSpec {
  label: string;
  color?: string;
}

function parseSets(meta: Record<string, unknown>, _defaultColor: string): SetSpec[] {
  const raw = meta.sets as SetSpec[] | string[] | undefined;
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [
      { label: 'A', color: VENN_COLORS[0] },
      { label: 'B', color: VENN_COLORS[1] },
    ];
  }
  const n = Math.min(raw.length, 3);
  return raw.slice(0, n).map((s, i) => {
    if (typeof s === 'string') {
      return { label: s, color: VENN_COLORS[i % VENN_COLORS.length] };
    }
    return {
      label: String((s as SetSpec)?.label ?? '?'),
      color: (s as SetSpec)?.color ?? VENN_COLORS[i % VENN_COLORS.length],
    };
  });
}

export function renderVennDiagram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const defaultColor = entity.color ?? getCategoryColor('VennDiagram');
  const labelFontSize = getLabelFontSize('value', scale);
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const sets = parseSets(meta, defaultColor);
  const numSets = sets.length;

  const r = s * 0.55;
  const overlap = 0.35;
  const centerDist = r * (1 - overlap * 0.7);

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `venn-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', defaultColor); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', defaultColor); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(r * 2.2));
  halo.setAttribute('ry', String(r * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `venn-gshadow-${entityId}`;
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
  const boundsY = numSets === 2 ? r : r + centerDist;
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(boundsY * 0.85));
  groundShadow.setAttribute('rx', String(r * 1.2));
  groundShadow.setAttribute('ry', String(r * 0.1));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `venn-ao-${entityId}`;
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
  const aoCircle = document.createElementNS(SVG_NS, 'circle');
  aoCircle.setAttribute('cx', '0');
  aoCircle.setAttribute('cy', '0');
  aoCircle.setAttribute('r', String(r * 1.5));
  aoCircle.setAttribute('fill', `url(#${aoId})`);
  aoCircle.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoCircle);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `venn-spec-${entityId}`;
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

  // ── Circles ───────────────────────────────────────────────────────────
  if (numSets === 2) {
    const d = r * (1 - overlap);
    const cx1 = -d;
    const cx2 = d;
    const cy = 0;

    sets.forEach((set, i) => {
      const cx = i === 0 ? cx1 : cx2;
      const setColor = set.color ?? defaultColor;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(cx));
      circle.setAttribute('cy', String(cy));
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', colorWithAlpha(setColor, OPACITY.fillMedium));
      circle.setAttribute('stroke', setColor);
      circle.setAttribute('stroke-width', '2.5');
      innerG.appendChild(circle);

      const labelX = i === 0 ? cx - r * 0.6 : cx + r * 0.6;
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(labelX));
      text.setAttribute('y', String(cy + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', setColor);
      text.setAttribute('font-size', String(labelFontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = set.label.length > 4 ? set.label.slice(0, 3) + '\u2026' : set.label;
      innerG.appendChild(text);
    });
  } else {
    const angleOffset = -Math.PI / 2;
    const positions = [0, 1, 2].map((i) => {
      const a = angleOffset + (i * 2 * Math.PI) / 3;
      return {
        x: Math.cos(a) * centerDist,
        y: Math.sin(a) * centerDist,
      };
    });

    sets.forEach((set, i) => {
      const { x: cx, y: cy } = positions[i];
      const setColor = set.color ?? defaultColor;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(cx));
      circle.setAttribute('cy', String(cy));
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', colorWithAlpha(setColor, OPACITY.fillMedium));
      circle.setAttribute('stroke', setColor);
      circle.setAttribute('stroke-width', '2.5');
      innerG.appendChild(circle);

      const labelAngle = Math.atan2(cy, cx);
      const labelDist = r * 0.75;
      const lx = Math.cos(labelAngle) * labelDist;
      const ly = Math.sin(labelAngle) * labelDist;
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(lx));
      text.setAttribute('y', String(ly + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', setColor);
      text.setAttribute('font-size', String(labelFontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = set.label.length > 4 ? set.label.slice(0, 3) + '\u2026' : set.label;
      innerG.appendChild(text);
    });
  }

  // Specular overlay
  const specular = document.createElementNS(SVG_NS, 'circle');
  specular.setAttribute('cx', '0');
  specular.setAttribute('cy', '0');
  specular.setAttribute('r', String(r * 1.5));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(boundsY + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `venn-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes vennFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes vennBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.012); }
      }
      .venn-float-${entityId} {
        animation: vennFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .venn-breathe-${entityId} {
        animation: vennBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`venn-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
