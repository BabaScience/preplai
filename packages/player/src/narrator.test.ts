/**
 * @preplai/player — narrator tests (TDD: RED phase)
 *
 * Tests for the NarratorController — manages narrator text overlay.
 * Uses jsdom environment.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NarratorController } from './narrator.js';

let narratorTextEl: HTMLParagraphElement;
let controller: NarratorController;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="narrator-overlay">
      <p id="narrator-text"></p>
    </div>
  `;
  narratorTextEl = document.getElementById('narrator-text') as HTMLParagraphElement;
  controller = new NarratorController(narratorTextEl);
});


describe('NarratorController', () => {
  it('should set narrator text content', () => {
    controller.update('Hello world');
    expect(narratorTextEl.textContent).toBe('Hello world');
  });

  it('should clear text when given empty string', () => {
    controller.update('Some text');
    controller.update('');
    expect(narratorTextEl.textContent).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    controller.update('Initial');
    controller.update(null as any);
    expect(narratorTextEl.textContent).toBe('');
  });

  it('should replace existing text on subsequent updates', () => {
    controller.update('First');
    expect(narratorTextEl.textContent).toBe('First');

    controller.update('Second');
    expect(narratorTextEl.textContent).toBe('Second');
  });

  it('should handle long text without throwing', () => {
    const longText = 'A'.repeat(1000);
    controller.update(longText);
    expect(narratorTextEl.textContent).toBe(longText);
  });

  it('should handle special characters', () => {
    controller.update('The "fast" API → sends <data> & more');
    expect(narratorTextEl.textContent).toBe('The "fast" API → sends <data> & more');
  });

  it('should set visibility class when text is present', () => {
    controller.update('Visible');
    expect(narratorTextEl.classList.contains('narrator-visible')).toBe(true);
  });

  it('should remove visibility class when text is empty', () => {
    controller.update('Visible');
    controller.update('');
    expect(narratorTextEl.classList.contains('narrator-visible')).toBe(false);
  });

  it('should not throw when element is null', () => {
    const nullController = new NarratorController(null as any);
    expect(() => nullController.update('text')).not.toThrow();
  });
});
