/**
 * @pre/mcp-server — Player Bootstrap JS (v2)
 *
 * Complete rewrite with:
 * - Type-specific SVG renderers (Server, Database, Cloud, User, Concept, Label, CodeBlock, etc.)
 * - Bezier curve arrows with glow
 * - Label overflow handling (truncation + multi-line)
 * - Dot grid background
 * - Frame navigation (keyboard arrows + buttons)
 * - GSAP entrance choreography
 *
 * Served at GET /player.js as vanilla ES5-compat IIFE.
 */

export const PLAYER_JS = `(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // Constants
  // ═══════════════════════════════════════════════════════════════════
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var CW = 1920;  // Canvas width
  var CH = 1080;  // Canvas height
  var LABEL_MAX_CHARS = 28;  // Truncate labels beyond this
  var FONT_UI = "'Inter', sans-serif";
  var FONT_MONO = "'JetBrains Mono', monospace";

  // ═══════════════════════════════════════════════════════════════════
  // Session & DOM
  // ═══════════════════════════════════════════════════════════════════
  var sessionId = document.body.getAttribute('data-session-id');
  if (!sessionId) {
    console.error('[PRE] No data-session-id on <body>.');
    return;
  }

  var canvas          = document.getElementById('canvas');
  var entityLayer     = document.getElementById('entity-layer');
  var connectionLayer = document.getElementById('connection-layer');
  var narratorText    = document.getElementById('narrator-text');
  var dotGrid         = document.getElementById('dot-grid');
  var frameCounter    = document.getElementById('frame-counter');
  var frameNav        = document.getElementById('frame-nav');
  var prevBtn         = document.getElementById('prev-frame');
  var nextBtn         = document.getElementById('next-frame');

  var currentScript = null;
  var currentFrame  = 0;

  // ═══════════════════════════════════════════════════════════════════
  // Init: Dot grid
  // ═══════════════════════════════════════════════════════════════════
  function initDotGrid() {
    if (!dotGrid) return;
    var spacing = 60;
    for (var x = spacing; x < CW; x += spacing) {
      for (var y = spacing; y < CH; y += spacing) {
        var dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', String(x));
        dot.setAttribute('cy', String(y));
        dot.setAttribute('r', '1');
        dot.setAttribute('fill', 'rgba(255,255,255,0.5)');
        dotGrid.appendChild(dot);
      }
    }
  }
  initDotGrid();

  // ═══════════════════════════════════════════════════════════════════
  // Utility: Label truncation
  // ═══════════════════════════════════════════════════════════════════
  function truncLabel(text, max) {
    if (!text) return '';
    max = max || LABEL_MAX_CHARS;
    return text.length > max ? text.substring(0, max - 1) + '\u2026' : text;
  }

  // Utility: Parse size param → pixel base
  function sizeToPixels(s) {
    s = s || 1;
    return Math.min(Math.max(s * 50, 20), 140);
  }

  // Utility: hex color → rgba with alpha
  function colorAlpha(color, alpha) {
    // For hex colors, append alpha hex. For others, wrap in rgba.
    if (!color) color = '#4FC3F7';
    if (color.charAt(0) === '#' && color.length === 7) {
      var a = Math.round(alpha * 255).toString(16);
      if (a.length === 1) a = '0' + a;
      return color + a;
    }
    return color;
  }

  // Utility: create a linear gradient def and return its ID
  var gradientCounter = 0;
  function createGradient(color, parentSvg) {
    var id = 'eg-' + (++gradientCounter);
    var defs = parentSvg.querySelector('defs');
    if (!defs) return color;

    var lg = document.createElementNS(SVG_NS, 'linearGradient');
    lg.setAttribute('id', id);
    lg.setAttribute('x1', '0');
    lg.setAttribute('y1', '0');
    lg.setAttribute('x2', '0');
    lg.setAttribute('y2', '1');

    var s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', colorAlpha(color, 0.18));
    lg.appendChild(s1);

    var s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', colorAlpha(color, 0.06));
    lg.appendChild(s2);

    defs.appendChild(lg);
    return 'url(#' + id + ')';
  }

  // ═══════════════════════════════════════════════════════════════════
  // Double-<g> pattern: outerG (position) + innerG (animation)
  // ═══════════════════════════════════════════════════════════════════
  function createEntityGroup(entity, delay) {
    var outerG = document.createElementNS(SVG_NS, 'g');
    outerG.setAttribute('id', entity.id);
    outerG.setAttribute('data-type', entity.type || 'Unknown');

    var cx = (entity.position.x / 100) * CW;
    var cy = (entity.position.y / 100) * CH;
    outerG.setAttribute('transform', 'translate(' + cx + ', ' + cy + ')');

    if (entity.highlight) {
      outerG.setAttribute('filter', 'url(#entity-glow)');
      outerG.classList.add('entity-highlighted');
    }

    var innerG = document.createElementNS(SVG_NS, 'g');
    innerG.setAttribute('class', 'animate-element entrance-fadeInUp');
    innerG.style.transformBox = 'fill-box';
    innerG.style.transformOrigin = 'center center';
    innerG.style.willChange = 'transform, opacity';

    var d = delay || 0;
    if (entity.animation && entity.animation.delay != null) {
      d = entity.animation.delay;
    }
    innerG.style.animationDelay = d + 'ms';

    // Override entrance animation if specified
    if (entity.animation && entity.animation.entrance) {
      var eName = entity.animation.entrance;
      if (eName !== 'fadeInUp') {
        innerG.setAttribute('class', 'animate-element entrance-' + eName);
      }
    }

    outerG.appendChild(innerG);
    return { outerG: outerG, innerG: innerG };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Label renderer: adds text below entity with truncation
  // ═══════════════════════════════════════════════════════════════════
  function addLabel(innerG, entity, yOffset, opts) {
    if (!entity.label) return;
    opts = opts || {};
    var color = opts.color || entity.color || '#c8c8e0';
    var fontSize = opts.fontSize || 14;
    var fontWeight = opts.fontWeight || '500';
    var fontFamily = opts.fontFamily || FONT_UI;
    var maxChars = opts.maxChars || LABEL_MAX_CHARS;

    var label = truncLabel(entity.label, maxChars);

    var text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(yOffset));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', fontWeight);
    text.setAttribute('font-family', fontFamily);
    text.textContent = label;
    innerG.appendChild(text);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Entity Renderers — type-specific SVG shapes
  // ═══════════════════════════════════════════════════════════════════

  // ── Server: rack with stripe lines + LED dots ───────────────────
  function renderServer(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#4FC3F7';
    var w = s * 1.3;
    var h = s * 0.9;
    var fill = createGradient(color, canvas);

    // Body
    var body = document.createElementNS(SVG_NS, 'rect');
    body.setAttribute('x', String(-w/2));
    body.setAttribute('y', String(-h/2));
    body.setAttribute('width', String(w));
    body.setAttribute('height', String(h));
    body.setAttribute('rx', '8');
    body.setAttribute('fill', fill);
    body.setAttribute('stroke', color);
    body.setAttribute('stroke-width', '1.5');
    innerG.appendChild(body);

    // Rack stripe lines (3 horizontal)
    for (var i = -1; i <= 1; i++) {
      var ly = i * (h / 4);
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(-w/2 + 6));
      line.setAttribute('x2', String(w/2 - 6));
      line.setAttribute('y1', String(ly));
      line.setAttribute('y2', String(ly));
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('opacity', '0.3');
      innerG.appendChild(line);
    }

    // LED dots (top-left)
    var dotColors = [color, '#4CAF50'];
    for (var d = 0; d < 2; d++) {
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(-w/2 + 12 + d * 10));
      dot.setAttribute('cy', String(-h/2 + 10));
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', dotColors[d]);
      dot.setAttribute('opacity', '0.9');
      innerG.appendChild(dot);
    }

    addLabel(innerG, entity, h/2 + 22);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Database: cylinder (top ellipse + body + bottom ellipse) ─────
  function renderDatabase(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#b388ff';
    var rx = s * 0.5;
    var ry = s * 0.15;
    var bodyH = s * 0.55;
    var topY = -s * 0.35;
    var botY = topY + bodyH;
    var fill = createGradient(color, canvas);

    // Body fill (rect behind ellipses)
    var bodyFill = document.createElementNS(SVG_NS, 'rect');
    bodyFill.setAttribute('x', String(-rx));
    bodyFill.setAttribute('y', String(topY));
    bodyFill.setAttribute('width', String(rx * 2));
    bodyFill.setAttribute('height', String(bodyH));
    bodyFill.setAttribute('fill', fill);
    innerG.appendChild(bodyFill);

    // Side lines
    for (var side = -1; side <= 1; side += 2) {
      var vl = document.createElementNS(SVG_NS, 'line');
      vl.setAttribute('x1', String(side * rx));
      vl.setAttribute('y1', String(topY));
      vl.setAttribute('x2', String(side * rx));
      vl.setAttribute('y2', String(botY));
      vl.setAttribute('stroke', color);
      vl.setAttribute('stroke-width', '1.5');
      innerG.appendChild(vl);
    }

    // Bottom ellipse
    var botE = document.createElementNS(SVG_NS, 'ellipse');
    botE.setAttribute('cx', '0');
    botE.setAttribute('cy', String(botY));
    botE.setAttribute('rx', String(rx));
    botE.setAttribute('ry', String(ry));
    botE.setAttribute('fill', fill);
    botE.setAttribute('stroke', color);
    botE.setAttribute('stroke-width', '1.5');
    innerG.appendChild(botE);

    // Top ellipse (on top)
    var topE = document.createElementNS(SVG_NS, 'ellipse');
    topE.setAttribute('cx', '0');
    topE.setAttribute('cy', String(topY));
    topE.setAttribute('rx', String(rx));
    topE.setAttribute('ry', String(ry));
    topE.setAttribute('fill', fill);
    topE.setAttribute('stroke', color);
    topE.setAttribute('stroke-width', '1.5');
    innerG.appendChild(topE);

    // Data stripes
    var stripes = [0.3, 0.6];
    for (var si = 0; si < stripes.length; si++) {
      var sy = topY + bodyH * stripes[si];
      var sw = rx * 0.7;
      var stripe = document.createElementNS(SVG_NS, 'line');
      stripe.setAttribute('x1', String(-sw));
      stripe.setAttribute('y1', String(sy));
      stripe.setAttribute('x2', String(sw));
      stripe.setAttribute('y2', String(sy));
      stripe.setAttribute('stroke', color);
      stripe.setAttribute('stroke-width', '0.8');
      stripe.setAttribute('opacity', '0.25');
      innerG.appendChild(stripe);
    }

    addLabel(innerG, entity, botY + ry + 22);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Cloud: rounded blob shape ───────────────────────────────────
  function renderCloud(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#90CAF9';
    var fill = createGradient(color, canvas);

    var path = document.createElementNS(SVG_NS, 'path');
    var sc = s / 50;
    path.setAttribute('d',
      'M' + (-25*sc) + ',' + (8*sc) +
      ' C' + (-30*sc) + ',' + (-8*sc) + ' ' + (-18*sc) + ',' + (-22*sc) + ' ' + (-4*sc) + ',' + (-22*sc) +
      ' C' + (0*sc) + ',' + (-32*sc) + ' ' + (16*sc) + ',' + (-30*sc) + ' ' + (20*sc) + ',' + (-20*sc) +
      ' C' + (30*sc) + ',' + (-20*sc) + ' ' + (34*sc) + ',' + (-8*sc) + ' ' + (30*sc) + ',' + (0*sc) +
      ' C' + (36*sc) + ',' + (6*sc) + ' ' + (32*sc) + ',' + (16*sc) + ' ' + (22*sc) + ',' + (16*sc) +
      ' L' + (-20*sc) + ',' + (16*sc) +
      ' C' + (-32*sc) + ',' + (16*sc) + ' ' + (-34*sc) + ',' + (6*sc) + ' ' + (-25*sc) + ',' + (8*sc) + ' Z'
    );
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.5');
    innerG.appendChild(path);

    addLabel(innerG, entity, s * 0.45 + 20);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── User: head circle + body arc ────────────────────────────────
  function renderUser(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#4DD0E1';
    var fill = createGradient(color, canvas);
    var r = s * 0.2;

    // Head
    var head = document.createElementNS(SVG_NS, 'circle');
    head.setAttribute('cx', '0');
    head.setAttribute('cy', String(-s*0.2));
    head.setAttribute('r', String(r));
    head.setAttribute('fill', fill);
    head.setAttribute('stroke', color);
    head.setAttribute('stroke-width', '1.5');
    innerG.appendChild(head);

    // Body arc
    var bodyPath = document.createElementNS(SVG_NS, 'path');
    var bw = s * 0.4;
    var bh = s * 0.3;
    bodyPath.setAttribute('d',
      'M' + (-bw) + ',' + (bh) +
      ' C' + (-bw) + ',' + (bh * 0.3) + ' ' + (-bw * 0.5) + ',' + 0 + ' 0,' + 0 +
      ' C' + (bw * 0.5) + ',' + 0 + ' ' + bw + ',' + (bh * 0.3) + ' ' + bw + ',' + bh
    );
    bodyPath.setAttribute('fill', 'none');
    bodyPath.setAttribute('stroke', color);
    bodyPath.setAttribute('stroke-width', '1.5');
    bodyPath.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(bodyPath);

    addLabel(innerG, entity, s * 0.4 + 20);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Concept: circle with dashed inner ring ──────────────────────
  function renderConcept(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#00e5ff';
    var fill = createGradient(color, canvas);
    var r = s * 0.5;

    var outer = document.createElementNS(SVG_NS, 'circle');
    outer.setAttribute('cx', '0');
    outer.setAttribute('cy', '0');
    outer.setAttribute('r', String(r));
    outer.setAttribute('fill', fill);
    outer.setAttribute('stroke', color);
    outer.setAttribute('stroke-width', '2');
    innerG.appendChild(outer);

    var inner = document.createElementNS(SVG_NS, 'circle');
    inner.setAttribute('cx', '0');
    inner.setAttribute('cy', '0');
    inner.setAttribute('r', String(r - 6));
    inner.setAttribute('fill', 'none');
    inner.setAttribute('stroke', colorAlpha(color, 0.25));
    inner.setAttribute('stroke-width', '1');
    inner.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(inner);

    // Center label inside
    if (entity.label) {
      var lbl = truncLabel(entity.label, 20);
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '5');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(Math.min(14, r * 0.35)));
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', FONT_UI);
      text.textContent = lbl;
      innerG.appendChild(text);
    }

    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Label: clean text with optional pill background ─────────────
  function renderLabel(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#FFFFFF';
    var fontSize = Math.min(Math.max(s * 0.4, 14), 36);
    var label = entity.label || '';

    // Pill background (subtle)
    if (label.length > 0) {
      var pw = Math.min(label.length * fontSize * 0.55 + 32, 600);
      var ph = fontSize + 20;
      var pill = document.createElementNS(SVG_NS, 'rect');
      pill.setAttribute('x', String(-pw/2));
      pill.setAttribute('y', String(-ph/2));
      pill.setAttribute('width', String(pw));
      pill.setAttribute('height', String(ph));
      pill.setAttribute('rx', String(ph/2));
      pill.setAttribute('fill', colorAlpha(color, 0.06));
      pill.setAttribute('stroke', 'none');
      innerG.appendChild(pill);
    }

    var text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(fontSize * 0.35));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', FONT_UI);
    text.setAttribute('letter-spacing', '0.01em');
    text.textContent = truncLabel(label, 50);
    innerG.appendChild(text);

    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── CodeBlock: dark rect with monospace text ────────────────────
  function renderCodeBlock(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#4FC3F7';
    var code = entity.textContent || entity.label || 'code';
    var lines = code.split('\\n').slice(0, 8);  // max 8 lines
    var lineH = 16;
    var w = Math.min(Math.max(s * 2.5, 160), 500);
    var h = lines.length * lineH + 28;

    // Background
    var bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(-w/2));
    bg.setAttribute('y', String(-h/2));
    bg.setAttribute('width', String(w));
    bg.setAttribute('height', String(h));
    bg.setAttribute('rx', '10');
    bg.setAttribute('fill', 'rgba(8, 8, 20, 0.8)');
    bg.setAttribute('stroke', colorAlpha(color, 0.25));
    bg.setAttribute('stroke-width', '1');
    innerG.appendChild(bg);

    // Title bar dots
    var dotColors = ['#ff5f57', '#febc2e', '#28c840'];
    for (var di = 0; di < 3; di++) {
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(-w/2 + 16 + di * 14));
      dot.setAttribute('cy', String(-h/2 + 12));
      dot.setAttribute('r', '4');
      dot.setAttribute('fill', dotColors[di]);
      dot.setAttribute('opacity', '0.8');
      innerG.appendChild(dot);
    }

    // Code lines
    for (var li = 0; li < lines.length; li++) {
      var tl = document.createElementNS(SVG_NS, 'text');
      tl.setAttribute('x', String(-w/2 + 16));
      tl.setAttribute('y', String(-h/2 + 32 + li * lineH));
      tl.setAttribute('fill', colorAlpha(color, 0.85));
      tl.setAttribute('font-size', '13');
      tl.setAttribute('font-family', FONT_MONO);
      tl.textContent = truncLabel(lines[li], 48);
      innerG.appendChild(tl);
    }

    addLabel(innerG, entity, h/2 + 20, { maxChars: 40 });
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Generic: rounded rect/circle/diamond with type badge ────────
  function renderGeneric(entity, parentEl, delay, shape) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#4FC3F7';
    var fill = createGradient(color, canvas);
    shape = shape || 'rect';

    if (shape === 'circle') {
      var circ = document.createElementNS(SVG_NS, 'circle');
      circ.setAttribute('cx', '0');
      circ.setAttribute('cy', '0');
      circ.setAttribute('r', String(s * 0.45));
      circ.setAttribute('fill', fill);
      circ.setAttribute('stroke', color);
      circ.setAttribute('stroke-width', '1.5');
      innerG.appendChild(circ);
    } else if (shape === 'diamond') {
      var d = s * 0.5;
      var poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', '0,' + (-d) + ' ' + d + ',0 0,' + d + ' ' + (-d) + ',0');
      poly.setAttribute('fill', fill);
      poly.setAttribute('stroke', color);
      poly.setAttribute('stroke-width', '1.5');
      innerG.appendChild(poly);
    } else if (shape === 'hexagon') {
      var pts = [];
      for (var hi = 0; hi < 6; hi++) {
        var angle = (Math.PI / 3) * hi - Math.PI / 6;
        pts.push((Math.cos(angle) * s * 0.45).toFixed(1) + ',' + (Math.sin(angle) * s * 0.45).toFixed(1));
      }
      var hex = document.createElementNS(SVG_NS, 'polygon');
      hex.setAttribute('points', pts.join(' '));
      hex.setAttribute('fill', fill);
      hex.setAttribute('stroke', color);
      hex.setAttribute('stroke-width', '1.5');
      innerG.appendChild(hex);
    } else {
      // Rounded rect (default)
      var w = s * 1.3;
      var h = s * 0.85;
      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-w/2));
      rect.setAttribute('y', String(-h/2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', '10');
      rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', '1.5');
      innerG.appendChild(rect);
    }

    // Type badge (small, subtle)
    var badge = document.createElementNS(SVG_NS, 'text');
    badge.setAttribute('x', '0');
    badge.setAttribute('y', '-3');
    badge.setAttribute('text-anchor', 'middle');
    badge.setAttribute('fill', colorAlpha(color, 0.4));
    badge.setAttribute('font-size', '9');
    badge.setAttribute('font-family', FONT_MONO);
    badge.setAttribute('font-weight', '500');
    badge.textContent = entity.type;
    innerG.appendChild(badge);

    var labelY = (shape === 'circle') ? s * 0.45 + 20 : s * 0.45 + 18;
    addLabel(innerG, entity, labelY);

    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Type → Renderer dispatch table
  // ═══════════════════════════════════════════════════════════════════
  var SHAPE_MAP = {
    Cache: 'circle', LoadBalancer: 'hexagon', Decision: 'diamond',
    Metric: 'circle', Concept: 'concept', Cycle: 'circle',
    Particle: 'circle', StateNode: 'circle', Cluster: 'circle'
  };

  function dispatchEntity(entity, parentEl, delay) {
    var t = entity.type || 'Entity';

    // Dedicated renderers
    if (t === 'Server' || t === 'Service' || t === 'APIGateway' || t === 'Lambda')
      return renderServer(entity, parentEl, delay);
    if (t === 'Database' || t === 'HashTable')
      return renderDatabase(entity, parentEl, delay);
    if (t === 'Cloud')
      return renderCloud(entity, parentEl, delay);
    if (t === 'User')
      return renderUser(entity, parentEl, delay);
    if (t === 'Concept')
      return renderConcept(entity, parentEl, delay);
    if (t === 'Label' || t === 'Annotation' || t === 'Definition' || t === 'Callout' || t === 'Quote' || t === 'Badge')
      return renderLabel(entity, parentEl, delay);
    if (t === 'CodeBlock')
      return renderCodeBlock(entity, parentEl, delay);

    // Shape-mapped generics
    var shape = SHAPE_MAP[t] || 'rect';
    return renderGeneric(entity, parentEl, delay, shape);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Arrow Renderer — bezier curves with glow
  // ═══════════════════════════════════════════════════════════════════
  function findEntity(entities, id) {
    if (!id) return null;
    for (var i = 0; i < entities.length; i++) {
      if (entities[i].id === id) return entities[i];
      // Also try label match
      if (entities[i].label && entities[i].label === id) return entities[i];
    }
    return null;
  }

  function ensureMarker(id, color) {
    if (canvas.querySelector('#' + id)) return;
    var defs = canvas.querySelector('defs');
    if (!defs) return;

    var marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', id);
    marker.setAttribute('markerWidth', '12');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '4');
    marker.setAttribute('orient', 'auto');

    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M 0 0.5 L 10 4 L 0 7.5 L 2.5 4 Z');
    p.setAttribute('fill', color);
    marker.appendChild(p);
    defs.appendChild(marker);
  }

  function renderArrowEntity(entity, parentEl, allEntities, delay) {
    var source = findEntity(allEntities, entity.sourceEntityId);
    var target = findEntity(allEntities, entity.targetEntityId);
    if (!source || !target) return null;

    var x1 = (source.position.x / 100) * CW;
    var y1 = (source.position.y / 100) * CH;
    var x2 = (target.position.x / 100) * CW;
    var y2 = (target.position.y / 100) * CH;
    var color = entity.color || 'rgba(255,255,255,0.5)';

    var markerId = 'ah-' + entity.id.replace(/[^a-zA-Z0-9]/g, '');
    ensureMarker(markerId, color);

    var ag = document.createElementNS(SVG_NS, 'g');
    ag.setAttribute('id', entity.id);
    ag.setAttribute('data-type', entity.type);

    // Compute bezier control points (gentle arc)
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dist = Math.sqrt(dx*dx + dy*dy);
    var curvature = Math.min(dist * 0.12, 50);
    // Perpendicular offset for the arc
    var nx = -dy / dist * curvature;
    var ny =  dx / dist * curvature;
    var cx1 = mx + nx;
    var cy1 = my + ny;

    // Glow line (thicker, blurred)
    var glow = document.createElementNS(SVG_NS, 'path');
    glow.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' Q ' + cx1 + ' ' + cy1 + ' ' + x2 + ' ' + y2);
    glow.setAttribute('stroke', color);
    glow.setAttribute('stroke-width', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('opacity', '0.12');
    glow.setAttribute('stroke-linecap', 'round');
    ag.appendChild(glow);

    // Main line
    var line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' Q ' + cx1 + ' ' + cy1 + ' ' + x2 + ' ' + y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('fill', 'none');
    line.setAttribute('opacity', '0.7');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', 'url(#' + markerId + ')');
    ag.appendChild(line);

    // DataFlow: animated dash
    if (entity.type === 'DataFlow') {
      line.setAttribute('stroke-dasharray', '8,5');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('opacity', '0.5');
      var anim = document.createElementNS(SVG_NS, 'animate');
      anim.setAttribute('attributeName', 'stroke-dashoffset');
      anim.setAttribute('from', '13');
      anim.setAttribute('to', '0');
      anim.setAttribute('dur', '0.8s');
      anim.setAttribute('repeatCount', 'indefinite');
      line.appendChild(anim);
    }

    // Midpoint label
    if (entity.label) {
      var lx = (x1 + 2*cx1 + x2) / 4;
      var ly = (y1 + 2*cy1 + y2) / 4 - 10;
      var lt = document.createElementNS(SVG_NS, 'text');
      lt.setAttribute('x', String(lx));
      lt.setAttribute('y', String(ly));
      lt.setAttribute('text-anchor', 'middle');
      lt.setAttribute('fill', color);
      lt.setAttribute('font-size', '12');
      lt.setAttribute('font-weight', '500');
      lt.setAttribute('font-family', FONT_UI);
      lt.setAttribute('opacity', '0.8');
      lt.textContent = truncLabel(entity.label, 24);
      ag.appendChild(lt);
    }

    // Entrance
    ag.style.opacity = '0';
    ag.style.animation = 'fadeIn 0.4s ease both';
    ag.style.animationDelay = (delay || 400) + 'ms';

    parentEl.appendChild(ag);
    return ag;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Frame Renderer
  // ═══════════════════════════════════════════════════════════════════
  var ARROW_TYPES = {
    Arrow: 1, DataFlow: 1, BidirectArrow: 1, DottedArrow: 1, Transition: 1, Bus: 1
  };

  function renderFrame(frame) {
    if (!frame) return;

    // Clear layers
    entityLayer.innerHTML = '';
    connectionLayer.innerHTML = '';

    var entities = frame.entities || [];
    var nonArrows = [];
    var arrows = [];

    for (var i = 0; i < entities.length; i++) {
      if (ARROW_TYPES[entities[i].type]) {
        arrows.push(entities[i]);
      } else {
        nonArrows.push(entities[i]);
      }
    }

    // Pass 1: Render entities with staggered delays
    for (var j = 0; j < nonArrows.length; j++) {
      dispatchEntity(nonArrows[j], entityLayer, j * 70);
    }

    // Pass 2: Render connections (after entities, so positions exist)
    var arrowBaseDelay = nonArrows.length * 70 + 100;
    for (var k = 0; k < arrows.length; k++) {
      renderArrowEntity(arrows[k], connectionLayer, entities, arrowBaseDelay + k * 60);
    }

    // Narrator
    var narText = '';
    if (frame.narrationSegment) {
      narText = typeof frame.narrationSegment === 'string'
        ? frame.narrationSegment
        : (frame.narrationSegment.text || '');
    }
    updateNarrator(narText);

    // Canvas entrance via GSAP
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(canvas, { opacity: 0.85 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Narrator
  // ═══════════════════════════════════════════════════════════════════
  function updateNarrator(text) {
    if (!narratorText) return;
    if (text && text.trim()) {
      narratorText.textContent = text;
      narratorText.classList.add('visible');
    } else {
      narratorText.classList.remove('visible');
      setTimeout(function() { narratorText.textContent = ''; }, 400);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Frame Navigation
  // ═══════════════════════════════════════════════════════════════════
  function updateFrameCounter() {
    if (!frameCounter || !currentScript) return;
    var total = currentScript.frames ? currentScript.frames.length : 1;
    frameCounter.textContent = (currentFrame + 1) + ' / ' + total;
    if (frameNav) frameNav.classList.add('visible');
  }

  function goNext() {
    if (!currentScript) return;
    if (currentFrame < currentScript.frames.length - 1) {
      currentFrame++;
      renderFrame(currentScript.frames[currentFrame]);
      updateFrameCounter();
    }
  }

  function goPrev() {
    if (!currentScript) return;
    if (currentFrame > 0) {
      currentFrame--;
      renderFrame(currentScript.frames[currentFrame]);
      updateFrameCounter();
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')    { e.preventDefault(); goPrev(); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // SSE Connection
  // ═══════════════════════════════════════════════════════════════════
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
        updateFrameCounter();
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
    console.warn('[PRE] SSE connection interrupted — auto-reconnecting.');
  });

  // ═══════════════════════════════════════════════════════════════════
  // postMessage bridge (for iframe embed control)
  // ═══════════════════════════════════════════════════════════════════
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    if (e.data.type === 'pre:seek' && currentScript) {
      var idx = e.data.frameIndex;
      if (idx >= 0 && idx < currentScript.frames.length) {
        currentFrame = idx;
        renderFrame(currentScript.frames[idx]);
        updateFrameCounter();
      }
    }
    if (e.data.type === 'pre:next') goNext();
    if (e.data.type === 'pre:prev') goPrev();
  });

  // Expose for debugging
  window.__PRE = {
    sessionId: sessionId,
    getScript: function() { return currentScript; },
    getFrame: function() { return currentFrame; },
  };

  console.log('[PRE] Player v2 initialized for session:', sessionId);
})();
`;
