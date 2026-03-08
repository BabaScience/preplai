/**
 * @preplai/mcp-server — Player Bootstrap JS (v4)
 *
 * Complete rewrite with all v3 fixes retained PLUS v4 improvements:
 * - BUG FIX 1: Double labels on Generic entities removed (interior label only)
 * - BUG FIX 2: Concept circle — interior label only (no addLabel call)
 * - BUG FIX 3: Cache/Queue circle interior text truncated to 16 chars, hexagon 18
 * - BUG FIX 4: Arrow label collision — offset further if too close to endpoints
 * - IMPROVEMENT 1: COLORS constant object
 * - IMPROVEMENT 2: Dot grid refinement (spacing 80, r 1.2, opacity 0.05)
 * - IMPROVEMENT 3: Entity gradient opacity boost (0.35/0.25/0.15)
 * - IMPROVEMENT 4: Frame navigation with clickable dot indicators
 * - IMPROVEMENT 5: Keyboard hint auto-hide after 4 seconds
 * - IMPROVEMENT 6: Ambient particles layer
 * - IMPROVEMENT 7: Better server entity interior (more opaque stripes + arrow icon)
 * - IMPROVEMENT 8: Scene transition stagger timing (60ms/50ms, faster)
 * - IMPROVEMENT 9: Narrator GSAP entrance animation
 * - BUG FIX 5: Content-based sizing — rect/circle/hexagon size to fit label text;
 *   min font size and min entity size so text+shape stay visible when scaled down.
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
  var LABEL_MAX_CHARS = 80;
  var MARGIN_X = 80;
  var MARGIN_Y = 60;
  var MIN_FONT_SIZE = 10;   // Minimum readable font size (px)
  var MIN_ENTITY_SIZE = 28; // Minimum base size so text+rect stay visible when scaled down
  var FONT_UI = "'Inter', sans-serif";
  var FONT_MONO = "'JetBrains Mono', monospace";

  // IMPROVEMENT 1: Color constants
  var COLORS = {
    bgDeep:        '#060610',
    bgBase:        '#0c0d14',
    bgElevated:    '#12131c',
    bgSurface:     '#1a1b26',
    textPrimary:   '#e8e8f0',
    textSecondary: '#a0a0b8',
    textTertiary:  '#6b6b80',
    accent:        '#C9A84C'
  };

  // Minimal theme palette (algorithm-viz style)
  var MINIMAL = {
    primary: '#6366f1',
    success: '#22c55e',
    error:   '#ef4444',
    warn:    '#f59e0b',
    muted:   '#1e293b',
    text:    '#94a3b8'
  };

  // Color palettes for entity defaults (?palette=)
  var PALETTES = {
    default: { server:'#4ECDC4', database:'#9B59B6', cloud:'#90CAF9', user:'#4DD0E1', concept:'#00e5ff', label:'#FFFFFF', codeblock:'#4ECDC4', generic:'#4FC3F7', particles:['#4ECDC4','#9B59B6','#F1C40F','#3498DB','#E67E22'] },
    ocean:   { server:'#3498DB', database:'#2ECC71', cloud:'#9B59B6', user:'#1ABC9C', concept:'#00bcd4', label:'#e2e8f0', codeblock:'#3498DB', generic:'#4ECDC4', particles:['#3498DB','#2ECC71','#1ABC9C','#00bcd4','#9B59B6'] },
    sunset:  { server:'#F39C12', database:'#E74C3C', cloud:'#9B59B6', user:'#F1C40F', concept:'#ff6b6b', label:'#fef3c7', codeblock:'#F39C12', generic:'#E67E22', particles:['#F39C12','#E74C3C','#F1C40F','#ff6b6b','#9B59B6'] },
    forest:  { server:'#2ECC71', database:'#1ABC9C', cloud:'#3498DB', user:'#16a085', concept:'#00e676', label:'#d1fae5', codeblock:'#2ECC71', generic:'#22c55e', particles:['#2ECC71','#1ABC9C','#16a085','#00e676','#3498DB'] },
    mono:    { server:'#64748b', database:'#475569', cloud:'#334155', user:'#94a3b8', concept:'#cbd5e1', label:'#f8fafc', codeblock:'#64748b', generic:'#94a3b8', particles:['#64748b','#475569','#94a3b8','#cbd5e1','#334155'] }
  };

  // Style: cinema (default) or minimal. Set from URL ?style= or script.style
  var urlStyle = (function() {
    var m = window.location.search.match(/[?&]style=([^&]+)/);
    return m && m[1] === 'minimal' ? 'minimal' : null;
  })();
  var renderStyle = urlStyle || 'cinema';

  // Palette: default, ocean, sunset, forest, mono. Set from URL ?palette=
  var urlPalette = (function() {
    var m = window.location.search.match(/[?&]palette=([^&]+)/);
    var p = m && m[1];
    return PALETTES[p] ? p : 'default';
  })();
  var palette = PALETTES[urlPalette] || PALETTES.default;

  function getEntityColor(entity, typeKey) {
    if (entity && entity.color) return entity.color;
    var t = typeKey || (entity && entity.type);
    if (t === 'Server' || t === 'Service' || t === 'Lambda') return palette.server;
    if (t === 'Database' || t === 'HashTable') return palette.database;
    if (t === 'Cloud') return palette.cloud;
    if (t === 'User') return palette.user;
    if (t === 'Concept') return palette.concept;
    if (t === 'Label' || t === 'Annotation' || t === 'Definition' || t === 'Callout' || t === 'Quote' || t === 'Badge' || t === 'H1' || t === 'H2' || t === 'H3') return palette.label;
    if (t === 'CodeBlock') return palette.codeblock;
    return palette.generic;
  }

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
  // Init: Dot grid — IMPROVEMENT 2: spacing 80, r 1.2, opacity 0.05
  // ═══════════════════════════════════════════════════════════════════
  function initDotGrid() {
    if (!dotGrid) return;
    var spacing = 80;
    for (var x = spacing; x < CW; x += spacing) {
      for (var y = spacing; y < CH; y += spacing) {
        var dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', String(x));
        dot.setAttribute('cy', String(y));
        dot.setAttribute('r', '1.2');
        dot.setAttribute('fill', 'rgba(255,255,255,0.05)');
        dotGrid.appendChild(dot);
      }
    }
  }
  initDotGrid();

  // IMPROVEMENT 6: Ambient floating particles (use palette)
  function initAmbientParticles() {
    var ambientLayer = document.getElementById('ambient-layer');
    if (!ambientLayer) return;
    var particleColors = palette.particles || ['#4ECDC4', '#9B59B6', '#F1C40F', '#3498DB', '#E67E22'];
    for (var pi = 0; pi < 12; pi++) {
      var pc = document.createElementNS(SVG_NS, 'circle');
      var px = 100 + Math.random() * (CW - 200);
      var py = 100 + Math.random() * (CH - 200);
      var pr = 2 + Math.random() * 4;
      pc.setAttribute('cx', String(px));
      pc.setAttribute('cy', String(py));
      pc.setAttribute('r', String(pr));
      pc.setAttribute('fill', particleColors[pi % particleColors.length]);
      pc.setAttribute('opacity', String(0.03 + Math.random() * 0.04));
      pc.classList.add('ambient-particle');
      pc.style.animationDelay = (Math.random() * 6) + 's';
      ambientLayer.appendChild(pc);
    }
  }
  initAmbientParticles();

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

    // soft-shadow filter
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
  // Utility: multi-line text wrapping
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

  // Utility: create multi-line SVG text with tspan elements
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

  // Utility: Parse size param → pixel base (matches @preplai/illustrations getSizeParam)
  // MIN_ENTITY_SIZE ensures text+rect stay readable when scaled down
  function sizeToPixels(s) {
    s = s || 1;
    return Math.min(Math.max(s * 50, MIN_ENTITY_SIZE), 120);
  }

  // Estimate text width in px (Inter ~0.58em per char). Used to size rects to content.
  function estimateTextWidth(text, fontSize) {
    if (!text) return 0;
    return String(text).length * fontSize * 0.58;
  }

  // Utility: hex color → rgba with alpha
  function colorAlpha(color, alpha) {
    if (!color) color = palette.generic;
    if (color.charAt(0) === '#' && color.length === 7) {
      var a = Math.round(alpha * 255).toString(16);
      if (a.length === 1) a = '0' + a;
      return color + a;
    }
    return color;
  }

  // Utility: create a linear gradient def and return its ID
  // IMPROVEMENT 3: boosted stop alphas 0.35/0.25/0.15
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

    // IMPROVEMENT 3: alpha 0.35 (was 0.30)
    var s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', colorAlpha(color, 0.35));
    lg.appendChild(s1);

    // IMPROVEMENT 3: alpha 0.25 (was 0.22)
    var s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '45%');
    s2.setAttribute('stop-color', colorAlpha(color, 0.25));
    lg.appendChild(s2);

    // IMPROVEMENT 3: alpha 0.15 (was 0.12)
    var s3 = document.createElementNS(SVG_NS, 'stop');
    s3.setAttribute('offset', '100%');
    s3.setAttribute('stop-color', colorAlpha(color, 0.15));
    lg.appendChild(s3);

    defs.appendChild(lg);
    return 'url(#' + id + ')';
  }

  // Minimal theme: flat fill instead of gradient
  function getFill(color, parentSvg) {
    if (renderStyle === 'minimal') return colorAlpha(color, 0.9);
    return createGradient(color, parentSvg);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Utility: compute entity canvas position with margin
  // ═══════════════════════════════════════════════════════════════════
  function entityCX(entity) {
    return MARGIN_X + ((entity.position.x / 100) * (CW - 2 * MARGIN_X));
  }
  function entityCY(entity) {
    return MARGIN_Y + ((entity.position.y / 100) * (CH - 2 * MARGIN_Y));
  }

  // Approximate radius from center to edge (for arrow shortening)
  function entityRadius(entity) {
    var s = sizeToPixels(entity.size);
    return s * 0.5;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Utility: type-specific default entrance animation
  // ═══════════════════════════════════════════════════════════════════
  function defaultEntrance(type) {
    switch (type) {
      case 'Server':
      case 'Service':
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
      case 'H1':
      case 'H2':
      case 'H3':
        return 'fadeIn';
      case 'CodeBlock':
        return 'slideInLeft';
      case 'Array':
      case 'Stack':
      case 'StepList':
      case 'BarChart':
      case 'Cycle':
      case 'ConfusionMatrix':
      case 'BigO':
      case 'BinaryTree':
      case 'BTree':
      case 'Circuit':
      case 'CoordinateSystem':
      case 'Graph2D':
      case 'DNSResolver':
      case 'Cache':
        return 'fadeInUp';
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

    var cx = entityCX(entity);
    var cy = entityCY(entity);
    outerG.setAttribute('transform', 'translate(' + cx + ', ' + cy + ')');

    if (entity.highlight) {
      outerG.setAttribute('filter', 'url(#entity-glow)');
      outerG.classList.add('entity-highlighted');
    }

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

    var entranceName = defaultEntrance(entity.type);
    if (entity.animation && entity.animation.entrance) {
      entranceName = entity.animation.entrance;
    }
    innerG.setAttribute('class', 'animate-element entrance-' + entranceName);

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
  // Label renderer: adds text below entity
  // ═══════════════════════════════════════════════════════════════════
  function addLabel(innerG, entity, yOffset, opts) {
    if (!entity.label) return;
    opts = opts || {};
    var color = opts.color || entity.color || (renderStyle === 'minimal' ? '#e2e8f0' : '#c8c8e0');
    var s = sizeToPixels(entity.size);
    var fontSize = opts.fontSize || Math.max(12, Math.min(s * 0.18, 22));
    var fontWeight = opts.fontWeight || '600';
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
    text.setAttribute('letter-spacing', '0.02em');
    text.textContent = label;
    innerG.appendChild(text);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Entity Renderers — type-specific SVG shapes
  // ═══════════════════════════════════════════════════════════════════

  // ── Server: rack with stripe lines + LED dots + arrow icon (IMPROVEMENT 7) ──
  function renderServer(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var w = s * 1.3;
    var h = s * 0.9;
    var fill = getFill(color, canvas);

    if (renderStyle === 'minimal') {
      var body = document.createElementNS(SVG_NS, 'rect');
      body.setAttribute('x', String(-w/2));
      body.setAttribute('y', String(-h/2));
      body.setAttribute('width', String(w));
      body.setAttribute('height', String(h));
      body.setAttribute('rx', '4');
      body.setAttribute('fill', fill);
      innerG.appendChild(body);
      addLabel(innerG, entity, h/2 + 22);
      parentEl.appendChild(g.outerG);
      return g.outerG;
    }

    // Body (cinema)
    var body = document.createElementNS(SVG_NS, 'rect');
    body.setAttribute('x', String(-w/2));
    body.setAttribute('y', String(-h/2));
    body.setAttribute('width', String(w));
    body.setAttribute('height', String(h));
    body.setAttribute('rx', '8');
    body.setAttribute('fill', fill);
    body.setAttribute('stroke', color);
    body.setAttribute('stroke-width', '1.5');
    body.setAttribute('filter', 'url(#soft-shadow)');
    innerG.appendChild(body);

    // IMPROVEMENT 7: rack stripe lines — more opaque (0.4 instead of 0.3)
    for (var i = -1; i <= 1; i++) {
      var lineY = i * (h / 4);
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(-w/2 + 6));
      line.setAttribute('x2', String(w/2 - 6));
      line.setAttribute('y1', String(lineY));
      line.setAttribute('y2', String(lineY));
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('opacity', '0.4');
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

    // IMPROVEMENT 7: directional arrow icon (server processing direction)
    var arrow = document.createElementNS(SVG_NS, 'path');
    var arrowScale = w * 0.2;
    arrow.setAttribute('d',
      'M' + (-arrowScale*0.5) + ',0 L' + (arrowScale*0.5) + ',0 M' +
      (arrowScale*0.25) + ',' + (-arrowScale*0.25) + ' L' + (arrowScale*0.5) + ',0 L' +
      (arrowScale*0.25) + ',' + (arrowScale*0.25)
    );
    arrow.setAttribute('stroke', color);
    arrow.setAttribute('stroke-width', '2');
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('opacity', '0.5');
    arrow.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(arrow);

    addLabel(innerG, entity, h/2 + 22);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Database: cylinder (top ellipse + body + bottom ellipse) ─────
  function renderDatabase(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);

    if (renderStyle === 'minimal') {
      var w = s * 1.2;
      var h = s * 0.9;
      var body = document.createElementNS(SVG_NS, 'rect');
      body.setAttribute('x', String(-w/2));
      body.setAttribute('y', String(-h/2));
      body.setAttribute('width', String(w));
      body.setAttribute('height', String(h));
      body.setAttribute('rx', '4');
      body.setAttribute('fill', fill);
      innerG.appendChild(body);
      addLabel(innerG, entity, h/2 + 22);
      parentEl.appendChild(g.outerG);
      return g.outerG;
    }

    var rx = s * 0.5;
    var ry = s * 0.15;
    var bodyH = s * 0.55;
    var topY = -s * 0.35;
    var botY = topY + bodyH;

    // Body fill (rect behind ellipses)
    var bodyFill = document.createElementNS(SVG_NS, 'rect');
    bodyFill.setAttribute('x', String(-rx));
    bodyFill.setAttribute('y', String(topY));
    bodyFill.setAttribute('width', String(rx * 2));
    bodyFill.setAttribute('height', String(bodyH));
    bodyFill.setAttribute('fill', fill);
    bodyFill.setAttribute('filter', 'url(#soft-shadow)');
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

  // ── Cloud: rounded blob shape ────────────────────────────────────
  function renderCloud(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);

    if (renderStyle === 'minimal') {
      var w = s * 1.3;
      var h = s * 0.9;
      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-w/2));
      rect.setAttribute('y', String(-h/2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', fill);
      innerG.appendChild(rect);
      addLabel(innerG, entity, h/2 + 22);
      parentEl.appendChild(g.outerG);
      return g.outerG;
    }

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
    path.setAttribute('filter', 'url(#soft-shadow)');
    innerG.appendChild(path);

    addLabel(innerG, entity, s * 0.45 + 20);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── User: head circle + body arc ─────────────────────────────────
  function renderUser(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var r = s * 0.2;

    if (renderStyle === 'minimal') {
      var circ = document.createElementNS(SVG_NS, 'circle');
      circ.setAttribute('cx', '0');
      circ.setAttribute('cy', '0');
      circ.setAttribute('r', String(s * 0.45));
      circ.setAttribute('fill', fill);
      innerG.appendChild(circ);
      addLabel(innerG, entity, s * 0.45 + 22);
      parentEl.appendChild(g.outerG);
      return g.outerG;
    }

    // Head
    var head = document.createElementNS(SVG_NS, 'circle');
    head.setAttribute('cx', '0');
    head.setAttribute('cy', String(-s*0.2));
    head.setAttribute('r', String(r));
    head.setAttribute('fill', fill);
    head.setAttribute('stroke', color);
    head.setAttribute('stroke-width', '1.5');
    head.setAttribute('filter', 'url(#soft-shadow)');
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

  // ── Concept: circle with interior label ──────────────────────────
  // BUG FIX 2: interior label only — no addLabel() call
  function renderConcept(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);

    if (renderStyle === 'minimal') {
      var labelTextMin = entity.label || '';
      var fontSizeMin = Math.max(MIN_FONT_SIZE, Math.min(14, s * 0.22));
      var textWMin = estimateTextWidth(truncLabel(labelTextMin, 16), fontSizeMin);
      var r = Math.max(s * 0.5, (textWMin + 16) / 2);
      var circ = document.createElementNS(SVG_NS, 'circle');
      circ.setAttribute('cx', '0');
      circ.setAttribute('cy', '0');
      circ.setAttribute('r', String(r));
      circ.setAttribute('fill', fill);
      innerG.appendChild(circ);
      if (entity.label) {
        var text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '5');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', String(fontSizeMin));
        text.setAttribute('font-weight', '600');
        text.setAttribute('font-family', FONT_UI);
        text.textContent = truncLabel(entity.label, 16);
        innerG.appendChild(text);
      }
      parentEl.appendChild(g.outerG);
      return g.outerG;
    }

    // Compute radius from label length to avoid overflow; font scales with size
    var labelText = entity.label || '';
    var lines = wrapText(labelText, 14);
    var longestLine = 0;
    for (var li = 0; li < lines.length; li++) {
      if (lines[li].length > longestLine) longestLine = lines[li].length;
    }
    var labelFontSize = Math.max(MIN_FONT_SIZE, Math.min(16, s * 0.22));
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
    outer.setAttribute('filter', 'url(#soft-shadow)');
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

    // Multi-line tspan label inside the circle
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
        text.setAttribute('letter-spacing', '0.02em');
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

    // BUG FIX 2: NO addLabel() call here — interior label is sufficient
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Label: clean text with pill background ───────────────────────
  function renderLabel(entity, parentEl, delay) {
    var content = entity.label || entity.textContent || '';
    if (!content || !String(content).trim()) return null;

    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);

    var fontSize, fontWeight;
    if (entity.size >= 2) {
      fontSize = Math.min(Math.max(s * 0.30, 42), 48);
      fontWeight = '700';
    } else if (entity.size >= 1.4) {
      fontSize = Math.min(Math.max(s * 0.24, 28), 32);
      fontWeight = '600';
    } else {
      fontSize = Math.max(MIN_FONT_SIZE, Math.min(Math.max(s * 0.22, 16), 20));
      fontWeight = '500';
    }

    var maxCharsPerLine = 28;
    var label = entity.label || entity.textContent || '';
    var lines = wrapText(label, maxCharsPerLine);

    var lineHeight = fontSize * 1.35;
    var totalH = Math.max(lines.length * lineHeight + 24, fontSize * 2 + 16);
    var maxLineLen = 0;
    for (var li = 0; li < lines.length; li++) {
      if (lines[li].length > maxLineLen) maxLineLen = lines[li].length;
    }
    var textW = maxLineLen * fontSize * 0.58;
    var pw = Math.min(Math.max(textW + 48, 80), 900);
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
      text.setAttribute('letter-spacing', '0.02em');
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

  // ── H1, H2, H3: section headings with typographic hierarchy ─────
  function renderHeading(entity, parentEl, delay) {
    var meta = entity.metadata || {};
    var content = meta.label || entity.label || entity.type || '';
    if (!content || !String(content).trim()) return null;

    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);

    var fontSize, fontWeight;
    if (entity.type === 'H1') {
      fontSize = Math.min(Math.max(s * 0.28, 36), 48);
      fontWeight = '700';
    } else if (entity.type === 'H2') {
      fontSize = Math.min(Math.max(s * 0.20, 24), 32);
      fontWeight = '600';
    } else {
      fontSize = Math.min(Math.max(s * 0.16, 18), 24);
      fontWeight = '600';
    }

    var text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', fontWeight);
    text.setAttribute('font-family', FONT_UI);
    text.setAttribute('letter-spacing', '0.02em');
    text.textContent = truncLabel(content, 80);
    innerG.appendChild(text);

    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── CodeBlock: dark rect with monospace text ─────────────────────
  function renderCodeBlock(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var code = entity.textContent || entity.label || 'code';
    var lines = code.split('\\n').slice(0, 8);
    var lineH = 16;
    var w = Math.min(Math.max(s * 2.5, 160), 500);
    var h = lines.length * lineH + 28;

    if (renderStyle === 'minimal') {
      var bg = document.createElementNS(SVG_NS, 'rect');
      bg.setAttribute('x', String(-w/2));
      bg.setAttribute('y', String(-h/2));
      bg.setAttribute('width', String(w));
      bg.setAttribute('height', String(h));
      bg.setAttribute('rx', '4');
      bg.setAttribute('fill', '#1e293b');
      bg.setAttribute('stroke', '#334155');
      bg.setAttribute('stroke-width', '1');
      innerG.appendChild(bg);
      for (var cli = 0; cli < lines.length; cli++) {
        var tl = document.createElementNS(SVG_NS, 'text');
        tl.setAttribute('x', String(-w/2 + 12));
        tl.setAttribute('y', String(-h/2 + 24 + cli * lineH));
        tl.setAttribute('fill', color);
        tl.setAttribute('font-size', '13');
        tl.setAttribute('font-family', FONT_MONO);
        tl.textContent = truncLabel(lines[cli], 48);
        innerG.appendChild(tl);
      }
      parentEl.appendChild(g.outerG);
      return g.outerG;
    }

    var bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(-w/2));
    bg.setAttribute('y', String(-h/2));
    bg.setAttribute('width', String(w));
    bg.setAttribute('height', String(h));
    bg.setAttribute('rx', '10');
    bg.setAttribute('fill', 'rgba(8, 8, 20, 0.8)');
    bg.setAttribute('stroke', colorAlpha(color, 0.25));
    bg.setAttribute('stroke-width', '1');
    bg.setAttribute('filter', 'url(#soft-shadow)');
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

  // ── Array: row of cells with indices and values ───────────────────
  function parseArrayCells(meta) {
    if (!meta) return [{ value: '1', enabled: true, selected: false }, { value: '2', enabled: true, selected: false }, { value: '3', enabled: true, selected: false }];
    var rawCells = meta.cells;
    if (Array.isArray(rawCells)) {
      return rawCells.slice(0, 8).map(function(c) {
        if (typeof c === 'object' && c !== null && 'value' in c) {
          return { value: String(c.value), enabled: c.enabled !== false, selected: c.selected === true };
        }
        return { value: String(c), enabled: true, selected: false };
      });
    }
    var values = meta.values || meta.cells || [1, 2, 3, 4, 5];
    values = Array.isArray(values) ? values.slice(0, 8) : [1, 2, 3, 4, 5];
    var disabledSet = {};
    var selectedSet = {};
    var di = meta.disabledIndexes || [];
    var si = meta.selectedIndexes || [];
    for (var i = 0; i < di.length; i++) disabledSet[di[i]] = true;
    for (var j = 0; j < si.length; j++) selectedSet[si[j]] = true;
    return values.map(function(val, idx) {
      return { value: String(val), enabled: !disabledSet[idx], selected: !!selectedSet[idx] };
    });
  }

  function renderArray(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var meta = entity.metadata || {};
    var cells = parseArrayCells(meta);
    var scale = Math.max(0.5, s / 110);
    var cellW = Math.max(24, 28 * scale);
    var cellH = Math.max(20, 24 * scale);
    var totalW = cells.length * cellW;
    var startX = -totalW / 2 + cellW / 2;

    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var x = startX + i * cellW;
      var pad = 2 * scale;
      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x - cellW / 2 + pad));
      rect.setAttribute('y', String(-cellH / 2));
      rect.setAttribute('width', String(cellW - pad * 2));
      rect.setAttribute('height', String(cellH));
      rect.setAttribute('rx', String(Math.max(1, 2 * scale)));
      rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', String(cell.selected ? 3 * scale : 1.5 * scale));
      if (!cell.enabled) {
        rect.setAttribute('opacity', '0.4');
        rect.setAttribute('stroke-dasharray', '3,3');
      }
      innerG.appendChild(rect);

      var idxText = document.createElementNS(SVG_NS, 'text');
      idxText.setAttribute('x', String(x));
      idxText.setAttribute('y', String(-cellH / 2 - 6));
      idxText.setAttribute('text-anchor', 'middle');
      idxText.setAttribute('fill', colorAlpha(color, 0.6));
      idxText.setAttribute('font-size', String(Math.max(MIN_FONT_SIZE, Math.round(9 * scale))));
      idxText.setAttribute('font-family', FONT_MONO);
      idxText.textContent = String(i);
      innerG.appendChild(idxText);

      var valText = document.createElementNS(SVG_NS, 'text');
      valText.setAttribute('x', String(x));
      valText.setAttribute('y', '4');
      valText.setAttribute('text-anchor', 'middle');
      valText.setAttribute('fill', color);
      valText.setAttribute('font-size', String(Math.max(MIN_FONT_SIZE, Math.round(11 * scale))));
      valText.setAttribute('font-weight', '600');
      valText.setAttribute('font-family', FONT_MONO);
      valText.textContent = String(cell.value);
      innerG.appendChild(valText);
    }

    addLabel(innerG, entity, cellH / 2 + 18 * scale);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Stack: vertical layers (OSI, tech stack) ─────────────────────
  function renderStack(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var meta = entity.metadata || {};
    var layersData = meta.layers;
    var layers = Array.isArray(layersData) ? layersData.slice(0, 6) : [
      { label: 'Application' }, { label: 'Transport' }, { label: 'Network' },
      { label: 'Link' }, { label: 'Physical' }
    ];
    var blockW = s * 1.8;
    var blockH = 28;
    var gap = 6;
    var totalH = layers.length * blockH + (layers.length - 1) * gap;
    var startY = -totalH / 2 + blockH / 2;

    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var lbl = (typeof layer === 'object' && layer && layer.label) ? layer.label : String(layer);
      var y = startY + i * (blockH + gap);
      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-blockW / 2));
      rect.setAttribute('y', String(y - blockH / 2));
      rect.setAttribute('width', String(blockW));
      rect.setAttribute('height', String(blockH));
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', '1.5');
      innerG.appendChild(rect);
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(y + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', FONT_UI);
      text.textContent = truncLabel(lbl, 24);
      innerG.appendChild(text);
    }
    addLabel(innerG, entity, totalH / 2 + 20);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── StepList: numbered steps with connector ─────────────────────
  function renderStepList(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var meta = entity.metadata || {};
    var steps = meta.steps;
    if (!Array.isArray(steps)) steps = entity.textContent ? entity.textContent.split(/\\\\n|\\r?\\n/) : ['Step 1', 'Step 2', 'Step 3'];
    steps = steps.slice(0, 5);
    var currentStep = typeof meta.currentStep === 'number' ? meta.currentStep : -1;
    var checkmarks = meta.checkmarks === true;
    var stepH = 28;
    var numR = 10;
    var startY = -((steps.length - 1) * stepH) / 2;

    for (var i = 0; i < steps.length; i++) {
      var y = startY + i * stepH;
      var isCompleted = checkmarks && currentStep >= 0 && i < currentStep;
      var isCurrent = currentStep >= 0 && i === currentStep;

      if (i > 0) {
        var prevY = startY + (i - 1) * stepH;
        var conn = document.createElementNS(SVG_NS, 'line');
        conn.setAttribute('x1', String(-s * 0.6));
        conn.setAttribute('y1', String(prevY + numR));
        conn.setAttribute('x2', String(-s * 0.6));
        conn.setAttribute('y2', String(y - numR));
        conn.setAttribute('stroke', color);
        conn.setAttribute('stroke-width', '1.5');
        conn.setAttribute('opacity', '0.5');
        innerG.appendChild(conn);
      }

      var circ = document.createElementNS(SVG_NS, 'circle');
      circ.setAttribute('cx', String(-s * 0.6));
      circ.setAttribute('cy', String(y));
      circ.setAttribute('r', String(numR));
      circ.setAttribute('fill', isCompleted ? color : fill);
      circ.setAttribute('stroke', color);
      circ.setAttribute('stroke-width', isCurrent ? '3' : '2');
      circ.setAttribute('opacity', isCompleted ? '0.6' : '1');
      innerG.appendChild(circ);

      if (isCompleted) {
        var cx = -s * 0.6;
        var check = document.createElementNS(SVG_NS, 'path');
        check.setAttribute('d', 'M ' + (cx - 5) + ' ' + (y + 4) + ' L ' + (cx - 2) + ' ' + y + ' L ' + (cx + 6) + ' ' + (y - 4));
        check.setAttribute('fill', 'none');
        check.setAttribute('stroke', 'white');
        check.setAttribute('stroke-width', '2');
        check.setAttribute('stroke-linecap', 'round');
        check.setAttribute('stroke-linejoin', 'round');
        innerG.appendChild(check);
      } else {
        var num = document.createElementNS(SVG_NS, 'text');
        num.setAttribute('x', String(-s * 0.6));
        num.setAttribute('y', String(y + 4));
        num.setAttribute('text-anchor', 'middle');
        num.setAttribute('fill', isCurrent ? color : 'white');
        num.setAttribute('font-size', '11');
        num.setAttribute('font-weight', '600');
        num.setAttribute('font-family', FONT_UI);
        num.textContent = String(i + 1);
        innerG.appendChild(num);
      }

      var stepText = document.createElementNS(SVG_NS, 'text');
      stepText.setAttribute('x', String(-s * 0.6 + numR + 14));
      stepText.setAttribute('y', String(y + 4));
      stepText.setAttribute('fill', color);
      stepText.setAttribute('font-size', '13');
      stepText.setAttribute('font-family', FONT_UI);
      stepText.textContent = truncLabel(String(steps[i]), 32);
      innerG.appendChild(stepText);
    }
    if (entity.label) {
      var title = document.createElementNS(SVG_NS, 'text');
      title.setAttribute('x', '0');
      title.setAttribute('y', String(startY - 20));
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('fill', color);
      title.setAttribute('font-size', '14');
      title.setAttribute('font-weight', '600');
      title.setAttribute('font-family', FONT_UI);
      title.textContent = truncLabel(entity.label, 40);
      innerG.appendChild(title);
    }
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── BarChart: vertical bars ──────────────────────────────────────
  function parseBars(meta, defaultColor) {
    var raw = meta.bars;
    if (!Array.isArray(raw) || raw.length === 0) {
      return [{ label: 'Jan', value: 10 }, { label: 'Feb', value: 25 }, { label: 'Mar', value: 15 }, { label: 'Apr', value: 30 }, { label: 'May', value: 22 }];
    }
    return raw.slice(0, 12).map(function(b) {
      return { label: String(b && b.label != null ? b.label : '?'), value: Number(b && b.value != null ? b.value : 0) || 0, color: (b && b.color) || defaultColor };
    });
  }

  function renderBarChart(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var meta = entity.metadata || {};
    var bars = parseBars(meta, color);
    var horizontal = meta.horizontal === true;
    var maxVal = 1;
    for (var bi = 0; bi < bars.length; bi++) if (bars[bi].value > maxVal) maxVal = bars[bi].value;
    var padLeft = 36;
    var padRight = 16;
    var padTop = 12;
    var padBottom = 28;
    var chartW = s * 3.2 - padLeft - padRight;
    var chartH = s * 2.2 - padTop - padBottom;
    var n = bars.length;
    var barGap = 6;

    if (horizontal) {
      var labelW = 40;
      var barAreaW = chartW - labelW - 24;
      var barH = Math.max(12, (chartH - (n - 1) * barGap) / n);
      for (var i = 0; i < bars.length; i++) {
        var bar = bars[i];
        var y = -chartH / 2 + padTop + i * (barH + barGap) + barH / 2;
        var width = (bar.value / maxVal) * barAreaW;
        var x = -chartW / 2 + padLeft + labelW;
        var rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y - barH / 2));
        rect.setAttribute('width', String(Math.max(width, 2)));
        rect.setAttribute('height', String(barH));
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', bar.color || color);
        rect.setAttribute('stroke-width', '1');
        innerG.appendChild(rect);
        var lbl = document.createElementNS(SVG_NS, 'text');
        lbl.setAttribute('x', String(x - 4));
        lbl.setAttribute('y', String(y + 4));
        lbl.setAttribute('text-anchor', 'end');
        lbl.setAttribute('fill', colorAlpha(color, 0.9));
        lbl.setAttribute('font-size', '10');
        lbl.textContent = truncLabel(bar.label, 12);
        innerG.appendChild(lbl);
      }
    } else {
      var barW = Math.max(8, (chartW - (n - 1) * barGap) / n);
      var barAreaH = chartH - 16;
      for (var i = 0; i < bars.length; i++) {
        var bar = bars[i];
        var x = -chartW / 2 + padLeft + i * (barW + barGap) + barW / 2;
        var height = (bar.value / maxVal) * barAreaH;
        var yBase = chartH / 2 - padBottom;
        var rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', String(x - barW / 2));
        rect.setAttribute('y', String(yBase - height));
        rect.setAttribute('width', String(barW));
        rect.setAttribute('height', String(Math.max(height, 2)));
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', bar.color || color);
        rect.setAttribute('stroke-width', '1');
        innerG.appendChild(rect);
        var lbl = document.createElementNS(SVG_NS, 'text');
        lbl.setAttribute('x', String(x));
        lbl.setAttribute('y', String(yBase + 14));
        lbl.setAttribute('text-anchor', 'middle');
        lbl.setAttribute('fill', colorAlpha(color, 0.9));
        lbl.setAttribute('font-size', '10');
        lbl.textContent = truncLabel(bar.label, 10);
        innerG.appendChild(lbl);
      }
    }
    addLabel(innerG, entity, chartH / 2 - 4);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Cycle: dashed circle with label inside ────────────────────────
  function renderCycle(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var r = s / 2;
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var circ = document.createElementNS(SVG_NS, 'circle');
    circ.setAttribute('cx', '0');
    circ.setAttribute('cy', '0');
    circ.setAttribute('r', String(r));
    circ.setAttribute('fill', fill);
    circ.setAttribute('stroke', color);
    circ.setAttribute('stroke-width', '2');
    circ.setAttribute('stroke-dasharray', '6,6');
    innerG.appendChild(circ);
    if (entity.label) {
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '0');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(Math.min(14, Math.max(10, s / 4))));
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', FONT_UI);
      text.textContent = truncLabel(entity.label, 16);
      innerG.appendChild(text);
    }
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── ConfusionMatrix: 2x2 or NxN grid ─────────────────────────────
  function renderConfusionMatrix(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var scale = s / 110;
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var meta = entity.metadata || {};
    var matrixData = meta.matrix;
    var matrix = Array.isArray(matrixData) && matrixData.length > 0 ? matrixData : [[45, 5], [8, 42]];
    var rowLabels = meta.rowLabels || ['Actual -', 'Actual +'];
    var colLabels = meta.colLabels || ['Pred -', 'Pred +'];
    var rows = matrix.length;
    var cols = matrix[0] ? matrix[0].length : 2;
    var cellW = Math.round(40 * scale);
    var cellH = Math.round(28 * scale);
    var gap = 6;
    var hasHeaders = (rowLabels && rowLabels.length) || (colLabels && colLabels.length);
    var layoutCols = hasHeaders ? cols + 1 : cols;
    var layoutRows = hasHeaders ? rows + 1 : rows;
    var totalW = layoutCols * cellW + (layoutCols - 1) * gap;
    var totalH = layoutRows * cellH + (layoutRows - 1) * gap;
    var startX = -totalW / 2 + cellW / 2 + gap / 2;
    var startY = -totalH / 2 + cellH / 2 + gap / 2;
    var cmColors = { tp: '#22c55e', tn: '#14b8a6', fp: '#f97316', fn: '#ef4444' };

    for (var r = 0; r < layoutRows; r++) {
      for (var c = 0; c < layoutCols; c++) {
        var x = startX + c * (cellW + gap);
        var y = startY + r * (cellH + gap);
        var content = '';
        var cellColor = color;
        if (hasHeaders && (r === 0 || c === 0)) {
          content = r === 0 ? (colLabels[c - 1] || '') : (rowLabels[r - 1] || '');
        } else {
          var mr = hasHeaders ? r - 1 : r;
          var mc = hasHeaders ? c - 1 : c;
          if (matrix[mr] && matrix[mr][mc] != null) content = String(matrix[mr][mc]);
          if (rows === 2 && cols === 2 && hasHeaders) {
            if (r === 1 && c === 1) cellColor = cmColors.tn;
            else if (r === 1 && c === 2) cellColor = cmColors.fp;
            else if (r === 2 && c === 1) cellColor = cmColors.fn;
            else if (r === 2 && c === 2) cellColor = cmColors.tp;
          }
        }
        var rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', String(x - cellW / 2));
        rect.setAttribute('y', String(y - cellH / 2));
        rect.setAttribute('width', String(cellW - gap));
        rect.setAttribute('height', String(cellH - gap));
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', cellColor === color ? fill : colorAlpha(cellColor, 0.3));
        rect.setAttribute('stroke', cellColor);
        rect.setAttribute('stroke-width', '1');
        innerG.appendChild(rect);
        var text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(x));
        text.setAttribute('y', String(y + 4));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', cellColor);
        text.setAttribute('font-size', String(Math.round(10 * scale)));
        text.setAttribute('font-weight', '600');
        text.textContent = truncLabel(content, 8);
        innerG.appendChild(text);
      }
    }
    addLabel(innerG, entity, totalH / 2 + 16);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── BigO: complexity curves ───────────────────────────────────────
  function evalBigOCurve(name, n) {
    if (n <= 0) return 0;
    if (name === 'O(1)') return 1;
    if (name === 'O(log n)') return Math.log2(n + 1);
    if (name === 'O(n)') return n;
    if (name === 'O(n log n)') return n * Math.log2(n + 1);
    if (name === 'O(n²)') return n * n;
    if (name === 'O(2^n)') return Math.pow(2, Math.min(n, 8));
    return 0;
  }

  function renderBigO(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var totalW = s * 4;
    var totalH = s * 3;
    var color = getEntityColor(entity);
    var meta = entity.metadata || {};
    var curves = meta.curves || ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
    var domain = meta.domain || [0, 10];
    var domainMin = domain[0] != null ? domain[0] : 0;
    var domainMax = domain[1] != null ? domain[1] : 10;
    var pad = 30;
    var chartW = totalW - pad * 2;
    var chartH = totalH - pad * 2;
    var chartLeft = -totalW / 2 + pad;
    var chartTop = -totalH / 2 + pad;

    var maxY = 1;
    var steps = 40;
    for (var ci = 0; ci < curves.length; ci++) {
      for (var si = 0; si <= steps; si++) {
        var n = domainMin + (domainMax - domainMin) * si / steps;
        var y = evalBigOCurve(curves[ci], n);
        if (isFinite(y) && y > maxY) maxY = y;
      }
    }
    maxY = maxY * 1.05;

    var bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(-totalW / 2));
    bg.setAttribute('y', String(-totalH / 2));
    bg.setAttribute('width', String(totalW));
    bg.setAttribute('height', String(totalH));
    bg.setAttribute('rx', '8');
    bg.setAttribute('fill', colorAlpha(color, 0.15));
    bg.setAttribute('stroke', color);
    bg.setAttribute('stroke-width', '1');
    innerG.appendChild(bg);

    var curveColors = { 'O(1)': '#4ade80', 'O(log n)': '#22d3ee', 'O(n)': '#60a5fa', 'O(n log n)': '#a78bfa', 'O(n²)': '#f472b6', 'O(2^n)': '#f87171' };
    for (var ci = 0; ci < curves.length; ci++) {
      var curveName = curves[ci];
      var curveColor = curveColors[curveName] || color;
      var parts = [];
      for (var si = 0; si <= steps; si++) {
        var n = domainMin + (domainMax - domainMin) * si / steps;
        var y = evalBigOCurve(curveName, n);
        if (!isFinite(y)) continue;
        var mx = chartLeft + ((n - domainMin) / (domainMax - domainMin || 1)) * chartW;
        var my = chartTop + chartH - ((y - 0) / (maxY - 0)) * chartH;
        parts.push((parts.length === 0 ? 'M' : 'L') + mx.toFixed(1) + ',' + my.toFixed(1));
      }
      if (parts.length > 0) {
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', parts.join(' '));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', curveColor);
        path.setAttribute('stroke-width', '2.5');
        innerG.appendChild(path);
      }
    }

    var legendY = -totalH / 2 + 14;
    var legendSpacing = totalW / (curves.length + 1);
    for (var li = 0; li < curves.length; li++) {
      var lx = -totalW / 2 + legendSpacing * (li + 1);
      var lineColor = curveColors[curves[li]] || color;
      var legLine = document.createElementNS(SVG_NS, 'line');
      legLine.setAttribute('x1', String(lx - 12));
      legLine.setAttribute('y1', String(legendY));
      legLine.setAttribute('x2', String(lx - 4));
      legLine.setAttribute('y2', String(legendY));
      legLine.setAttribute('stroke', lineColor);
      legLine.setAttribute('stroke-width', '2.5');
      innerG.appendChild(legLine);
      var legText = document.createElementNS(SVG_NS, 'text');
      legText.setAttribute('x', String(lx));
      legText.setAttribute('y', String(legendY + 4));
      legText.setAttribute('text-anchor', 'start');
      legText.setAttribute('fill', lineColor);
      legText.setAttribute('font-size', '10');
      legText.textContent = curves[li];
      innerG.appendChild(legText);
    }
    addLabel(innerG, entity, totalH / 2 + 12);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── BinaryTree: simplified tree with nodes ───────────────────────
  function parseBinaryTreeNodes(meta) {
    var nodesArr = meta.nodes;
    if (Array.isArray(nodesArr) && nodesArr.length > 0) {
      return nodesArr.slice(0, 15).map(function(raw) {
        if (raw == null) return null;
        if (typeof raw === 'object' && raw !== null && 'value' in raw) return { value: String(raw.value), enabled: raw.enabled !== false, selected: raw.selected === true };
        return { value: String(raw), enabled: true, selected: false };
      });
    }
    var tree = meta.tree;
    if (tree && typeof tree === 'object') {
      var flat = [];
      function collect(node, idx) {
        if (!node || flat.length >= 15) return;
        flat[idx] = { value: String(node.value != null ? node.value : '?'), enabled: true, selected: false };
        if (node.left) collect(node.left, 2 * idx + 1);
        if (node.right) collect(node.right, 2 * idx + 2);
      }
      collect(tree, 0);
      return flat.filter(Boolean);
    }
    return [{ value: '5' }, { value: '3' }, { value: '8' }, { value: '1' }, { value: '4' }, { value: '6' }, { value: '9' }];
  }

  function renderBinaryTree(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var meta = entity.metadata || {};
    var nodes = parseBinaryTreeNodes(meta);
    var disabledSet = {};
    var selectedSet = {};
    var di = meta.disabledIndexes || [];
    var si = meta.selectedIndexes || [];
    for (var i = 0; i < di.length; i++) disabledSet[di[i]] = true;
    for (var j = 0; j < si.length; j++) selectedSet[si[j]] = true;

    var nodeR = 9 * (s / 110);
    var dx = s * 0.85;
    var dy = s * 0.55;
    var positions = [];
    for (var idx = 0; idx < nodes.length; idx++) {
      if (!nodes[idx]) continue;
      var level = Math.floor(Math.log2(idx + 1));
      var posInLevel = idx - (1 << level) + 1;
      var totalInLevel = 1 << level;
      var x = (posInLevel - (totalInLevel - 1) / 2) * dx;
      var y = level * dy;
      positions[idx] = { x: x, y: y, value: nodes[idx].value, enabled: !disabledSet[idx], selected: !!selectedSet[idx] };
    }

    for (var idx = 0; idx < positions.length; idx++) {
      var pos = positions[idx];
      if (!pos) continue;
      var parentIdx = Math.floor((idx - 1) / 2);
      if (parentIdx >= 0 && positions[parentIdx]) {
        var line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', String(positions[parentIdx].x));
        line.setAttribute('y1', String(positions[parentIdx].y));
        line.setAttribute('x2', String(pos.x));
        line.setAttribute('y2', String(pos.y));
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.7');
        innerG.appendChild(line);
      }
    }
    for (var idx = 0; idx < positions.length; idx++) {
      var pos = positions[idx];
      if (!pos) continue;
      var circ = document.createElementNS(SVG_NS, 'circle');
      circ.setAttribute('cx', String(pos.x));
      circ.setAttribute('cy', String(pos.y));
      circ.setAttribute('r', String(nodeR));
      circ.setAttribute('fill', fill);
      circ.setAttribute('stroke', color);
      circ.setAttribute('stroke-width', pos.selected ? '3' : '1.5');
      if (!pos.enabled) circ.setAttribute('opacity', '0.4');
      innerG.appendChild(circ);
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(pos.x));
      text.setAttribute('y', String(pos.y + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(Math.round(10 * (s / 110))));
      text.setAttribute('font-weight', '600');
      text.textContent = truncLabel(String(pos.value), 4);
      innerG.appendChild(text);
    }
    addLabel(innerG, entity, (Math.ceil(Math.log2(positions.length + 1)) - 1) * dy + 24);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Circuit: simplified circuit diagram ───────────────────────────
  function renderCircuit(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var meta = entity.metadata || {};
    var components = meta.components || [{ type: 'battery' }, { type: 'resistor' }, { type: 'bulb' }];
    components = components.slice(0, 5);
    var spacing = 50;
    var totalW = (components.length - 1) * spacing;
    var startX = -totalW / 2;

    for (var i = 0; i < components.length; i++) {
      var x = startX + i * spacing;
      var comp = components[i];
      var typ = (comp && comp.type) ? String(comp.type).toLowerCase() : 'box';
      var lbl = (comp && comp.label) ? comp.label : typ;

      if (typ === 'battery' || typ === 'voltage' || typ === 'v' || typ === 'cell') {
        var l1 = document.createElementNS(SVG_NS, 'line');
        l1.setAttribute('x1', String(x - 6));
        l1.setAttribute('y1', '0');
        l1.setAttribute('x2', String(x + 6));
        l1.setAttribute('y2', '0');
        l1.setAttribute('stroke', color);
        l1.setAttribute('stroke-width', '2');
        innerG.appendChild(l1);
        var l2 = document.createElementNS(SVG_NS, 'line');
        l2.setAttribute('x1', String(x - 6));
        l2.setAttribute('y1', '16');
        l2.setAttribute('x2', String(x + 6));
        l2.setAttribute('y2', '16');
        l2.setAttribute('stroke', color);
        l2.setAttribute('stroke-width', '2');
        innerG.appendChild(l2);
        var v = document.createElementNS(SVG_NS, 'line');
        v.setAttribute('x1', String(x));
        v.setAttribute('y1', '0');
        v.setAttribute('x2', String(x));
        v.setAttribute('y2', '16');
        v.setAttribute('stroke', color);
        v.setAttribute('stroke-width', '1.5');
        innerG.appendChild(v);
      } else if (typ === 'resistor' || typ === 'r') {
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', 'M ' + (x - 15) + ' 8 L ' + (x - 5) + ' 0 L ' + x + ' 16 L ' + (x + 5) + ' 0 L ' + (x + 15) + ' 8');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        innerG.appendChild(path);
      } else if (typ === 'bulb' || typ === 'lamp' || typ === 'light') {
        var circ = document.createElementNS(SVG_NS, 'circle');
        circ.setAttribute('cx', String(x));
        circ.setAttribute('cy', '8');
        circ.setAttribute('r', '10');
        circ.setAttribute('fill', fill);
        circ.setAttribute('stroke', color);
        circ.setAttribute('stroke-width', '2');
        innerG.appendChild(circ);
      } else {
        var rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', String(x - 12));
        rect.setAttribute('y', '-4');
        rect.setAttribute('width', '24');
        rect.setAttribute('height', '24');
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '1.5');
        innerG.appendChild(rect);
      }

      if (i < components.length - 1) {
        var wire = document.createElementNS(SVG_NS, 'line');
        wire.setAttribute('x1', String(x + 15));
        wire.setAttribute('y1', '8');
        wire.setAttribute('x2', String(startX + (i + 1) * spacing - 15));
        wire.setAttribute('y2', '8');
        wire.setAttribute('stroke', color);
        wire.setAttribute('stroke-width', '1.5');
        wire.setAttribute('opacity', '0.7');
        innerG.appendChild(wire);
      }
    }
    addLabel(innerG, entity, 36);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── CoordinateSystem: axes with grid ─────────────────────────────
  function renderCoordinateSystem(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var totalW = s * 4;
    var totalH = s * 3;
    var color = getEntityColor(entity);
    var meta = entity.metadata || {};
    var xRange = meta.xRange || [-5, 5];
    var yRange = meta.yRange || [-5, 5];
    var xMin = xRange[0] != null ? xRange[0] : -5;
    var xMax = xRange[1] != null ? xRange[1] : 5;
    var yMin = yRange[0] != null ? yRange[0] : -5;
    var yMax = yRange[1] != null ? yRange[1] : 5;
    var pad = 30;
    var chartW = totalW - pad * 2;
    var chartH = totalH - pad * 2;
    var chartLeft = -totalW / 2 + pad;
    var chartTop = -totalH / 2 + pad;

    function mapX(v) { return chartLeft + ((v - xMin) / (xMax - xMin || 1)) * chartW; }
    function mapY(v) { return chartTop + chartH - ((v - yMin) / (yMax - yMin || 1)) * chartH; }

    var bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(-totalW / 2));
    bg.setAttribute('y', String(-totalH / 2));
    bg.setAttribute('width', String(totalW));
    bg.setAttribute('height', String(totalH));
    bg.setAttribute('rx', '8');
    bg.setAttribute('fill', colorAlpha(color, 0.08));
    bg.setAttribute('stroke', color);
    bg.setAttribute('stroke-width', '1');
    innerG.appendChild(bg);

    var gridSpacing = meta.gridSpacing != null ? meta.gridSpacing : 1;
    var showGrid = meta.showGrid !== false;
    if (showGrid && gridSpacing > 0) {
      for (var v = Math.ceil(xMin / gridSpacing) * gridSpacing; v <= xMax; v += gridSpacing) {
        var gx = mapX(v);
        var gl = document.createElementNS(SVG_NS, 'line');
        gl.setAttribute('x1', String(gx));
        gl.setAttribute('y1', String(chartTop));
        gl.setAttribute('x2', String(gx));
        gl.setAttribute('y2', String(chartTop + chartH));
        gl.setAttribute('stroke', colorAlpha(color, 0.15));
        gl.setAttribute('stroke-width', '1');
        innerG.appendChild(gl);
      }
      for (var v = Math.ceil(yMin / gridSpacing) * gridSpacing; v <= yMax; v += gridSpacing) {
        var gy = mapY(v);
        var gl = document.createElementNS(SVG_NS, 'line');
        gl.setAttribute('x1', String(chartLeft));
        gl.setAttribute('y1', String(gy));
        gl.setAttribute('x2', String(chartLeft + chartW));
        gl.setAttribute('y2', String(gy));
        gl.setAttribute('stroke', colorAlpha(color, 0.15));
        gl.setAttribute('stroke-width', '1');
        innerG.appendChild(gl);
      }
    }

    var xAxis = document.createElementNS(SVG_NS, 'line');
    xAxis.setAttribute('x1', String(chartLeft));
    xAxis.setAttribute('y1', String(mapY(0)));
    xAxis.setAttribute('x2', String(chartLeft + chartW));
    xAxis.setAttribute('y2', String(mapY(0)));
    xAxis.setAttribute('stroke', colorAlpha(color, 0.5));
    xAxis.setAttribute('stroke-width', '1.5');
    innerG.appendChild(xAxis);
    var yAxis = document.createElementNS(SVG_NS, 'line');
    yAxis.setAttribute('x1', String(mapX(0)));
    yAxis.setAttribute('y1', String(chartTop));
    yAxis.setAttribute('x2', String(mapX(0)));
    yAxis.setAttribute('y2', String(chartTop + chartH));
    yAxis.setAttribute('stroke', colorAlpha(color, 0.5));
    yAxis.setAttribute('stroke-width', '1.5');
    innerG.appendChild(yAxis);

    var points = meta.points || [];
    for (var pi = 0; pi < points.length && pi < 8; pi++) {
      var pt = points[pi];
      var px = mapX(pt.x != null ? pt.x : 0);
      var py = mapY(pt.y != null ? pt.y : 0);
      var ptColor = (pt && pt.color) || color;
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(px));
      dot.setAttribute('cy', String(py));
      dot.setAttribute('r', '4');
      dot.setAttribute('fill', ptColor);
      dot.setAttribute('stroke', color);
      dot.setAttribute('stroke-width', '1');
      innerG.appendChild(dot);
    }
    addLabel(innerG, entity, totalH / 2 + 12);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Graph2D: function plot / ROC / loss / scatter ─────────────────
  function renderGraph2D(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var totalW = s * 4;
    var totalH = s * 3;
    var color = getEntityColor(entity);
    var meta = entity.metadata || {};
    var curveType = meta.curveType;
    var isROC = curveType === 'roc';
    var isLoss = curveType === 'loss';
    var domain = meta.domain || meta.xRange || (isROC || isLoss ? (isROC ? [0, 1] : [0, 10]) : [-5, 5]);
    var range = meta.range || meta.yRange || (isROC ? [0, 1] : isLoss ? [0, 2] : [-5, 5]);
    var domainMin = domain[0] != null ? domain[0] : -5;
    var domainMax = domain[1] != null ? domain[1] : 5;
    var rangeMin = range[0] != null ? range[0] : -5;
    var rangeMax = range[1] != null ? range[1] : 5;
    var pad = 30;
    var chartW = totalW - pad * 2;
    var chartH = totalH - pad * 2;
    var chartLeft = -totalW / 2 + pad;
    var chartTop = -totalH / 2 + pad;

    function mapX(v) { return chartLeft + ((v - domainMin) / (domainMax - domainMin || 1)) * chartW; }
    function mapY(v) { return chartTop + chartH - ((v - rangeMin) / (rangeMax - rangeMin || 1)) * chartH; }

    var bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(-totalW / 2));
    bg.setAttribute('y', String(-totalH / 2));
    bg.setAttribute('width', String(totalW));
    bg.setAttribute('height', String(totalH));
    bg.setAttribute('rx', '8');
    bg.setAttribute('fill', colorAlpha(color, 0.08));
    bg.setAttribute('stroke', color);
    bg.setAttribute('stroke-width', '1');
    innerG.appendChild(bg);

    var showGrid = meta.showGrid !== false;
    if (showGrid) {
      for (var v = Math.ceil(domainMin); v <= Math.floor(domainMax); v++) {
        var gx = mapX(v);
        var gl = document.createElementNS(SVG_NS, 'line');
        gl.setAttribute('x1', String(gx));
        gl.setAttribute('y1', String(chartTop));
        gl.setAttribute('x2', String(gx));
        gl.setAttribute('y2', String(chartTop + chartH));
        gl.setAttribute('stroke', colorAlpha(color, 0.15));
        gl.setAttribute('stroke-width', '1');
        innerG.appendChild(gl);
      }
      for (var v = Math.ceil(rangeMin); v <= Math.floor(rangeMax); v++) {
        var gy = mapY(v);
        var gl = document.createElementNS(SVG_NS, 'line');
        gl.setAttribute('x1', String(chartLeft));
        gl.setAttribute('y1', String(gy));
        gl.setAttribute('x2', String(chartLeft + chartW));
        gl.setAttribute('y2', String(gy));
        gl.setAttribute('stroke', colorAlpha(color, 0.15));
        gl.setAttribute('stroke-width', '1');
        innerG.appendChild(gl);
      }
    }

    var xAxis = document.createElementNS(SVG_NS, 'line');
    xAxis.setAttribute('x1', String(chartLeft));
    xAxis.setAttribute('y1', String(mapY(0)));
    xAxis.setAttribute('x2', String(chartLeft + chartW));
    xAxis.setAttribute('y2', String(mapY(0)));
    xAxis.setAttribute('stroke', colorAlpha(color, 0.5));
    xAxis.setAttribute('stroke-width', '1.5');
    innerG.appendChild(xAxis);
    var yAxis = document.createElementNS(SVG_NS, 'line');
    yAxis.setAttribute('x1', String(mapX(0)));
    yAxis.setAttribute('y1', String(chartTop));
    yAxis.setAttribute('x2', String(mapX(0)));
    yAxis.setAttribute('y2', String(chartTop + chartH));
    yAxis.setAttribute('stroke', colorAlpha(color, 0.5));
    yAxis.setAttribute('stroke-width', '1.5');
    innerG.appendChild(yAxis);

    var points = meta.points || [];
    if (isROC && points.length === 0) points = [{ x: 0, y: 0 }, { x: 0.1, y: 0.3 }, { x: 0.3, y: 0.6 }, { x: 0.6, y: 0.85 }, { x: 1, y: 1 }];
    if (isLoss && !meta.expression && points.length === 0) points = [{ x: 0, y: 1.8 }, { x: 2, y: 1.2 }, { x: 4, y: 0.8 }, { x: 6, y: 0.5 }, { x: 8, y: 0.35 }, { x: 10, y: 0.25 }];

    if ((isROC || isLoss) && points.length > 0) {
      var pathD = points.map(function(p, i) {
        return (i === 0 ? 'M' : 'L') + mapX(p.x).toFixed(1) + ',' + mapY(p.y).toFixed(1);
      }).join(' ');
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', pathD);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2.5');
      innerG.appendChild(path);
    } else if (points.length > 0) {
      for (var pi = 0; pi < points.length && pi < 20; pi++) {
        var pt = points[pi];
        var px = mapX(pt.x != null ? pt.x : 0);
        var py = mapY(pt.y != null ? pt.y : 0);
        var dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', String(px));
        dot.setAttribute('cy', String(py));
        dot.setAttribute('r', '4');
        dot.setAttribute('fill', color);
        dot.setAttribute('stroke', colorAlpha(color, 0.5));
        dot.setAttribute('stroke-width', '1.5');
        innerG.appendChild(dot);
      }
    }
    addLabel(innerG, entity, totalH / 2 + 12);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── DNSResolver: server rack with globe icon ────────────────────
  function renderDNSResolver(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var w = s * 1.4;
    var h = s * 0.8;

    var body = document.createElementNS(SVG_NS, 'rect');
    body.setAttribute('x', String(-w / 2));
    body.setAttribute('y', String(-h / 2));
    body.setAttribute('width', String(w));
    body.setAttribute('height', String(h));
    body.setAttribute('rx', '4');
    body.setAttribute('fill', fill);
    body.setAttribute('stroke', color);
    body.setAttribute('stroke-width', '1.5');
    innerG.appendChild(body);

    var lineOffsets = [-s / 6, 0, s / 6];
    for (var li = 0; li < lineOffsets.length; li++) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(-w / 2));
      line.setAttribute('x2', String(w / 2));
      line.setAttribute('y1', String(lineOffsets[li]));
      line.setAttribute('y2', String(lineOffsets[li]));
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('opacity', '0.6');
      innerG.appendChild(line);
    }

    var dotConfig = [{ cx: -w / 3, cy: -s / 3 }, { cx: -w / 6, cy: -s / 3 }, { cx: w / 6, cy: -s / 3 }];
    for (var di = 0; di < dotConfig.length; di++) {
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(dotConfig[di].cx));
      dot.setAttribute('cy', String(dotConfig[di].cy));
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', di < 2 ? color : '#28c840');
      dot.setAttribute('opacity', '0.9');
      innerG.appendChild(dot);
    }

    var globeR = s * 0.18;
    var globe = document.createElementNS(SVG_NS, 'circle');
    globe.setAttribute('cx', String(-w / 6));
    globe.setAttribute('cy', String(s * 0.08));
    globe.setAttribute('r', String(globeR));
    globe.setAttribute('fill', 'none');
    globe.setAttribute('stroke', color);
    globe.setAttribute('stroke-width', '1.5');
    globe.setAttribute('opacity', '0.9');
    innerG.appendChild(globe);

    var arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', 'M ' + (w / 6 - 8) + ' ' + (s * 0.08) + ' L ' + (w / 6 + 8) + ' ' + (s * 0.08) + ' M ' + (w / 6 + 4) + ' ' + (s * 0.08 - 4) + ' L ' + (w / 6 + 8) + ' ' + (s * 0.08) + ' L ' + (w / 6 + 4) + ' ' + (s * 0.08 + 4));
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke', color);
    arrow.setAttribute('stroke-width', '1.5');
    arrow.setAttribute('stroke-linecap', 'round');
    arrow.setAttribute('stroke-linejoin', 'round');
    innerG.appendChild(arrow);

    addLabel(innerG, entity, h / 2 + 22);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Cache: cylinder with lightning bolt ──────────────────────────
  function renderCache(entity, parentEl, delay) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    var rx = s / 2;
    var ry = s / 6;
    var bodyH = s * 0.55;
    var topY = -s / 3;
    var botY = topY + bodyH;

    var topEllipse = document.createElementNS(SVG_NS, 'ellipse');
    topEllipse.setAttribute('cx', '0');
    topEllipse.setAttribute('cy', String(topY));
    topEllipse.setAttribute('rx', String(rx));
    topEllipse.setAttribute('ry', String(ry));
    topEllipse.setAttribute('fill', colorAlpha(color, 0.15));
    topEllipse.setAttribute('stroke', color);
    topEllipse.setAttribute('stroke-width', '1.5');
    innerG.appendChild(topEllipse);

    var bodyFill = document.createElementNS(SVG_NS, 'rect');
    bodyFill.setAttribute('x', String(-rx));
    bodyFill.setAttribute('y', String(topY));
    bodyFill.setAttribute('width', String(rx * 2));
    bodyFill.setAttribute('height', String(bodyH));
    bodyFill.setAttribute('fill', fill);
    bodyFill.setAttribute('stroke', 'none');
    innerG.appendChild(bodyFill);

    var botEllipse = document.createElementNS(SVG_NS, 'ellipse');
    botEllipse.setAttribute('cx', '0');
    botEllipse.setAttribute('cy', String(botY));
    botEllipse.setAttribute('rx', String(rx));
    botEllipse.setAttribute('ry', String(ry));
    botEllipse.setAttribute('fill', colorAlpha(color, 0.08));
    botEllipse.setAttribute('stroke', color);
    botEllipse.setAttribute('stroke-width', '1.5');
    innerG.appendChild(botEllipse);

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

    var stripeOffsets = [0.2, 0.45, 0.7];
    for (var si = 0; si < stripeOffsets.length; si++) {
      var sy = topY + bodyH * stripeOffsets[si];
      var sw = rx * 0.85;
      var stripe = document.createElementNS(SVG_NS, 'line');
      stripe.setAttribute('x1', String(-sw));
      stripe.setAttribute('y1', String(sy));
      stripe.setAttribute('x2', String(sw));
      stripe.setAttribute('y2', String(sy));
      stripe.setAttribute('stroke', color);
      stripe.setAttribute('stroke-width', '1.5');
      stripe.setAttribute('opacity', '0.5');
      innerG.appendChild(stripe);
    }

    var boltScale = rx * 0.35;
    var boltPath = 'M 0 ' + (-boltScale) + ' L ' + (boltScale * 0.5) + ' 0 L ' + (-boltScale * 0.3) + ' ' + (boltScale * 0.3) + ' L ' + (boltScale * 0.2) + ' ' + boltScale + ' L ' + (-boltScale * 0.5) + ' ' + (boltScale * 0.2) + ' L 0 0 Z';
    var bolt = document.createElementNS(SVG_NS, 'path');
    bolt.setAttribute('d', boltPath);
    bolt.setAttribute('fill', color);
    bolt.setAttribute('opacity', '0.9');
    innerG.appendChild(bolt);

    addLabel(innerG, entity, botY + ry + 20);
    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ── Generic: rounded rect / circle / diamond / hexagon ───────────
  // BUG FIX 1: REMOVED addLabel() call — interior label is sufficient
  // BUG FIX 3: Smaller truncation and font for circle (16 chars) and hexagon (18 chars)
  function renderGeneric(entity, parentEl, delay, shape) {
    var g = createEntityGroup(entity, delay);
    var innerG = g.innerG;
    var s = sizeToPixels(entity.size);
    var color = getEntityColor(entity);
    var fill = getFill(color, canvas);
    shape = shape || 'rect';

    if (renderStyle === 'minimal') {
      var labForSize = truncLabel(entity.label || '', 22);
      var fsMin = Math.max(MIN_FONT_SIZE, Math.min(s * 0.2, 18));
      var textWMin = estimateTextWidth(labForSize, fsMin);
      var w = Math.max(s * 1.3, textWMin + 24);
      var h = Math.max(s * 0.85, fsMin * 1.4 + 12);
      if (shape === 'circle') {
        var rMin = Math.max(s * 0.45, (textWMin + 16) / 2);
        var circ = document.createElementNS(SVG_NS, 'circle');
        circ.setAttribute('cx', '0');
        circ.setAttribute('cy', '0');
        circ.setAttribute('r', String(rMin));
        circ.setAttribute('fill', fill);
        innerG.appendChild(circ);
      } else {
        var rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', String(-w/2));
        rect.setAttribute('y', String(-h/2));
        rect.setAttribute('width', String(w));
        rect.setAttribute('height', String(h));
        rect.setAttribute('rx', '4');
        rect.setAttribute('fill', fill);
        innerG.appendChild(rect);
      }
      if (entity.label) {
        var lab = document.createElementNS(SVG_NS, 'text');
        lab.setAttribute('x', '0');
        lab.setAttribute('y', String(s * 0.06));
        lab.setAttribute('text-anchor', 'middle');
        lab.setAttribute('fill', '#ffffff');
        lab.setAttribute('font-size', String(fsMin));
        lab.setAttribute('font-weight', '600');
        lab.setAttribute('font-family', FONT_UI);
        lab.textContent = labForSize;
        innerG.appendChild(lab);
      }
      parentEl.appendChild(g.outerG);
      return g.outerG;
    }

    if (shape === 'circle') {
      var labCircle = truncLabel(entity.label || '', 16);
      var fsCircle = Math.max(MIN_FONT_SIZE, Math.min(s * 0.18, 16));
      var textWCircle = estimateTextWidth(labCircle, fsCircle);
      var rCircle = Math.max(s * 0.45, (textWCircle + 20) / 2);
      var circ = document.createElementNS(SVG_NS, 'circle');
      circ.setAttribute('cx', '0');
      circ.setAttribute('cy', '0');
      circ.setAttribute('r', String(rCircle));
      circ.setAttribute('fill', fill);
      circ.setAttribute('stroke', color);
      circ.setAttribute('stroke-width', '1.5');
      circ.setAttribute('filter', 'url(#soft-shadow)');
      innerG.appendChild(circ);
    } else if (shape === 'diamond') {
      var dd = s * 0.5;
      var poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', '0,' + (-dd) + ' ' + dd + ',0 0,' + dd + ' ' + (-dd) + ',0');
      poly.setAttribute('fill', fill);
      poly.setAttribute('stroke', color);
      poly.setAttribute('stroke-width', '1.5');
      poly.setAttribute('filter', 'url(#soft-shadow)');
      innerG.appendChild(poly);
    } else if (shape === 'hexagon') {
      var labHex = truncLabel(entity.label || '', 18);
      var fsHex = Math.max(MIN_FONT_SIZE, Math.min(s * 0.2, 20));
      var textWHex = estimateTextWidth(labHex, fsHex);
      var rHex = Math.max(s * 0.45, (textWHex + 24) / 2);
      var pts = [];
      for (var hi = 0; hi < 6; hi++) {
        var angle = (Math.PI / 3) * hi - Math.PI / 6;
        pts.push((Math.cos(angle) * rHex).toFixed(1) + ',' + (Math.sin(angle) * rHex).toFixed(1));
      }
      var hex = document.createElementNS(SVG_NS, 'polygon');
      hex.setAttribute('points', pts.join(' '));
      hex.setAttribute('fill', fill);
      hex.setAttribute('stroke', color);
      hex.setAttribute('stroke-width', '1.5');
      hex.setAttribute('filter', 'url(#soft-shadow)');
      innerG.appendChild(hex);
    } else {
      // Rounded rect (default) — size to content so text never truncates visually
      var truncMaxRect = 22;
      var labRect = truncLabel(entity.label || '', truncMaxRect);
      var insideFontSizeRect = Math.max(MIN_FONT_SIZE, Math.min(s * 0.2, 20));
      var textWRect = estimateTextWidth(labRect, insideFontSizeRect);
      var w = Math.max(s * 1.3, Math.min(textWRect + 32, s * 3.5));
      var h = Math.max(s * 0.85, insideFontSizeRect * 1.5 + 16);
      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-w/2));
      rect.setAttribute('y', String(-h/2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', '10');
      rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', '1.5');
      rect.setAttribute('filter', 'url(#soft-shadow)');
      innerG.appendChild(rect);
    }

    // Interior label centered inside shape — font scales with size, min for readability
    if (entity.label) {
      var labelInside = document.createElementNS(SVG_NS, 'text');
      labelInside.setAttribute('x', '0');
      labelInside.setAttribute('y', String(s * 0.06));
      labelInside.setAttribute('text-anchor', 'middle');
      labelInside.setAttribute('dominant-baseline', 'middle');
      labelInside.setAttribute('fill', color);

      var truncMax, insideFontSize;
      if (shape === 'circle') {
        insideFontSize = Math.max(MIN_FONT_SIZE, Math.min(s * 0.18, 16));
        truncMax = 16;
      } else if (shape === 'hexagon') {
        insideFontSize = Math.max(MIN_FONT_SIZE, Math.min(s * 0.2, 20));
        truncMax = 18;
      } else {
        insideFontSize = Math.max(MIN_FONT_SIZE, Math.min(s * 0.2, 20));
        truncMax = 22;
      }

      labelInside.setAttribute('font-size', String(insideFontSize));
      labelInside.setAttribute('font-weight', '600');
      labelInside.setAttribute('font-family', FONT_UI);
      labelInside.setAttribute('letter-spacing', '0.02em');
      labelInside.textContent = truncLabel(entity.label, truncMax);
      innerG.appendChild(labelInside);
    }

    // BUG FIX 1: NO addLabel() call here — interior label handles it.
    // Only render exterior label if entity has NO label property (very rare).
    // (When entity.label is absent, neither interior nor exterior label renders.)

    parentEl.appendChild(g.outerG);
    return g.outerG;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Type → Renderer dispatch table
  // ═══════════════════════════════════════════════════════════════════
  var SHAPE_MAP = {
    LoadBalancer: 'hexagon', Decision: 'diamond',
    Metric: 'circle', Concept: 'concept',
    Particle: 'circle', StateNode: 'circle', Cluster: 'circle'
  };

  function dispatchEntity(entity, parentEl, delay) {
    var t = entity.type || 'Entity';

    if (t === 'Server' || t === 'Service' || t === 'Lambda')
      return renderServer(entity, parentEl, delay);
    if (t === 'Database' || t === 'HashTable')
      return renderDatabase(entity, parentEl, delay);
    if (t === 'Cloud')
      return renderCloud(entity, parentEl, delay);
    if (t === 'User')
      return renderUser(entity, parentEl, delay);
    if (t === 'Concept')
      return renderConcept(entity, parentEl, delay);
    if (t === 'Label' || t === 'Annotation' || t === 'Definition' || t === 'Callout' || t === 'Quote' || t === 'Badge' || t === 'Analogy' || t === 'Comparison' || t === 'Proof')
      return renderLabel(entity, parentEl, delay);
    if (t === 'H1' || t === 'H2' || t === 'H3')
      return renderHeading(entity, parentEl, delay);
    if (t === 'CodeBlock')
      return renderCodeBlock(entity, parentEl, delay);
    if (t === 'Array')
      return renderArray(entity, parentEl, delay);
    if (t === 'Stack')
      return renderStack(entity, parentEl, delay);
    if (t === 'StepList')
      return renderStepList(entity, parentEl, delay);
    if (t === 'BarChart')
      return renderBarChart(entity, parentEl, delay);
    if (t === 'Cycle')
      return renderCycle(entity, parentEl, delay);
    if (t === 'ConfusionMatrix')
      return renderConfusionMatrix(entity, parentEl, delay);
    if (t === 'BigO')
      return renderBigO(entity, parentEl, delay);
    if (t === 'BinaryTree' || t === 'BTree')
      return renderBinaryTree(entity, parentEl, delay);
    if (t === 'Circuit')
      return renderCircuit(entity, parentEl, delay);
    if (t === 'CoordinateSystem')
      return renderCoordinateSystem(entity, parentEl, delay);
    if (t === 'Graph2D')
      return renderGraph2D(entity, parentEl, delay);
    if (t === 'DNSResolver')
      return renderDNSResolver(entity, parentEl, delay);
    if (t === 'Cache')
      return renderCache(entity, parentEl, delay);

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
    marker.setAttribute('markerWidth', '16');
    marker.setAttribute('markerHeight', '10');
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

    var x1 = entityCX(source);
    var y1 = entityCY(source);
    var x2 = entityCX(target);
    var y2 = entityCY(target);
    var color = entity.color || 'rgba(255,255,255,0.5)';

    // Shorten arrow to edge of elements (minus radius of each)
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      var r1 = entityRadius(source);
      var r2 = entityRadius(target);
      if (dist > r1 + r2) {
        var ux = dx / dist;
        var uy = dy / dist;
        x1 = x1 + ux * r1;
        y1 = y1 + uy * r1;
        x2 = x2 - ux * r2;
        y2 = y2 - uy * r2;
        dx = x2 - x1;
        dy = y2 - y1;
        dist = Math.sqrt(dx*dx + dy*dy);
      }
    }

    var markerId = 'ah-' + entity.id.replace(/[^a-zA-Z0-9]/g, '');
    ensureMarker(markerId, color);

    var ag = document.createElementNS(SVG_NS, 'g');
    ag.setAttribute('id', entity.id);
    ag.setAttribute('data-type', entity.type);

    var isMinimal = renderStyle === 'minimal';

    // All arrows straight (metadata.curved = true overrides to curved if needed)
    var useCurved = (entity.metadata && entity.metadata.curved === true);

    var pathD, cx1, cy1;
    if (useCurved) {
      var mx = (x1 + x2) / 2;
      var my = (y1 + y2) / 2;
      var curvature = Math.min(dist * 0.12, 50);
      var nx = (dist > 0) ? (-dy / dist * curvature) : 0;
      var ny = (dist > 0) ? ( dx / dist * curvature) : 0;
      cx1 = mx + nx;
      cy1 = my + ny;
      pathD = 'M ' + x1 + ' ' + y1 + ' Q ' + cx1 + ' ' + cy1 + ' ' + x2 + ' ' + y2;
    } else {
      cx1 = (x1 + x2) / 2;
      cy1 = (y1 + y2) / 2;
      pathD = 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2;
    }

    if (!isMinimal) {
      var glow = document.createElementNS(SVG_NS, 'path');
      glow.setAttribute('d', pathD);
      glow.setAttribute('stroke', color);
      glow.setAttribute('stroke-width', '6');
      glow.setAttribute('fill', 'none');
      glow.setAttribute('opacity', '0.12');
      glow.setAttribute('stroke-linecap', 'round');
      ag.appendChild(glow);
    }

    // Main line
    var line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', pathD);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', isMinimal ? '1.5' : '2');
    line.setAttribute('fill', 'none');
    line.setAttribute('opacity', isMinimal ? '0.85' : '0.7');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', 'url(#' + markerId + ')');

    if (isMinimal && entity.type === 'DataFlow') {
      line.setAttribute('stroke-dasharray', '8,5');
    }

    if (!isMinimal) {
    // Subtle slow flow animation on all arrows
    line.setAttribute('stroke-dasharray', '8,0');
    var flowAnim = document.createElementNS(SVG_NS, 'animate');
    flowAnim.setAttribute('attributeName', 'stroke-dashoffset');
    flowAnim.setAttribute('from', '16');
    flowAnim.setAttribute('to', '0');
    flowAnim.setAttribute('dur', '3s');
    flowAnim.setAttribute('repeatCount', 'indefinite');
    line.appendChild(flowAnim);

    // DataFlow: animated dash (overrides flow anim)
    if (entity.type === 'DataFlow') {
      line.setAttribute('stroke-dasharray', '8,5');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('opacity', '0.5');
      line.removeChild(flowAnim);
      var anim = document.createElementNS(SVG_NS, 'animate');
      anim.setAttribute('attributeName', 'stroke-dashoffset');
      anim.setAttribute('from', '13');
      anim.setAttribute('to', '0');
      anim.setAttribute('dur', '0.8s');
      anim.setAttribute('repeatCount', 'indefinite');
      line.appendChild(anim);
    }
    }

    ag.appendChild(line);

    // BUG FIX 4: Arrow label with collision avoidance
    if (entity.label) {
      var lx = (x1 + 2*cx1 + x2) / 4;
      var rawLY = (y1 + 2*cy1 + y2) / 4;
      var ly = rawLY - 25;

      // BUG FIX 4: if label Y is within 40px of either endpoint Y, offset further
      if (Math.abs(ly - y1) < 40 || Math.abs(ly - y2) < 40) {
        // Determine which direction to push (away from the closer endpoint)
        var closerY = (Math.abs(rawLY - y1) < Math.abs(rawLY - y2)) ? y1 : y2;
        ly = rawLY + (rawLY < closerY ? -65 : 65);
      }

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
      lpill.setAttribute('fill', '#1e293b');
      lpill.setAttribute('stroke', '#334155');
      lpill.setAttribute('stroke-width', '1');
      ag.appendChild(lpill);

      var lt = document.createElementNS(SVG_NS, 'text');
      lt.setAttribute('x', String(lx));
      lt.setAttribute('y', String(ly));
      lt.setAttribute('text-anchor', 'middle');
      lt.setAttribute('fill', '#ffffff');
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
  // Frame Renderer — crossfade transition
  // ═══════════════════════════════════════════════════════════════════
  var ARROW_TYPES = {
    Arrow: 1, DataFlow: 1, BidirectArrow: 1, DottedArrow: 1, Transition: 1, Bus: 1
  };

  function renderFrame(frame) {
    if (!frame) return;

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
    // IMPROVEMENT 8: j * 60 (was j * 80) — faster stagger
    for (var j = 0; j < nonArrows.length; j++) {
      dispatchEntity(nonArrows[j], entityLayer, j * 60);
    }

    // Pass 2: Render connections (after entities, so positions exist)
    // IMPROVEMENT 8: nonArrows.length * 60 + 150 (was *80 + 100), k * 50 (was k * 60)
    var arrowBaseDelay = nonArrows.length * 60 + 150;
    for (var k = 0; k < arrows.length; k++) {
      renderArrowEntity(arrows[k], connectionLayer, entities, arrowBaseDelay + k * 50);
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
  // TTS: native browser speech (Web Speech API)
  // ═══════════════════════════════════════════════════════════════════
  var synth = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
  var ttsEnabled = (function() {
    try {
      var stored = localStorage.getItem('preplai-tts-enabled');
      return stored === null ? true : stored === 'true';
    } catch (e) { return true; }
  })();

  function speakNarration(text) {
    if (!synth || !ttsEnabled || !text || !text.trim()) return;
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 1;
    synth.speak(u);
  }

  function stopTTS() {
    if (synth) synth.cancel();
  }

  function updateTTSToggleUI() {
    var btn = document.getElementById('tts-toggle');
    if (btn) {
      if (!synth) {
        btn.style.display = 'none';
        return;
      }
      btn.style.display = '';
      btn.setAttribute('aria-pressed', ttsEnabled ? 'true' : 'false');
      btn.setAttribute('title', ttsEnabled ? 'Voice narration on (click to mute)' : 'Voice narration off (click to enable)');
      btn.classList.toggle('tts-on', ttsEnabled);
      btn.classList.toggle('tts-off', !ttsEnabled);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Narrator
  // ═══════════════════════════════════════════════════════════════════
  function updateNarrator(text) {
    if (!narratorText) return;
    if (text && text.trim()) {
      narratorText.textContent = text;
      // IMPROVEMENT 9: GSAP smooth entrance if available
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(narratorText,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      }
      narratorText.classList.add('visible');
      if (ttsEnabled && synth) speakNarration(text);
    } else {
      stopTTS();
      narratorText.classList.remove('visible');
      setTimeout(function() { narratorText.textContent = ''; }, 400);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Frame Navigation
  // ═══════════════════════════════════════════════════════════════════
  // IMPROVEMENT 4: dot indicators for frame navigation
  function updateFrameCounter() {
    if (!frameCounter || !currentScript) return;
    var total = currentScript.frames ? currentScript.frames.length : 1;
    frameCounter.textContent = (currentFrame + 1) + ' / ' + total;
    if (frameNav) frameNav.classList.add('visible');

    // Progress bar
    var progressBar = document.getElementById('progress-fill');
    if (progressBar) {
      var pct = total > 1 ? (currentFrame / (total - 1)) * 100 : 100;
      progressBar.style.width = pct + '%';
    }

    // Update prev/next button aria-disabled
    if (prevBtn) {
      prevBtn.setAttribute('aria-disabled', currentFrame === 0 ? 'true' : 'false');
    }
    if (nextBtn) {
      nextBtn.setAttribute('aria-disabled', currentFrame >= total - 1 ? 'true' : 'false');
    }

    // Render frame dots
    var dotsContainer = document.getElementById('frame-dots');
    if (dotsContainer) {
      dotsContainer.setAttribute('aria-label', 'Scene ' + (currentFrame + 1) + ' of ' + total);
      dotsContainer.innerHTML = '';
      for (var di = 0; di < total; di++) {
        var dot = document.createElement('div');
        dot.className = 'frame-dot';
        if (di < currentFrame) dot.classList.add('visited');
        if (di === currentFrame) dot.classList.add('current');
        (function(idx) {
          dot.addEventListener('click', function() {
            if (currentScript && idx >= 0 && idx < currentScript.frames.length) {
              currentFrame = idx;
              renderFrame(currentScript.frames[idx]);
              updateFrameCounter();
            }
          });
        })(di);
        dotsContainer.appendChild(dot);
      }
    }
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

  // TTS toggle
  var ttsToggle = document.getElementById('tts-toggle');
  if (ttsToggle) {
    updateTTSToggleUI();
    ttsToggle.addEventListener('click', function() {
      ttsEnabled = !ttsEnabled;
      try { localStorage.setItem('preplai-tts-enabled', String(ttsEnabled)); } catch (e) {}
      updateTTSToggleUI();
      if (!ttsEnabled) stopTTS();
    });
  }

  // Narrator overlay visibility toggle
  var narratorOverlay = document.getElementById('narrator-overlay');
  var narratorOverlayToggle = document.getElementById('narrator-overlay-toggle');
  var narratorOverlayVisible = true;
  try {
    var stored = localStorage.getItem('preplai-narrator-overlay-visible');
    if (stored !== null) narratorOverlayVisible = stored === 'true';
  } catch (e) {}
  function setNarratorOverlayVisible(visible) {
    narratorOverlayVisible = visible;
    if (narratorOverlay) {
      if (visible) {
        narratorOverlay.classList.remove('hidden');
      } else {
        narratorOverlay.classList.add('hidden');
      }
    }
    if (narratorOverlayToggle) {
      narratorOverlayToggle.classList.toggle('narrator-hidden', !visible);
      narratorOverlayToggle.setAttribute('aria-label', visible ? 'Hide narrator overlay' : 'Show narrator overlay');
    }
    try { localStorage.setItem('preplai-narrator-overlay-visible', String(visible)); } catch (e) {}
  }
  setNarratorOverlayVisible(narratorOverlayVisible);
  if (narratorOverlayToggle) narratorOverlayToggle.addEventListener('click', function() { setNarratorOverlayVisible(!narratorOverlayVisible); });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goPrev(); }
    if (e.key === 'n' || e.key === 'N') {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setNarratorOverlayVisible(!narratorOverlayVisible);
      }
    }
  });

  // IMPROVEMENT 5: Auto-hide keyboard hint after 4 seconds
  setTimeout(function() {
    var hint = document.getElementById('keyboard-hint');
    if (hint) hint.classList.add('hidden');
  }, 4000);

  // ═══════════════════════════════════════════════════════════════════
  // Empty state: "Waiting for content" message
  // ═══════════════════════════════════════════════════════════════════
  var emptyState = null;
  function showEmptyState() {
    if (emptyState) return;
    emptyState = document.createElementNS(SVG_NS, 'g');
    emptyState.setAttribute('id', 'empty-state');

    // Subtle pulsing circle
    var circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '960');
    circle.setAttribute('cy', '480');
    circle.setAttribute('r', '60');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    circle.setAttribute('stroke-width', '2');
    emptyState.appendChild(circle);

    // Inner dot
    var dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', '960');
    dot.setAttribute('cy', '480');
    dot.setAttribute('r', '8');
    dot.setAttribute('fill', 'rgba(255,255,255,0.25)');
    emptyState.appendChild(dot);

    // "Waiting for content..." text
    var text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '960');
    text.setAttribute('y', '570');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'rgba(255,255,255,0.4)');
    text.setAttribute('font-family', FONT_UI);
    text.setAttribute('font-size', '28');
    text.setAttribute('font-weight', '400');
    text.textContent = 'Waiting for content\u2026';
    emptyState.appendChild(text);

    // Subtitle
    var sub = document.createElementNS(SVG_NS, 'text');
    sub.setAttribute('x', '960');
    sub.setAttribute('y', '610');
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('fill', 'rgba(255,255,255,0.2)');
    sub.setAttribute('font-family', FONT_UI);
    sub.setAttribute('font-size', '18');
    sub.setAttribute('font-weight', '400');
    sub.textContent = 'The presentation will appear here once scenes are added';
    emptyState.appendChild(sub);

    entityLayer.appendChild(emptyState);

    // Pulse animation
    if (typeof gsap !== 'undefined') {
      gsap.to(circle, { attr: { r: 70 }, opacity: 0.5, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to(dot, { opacity: 0.5, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
  }

  function hideEmptyState() {
    if (emptyState) {
      emptyState.remove();
      emptyState = null;
    }
  }

  // Show empty state on load
  showEmptyState();

  // SSE URL: use data-events-base when player is in iframe (different origin)
  var eventsBase = document.body.getAttribute('data-events-base') || '';
  var eventsUrl = eventsBase
    ? ((eventsBase.charAt(eventsBase.length - 1) === '/' ? eventsBase.slice(0, -1) : eventsBase) + '/session/' + sessionId + '/events')
    : ('/session/' + sessionId + '/events');

  // ═══════════════════════════════════════════════════════════════════
  // SSE Connection
  // ═══════════════════════════════════════════════════════════════════
  var evtSource = new EventSource(eventsUrl);

  var fallbackScheduled = true;
  function applyScript(script) {
    if (!script || !script.frames || script.frames.length === 0) return;
    if (fallbackScheduled) { clearTimeout(fallbackTimeout); fallbackScheduled = false; }
    hideEmptyState();
    var prevFrameCount = currentScript ? currentScript.frames.length : 0;
    currentScript = script;
    renderStyle = (currentScript && currentScript.style === 'minimal') || urlStyle ? 'minimal' : 'cinema';
    if (document.body) document.body.setAttribute('data-theme', renderStyle);
    if (prevFrameCount > 0 && currentScript.frames.length > prevFrameCount) {
      currentFrame = prevFrameCount;
    } else {
      currentFrame = 0;
    }
    renderFrame(currentScript.frames[currentFrame]);
    updateFrameCounter();
  }

  evtSource.addEventListener('message', function(e) {
    try {
      var event = JSON.parse(e.data);

      if (event.type === 'connected') {
        console.log('[PRE] SSE connected for session:', event.sessionId);
        return;
      }

      if (event.type === 'script_update') {
        applyScript(event.script);
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
    console.warn('[PRE] SSE connection interrupted \u2014 auto-reconnecting.');
  });

  // Fallback: if no script received within 2.5s, fetch directly (handles SSE failure, iframe CORS, etc.)
  var fallbackTimeout = setTimeout(function() {
    fallbackScheduled = false;
    if (currentScript && currentScript.frames && currentScript.frames.length > 0) return;
    var scriptUrl = eventsBase
      ? ((eventsBase.charAt(eventsBase.length - 1) === '/' ? eventsBase.slice(0, -1) : eventsBase) + '/session/' + sessionId + '/script')
      : ('/session/' + sessionId + '/script');
    fetch(scriptUrl)
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.script && data.script.frames && data.script.frames.length > 0) {
          console.log('[PRE] Script loaded via fallback fetch');
          applyScript(data.script);
        }
      })
      .catch(function() {});
  }, 2500);

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

  console.log('[PRE] Player v4 initialized for session:', sessionId);
})();
`;
