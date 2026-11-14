// frontend/src/api/skill-intelligence.js
import client from './client';

const BASE = '/skill-intelligence';

export const skillIntelligenceApi = {
  // DB-Backed Project Templates
  getTemplates: () => client.get(`${BASE}/templates`),
  getTemplate: (id) => client.get(`${BASE}/templates/${id}`),

  // Unified Project Requirement Engine
  analyzeProjectRequirements: (payload) => client.post(`${BASE}/project-requirements/analyze`, payload),

  // SI-01: Extraction
  extract: (payload) => client.post(`${BASE}/extract`, payload),
  saveSuggestions: (payload) => client.post(`${BASE}/student-skills/suggestions`, payload),

  // SI-03: Evidence-Based Skill Profile
  getMySkills: (params) => client.get(`${BASE}/student-skills`, { params }),
  getProfileMetrics: () => client.get(`${BASE}/profile/metrics`),
  getPendingReview: () => client.get(`${BASE}/student-skills/pending`),
  addSkill: (payload) => client.post(`${BASE}/student-skills`, payload),
  submitEvidence: (skillId, payload) => client.post(`${BASE}/student-skills/${skillId}/evidence`, payload),
  reviewEvidence: (skillId, evidenceId, payload) =>
    client.post(`${BASE}/student-skills/${skillId}/evidence/${evidenceId}/review`, payload),
  updateSkill: (id, payload) => client.patch(`${BASE}/student-skills/${id}`, payload),
  confirmSkill: (id, payload) => client.post(`${BASE}/student-skills/${id}/confirm`, payload),
  rejectSkill: (id) => client.post(`${BASE}/student-skills/${id}/reject`),
  removeSkill: (id) => client.delete(`${BASE}/student-skills/${id}`),

  // SI-02: Taxonomy
  getCategories: () => client.get(`${BASE}/categories`),
  searchSkills: (q, limit = 20) => client.get(`${BASE}/skills/search`, { params: { q, limit } }),

  // SI-04: Knowledge Graph
  getMyGraph: () => client.get(`${BASE}/graph/me`),
  getRelatedSkills: (taxonomyId, limit = 10) =>
    client.get(`${BASE}/graph/skills/${taxonomyId}/related`, { params: { limit } }),
  getPrerequisites: (taxonomyId, depth = 2) =>
    client.get(`${BASE}/graph/skills/${taxonomyId}/prerequisites`, { params: { depth } }),

  // SI-05: Unified Gap Analysis
  analyzeGap: (payload) => client.post(`${BASE}/gap-analysis`, payload),
  analyzeGapVsTeam: (teamId) => client.get(`${BASE}/gap-analysis/team/${teamId}`),
};
