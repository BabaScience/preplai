/**
 * @preplai/illustrations — Stack Layout Primitive
 *
 * Vertical stack of blocks (CallStack, CacheHierarchy, etc.).
 * Returns block positions in local coordinates.
 */

export interface StackBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  /** Optional sub-label or locals preview */
  sublabel?: string;
}

export interface StackLayoutOptions {
  blockWidth?: number;
  blockHeight?: number;
  gap?: number;
}

const DEFAULT_BLOCK_W = 80;
const DEFAULT_BLOCK_H = 28;
const DEFAULT_GAP = 6;

/**
 * Layout a vertical stack of blocks.
 */
export function stackLayout(
  items: Array<{ label: string; sublabel?: string }>,
  options: StackLayoutOptions = {},
): StackBlock[] {
  const blockW = options.blockWidth ?? DEFAULT_BLOCK_W;
  const blockH = options.blockHeight ?? DEFAULT_BLOCK_H;
  const gap = options.gap ?? DEFAULT_GAP;

  const totalH = items.length * blockH + (items.length - 1) * gap;
  const startY = -totalH / 2 + blockH / 2;

  return items.map((item, i) => ({
    x: 0,
    y: startY + i * (blockH + gap),
    width: blockW,
    height: blockH,
    label: item.label,
    sublabel: item.sublabel,
  }));
}
