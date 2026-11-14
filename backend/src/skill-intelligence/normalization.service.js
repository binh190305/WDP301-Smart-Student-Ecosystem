/**
 * SkillNormalizationService
 * Deterministic normalization of raw skill names.
 * Reuses existing normalizeSkill() from skill-catalog.
 */
const { normalizeSkill } = require('../recommendation/skill-catalog');

// Inline known skills list (mirrors skill-catalog SKILL_ROLES keys)
const KNOWN_SKILLS = new Set([
  'javascript','typescript','react','html/css','vue','angular','webflow',
  'node.js','express','java','spring boot','c#','.net','mongodb','mysql',
  'postgresql','sql server','sql','system design','algorithms','react native',
  'flutter','kotlin','swift','python','machine learning','tensorflow','pandas',
  'data analysis','recommender system','deep learning','figma','ui/ux',
  'photoshop','illustrator','docker','kubernetes','linux','network security',
  'web security','reverse engineering','business analysis','project management',
  'excel','content marketing','seo','canva','social media',
]);

/**
 * Normalise a single skill name.
 * @param {string} rawName
 * @returns {{ normalizedName: string, isKnown: boolean, aliasUsed: boolean, displayName: string }}
 */
const normalize = (rawName) => {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) {
    return {
      normalizedName: '',
      isKnown: false,
      aliasUsed: false,
      displayName: '',
    };
  }

  const normalizedName = normalizeSkill(trimmed);
  const aliasUsed = normalizedName !== trimmed.toLowerCase();
  const isKnown = KNOWN_SKILLS.has(normalizedName);

  return {
    normalizedName,
    isKnown,
    aliasUsed,
    displayName: trimmed,
  };
};

/**
 * Normalise an array of skills and deduplicate by normalizedName.
 * @param {string[]} rawNames
 * @returns {Array<{normalizedName: string, isKnown: boolean, aliasUsed: boolean, displayName: string}>}
 */
const normalizeMany = (rawNames) => {
  const seen = new Set();
  const results = [];

  for (const raw of rawNames || []) {
    if (!raw || !String(raw).trim()) continue;
    const item = normalize(raw);
    if (!item.normalizedName) continue;
    if (!seen.has(item.normalizedName)) {
      seen.add(item.normalizedName);
      results.push(item);
    }
  }

  return results;
};

const PROFICIENCY_MAP = {
  beginner: 'beginner',
  elementary: 'elementary',
  intermediate: 'intermediate',
  advanced: 'advanced',
  expert: 'expert',
  // Common LLM variations
  basic: 'beginner',
  novice: 'beginner',
  junior: 'elementary',
  mid: 'intermediate',
  senior: 'advanced',
  principal: 'expert',
  1: 'beginner',
  2: 'elementary',
  3: 'intermediate',
  4: 'advanced',
  5: 'expert',
};

/**
 * Normalise a proficiency label from any source.
 * Always caps AI suggestions at 'intermediate' unless evidence is strong.
 * @param {string|number} raw
 * @param {boolean} capAtIntermediate
 * @returns {string}
 */
const normalizeProficiency = (raw, capAtIntermediate = true) => {
  const key = String(raw || '').toLowerCase().trim();
  const level = PROFICIENCY_MAP[key] || PROFICIENCY_MAP[Number(raw)] || 'beginner';
  if (capAtIntermediate) {
    const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
    const idx = LEVELS.indexOf(level);
    return idx > 2 ? 'intermediate' : level; // cap at index 2 = intermediate
  }
  return level;
};

module.exports = { normalize, normalizeMany, normalizeProficiency };
