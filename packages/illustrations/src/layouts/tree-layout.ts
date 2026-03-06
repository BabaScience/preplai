/**
 * @preplai/illustrations — Tree Layout Primitive
 *
 * Recursive node placement + edge lines for binary and multi-child trees.
 * Returns nodes and edges in local coordinates.
 */

/** Per-node visual state (like Array's cells: enabled, selected) */
export type NodeHighlight = 'none' | 'compare' | 'insert' | 'visited' | 'active';

export interface BinaryTreeNode {
  value: string | number;
  id?: string;
  left?: BinaryTreeNode;
  right?: BinaryTreeNode;
  /** Visual highlight state (e.g. binary search comparison, insert target) */
  highlight?: NodeHighlight;
  /** If false, node is dimmed (like Array disabledIndexes) */
  enabled?: boolean;
  /** If true, node has selection glow (like Array selectedIndexes) */
  selected?: boolean;
}

export interface MultiChildTreeNode {
  value: string | number;
  id?: string;
  children?: MultiChildTreeNode[];
  highlight?: NodeHighlight;
  enabled?: boolean;
  selected?: boolean;
}

export type TreeNode = BinaryTreeNode | MultiChildTreeNode;

export interface TreeLayoutNode {
  x: number;
  y: number;
  value: string | number;
  id?: string;
  highlight?: NodeHighlight;
  enabled?: boolean;
  selected?: boolean;
  /** Level-order index (0=root, 1=left, 2=right, …) for disabledIndexes/selectedIndexes */
  levelOrderIndex?: number;
  /** Internal: ref for level-order mapping */
  _treeNode?: BinaryTreeNode;
}

export interface TreeLayoutEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TreeLayoutResult {
  nodes: TreeLayoutNode[];
  edges: TreeLayoutEdge[];
}

const NODE_RADIUS = 12;

function isBinaryNode(node: TreeNode): node is BinaryTreeNode {
  return 'left' in node || 'right' in node;
}

function isMultiChildNode(node: TreeNode): node is MultiChildTreeNode {
  return 'children' in node && Array.isArray((node as MultiChildTreeNode).children);
}

/**
 * Layout a binary tree (left/right children).
 */
export function layoutBinaryTree(
  node: BinaryTreeNode,
  x: number,
  y: number,
  dx: number,
  dy: number,
  options?: TreeLayoutOptions,
): TreeLayoutResult {
  const nodes: TreeLayoutNode[] = [];
  const edges: TreeLayoutEdge[] = [];
  const r = options?.nodeRadius ?? NODE_RADIUS;

  function collectNodes(n: BinaryTreeNode, nx: number, ny: number, ndx: number, ndy: number) {
    nodes.push({
      x: nx,
      y: ny,
      value: n.value,
      id: n.id,
      highlight: n.highlight,
      enabled: n.enabled,
      selected: n.selected,
      _treeNode: n,
    });
    if (n.left) {
      const lx = nx - ndx;
      const ly = ny + ndy;
      edges.push({
        x1: nx - r * 0.7,
        y1: ny + r * 0.7,
        x2: lx + r * 0.7,
        y2: ly - r * 0.7,
      });
      collectNodes(n.left, lx, ly, ndx / 2, ndy);
    }
    if (n.right) {
      const rx = nx + ndx;
      const ry = ny + ndy;
      edges.push({
        x1: nx + r * 0.7,
        y1: ny + r * 0.7,
        x2: rx - r * 0.7,
        y2: ry - r * 0.7,
      });
      collectNodes(n.right, rx, ry, ndx / 2, ndy);
    }
  }

  collectNodes(node, x, y, dx, dy);

  // Assign level-order indices: BFS to get node->index, match layout nodes by pre-order
  const levelOrderList: BinaryTreeNode[] = [];
  const queue: BinaryTreeNode[] = [node];
  while (queue.length) {
    const n = queue.shift()!;
    levelOrderList.push(n);
    if (n.left) queue.push(n.left);
    if (n.right) queue.push(n.right);
  }
  const nodeToLevelIdx = new Map<BinaryTreeNode, number>();
  levelOrderList.forEach((n, i) => nodeToLevelIdx.set(n, i));

  nodes.forEach((nd) => {
    const tn = (nd as TreeLayoutNode)._treeNode;
    if (tn) {
      const loIdx = nodeToLevelIdx.get(tn);
      if (loIdx != null) (nd as TreeLayoutNode).levelOrderIndex = loIdx;
      delete (nd as TreeLayoutNode)._treeNode;
    }
  });

  return { nodes, edges };
}

/** Flat node spec (like Array cells): value + optional visual state */
export type FlatNodeSpec = {
  value: string | number;
  enabled?: boolean;
  selected?: boolean;
  highlight?: NodeHighlight;
};

/**
 * Build a BinaryTreeNode from a flat level-order array (like Array's values/cells).
 * Index i has left at 2*i+1, right at 2*i+2. Null/undefined slots are skipped.
 */
export function treeFromFlatNodes(nodes: (string | number | FlatNodeSpec | null | undefined)[]): BinaryTreeNode | null {
  if (!nodes.length || nodes[0] == null) return null;
  const raw = nodes[0];
  const opts = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<FlatNodeSpec>;
  const val: string | number = typeof opts.value !== 'undefined' ? opts.value : (raw as string | number);
  const left = treeFromFlatNodesRec(nodes, 1);
  const right = treeFromFlatNodesRec(nodes, 2);
  const n: BinaryTreeNode = {
    value: val,
    highlight: opts.highlight,
    enabled: opts.enabled,
    selected: opts.selected,
  };
  if (left) n.left = left;
  if (right) n.right = right;
  return n;
}

function treeFromFlatNodesRec(
  nodes: (string | number | FlatNodeSpec | null | undefined)[],
  idx: number,
): BinaryTreeNode | undefined {
  if (idx >= nodes.length || nodes[idx] == null) return undefined;
  const raw = nodes[idx];
  const opts = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<FlatNodeSpec>;
  const val: string | number = typeof opts.value !== 'undefined' ? opts.value : (raw as string | number);
  const left = treeFromFlatNodesRec(nodes, 2 * idx + 1);
  const right = treeFromFlatNodesRec(nodes, 2 * idx + 2);
  const n: BinaryTreeNode = {
    value: val,
    highlight: opts.highlight,
    enabled: opts.enabled,
    selected: opts.selected,
  };
  if (left) n.left = left;
  if (right) n.right = right;
  return n;
}

export interface TreeLayoutOptions {
  /** Node radius for edge endpoints (default 12). Use scaled radius for correct edge length. */
  nodeRadius?: number;
}

/**
 * Layout a multi-child tree (B-tree, AST, etc.).
 * Children are spread horizontally. Uses generous spacing to avoid overlap.
 */
export function layoutMultiChildTree(
  node: MultiChildTreeNode,
  x: number,
  y: number,
  dx: number,
  dy: number,
  options?: TreeLayoutOptions,
): TreeLayoutResult {
  const nodes: TreeLayoutNode[] = [];
  const edges: TreeLayoutEdge[] = [];
  const r = options?.nodeRadius ?? NODE_RADIUS;

  function collectNodes(n: MultiChildTreeNode, nx: number, ny: number, ndx: number, ndy: number) {
    nodes.push({
      x: nx,
      y: ny,
      value: n.value,
      id: n.id,
      highlight: n.highlight,
      enabled: n.enabled,
      selected: n.selected,
    });
    const children = n.children ?? [];
    if (children.length === 0) return;

    // Keep more horizontal space per level — divide by sqrt(children) instead of children
    const nextNdx = ndx / Math.max(Math.sqrt(children.length), 1);
    const totalWidth = (children.length - 1) * nextNdx;
    const startX = nx - totalWidth / 2;

    children.forEach((child, i) => {
      const cx = startX + i * nextNdx;
      const cy = ny + ndy;
      edges.push({
        x1: nx,
        y1: ny + r * 0.7,
        x2: cx,
        y2: cy - r * 0.7,
      });
      collectNodes(child, cx, cy, nextNdx, ndy);
    });
  }

  collectNodes(node, x, y, dx, dy);
  return { nodes, edges };
}

/**
 * Layout a generic tree. Detects binary vs multi-child structure.
 */
export function treeLayout(
  node: TreeNode,
  x: number,
  y: number,
  dx: number,
  dy: number,
  options?: TreeLayoutOptions,
): TreeLayoutResult {
  if (isBinaryNode(node)) {
    return layoutBinaryTree(node, x, y, dx, dy, options);
  }
  if (isMultiChildNode(node)) {
    return layoutMultiChildTree(node, x, y, dx, dy, options);
  }
  // Fallback: single node (e.g. TreeNode with only value)
  const n = node as { value: string | number; id?: string; highlight?: NodeHighlight; enabled?: boolean; selected?: boolean };
  return {
    nodes: [{ x, y, value: n.value, id: n.id, highlight: n.highlight, enabled: n.enabled, selected: n.selected }],
    edges: [],
  };
}
