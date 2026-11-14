/**
 * SkillClassificationService
 * Maps normalized skill names to Taxonomy entries (type:'skill' or type:'category').
 * Creates pending taxonomy entries for unknown skills.
 */
const mongoose = require('mongoose');
const Taxonomy = require('../models/taxonomy.model');
const { rolesForSkill } = require('../recommendation/skill-catalog');

// Category mapping from skill-catalog role keys → readable category names
const ROLE_TO_CATEGORY = {
  frontend: 'Frontend Development',
  backend: 'Backend Development',
  mobile: 'Mobile Development',
  ai_data: 'Artificial Intelligence',
  ui_ux: 'UI/UX Design',
  devops_security: 'DevOps & Cloud',
  ba_pm: 'Project Management',
  marketing: 'Communication',
};

// Inline skill→category mapping (derived from skill-catalog)
const SKILL_CATEGORY_MAP = (() => {
  const allSkills = [
    'javascript','typescript','react','html/css','vue','angular','webflow',
    'node.js','express','java','spring boot','c#','.net','mongodb','mysql',
    'postgresql','sql server','sql','system design','algorithms','react native',
    'flutter','kotlin','swift','python','machine learning','tensorflow','pandas',
    'data analysis','recommender system','deep learning','figma','ui/ux',
    'photoshop','illustrator','docker','kubernetes','linux','network security',
    'web security','reverse engineering','business analysis','project management',
    'excel','content marketing','seo','canva','social media',
  ];
  const map = {};
  for (const skill of allSkills) {
    const roles = rolesForSkill(skill);
    map[skill] = roles.length > 0 ? ROLE_TO_CATEGORY[roles[0]] || 'Software Engineering' : 'Software Engineering';
  }
  return map;
})();

/**
 * Determine the human-readable category for a normalized skill name.
 * @param {string} normalizedName
 * @returns {string}
 */
const inferCategory = (normalizedName) =>
  SKILL_CATEGORY_MAP[normalizedName] || 'Software Engineering';

/**
 * Find or create a Taxonomy skill entry.
 * If the skill doesn't exist, creates it as active (admin can deactivate later).
 * @param {string} normalizedName
 * @param {string} displayName
 * @returns {Promise<{ taxonomy: TaxonomyDoc, created: boolean }>}
 */
const findOrCreateSkillTaxonomy = async (normalizedName, displayName) => {
  if (mongoose.connection.readyState !== 1) {
    return {
      taxonomy: { _id: null, name: displayName, normalizedName },
      created: false,
    };
  }
  let taxonomy = await Taxonomy.findOne({ type: 'skill', normalizedName }).lean();
  let created = false;
  if (!taxonomy) {
    try {
      const doc = await Taxonomy.create({
        type: 'skill',
        name: displayName || normalizedName,
        normalizedName,
        description: '',
        isActive: true,
      });
      taxonomy = doc.toObject();
      created = true;
    } catch (err) {
      // Race condition: another request created it first
      if (err.code === 11000) {
        taxonomy = await Taxonomy.findOne({ type: 'skill', normalizedName }).lean();
      } else {
        throw err;
      }
    }
  }
  return { taxonomy, created };
};

/**
 * Classify an array of normalized skill names:
 * returns taxonomy ID, category name, and whether the taxonomy entry was new.
 */
const classifyMany = async (skills) => {
  const results = [];
  for (const { normalizedName, displayName } of skills) {
    const category = inferCategory(normalizedName);
    const { taxonomy, created } = await findOrCreateSkillTaxonomy(normalizedName, displayName);
    results.push({ normalizedName, displayName, category, taxonomyId: taxonomy._id, created });
  }
  return results;
};

/**
 * Get the full category tree (categories + their children).
 */
const getCategoryTree = async () => {
  const all = await Taxonomy.find({ type: 'category', isActive: true }).lean();
  // Build hierarchy using parentId
  const byId = new Map(all.map((c) => [c._id.toString(), { ...c, children: [] }]));
  const roots = [];
  for (const cat of byId.values()) {
    const parentId = cat.parentId?.toString();
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(cat);
    } else {
      roots.push(cat);
    }
  }
  return roots;
};

module.exports = { inferCategory, findOrCreateSkillTaxonomy, classifyMany, getCategoryTree };

