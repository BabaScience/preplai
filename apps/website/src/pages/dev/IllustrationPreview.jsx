import { useEffect, useRef } from 'react';
import { registry, renderEntity } from '@preplai/illustrations';
import { applyDefaults } from '@preplai/player';
import { CANVAS_BG_COLOR, isConnectionType } from '@preplai/shared';

/** Create placeholder entities for connection types (Arrow, DataFlow, etc.) */
function createPlaceholders(connectionEntity) {
  const srcId = connectionEntity.sourceEntityId ?? 'debug-src';
  const tgtId = connectionEntity.targetEntityId ?? 'debug-tgt';
  return [
    { id: srcId, type: 'Concept', position: { x: 20, y: 50 }, label: 'A' },
    { id: tgtId, type: 'Concept', position: { x: 80, y: 50 }, label: 'B' },
  ];
}

export default function IllustrationPreview({ entity, renderError }) {
  const svgRef = useRef(null);
  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);

  useEffect(() => {
    if (!entity || !entityLayerRef.current || !connectionLayerRef.current) return;

    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;

    // Clear layers
    entityLayer.innerHTML = '';
    connectionLayer.innerHTML = '';

    const needsConnection = isConnectionType(entity.type);
    const connectionEntity = needsConnection
      ? { ...entity, sourceEntityId: entity.sourceEntityId ?? 'debug-src', targetEntityId: entity.targetEntityId ?? 'debug-tgt' }
      : entity;

    const [placeholderSrc, placeholderTgt] = needsConnection ? createPlaceholders(connectionEntity) : [null, null];

    const entities = needsConnection
      ? [
          applyDefaults(placeholderSrc),
          applyDefaults(placeholderTgt),
          applyDefaults(connectionEntity),
        ]
      : [entity];

    try {
      const connections = entities.filter((e) => isConnectionType(e.type));
      const nonConnections = entities.filter((e) => !isConnectionType(e.type));

      // Render non-connection entities first
      for (const e of nonConnections) {
        const defaulted = applyDefaults(e);
        const el = renderEntity(defaulted, entityLayer);
        if (el) entityLayer.appendChild(el);
      }

      // Render connection entities (need allEntities for position resolution)
      for (const conn of connections) {
        const defaulted = applyDefaults(conn);
        const el = renderEntity(defaulted, connectionLayer, entities);
        if (el) connectionLayer.appendChild(el);
      }

      renderError?.(null);
    } catch (err) {
      renderError?.(err.message);
    }
  }, [entity, renderError]);

  if (!entity) {
    return (
      <div
        className="dev-preview"
        style={{
          background: CANVAS_BG_COLOR,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
        Select an entity type to preview
      </div>
    );
  }

  return (
    <div className="dev-preview" style={{ background: CANVAS_BG_COLOR }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <g id="entity-layer" ref={entityLayerRef} />
        <g id="connection-layer" ref={connectionLayerRef} />
      </svg>
    </div>
  );
}
