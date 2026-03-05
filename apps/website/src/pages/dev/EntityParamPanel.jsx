import { useState } from 'react';
import { ENTITY_DEFAULTS } from '@preplai/shared';

/** Types that inherit from text-card (same metadata: label, width, maxLines) */
const CARD_TYPES = ['Analogy', 'Annotation', 'Label', 'Comparison', 'Proof', 'Quote', 'Stack'];

export default function EntityParamPanel({ entity, onChange, onCopy, error }) {
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

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
