/**
 * @preplai/illustrations — GitBranch Component (minimalist)
 *
 * Fork icon with branch name label. No gradient fills.
 * Metadata: { branchName?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, colorWithAlpha, OPACITY, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGitBranch(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('GitBranch');

  const meta = entity.metadata ?? {};
  const branchName = (meta.branchName as string) ?? entity.label ?? 'feature/auth';

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(s * 0.4));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Main trunk
  const trunk = document.createElementNS(SVG_NS, 'line');
  trunk.setAttribute('x1', '0');
  trunk.setAttribute('y1', String(-s * 0.3));
  trunk.setAttribute('x2', '0');
  trunk.setAttribute('y2', String(s * 0.15));
  trunk.setAttribute('stroke', color);
  trunk.setAttribute('stroke-width', String(getStrokeWidth('emphasized', scale)));
  trunk.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(trunk);

  // Branch line (curves right)
  const branch = document.createElementNS(SVG_NS, 'path');
  branch.setAttribute('d', `M 0 ${-s * 0.05} Q ${s * 0.15} ${-s * 0.05} ${s * 0.2} ${-s * 0.25}`);
  branch.setAttribute('stroke', color);
  branch.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  branch.setAttribute('fill', 'none');
  branch.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(branch);

  // Commit dots
  const dots = [
    { x: 0, y: -s * 0.3 },
    { x: 0, y: s * 0.15 },
    { x: s * 0.2, y: -s * 0.25 },
  ];
  for (const d of dots) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(d.x));
    dot.setAttribute('cy', String(d.y));
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', '0.8');
    innerG.appendChild(dot);
  }

  // Branch name label
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '0');
  text.setAttribute('y', String(s * 0.15 + 20));
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  text.setAttribute('font-family', TYPOGRAPHY.fontCode);
  text.textContent = branchName;
  innerG.appendChild(text);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
