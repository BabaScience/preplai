/**
 * @preplai/illustrations — Wave Component
 *
 * Parametric waveform (sine, square, sawtooth) as SVG path.
 * Use for: physics (waves, signals), oscillators, frequency concepts.
 *
 * Metadata: { frequency?, amplitude?, phase?, waveType?: 'sine'|'square'|'sawtooth' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type WaveType = 'sine' | 'square' | 'sawtooth';

function sampleWave(t: number, waveType: WaveType): number {
  switch (waveType) {
    case 'square':
      return Math.sin(t * Math.PI * 2) >= 0 ? 1 : -1;
    case 'sawtooth':
      return 2 * (t - Math.floor(t)) - 1;
    case 'sine':
    default:
      return Math.sin(t * Math.PI * 2);
  }
}

export function renderWave(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Wave');
  const meta = entity.metadata ?? {};

  const totalW = s * 2.4;
  const totalH = s * 1.2;
  const amp = (meta.amplitude as number) ?? totalH * 0.35;
  const freq = (meta.frequency as number) ?? 2;
  const phase = (meta.phase as number) ?? 0;
  const waveType = (meta.waveType as WaveType) ?? 'sine';

  const strokeWidth = getStrokeWidth('default', scale);

  // Background panel
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(-totalW / 2));
  bg.setAttribute('y', String(-totalH / 2));
  bg.setAttribute('width', String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', String(SHAPES.borderRadius));
  bg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  bg.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
  bg.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
  innerG.appendChild(bg);

  // Center baseline
  const baseline = document.createElementNS(SVG_NS, 'line');
  baseline.setAttribute('x1', String(-totalW / 2));
  baseline.setAttribute('y1', '0');
  baseline.setAttribute('x2', String(totalW / 2));
  baseline.setAttribute('y2', '0');
  baseline.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
  baseline.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale)));
  baseline.setAttribute('stroke-dasharray', '4,3');
  innerG.appendChild(baseline);

  // Wave path
  const steps = 80;
  const dx = totalW / steps;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * freq + phase / (2 * Math.PI);
    const py = -amp * sampleWave(t, waveType);
    const px = -totalW / 2 + i * dx;
    parts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`);
  }

  const wavePath = document.createElementNS(SVG_NS, 'path');
  wavePath.setAttribute('d', parts.join(' '));
  wavePath.setAttribute('fill', 'none');
  wavePath.setAttribute('stroke', color);
  wavePath.setAttribute('stroke-width', String(strokeWidth));
  wavePath.setAttribute('stroke-linecap', 'round');
  wavePath.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(wavePath);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
