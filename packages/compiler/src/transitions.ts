/**
 * @pre/compiler — Frame Transition Computation
 *
 * Computes persist/enter/exit sets between consecutive frames.
 * Called after all 5 stages. Attaches _transition metadata to each frame.
 *
 * For frame N:
 *   persist = entities in BOTH frame N-1 and frame N (by entity ID)
 *   enter   = entities in frame N but NOT in frame N-1
 *   exit    = entities in frame N-1 but NOT in frame N
 *
 * Frame 0 (first frame): enter = all entities, persist = [], exit = []
 */

import type { VisualScript } from '@pre/shared';

export interface FrameTransition {
  persist: string[];
  enter: string[];
  exit: string[];
}

export type VisualScriptWithTransitions = VisualScript & {
  frames: (VisualScript['frames'][number] & { _transition: FrameTransition })[];
};

export function computeTransitions(script: VisualScript): VisualScriptWithTransitions {
  const frames = script.frames.map((frame, index) => {
    if (index === 0) {
      // First frame: everything enters
      return {
        ...frame,
        _transition: {
          persist: [],
          enter: frame.entities.map(e => e.id),
          exit: [],
        },
      };
    }

    const prevFrame = script.frames[index - 1];
    const prevIds = new Set(prevFrame.entities.map(e => e.id));
    const currIds = new Set(frame.entities.map(e => e.id));

    const persist = frame.entities
      .filter(e => prevIds.has(e.id))
      .map(e => e.id);

    const enter = frame.entities
      .filter(e => !prevIds.has(e.id))
      .map(e => e.id);

    const exit = prevFrame.entities
      .filter(e => !currIds.has(e.id))
      .map(e => e.id);

    return {
      ...frame,
      _transition: { persist, enter, exit },
    };
  });

  return {
    ...script,
    frames,
  } as VisualScriptWithTransitions;
}
