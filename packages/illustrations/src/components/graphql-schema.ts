/**
 * @preplai/illustrations — GraphQLSchema Component
 * Card with schema type notation (type/query/mutation fields)
 * Metadata: { schemaType?: 'type'|'query'|'mutation', fields?: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGraphQLSchema(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('GraphQLSchema');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-gql-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const schemaType = (meta.schemaType as string) ?? 'type';
  const fields = (meta.fields as string[]) ?? [];
  const name = entity.label ?? 'Schema';

  const w = s * 1.8;
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

  // Type header
  const headerText = document.createElementNS(SVG_NS, 'text');
  headerText.setAttribute('x', String(-hw + 10));
  headerText.setAttribute('y', String(-hh + 18));
  headerText.setAttribute('text-anchor', 'start');
  headerText.setAttribute('fill', color);
  headerText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  headerText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  headerText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  headerText.textContent = `${schemaType} ${name} {`;
  innerG.appendChild(headerText);

  // Divider
  const divider = document.createElementNS(SVG_NS, 'line');
  divider.setAttribute('x1', String(-hw + 8));
  divider.setAttribute('y1', String(-hh + 24));
  divider.setAttribute('x2', String(hw - 8));
  divider.setAttribute('y2', String(-hh + 24));
  divider.setAttribute('stroke', color);
  divider.setAttribute('stroke-width', String(STROKE.minimal));
  divider.setAttribute('opacity', '0.3');
  innerG.appendChild(divider);

  // Fields
  const fontSize = getLabelFontSize('inline', scale);
  const maxFields = Math.min(fields.length, 5);
  for (let i = 0; i < maxFields; i++) {
    const field = document.createElementNS(SVG_NS, 'text');
    field.setAttribute('x', String(-hw + 18));
    field.setAttribute('y', String(-hh + 38 + i * (fontSize + 4)));
    field.setAttribute('text-anchor', 'start');
    field.setAttribute('fill', color);
    field.setAttribute('font-size', String(fontSize));
    field.setAttribute('font-family', TYPOGRAPHY.fontCode);
    field.setAttribute('opacity', '0.7');
    field.textContent = fields[i].length > 30 ? fields[i].slice(0, 30) + '...' : fields[i];
    innerG.appendChild(field);
  }

  // Closing brace
  const closeBrace = document.createElementNS(SVG_NS, 'text');
  closeBrace.setAttribute('x', String(-hw + 10));
  closeBrace.setAttribute('y', String(hh - 8));
  closeBrace.setAttribute('text-anchor', 'start');
  closeBrace.setAttribute('fill', color);
  closeBrace.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  closeBrace.setAttribute('font-family', TYPOGRAPHY.fontCode);
  closeBrace.textContent = '}';
  innerG.appendChild(closeBrace);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
