import { useState, useCallback, useEffect } from 'react';
import { registry } from '@preplai/illustrations';
import { ENTITY_DEFAULTS, isConnectionType } from '@preplai/shared';
import { METADATA_DEFAULTS, ENTITY_FIELD_DEFAULTS } from './entity-defaults';
import IllustrationPreview from './IllustrationPreview';
import EntityParamPanel from './EntityParamPanel';

const EXCLUDED_TYPES = new Set(['Label', 'GraphDS', 'GraphTraversal', 'LogicGate', 'Mutex', 'NumberLine', 'ProcessBlock', 'Proof', 'QueryPlan', 'Register', 'Registry', 'StateNode']);
const ENTITY_TYPES = Object.keys(registry)
  .filter((type) => !EXCLUDED_TYPES.has(type))
  .sort();

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

  if (isConnectionType(type)) {
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
    <div className="dev-layout">
      {/* Left: Entity type list */}
      <div className="dev-panel dev-panel-left dev-panel-left-inner">
        <h2 className="dev-heading">Illustration Debug</h2>
        <div className="dev-section">
          <label className="dev-label">
            Default size (overrides entity size in preview)
          </label>
          <input
            type="range"
            min={1.5}
            max={3.5}
            step={0.1}
            value={globalDefaultSize}
            onChange={(e) => setGlobalDefaultSize(Number(e.target.value))}
            className="dev-input"
            style={{ width: '100%', marginBottom: 'var(--space-1)' }}
          />
          <span className="dev-value">{globalDefaultSize.toFixed(1)}</span>
        </div>
        <div className="dev-section" style={{ paddingBottom: 'var(--space-3)' }}>
          <input
            type="search"
            placeholder="Search illustrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dev-input"
          />
        </div>
        <div className="dev-section dev-input-group" style={{ borderBottom: 'none', paddingBottom: 'var(--space-3)' }}>
          <label className="dev-label">Filter</label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="dev-input"
          >
            <option value="unchecked">Unchecked only</option>
            <option value="checked">Checked only</option>
            <option value="all">All</option>
          </select>
          {reviewedTypes.size > 0 && (
            <button
              type="button"
              onClick={handleClearAllReviewed}
              className="dev-btn-ghost"
            >
              Clear all checkmarks
            </button>
          )}
        </div>
        <p className="dev-hint">
          {filterMode === 'unchecked' && `${filteredTypes.length} unchecked of ${ENTITY_TYPES.length}`}
          {filterMode === 'checked' && `${filteredTypes.length} checked of ${ENTITY_TYPES.length}`}
          {filterMode === 'all' && `${filteredTypes.length} of ${ENTITY_TYPES.length} types`}
          . Click to preview.
        </p>
        {filteredTypes.length === 0 ? (
          <p className="dev-empty">
            {filterMode === 'unchecked' && reviewedTypes.size > 0
              ? "All reviewed! Switch filter to 'All' or 'Checked only'."
              : filterMode === 'checked' && reviewedTypes.size === 0
                ? "None checked yet. Switch filter to 'Unchecked only' or 'All'."
                : 'No matches.'}
          </p>
        ) : (
        <ul className="dev-type-list">
          {filteredTypes.map((type) => (
            <li key={type}>
              <div
                role="button"
                tabIndex={0}
                className="dev-type-item"
                data-selected={selectedType === type}
                onClick={() => handleSelectType(type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectType(type);
                  }
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
          <div className="dev-toast">Copied to clipboard</div>
        )}
      </div>
    </div>
  );
}
