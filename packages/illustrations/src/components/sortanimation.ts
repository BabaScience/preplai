/**
 * @preplai/illustrations — SortAnimation Component (Cinematic Depth)
 *
 * Renders an array with sort-algorithm metadata (compare, swap, done states).
 * Delegates to renderArray which already has full cinematic depth treatment.
 * Uses same metadata as Array: values, compareIndexes, swapIndexes, doneIndexes, pointerLabels.
 */

import type { VisualEntity } from '@preplai/shared';
import { renderArray } from './array.js';
import { getCategoryColor } from '../design-tokens.js';

export function renderSortAnimation(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const color = entity.color ?? getCategoryColor('SortAnimation');
  const entityWithColor = { ...entity, color };
  return renderArray(entityWithColor, parentEl);
}
