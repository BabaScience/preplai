/**
 * @preplai/illustrations — Tree Layout Primitive
 *
 * Recursive node placement + edge lines for binary and multi-child trees.
 * Returns nodes and edges in local coordinates.
 */

export interface BinaryTreeNode {
  value: string | number;
  left?: BinaryTreeNode;
  right?: BinaryTreeNode;
}

export interface MultiChildTreeNode {
  value: string | number;
  children?: MultiChildTreeNode[];
}

export type TreeNode = BinaryTreeNode | MultiChildTreeNode;

export interface TreeLayoutNode {
  x: number;
  y: number;
  value: string | number;
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
): TreeLayoutResult {
  const nodes: TreeLayoutNode[] = [];
  const edges: TreeLayoutEdge[] = [];

  function collectNodes(n: BinaryTreeNode, nx: number, ny: number, ndx: number, ndy: number) {
    nodes.push({ x: nx, y: ny, value: n.value });
    if (n.left) {
      const lx = nx - ndx;
      const ly = ny + ndy;
      edges.push({
        x1: nx - NODE_RADIUS * 0.7,
        y1: ny + NODE_RADIUS * 0.7,
        x2: lx + NODE_RADIUS * 0.7,
        y2: ly - NODE_RADIUS * 0.7,
      });
      collectNodes(n.left, lx, ly, ndx / 2, ndy);
    }
    if (n.right) {
      const rx = nx + ndx;
      const ry = ny + ndy;
      edges.push({
        x1: nx + NODE_RADIUS * 0.7,
        y1: ny + NODE_RADIUS * 0.7,
        x2: rx - NODE_RADIUS * 0.7,
        y2: ry - NODE_RADIUS * 0.7,
      });
      collectNodes(n.right, rx, ry, ndx / 2, ndy);
    }
  }

  collectNodes(node, x, y, dx, dy);
  return { nodes, edges };
}

/**
 * Layout a multi-child tree (B-tree, AST, etc.).
 * Children are spread horizontally.
 */
export function layoutMultiChildTree(
  node: MultiChildTreeNode,
  x: number,
  y: number,
  dx: number,
  dy: number,
): TreeLayoutResult {
  const nodes: TreeLayoutNode[] = [];
  const edges: TreeLayoutEdge[] = [];

  function collectNodes(n: MultiChildTreeNode, nx: number, ny: number, ndx: number, ndy: number) {
    nodes.push({ x: nx, y: ny, value: n.value });
    const children = n.children ?? [];
    if (children.length === 0) return;

    const totalWidth = (children.length - 1) * ndx;
    const startX = nx - totalWidth / 2;

    children.forEach((child, i) => {
      const cx = startX + i * ndx;
      const cy = ny + ndy;
      edges.push({
        x1: nx,
        y1: ny + NODE_RADIUS * 0.7,
        x2: cx,
        y2: cy - NODE_RADIUS * 0.7,
      });
      collectNodes(child, cx, cy, ndx / Math.max(children.length, 1.5), ndy);
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
): TreeLayoutResult {
  if (isBinaryNode(node)) {
    return layoutBinaryTree(node, x, y, dx, dy);
  }
  if (isMultiChildNode(node)) {
    return layoutMultiChildTree(node, x, y, dx, dy);
  }
  // Fallback: single node (e.g. TreeNode with only value)
  const val = (node as { value: string | number }).value;
  return { nodes: [{ x, y, value: val }], edges: [] };
}
