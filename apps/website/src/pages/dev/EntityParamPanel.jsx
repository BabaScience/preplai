import { useState, useEffect } from 'react';
import { ENTITY_DEFAULTS, ENTRANCE_ANIMATION_CLASSES } from '@preplai/shared';

/** Types that inherit from text-card (same metadata: label, width, maxLines) */
const CARD_TYPES = ['Analogy', 'Annotation', 'Comparison', 'Quote'];

/** Heading types (H1, H2, H3) — metadata: label, showUnderline */
const HEADING_TYPES = ['H1', 'H2', 'H3'];

/** Connection types (Arrow, DataFlow, etc.) — need source/target + special params */
const CONNECTION_TYPES = ['Arrow', 'DataFlow', 'Transition', 'Bus'];

/** Types that use textContent (CodeBlock, Definition). Callout uses metadata.body instead. */
const TEXT_CONTENT_TYPES = ['CodeBlock', 'Definition'];

/** Types that use codeLanguage */
const CODE_LANGUAGE_TYPES = ['CodeBlock'];

export default function EntityParamPanel({ entity, onChange, onCopy, error }) {
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [btreeTreeJson, setBtreeTreeJson] = useState('');
  const [pointerLabelsText, setPointerLabelsText] = useState('');

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

  // Sync Array pointerLabels when entity changes
  useEffect(() => {
    if (entity?.type === 'Array') {
      const pl = entity.metadata?.pointerLabels;
      setPointerLabelsText(Array.isArray(pl) ? JSON.stringify(pl, null, 2) : '');
    }
  }, [entity?.type, entity?.metadata?.pointerLabels]);

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

      <div className="form-group">
        <label className="form-label">Parent entity ID</label>
        <input
          type="text"
          className="form-input"
          value={entity.parentEntityId ?? ''}
          onChange={(e) => update('parentEntityId', e.target.value || undefined)}
          placeholder="Optional — for Group children"
        />
      </div>

      {entity.type === 'Service' && (
        <div className="form-group">
          <label className="form-label">Kind (metadata.kind)</label>
          <select
            className="form-input"
            value={entity.metadata?.kind ?? 'Service'}
            onChange={(e) =>
              update('metadata', {
                ...(entity.metadata || {}),
                kind: e.target.value,
              })
            }
          >
            <option value="Service">Service</option>
            <option value="API">API</option>
            <option value="APIGateway">APIGateway</option>
          </select>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Second level: Service, API, or APIGateway. API has pulse animation.
          </p>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
      <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Animation</h4>
      <div className="form-group">
        <label className="form-label">Delay (ms)</label>
        <input
          type="number"
          className="form-input"
          min={0}
          max={60000}
          step={50}
          value={entity.animation?.delay ?? ENTITY_DEFAULTS.animation.delay}
          onChange={(e) => update('animation', { delay: Number(e.target.value) || 0 })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Duration (ms)</label>
        <input
          type="number"
          className="form-input"
          min={0}
          max={10000}
          step={50}
          value={entity.animation?.duration ?? ENTITY_DEFAULTS.animation.duration}
          onChange={(e) => update('animation', { duration: Number(e.target.value) || 450 })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Easing</label>
        <input
          type="text"
          className="form-input"
          value={entity.animation?.easing ?? ENTITY_DEFAULTS.animation.easing}
          onChange={(e) => update('animation', { easing: e.target.value })}
          placeholder="cubic-bezier(0.22, 1, 0.36, 1)"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Entrance</label>
        <select
          className="form-input"
          value={entity.animation?.entrance ?? ENTITY_DEFAULTS.animation.entrance}
          onChange={(e) => update('animation', { entrance: e.target.value })}
        >
          {ENTRANCE_ANIMATION_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c.replace('entrance-', '')}
            </option>
          ))}
          <option value="none">none</option>
        </select>
      </div>

      {TEXT_CONTENT_TYPES.includes(entity.type) && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Text content</h4>
          <div className="form-group">
            <label className="form-label">textContent</label>
            <textarea
              className="form-input"
              rows={6}
              value={entity.textContent ?? ''}
              onChange={(e) => update('textContent', e.target.value || undefined)}
              placeholder={entity.type === 'CodeBlock' ? 'Code string (or use metadata.code below)' : 'Longer text content'}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
        </>
      )}

      {CODE_LANGUAGE_TYPES.includes(entity.type) && (
        <div className="form-group">
          <label className="form-label">Code language</label>
          <input
            type="text"
            className="form-input"
            value={entity.codeLanguage ?? 'javascript'}
            onChange={(e) => update('codeLanguage', e.target.value || undefined)}
            placeholder="javascript, python, etc."
          />
        </div>
      )}

      {entity.type === 'CodeBlock' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>CodeBlock metadata</h4>
          <div className="form-group">
            <label className="form-label">Code (metadata.code)</label>
            <textarea
              className="form-input"
              rows={8}
              value={entity.metadata?.code ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  code: e.target.value || undefined,
                })
              }
              placeholder="function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Overrides textContent. Split on newlines for lines.
            </p>
          </div>
        </>
      )}

      {entity.type === 'Service' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Service metadata</h4>
          <div className="form-group">
            <label className="form-label">Hub label override (metadata.hubLabel)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.hubLabel ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  hubLabel: e.target.value || undefined,
                })
              }
              placeholder="Optional override for hub text"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Overrides kind for hub text. Label below is entity.label.
            </p>
          </div>
        </>
      )}

      {entity.type === 'Decision' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Decision metadata</h4>
          <div className="form-group">
            <label className="form-label">Visual style (metadata.visualStyle)</label>
            <select
              className="form-input"
              value={entity.metadata?.visualStyle ?? 'default'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  visualStyle: e.target.value === 'default' ? undefined : e.target.value,
                })
              }
            >
              <option value="default">default</option>
              <option value="minimal">minimal (no type badge)</option>
              <option value="emphasized">emphasized (thicker stroke)</option>
            </select>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              minimal hides the &quot;Decision&quot; badge; emphasized uses a thicker stroke.
            </p>
          </div>
        </>
      )}

      {entity.type === 'Equation' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Equation metadata</h4>
          <div className="form-group">
            <label className="form-label">Expression (metadata.expression)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.expression ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  expression: e.target.value || undefined,
                })
              }
              placeholder="x^2 + y^2 = r^2"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Use ^2→², ^3→³, _0→₀, etc. (e.g. x^2 + y^2 = r^2). Long text truncates.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Width (metadata.width)</label>
            <input
              type="number"
              className="form-input"
              min={60}
              max={200}
              value={entity.metadata?.width ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : Number(e.target.value);
                update('metadata', {
                  ...(entity.metadata || {}),
                  width: v,
                });
              }}
              placeholder="auto"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Design width (60–200). Omit for auto from expression length.
            </p>
          </div>
        </>
      )}

      {entity.type === 'Matrix' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Matrix metadata</h4>
          <div className="form-group">
            <label className="form-label">Rows (one row per line, comma-separated numbers)</label>
            <textarea
              className="form-input"
              rows={8}
              value={(() => {
                const rows = entity.metadata?.rows;
                if (!Array.isArray(rows)) return '1, 0\n0, 1';
                return rows
                  .map((row) => (Array.isArray(row) ? row.map((v) => Number(v)).join(', ') : ''))
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter(Boolean);
                const rows = lines.map((line) =>
                  line
                    .split(',')
                    .map((s) => parseFloat(s.trim()))
                    .filter((n) => !Number.isNaN(n)),
                ).filter((row) => row.length > 0);
                if (rows.length > 0) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    rows,
                  });
                }
              }}
              placeholder={'1, 0\n0, 1'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One row per line. Up to 8×8. Identity matrix default.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Row labels (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.rowLabels ?? []).join(', ')}
              onChange={(e) => {
                const rowLabels = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  rowLabels: rowLabels.length ? rowLabels : undefined,
                });
              }}
              placeholder="r1, r2, r3"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Column labels (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.colLabels ?? []).join(', ')}
              onChange={(e) => {
                const colLabels = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  colLabels: colLabels.length ? colLabels : undefined,
                });
              }}
              placeholder="c1, c2, c3"
            />
          </div>
        </>
      )}

      {entity.type === 'Expression' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Expression metadata</h4>
          <div className="form-group">
            <label className="form-label">Expression (metadata.expression)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.expression ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  expression: e.target.value || undefined,
                })
              }
              placeholder="f(x) = x^2"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Use ^2→², _0→₀, etc. Inline style, smaller than Equation.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Width (metadata.width)</label>
            <input
              type="number"
              className="form-input"
              min={50}
              max={150}
              value={entity.metadata?.width ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : Number(e.target.value);
                update('metadata', {
                  ...(entity.metadata || {}),
                  width: v,
                });
              }}
              placeholder="auto"
            />
          </div>
        </>
      )}

      {entity.type === 'Definition' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Definition metadata</h4>
          <div className="form-group">
            <label className="form-label">Term (metadata.term)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.term ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  term: e.target.value || undefined,
                })
              }
              placeholder="Term (or use label)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Definition (metadata.definition)</label>
            <textarea
              className="form-input"
              rows={3}
              value={entity.metadata?.definition ?? entity.textContent ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  definition: e.target.value || undefined,
                })
              }
              placeholder="Definition text (or use textContent)"
            />
          </div>
        </>
      )}

      {entity.type === 'Callout' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Callout metadata</h4>
          <div className="form-group">
            <label className="form-label">Type (metadata.calloutType)</label>
            <select
              className="form-input"
              value={entity.metadata?.calloutType ?? 'note'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  calloutType: e.target.value,
                })
              }
            >
              <option value="tip">tip</option>
              <option value="warning">warning</option>
              <option value="note">note</option>
              <option value="important">important</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Body (metadata.body)</label>
            <textarea
              className="form-input"
              rows={3}
              value={entity.metadata?.body ?? entity.textContent ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  body: e.target.value || undefined,
                })
              }
              placeholder="Callout body (or use textContent/label)"
            />
          </div>
        </>
      )}

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

      {entity.type === 'Analogy' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Analogy metadata (X ~ Y)</h4>
          <div className="form-group">
            <label className="form-label">X (metadata.x)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.x ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  x: e.target.value || undefined,
                })
              }
              placeholder="Binary search"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Y (metadata.y)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.y ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  y: e.target.value || undefined,
                })
              }
              placeholder="phone book"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Label (fallback / parse source)</label>
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
        </>
      )}

      {entity.type === 'Comparison' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Comparison metadata (Left vs Right)</h4>
          <div className="form-group">
            <label className="form-label">Left (metadata.left)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.left ?? entity.metadata?.a ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  left: e.target.value || undefined,
                })
              }
              placeholder="Array"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Right (metadata.right)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.right ?? entity.metadata?.b ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  right: e.target.value || undefined,
                })
              }
              placeholder="LinkedList"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Label (fallback / parse source)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.label ?? entity.label ?? ''}
              onChange={(e) => {
                const val = e.target.value || undefined;
                const next = JSON.parse(JSON.stringify(entity));
                next.metadata = { ...(next.metadata || {}), label: val };
                next.label = val ?? next.label ?? '';
                onChange(next);
              }}
              placeholder="Array vs LinkedList"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Parsed for &quot;X vs Y&quot; or &quot;X | Y&quot; when left/right omitted. Syncs with Label above.
            </p>
          </div>
        </>
      )}

      {entity.type === 'Entity' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Entity metadata</h4>
          <div className="form-group">
            <label className="form-label">Label (metadata.label)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.label ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  label: e.target.value || undefined,
                })
              }
              placeholder="Thing, Node..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Width (metadata.width)</label>
            <input
              type="number"
              className="form-input"
              min={50}
              max={120}
              value={entity.metadata?.width ?? 72}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  width: Math.max(50, Math.min(120, Number(e.target.value) || 72)),
                })
              }
            />
          </div>
        </>
      )}

      {entity.type === 'Concept' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Concept metadata</h4>
          <div className="form-group">
            <label className="form-label">Label (metadata.label)</label>
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
              placeholder="Recursion, API, Cache..."
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Concept text. Wraps inside shape; no truncation.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Width (metadata.width)</label>
            <input
              type="number"
              className="form-input"
              min={50}
              max={150}
              value={entity.metadata?.width ?? 80}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  width: Math.max(50, Math.min(150, Number(e.target.value) || 80)),
                })
              }
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Rectangle width in design units (default 80).
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Max lines</label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={6}
              value={entity.metadata?.maxLines ?? 4}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  maxLines: Math.max(1, Math.min(6, Number(e.target.value) || 4)),
                })
              }
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Max lines for wrapped text (default 4).
            </p>
          </div>
        </>
      )}

      {CARD_TYPES.includes(entity.type) && entity.type !== 'Analogy' && entity.type !== 'Comparison' && (
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
              placeholder="Text content"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Width (scale units)</label>
            <input
              type="number"
              className="form-input"
              min={30}
              max={300}
              value={entity.metadata?.width ?? 200}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  width: Number(e.target.value) || 200,
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
              value={entity.metadata?.maxLines ?? 6}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  maxLines: Math.max(1, Math.min(6, Number(e.target.value) || 6)),
                })
              }
            />
          </div>
        </>
      )}

      {HEADING_TYPES.includes(entity.type) && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Heading metadata</h4>
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
              placeholder="Heading text"
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

      {entity.type === 'Heap' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Heap metadata</h4>
          <div className="form-group">
            <label className="form-label">Nodes (level-order, comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.nodes ?? []).map(String).join(', ')}
              onChange={(e) => {
                const raw = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const nodes = raw.map((v) => (Number(v).toString() === v ? Number(v) : v));
                update('metadata', {
                  ...(entity.metadata || {}),
                  nodes: nodes.length ? nodes : undefined,
                });
              }}
              placeholder="10, 8, 6, 5, 3, 2"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Level-order: root, left, right, left-left, left-right, right-left… Up to 15 nodes.
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

      {entity.type === 'Histogram' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Histogram metadata</h4>
          <div className="form-group">
            <label className="form-label">Bins (label:count, comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const bins = entity.metadata?.bins;
                if (!Array.isArray(bins)) return '';
                return bins
                  .map((b) => (typeof b === 'object' && b != null ? `${b.label ?? ''}:${b.count ?? b.value ?? 0}` : String(b)))
                  .join(', ');
              })()}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const bins = parts.map((p) => {
                  const colon = p.indexOf(':');
                  if (colon >= 0) {
                    const label = p.slice(0, colon).trim();
                    const count = Number(p.slice(colon + 1).trim()) || 0;
                    return { label: label || '?', count };
                  }
                  return { label: p, count: 0 };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  bins: bins.length ? bins : undefined,
                });
              }}
              placeholder="0-10:5, 10-20:12, 20-30:8, 30-40:15"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Format: label:count for each bin. Up to 12 bins.
            </p>
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

      {entity.type === 'PieChart' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>PieChart metadata</h4>
          <div className="form-group">
            <label className="form-label">Slices (label:value, comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const slices = entity.metadata?.slices ?? entity.metadata?.segments;
                if (!Array.isArray(slices)) return '';
                return slices
                  .map((sl) => (typeof sl === 'object' && sl != null ? `${sl.label ?? ''}:${sl.value ?? 0}` : String(sl)))
                  .join(', ');
              })()}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const slices = parts.map((p) => {
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
                  slices: slices.length ? slices : undefined,
                });
              }}
              placeholder="A:30, B:25, C:20, D:15, E:10"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Format: label:value for each slice
            </p>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="pie-donut"
              checked={entity.metadata?.donut === true}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  donut: e.target.checked,
                })
              }
            />
            <label htmlFor="pie-donut" className="form-label" style={{ marginBottom: 0 }}>
              Donut style (inner hole)
            </label>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="pie-percentages"
              checked={entity.metadata?.showPercentages !== false}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  showPercentages: e.target.checked,
                })
              }
            />
            <label htmlFor="pie-percentages" className="form-label" style={{ marginBottom: 0 }}>
              Show percentages on labels
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

      {entity.type === 'FSM' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>FSM metadata</h4>
          <div className="form-group">
            <label className="form-label">States (id or id:label per line)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const states = entity.metadata?.states ?? [];
                if (!Array.isArray(states)) return '';
                return states
                  .map((s) => {
                    if (typeof s !== 'object' || s == null) return '';
                    const { id, label } = s;
                    return label && label !== id ? `${id}:${label}` : (id ?? '');
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const states = lines.map((line) => {
                  const colon = line.indexOf(':');
                  if (colon >= 0) {
                    const id = line.slice(0, colon).trim();
                    const label = line.slice(colon + 1).trim();
                    return { id: id || '?', label: label || id };
                  }
                  return { id: line || '?', label: line || '?' };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  states: states.length ? states : undefined,
                });
              }}
              placeholder={'q0\nq1\nq2'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One state per line. id:label for custom label; id alone uses id as label. Up to 6 states.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Transitions (from:to per line)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const transitions = entity.metadata?.transitions ?? [];
                if (!Array.isArray(transitions)) return '';
                return transitions
                  .map((t) => (typeof t === 'object' && t != null ? `${t.from ?? ''}:${t.to ?? ''}` : ''))
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const transitions = lines.map((line) => {
                  const colon = line.indexOf(':');
                  if (colon >= 0) {
                    const from = line.slice(0, colon).trim();
                    const to = line.slice(colon + 1).trim();
                    return from && to ? { from, to } : null;
                  }
                  return null;
                }).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  transitions: transitions.length ? transitions : undefined,
                });
              }}
              placeholder={'q0:q1\nq1:q2\nq2:q0'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One transition per line. from and to must match state ids.
            </p>
          </div>
        </>
      )}

      {entity.type === 'DeadlockGraph' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>DeadlockGraph metadata</h4>
          <div className="form-group">
            <label className="form-label">Nodes (id or id:label per line)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const nodes = entity.metadata?.nodes ?? [];
                if (!Array.isArray(nodes)) return '';
                return nodes
                  .map((n) => {
                    if (typeof n !== 'object' || n == null) return '';
                    const { id, label } = n;
                    return label && label !== id ? `${id}:${label}` : (id ?? '');
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const nodes = lines.map((line) => {
                  const colon = line.indexOf(':');
                  if (colon >= 0) {
                    const id = line.slice(0, colon).trim();
                    const label = line.slice(colon + 1).trim();
                    return { id: id || '?', label: label || id };
                  }
                  return { id: line || '?', label: line || '?' };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  nodes: nodes.length ? nodes : undefined,
                });
              }}
              placeholder={'P1\nR1\nP2\nR2'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One node per line. id:label for custom label; id alone uses id as label.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Edges (from:to per line)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const edges = entity.metadata?.edges ?? [];
                if (!Array.isArray(edges)) return '';
                return edges
                  .map((e) => (typeof e === 'object' && e != null ? `${e.from ?? ''}:${e.to ?? ''}` : ''))
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const edges = lines.map((line) => {
                  const colon = line.indexOf(':');
                  if (colon >= 0) {
                    const from = line.slice(0, colon).trim();
                    const to = line.slice(colon + 1).trim();
                    return from && to ? { from, to } : null;
                  }
                  return null;
                }).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  edges: edges.length ? edges : undefined,
                });
              }}
              placeholder={'P1:R1\nR1:P2\nP2:R2\nR2:P1'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One edge per line. from and to must match node ids. A cycle indicates deadlock.
            </p>
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

      {entity.type === 'Stack' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Stack metadata</h4>
          <div className="form-group">
            <label className="form-label">Layers (one per line: label or label:sublabel or label|#color)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const layers = entity.metadata?.layers ?? [];
                if (!Array.isArray(layers)) return '';
                return layers
                  .map((l) => {
                    if (typeof l !== 'object' || l == null) return '';
                    const { label, sublabel, color } = l;
                    let s = label ?? '';
                    if (sublabel) s += `:${sublabel}`;
                    if (color) s += `|${color}`;
                    return s;
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const layers = lines.map((line) => {
                  const pipeIdx = line.lastIndexOf('|');
                  let color;
                  let rest = line;
                  if (pipeIdx >= 0) {
                    color = line.slice(pipeIdx + 1).trim();
                    rest = line.slice(0, pipeIdx).trim();
                    if (!/^#[0-9a-fA-F]{3,8}$/.test(color)) color = undefined;
                  }
                  const colon = rest.indexOf(':');
                  if (colon >= 0) {
                    const label = rest.slice(0, colon).trim();
                    const sublabel = rest.slice(colon + 1).trim();
                    return { label: label || '?', sublabel: sublabel || undefined, color };
                  }
                  return { label: rest || '?', color };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  layers: layers.length ? layers : undefined,
                });
              }}
              placeholder={'Application\nTransport\nNetwork\nLink\nPhysical'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One layer per line. label:sublabel for sublabel, label|#hex for color.
            </p>
          </div>
        </>
      )}

      {entity.type === 'FlowDiagram' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>FlowDiagram metadata</h4>
          <div className="form-group">
            <label className="form-label">Steps (one per line; append |decision for diamond)</label>
            <textarea
              className="form-input"
              rows={8}
              value={(() => {
                const steps = entity.metadata?.steps ?? [];
                if (!Array.isArray(steps)) return '';
                return steps
                  .map((st) => {
                    if (typeof st !== 'object' || st == null) return '';
                    const label = st.label ?? st.name ?? '';
                    const type = st.type === 'decision' ? '|decision' : '';
                    return label ? `${label}${type}` : '';
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const steps = lines.map((line) => {
                  const pipe = line.indexOf('|');
                  if (pipe >= 0) {
                    const label = line.slice(0, pipe).trim();
                    const suffix = line.slice(pipe + 1).trim().toLowerCase();
                    return {
                      label: label || 'Step',
                      type: suffix === 'decision' ? 'decision' : 'default',
                    };
                  }
                  return { label: line || 'Step', type: 'default' };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  steps: steps.length ? steps : undefined,
                });
              }}
              placeholder={'Start\nCondition?|decision\nProcess\nEnd'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One step per line. Add |decision for diamond (e.g. "Check?|decision"). Default = rounded rect.
            </p>
          </div>
        </>
      )}

      {entity.type === 'Pod' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Pod metadata</h4>
          <div className="form-group">
            <label className="form-label">Containers (comma-separated names)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.containers ?? ['app', 'sidecar']).join(', ')}
              onChange={(e) => {
                const containers = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  containers: containers.length ? containers : undefined,
                });
              }}
              placeholder="app, sidecar, init"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Up to 3 containers shown
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={entity.metadata?.status ?? 'running'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  status: e.target.value,
                })
              }
            >
              <option value="running">Running</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </>
      )}

      {entity.type === 'PipelineStage' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>PipelineStage metadata</h4>
          <div className="form-group">
            <label className="form-label">Stage label (metadata.label)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.label ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  label: e.target.value || undefined,
                })
              }
              placeholder="Build, Test, Deploy"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={entity.metadata?.status ?? 'pending'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  status: e.target.value,
                })
              }
            >
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </>
      )}

      {entity.type === 'FreeBodyDiagram' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>FreeBodyDiagram metadata</h4>
          <div className="form-group">
            <label className="form-label">Forces (label,angle,magnitude per line; optional color)</label>
            <textarea
              className="form-input"
              rows={8}
              value={(() => {
                const forces = entity.metadata?.forces ?? [];
                if (!Array.isArray(forces)) return '';
                return forces
                  .map((f) => {
                    if (typeof f !== 'object' || f == null) return '';
                    const label = f.label ?? f.name ?? 'F';
                    const angle = f.angle ?? 0;
                    const mag = f.magnitude ?? 1;
                    const color = f.color ? `,${f.color}` : '';
                    return `${label},${angle},${mag}${color}`;
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const forces = lines.map((line) => {
                  const parts = line.split(',').map((p) => p.trim());
                  const label = parts[0] || 'F';
                  const angle = parseFloat(parts[1]) || 0;
                  const magnitude = parseFloat(parts[2]) || 1;
                  const color = parts[3] || undefined;
                  return { label, angle, magnitude, color };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  forces: forces.length ? forces : undefined,
                });
              }}
              placeholder={'F₁,0,1\nF₂,90,1\nN,270,1'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              label,angle,magnitude[,color]. Angle: 0=right, 90=up, 180=left, 270=down.
            </p>
          </div>
        </>
      )}

      {entity.type === 'GanttChart' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>GanttChart metadata</h4>
          <div className="form-group">
            <label className="form-label">Tasks (name,start,end per line)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const tasks = entity.metadata?.tasks ?? [];
                if (!Array.isArray(tasks)) return '';
                return tasks
                  .map((t) => {
                    if (typeof t !== 'object' || t == null) return '';
                    const name = t.name ?? t.label ?? 'Task';
                    const start = t.start ?? 0;
                    const end = t.end ?? 1;
                    return `${name},${start},${end}`;
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const tasks = lines.map((line) => {
                  const parts = line.split(',').map((p) => p.trim());
                  const name = parts[0] || 'Task';
                  const start = parseFloat(parts[1]) || 0;
                  const endVal = parseFloat(parts[2]);
                  const end = Number.isNaN(endVal) ? start + 1 : endVal;
                  return { name, start, end };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  tasks: tasks.length ? tasks : undefined,
                });
              }}
              placeholder={'P1,0,3\nP2,1,5\nP3,4,7'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              name,start,end per line. Times can be absolute or normalized.
            </p>
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
            <label className="form-label">Max time (optional)</label>
            <input
              type="number"
              className="form-input"
              min={1}
              step={1}
              value={entity.metadata?.maxTime ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                const num = v === '' ? undefined : parseFloat(v);
                update('metadata', {
                  ...(entity.metadata || {}),
                  maxTime: num != null && !Number.isNaN(num) ? num : undefined,
                });
              }}
              placeholder="auto (from tasks)"
            />
          </div>
        </>
      )}

      {entity.type === 'StepList' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>StepList metadata</h4>
          <div className="form-group">
            <label className="form-label">Steps (one per line)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const steps = entity.metadata?.steps;
                if (Array.isArray(steps)) return steps.join('\n');
                if (entity.textContent) return entity.textContent;
                return 'Step 1: Initialize\nStep 2: Process\nStep 3: Finalize';
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  steps: lines.length ? lines : undefined,
                });
              }}
              placeholder={'Step 1: Initialize\nStep 2: Process\nStep 3: Finalize'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One step per line. Up to 5 steps displayed.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Current step (0-based, -1 = none)</label>
            <input
              type="number"
              className="form-input"
              min={-1}
              max={Math.max(0, (entity.metadata?.steps ?? (entity.textContent ? entity.textContent.split('\n') : [])).length - 1)}
              value={entity.metadata?.currentStep ?? -1}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                const currentStep = Number.isNaN(v) ? -1 : Math.max(-1, v);
                update('metadata', {
                  ...(entity.metadata || {}),
                  currentStep,
                });
              }}
              placeholder="-1"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Highlights this step; completed steps show checkmarks when enabled.
            </p>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="steplist-checkmarks"
              checked={entity.metadata?.checkmarks === true}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  checkmarks: e.target.checked,
                })
              }
            />
            <label htmlFor="steplist-checkmarks" className="form-label" style={{ marginBottom: 0 }}>
              Show checkmarks for completed steps
            </label>
          </div>
        </>
      )}

      {(entity.type === 'HashTable' || entity.type === 'Dict') && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            {entity.type} metadata
          </h4>
          <div className="form-group">
            <label className="form-label">Pairs (key:value per line)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const pairs = entity.metadata?.pairs;
                if (!Array.isArray(pairs)) return '';
                return pairs
                  .map((p) => (Array.isArray(p) ? `${p[0] ?? ''}:${p[1] ?? ''}` : String(p)))
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const pairs = lines.map((line) => {
                  const colon = line.indexOf(':');
                  if (colon >= 0) {
                    const key = line.slice(0, colon).trim();
                    const val = line.slice(colon + 1).trim();
                    return [key || '?', val || ''];
                  }
                  return [line || '?', ''];
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  pairs: pairs.length ? pairs : undefined,
                });
              }}
              placeholder={'name:Alice\nage:30\ncity:NYC'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One key:value pair per line. Up to 8 pairs displayed.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Columns (1–4)</label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={4}
              value={entity.metadata?.cols ?? 2}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  cols: Math.max(1, Math.min(4, Number(e.target.value) || 2)),
                })
              }
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Grid columns for key:value layout
            </p>
          </div>
        </>
      )}

      {entity.type === 'LinkedList' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>LinkedList metadata</h4>
          <div className="form-group">
            <label className="form-label">Values (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.values ?? []).map(String).join(', ')}
              onChange={(e) => {
                const raw = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                const values = raw.map((v) => (Number(v).toString() === v ? Number(v) : v));
                update('metadata', {
                  ...(entity.metadata || {}),
                  values: values.length ? values : undefined,
                });
              }}
              placeholder="1, 2, 3, 4"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Node values. Max 6 nodes displayed. Numbers or short strings.
            </p>
          </div>
        </>
      )}

      {entity.type === 'MemoryLayout' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>MemoryLayout metadata</h4>
          <div className="form-group">
            <label className="form-label">Stack (one frame per line)</label>
            <textarea
              className="form-input"
              rows={4}
              value={(entity.metadata?.stack ?? []).join('\n')}
              onChange={(e) => {
                const stack = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  stack: stack.length ? stack : undefined,
                });
              }}
              placeholder={'main\nfoo()\nbar()'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Heap (one object per line)</label>
            <textarea
              className="form-input"
              rows={4}
              value={(entity.metadata?.heap ?? []).join('\n')}
              onChange={(e) => {
                const heap = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  heap: heap.length ? heap : undefined,
                });
              }}
              placeholder={'obj1\narr\nnode'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>
        </>
      )}

      {entity.type === 'MemoryBlock' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>MemoryBlock metadata</h4>
          <div className="form-group">
            <label className="form-label">Cells (addr:value per line)</label>
            <textarea
              className="form-input"
              rows={6}
              value={(() => {
                const cells = entity.metadata?.cells ?? [];
                if (!Array.isArray(cells)) return '';
                return cells
                  .map((c) => (Array.isArray(c) ? `${c[0] ?? ''}:${c[1] ?? ''}` : `${c?.addr ?? ''}:${c?.value ?? ''}`))
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const cells = lines.map((line) => {
                  const colon = line.indexOf(':');
                  if (colon >= 0) {
                    const addr = line.slice(0, colon).trim();
                    const value = line.slice(colon + 1).trim();
                    return { addr: addr || '?', value: value || '?' };
                  }
                  return { addr: line || '?', value: '?' };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  cells: cells.length ? cells : undefined,
                });
              }}
              placeholder={'0x0000:main\n0x0008:42\n0x0010:ptr'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One addr:value per line. Up to 10 cells.
            </p>
          </div>
        </>
      )}

      {entity.type === 'MemoryMap' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>MemoryMap metadata</h4>
          <div className="form-group">
            <label className="form-label">Segments (name,startAddr,endAddr per line)</label>
            <textarea
              className="form-input"
              rows={8}
              value={(() => {
                const segs = entity.metadata?.segments ?? [];
                if (!Array.isArray(segs)) return '';
                return segs
                  .map((s) => {
                    if (typeof s !== 'object' || s == null) return '';
                    const name = s.name ?? '?';
                    const start = s.startAddr ?? '0x0';
                    const end = s.endAddr ?? '0x0';
                    return `${name},${start},${end}`;
                  })
                  .filter(Boolean)
                  .join('\n');
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                const segments = lines.map((line) => {
                  const parts = line.split(',').map((p) => p.trim());
                  const name = parts[0] || '?';
                  const startAddr = parts[1] || '0x0';
                  const endAddr = parts[2] || '0x0';
                  return { name, startAddr, endAddr };
                });
                update('metadata', {
                  ...(entity.metadata || {}),
                  segments: segments.length ? segments : undefined,
                });
              }}
              placeholder={'Stack,0xFFF0,0xFFFF\nHeap,0x1000,0x2000\nText,0x0000,0x0600'}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              One segment per line: name,startAddr,endAddr. Up to 8 segments.
            </p>
          </div>
        </>
      )}

      {entity.type === 'Metric' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Metric metadata</h4>
          <div className="form-group">
            <label className="form-label">Value (metadata.value)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.value ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  value: e.target.value || undefined,
                })
              }
              placeholder="99"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Unit (metadata.unit)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.unit ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  unit: e.target.value || undefined,
                })
              }
              placeholder="ms, %, req/s"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Trend (metadata.trend)</label>
            <select
              className="form-input"
              value={entity.metadata?.trend ?? 'flat'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  trend: e.target.value === 'flat' ? undefined : e.target.value,
                })
              }
            >
              <option value="flat">flat</option>
              <option value="up">up</option>
              <option value="down">down</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Trend value (metadata.trendValue)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.trendValue ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  trendValue: e.target.value || undefined,
                })
              }
              placeholder="+12%, -5%"
            />
          </div>
        </>
      )}

      {entity.type === 'Monitor' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Monitor metadata</h4>
          <div className="form-group">
            <label className="form-label">Screen label (metadata.label)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  label: e.target.value || undefined,
                })
              }
              placeholder="CPU, Memory, API"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Optional title shown on the monitor screen
            </p>
          </div>
        </>
      )}

      {entity.type === 'Quote' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Quote metadata</h4>
          <div className="form-group">
            <label className="form-label">Quote text (metadata.label)</label>
            <textarea
              className="form-input"
              rows={3}
              value={entity.metadata?.label ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  label: e.target.value || undefined,
                })
              }
              placeholder="The quote text..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Author (metadata.author)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.author ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  author: e.target.value || undefined,
                })
              }
              placeholder="— Albert Einstein"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Source (metadata.source, alternative to author)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.source ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  source: e.target.value || undefined,
                })
              }
              placeholder="— RFC 2616"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Width (design units)</label>
            <input
              type="number"
              className="form-input"
              value={entity.metadata?.width ?? 200}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n) && n >= 80) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    width: n,
                  });
                }
              }}
              min={80}
              max={400}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max lines</label>
            <input
              type="number"
              className="form-input"
              value={entity.metadata?.maxLines ?? 6}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n) && n >= 1 && n <= 12) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    maxLines: n,
                  });
                }
              }}
              min={1}
              max={12}
            />
          </div>
        </>
      )}

      {entity.type === 'Subnet' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Subnet metadata</h4>
          <div className="form-group">
            <label className="form-label">CIDR (metadata.cidr)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.cidr ?? '192.168.1.0/24'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  cidr: e.target.value || undefined,
                })
              }
              placeholder="192.168.1.0/24"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Label (metadata.label)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  label: e.target.value || undefined,
                })
              }
              placeholder="private, public, etc."
            />
          </div>
        </>
      )}

      {entity.type === 'Semaphore' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Semaphore metadata</h4>
          <div className="form-group">
            <label className="form-label">Value (current permits)</label>
            <input
              type="number"
              className="form-input"
              value={entity.metadata?.value ?? 2}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n) && n >= 0) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    value: n,
                  });
                }
              }}
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max (optional, for bounded semaphore)</label>
            <input
              type="number"
              className="form-input"
              value={entity.metadata?.max ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    max: undefined,
                  });
                  return;
                }
                const n = parseInt(v, 10);
                if (!Number.isNaN(n) && n >= 1) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    max: n,
                  });
                }
              }}
              min={1}
              placeholder="Leave empty for unbounded"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Label (semaphore name)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.label ?? entity.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  label: e.target.value || undefined,
                })
              }
              placeholder="mutex, pool, etc."
            />
          </div>
        </>
      )}

      {entity.type === 'Set' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Set metadata</h4>
          <div className="form-group">
            <label className="form-label">Values (JSON array of elements)</label>
            <textarea
              className="form-input"
              rows={4}
              value={JSON.stringify(entity.metadata?.values ?? ['a', 'b', 'c'], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]');
                  if (Array.isArray(parsed)) {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      values: parsed.map((v) => String(v)),
                    });
                  }
                } catch { /* ignore */ }
              }}
              placeholder='["a", "b", "c"]'
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Unique elements. Up to 8 displayed.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Highlight index (0-based, optional)</label>
            <input
              type="number"
              className="form-input"
              value={entity.metadata?.highlightIndex ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    highlightIndex: undefined,
                  });
                  return;
                }
                const n = parseInt(v, 10);
                if (!Number.isNaN(n) && n >= 0) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    highlightIndex: n,
                  });
                }
              }}
              min={0}
              placeholder="-1 for none"
            />
          </div>
        </>
      )}

      {entity.type === 'ScatterPlot' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>ScatterPlot metadata</h4>
          <div className="form-group">
            <label className="form-label">Points (JSON array of {`{x, y, label?}`})</label>
            <textarea
              className="form-input"
              rows={8}
              value={JSON.stringify(entity.metadata?.points ?? [
                { x: 0, y: 0 },
                { x: 1, y: 1, label: 'P' },
                { x: 2, y: 4, label: 'Q' },
              ], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]');
                  if (Array.isArray(parsed)) {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      points: parsed,
                    });
                  }
                } catch { /* ignore */ }
              }}
              placeholder="[{x, y, label?}, ...]"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Domain (x range)</label>
            <input
              type="text"
              className="form-input"
              value={JSON.stringify(entity.metadata?.domain ?? entity.metadata?.xRange ?? [-5, 5])}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[-5, 5]');
                  if (Array.isArray(parsed) && parsed.length === 2) {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      domain: parsed,
                    });
                  }
                } catch { /* ignore */ }
              }}
              placeholder="[-5, 5]"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Range (y range)</label>
            <input
              type="text"
              className="form-input"
              value={JSON.stringify(entity.metadata?.range ?? entity.metadata?.yRange ?? [-5, 5])}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[-5, 5]');
                  if (Array.isArray(parsed) && parsed.length === 2) {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      range: parsed,
                    });
                  }
                } catch { /* ignore */ }
              }}
              placeholder="[-5, 5]"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">X label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.xLabel ?? 'x'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  xLabel: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Y label</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.yLabel ?? 'y'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  yLabel: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Expression (optional fitted curve, e.g. x*x)</label>
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
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={entity.metadata?.showGrid !== false}
                onChange={(e) =>
                  update('metadata', {
                    ...(entity.metadata || {}),
                    showGrid: e.target.checked,
                  })
                }
              />
              {' '}Show grid
            </label>
          </div>
        </>
      )}

      {entity.type === 'RecursionTree' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>RecursionTree metadata</h4>
          <div className="form-group">
            <label className="form-label">Calls (JSON array of {`{id, label, args, returnValue?, state}`})</label>
            <textarea
              className="form-input"
              rows={10}
              value={JSON.stringify(entity.metadata?.calls ?? [
                { id: 'r1', label: 'fib', args: '4', state: 'executing' },
                { id: 'r2', label: 'fib', args: '3', state: 'executing' },
                { id: 'r3', label: 'fib', args: '2', returnValue: '1', state: 'returned' },
                { id: 'r4', label: 'fib', args: '1', returnValue: '1', state: 'returned' },
                { id: 'r5', label: 'fib', args: '2', state: 'pending' },
              ], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]');
                  if (Array.isArray(parsed)) {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      calls: parsed,
                    });
                  }
                } catch { /* ignore */ }
              }}
              placeholder="[{id, label, args, returnValue?, state: 'pending'|'executing'|'returned'}, ...]"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              state: pending (dimmed), executing (highlighted), returned (normal)
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Edges (JSON array of {`{from, to}`})</label>
            <textarea
              className="form-input"
              rows={6}
              value={JSON.stringify(entity.metadata?.edges ?? [
                { from: 'r1', to: 'r2' },
                { from: 'r2', to: 'r3' },
                { from: 'r2', to: 'r4' },
                { from: 'r1', to: 'r5' },
              ], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]');
                  if (Array.isArray(parsed)) {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      edges: parsed,
                    });
                  }
                } catch { /* ignore */ }
              }}
              placeholder="[{from: 'parentId', to: 'childId'}, ...]"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>
        </>
      )}

      {entity.type === 'ProtocolLayer' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>ProtocolLayer metadata</h4>
          <div className="form-group">
            <label className="form-label">Label (layer name)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.label ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  label: e.target.value || undefined,
                })
              }
              placeholder="Transport, Network, Application"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Protocol (sublabel)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.protocol ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  protocol: e.target.value || undefined,
                })
              }
              placeholder="TCP, UDP, IP, HTTP"
            />
          </div>
        </>
      )}

      {entity.type === 'Packet' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Packet metadata</h4>
          <div className="form-group">
            <label className="form-label">Headers (JSON array of {`{name, value, bytes?}`})</label>
            <textarea
              className="form-input"
              rows={6}
              value={JSON.stringify(entity.metadata?.headers ?? [
                { name: 'Src IP', value: '192.168.1.1', bytes: 4 },
                { name: 'Dst IP', value: '10.0.0.5', bytes: 4 },
                { name: 'Src Port', value: '443', bytes: 2 },
                { name: 'Dst Port', value: '8080', bytes: 2 },
                { name: 'Flags', value: 'ACK', bytes: 1 },
              ], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '[]');
                  if (Array.isArray(parsed)) {
                    update('metadata', {
                      ...(entity.metadata || {}),
                      headers: parsed,
                    });
                  }
                } catch { /* ignore */ }
              }}
              placeholder="[{name, value, bytes}, ...]"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Payload (metadata.payload)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.payload ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  payload: e.target.value || undefined,
                })
              }
              placeholder="HTTP/1.1 200 OK..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Protocol (metadata.protocol)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.protocol ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  protocol: e.target.value || undefined,
                })
              }
              placeholder="TCP, UDP, IP"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Highlight section (header name or &quot;payload&quot;, optional)</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.highlightSection ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  highlightSection: e.target.value || undefined,
                })
              }
              placeholder="Src Port, payload, etc."
            />
          </div>
        </>
      )}

      {entity.type === 'NeuralNetwork' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>NeuralNetwork metadata</h4>
          <div className="form-group">
            <label className="form-label">Layers (comma-separated neuron counts per layer)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.layers ?? [3, 4, 3, 2]).join(', ')}
              onChange={(e) => {
                const layers = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n) && n >= 1);
                if (layers.length >= 2) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    layers,
                  });
                }
              }}
              placeholder="3, 4, 3, 2"
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              e.g. 3, 4, 3, 2 = input 3, hidden 4, hidden 3, output 2
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Layer labels (comma-separated, optional)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.layerLabels ?? []).join(', ')}
              onChange={(e) => {
                const layerLabels = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                update('metadata', {
                  ...(entity.metadata || {}),
                  layerLabels: layerLabels.length ? layerLabels : undefined,
                });
              }}
              placeholder="Input, Hidden 1, Hidden 2, Output"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={entity.metadata?.showWeights === true}
                onChange={(e) =>
                  update('metadata', {
                    ...(entity.metadata || {}),
                    showWeights: e.target.checked,
                  })
                }
              />
              {' '}Show weights on connections
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Highlight neuron (layer, index — 0-based, optional)</label>
            <input
              type="text"
              className="form-input"
              value={(() => {
                const h = entity.metadata?.highlightNeuron;
                if (!h || typeof h !== 'object') return '';
                return `${h.layer ?? ''}, ${h.index ?? ''}`;
              })()}
              onChange={(e) => {
                const [layerStr, indexStr] = e.target.value.split(',').map((s) => s.trim());
                const layer = layerStr === '' ? undefined : parseInt(layerStr, 10);
                const index = indexStr === '' ? undefined : parseInt(indexStr, 10);
                if (layer != null && !Number.isNaN(layer) && index != null && !Number.isNaN(index)) {
                  update('metadata', {
                    ...(entity.metadata || {}),
                    highlightNeuron: { layer, index },
                  });
                } else {
                  const next = { ...(entity.metadata || {}) };
                  delete next.highlightNeuron;
                  update('metadata', next);
                }
              }}
              placeholder="1, 2"
            />
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
            <label className="form-label">Selected indexes (active, 0-based)</label>
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
          <div className="form-group">
            <label className="form-label">Compare indexes (gold, 0-based)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.compareIndexes ?? []).join(', ')}
              onChange={(e) => {
                const compareIndexes = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n));
                update('metadata', {
                  ...(entity.metadata || {}),
                  compareIndexes,
                });
              }}
              placeholder="1, 2"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Swap indexes (dashed, 0-based)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.swapIndexes ?? []).join(', ')}
              onChange={(e) => {
                const swapIndexes = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n));
                update('metadata', {
                  ...(entity.metadata || {}),
                  swapIndexes,
                });
              }}
              placeholder="1, 3"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Done indexes (dimmed, 0-based)</label>
            <input
              type="text"
              className="form-input"
              value={(entity.metadata?.doneIndexes ?? []).join(', ')}
              onChange={(e) => {
                const doneIndexes = e.target.value
                  .split(',')
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n));
                update('metadata', {
                  ...(entity.metadata || {}),
                  doneIndexes,
                });
              }}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pointer labels (JSON array)</label>
            <textarea
              className="form-input"
              rows={4}
              value={pointerLabelsText}
              onChange={(e) => {
                const val = e.target.value;
                setPointerLabelsText(val);
                try {
                  const trimmed = val.trim();
                  const pointerLabels = trimmed ? JSON.parse(trimmed) : undefined;
                  if (!Array.isArray(pointerLabels) && pointerLabels !== undefined) return;
                  update('metadata', {
                    ...(entity.metadata || {}),
                    pointerLabels: pointerLabels?.length ? pointerLabels : undefined,
                  });
                } catch (_) {}
              }}
              placeholder={[
                '[',
                '  { "index": 0, "label": "low" },',
                '  { "index": 3, "label": "mid", "showValue": true, "highlight": true },',
                '  { "index": 7, "label": "high" }',
                ']',
              ].join('\n')}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Optional: index, label, color?, value?, showValue?, showIndex?, highlight?
            </p>
          </div>
        </>
      )}

      {entity.type === 'ArrayCell' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>ArrayCell metadata</h4>
          <div className="form-group">
            <label className="form-label">Value</label>
            <input
              type="text"
              className="form-input"
              value={entity.metadata?.value ?? ''}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  value: e.target.value,
                })
              }
              placeholder="42"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Index</label>
            <input
              type="number"
              className="form-input"
              value={entity.metadata?.index ?? 0}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  index: parseInt(e.target.value, 10) || 0,
                })
              }
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <select
              className="form-input"
              value={entity.metadata?.state ?? 'default'}
              onChange={(e) =>
                update('metadata', {
                  ...(entity.metadata || {}),
                  state: e.target.value,
                })
              }
            >
              <option value="default">default</option>
              <option value="active">active</option>
              <option value="compare">compare</option>
              <option value="swap">swap</option>
              <option value="done">done</option>
            </select>
            <p style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
              active = current pointer; compare = comparing; swap = swapping; done = sorted
            </p>
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
