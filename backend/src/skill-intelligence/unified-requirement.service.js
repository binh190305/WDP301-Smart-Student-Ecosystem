/**
 * UnifiedProjectRequirementService
 * Unifies Input A (AI Free Text Extraction) and Input B (DB Template Selection)
 * into a single, standardized Project Skill Requirements pipeline.
 */
const { normalizeSkill } = require('../recommendation/skill-catalog');
const { getTemplateByIdOrCode } = require('./template.service');
const extractionService = require('./extraction.service');
const { classifyMany } = require('./classification.service');
const { getStandardCompetencies } = require('./competency-catalog');
const AppError = require('../utils/app-error');

const IMPORTANCE_WEIGHTS = {
  high: 1.5,
  medium: 1.0,
  low: 0.7,
};

const PROFICIENCY_NUMBERS = {
  beginner: 1,
  elementary: 2,
  intermediate: 3,
  advanced: 4,
  expert: 5,
};

/**
 * Process Input A (text), Input B (template), or both into unified requirements.
 *
 * @param {{ text?: string, templateId?: string, evidenceType?: string }} options
 * @returns {Promise<UnifiedRequirementResult>}
 */
const buildProjectRequirements = async ({ text = '', templateId = '', templateCode = '' }) => {
  const skillsMap = new Map(); // normalizedName -> requirement object

  let selectedTemplate = null;

  // 1. INPUT B: Load from DB Template if specified
  const targetTemplateId = templateId || templateCode;
  if (targetTemplateId) {
    selectedTemplate = await getTemplateByIdOrCode(targetTemplateId);
    if (selectedTemplate && Array.isArray(selectedTemplate.requiredSkills)) {
      for (const req of selectedTemplate.requiredSkills) {
        const normalized = normalizeSkill(req.name || req.normalizedName);
        skillsMap.set(normalized, {
          name: req.name,
          normalizedName: normalized,
          category: req.category || 'General',
          requiredLevel: req.requiredLevel || 'intermediate',
          requiredProficiencyNumber: req.requiredProficiencyNumber || PROFICIENCY_NUMBERS[req.requiredLevel] || 3,
          importance: req.importance || 'medium',
          weight: IMPORTANCE_WEIGHTS[req.importance] || 1.0,
          requiredCompetencies: req.requiredCompetencies || [],
          reasoning: req.reasoning || `Kỹ năng nòng cốt theo cấu trúc mẫu ${selectedTemplate.title}`,
          source: 'template',
        });
      }
    }
  }

  // 2. INPUT A: AI-powered extraction from text if provided
  let extractedResult = null;
  const trimmedText = (text || '').trim();
  if (trimmedText.length >= 10) {
    extractedResult = await extractionService.extractSkills(trimmedText, 'PROJECT_DESCRIPTION');
    if (extractedResult && Array.isArray(extractedResult.skills)) {
      for (const extracted of extractedResult.skills) {
        const normalized = normalizeSkill(extracted.skillName || extracted.name);
        const existing = skillsMap.get(normalized);

        const level = extracted.suggestedProficiency || 'intermediate';
        const levelNum = PROFICIENCY_NUMBERS[level] || 3;

        if (existing) {
          // Merge: Upgrade level or importance if AI indicates higher priority in the specific text
          if (levelNum > existing.requiredProficiencyNumber) {
            existing.requiredLevel = level;
            existing.requiredProficiencyNumber = levelNum;
          }
          existing.reasoning += ` | Bổ sung từ mô tả: ${extracted.reasoning || extracted.evidence || ''}`.trim();
          existing.source = 'merged';
        } else {
          // New extracted skill
          const stdComps = getStandardCompetencies(extracted.skillName || extracted.name);
          skillsMap.set(normalized, {
            name: extracted.skillName || extracted.name,
            normalizedName: normalized,
            category: extracted.category || 'General',
            requiredLevel: level,
            requiredProficiencyNumber: levelNum,
            importance: levelNum >= 4 ? 'high' : 'medium',
            weight: levelNum >= 4 ? 1.5 : 1.0,
            requiredCompetencies: stdComps.map((c) => c.name),
            reasoning: extracted.reasoning || extracted.evidence || 'Trích xuất từ mô tả dự án',
            source: 'ai_extraction',
          });
        }
      }
    }
  }

  // If both inputs were empty or yielded 0 skills
  if (skillsMap.size === 0) {
    throw new AppError('Vui lòng chọn một Dự án mẫu hoặc nhập văn bản mô tả dự án (tối thiểu 10 ký tự)', 400);
  }

  // 3. Normalization, Deduplication and Category Classification
  const requirementsList = Array.from(skillsMap.values());
  const classified = await classifyMany(requirementsList.map((r) => r.name));

  requirementsList.forEach((req) => {
    const classInfo = classified.find((c) => c.normalizedName === req.normalizedName);
    if (classInfo && classInfo.category && req.category === 'General') {
      req.category = classInfo.category;
    }
    // Ensure competencies are present
    if (!req.requiredCompetencies || req.requiredCompetencies.length === 0) {
      const comps = getStandardCompetencies(req.name);
      req.requiredCompetencies = comps.map((c) => c.name);
    }
  });

  return {
    template: selectedTemplate
      ? {
          code: selectedTemplate.code,
          title: selectedTemplate.title,
          category: selectedTemplate.category,
          description: selectedTemplate.description,
        }
      : null,
    sourceText: trimmedText,
    totalSkills: requirementsList.length,
    requirements: requirementsList,
  };
};

module.exports = {
  buildProjectRequirements,
  IMPORTANCE_WEIGHTS,
};

