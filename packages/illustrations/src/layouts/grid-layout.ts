/**
 * @preplai/illustrations — Grid Layout Primitive
 *
 * Rows x cols grid with optional headers.
 * Returns cell positions in local coordinates.
 */

export interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  /** Optional: for ConfusionMatrix TP/FP/TN/FN styling */
  cellType?: 'tp' | 'fp' | 'tn' | 'fn' | 'header' | 'normal';
}

export interface GridLayoutOptions {
  cellWidth?: number;
  cellHeight?: number;
  gap?: number;
  cols?: number;
  /** If true, first row/col are headers */
  hasRowHeaders?: boolean;
  hasColHeaders?: boolean;
}

const DEFAULT_CELL_W = 36;
const DEFAULT_CELL_H = 22;
const DEFAULT_GAP = 4;

/**
 * Layout a grid from a 2D array of cell contents.
 */
export function gridLayoutFromMatrix(
  matrix: string[][],
  options: GridLayoutOptions = {},
): GridCell[] {
  const cellW = options.cellWidth ?? DEFAULT_CELL_W;
  const cellH = options.cellHeight ?? DEFAULT_CELL_H;
  const gap = options.gap ?? DEFAULT_GAP;
  const cols = options.cols ?? (matrix[0]?.length ?? 1);
  const hasRowHeaders = options.hasRowHeaders ?? false;
  const hasColHeaders = options.hasColHeaders ?? false;

  const rows = matrix.length;
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const startX = -totalW / 2 + cellW / 2 + gap / 2;
  const startY = -totalH / 2 + cellH / 2 + gap / 2;

  const cells: GridCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const content = matrix[r]?.[c] ?? '';
      const x = startX + c * (cellW + gap);
      const y = startY + r * (cellH + gap);
      let cellType: GridCell['cellType'] = 'normal';
      if (hasRowHeaders && r === 0) cellType = 'header';
      if (hasColHeaders && c === 0) cellType = 'header';
      if (hasRowHeaders && hasColHeaders && (r === 0 || c === 0)) cellType = 'header';
      cells.push({ x, y, width: cellW, height: cellH, content, cellType });
    }
  }
  return cells;
}

/**
 * Layout a grid from key-value pairs (HashTable style).
 */
export function gridLayoutFromPairs(
  pairs: [string, string][],
  options: GridLayoutOptions = {},
): GridCell[] {
  const cellW = options.cellWidth ?? DEFAULT_CELL_W;
  const cellH = options.cellHeight ?? DEFAULT_CELL_H;
  const gap = options.gap ?? DEFAULT_GAP;
  const cols = options.cols ?? 2;

  const rows = Math.ceil(pairs.length / cols);
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const startX = -totalW / 2 + cellW / 2 + gap / 2;
  const startY = -totalH / 2 + cellH / 2 + gap / 2;

  const cells: GridCell[] = [];
  pairs.forEach(([key, val], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cellW + gap);
    const y = startY + row * (cellH + gap);
    cells.push({
      x,
      y,
      width: cellW,
      height: cellH,
      content: `${key}:${val}`,
      cellType: 'normal',
    });
  });
  return cells;
}

/**
 * Get total dimensions of a grid layout.
 */
export function gridLayoutDimensions(cells: GridCell[], _gap: number = DEFAULT_GAP): { width: number; height: number } {
  if (cells.length === 0) return { width: 0, height: 0 };
  const maxX = Math.max(...cells.map(c => c.x + c.width / 2));
  const minX = Math.min(...cells.map(c => c.x - c.width / 2));
  const maxY = Math.max(...cells.map(c => c.y + c.height / 2));
  const minY = Math.min(...cells.map(c => c.y - c.height / 2));
  return { width: maxX - minX, height: maxY - minY };
}
