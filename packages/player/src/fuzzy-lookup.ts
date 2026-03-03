/**
 * @preplai/player — fuzzy-lookup
 *
 * Three-tier entity reference resolution for arrow endpoint matching.
 * Ported from the prototype's FrameRenderer.tsx fuzzyLookup().
 *
 * Tier 1: Exact ID match
 * Tier 2: Exact label match (case-insensitive)
 * Tier 3: Fuzzy substring match (ref ⊂ label OR label ⊂ ref)
 *
 * Pure function — no DOM dependency.
 */
import type { VisualEntity } from '@preplai/shared';

/**
 * Resolve an entity reference (ID or label string) from a flat entity array.
 *
 * @param ref          The ID or label string to resolve
 * @param allEntities  Flat entity array from the current frame
 * @returns            The matched entity, or null if not found
 */
export function resolveEntityRef(
  ref: string | null | undefined,
  allEntities: VisualEntity[] | null | undefined,
): VisualEntity | null {
  if (!ref || !allEntities || allEntities.length === 0) return null;

  // Tier 1: Exact ID match
  const byId = allEntities.find((e) => e.id === ref);
  if (byId) return byId;

  // Tier 2: Exact label match (case-insensitive)
  const refLower = ref.toLowerCase();
  const byLabel = allEntities.find((e) => e.label?.toLowerCase() === refLower);
  if (byLabel) return byLabel;

  // Tier 3: Fuzzy substring match
  const fuzzy = allEntities.find((e) => {
    const lbl = e.label?.toLowerCase();
    if (!lbl) return false;
    return lbl.includes(refLower) || refLower.includes(lbl);
  });

  return fuzzy ?? null;
}
