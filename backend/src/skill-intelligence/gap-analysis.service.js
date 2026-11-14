/**
 * SkillGapAnalysisService
 * Deterministic comparison of student skills vs. target requirements.
 * LLM is used ONLY for generating the explanation narrative.
 */
const StudentSkill = require('../models/student-skill.model');
const { PROFICIENCY_NUMBERS } = StudentSkill;
const Taxonomy = require('../models/taxonomy.model');
const { normalizeSkill } = require('../recommendation/skill-catalog');
const { completeJson, isLlmEnabled } = require('../recommendation/llm/client');
const { buildRemediationList } = require('./remediation.service');

const PROFICIENCY_LABELS = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

/**
 * Parse a target skill list from various input formats.
 * Accepts: [{ name, minProficiency }] or [string] or a team object.
 */
const parseTarget = (targetSkills) => {
  if (!Array.isArray(targetSkills)) return [];
  return targetSkills.map((item) => {
    if (typeof item === 'string') {
      return { normalizedName: normalizeSkill(item), minProficiencyLevel: 3, label: item };
    }
    const normalized = normalizeSkill(item.name || item.skillName || '');
    const minLevel =
      PROFICIENCY_NUMBERS[item.minProficiency] ||
      PROFICIENCY_NUMBERS[item.proficiency] ||
      Number(item.minLevel) ||
      Number(item.minProficiencyLevel) ||
      3;
    return { normalizedName: normalized, minProficiencyLevel: minLevel, label: item.name || normalized };
  });
};

/**
 * Perform skill gap analysis.
 * @param {string} studentId
 * @param {{ targetSkills, teamId?, projectDescription? }} opts
 * @returns {Promise<GapAnalysisResult>}
 */
const analyzeGap = async (studentId, { targetSkills = [], projectDescription = '' }) => {
  const parsedTarget = parseTarget(targetSkills);
  if (parsedTarget.length === 0) {
    return {
      matched: [],
      partial: [],
      missing: [],
      learningPriority: [],
      coverageScore: 0,
      explanation: 'Không có kỹ năng mục tiêu để phân tích.',
    };
  }

  // Load confirmed student skills
  const studentSkills = await StudentSkill.find({
    student: studentId,
    isActive: true,
    status: { $in: ['student_declared', 'confirmed'] },
  }).lean();

  const skillMap = new Map(studentSkills.map((s) => [s.normalizedName, s.proficiencyLevel]));

  const matched = [];
  const partial = [];
  const missing = [];

  for (const target of parsedTarget) {
    const studentLevel = skillMap.get(target.normalizedName) ?? skillMap.get(normalizeSkill(target.label));

    if (studentLevel === undefined) {
      missing.push({
        skillName: target.label,
        normalizedName: target.normalizedName,
        requiredLevel: target.minProficiencyLevel,
        requiredLabel: PROFICIENCY_LABELS[target.minProficiencyLevel] || 'Intermediate',
        gap: target.minProficiencyLevel,
        priority: target.minProficiencyLevel, // higher required level → higher priority
      });
    } else if (studentLevel >= target.minProficiencyLevel) {
      matched.push({
        skillName: target.label,
        normalizedName: target.normalizedName,
        studentLevel,
        studentLabel: PROFICIENCY_LABELS[studentLevel],
        requiredLevel: target.minProficiencyLevel,
        surplus: studentLevel - target.minProficiencyLevel,
      });
    } else {
      partial.push({
        skillName: target.label,
        normalizedName: target.normalizedName,
        studentLevel,
        studentLabel: PROFICIENCY_LABELS[studentLevel],
        requiredLevel: target.minProficiencyLevel,
        requiredLabel: PROFICIENCY_LABELS[target.minProficiencyLevel],
        gap: target.minProficiencyLevel - studentLevel,
        priority: target.minProficiencyLevel - studentLevel,
      });
    }
  }

  // Coverage score: (fully matched + partial*0.5) / total
  const coverageScore =
    parsedTarget.length > 0
      ? Math.round(((matched.length + partial.length * 0.5) / parsedTarget.length) * 100)
      : 0;

  // Learning priority = missing (by required level desc) then partial (by gap desc)
  const learningPriority = [
    ...missing.sort((a, b) => b.priority - a.priority),
    ...partial.sort((a, b) => b.priority - a.priority),
  ].map((s, idx) => ({ rank: idx + 1, ...s }));

  // Generate actionable 4-pillar remediation roadmap (Courses, Materials, YouTube, Quizzes)
  const weakAndMissing = [...partial, ...missing];
  const remediation = await buildRemediationList(weakAndMissing, studentId);

  // ── LLM explanation (optional) ─────────────────────────────────────────────
  let explanation = buildTemplateExplanation({ matched, partial, missing, coverageScore });

  if (isLlmEnabled() && (missing.length > 0 || partial.length > 0)) {
    try {
      const schema = {
        type: 'object',
        properties: {
          explanation: {
            type: 'string',
            description: 'Giải thích phân tích kỹ năng bằng tiếng Việt, 2-4 câu.',
          },
        },
        required: ['explanation'],
      };
      const result = await completeJson({
        system:
          'Bạn là trợ lý tư vấn học tập. Đưa ra đánh giá ngắn gọn, khuyến khích và cụ thể về khoảng cách kỹ năng. Tối đa 4 câu.',
        user: JSON.stringify({ matched, partial, missing, projectDescription, coverageScore }),
        schema,
        maxTokens: 400,
      });
      if (result?.explanation && result.explanation.length < 800) {
        explanation = result.explanation;
      }
    } catch (_) {
      // Fall back to template
    }
  }

  return { matched, partial, missing, learningPriority, coverageScore, explanation, remediation };
};

const buildTemplateExplanation = ({ matched, partial, missing, coverageScore }) => {
  const parts = [];
  if (matched.length > 0) {
    parts.push(`Bạn đáp ứng ${matched.length} kỹ năng yêu cầu: ${matched.map((s) => s.skillName).join(', ')}.`);
  }
  if (partial.length > 0) {
    parts.push(`Cần cải thiện ${partial.length} kỹ năng: ${partial.map((s) => s.skillName).join(', ')}.`);
  }
  if (missing.length > 0) {
    parts.push(`Còn thiếu ${missing.length} kỹ năng: ${missing.map((s) => s.skillName).join(', ')}.`);
  }
  parts.push(`Tỷ lệ đáp ứng tổng thể: ${coverageScore}%.`);
  return parts.join(' ');
};

module.exports = { analyzeGap };

