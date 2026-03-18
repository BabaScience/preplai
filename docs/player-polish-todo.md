# Player Polish — Remaining Tasks

> Tracked list of player UX improvements for a polished, well-guided experience.

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done

---

## Tasks

### 1. Background contrast fix
- [x] Match outer page background to presentation canvas color
- Fixed: separated `html` (transparent) from `body` (themed gradient)
- Fixed: CSS selector `body[data-theme="light"]` instead of descendant selector
- Light theme: seamless warm beige everywhere
- Cinema theme: seamless dark everywhere

### 2. Frame nav auto-hide timing
- [x] Keep nav visible for first 6 seconds on load
- [x] Then enable auto-hide on 3s mouse inactivity
- `FIRST_VISIT_DELAY = 6000` on first load, `AUTO_HIDE_DELAY = 3000` after interaction

### 3. Keyboard hint visibility
- [x] Show hint for 6 seconds on first load
- [x] Fade out permanently on first interaction (mouse/key)
- Uses `userHasInteracted` flag — once true, hint never returns

### 4. Share button clipboard fallback
- [x] Primary: `navigator.clipboard.writeText()` (HTTPS)
- [x] Fallback: `document.execCommand('copy')` via temporary input (HTTP/localhost)
- [x] "Copied!" feedback works in both paths

### 5. Frame progress indicator
- [x] Animated fill bar inside the current timeline segment during auto-play
- [x] `.segment-fill` div with CSS `@keyframes segmentFill` (scaleX 0→1)
- [x] Duration set from script's `totalDuration / frameCount`
- Current segment shows gold background at 30% opacity while fill animates over it

### 6. Mobile touch gestures
- [x] Already existed (line ~752 in player-bootstrap.ts)
- Swipe left → next, swipe right → prev
- Threshold: 50px horizontal, 1.5x vertical ratio check

### 7. Title card entrance
- [x] Already handled by illustration system entrance animations
- H1 entities use fadeInUp animation automatically
- No additional work needed

---

## All Tasks Complete
