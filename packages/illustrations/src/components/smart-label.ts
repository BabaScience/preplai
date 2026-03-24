/**
 * @preplai/illustrations — Smart Label Component
 *
 * Adaptive label that switches renderer based on text length:
 *  - Short text (≤ 20 chars): renders as a Concept bubble (circle/rounded)
 *  - Long text (> 20 chars): renders as a Text paragraph (word-wrapped, left-aligned)
 *
 * This prevents the common issue where agents put full sentences into Label
 * entities, causing text to overflow the concept bubble shape.
 */

import type { VisualEntity } from '@preplai/shared';
import { renderConcept } from './concept.js';
import { renderText } from './text.js';

/** Character threshold: above this, use Text renderer instead of Concept */
const CHAR_THRESHOLD = 20;

export function renderSmartLabel(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const text = entity.textContent ?? entity.label ?? '';

  if (text.length <= CHAR_THRESHOLD) {
    // Short text → concept bubble (original Label behavior)
    return renderConcept(entity, parentEl);
  }

  // Long text → word-wrapped paragraph with NO background, NO highlight glow
  const textEntity: VisualEntity = {
    ...entity,
    highlight: false, // Never show glow rectangle on text labels
    metadata: {
      ...(entity.metadata ?? {}),
      maxWidth: (entity.metadata?.maxWidth as number | undefined) ?? 500,
      maxLines: (entity.metadata?.maxLines as number | undefined) ?? 3,
      align: (entity.metadata?.align as string | undefined) ?? 'center',
      background: false, // Never show background card on text labels
    },
  };

  return renderText(textEntity, parentEl);
}
