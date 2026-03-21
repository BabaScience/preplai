/**
 * @preplai/illustrations — FreeBodyDiagram Component
 *
 * Central body circle with force vectors at specified angles.
 * Use for: physics FBD, force analysis, equilibrium.
 *
 * @see METADATA_SCHEMAS.md#freebodydiagram
 *
 * Metadata:
 *   forces: Array<{ label: string, angle: number, magnitude?: number, color?: string }>
 *   angle in degrees: 0 = right, 90 = up
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type ForceDef = { label: string; angle: number; magnitude?: number; color?: string };

const BODY_R = 18;
const BASE_LEN = 28;
const HEAD_LEN = 10;

function drawForceArrow(
  parent: SVGGElement,
  angleDeg: number,
  magnitude: number,
  color: string,
  strokeWidth: number,
  bodyR: number,
): void {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  const len = BASE_LEN * Math.max(0.3, Math.min(2, magnitude));
  const x1 = Math.cos(angle) * bodyR;
  const y1 = Math.sin(angle) * bodyR;
  const x2 = Math.cos(angle) * (bodyR + len);
  const y2 = Math.sin(angle) * (bodyR + len);

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', String(strokeWidth));
  line.setAttribute('stroke-linecap', 'round');
  parent.appendChild(line);

  const headAngle = Math.atan2(y2 - y1, x2 - x1);
  const ax = x2 - HEAD_LEN * Math.cos(headAngle);
  const ay = y2 - HEAD_LEN * Math.sin(headAngle);
  const arrow = document.createElementNS(SVG_NS, 'polygon');
  arrow.setAttribute(
    'points',
    `${x2},${y2} ${ax + HEAD_LEN * 0.5 * Math.cos(headAngle - Math.PI / 2)},${ay + HEAD_LEN * 0.5 * Math.sin(headAngle - Math.PI / 2)} ${ax + HEAD_LEN * 0.5 * Math.cos(headAngle + Math.PI / 2)},${ay + HEAD_LEN * 0.5 * Math.sin(headAngle + Math.PI / 2)}`,
  );
  arrow.setAttribute('fill', color);
  parent.appendChild(arrow);
}

export function renderFreeBodyDiagram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('FreeBodyDiagram');

  const meta = entity.metadata ?? {};
  const forcesRaw = (meta.forces as ForceDef[] | undefined) ?? [
    { label: 'F₁', angle: 0, magnitude: 1 },
    { label: 'F₂', angle: 90, magnitude: 1 },
    { label: 'F₃', angle: 180, magnitude: 1 },
    { label: 'N', angle: 270, magnitude: 1 },
  ];
  type ForceInput = { label?: unknown; name?: unknown; angle?: unknown; magnitude?: unknown; color?: unknown };
  const forces: ForceDef[] = Array.isArray(forcesRaw)
    ? (forcesRaw as ForceInput[])
        .filter((f) => f != null && typeof f === 'object')
        .map((f) => ({
          label: String(f.label ?? f.name ?? 'F'),
          angle: Number(f.angle ?? 0),
          magnitude: Math.max(0.1, Number(f.magnitude ?? 1)),
          color: typeof f.color === 'string' ? f.color : undefined,
        }))
    : [{ label: 'F', angle: 0, magnitude: 1 }];

  const strokeWidth = getStrokeWidth('thin', 1);
  const fontSize = getLabelFontSize('value', 1) / scale;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const body = document.createElementNS(SVG_NS, 'circle');
  body.setAttribute('cx', '0');
  body.setAttribute('cy', '0');
  body.setAttribute('r', String(BODY_R));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(STROKE.default));
  scaleGroup.appendChild(body);

  forces.forEach((force) => {
    const vecColor = force.color ?? color;
    drawForceArrow(scaleGroup, force.angle, force.magnitude!, vecColor, strokeWidth, BODY_R);

    const angle = ((force.angle - 90) * Math.PI) / 180;
    const len = BASE_LEN * Math.max(0.3, Math.min(2, force.magnitude ?? 1));
    const labelX = Math.cos(angle) * (BODY_R + len + 12);
    const labelY = Math.sin(angle) * (BODY_R + len + 12);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(labelX));
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', vecColor);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = force.label.length > 6 ? force.label.slice(0, 5) + '…' : force.label;
    scaleGroup.appendChild(text);
  });

  innerG.appendChild(scaleGroup);

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String((BODY_R + 20) * scale + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', color);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
