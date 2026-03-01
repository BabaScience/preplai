/**
 * @pre/mcp-server — Player Bootstrap JS (v3)
 *
 * Complete rewrite with all 24 fixes:
 * - Type-specific SVG renderers (Server, Database, Cloud, User, Concept, Label, CodeBlock, etc.)
 * - Bezier curve arrows with glow, larger arrowheads, subtle flow animation
 * - Label overflow handling (multi-line tspan wrapping)
 * - Dot grid background (more visible)
 * - Frame navigation (keyboard arrows + buttons)
 * - GSAP entrance choreography (type-specific animations)
 * - Canvas margin/safe-zone system
 * - Visual weight hierarchy for labels
 * - Semi-transparent pill backgrounds on arrow labels
 * - Drop-shadow filter on entity shapes
 * - Increased gradient opacity
 * - Hover/focus interactive states
 * - Frame crossfade transitions
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
  var LABEL_MAX_CHARS = 80;  // Fix #3: was 28, now 80
  var MARGIN_X = 80;         // Fix #8: safe-zone horizontal margin
  var MARGIN_Y = 60;         // Fix #8: safe-zone vertical margin
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
  // Init: Dot grid — Fix #22: bigger dots, more opaque fill
  // ═══════════════════════════════════════════════════════════════════
  function initDotGrid() {
    if (!dotGrid) return;
    var spacing = 60;
    for (var x = spacing; x < CW; x += spacing) {
      for (var y = spacing; y < CH; y += spacing) {
        var dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', String(x));
        dot.setAttribute('cy', String(y));
        dot.setAttribute('r', '1.5');                          // Fix #22: was '1'
        dot.setAttribute('fill', 'rgba(255,255,255,0.7)');    // Fix #22: was 0.5
        dotGrid.appendChild(dot);
      }
    }
  }
  initDotGrid();

  // ═══════════════════════════════════════════════════════════════════
  // SVG filter defs: soft-shadow, entity-glow
  // ═══════════════════════════════════════════════════════════════════
  (function ensureFilterDefs() {
    if (!canvas) return;
    var defs = canvas.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(SVG_NS, 'defs');
      canvas.insertBefore(defs, canvas.firstChild);
    }

    // soft-shadow filter — Fix #19
    if (!defs.querySelector('#soft-shadow')) {
      var filt = document.createElementNS(SVG_NS, 'filter');
      filt.setAttribute('id', 'soft-shadow');
      filt.setAttribute('x', '-20%');
      filt.setAttribute('y', '-20%');
      filt.setAttribute('width', '140%');
      filt.setAttribute('height', '140%');
      var feGauss = document.createElementNS(SVG_NS, 'feGaussianBlur');
      feGauss.setAttribute('in', 'SourceAlpha');
      feGauss.setAttribute('stdDeviation', '6');
      feGauss.setAttribute('result', 'blur');
      var feOffset = document.createElementNS(SVG_NS, 'feOffset');
      feOffset.setAttribute('in', 'blur');
      feOffset.setAttribute('dx', '0');
      feOffset.setAttribute('dy', '4');
      feOffset.setAttribute('result', 'offsetBlur');
      var feFlood = document.createElementNS(SVG_NS, 'feFlood');
      feFlood.setAttribute('flood-color', 'rgba(0,0,0,0.5)');
      feFlood.setAttribute('result', 'color');
      var feComposite = document.createElementNS(SVG_NS, 'feComposite');
      feComposite.setAttribute('in', 'color');
      feComposite.setAttribute('in2', 'offsetBlur');
      feComposite.setAttribute('operator', 'in');
      feComposite.setAttribute('result', 'shadow');
      var feMerge = document.createElementNS(SVG_NS, 'feMerge');
      var feMergeNode1 = document.createElementNS(SVG_NS, 'feMergeNode');
      feMergeNode1.setAttribute('in', 'shadow');
      var feMergeNode2 = document.createElementNS(SVG_NS, 'feMergeNode');
      feMergeNode2.setAttribute('in', 'SourceGraphic');
      feMerge.appendChild(feMergeNode1);
      feMerge.appendChild(feMergeNode2);
      filt.appendChild(feGauss);
      filt.appendChild(feOffset);
      filt.appendChild(feFlood);
      filt.appendChild(feComposite);
      filt.appendChild(feMerge);
      defs.appendChild(filt);
    }

    // entity-glow filter
    if (!defs.querySelector('#entity-glow')) {
      var gf = document.createElementNS(SVG_NS, 'filter');
      gf.setAttribute('id', 'entity-glow');
      gf.setAttribute('x', '-30%');
      gf.setAttribute('y', '-30%');
      gf.setAttribute('width', '160%');
      gf.setAttribute('height', '160%');
      var gBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
      gBlur.setAttribute('in', 'SourceGraphic');
      gBlur.setAttribute('stdDeviation', '8');
      gf.appendChild(gBlur);
      defs.appendChild(gf);
    }
  })();

  // ═══════════════════════════════════════════════════════════════════
  // Utility: multi-line text wrapping — Fix #2, #3
  // ═══════════════════════════════════════════════════════════════════
  function wrapText(text, maxCharsPerLine) {
    if (!text) return [];
    maxCharsPerLine = maxCharsPerLine || 20;
    var words = text.split(' ');
    var lines = [];
    var current = '';
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (current.length === 0) {
        current = word;
      } else if (current.length + 1 + word.length <= maxCharsPerLine) {
        current = current + ' ' + word;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current.length > 0) lines.push(current);
    return lines;
  }

  // Utility: create multi-line SVG text with tspan elements — Fix #2, #3
  function createMultiLineText(parentEl, lines, opts) {
    opts = opts || {};
    var x = opts.x || 0;
    var y = opts.y || 0;
    var lineHeight = opts.lineHeight || 20;
    var textAnchor = opts.textAnchor || 'middle';
    var fill = opts.fill || '#FFFFFF';
    var fontSize = opts.fontSize || 14;
    var fontWeight = opts.fontWeight || '500';
    var fontFamily = opts.fontFamily || FONT_UI;
    var letterSpacing = opts.letterSpacing || '0.02em';

    var text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));
    text.setAttribute('text-anchor', textAnchor);
    text.setAttribute('fill', fill);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', fontWeight);
    text.setAttribute('font-family', fontFamily);
    text.setAttribute('letter-spacing', letterSpacing);

    var totalH = lines.length * lineHeight;
    var startY = -(totalH / 2) + lineHeight * 0.5;

    for (var i = 0; i < lines.length; i++) {
      var tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(x));
      tspan.setAttribute('dy', i === 0 ? String(startY) : String(lineHeight));
      tspan.textContent = lines[i];
      text.appendChild(tspan);
    }

    parentEl.appendChild(text);
    return text;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Utility: Label truncation
  // ═══════════════════════════════════════════════════════════════════
  function truncLabel(text, max) {
    if (!text) return '';
    max = max || LABEL_MAX_CHARS;
    return text.length > max ? text.substring(0, max - 1) + '\u2026' : text;
  }

  // Utility: Parse size param → pixel base — Fix #1
  function sizeToPixels(s) {
    s = s || 1;
    return Math.min(Math.max(s * 110, 60), 400);  // Fix #1: was s*50, 20, 140
  }

  // Utility: hex color → rgba with alpha
  function colorAlpha(color, alpha) {
    if (!color) color = '#4FC3F7';
    if (color.charAt(0) === '#' && color.length === 7) {
      var a = Math.round(alpha * 255).toString(16);
      if (a.length === 1) a = '0' + a;
      return color + a;
    }
    return color;
  }

  // Utility: create a linear gradient def and return its ID — Fix #19
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

    // Fix #19: increased alpha from 0.18/0.06 to 0.30/0.12
    var s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', colorAlpha(color, 0.30));
    lg.appendChild(s1);

    // Inner glow stop — Fix #19
    var s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '45%');
    s2.setAttribute('stop-color', colorAlpha(color, 0.22));
    lg.appendChild(s2);

    var s3 = document.createElementNS(SVG_NS, 'stop');
    s3.setAttribute('offset', '100%');
    s3.setAttribute('stop-color', colorAlpha(color, 0.12));
    lg.appendChild(s3);

    defs.appendChild(lg);
    return 'url(#' + id + ')';
  }

  // ═══════════════════════════════════════════════════════════════════
  // Utility: compute entity canvas position with margin — Fix #8
  // ═══════════════════════════════════════════════════════════════════
  function entityCX(entity) {
    return MARGIN_X + ((entity.position.x / 100) * (CW - 2 * MARGIN_X));
  }
  function entityCY(entity) {
    return MARGIN_Y + ((entity.position.y / 100) * (CH - 2 * MARGIN_Y));
  }

  // ═══════════════════════════════════════════════════════════════════
  // Utility: type-specific default entrance animation — Fix #18
  // ═══════════════════════════════════════════════════════════════════
  function defaultEntrance(type) {
    switch (type) {
      case 'Server':
      case 'Service':
      case 'APIGateway':
      case 'Lambda':
      case 'Database':
      case 'HashTable':
        return 'fadeInUp';
      case 'Cloud':
        return 'floatIn';
      case 'User':
        return 'scaleIn';
      case 'Concept':
        return 'drawIn';
      case 'Label':
      case 'Annotation':
      case 'Definition':
      case 'Callout':
      case 'Quote':
      case 'Badge':
        return 'fadeIn';
      case 'CodeBlock':
        return 'slideInLeft';
      default:
        return 'fadeInUp';
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Double-<g> pattern: outerG (position) + innerG (animation)
  // ═══════════════════════════════════════════════════════════════════
  function createEntityGroup(entity, delay) {
    var outerG = document.createElementNS(SVG_NS, 'g');
    outerG.setAttribute('id', entity.id);
    outerG.setAttribute('data-type', entity.type || 'Unknown');

    // Fix #8: use margin-aware position helpers
    var cx = entityCX(entity);
    var cy = entityCY(entity);
    outerG.setAttribute('transform', 'translate(' + cx + ', ' + cy + ')');

    if (entity.highlight) {
      outerG.setAttribute('filter', 'url(#entity-glow)');
      outerG.classList.add('entity-highlighted');
    }

    // Fix #17: interactive class for hover/focus states
    outerG.classList.add('entity-interactive');

    var innerG = document.createElementNS(SVG_NS, 'g');
    innerG.style.transformBox = 'fill-box';
    innerG.style.transformOrigin = 'center center';
    innerG.style.willChange = 'transform, opacity';

    var d = delay || 0;
    if (entity.animation && entity.animation.delay != null) {
      d = entity.animation.delay;
    }
    innerG.style.animationDelay = d + 'ms';

    // Fix #18: type-specific default entrance, overridable by entity.animation.entrance
    var entranceName = defaultEntrance(entity.type);
    if (entity.animation && entity.animation.entrance) {
      entranceName = entity.animation.entrance;
    }
    innerG.setAttribute('class', 'animate-element entrance-' + entranceName);

    // Fix #17: hover interaction
    outerG.addEventListener('mouseenter', function() {
      if (typeof gsap !== 'undefined') {
        gsap.to(innerG, { scale: 1.06, duration: 0.18, ease: 'power2.out',
          transformOrigin: 'center center' });
      } else {
        innerG.style.transform = 'scale(1.06)';
      }
      outerG.classList.add('entity-hovered');
    });
    outerG.addEventListener('mouseleave', function() {
      if (typeof gsap !== 'undefined') {
        gsap.to(innerG, { scale: 1, duration: 0.22, ease: 'power2.inOut',
          transformOrigin: 'center center' });
      } else {
        innerG.style.transform = '';
      }
      outerG.classList.remove('entity-hovered');
    });

    outerG.appendChild(innerG);
    return { outerG: outerG, innerG: innerG };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Label renderer: adds text below entity — Fix #12, #13, #14
  // ═══════════════════════════════════════════════════════════════════
  function addLabel(innerG, entity, yOffset, opts) {
    if (!entity.label) return;
    opts = opts || {};
    var color = opts.color || entity.color || '#c8c8e0';
    var s = sizeToPixels(entity.size);
    // Fix #12: adaptive font size
    var fontSize = opts.fontSize || Math.max(12, Math.min(s * 0.18, 22));
    // Fix #14: font-weight 600
    var fontWeight = opts.fontWeight || '600';
    var fontFamily = opts.fontFamily || FONT_UI;
    var maxChars = opts.maxChars || LABEL_MAX_CHARS;

    var label = truncLabel(entity.label, maxChars);

    var text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(yOffset));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);   // Fix #13: full-opacity color
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', fontWeight);
    text.setAttribute('font-family', fontFamily);
    text.setAttribute('letter-spacing', '0.02em');  // Fix #14
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

    // Body — Fix #19: drop-shadow filter
    var body = document.createElementNS(SVG_NS, 'rect');
    body.setAttribute('x', String(-w/2));
    body.setAttribute('y', String(-h/2));
    body.setAttribute('width', String(w));
    body.setAttribute('height', String(h));
    body.setAttribute('rx', '8');
    body.setAttribute('fill', fill);
    body.setAttribute('stroke', color);
    body.setAttribute('stroke-width', '1.5');
    body.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
    innerG.appendChild(body);

    // Rack stripe lines (3 horizontal)
    for (var i = -1; i <= 1; i++) {
      var lineY = i * (h / 4);
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(-w/2 + 6));
      line.setAttribute('x2', String(w/2 - 6));
      line.setAttribute('y1', String(lineY));
      line.setAttribute('y2', String(lineY));
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('opacity', '0.3');
      innerG.appendChild(line);
    }

    // LED dots (top-left)
    var dotColors = [color, '#4CAF50'];
    for (var di = 0; di < 2; di++) {
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(-w/2 + 12 + di * 10));
      dot.setAttribute('cy', String(-h/2 + 10));
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', dotColors[di]);
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

    // Body fill (rect behind ellipses) — Fix #19: drop-shadow
    var bodyFill = document.createElementNS(SVG_NS, 'rect');
    bodyFill.setAttribute('x', String(-rx));
    bodyFill.setAttribute('y', String(topY));
    bodyFill.setAttribute('width', String(rx * 2));
    bodyFill.setAttribute('height', String(bodyH));
    bodyFill.setAttribute('fill', fill);
    bodyFill.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
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
    path.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
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
    head.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
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

  // ── Concept: circle — Fix #2: auto-size radius to fit label ─────
  function renderConcept(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#00e5ff';
    var fill = createGradient(color, canvas);

    // Fix #2: compute radius from label length to avoid overflow
    var labelText = entity.label || '';
    var lines = wrapText(labelText, 14);
    var longestLine = 0;
    for (var li = 0; li < lines.length; li++) {
      if (lines[li].length > longestLine) longestLine = lines[li].length;
    }
    // Base radius is s*0.5, but grow if needed to fit text
    var labelFontSize = Math.min(16, s * 0.18);
    var textW = longestLine * labelFontSize * 0.58;
    var textH = lines.length * (labelFontSize * 1.3);
    var minR = Math.sqrt(textW * textW + textH * textH) * 0.65;
    var r = Math.max(s * 0.5, minR);

    var outer = document.createElementNS(SVG_NS, 'circle');
    outer.setAttribute('cx', '0');
    outer.setAttribute('cy', '0');
    outer.setAttribute('r', String(r));
    outer.setAttribute('fill', fill);
    outer.setAttribute('stroke', color);
    outer.setAttribute('stroke-width', '2');
    outer.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
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

    // Fix #2: multi-line tspan label inside the circle
    if (labelText) {
      if (lines.length <= 1) {
        var text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', String(labelFontSize * 0.35));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', color);
        text.setAttribute('font-size', String(labelFontSize));
        text.setAttribute('font-weight', '600');
        text.setAttribute('font-family', FONT_UI);
        text.setAttribute('letter-spacing', '0.02em');  // Fix #14
        text.textContent = labelText;
        innerG.appendChild(text);
      } else {
        createMultiLineText(innerG, lines, {
          x: 0,
          y: 0,
          lineHeight: labelFontSize * 1.3,
          textAnchor: 'middle',
          fill: color,
          fontSize: labelFontSize,
          fontWeight: '600',
          fontFamily: FONT_UI,
          letterSpacing: '0.02em'
        });
      }
    }

    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Label: clean text with pill background — Fix #3, #5, #7 ─────
  function renderLabel(entity, parentEl, delay) {
    // Fix #5: skip blank labels entirely
    if (!entity.label || !entity.label.trim()) return null;

    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = entity.color || '#FFFFFF';

    // Fix #7: visual weight hierarchy based on entity.size
    var fontSize, fontWeight;
    if (entity.size >= 2) {
      // Title labels
      fontSize = Math.min(Math.max(s * 0.30, 42), 48);
      fontWeight = '700';
    } else if (entity.size >= 1.4) {
      // Subtitle labels
      fontSize = Math.min(Math.max(s * 0.24, 28), 32);
      fontWeight = '600';
    } else {
      // Regular labels
      fontSize = Math.min(Math.max(s * 0.18, 16), 20);
      fontWeight = '500';
    }

    // Fix #3: allow up to 120 chars, multi-line wrapping for Label entities
    var maxCharsPerLine = 28;
    var label = entity.label || '';
    var lines = wrapText(label, maxCharsPerLine);

    // Pill background sized to content
    var lineHeight = fontSize * 1.35;
    var totalH = lines.length * lineHeight + 24;
    var maxLineLen = 0;
    for (var li = 0; li < lines.length; li++) {
      if (lines[li].length > maxLineLen) maxLineLen = lines[li].length;
    }
    var pw = Math.min(maxLineLen * fontSize * 0.58 + 40, 900);
    var pill = document.createElementNS(SVG_NS, 'rect');
    pill.setAttribute('x', String(-pw/2));
    pill.setAttribute('y', String(-totalH/2));
    pill.setAttribute('width', String(pw));
    pill.setAttribute('height', String(totalH));
    pill.setAttribute('rx', String(totalH / 2 > 30 ? 16 : totalH / 2));
    pill.setAttribute('fill', colorAlpha(color, 0.07));
    pill.setAttribute('stroke', 'none');
    innerG.appendChild(pill);

    if (lines.length <= 1) {
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(fontSize * 0.35));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(fontSize));
      text.setAttribute('font-weight', fontWeight);
      text.setAttribute('font-family', FONT_UI);
      text.setAttribute('letter-spacing', '0.02em');  // Fix #14
      text.textContent = truncLabel(label, 120);
      innerG.appendChild(text);
    } else {
      createMultiLineText(innerG, lines, {
        x: 0,
        y: 0,
        lineHeight: lineHeight,
        textAnchor: 'middle',
        fill: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
        fontFamily: FONT_UI,
        letterSpacing: '0.02em'
      });
    }

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

    // Background — Fix #19
    var bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(-w/2));
    bg.setAttribute('y', String(-h/2));
    bg.setAttribute('width', String(w));
    bg.setAttribute('height', String(h));
    bg.setAttribute('rx', '10');
    bg.setAttribute('fill', 'rgba(8, 8, 20, 0.8)');
    bg.setAttribute('stroke', colorAlpha(color, 0.25));
    bg.setAttribute('stroke-width', '1');
    bg.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
    innerG.appendChild(bg);

    // Title bar dots
    var dotColorsCode = ['#ff5f57', '#febc2e', '#28c840'];
    for (var di = 0; di < 3; di++) {
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(-w/2 + 16 + di * 14));
      dot.setAttribute('cy', String(-h/2 + 12));
      dot.setAttribute('r', '4');
      dot.setAttribute('fill', dotColorsCode[di]);
      dot.setAttribute('opacity', '0.8');
      innerG.appendChild(dot);
    }

    // Code lines
    for (var cli = 0; cli < lines.length; cli++) {
      var tl = document.createElementNS(SVG_NS, 'text');
      tl.setAttribute('x', String(-w/2 + 16));
      tl.setAttribute('y', String(-h/2 + 32 + cli * lineH));
      tl.setAttribute('fill', colorAlpha(color, 0.85));
      tl.setAttribute('font-size', '13');
      tl.setAttribute('font-family', FONT_MONO);
      tl.textContent = truncLabel(lines[cli], 48);
      innerG.appendChild(tl);
    }

    addLabel(innerG, entity, h/2 + 20, { maxChars: 40 });
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Generic: rounded rect/circle/diamond — Fix #6: label centered, no type badge
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
      circ.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
      innerG.appendChild(circ);
    } else if (shape === 'diamond') {
      var dd = s * 0.5;
      var poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', '0,' + (-dd) + ' ' + dd + ',0 0,' + dd + ' ' + (-dd) + ',0');
      poly.setAttribute('fill', fill);
      poly.setAttribute('stroke', color);
      poly.setAttribute('stroke-width', '1.5');
      poly.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
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
      hex.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
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
      rect.setAttribute('filter', 'url(#soft-shadow)');  // Fix #19
      innerG.appendChild(rect);
    }

    // Fix #6: remove type badge; place entity label centered inside shape instead
    if (entity.label) {
      var labelInside = document.createElementNS(SVG_NS, 'text');
      labelInside.setAttribute('x', '0');
      labelInside.setAttribute('y', String(s * 0.06));
      labelInside.setAttribute('text-anchor', 'middle');
      labelInside.setAttribute('dominant-baseline', 'middle');
      labelInside.setAttribute('fill', color);
      var insideFontSize = Math.max(12, Math.min(s * 0.16, 20));
      labelInside.setAttribute('font-size', String(insideFontSize));
      labelInside.setAttribute('font-weight', '600');      // Fix #14
      labelInside.setAttribute('font-family', FONT_UI);
      labelInside.setAttribute('letter-spacing', '0.02em'); // Fix #14
      labelInside.textContent = truncLabel(entity.label, 22);
      innerG.appendChild(labelInside);
    }

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
  // Arrow Renderer — bezier curves with glow — Fix #4, #23
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
    marker.setAttribute('markerWidth', '16');   // Fix #23: was 12
    marker.setAttribute('markerHeight', '10');  // Fix #23: was 8
    marker.setAttribute('refX', '13');
    marker.setAttribute('refY', '5');
    marker.setAttribute('orient', 'auto');

    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M 0 0.5 L 12 5 L 0 9.5 L 3 5 Z');
    p.setAttribute('fill', color);
    marker.appendChild(p);
    defs.appendChild(marker);
  }

  function renderArrowEntity(entity, parentEl, allEntities, delay) {
    var source = findEntity(allEntities, entity.sourceEntityId);
    var target = findEntity(allEntities, entity.targetEntityId);
    if (!source || !target) return null;

    // Fix #8: use margin-aware position helpers for arrow endpoints
    var x1 = entityCX(source);
    var y1 = entityCY(source);
    var x2 = entityCX(target);
    var y2 = entityCY(target);
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
    var nx = (dist > 0) ? (-dy / dist * curvature) : 0;
    var ny = (dist > 0) ? ( dx / dist * curvature) : 0;
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

    // Fix #23: subtle slow flow animation on all arrows
    line.setAttribute('stroke-dasharray', '8,0');
    var flowAnim = document.createElementNS(SVG_NS, 'animate');
    flowAnim.setAttribute('attributeName', 'stroke-dashoffset');
    flowAnim.setAttribute('from', '16');
    flowAnim.setAttribute('to', '0');
    flowAnim.setAttribute('dur', '3s');
    flowAnim.setAttribute('repeatCount', 'indefinite');
    line.appendChild(flowAnim);

    // DataFlow: animated dash (overrides flow anim) — Fix #23
    if (entity.type === 'DataFlow') {
      line.setAttribute('stroke-dasharray', '8,5');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('opacity', '0.5');
      // Replace animation
      line.removeChild(flowAnim);
      var anim = document.createElementNS(SVG_NS, 'animate');
      anim.setAttribute('attributeName', 'stroke-dashoffset');
      anim.setAttribute('from', '13');
      anim.setAttribute('to', '0');
      anim.setAttribute('dur', '0.8s');
      anim.setAttribute('repeatCount', 'indefinite');
      line.appendChild(anim);
    }

    ag.appendChild(line);

    // Fix #4: perpendicular offset for arrow midpoint label + semi-transparent pill background
    if (entity.label) {
      var lx = (x1 + 2*cx1 + x2) / 4;
      // Fix #4: was -10, now perpendicular offset -25 minimum
      var rawLY = (y1 + 2*cy1 + y2) / 4;
      var ly = rawLY - 25;

      // Pill background behind arrow label — Fix #4
      var labelText = truncLabel(entity.label, 24);
      var labelFontSize = 13;
      var pillW = labelText.length * labelFontSize * 0.56 + 20;
      var pillH = labelFontSize + 10;
      var lpill = document.createElementNS(SVG_NS, 'rect');
      lpill.setAttribute('x', String(lx - pillW/2));
      lpill.setAttribute('y', String(ly - pillH * 0.75));
      lpill.setAttribute('width', String(pillW));
      lpill.setAttribute('height', String(pillH));
      lpill.setAttribute('rx', String(pillH / 2));
      lpill.setAttribute('fill', 'rgba(0,0,0,0.55)');
      lpill.setAttribute('stroke', 'none');
      ag.appendChild(lpill);

      var lt = document.createElementNS(SVG_NS, 'text');
      lt.setAttribute('x', String(lx));
      lt.setAttribute('y', String(ly));
      lt.setAttribute('text-anchor', 'middle');
      lt.setAttribute('fill', color);
      lt.setAttribute('font-size', String(labelFontSize));
      lt.setAttribute('font-weight', '500');
      lt.setAttribute('font-family', FONT_UI);
      lt.setAttribute('opacity', '0.95');
      lt.textContent = labelText;
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
  // Frame Renderer — Fix #16: crossfade transition
  // ═══════════════════════════════════════════════════════════════════
  var ARROW_TYPES = {
    Arrow: 1, DataFlow: 1, BidirectArrow: 1, DottedArrow: 1, Transition: 1, Bus: 1
  };

  function renderFrame(frame) {
    if (!frame) return;

    // Fix #16: crossfade via GSAP if available
    if (typeof gsap !== 'undefined') {
      canvas.classList.add('frame-transitioning');
      gsap.to(entityLayer, { opacity: 0, duration: 0.2, onComplete: function() {
        _doRenderFrame(frame);
        gsap.to(entityLayer, { opacity: 1, duration: 0.3 });
        canvas.classList.remove('frame-transitioning');
      }});
    } else {
      _doRenderFrame(frame);
    }
  }

  function _doRenderFrame(frame) {
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
      dispatchEntity(nonArrows[j], entityLayer, j * 80);  // Fix: stagger pattern j*80
    }

    // Pass 2: Render connections (after entities, so positions exist)
    var arrowBaseDelay = nonArrows.length * 80 + 100;
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
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goPrev(); }
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
    getFrame:  function() { return currentFrame; },
  };

  console.log('[PRE] Player v3 initialized for session:', sessionId);
})();
`;
