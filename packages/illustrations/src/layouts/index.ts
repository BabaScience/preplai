/**
 * @preplai/illustrations — Layout Primitives
 *
 * Reusable layout algorithms for tree, grid, stack, and timeline components.
 */

export {
  layoutBinaryTree,
  layoutMultiChildTree,
  treeLayout,
  treeFromFlatNodes,
  type BinaryTreeNode,
  type MultiChildTreeNode,
  type TreeNode,
  type TreeLayoutNode,
  type TreeLayoutEdge,
  type TreeLayoutResult,
  type NodeHighlight,
  type FlatNodeSpec,
  type TreeLayoutOptions,
} from './tree-layout.js';

export {
  gridLayoutFromMatrix,
  gridLayoutFromPairs,
  gridLayoutDimensions,
  type GridCell,
  type GridLayoutOptions,
} from './grid-layout.js';

export {
  stackLayout,
  type StackBlock,
  type StackLayoutOptions,
} from './stack-layout.js';

export {
  timelineLayout,
  ganttLayout,
  type TimelineMarker,
  type GanttTask,
  type GanttBar,
  type TimelineLayoutResult,
} from './timeline-layout.js';
