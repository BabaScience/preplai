/**
 * @preplai/illustrations — Service Component
 *
 * Service endpoint icon: hexagon with { } parameter brackets inside.
 * Suggests API/configuration/parameters rather than a sun/cogwheel.
 * Second level: metadata.kind specifies variant (API, Service, APIGateway, or custom).
 * - Hub text: metadata.hubLabel ?? metadata.kind ?? "Service"
 * - Label below: entity.label (the actual name, e.g. "Auth Service", "REST API")
 * - kind === "API": subtle pulse; otherwise static
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** Resolve the "kind" of service (API, Service, APIGateway, or custom). */
function getServiceKind(entity: VisualEntity): string {
  return (entity.metadata?.kind as string) ?? 'Service';
}

export function renderService(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const kind = getServiceKind(entity);
  const pulse = kind === 'API';

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Service');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-service-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  // ── Hexagon (service endpoint shape; distinct from LoadBalancer's Y-fork)
  const hexPoints = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${(Math.cos(angle) * s * 0.5).toFixed(1)},${(Math.sin(angle) * s * 0.5).toFixed(1)}`;
    })
    .join(' ');

  const contentG = document.createElementNS(SVG_NS, 'g');
  if (pulse) {
    contentG.setAttribute('transform-origin', '0 0');
    const animate = document.createElementNS(SVG_NS, 'animate');
    animate.setAttribute('attributeName', 'opacity');
    animate.setAttribute('values', '1;0.85;1');
    animate.setAttribute('dur', '2s');
    animate.setAttribute('repeatCount', 'indefinite');
    contentG.appendChild(animate);
  }

  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', hexPoints);
  polygon.setAttribute('fill', `url(#${gradId})`);
  polygon.setAttribute('stroke', color);
  polygon.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  polygon.setAttribute('stroke-linejoin', 'round');
  contentG.appendChild(polygon);

  // ── { Service } parameter-style text inside (suggests API/endpoint/configuration)
  const hubText = (entity.metadata?.hubLabel as string) ?? kind;
  const paramText = `{ ${hubText} }`;
  const paramFontSize = Math.min(11, Math.floor(s * 0.32));
  const param = document.createElementNS(SVG_NS, 'text');
  param.setAttribute('x', '0');
  param.setAttribute('y', '4');
  param.setAttribute('text-anchor', 'middle');
  param.setAttribute('fill', color);
  param.setAttribute('font-size', String(paramFontSize));
  param.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  param.setAttribute('font-family', TYPOGRAPHY.fontCode);
  param.setAttribute('opacity', '0.95');
  param.textContent = paramText;
  contentG.appendChild(param);

  innerG.appendChild(contentG);

  // ── Label below: the actual name of the service (e.g. "Auth Service", "User Service")
  const serviceName = entity.label ?? (entity.metadata?.label as string);
  if (serviceName) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(s / 2 + 18));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = serviceName;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
