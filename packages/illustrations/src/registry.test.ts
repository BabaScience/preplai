/**
 * @preplai/illustrations — Registry Tests
 * TDD: Tests written FIRST, implementation follows.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { registry, renderEntity } from './registry.js';
import type { VisualEntity } from '@preplai/shared';

function makeEntity(overrides: Partial<VisualEntity> = {}): VisualEntity {
  return {
    id: 'test-entity',
    type: 'Server',
    position: { x: 50, y: 50 },
    ...overrides,
  } as VisualEntity;
}

describe('registry', () => {
  it('should export a registry object', () => {
    expect(registry).toBeDefined();
    expect(typeof registry).toBe('object');
  });

  it('should have Server render function', () => {
    expect(typeof registry['Server']).toBe('function');
  });

  it('should have Database render function', () => {
    expect(typeof registry['Database']).toBe('function');
  });

  it('should have Arrow render function', () => {
    expect(typeof registry['Arrow']).toBe('function');
  });

  it('should have User render function', () => {
    expect(typeof registry['User']).toBe('function');
  });

  it('should have Cloud render function', () => {
    expect(typeof registry['Cloud']).toBe('function');
  });

  it('should have Concept render function', () => {
    expect(typeof registry['Concept']).toBe('function');
  });

  it('should have Graph2D render function', () => {
    expect(typeof registry['Graph2D']).toBe('function');
  });

  it('should have CodeBlock render function', () => {
    expect(typeof registry['CodeBlock']).toBe('function');
  });

  it('should have all infrastructure types registered', () => {
    const infraTypes = [
      'User', 'Server', 'Database', 'Container', 'Pod', 'Cloud',
      'Network', 'Device', 'Arrow', 'DataFlow', 'Process', 'Queue',
      'Cache', 'LoadBalancer', 'Service', 'Firewall', 'APIGateway',
      'Lambda', 'Subnet', 'Volume', 'Registry', 'Monitor', 'Pipeline',
      'Decision', 'Cluster',
      'DNSResolver', 'Decorator', 'BindMount', 'Tmpfs',
      'DockerImage', 'DockerRegistry',
    ];
    for (const type of infraTypes) {
      expect(typeof registry[type], `registry['${type}'] should be a function`).toBe('function');
    }
  });

  it('should have all universal types registered', () => {
    const types = [
      'Concept', 'Entity', 'Group', 'Label', 'Comparison',
      'Timeline', 'Metric', 'Cycle', 'Stack', 'Tree', 'Badge', 'Quote',
    ];
    for (const type of types) {
      expect(typeof registry[type], `registry['${type}'] should be a function`).toBe('function');
    }
  });

  it('should have all data structure types registered', () => {
    const types = [
      'Array', 'LinkedList', 'BinaryTree', 'BTree', 'HashTable', 'Dict',
      'Heap', 'GraphDS', 'Trie', 'List', 'Tuple', 'Set',
    ];
    for (const type of types) {
      expect(typeof registry[type], `registry['${type}'] should be a function`).toBe('function');
    }
  });

  it('should have all CS-specific types registered', () => {
    const types = [
      'ArrayCell', 'Pointer', 'RecursionTree',
      'FSM', 'StateNode', 'Transition',
      'CPU', 'Register', 'MemoryBlock', 'LogicGate', 'Bus',
      'ProcessBlock', 'ProcessState', 'GanttChart', 'PageTable', 'DeadlockGraph',
      'MemoryMap', 'Thread',
      'CacheHierarchy', 'PipelineStage', 'MemoryLayout',
      'Packet', 'ProtocolStack',
      'NeuralNetwork', 'DecisionBoundary', 'ConfusionMatrix',
      'AST', 'CallStack', 'ParseTree', 'SymbolTable', 'QueryPlan',
      'Semaphore', 'Mutex', 'OSILayer', 'ProtocolLayer',
      'TuringMachine', 'BigO', 'SortAnimation', 'GraphTraversal',
    ];
    for (const type of types) {
      expect(typeof registry[type], `registry['${type}'] should be a function`).toBe('function');
    }
  });
});

describe('renderEntity dispatcher', () => {
  let parentEl: SVGSVGElement;

  beforeEach(() => {
    parentEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    parentEl.setAttribute('viewBox', '0 0 1920 1080');
  });

  it('should dispatch to the correct render function and append to parent', () => {
    const entity = makeEntity({ id: 'srv-1', type: 'Server' });
    const result = renderEntity(entity, parentEl);
    expect(result).not.toBeNull();
    expect(parentEl.querySelector('#srv-1')).toBeTruthy();
  });

  it('should return null and warn for unknown entity types', () => {
    const entity = makeEntity({ type: 'UnknownThing' as any });
    const result = renderEntity(entity, parentEl);
    expect(result).toBeNull();
  });

  it('should pass allEntities to Arrow type', () => {
    const entities = [
      makeEntity({ id: 'src', type: 'Server', position: { x: 20, y: 50 } }),
      makeEntity({ id: 'tgt', type: 'Database', position: { x: 80, y: 50 } }),
      makeEntity({
        id: 'arr-1',
        type: 'Arrow',
        sourceEntityId: 'src',
        targetEntityId: 'tgt',
      }),
    ];
    // Render source and target first
    renderEntity(entities[0], parentEl);
    renderEntity(entities[1], parentEl);
    // Now render arrow with allEntities
    const result = renderEntity(entities[2], parentEl, entities);
    expect(result).not.toBeNull();
    expect(parentEl.querySelector('#arr-1')).toBeTruthy();
  });

  it('should render DataFlow with allEntities', () => {
    const entities = [
      makeEntity({ id: 'a', type: 'Server', position: { x: 10, y: 30 } }),
      makeEntity({ id: 'b', type: 'Database', position: { x: 90, y: 30 } }),
      makeEntity({
        id: 'df-1',
        type: 'DataFlow',
        sourceEntityId: 'a',
        targetEntityId: 'b',
      }),
    ];
    renderEntity(entities[0], parentEl);
    renderEntity(entities[1], parentEl);
    const result = renderEntity(entities[2], parentEl, entities);
    expect(result).not.toBeNull();
  });

  it('should render new CS entity types (AST, CallStack, BTree, etc.)', () => {
    const types = ['AST', 'CallStack', 'BTree', 'ProcessState', 'GanttChart', 'CacheHierarchy', 'MemoryLayout', 'ConfusionMatrix'] as const;
    for (const type of types) {
      const entity = makeEntity({ id: `cs-${type}`, type, position: { x: 50, y: 50 } });
      const result = renderEntity(entity, parentEl);
      expect(result, `Failed to render ${type}`).not.toBeNull();
      expect(parentEl.querySelector(`#cs-${type}`), `DOM missing for ${type}`).toBeTruthy();
    }
  });
});
