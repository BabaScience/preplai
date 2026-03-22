/**
 * @preplai/illustrations — MindMapNode Component
 * Central topic circle with radiating curved branches for brainstorming.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface MindMapBranch {
  label: string;
}

interface MindMapMetadata {
  topic?: string;
  branches?: MindMapBranch[];
}

export function renderMindMapNode(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('MindMapNode');

  const meta = (entity.metadata ?? {}) as MindMapMetadata;
  const topic = meta.topic ?? 'Topic';
  const branches = (meta.branches ?? []).slice(0, 6);

  const centerR = size * 0.4;
  const branchR = size * 0.18;
  const orbitR = size * 1.1;

  // ── Branch lines and nodes ──
  for (let i = 0; i < branches.length; i++) {
    const angle = (i / branches.length) * Math.PI * 2 - Math.PI / 2;
    const bx = Math.cos(angle) * orbitR;
    const by = Math.sin(angle) * orbitR;

    // Curved line from center to branch (quadratic bezier with slight offset)
    const cpOffset = orbitR * 0.3;
    const perpAngle = angle + Math.PI / 2;
    const cpx = (bx / 2) + Math.cos(perpAngle) * cpOffset;
    const cpy = (by / 2) + Math.sin(perpAngle) * cpOffset;

    const line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', `M 0 0 Q ${cpx} ${cpy} ${bx} ${by}`);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.default));
    line.setAttribute('opacity', '0.5');
    innerG.appendChild(line);

    // Branch circle
    const branchCircle = document.createElementNS(SVG_NS, 'circle');
    branchCircle.setAttribute('cx', String(bx));
    branchCircle.setAttribute('cy', String(by));
    branchCircle.setAttribute('r', String(branchR));
    branchCircle.setAttribute('fill', `${color}${OPACITY.fillLight}`);
    branchCircle.setAttribute('stroke', color);
    branchCircle.setAttribute('stroke-width', String(STROKE.thin));
    branchCircle.setAttribute('opacity', '0.6');
    innerG.appendChild(branchCircle);

    // Branch label inside circle
    const branchLabel = document.createElementNS(SVG_NS, 'text');
    branchLabel.setAttribute('x', String(bx));
    branchLabel.setAttribute('y', String(by + 4));
    branchLabel.setAttribute('text-anchor', 'middle');
    branchLabel.setAttribute('fill', color);
    branchLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue));
    branchLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    branchLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    branchLabel.setAttribute('opacity', '0.85');
    branchLabel.textContent = branches[i].label.length > 10
      ? branches[i].label.slice(0, 9) + '\u2026'
      : branches[i].label;
    innerG.appendChild(branchLabel);
  }

  // ── Central circle (drawn after branches so it sits on top) ──
  const centerCircle = document.createElementNS(SVG_NS, 'circle');
  centerCircle.setAttribute('cx', '0');
  centerCircle.setAttribute('cy', '0');
  centerCircle.setAttribute('r', String(centerR));
  centerCircle.setAttribute('fill', `${color}${OPACITY.fillMedium}`);
  centerCircle.setAttribute('stroke', color);
  centerCircle.setAttribute('stroke-width', String(STROKE.emphasized));
  innerG.appendChild(centerCircle);

  // Central topic text
  const topicText = document.createElementNS(SVG_NS, 'text');
  topicText.setAttribute('x', '0');
  topicText.setAttribute('y', '5');
  topicText.setAttribute('text-anchor', 'middle');
  topicText.setAttribute('fill', color);
  topicText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBodyMax));
  topicText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  topicText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  topicText.textContent = topic.length > 14 ? topic.slice(0, 13) + '\u2026' : topic;
  innerG.appendChild(topicText);

  // ── Entity label below the whole component ──
  if (entity.label) {
    const labelY = orbitR + branchR + 22;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
