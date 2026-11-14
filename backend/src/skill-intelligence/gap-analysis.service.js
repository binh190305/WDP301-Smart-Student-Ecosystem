/**
 * SkillGapAnalysisService
 * Evidence-Based Project Readiness & Skill Gap Analysis Engine.
 *
 * Evaluates student readiness based on:
 *  1. Target Skill Proficiency Level vs Student Level
 *  2. Evidence Quality & Classification (Verified vs Assessed vs Self-Reported)
 *  3. Competency Coverage (Demonstrated competencies vs Required)
 *  4. Skill Importance Weight (High, Medium, Low)
 */
const StudentSkill = require('../models/student-skill.model');
const { PROFICIENCY_NUMBERS } = StudentSkill;
const { normalizeSkill } = require('../recommendation/skill-catalog');
const { buildRemediationList } = require('./remediation.service');

const PROFICIENCY_LABELS = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

const IMPORTANCE_WEIGHTS = {
  high: 1.5,
  medium: 1.0,
  low: 0.7,
};

const EVIDENCE_QUALITY_MULTIPLIERS = {
  verified: 1.0,     // 100% empirical credibility
  assessed: 0.85,    // 85% credibility (passed quiz, graded assignment)
  self_reported: 0.45, // 45% credibility (unverified self-claim)
};

/**
 * Parse a target skill list from various input formats.
 */
const parseTarget = (targetSkills) => {
  if (!Array.isArray(targetSkills)) return [];
  return targetSkills.map((item) => {
    if (typeof item === 'string') {
      return {
        name: item,
        normalizedName: normalizeSkill(item),
        minProficiencyLevel: 3,
        requiredLevel: 'intermediate',
        importance: 'medium',
        weight: 1.0,
        requiredCompetencies: [],
        reasoning: '',
        label: item,
      };
    }
    const name = item.name || item.skillName || item.label || '';
    const normalized = normalizeSkill(name);
    const minLevel =
      PROFICIENCY_NUMBERS[item.minProficiency] ||
      PROFICIENCY_NUMBERS[item.requiredLevel] ||
      PROFICIENCY_NUMBERS[item.proficiency] ||
      Number(item.minLevel) ||
      Number(item.minProficiencyLevel) ||
      Number(item.requiredProficiencyNumber) ||
      3;

    const importance = item.importance || (minLevel >= 4 ? 'high' : 'medium');
    const weight = item.weight || IMPORTANCE_WEIGHTS[importance] || 1.0;

    return {
      name,
      label: name,
      normalizedName: normalized,
      minProficiencyLevel: minLevel,
      requiredLevel: item.requiredLevel || Object.keys(PROFICIENCY_NUMBERS).find((k) => PROFICIENCY_NUMBERS[k] === minLevel) || 'intermediate',
      importance,
      weight,
      requiredCompetencies: item.requiredCompetencies || [],
      reasoning: item.reasoning || '',
      category: item.category || 'General',
    };
  });
};

/**
 * Perform evidence-based skill gap analysis.
 *
 * @param {string} studentId
 * @param {{ targetSkills: Array, projectDescription?: string }} opts
 * @returns {Promise<GapAnalysisResult>}
 */
const analyzeGap = async (studentId, { targetSkills = [], projectDescription = '' }) => {
  const parsedTarget = parseTarget(targetSkills);
  if (parsedTarget.length === 0) {
    return {
      matched: [],
      partial: [],
      missing: [],
      readinessScore: 0,
      dataCoverage: 0,
      evidenceExplanation: 'Không có danh sách kỹ năng mục tiêu để phân tích.',
      learningRoadmap: [],
    };
  }

  // Load student skills (including classification, verificationStatus, competencies, evidence)
  const studentSkills = await StudentSkill.find({
    student: studentId,
    isActive: true,
  }).lean();

  const skillMap = new Map();
  studentSkills.forEach((s) => {
    skillMap.set(s.normalizedName, s);
  });

  const matched = [];
  const partial = [];
  const missing = [];

  let weightedScoreSum = 0;
  let totalWeights = 0;
  let empiricalEvidenceCount = 0; // assessed or verified count

  for (const target of parsedTarget) {
    const sDoc = skillMap.get(target.normalizedName) || skillMap.get(normalizeSkill(target.name));
    const targetWeight = target.weight || IMPORTANCE_WEIGHTS[target.importance] || 1.0;
    totalWeights += targetWeight;

    if (!sDoc) {
      // 1. MISSING SKILL
      missing.push({
        skillName: target.name,
        normalizedName: target.normalizedName,
        category: target.category,
        requiredLevel: target.minProficiencyLevel,
        requiredLabel: PROFICIENCY_LABELS[target.minProficiencyLevel] || 'Intermediate',
        importance: target.importance,
        gap: target.minProficiencyLevel,
        priority: target.minProficiencyLevel * targetWeight,
        reasoning: target.reasoning,
        requiredCompetencies: target.requiredCompetencies,
      });
      continue;
    }

    const studentLevel = sDoc.proficiencyLevel || 1;
    const classification = sDoc.classification || 'self_reported';
    const verificationStatus = sDoc.verificationStatus || 'SELF_REPORTED';

    if (['assessed', 'verified'].includes(classification)) {
      empiricalEvidenceCount++;
    }

    // Evidence credibility multiplier
    const evidenceQuality = EVIDENCE_QUALITY_MULTIPLIERS[classification] || 0.45;

    // Competency coverage calculation
    const reqComps = target.requiredCompetencies || [];
    const studentComps = sDoc.competencies || [];
    const demonstrated = reqComps.filter((rc) =>
      studentComps.some(
        (sc) =>
          sc.name.toLowerCase().includes(rc.toLowerCase()) &&
          ['competent', 'mastered'].includes(sc.status)
      )
    );
    const compCoverageRatio = reqComps.length > 0
      ? (demonstrated.length + 1) / (reqComps.length + 1)
      : 1.0;

    // Level ratio
    const levelRatio = Math.min(1.0, studentLevel / target.minProficiencyLevel);

    // Contribution to readiness score
    const skillReadiness = targetWeight * levelRatio * evidenceQuality * compCoverageRatio;
    weightedScoreSum += skillReadiness;

    const baseItem = {
      skillName: target.name,
      normalizedName: target.normalizedName,
      category: target.category || sDoc.aiCategory,
      studentLevel,
      studentLabel: PROFICIENCY_LABELS[studentLevel] || 'Beginner',
      requiredLevel: target.minProficiencyLevel,
      requiredLabel: PROFICIENCY_LABELS[target.minProficiencyLevel] || 'Intermediate',
      importance: target.importance,
      classification,
      verificationStatus,
      proficiencyScore: sDoc.proficiencyScore || null,
      aiConfidence: sDoc.aiConfidence || sDoc.confidence || null,
      evidenceQuality: Math.round(evidenceQuality * 100),
      demonstratedCompetencies: demonstrated,
      missingCompetencies: reqComps.filter((rc) => !demonstrated.includes(rc)),
      evidenceCount: Array.isArray(sDoc.evidence) ? sDoc.evidence.length : 0,
      reasoning: target.reasoning,
    };

    if (studentLevel >= target.minProficiencyLevel) {
      // 2. MATCHED SKILL
      matched.push({
        ...baseItem,
        matchType: classification === 'verified' ? 'verified_match' : classification === 'assessed' ? 'assessed_match' : 'self_reported_match',
        surplus: studentLevel - target.minProficiencyLevel,
      });
    } else {
      // 3. PARTIAL SKILL
      partial.push({
        ...baseItem,
        gap: target.minProficiencyLevel - studentLevel,
        priority: (target.minProficiencyLevel - studentLevel) * targetWeight,
      });
    }
  }

  // Calculate final transparent readiness score
  const readinessScore = totalWeights > 0 ? Math.round((weightedScoreSum / totalWeights) * 100) : 0;
  const dataCoverage = Math.round((empiricalEvidenceCount / parsedTarget.length) * 100);

  // Build evidence explanation narrative
  const verifiedMatches = matched.filter((m) => m.classification === 'verified').map((m) => m.skillName);
  const assessedMatches = matched.filter((m) => m.classification === 'assessed').map((m) => m.skillName);
  const selfMatches = matched.filter((m) => m.classification === 'self_reported').map((m) => m.skillName);

  let explanationParts = [];
  if (verifiedMatches.length > 0) {
    explanationParts.push(`Đã xác thực chính thức: ${verifiedMatches.join(', ')}.`);
  }
  if (assessedMatches.length > 0) {
    explanationParts.push(`Đã đánh giá qua bài kiểm tra/quiz: ${assessedMatches.join(', ')}.`);
  }
  if (selfMatches.length > 0) {
    explanationParts.push(`Tự khai báo (cần bổ sung bằng chứng để tăng độ tin cậy): ${selfMatches.join(', ')}.`);
  }
  if (partial.length > 0) {
    explanationParts.push(`Cần nâng cấp cấp độ: ${partial.map((p) => `${p.skillName} (hiện tại: ${p.studentLabel} ➔ cần: ${p.requiredLabel})`).join(', ')}.`);
  }
  if (missing.length > 0) {
    explanationParts.push(`Còn thiếu hoàn toàn: ${missing.map((m) => m.skillName).join(', ')}.`);
  }

  const evidenceExplanation = explanationParts.join('\n\n');

  // Build Learning Roadmap for missing and partial skills
  const skillsToLearn = [
    ...missing.map((m) => ({ name: m.skillName, gap: m.gap, priority: m.priority })),
    ...partial.map((p) => ({ name: p.skillName, gap: p.gap, priority: p.priority })),
  ].sort((a, b) => b.priority - a.priority);

  const skillsToRemediate = skillsToLearn.map((s) => ({
    skillName: s.name,
    normalizedName: (s.name || '').toLowerCase().trim(),
    gap: s.gap,
  }));
  const remediation = await buildRemediationList(skillsToRemediate, studentId);

  const learningRoadmap = skillsToLearn.map((s, idx) => {
    const rem = remediation.find(
      (r) => (r.skillName || r.normalizedName || '').toLowerCase() === (s.name || '').toLowerCase()
    ) || {
      course: null,
      courses: [],
      materials: [],
      quiz: null,
      quizzes: [],
    };

    return {
      step: idx + 1,
      skillName: s.name,
      gap: s.gap,
      priority: s.priority,
      recommendedCourses: rem.course ? [rem.course] : (rem.courses || []),
      recommendedMaterials: rem.materials || [],
      recommendedQuizzes: rem.quiz ? [rem.quiz] : (rem.quizzes || []),
      youtube: rem.youtube || null,
      practiceQuestions: rem.practiceQuestions || [],
    };
  });

  return {
    readinessScore,
    dataCoverage,
    totalRequirements: parsedTarget.length,
    matchedCount: matched.length,
    partialCount: partial.length,
    missingCount: missing.length,
    matched,
    partial,
    missing,
    evidenceExplanation,
    learningRoadmap,
  };
};

module.exports = {
  analyzeGap,
  parseTarget,
  IMPORTANCE_WEIGHTS,
  EVIDENCE_QUALITY_MULTIPLIERS,
};
