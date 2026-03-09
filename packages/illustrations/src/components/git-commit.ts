/**
 * @preplai/illustrations — GitCommit Component
 * Git commit node: circle with hash + message
 * Metadata: { hash?: string, message?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGitCommit(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('GitCommit');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-gitcm-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const hash = (meta.hash as string) ?? 'a1b2c3d';
  const message = (meta.message as string) ?? entity.label ?? 'Initial commit';

  const r = s * 0.2;

  // Commit circle
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', `url(#${gradId})`);
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', String(getStrokeWidth('emphasized', scale)));
  innerG.appendChild(circle);

  // Connection lines (stubs extending from circle)
  const stubUp = document.createElementNS(SVG_NS, 'line');
  stubUp.setAttribute('x1', '0');
  stubUp.setAttribute('y1', String(-r));
  stubUp.setAttribute('x2', '0');
  stubUp.setAttribute('y2', String(-r - 8));
  stubUp.setAttribute('stroke', color);
  stubUp.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  stubUp.setAttribute('opacity', '0.4');
  innerG.appendChild(stubUp);

  const stubDown = document.createElementNS(SVG_NS, 'line');
  stubDown.setAttribute('x1', '0');
  stubDown.setAttribute('y1', String(r));
  stubDown.setAttribute('x2', '0');
  stubDown.setAttribute('y2', String(r + 8));
  stubDown.setAttribute('stroke', color);
  stubDown.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  stubDown.setAttribute('opacity', '0.4');
  innerG.appendChild(stubDown);

  // Hash inside circle
  const hashText = document.createElementNS(SVG_NS, 'text');
  hashText.setAttribute('x', '0');
  hashText.setAttribute('y', '3');
  hashText.setAttribute('text-anchor', 'middle');
  hashText.setAttribute('fill', color);
  hashText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  hashText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  hashText.textContent = hash.slice(0, 7);
  innerG.appendChild(hashText);

  // Message below
  const msgText = document.createElementNS(SVG_NS, 'text');
  msgText.setAttribute('x', '0');
  msgText.setAttribute('y', String(r + 26));
  msgText.setAttribute('text-anchor', 'middle');
  msgText.setAttribute('fill', color);
  msgText.setAttribute('font-size', String(getLabelFontSize('label', scale)));
  msgText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  msgText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  msgText.textContent = message.length > 30 ? message.slice(0, 30) + '...' : message;
  innerG.appendChild(msgText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
