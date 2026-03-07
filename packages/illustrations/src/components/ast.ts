/**
 * @preplai/illustrations — AST Component
 * Abstract Syntax Tree: parse tree with type/value/children
 *
 * Metadata: { ast: { type, value?, children? } }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import { treeLayout, type MultiChildTreeNode } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface ASTNode {
  type: string;
  value?: string | number;
  children?: ASTNode[];
}

function astToTreeNode(ast: ASTNode): MultiChildTreeNode {
  const display = ast.value != null ? String(ast.value) : ast.type;
  return {
    value: display,
    children: ast.children?.map(astToTreeNode),
  };
}

export function renderAST(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('AST');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ast-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const astData = meta.ast as ASTNode | undefined;
  const defaultAst: ASTNode = {
    type: 'Program',
    children: [
      { type: 'FunctionDecl', value: 'main' },
      { type: 'BinaryExpr', children: [
        { type: 'Literal', value: '1' },
        { type: 'Literal', value: '2' },
      ]},
    ],
  };
  const ast = astData ?? defaultAst;
  const tree = astToTreeNode(ast);

  const dx = s * 0.45;
  const dy = s * 0.32;
  const { nodes, edges } = treeLayout(tree, 0, -s / 3, dx, dy);

  edges.forEach(({ x1, y1, x2, y2 }) => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity', '0.7');
    innerG.appendChild(line);
  });

  nodes.forEach(({ x, y, value }) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    const w = Math.max(40, String(value).length * 7);
    rect.setAttribute('x', String(x - w / 2));
    rect.setAttribute('y', String(y - 10));
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', '20');
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', '2');
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = String(value);
    innerG.appendChild(text);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + 18));
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
