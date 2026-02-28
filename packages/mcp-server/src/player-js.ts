/**
 * @pre/mcp-server — Player Bootstrap JS
 *
 * Served at GET /player.js.
 * Vanilla JS — connects EventSource, bootstraps scene controller.
 */

export const PLAYER_JS = `(function() {
  'use strict';

  // ── Session ID from body data attribute ─────────────────────────
  var sessionId = document.body.getAttribute('data-session-id');
  if (!sessionId) {
    console.error('[PRE] No data-session-id found on <body>. Player cannot connect.');
    return;
  }

  // ── DOM references ──────────────────────────────────────────────
  var canvas          = document.getElementById('canvas');
  var entityLayer     = document.getElementById('entity-layer');
  var connectionLayer = document.getElementById('connection-layer');
  var narratorText    = document.getElementById('narrator-text');

  // ── State ───────────────────────────────────────────────────────
  var currentScript = null;
  var currentFrame  = 0;

  // ── SSE Connection ──────────────────────────────────────────────
  var evtSource = new EventSource('/session/' + sessionId + '/events');

  evtSource.addEventListener('message', function(e) {
    try {
      var event = JSON.parse(e.data);

      if (event.type === 'connected') {
        console.log('[PRE] SSE connected for session:', event.sessionId);
        return;
      }

      if (event.type === 'script_update') {
        currentScript = event.script;
        currentFrame = 0;
        renderFrame(currentScript.frames[0]);
        return;
      }

      if (event.type === 'narration_update') {
        updateNarrator(event.text);
        return;
      }

    } catch (err) {
      console.error('[PRE] Failed to parse SSE event:', err);
    }
  });

  evtSource.addEventListener('error', function() {
    console.warn('[PRE] SSE connection interrupted — EventSource will auto-reconnect.');
  });

  // ── Frame Renderer ──────────────────────────────────────────────
  function renderFrame(frame) {
    if (!frame) return;

    // Clear layers
    entityLayer.innerHTML = '';
    connectionLayer.innerHTML = '';

    var entities = frame.entities || [];

    // Two-pass: non-arrows first, then arrows
    var nonArrows = [];
    var arrows = [];
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      if (entity.type === 'Arrow' || entity.type === 'BidirectArrow' ||
          entity.type === 'DottedArrow' || entity.type === 'DataFlow') {
        arrows.push(entity);
      } else {
        nonArrows.push(entity);
      }
    }

    // Render non-arrows with staggered entrance
    for (var j = 0; j < nonArrows.length; j++) {
      renderEntity(nonArrows[j], entityLayer, j * 80);
    }

    // Render arrows (connection layer)
    for (var k = 0; k < arrows.length; k++) {
      renderArrowEntity(arrows[k], connectionLayer, entities);
    }

    // Update narrator
    if (frame.narrationSegment && frame.narrationSegment.text) {
      updateNarrator(frame.narrationSegment.text);
    } else {
      updateNarrator('');
    }

    // Canvas entrance
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(canvas, { opacity: 0.7 }, { opacity: 1, duration: 0.35 });
    }
  }

  // ── Entity Renderer (double-<g> pattern) ────────────────────────
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function renderEntity(entity, parentEl, delay) {
    var outerG = document.createElementNS(SVG_NS, 'g');
    outerG.setAttribute('id', entity.id);
    outerG.setAttribute('data-type', entity.type);

    // Convert 0-100% to 1920x1080
    var cx = (entity.position.x / 100) * 1920;
    var cy = (entity.position.y / 100) * 1080;
    outerG.setAttribute('transform', 'translate(' + cx + ', ' + cy + ')');

    // Highlight glow
    if (entity.highlight) {
      outerG.setAttribute('filter', 'url(#entity-glow)');
    }

    var innerG = document.createElementNS(SVG_NS, 'g');
    innerG.setAttribute('class', 'animate-element entrance-fadeInUp');
    innerG.style.transformBox = 'fill-box';
    innerG.style.transformOrigin = 'center center';
    innerG.style.willChange = 'transform, opacity';
    innerG.style.animationDelay = (delay || 0) + 'ms';

    // Simple shape rendering based on type
    var size = entity.size || 1.0;
    var color = entity.color || '#4A90D9';
    var w = 80 * size;
    var h = 60 * size;

    var rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-w / 2));
    rect.setAttribute('y', String(-h / 2));
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(h));
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', color);
    rect.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    rect.setAttribute('stroke-width', '1');
    innerG.appendChild(rect);

    // Label
    if (entity.label) {
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('y', String(h / 2 + 18));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'rgba(240,240,255,0.9)');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-family', "'JetBrains Mono', monospace");
      text.textContent = entity.label;
      innerG.appendChild(text);
    }

    outerG.appendChild(innerG);
    parentEl.appendChild(outerG);
    return outerG;
  }

  // ── Arrow Renderer ──────────────────────────────────────────────
  function renderArrowEntity(entity, parentEl, allEntities) {
    var source = findEntity(allEntities, entity.sourceEntityId);
    var target = findEntity(allEntities, entity.targetEntityId);
    if (!source || !target) return;

    var x1 = (source.position.x / 100) * 1920;
    var y1 = (source.position.y / 100) * 1080;
    var x2 = (target.position.x / 100) * 1920;
    var y2 = (target.position.y / 100) * 1080;

    var line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('id', entity.id);
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', entity.color || 'rgba(255,255,255,0.6)');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    line.setAttribute('class', 'entrance-fadeIn');
    parentEl.appendChild(line);

    // Arrow label at midpoint
    if (entity.label) {
      var mx = (x1 + x2) / 2;
      var my = (y1 + y2) / 2 - 10;
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(mx));
      text.setAttribute('y', String(my));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'rgba(255,255,255,0.7)');
      text.setAttribute('font-size', '12');
      text.textContent = entity.label;
      parentEl.appendChild(text);
    }
  }

  function findEntity(entities, id) {
    for (var i = 0; i < entities.length; i++) {
      if (entities[i].id === id) return entities[i];
    }
    return null;
  }

  // ── Narrator ────────────────────────────────────────────────────
  function updateNarrator(text) {
    if (!narratorText) return;
    if (text) {
      narratorText.textContent = text;
      narratorText.classList.add('visible');
    } else {
      narratorText.textContent = '';
      narratorText.classList.remove('visible');
    }
  }

  // ── postMessage bridge (for iframe embed control) ───────────────
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;

    if (e.data.type === 'pre:seek' && currentScript) {
      var idx = e.data.frameIndex;
      if (idx >= 0 && idx < currentScript.frames.length) {
        currentFrame = idx;
        renderFrame(currentScript.frames[idx]);
      }
    }

    if (e.data.type === 'pre:next' && currentScript) {
      if (currentFrame < currentScript.frames.length - 1) {
        currentFrame++;
        renderFrame(currentScript.frames[currentFrame]);
      }
    }

    if (e.data.type === 'pre:prev' && currentScript) {
      if (currentFrame > 0) {
        currentFrame--;
        renderFrame(currentScript.frames[currentFrame]);
      }
    }
  });

  // Expose for debugging
  window.__PRE = {
    sessionId: sessionId,
    getScript: function() { return currentScript; },
    getFrame: function() { return currentFrame; },
  };

  console.log('[PRE] Player initialized for session:', sessionId);
})();
`;
