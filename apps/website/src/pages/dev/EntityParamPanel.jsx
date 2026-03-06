import { useState, useEffect } from 'react';
import { ENTITY_DEFAULTS } from '@preplai/shared';

/** Types that inherit from text-card (same metadata: label, width, maxLines) */
const CARD_TYPES = ['Analogy', 'Annotation', 'Label', 'Comparison', 'Proof', 'Quote', 'Stack'];

/** Connection types (Arrow, DataFlow, etc.) — need source/target + special params */
const CONNECTION_TYPES = ['Arrow', 'DataFlow', 'Transition', 'Bus'];

export default function EntityParamPanel({ entity, onChange, onCopy, error }) {
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [btreeTreeJson, setBtreeTreeJson] = useState('');

  const update = (path, value) => {
    const next = JSON.parse(JSON.stringify(entity));
    if (path === 'position') {
      next.position = { ...next.position, ...value };
    } else if (path === 'animation') {
      next.animation = { ...(next.animation || {}), ...value };
    } else if (path === 'metadata') {
      next.metadata = value;
    } else {
      next[path] = value;
    }
    onChange(next);
  };

  const handleJsonApply = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.id && parsed.type && parsed.position) {
        onChange(parsed);
        setShowJson(false);
      } else {
        alert('JSON must have id, type, and position');
      }
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  };

  const handleCopy = () => {
    const json = JSON.stringify(entity, null, 2);
    navigator.clipboard.writeText(json).then(() => onCopy?.());
  };

  // Sync BTree tree JSON when entity changes (e.g. from Apply, or type switch)
  useEffect(() => {
    if (entity?.type === 'BTree') {
      setBtreeTreeJson(JSON.stringify(entity.metadata?.tree ?? {}, null, 2));
    }
  }, [entity?.type, entity?.metadata?.tree]);

  if (!entity) {
    return (
      <div className="dev-panel dev-panel-right">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Select an entity type to edit parameters
        </p>
      </div>
    );
  }

  return (
    <div className="dev-panel dev-panel-right">
      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
        Parameters
      </h3>

      {error && (
        <div
          style={{
            padding: 'var(--space-2)',
            background: 'rgba(239, 68, 68, 0.15)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-error)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Position X (0–100)</label>
        <input
          type="number"
          className="form-input"
          min={0}
          max={100}
          step={1}
          value={entity.position?.x ?? 50}
          onChange={(e) => update('position', { x: Number(e.target.value) })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Position Y (0–100)</label>
        <input
          type="number"
          className="form-input"
          min={0}
          max={100}
          step={1}
          value={entity.position?.y ?? 50}
          onChange={(e) => update('position', { y: Number(e.target.value) })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Size</label>
        <input
          type="number"
          className="form-input"
          min={0.5}
          max={3}
          step={0.1}
          value={entity.size ?? ENTITY_DEFAULTS.size}
          onChange={(e) => update('size', Number(e.target.value))}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Label</label>
        <input
          type="text"
          className="form-input"
          value={entity.label ?? ''}
          onChange={(e) => update('label', e.target.value)}
          placeholder="Optional label"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Color</label>
        <input
          type="text"
          className="form-input"
          value={entity.color ?? ENTITY_DEFAULTS.color}
          onChange={(e) => update('color', e.target.value)}
          placeholder={ENTITY_DEFAULTS.color}
        />
      </div>
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <input
          type="checkbox"
          id="highlight"
          checked={entity.highlight ?? ENTITY_DEFAULTS.highlight}
          onChange={(e) => update('highlight', e.target.checked)}
        />
        <label htmlFor="highlight" className="form-label" style={{ marginBottom: 0 }}>
          Highlight
        </label>
      </div>

      {CONNECTION_TYPES.includes(entity.type) && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Connection metadata</h4>
          <div className="form-group">
            <label className="form-label">Source entity ID</label>
            <input
              type="text"
              className="form-input"
              value={entity.sourceEntityId ?? ''}
              onChange={(e) => update('sourceEntityId', e.target.value)}
              placeholder="debug-src (A in preview)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Target entity ID</label>
            <input
              type="text"
              className="form-input"
              value={entity.targetEntityId ?? ''}
              onChange={(e) => update('targetEntityId', e.target.value)}
              placeholder="debug-tgt (B in preview)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Label (on arrow)</label>
            <input
              type="text"
              className="form-input"
              value={entity.label ?? ''}
              onChange={(e) => update('label', e.target.value)}
              placeholder="Optional label"
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="curved"
              checked={entity.metadata?.curved === true}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  curved: e.target.checked,
                })
              }
            />
            <label htmlFor="curved" className="form-label" style={{ marginBottom: 0 }}>
              Curved
            </label>
          </div>
        </>
      )}

      {CARD_TYPES.includes(entity.type) && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Card metadata</h4>
          <div className="form-group">
            <label className="form-label">Label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.label ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  label: e.target.value,
                })
              }
              placeholder="Binary search is like a phone book"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Width (scale units)</label>
            <input
              type="number"
              className="form-input"
              min={30}
              max={120}
              value={entity.metadata?.width ?? 56}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  width: Number(e.target.value) || 56,
                })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max lines</label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={6}
              value={entity.metadata?.maxLines ?? 3}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  maxLines: Math.max(1, Math.min(6, Number(e.target.value) || 3)),
                })
              }
            />
          </div>
        </>
      )}

      {entity.type === 'BTree' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            BTree metadata
          </h4>
          <div className="form-group">
            <label className="form-label">Branching factor</label>
            <input
              type="number"
              className="form-input"
              min={2}
              max={10}
              value={entity.metadata?.branchingFactor ?? 3}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  branchingFactor: Math.max(2, Math.min(10, Number(e.target.value) || 3)),
                })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tree (JSON)</label>
            <textarea
              className="form-input"
              rows={8}
              value={btreeTreeJson}
              onChange={(e) => {
                const raw = e.target.value;
                setBtreeTreeJson(raw);
                try {
                  const tree = JSON.parse(raw || '{}');
                  if (tree && typeof tree === 'object') {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      tree,
                    });
                  }
                } catch (_) {
                  // Invalid JSON while typing — keep local state, don't update entity
                }
              }}
              onBlur={() => {
                try {
                  const tree = JSON.parse(btreeTreeJson || '{}');
                  if (tree && typeof tree === 'object') {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      tree,
                    });
                  }
                } catch (_) {
                  // Restore valid JSON on blur if invalid
                  setBtreeTreeJson(JSON.stringify(entity.metadata?.tree ?? {}, null, 2));
                }
              }}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
              placeholder='{"value": "[10,20]", "children": [...]}'
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Nested structure: value + children array. Syncs to preview on valid JSON.
            </p>
          </div>
        </>
      )}

      {entity.type === 'BinaryTree' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            {entity.type} metadata
          </h4>
          <div className="form-group">
            <label className="form-label">Nodes (level-order, comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const nodes = entity.metadata?.nodes;
                const tree = entity.metadata?.tree;
                if (Array.isArray(nodes)) {
                  return nodes
                    .map((n) => (typeof n === 'object' && n?.value != null ? n.value : n))
                    .filter((v) => v != null)
                    .join(', ');
                }
                if (tree) {
                  const vals = [];
                  function collect(t) {
                    if (!t) return;
                    vals.push(t.value);
                    collect(t.left);
                    collect(t.right);
                  }
                  collect(tree);
                  return vals.join(', ');
                }
                return '';
              })()}
              onChange={(e) => {
                const values = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const nextMeta = {
                  ...(entity.metadata || {}),
                  nodes: values.length ? values : undefined,
                  tree: undefined,
                };
                update('metadata', nextMeta);
              }}
              placeholder="5, 3, 8, 1, 4, 6, 9"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Level-order: root, left, right, left-left, left-right, right-left, right-right…
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Disabled indexes (0-based, level-order)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.disabledIndexes ?? []).join(', ')}
              onChange={(e) => {
                const disabledIndexes = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n));
                update('metadata', {
                  ...(entity.metadata || {}),
                  disabledIndexes,
                });
              }}
              placeholder="1, 3"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Selected indexes (0-based, level-order)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.selectedIndexes ?? []).join(', ')}
              onChange={(e) => {
                const selectedIndexes = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n));
                update('metadata', {
                  ...(entity.metadata || {}),
                  selectedIndexes,
                });
              }}
              placeholder="0, 2"
            />
          </div>
        </>
      )}

      {entity.type === 'BarChart' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>BarChart metadata</h4>
          <div className="form-group">
            <label className="form-label">Bars (label:value, comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const bars = entity.metadata?.bars;
                if (!Array.isArray(bars)) return '';
                return bars
                  .map((b) => (typeof b === 'object' && b != null ? `${b.label ?? ''}:${b.value ?? 0}` : String(b)))
                  .join(', ');
              })()}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const bars = parts.map((p) => {
                  const colon = p.indexOf(':');
                  if (colon >= 0) {
                    const label = p.slice(0, colon).trim();
                    const value = Number(p.slice(colon + 1).trim()) || 0;
                    return { label: label || '?', value };
                  }
                  return { label: p, value: 0 };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  bars: bars.length ? bars : undefined,
                });
              }}
              placeholder="Jan:10, Feb:25, Mar:15, Apr:30"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Format: label:value for each bar
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">X-axis label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.xLabel ?? 'x'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  xLabel: e.target.value,
                })
              }
              placeholder="x"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Y-axis label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.yLabel ?? 'y'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  yLabel: e.target.value,
                })
              }
              placeholder="y"
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="bar-horizontal"
              checked={entity.metadata?.horizontal === true}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  horizontal: e.target.checked,
                })
              }
            />
            <label htmlFor="bar-horizontal" className="form-label" style={{ marginBottom: 0 }}>
              Horizontal bars
            </label>
          </div>
        </>
      )}

      {entity.type === 'ConfusionMatrix' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>ConfusionMatrix metadata</h4>
          <div className="form-group">
            <label className="form-label">Matrix (one row per line, comma-separated values)</label>
            <textarea
              className="form-input"
              rows={4}
              value={(() => {
                const m = entity.metadata?.matrix;
                if (!Array.isArray(m)) return '45, 5\n8, 42';
                return m.map((row) => (Array.isArray(row) ? row.map((v) => Number(v)).join(', ') : '')).join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter(Boolean);
                const matrix = lines.map((line) =>
                  line
                    .split(',')
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => !Number.isNaN(n)),
                ).filter((row) => row.length > 0);
                if (matrix.length > 0) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    matrix,
                  });
                }
              }}
              placeholder={'45, 5\n8, 42'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Each line = one row. Values: TN, FP (top row); FN, TP (bottom row) for 2×2.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Row labels (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.rowLabels ?? ['Actual -', 'Actual +']).join(', ')}
              onChange={(e) => {
                const rowLabels = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  rowLabels: rowLabels.length ? rowLabels : undefined,
                });
              }}
              placeholder="Actual -, Actual +"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Column labels (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.colLabels ?? ['Pred -', 'Pred +']).join(', ')}
              onChange={(e) => {
                const colLabels = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  colLabels: colLabels.length ? colLabels : undefined,
                });
              }}
              placeholder="Pred -, Pred +"
            />
          </div>
        </>
      )}

      {entity.type === 'CoordinateSystem' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>CoordinateSystem metadata</h4>
          <div className="form-group">
            <label className="form-label">X range (min, max)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const r = entity.metadata?.xRange ?? [-5, 5];
                return Array.isArray(r) ? `${r[0]}, ${r[1]}` : String(r);
              })()}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
                if (parts.length >= 2) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    xRange: [parts[0], parts[1]],
                  });
                }
              }}
              placeholder="-5, 5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Y range (min, max)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const r = entity.metadata?.yRange ?? [-5, 5];
                return Array.isArray(r) ? `${r[0]}, ${r[1]}` : String(r);
              })()}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
                if (parts.length >= 2) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    yRange: [parts[0], parts[1]],
                  });
                }
              }}
              placeholder="-5, 5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Grid spacing</label>
            <input
              type="number"
              className="form-input"
              min={0.1}
              max={5}
              step={0.5}
              value={entity.metadata?.gridSpacing ?? 1}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  gridSpacing: Math.max(0.1, Number(e.target.value) || 1),
                })
              }
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="coords-showGrid"
              checked={entity.metadata?.showGrid !== false}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  showGrid: e.target.checked,
                })
              }
            />
            <label htmlFor="coords-showGrid" className="form-label" style={{ marginBottom: 0 }}>
              Show grid
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">X-axis label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.xLabel ?? 'x'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  xLabel: e.target.value,
                })
              }
              placeholder="x"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Y-axis label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.yLabel ?? 'y'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  yLabel: e.target.value,
                })
              }
              placeholder="y"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Points (x,y:label per line)</label>
            <textarea
              className="form-input"
              rows={3}
              value={(() => {
                const pts = entity.metadata?.points ?? [];
                if (!Array.isArray(pts)) return '';
                return pts
                  .map((p) => {
                    if (typeof p !== 'object' || p == null) return '';
                    const { x, y, label } = p;
                    if (label) return `${x},${y}:${label}`;
                    return `${x},${y}`;
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const points = lines.map((line) => {
                  const colon = line.indexOf(':');
                  const coords = colon >= 0 ? line.slice(0, colon).trim() : line;
                  const label = colon >= 0 ? line.slice(colon + 1).trim() : undefined;
                  const [x, y] = coords.split(',').map((s) => parseFloat(s.trim()));
                  if (Number.isNaN(x) || Number.isNaN(y)) return null;
                  return label ? { x, y, label } : { x, y };
                }).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  points: points.length ? points : undefined,
                });
              }}
              placeholder={'2,3:P\n-3,1:Q'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One point per line: x,y or x,y:label
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Vectors (dx,dy:label per line)</label>
            <textarea
              className="form-input"
              rows={3}
              value={(() => {
                const vecs = entity.metadata?.vectors ?? [];
                if (!Array.isArray(vecs)) return '';
                return vecs
                  .map((v) => {
                    if (typeof v !== 'object' || v == null) return '';
                    const { dx, dy, label } = v;
                    if (label) return `${dx},${dy}:${label}`;
                    return `${dx},${dy}`;
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const vectors = lines.map((line) => {
                  const colon = line.indexOf(':');
                  const coords = colon >= 0 ? line.slice(0, colon).trim() : line;
                  const label = colon >= 0 ? line.slice(colon + 1).trim() : undefined;
                  const [dx, dy] = coords.split(',').map((s) => parseFloat(s.trim()));
                  if (Number.isNaN(dx) || Number.isNaN(dy)) return null;
                  return label ? { dx, dy, label } : { dx, dy };
                }).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  vectors: vectors.length ? vectors : undefined,
                });
              }}
              placeholder={'3,2:v⃗\n-2,4:w⃗'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One vector per line: dx,dy or dx,dy:label (from origin)
            </p>
          </div>
        </>
      )}

      {entity.type === 'Graph2D' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Graph2D metadata</h4>
          <div className="form-group">
            <label className="form-label">Curve type</label>
            <select
              className="form-input"
              value={entity.metadata?.curveType ?? 'scatter'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  curveType: e.target.value || undefined,
                })
              }
            >
              <option value="">scatter (default)</option>
              <option value="roc">roc</option>
              <option value="loss">loss</option>
              <option value="scatter">scatter</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Domain (x min, max)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const d = entity.metadata?.domain ?? entity.metadata?.xRange ?? [-5, 5];
                return Array.isArray(d) ? `${d[0]}, ${d[1]}` : String(d);
              })()}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
                if (parts.length >= 2) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    domain: [parts[0], parts[1]],
                  });
                }
              }}
              placeholder="-5, 5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Range (y min, max)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const r = entity.metadata?.range ?? entity.metadata?.yRange ?? [-5, 5];
                return Array.isArray(r) ? `${r[0]}, ${r[1]}` : String(r);
              })()}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
                if (parts.length >= 2) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    range: [parts[0], parts[1]],
                  });
                }
              }}
              placeholder="-5, 5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">X-axis label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.xLabel ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  xLabel: e.target.value,
                })
              }
              placeholder="x (or FPR, Epoch)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Y-axis label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.yLabel ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  yLabel: e.target.value,
                })
              }
              placeholder="y (or TPR, Loss)"
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="graph2d-showGrid"
              checked={entity.metadata?.showGrid !== false}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  showGrid: e.target.checked,
                })
              }
            />
            <label htmlFor="graph2d-showGrid" className="form-label" style={{ marginBottom: 0 }}>
              Show grid
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Expression (y = f(x), e.g. x * x)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.expression ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  expression: e.target.value || undefined,
                })
              }
              placeholder="x * x"
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="graph2d-parametric"
              checked={entity.metadata?.parametric === true}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  parametric: e.target.checked,
                })
              }
            />
            <label htmlFor="graph2d-parametric" className="form-label" style={{ marginBottom: 0 }}>
              Parametric curve
            </label>
          </div>
          {entity.metadata?.parametric && (
            <>
              <div className="form-group">
                <label className="form-label">X expression (t)</label>
                <input
                  type="text"
                  className="form-input"
                  value={entity.metadata?.xExpression ?? 'Math.cos(t)'}
                  onChange={(e) =>
                    update('metadata', {
                      ...(entity.metadata || {}),
                      xExpression: e.target.value || 'Math.cos(t)',
                    })
                  }
                  placeholder="Math.cos(t)"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Y expression (t)</label>
                <input
                  type="text"
                  className="form-input"
                  value={entity.metadata?.yExpression ?? 'Math.sin(t)'}
                  onChange={(e) =>
                    update('metadata', {
                      ...(entity.metadata || {}),
                      yExpression: e.target.value || 'Math.sin(t)',
                    })
                  }
                  placeholder="Math.sin(t)"
                />
              </div>
              <div className="form-group">
                <label className="form-label">t range (min, max)</label>
                <input
                  type="text"
                  className="form-input"
                  value={(() => {
                    const t = entity.metadata?.tRange ?? [0, 2 * Math.PI];
                    return Array.isArray(t) ? `${t[0]}, ${t[1]}` : String(t);
                  })()}
                  onChange={(e) => {
                    const parts = e.target.value.split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
                    if (parts.length >= 2) {
                      update('metadata', {
                        ...(entity.metadata || {}),
                        tRange: [parts[0], parts[1]],
                      });
                    }
                  }}
                  placeholder="0, 6.283"
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Points (x,y per line)</label>
            <textarea
              className="form-input"
              rows={4}
              value={(() => {
                const pts = entity.metadata?.points ?? [];
                if (!Array.isArray(pts)) return '';
                return pts
                  .map((p) => {
                    if (typeof p !== 'object' || p == null) return '';
                    const { x, y } = p;
                    return `${x},${y}`;
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const points = lines.map((line) => {
                  const [x, y] = line.split(',').map((s) => parseFloat(s.trim()));
                  if (Number.isNaN(x) || Number.isNaN(y)) return null;
                  return { x, y };
                }).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  points: points.length ? points : undefined,
                });
              }}
              placeholder={'0,0\n1,1\n2,4'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One point per line: x,y. Used for scatter, ROC, or loss curves.
            </p>
          </div>
        </>
      )}

      {entity.type === 'BigO' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>BigO metadata</h4>
          <div className="form-group">
            <label className="form-label">Curves to visualize</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'].map((curve) => {
                const curves = entity.metadata?.curves ?? ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
                const checked = curves.includes(curve);
                return (
                  <label key={curve} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        let next = entity.metadata?.curves ?? ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
                        if (e.target.checked) {
                          next = [...next, curve].sort((a, b) => {
                            const order = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'];
                            return order.indexOf(a) - order.indexOf(b);
                          });
                        } else {
                          next = next.filter((c) => c !== curve);
                        }
                        update('metadata', {
                          ...(entity.metadata || {}),
                          curves: next.length ? next : ['O(1)'],
                        });
                      }}
                    />
                    <span style={{ fontSize: 'var(--text-xs)' }}>{curve}</span>
                  </label>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Select which complexity curves to display
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Domain (n min, max)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const d = entity.metadata?.domain ?? [0, 10];
                return Array.isArray(d) ? `${d[0]}, ${d[1]}` : String(d);
              })()}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
                if (parts.length >= 2) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    domain: [parts[0], parts[1]],
                  });
                }
              }}
              placeholder="0, 10"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Input size range for x-axis
            </p>
          </div>
        </>
      )}

      {entity.type === 'Array' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Array metadata</h4>
          <div className="form-group">
            <label className="form-label">Values (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const vals = entity.metadata?.values;
                const cells = entity.metadata?.cells;
                if (Array.isArray(vals)) return vals.join(', ');
                if (Array.isArray(cells)) return cells.map((c) => (typeof c === 'object' && c?.value != null ? c.value : c)).join(', ');
                return '';
              })()}
              onChange={(e) => {
                const values = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const nextMeta = {
                  ...(entity.metadata || {}),
                  values: values.length ? values : undefined,
                  cells: undefined,
                };
                update('metadata', nextMeta);
              }}
              placeholder="a, b, c, d, e"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Disabled indexes (comma-separated, 0-based)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.disabledIndexes ?? []).join(', ')}
              onChange={(e) => {
                const disabledIndexes = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n));
                update('metadata', {
                  ...(entity.metadata || {}),
                  disabledIndexes,
                });
              }}
              placeholder="1, 3"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Selected indexes (comma-separated, 0-based)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.selectedIndexes ?? []).join(', ')}
              onChange={(e) => {
                const selectedIndexes = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n));
                update('metadata', {
                  ...(entity.metadata || {}),
                  selectedIndexes,
                });
              }}
              placeholder="0, 2"
            />
          </div>
        </>
      )}

      <div style={{ marginTop: 'var(--space-4)' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: 'var(--space-2)' }}
          onClick={handleCopy}
        >
          Copy VisualEntity JSON
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={() => {
            setJsonInput(JSON.stringify(entity, null, 2));
            setShowJson(!showJson);
          }}
        >
          {showJson ? 'Hide' : 'Edit'} raw JSON
        </button>
      </div>

      {showJson && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <textarea
            className="form-input"
            rows={10}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            onClick={handleJsonApply}
          >
            Apply JSON
          </button>
        </div>
      )}
    </div>
  );
}
