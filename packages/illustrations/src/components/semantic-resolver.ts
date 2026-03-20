/**
 * @preplai/illustrations — Semantic Type Resolver (Tier 3)
 *
 * Auto-maps unknown entity type names to shape + icon combos.
 * Used as the last fallback before returning null.
 *
 * The resolver does substring matching on the lowercased type name,
 * so "FundVehicle" matches "fund" → shield + landmark.
 */

import type { ComposableShape } from './composable-shapes.js';

export interface SemanticHint {
  shape: ComposableShape;
  icon: string;
}

// ── Semantic mappings: keyword → shape + icon ──────────────────────────

const SEMANTIC_MAP: Array<{ keywords: string[]; hint: SemanticHint }> = [
  // ── Finance ──────────────────────────────────────────────────────────
  { keywords: ['fund', 'capital', 'investment'],   hint: { shape: 'shield', icon: 'landmark' } },
  { keywords: ['portfolio', 'allocation'],          hint: { shape: 'hexagon', icon: 'briefcase' } },
  { keywords: ['asset', 'equity'],                  hint: { shape: 'circle', icon: 'coins' } },
  { keywords: ['bank', 'financial'],                hint: { shape: 'rect', icon: 'landmark' } },
  { keywords: ['revenue', 'profit', 'income'],      hint: { shape: 'stadium', icon: 'trending-up' } },
  { keywords: ['loss', 'cost', 'expense'],           hint: { shape: 'stadium', icon: 'trending-down' } },
  { keywords: ['tax', 'fiscal'],                     hint: { shape: 'document', icon: 'percent' } },
  { keywords: ['payment', 'transaction'],            hint: { shape: 'rect', icon: 'credit-card' } },
  { keywords: ['budget'],                            hint: { shape: 'rect', icon: 'calculator' } },
  { keywords: ['wallet', 'account'],                 hint: { shape: 'rect', icon: 'wallet' } },

  // ── Legal ────────────────────────────────────────────────────────────
  { keywords: ['contract', 'agreement'],             hint: { shape: 'document', icon: 'scroll' } },
  { keywords: ['compliance', 'regulation'],          hint: { shape: 'shield', icon: 'shield-check' } },
  { keywords: ['legal', 'law', 'court'],             hint: { shape: 'octagon', icon: 'gavel' } },
  { keywords: ['license', 'permit'],                 hint: { shape: 'document', icon: 'stamp' } },
  { keywords: ['audit'],                             hint: { shape: 'rect', icon: 'search' } },

  // ── Business & Strategy ──────────────────────────────────────────────
  { keywords: ['strategy', 'plan'],                  hint: { shape: 'diamond', icon: 'target' } },
  { keywords: ['market', 'industry'],                hint: { shape: 'hexagon', icon: 'globe' } },
  { keywords: ['team', 'department', 'org'],         hint: { shape: 'stadium', icon: 'users' } },
  { keywords: ['customer', 'client', 'persona'],     hint: { shape: 'circle', icon: 'user-check' } },
  { keywords: ['goal', 'objective', 'kpi'],          hint: { shape: 'circle', icon: 'target' } },
  { keywords: ['risk'],                              hint: { shape: 'diamond', icon: 'alert-triangle' } },
  { keywords: ['opportunity'],                       hint: { shape: 'hexagon', icon: 'lightbulb' } },
  { keywords: ['competitor', 'competition'],          hint: { shape: 'hexagon', icon: 'flag' } },
  { keywords: ['brand', 'marketing'],                hint: { shape: 'stadium', icon: 'megaphone' } },
  { keywords: ['campaign'],                          hint: { shape: 'rect', icon: 'rocket' } },
  { keywords: ['channel', 'distribution'],           hint: { shape: 'parallelogram', icon: 'share' } },
  { keywords: ['partnership', 'alliance'],           hint: { shape: 'stadium', icon: 'handshake' } },
  { keywords: ['milestone', 'phase'],                hint: { shape: 'pentagon', icon: 'flag' } },
  { keywords: ['vendor', 'supplier'],                hint: { shape: 'rect', icon: 'building' } },
  { keywords: ['stakeholder'],                       hint: { shape: 'hexagon', icon: 'users' } },

  // ── Product & UX ─────────────────────────────────────────────────────
  { keywords: ['feature'],                           hint: { shape: 'rect', icon: 'puzzle' } },
  { keywords: ['user', 'persona'],                   hint: { shape: 'circle', icon: 'user-check' } },
  { keywords: ['feedback', 'review'],                hint: { shape: 'stadium', icon: 'message-circle' } },
  { keywords: ['metric', 'kpi', 'measure'],          hint: { shape: 'rect', icon: 'gauge' } },
  { keywords: ['mobile', 'app'],                     hint: { shape: 'rect', icon: 'smartphone' } },
  { keywords: ['notification', 'alert'],             hint: { shape: 'rect', icon: 'bell' } },

  // ── Healthcare ───────────────────────────────────────────────────────
  { keywords: ['patient', 'health'],                 hint: { shape: 'circle', icon: 'heart-pulse' } },
  { keywords: ['diagnosis', 'medical'],              hint: { shape: 'rect', icon: 'stethoscope' } },
  { keywords: ['treatment', 'therapy'],              hint: { shape: 'rect', icon: 'pill' } },
  { keywords: ['research', 'study'],                 hint: { shape: 'hexagon', icon: 'microscope' } },
  { keywords: ['gene', 'genetic', 'genome'],         hint: { shape: 'hexagon', icon: 'dna' } },

  // ── Education ────────────────────────────────────────────────────────
  { keywords: ['lesson', 'course', 'learning'],      hint: { shape: 'rect', icon: 'lightbulb' } },
  { keywords: ['concept', 'idea', 'theory'],         hint: { shape: 'circle', icon: 'lightbulb' } },
  { keywords: ['problem', 'challenge'],              hint: { shape: 'diamond', icon: 'puzzle' } },
  { keywords: ['solution', 'answer'],                hint: { shape: 'hexagon', icon: 'check' } },

  // ── Infrastructure (supplement) ──────────────────────────────────────
  { keywords: ['security', 'protect'],               hint: { shape: 'shield', icon: 'shield' } },
  { keywords: ['network', 'connect'],                hint: { shape: 'hexagon', icon: 'network' } },
  { keywords: ['storage', 'store'],                  hint: { shape: 'cylinder', icon: 'database' } },
  { keywords: ['compute', 'processor'],              hint: { shape: 'rect', icon: 'cpu' } },
  { keywords: ['cloud'],                             hint: { shape: 'cloud', icon: 'cloud-icon' } },
  { keywords: ['config', 'setting'],                 hint: { shape: 'rect', icon: 'settings' } },

  // ── Workflow / Process ───────────────────────────────────────────────
  { keywords: ['workflow', 'process', 'flow'],       hint: { shape: 'parallelogram', icon: 'workflow' } },
  { keywords: ['step', 'stage'],                     hint: { shape: 'rect', icon: 'chevron-right' } },
  { keywords: ['decision', 'choice'],                hint: { shape: 'diamond', icon: 'compass' } },
  { keywords: ['trigger', 'event'],                  hint: { shape: 'hexagon', icon: 'zap' } },
  { keywords: ['schedule', 'time', 'calendar'],      hint: { shape: 'rect', icon: 'calendar' } },
  { keywords: ['report', 'document', 'doc'],         hint: { shape: 'document', icon: 'scroll' } },

  // ── Real Estate ─────────────────────────────────────────────────────
  { keywords: ['property', 'real estate'],             hint: { shape: 'rect', icon: 'building' } },
  { keywords: ['lease', 'rental'],                     hint: { shape: 'document', icon: 'key' } },
  { keywords: ['tenant'],                              hint: { shape: 'circle', icon: 'user-check' } },
  { keywords: ['mortgage'],                            hint: { shape: 'shield', icon: 'landmark' } },
  { keywords: ['land', 'zoning'],                      hint: { shape: 'hexagon', icon: 'map' } },
  { keywords: ['appraisal', 'valuation'],              hint: { shape: 'diamond', icon: 'scale' } },

  // ── Manufacturing ──────────────────────────────────────────────────
  { keywords: ['factory', 'assembly'],                 hint: { shape: 'rect', icon: 'settings' } },
  { keywords: ['production', 'manufactur'],            hint: { shape: 'stadium', icon: 'activity' } },
  { keywords: ['supply chain'],                        hint: { shape: 'parallelogram', icon: 'link' } },
  { keywords: ['quality control', 'inspection'],       hint: { shape: 'shield', icon: 'check' } },
  { keywords: ['warehouse'],                           hint: { shape: 'rect', icon: 'archive' } },
  { keywords: ['logistics'],                           hint: { shape: 'hexagon', icon: 'globe' } },
  { keywords: ['shipping', 'freight'],                 hint: { shape: 'trapezoid', icon: 'upload' } },
  { keywords: ['inventory'],                           hint: { shape: 'cylinder', icon: 'layers' } },

  // ── HR & People ────────────────────────────────────────────────────
  { keywords: ['hiring', 'recruitment'],               hint: { shape: 'circle', icon: 'users' } },
  { keywords: ['onboarding'],                          hint: { shape: 'stadium', icon: 'chevron-right' } },
  { keywords: ['payroll', 'salary', 'compensation'],   hint: { shape: 'rect', icon: 'banknote' } },
  { keywords: ['benefits', 'perks'],                   hint: { shape: 'hexagon', icon: 'heart' } },
  { keywords: ['performance review', 'appraisal'],     hint: { shape: 'diamond', icon: 'gauge' } },
  { keywords: ['training'],                            hint: { shape: 'stadium', icon: 'lightbulb' } },
  { keywords: ['retention', 'attrition', 'turnover'],  hint: { shape: 'circle', icon: 'refresh' } },

  // ── Marketing & Sales ──────────────────────────────────────────────
  { keywords: ['advertising', 'ad '],                  hint: { shape: 'rect', icon: 'megaphone' } },
  { keywords: ['lead', 'prospect'],                    hint: { shape: 'pentagon', icon: 'funnel' } },
  { keywords: ['conversion'],                          hint: { shape: 'diamond', icon: 'trending-up' } },
  { keywords: ['crm'],                                 hint: { shape: 'rect', icon: 'users' } },
  { keywords: ['seo', 'search engine'],                hint: { shape: 'hexagon', icon: 'search' } },
  { keywords: ['social media'],                        hint: { shape: 'circle', icon: 'share' } },
  { keywords: ['content'],                             hint: { shape: 'document', icon: 'image' } },

  // ── Sustainability ─────────────────────────────────────────────────
  { keywords: ['esg'],                                 hint: { shape: 'shield', icon: 'globe' } },
  { keywords: ['carbon', 'emission'],                  hint: { shape: 'cloud', icon: 'cloud-icon' } },
  { keywords: ['renewable', 'solar', 'wind'],          hint: { shape: 'hexagon', icon: 'zap' } },
  { keywords: ['sustainability', 'green'],             hint: { shape: 'circle', icon: 'check' } },
  { keywords: ['climate'],                             hint: { shape: 'diamond', icon: 'globe' } },

  // ── Communication ──────────────────────────────────────────────────
  { keywords: ['email', 'mail'],                       hint: { shape: 'rect', icon: 'scroll' } },
  { keywords: ['chat', 'message'],                     hint: { shape: 'stadium', icon: 'message-circle' } },
  { keywords: ['broadcast'],                           hint: { shape: 'hexagon', icon: 'megaphone' } },
  { keywords: ['meeting', 'conference'],               hint: { shape: 'circle', icon: 'users' } },
  { keywords: ['presentation', 'deck'],                hint: { shape: 'rect', icon: 'monitor' } },

  // ── Data & Analytics ───────────────────────────────────────────────
  { keywords: ['analytics'],                           hint: { shape: 'rect', icon: 'activity' } },
  { keywords: ['dashboard'],                           hint: { shape: 'rect', icon: 'grid' } },
  { keywords: ['visualization', 'chart', 'graph'],     hint: { shape: 'hexagon', icon: 'trending-up' } },
  { keywords: ['forecast', 'prediction'],              hint: { shape: 'diamond', icon: 'eye' } },
  { keywords: ['trend'],                               hint: { shape: 'stadium', icon: 'trending-up' } },

  // ── Insurance ──────────────────────────────────────────────────────
  { keywords: ['claim'],                               hint: { shape: 'document', icon: 'scroll' } },
  { keywords: ['underwriting'],                        hint: { shape: 'shield', icon: 'shield-check' } },
  { keywords: ['premium'],                             hint: { shape: 'rect', icon: 'coins' } },
  { keywords: ['coverage', 'deductible'],              hint: { shape: 'hexagon', icon: 'shield' } },
  { keywords: ['insur'],                               hint: { shape: 'shield', icon: 'shield' } },

  // ── Government ─────────────────────────────────────────────────────
  { keywords: ['public', 'civic'],                     hint: { shape: 'octagon', icon: 'landmark' } },
  { keywords: ['government', 'federal', 'state'],      hint: { shape: 'rect', icon: 'landmark' } },
  { keywords: ['municipal', 'city'],                   hint: { shape: 'hexagon', icon: 'building' } },
  { keywords: ['legislation', 'bill', 'statute'],      hint: { shape: 'document', icon: 'gavel' } },

  // ── Non-profit ─────────────────────────────────────────────────────
  { keywords: ['donation', 'donate'],                  hint: { shape: 'circle', icon: 'heart' } },
  { keywords: ['charity'],                             hint: { shape: 'shield', icon: 'heart' } },
  { keywords: ['volunteer'],                           hint: { shape: 'stadium', icon: 'users' } },
  { keywords: ['grant', 'fundraising'],                hint: { shape: 'diamond', icon: 'coins' } },
];

// ── Resolver function ──────────────────────────────────────────────────

/**
 * Resolve an unknown entity type name to a shape + icon hint.
 * Returns null if no semantic match is found.
 *
 * @param typeName - The unknown entity type (e.g. "FundVehicle", "LegalHierarchy")
 */
export function resolveSemanticType(typeName: string): SemanticHint | null {
  const lower = typeName.toLowerCase();

  for (const entry of SEMANTIC_MAP) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        return entry.hint;
      }
    }
  }

  return null;
}
