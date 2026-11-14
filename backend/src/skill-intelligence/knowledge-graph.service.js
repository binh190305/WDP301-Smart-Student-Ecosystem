/**
 * KnowledgeGraphService
 * Persists and queries the adjacency-list graph of skills and categories.
 * Uses MongoDB – no graph DB required.
 */
const mongoose = require('mongoose');
const SkillRelationship = require('../models/skill-relationship.model');
const Taxonomy = require('../models/taxonomy.model');
const StudentSkill = require('../models/student-skill.model');

const MAX_DEPTH = 3; // max BFS traversal depth

// ─── Seed data: canonical relationships ──────────────────────────────────────
const SEED_RELATIONSHIPS = [
  // Prerequisites (Yêu cầu học trước - Mũi tên đỏ)
  { from: 'html/css', to: 'react', type: 'PREREQUISITE_OF', weight: 0.85 },
  { from: 'html/css', to: 'javascript', type: 'PREREQUISITE_OF', weight: 0.8 },
  { from: 'javascript', to: 'react', type: 'PREREQUISITE_OF', weight: 0.95 },
  { from: 'javascript', to: 'node.js', type: 'PREREQUISITE_OF', weight: 0.9 },
  { from: 'javascript', to: 'typescript', type: 'PREREQUISITE_OF', weight: 0.85 },
  { from: 'node.js', to: 'express', type: 'PREREQUISITE_OF', weight: 0.9 },
  { from: 'python', to: 'machine learning', type: 'PREREQUISITE_OF', weight: 0.9 },
  { from: 'python', to: 'deep learning', type: 'PREREQUISITE_OF', weight: 0.85 },
  { from: 'java', to: 'spring boot', type: 'PREREQUISITE_OF', weight: 0.9 },
  { from: 'sql', to: 'postgresql', type: 'PREREQUISITE_OF', weight: 0.75 },
  { from: 'sql', to: 'mysql', type: 'PREREQUISITE_OF', weight: 0.75 },
  { from: 'sql', to: 'sql server', type: 'PREREQUISITE_OF', weight: 0.75 },

  // Related (Quan hệ công nghệ cùng nhánh - Nét xanh dương)
  { from: 'react', to: 'typescript', type: 'RELATED_TO', weight: 0.85 },
  { from: 'node.js', to: 'express', type: 'RELATED_TO', weight: 0.95 },
  { from: 'node.js', to: 'mongodb', type: 'RELATED_TO', weight: 0.85 },
  { from: 'sql', to: 'mongodb', type: 'RELATED_TO', weight: 0.75 },
  { from: 'figma', to: 'html/css', type: 'RELATED_TO', weight: 0.8 },
  { from: 'git', to: 'react', type: 'RELATED_TO', weight: 0.75 },
  { from: 'git', to: 'node.js', type: 'RELATED_TO', weight: 0.75 },
  { from: 'docker', to: 'kubernetes', type: 'RELATED_TO', weight: 0.85 },
  { from: 'tailwind css', to: 'html/css', type: 'RELATED_TO', weight: 0.9 },
  { from: 'redux', to: 'react', type: 'RELATED_TO', weight: 0.9 },

  // Complementary (Bổ trợ hợp lực - Nét đứt màu tím)
  { from: 'react', to: 'node.js', type: 'COMPLEMENTARY_TO', weight: 0.9 },
  { from: 'docker', to: 'node.js', type: 'COMPLEMENTARY_TO', weight: 0.85 },
  { from: 'docker', to: 'react', type: 'COMPLEMENTARY_TO', weight: 0.8 },
  { from: 'express', to: 'mongodb', type: 'COMPLEMENTARY_TO', weight: 0.9 },
  { from: 'python', to: 'sql', type: 'COMPLEMENTARY_TO', weight: 0.8 },
  { from: 'figma', to: 'react', type: 'COMPLEMENTARY_TO', weight: 0.85 },
  { from: 'git', to: 'docker', type: 'COMPLEMENTARY_TO', weight: 0.8 },
  { from: 'docker', to: 'linux', type: 'COMPLEMENTARY_TO', weight: 0.8 },
];

/**
 * Seed initial graph relationships if collection is empty.
 */
const seedGraph = async () => {
  const count = await SkillRelationship.countDocuments();
  if (count > 0) return;

  // Resolve or create taxonomy entries for each skill name
  const allNames = [...new Set([...SEED_RELATIONSHIPS.map((r) => r.from), ...SEED_RELATIONSHIPS.map((r) => r.to)])];
  let taxonomies = await Taxonomy.find({ type: 'skill', normalizedName: { $in: allNames } }).lean();
  const existingNames = new Set(taxonomies.map((t) => t.normalizedName));

  const missing = allNames.filter((name) => !existingNames.has(name));
  if (missing.length > 0) {
    const docs = missing.map((name) => ({
      type: 'skill',
      name,
      normalizedName: name,
      isActive: true,
    }));
    await Taxonomy.insertMany(docs, { ordered: false }).catch(() => {});
    taxonomies = await Taxonomy.find({ type: 'skill', normalizedName: { $in: allNames } }).lean();
  }

  const nameToId = new Map(taxonomies.map((t) => [t.normalizedName, t._id]));

  const edges = [];
  for (const rel of SEED_RELATIONSHIPS) {
    const fromId = nameToId.get(rel.from);
    const toId = nameToId.get(rel.to);
    if (!fromId || !toId) continue;
    edges.push({
      fromType: 'skill',
      fromId,
      toType: 'skill',
      toId,
      relationshipType: rel.type,
      weight: rel.weight,
      source: 'system',
      isActive: true,
    });
  }

  if (edges.length > 0) {
    await SkillRelationship.insertMany(edges, { ordered: false }).catch(() => {}); // ignore duplicate errors
  }
};

/**
 * Get skills related to a given taxonomy ID (1 hop).
 * @param {string} taxonomyId
 * @param {{ types?: string[], limit?: number }} opts
 */
const getRelatedSkills = async (taxonomyId, { types, limit = 10 } = {}) => {
  const id = new mongoose.Types.ObjectId(taxonomyId);
  const typeFilter = types?.length ? { $in: types } : { $exists: true };

  const outgoing = await SkillRelationship.find({
    fromId: id,
    fromType: 'skill',
    isActive: true,
    relationshipType: typeFilter,
  })
    .limit(limit)
    .lean();

  const incoming = await SkillRelationship.find({
    toId: id,
    toType: 'skill',
    isActive: true,
    relationshipType: typeFilter,
  })
    .limit(limit)
    .lean();

  const targetIds = [
    ...outgoing.map((r) => ({ id: r.toId, type: r.relationshipType, direction: 'outgoing', weight: r.weight })),
    ...incoming.map((r) => ({ id: r.fromId, type: r.relationshipType, direction: 'incoming', weight: r.weight })),
  ];

  const uniqueIds = [...new Map(targetIds.map((t) => [t.id.toString(), t])).values()];

  const related = await Taxonomy.find({
    _id: { $in: uniqueIds.map((t) => t.id) },
    isActive: true,
  }).lean();

  const relatedMap = new Map(related.map((t) => [t._id.toString(), t]));

  return uniqueIds
    .map((t) => ({ ...relatedMap.get(t.id.toString()), relationship: t.type, direction: t.direction, weight: t.weight }))
    .filter((r) => r._id);
};

/**
 * Get prerequisite skills (BFS up to MAX_DEPTH hops).
 */
const getPrerequisites = async (taxonomyId, depth = 1) => {
  const visited = new Set();
  const results = [];
  const queue = [{ id: new mongoose.Types.ObjectId(taxonomyId), depth: 0 }];
  visited.add(taxonomyId.toString());

  while (queue.length > 0) {
    const { id, depth: d } = queue.shift();
    if (d >= Math.min(depth, MAX_DEPTH)) continue;

    const rels = await SkillRelationship.find({
      toId: id,
      toType: 'skill',
      fromType: 'skill',
      relationshipType: 'PREREQUISITE_OF',
      isActive: true,
    }).lean();

    for (const rel of rels) {
      const fromId = rel.fromId.toString();
      if (visited.has(fromId)) continue;
      visited.add(fromId);
      const tax = await Taxonomy.findById(rel.fromId).lean();
      if (tax) {
        results.push({ ...tax, depth: d + 1, weight: rel.weight });
        queue.push({ id: rel.fromId, depth: d + 1 });
      }
    }
  }

  return results;
};

/**
 * Get the knowledge sub-graph for a specific student.
 * Returns nodes (student + skills + categories) and edges.
 */
const getStudentGraph = async (studentId) => {
  const skills = await StudentSkill.find({
    student: studentId,
    isActive: true,
    status: { $in: ['student_declared', 'confirmed', 'ai_suggested'] },
  })
    .populate('taxonomy', 'name normalizedName type description')
    .lean();

  const nodes = [];
  const edges = [];

  // Student node
  const User = mongoose.model('User');
  const user = await User.findById(studentId).select('name').lean();
  nodes.push({ id: studentId.toString(), type: 'student', label: user?.name || 'Tôi' });

  const nodeMapByNorm = new Map();
  const nodeMapByTaxId = new Map();
  const taxonomyIds = [];

  for (const skill of skills) {
    const taxId = skill.taxonomy?._id?.toString() || null;
    const nodeId = taxId || `skill-${skill.normalizedName}`;

    nodeMapByNorm.set(skill.normalizedName, nodeId);
    if (taxId) {
      nodeMapByTaxId.set(taxId, nodeId);
      taxonomyIds.push(skill.taxonomy._id);
    }

    if (!nodes.find((n) => n.id === nodeId)) {
      nodes.push({
        id: nodeId,
        type: 'skill',
        label: skill.skillName,
        normalizedName: skill.normalizedName,
        category: skill.aiCategory,
        proficiency: skill.proficiency,
        proficiencyLevel: skill.proficiencyLevel,
        status: skill.status,
        classification: skill.classification || 'self_reported',
        verificationStatus: skill.verificationStatus || 'SELF_REPORTED',
        proficiencyScore: skill.proficiencyScore || null,
        evidenceCount: Array.isArray(skill.evidence) ? skill.evidence.length : 0,
        competenciesCount: Array.isArray(skill.competencies) ? skill.competencies.length : 0,
      });
    }

    edges.push({
      from: studentId.toString(),
      to: nodeId,
      type: 'HAS_SKILL',
      proficiency: skill.proficiency,
      proficiencyLevel: skill.proficiencyLevel,
      classification: skill.classification || 'self_reported',
    });
  }

  const edgeSet = new Set();

  // 1. Resolve relationships between student skills from SEED_RELATIONSHIPS
  for (const rel of SEED_RELATIONSHIPS) {
    const fromNodeId = nodeMapByNorm.get(rel.from);
    const toNodeId = nodeMapByNorm.get(rel.to);
    if (fromNodeId && toNodeId && fromNodeId !== toNodeId) {
      const key = `${fromNodeId}->${toNodeId}:${rel.type}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({
          from: fromNodeId,
          to: toNodeId,
          type: rel.type,
          weight: rel.weight || 0.8,
        });
      }
    }
  }

  // 2. Fetch relationships between these skills from DB if available
  if (taxonomyIds.length > 0) {
    const rels = await SkillRelationship.find({
      fromId: { $in: taxonomyIds },
      toId: { $in: taxonomyIds },
      isActive: true,
    }).lean();

    for (const rel of rels) {
      const fromNodeId = nodeMapByTaxId.get(rel.fromId.toString());
      const toNodeId = nodeMapByTaxId.get(rel.toId.toString());
      if (fromNodeId && toNodeId && fromNodeId !== toNodeId) {
        const key = `${fromNodeId}->${toNodeId}:${rel.relationshipType}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            from: fromNodeId,
            to: toNodeId,
            type: rel.relationshipType,
            weight: rel.weight,
          });
        }
      }
    }
  }

  return { nodes, edges };
};

/**
 * Upsert a skill relationship (admin / AI suggested).
 */
const upsertRelationship = async ({ fromId, toId, relationshipType, weight = 0.5, source = 'admin' }) => {
  return SkillRelationship.findOneAndUpdate(
    { fromId, toId, relationshipType },
    { fromType: 'skill', toType: 'skill', weight, source, isActive: true },
    { upsert: true, new: true }
  );
};

/**
 * Search taxonomy skills with optional text filter.
 */
const searchSkills = async ({ q, type = 'skill', limit = 20 }) => {
  const filter = { type, isActive: true };
  if (q) filter.$text = { $search: q };
  return Taxonomy.find(filter).limit(limit).lean();
};

module.exports = { seedGraph, getRelatedSkills, getPrerequisites, getStudentGraph, upsertRelationship, searchSkills };

