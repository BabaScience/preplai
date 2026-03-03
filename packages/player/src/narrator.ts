/**
 * @preplai/player — NarratorController
 *
 * Manages the narrator text overlay (HTML <p> element).
 * Syncs text to the current frame's narrationSegment.
 */

export class NarratorController {
  private el: HTMLElement | null;

  constructor(el: HTMLElement | null) {
    this.el = el;
  }

  /**
   * Update narrator text. Empty/null/undefined clears the display.
   */
  update(text: string | null | undefined): void {
    if (!this.el) return;

    const value = text ?? '';
    this.el.textContent = value;

    if (value) {
      this.el.classList.add('narrator-visible');
    } else {
      this.el.classList.remove('narrator-visible');
    }
  }
}
