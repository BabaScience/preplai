import { useState, useCallback, useEffect } from 'react';
import { registry } from '@preplai/illustrations';
import { ENTITY_DEFAULTS } from '@preplai/shared';
import { METADATA_DEFAULTS, ENTITY_FIELD_DEFAULTS } from './entity-defaults';
import IllustrationPreview from './IllustrationPreview';
import EntityParamPanel from './EntityParamPanel';

const ENTITY_TYPES = Object.keys(registry).sort();

const CONNECTION_TYPES = new Set(['Arrow', 'DataFlow', 'Transition', 'Bus']);

const STORAGE_KEY = 'preplai-illustration-debug-reviewed';

function loadReviewedFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReviewedToStorage(checked) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
  } catch {
    // ignore
  }
}

function buildDefaultEntity(type, overrides = {}) {
  const base = {
    ...ENTITY_DEFAULTS,
    id: 'debug-1',
    type,
    position: { x: 50, y: 50 },
    label: type,
    ...ENTITY_FIELD_DEFAULTS[type],
    ...overrides,
  };

  if (CONNECTION_TYPES.has(type)) {
    base.sourceEntityId = base.sourceEntityId ?? 'debug-src';
    base.targetEntityId = base.targetEntityId ?? 'debug-tgt';
  }

  if (METADATA_DEFAULTS[type]) {
    base.metadata = JSON.parse(JSON.stringify(METADATA_DEFAULTS[type]));
  }

  return base;
}

export default function IllustrationDebugPage() {
  const [selectedType, setSelectedType] = useState('Cloud');
  const [entity, setEntity] = useState(() => buildDefaultEntity('Cloud'));
  const [renderError, setRenderError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [search, setSearch] = useState('');
  const [globalDefaultSize, setGlobalDefaultSize] = useState(ENTITY_DEFAULTS.size);
  const [reviewedTypes, setReviewedTypes] = useState(() => loadReviewedFromStorage());
  const [filterMode, setFilterMode] = useState('unchecked'); // 'unchecked' | 'checked' | 'all'

  useEffect(() => {
    saveReviewedToStorage(reviewedTypes);
  }, [reviewedTypes]);

  const searchFiltered = search.trim()
    ? ENTITY_TYPES.filter((type) =>
        type.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : ENTITY_TYPES;

  const filteredTypes =
    filterMode === 'unchecked'
      ? searchFiltered.filter((type) => !reviewedTypes.has(type))
      : filterMode === 'checked'
        ? searchFiltered.filter((type) => reviewedTypes.has(type))
        : searchFiltered;

  const handleSelectType = useCallback((type) => {
    setSelectedType(type);
    setEntity(buildDefaultEntity(type));
    setRenderError(null);
  }, []);

  const handleToggleReviewed = useCallback((type, e) => {
    e.stopPropagation();
    setReviewedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
        return next;
      }
      next.add(type);
      // When marking as reviewed and filtering unchecked, advance to next
      if (filterMode === 'unchecked' && type === selectedType) {
        const remaining = searchFiltered.filter((t) => !next.has(t));
        const first = remaining[0];
        if (first) {
          setTimeout(() => {
            setSelectedType(first);
            setEntity(buildDefaultEntity(first));
          }, 0);
        }
      }
      return next;
    });
  }, [filterMode, selectedType, searchFiltered]);

  const handleClearAllReviewed = useCallback(() => {
    setReviewedTypes(new Set());
  }, []);

  const handleCopy = useCallback(() => {
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 380px',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Left: Entity type list */}
      <div
        className="dev-panel dev-panel-left"
        style={{
          overflowY: 'auto',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            marginBottom: 'var(--space-3)',
            padding: 'var(--space-3)',
          }}
        >
          Illustration Debug
        </h2>
        <div
          style={{
            padding: '0 var(--space-3) var(--space-3)',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Default size (for testing)
          </label>
          <input
            type="range"
            min={1.5}
            max={3.5}
            step={0.1}
            value={globalDefaultSize}
            onChange={(e) => setGlobalDefaultSize(Number(e.target.value))}
            style={{ width: '100%', marginBottom: 'var(--space-1)' }}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            {globalDefaultSize.toFixed(1)}
          </span>
        </div>
        <input
          type="search"
          placeholder="Search illustrations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            margin: '0 var(--space-3) var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            fontSize: 'var(--text-sm)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-1)',
            color: 'var(--color-text)',
          }}
        />
        <div
          style={{
            padding: '0 var(--space-3) var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Filter
          </label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              fontSize: 'var(--text-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-1)',
              color: 'var(--color-text)',
            }}
          >
            <option value="unchecked">Unchecked only</option>
            <option value="checked">Checked only</option>
            <option value="all">All</option>
          </select>
          {reviewedTypes.size > 0 && (
            <button
              type="button"
              onClick={handleClearAllReviewed}
              style={{
                padding: 'var(--space-1) var(--space-2)',
                fontSize: 'var(--text-xs)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Clear all checkmarks
            </button>
          )}
        </div>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            padding: '0 var(--space-3)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {filterMode === 'unchecked' && `${filteredTypes.length} unchecked of ${ENTITY_TYPES.length}`}
          {filterMode === 'checked' && `${filteredTypes.length} checked of ${ENTITY_TYPES.length}`}
          {filterMode === 'all' && `${filteredTypes.length} of ${ENTITY_TYPES.length} types`}
          . Click to preview.
        </p>
        {filteredTypes.length === 0 ? (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              padding: 'var(--space-3)',
            }}
          >
            {filterMode === 'unchecked' && reviewedTypes.size > 0
              ? "All reviewed! Switch filter to 'All' or 'Checked only'."
              : filterMode === 'checked' && reviewedTypes.size === 0
                ? "None checked yet. Switch filter to 'Unchecked only' or 'All'."
                : 'No matches.'}
          </p>
        ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredTypes.map((type) => (
            <li key={type}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleSelectType(type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectType(type);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  textAlign: 'left',
                  fontSize: 'var(--text-sm)',
                  background: selectedType === type ? 'var(--color-surface-2)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderLeft: selectedType === type ? '3px solid var(--color-primary)' : '3px solid transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={reviewedTypes.has(type)}
                  onChange={(e) => handleToggleReviewed(type, e)}
                  onClick={(e) => e.stopPropagation()}
                  title="Mark as reviewed"
                  style={{ flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ flex: 1 }}>{type}</span>
              </div>
            </li>
          ))}
        </ul>
        )}
      </div>

      {/* Center: Preview canvas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
        }}
      >
        <IllustrationPreview
          entity={{ ...entity, size: globalDefaultSize }}
          renderError={setRenderError}
        />
      </div>

      {/* Right: Parameter panel — all parameters live here */}
      <div
        style={{
          overflowY: 'auto',
          borderLeft: '1px solid var(--color-border)',
          width: '100%',
        }}
      >
        <EntityParamPanel
          entity={entity}
          onChange={setEntity}
          onCopy={handleCopy}
          error={renderError}
        />
        {copyFeedback && (
          <div
            style={{
              position: 'fixed',
              bottom: 'var(--space-4)',
              right: '400px',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-success)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            Copied to clipboard
          </div>
        )}
      </div>
    </div>
  );
}
