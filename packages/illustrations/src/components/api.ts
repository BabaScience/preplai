/**
 * @preplai/illustrations — API Component
 *
 * Inherits from the service illustration (cogwheel with text in hub).
 * Displays "API" inside the gear; uses entity.label for optional text below.
 */

import { renderService } from './service.js';
import type { VisualEntity } from '@preplai/shared';

/**
 * Renders an API entity using the service cogwheel with "API" in the hub.
 */
export function renderAPI(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  return renderService(entity, parentEl, 'API');
}
