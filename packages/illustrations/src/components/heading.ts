/**
 * @preplai/illustrations — Heading Components (H1, H2, H3)
 *
 * Section heading illustrations with distinct typographic hierarchy.
 * H1: Largest, boldest. H2: Medium. H3: Smallest.
 * Uses metadata.label or entity.label for text.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type HeadingLevel = 'H1' | 'H2' | 'H3';

const LEVEL_CONFIG: Record<HeadingLevel, { baseFontSize: number; fontWeight: number }> = {
  H1: { baseFontSize: 28, fontWeight: 700 },
  H2: { baseFontSize: 20, fontWeight: 600 },
  H3: { baseFontSize: 16, fontWeight: 600 },
};

function createHeadingRenderer(level: HeadingLevel) {
  const config = LEVEL_CONFIG[level];

  return function renderHeading(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
    const { outerG, innerG } = buildEntityGroup(entity);

    const s = getSizeParam(entity);
    const color = entity.color ?? getCategoryColor(level);

    const meta = entity.metadata ?? {};
    const label = (meta.label as string) ?? entity.label ?? level;

    const scale = s / 50;
    const fontSize = config.baseFontSize * scale;

    const textEl = document.createElementNS(SVG_NS, 'text');
    textEl.setAttribute('x', '0');
    textEl.setAttribute('y', '0');
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('dominant-baseline', 'central');
    textEl.setAttribute('fill', color);
    textEl.setAttribute('font-size', String(fontSize));
    textEl.setAttribute('font-weight', String(config.fontWeight));
    textEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    textEl.textContent = label;
    innerG.appendChild(textEl);

    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  };
}

export const renderH1 = createHeadingRenderer('H1');
export const renderH2 = createHeadingRenderer('H2');
export const renderH3 = createHeadingRenderer('H3');
