import { useState, useCallback } from 'react';
import { registry } from '@preplai/illustrations';
import { ENTITY_DEFAULTS } from '@preplai/shared';
import { METADATA_DEFAULTS, ENTITY_FIELD_DEFAULTS } from './entity-defaults';
import IllustrationPreview from './IllustrationPreview';
import EntityParamPanel from './EntityParamPanel';

const ENTITY_TYPES = Object.keys(registry).sort();

function buildDefaultEntity(type, overrides = {}) {
  const base = {
    ...ENTITY_DEFAULTS,
    id: 'debug-1',
    type,
    position: { x: 50, y: 50 },
    size: 1,
    label: type,
    ...ENTITY_FIELD_DEFAULTS[type],
    ...overrides,
  };

  if (METADATA_DEFAULTS[type]) {
    base.metadata = JSON.parse(JSON.stringify(METADATA_DEFAULTS[type]));
  }

  return base;
}

export default function IllustrationDebugPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [entity, setEntity] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTypes = search.trim()
    ? ENTITY_TYPES.filter((type) =>
        type.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : ENTITY_TYPES;

  const handleSelectType = useCallback((type) => {
    setSelectedType(type);
    setEntity(buildDefaultEntity(type));
    setRenderError(null);
  }, []);

  const handleCopy = useCallback(() => {
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 340px',
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
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            padding: '0 var(--space-3)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {filteredTypes.length} of {ENTITY_TYPES.length} types. Click to preview.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredTypes.map((type) => (
            <li key={type}>
              <button
                type="button"
                onClick={() => handleSelectType(type)}
                style={{
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
                {type}
              </button>
            </li>
          ))}
        </ul>
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
        <IllustrationPreview entity={entity} renderError={setRenderError} />
      </div>

      {/* Right: Parameter panel */}
      <div
        style={{
          overflowY: 'auto',
          borderLeft: '1px solid var(--color-border)',
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
              right: '500px',
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
