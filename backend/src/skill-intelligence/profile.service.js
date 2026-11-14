/**
 * SkillProfileService
 * Evidence-Based Skill Profile Management.
 * Enforces strict separation between:
 *  - Self-reported Skills (unverified, self-declared)
 *  - Assessed Skills (empirically evaluated via Quiz, Assignment, Practical, Rubric)
 *  - Verified Skills (officially reviewed by Lecturer / Admin / Verified Certificate)
 */
const mongoose = require('mongoose');
const StudentSkill = require('../models/student-skill.model');
const { QuizAttempt, Submission, Assignment } = require('../models');
const { PROFICIENCY_LEVELS, PROFICIENCY_NUMBERS } = StudentSkill;
const { getStandardCompetencies, evaluateEvidenceRelevance } = require('./competency-catalog');
const AppError = require('../utils/app-error');

/**
 * Get profile metrics summary.
 */
const getProfileMetrics = async (studentId) => {
  const skills = await StudentSkill.find({ student: studentId, isActive: true }).lean();

  let totalSkills = skills.length;
  let selfReportedCount = 0;
  let assessedCount = 0;
  let verifiedCount = 0;
  let requiringEvidenceCount = 0;

  for (const s of skills) {
    if (s.classification === 'verified' || s.verificationStatus === 'VERIFIED') {
      verifiedCount++;
    } else if (s.classification === 'assessed' || s.verificationStatus === 'ASSESSED') {
      assessedCount++;
    } else {
      selfReportedCount++;
    }

    const hasValidEvidence = Array.isArray(s.evidence) && s.evidence.length > 0;
    if (!hasValidEvidence && s.classification !== 'verified') {
      requiringEvidenceCount++;
    }
  }

  return {
    totalSkills,
    selfReportedCount,
    assessedCount,
    verifiedCount,
    requiringEvidenceCount,
  };
};

/**
 * Get student active skill profile.
 */
const getProfile = async (studentId, filters = {}) => {
  const query = { student: studentId, isActive: true };
  if (filters.status) query.status = filters.status;
  if (filters.classification) query.classification = filters.classification;
  if (filters.taxonomyId) query.taxonomy = filters.taxonomyId;

  const skills = await StudentSkill.find(query)
    .populate('taxonomy', 'name normalizedName type description')
    .sort({ proficiencyLevel: -1, updatedAt: -1 })
    .lean();

  const metrics = await getProfileMetrics(studentId);

  return {
    skills,
    metrics,
  };
};

/**
 * Add a skill manually by student.
 * RULE: Always creates as self_reported. Never verified automatically.
 */
const addManualSkill = async (studentId, { skillName, proficiency, evidence }) => {
  if (!skillName || typeof skillName !== 'string' || !skillName.trim()) {
    throw new AppError('Tên kỹ năng không được để trống', 400);
  }

  const normalizedName = skillName.trim().toLowerCase().replace(/\s+/g, ' ');
  const validProficiency = PROFICIENCY_LEVELS.includes(proficiency) ? proficiency : 'beginner';
  const proficiencyLevel = PROFICIENCY_NUMBERS[validProficiency] || 1;

  const existing = await StudentSkill.findOne({ student: studentId, normalizedName });

  if (existing) {
    if (existing.status === 'rejected') {
      throw new AppError('Kỹ năng này đã bị từ chối trước đó.', 409);
    }
    // Update proficiency if higher
    if (proficiencyLevel > existing.proficiencyLevel) {
      existing.proficiency = validProficiency;
      existing.proficiencyLevel = proficiencyLevel;
    }
    if (evidence) {
      existing.evidence.push({
        evidenceType: 'MANUAL',
        title: 'Khai báo thủ công',
        description: evidence,
        source: 'Self-reported',
        sourceText: evidence,
        verificationStatus: 'SELF_REPORTED',
      });
    }
    existing.lastAssessedAt = new Date();
    await existing.save();
    return existing;
  }

  const standardComps = getStandardCompetencies(skillName);

  const initialEvidence = evidence
    ? [
        {
          evidenceType: 'MANUAL',
          title: 'Khai báo ban đầu',
          description: evidence,
          source: 'Self-reported',
          sourceText: evidence,
          verificationStatus: 'SELF_REPORTED',
        },
      ]
    : [];

  const skill = await StudentSkill.create({
    student: studentId,
    skillName: skillName.trim(),
    normalizedName,
    proficiency: validProficiency,
    proficiencyLevel,
    classification: 'self_reported',
    verificationStatus: 'SELF_REPORTED',
    status: 'student_declared',
    assessmentMethod: 'self_reported',
    competencies: standardComps,
    evidence: initialEvidence,
    lastAssessedAt: new Date(),
  });

  return skill;
};

/**
 * Upsert AI-extracted skill suggestions.
 * RULE: Suggestions are saved as ai_suggested and self_reported until evidence is evaluated.
 */
const upsertAISuggestions = async (studentId, extractedSkills) => {
  const results = { created: [], updated: [], skipped: [] };

  for (const s of extractedSkills) {
    const existing = await StudentSkill.findOne({
      student: studentId,
      normalizedName: s.normalizedName,
    });

    if (existing) {
      if (['student_declared', 'confirmed'].includes(existing.status)) {
        // Add evidence trail without overwriting existing status
        existing.evidence.push({
          evidenceType: s.evidenceType || 'PROJECT_DESCRIPTION',
          title: 'Trích xuất từ văn bản đề tài/CV',
          description: s.reasoning || '',
          sourceText: s.evidence || '',
          verificationStatus: 'AI_ANALYZED',
          assessmentResult: {
            score: s.confidence ? Math.round(s.confidence * 100) : null,
            rubric: 'AI Natural Language Extraction',
            feedback: s.reasoning || '',
          },
        });
        await existing.save();
        results.skipped.push(s.normalizedName);
        continue;
      }
      if (existing.status === 'rejected') {
        results.skipped.push(s.normalizedName);
        continue;
      }
      // Status is ai_suggested → update metadata
      existing.aiConfidence = s.confidence;
      existing.confidence = s.confidence;
      existing.extractionBatchId = s.batchId;
      existing.aiCategory = s.category;
      existing.evidence.push({
        evidenceType: s.evidenceType || 'PROJECT_DESCRIPTION',
        title: 'Trích xuất đề tài/CV',
        description: s.reasoning || '',
        sourceText: s.evidence || '',
        verificationStatus: 'AI_ANALYZED',
        assessmentResult: {
          score: s.confidence ? Math.round(s.confidence * 100) : null,
          rubric: 'AI Natural Language Extraction',
          feedback: s.reasoning || '',
        },
      });
      await existing.save();
      results.updated.push(s.normalizedName);
      continue;
    }

    const comps = getStandardCompetencies(s.skillName);

    await StudentSkill.create({
      student: studentId,
      skillName: s.skillName,
      normalizedName: s.normalizedName,
      taxonomy: s.taxonomyId || null,
      proficiency: s.suggestedProficiency || 'beginner',
      proficiencyLevel: PROFICIENCY_NUMBERS[s.suggestedProficiency] || 1,
      classification: 'self_reported',
      verificationStatus: 'AI_ANALYZED',
      aiConfidence: s.confidence,
      confidence: s.confidence,
      status: 'ai_suggested',
      assessmentMethod: 'ai_extracted',
      aiCategory: s.category,
      extractionBatchId: s.batchId,
      competencies: comps,
      evidence: [
        {
          evidenceType: s.evidenceType || 'PROJECT_DESCRIPTION',
          title: 'AI trích xuất từ đề tài',
          description: s.reasoning || '',
          sourceText: s.evidence || '',
          verificationStatus: 'AI_ANALYZED',
          assessmentResult: {
            score: s.confidence ? Math.round(s.confidence * 100) : null,
            rubric: 'AI NLP Extraction',
            feedback: s.reasoning || '',
          },
        },
      ],
      lastAssessedAt: new Date(),
    });
    results.created.push(s.normalizedName);
  }

  return results;
};

/**
 * Submit and process evidence for a student skill.
 * Integrates with QuizAttempt and Assignment Submission if linked.
 */
const submitEvidence = async (studentId, skillId, payload) => {
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng của sinh viên', 404);

  const {
    evidenceType = 'PROJECT',
    title = '',
    description = '',
    sourceText = '',
    sourceUrl = '',
    fileUrl = '',
    linkedEntityType = 'None',
    linkedEntityId = null,
  } = payload;

  const newEvidence = {
    evidenceType,
    title: title || `Bằng chứng ${evidenceType}`,
    description,
    sourceText,
    sourceUrl,
    fileUrl,
    linkedEntity: {
      entityType: linkedEntityType,
      entityId: linkedEntityId ? new mongoose.Types.ObjectId(linkedEntityId) : null,
    },
    verificationStatus: 'PENDING_REVIEW',
    assessmentResult: {
      score: null,
      rubric: '',
      feedback: '',
      competenciesDemonstrated: [],
    },
    addedAt: new Date(),
  };

  // 1. LINKED QUIZ ATTEMPT
  if (linkedEntityType === 'QuizAttempt' && linkedEntityId) {
    const attempt = await QuizAttempt.findOne({
      _id: linkedEntityId,
      student: studentId,
    }).populate('quiz', 'title course').lean();

    if (!attempt) {
      throw new AppError('Không tìm thấy bài làm Quiz tương ứng của bạn', 404);
    }

    const quizScore = attempt.percentage || (attempt.score / attempt.totalQuestions) * 100;
    const isPassed = attempt.passed || quizScore >= 60;

    newEvidence.title = `Kết quả Quiz: ${attempt.quiz?.title || 'Kiểm tra ôn tập'}`;
    newEvidence.description = `Điểm số đạt ${Math.round(quizScore)}% (${attempt.score}/${attempt.totalQuestions} câu đúng).`;
    newEvidence.verificationStatus = isPassed ? 'ASSESSED' : 'MORE_EVIDENCE_REQUIRED';
    newEvidence.assessmentResult = {
      score: Math.round(quizScore),
      rubric: 'Quiz Objective Assessment',
      feedback: isPassed
        ? `Vượt qua bài kiểm tra trắc nghiệm với điểm số ${Math.round(quizScore)}%.`
        : `Điểm số ${Math.round(quizScore)}% chưa đạt ngưỡng qua môn.`,
      competenciesDemonstrated: [skill.skillName],
    };

    if (isPassed) {
      skill.classification = 'assessed';
      skill.verificationStatus = 'ASSESSED';
      skill.status = 'confirmed';
      skill.proficiencyScore = Math.round(quizScore);
      skill.assessmentMethod = 'quiz_assessed';
      skill.assessmentHistory.push({
        assessmentDate: new Date(),
        method: 'quiz_assessed',
        score: Math.round(quizScore),
        rubric: 'Quiz Multiple Choice Test',
        proficiencyAssessed: quizScore >= 85 ? 'advanced' : quizScore >= 70 ? 'intermediate' : 'elementary',
        notes: `Tự động đánh giá qua Quiz ${attempt.quiz?.title || ''}`,
      });
    }
  }
  // 2. LINKED ASSIGNMENT SUBMISSION
  else if (linkedEntityType === 'Submission' && linkedEntityId) {
    const sub = await Submission.findOne({
      _id: linkedEntityId,
      student: studentId,
    }).populate('assignment', 'title maxScore course').lean();

    if (!sub) {
      throw new AppError('Không tìm thấy bài nộp bài tập tương ứng của bạn', 404);
    }

    const maxScore = sub.assignment?.maxScore || 10;
    const subScore = sub.score !== null ? (sub.score / maxScore) * 100 : null;
    const isGraded = sub.status === 'graded' && subScore !== null;

    newEvidence.title = `Bài nộp: ${sub.assignment?.title || 'Bài tập môn học'}`;
    newEvidence.description = sub.content || sub.feedback || 'Bài tập thực hành đã nộp.';
    newEvidence.verificationStatus = isGraded && subScore >= 50 ? 'ASSESSED' : 'PENDING_REVIEW';
    newEvidence.assessmentResult = {
      score: subScore ? Math.round(subScore) : null,
      rubric: 'Instructor Assignment Evaluation',
      feedback: sub.feedback || (isGraded ? 'Đã được giảng viên chấm điểm.' : 'Chờ giảng viên chấm điểm.'),
      competenciesDemonstrated: [skill.skillName],
    };

    if (isGraded && subScore >= 50) {
      skill.classification = 'assessed';
      skill.verificationStatus = 'ASSESSED';
      skill.status = 'confirmed';
      skill.proficiencyScore = Math.round(subScore);
      skill.assessmentMethod = 'assignment_graded';
      skill.assessmentHistory.push({
        assessmentDate: new Date(),
        method: 'assignment_graded',
        score: Math.round(subScore),
        rubric: 'Academic Assignment Rubric',
        proficiencyAssessed: subScore >= 85 ? 'advanced' : subScore >= 70 ? 'intermediate' : 'elementary',
        notes: `Đánh giá qua bài tập ${sub.assignment?.title || ''}: ${sub.score}/${maxScore}`,
      });
    }
  }
  // 3. FREE TEXT / GITHUB / CERTIFICATE / PROJECT EVIDENCE
  else {
    const fullText = `${title} ${description} ${sourceText}`.trim();
    const evalResult = evaluateEvidenceRelevance(skill.skillName, fullText);

    newEvidence.verificationStatus = evalResult.relevance >= 0.5 ? 'AI_ANALYZED' : 'MORE_EVIDENCE_REQUIRED';
    newEvidence.assessmentResult = {
      score: evalResult.suggestedScore,
      rubric: 'Competency-based Natural Language Assessment',
      feedback: evalResult.feedback,
      competenciesDemonstrated: evalResult.demonstratedCompetencies,
    };

    // Update competencies breakdown if competencies matched
    if (evalResult.demonstratedCompetencies.length > 0) {
      skill.competencies.forEach((comp) => {
        if (evalResult.demonstratedCompetencies.includes(comp.name)) {
          comp.status = 'competent';
          comp.score = evalResult.suggestedScore;
          comp.evidenceSnippet = description.substring(0, 200);
        }
      });
    }
  }

  skill.evidence.push(newEvidence);
  skill.lastAssessedAt = new Date();
  await skill.save();

  return skill;
};

/**
 * Reviewer / Lecturer Verification Workflow.
 * Officially marks evidence and skill as VERIFIED, REJECTED, or MORE_EVIDENCE_REQUIRED.
 */
const reviewEvidence = async (reviewerUser, skillId, evidenceId, { decision, comments = '', score = null }) => {
  if (!['lecturer', 'admin'].includes(reviewerUser.role)) {
    throw new AppError('Chỉ giảng viên hoặc quản trị viên mới có quyền xác thực bằng chứng kỹ năng', 403);
  }

  const validDecisions = ['VERIFIED', 'REJECTED', 'MORE_EVIDENCE_REQUIRED'];
  if (!validDecisions.includes(decision)) {
    throw new AppError('Quyết định thẩm định không hợp lệ. Chọn VERIFIED, REJECTED hoặc MORE_EVIDENCE_REQUIRED', 400);
  }

  const skill = await StudentSkill.findById(skillId);
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);

  const evIndex = skill.evidence.findIndex(
    (e) => (e.evidenceId && e.evidenceId === evidenceId) || (e._id && e._id.toString() === evidenceId)
  );

  if (evIndex === -1) {
    throw new AppError('Không tìm thấy bằng chứng cụ thể cần thẩm định', 404);
  }

  const oldStatus = skill.verificationStatus;
  const ev = skill.evidence[evIndex];

  ev.verificationStatus = decision;
  ev.reviewer = reviewerUser.id || reviewerUser._id;
  ev.reviewedAt = new Date();
  ev.reviewerComments = comments;

  if (score !== null && score !== undefined) {
    ev.assessmentResult.score = Number(score);
  }

  if (decision === 'VERIFIED') {
    skill.classification = 'verified';
    skill.verificationStatus = 'VERIFIED';
    skill.status = 'confirmed';
    if (score !== null && score !== undefined) {
      skill.proficiencyScore = Number(score);
    }
    // Mark associated competencies as mastered / competent
    skill.competencies.forEach((c) => {
      if (c.status === 'untested' || c.status === 'developing') {
        c.status = 'competent';
        if (score) c.score = Number(score);
      }
    });
  } else if (decision === 'REJECTED') {
    // If no other evidence is verified, set to REJECTED or revert to SELF_REPORTED
    const hasOtherVerified = skill.evidence.some(
      (e, idx) => idx !== evIndex && e.verificationStatus === 'VERIFIED'
    );
    if (!hasOtherVerified) {
      skill.verificationStatus = 'REJECTED';
      skill.classification = 'self_reported';
    }
  } else if (decision === 'MORE_EVIDENCE_REQUIRED') {
    skill.verificationStatus = 'MORE_EVIDENCE_REQUIRED';
  }

  // Record verification history audit log
  skill.verificationHistory.push({
    changedAt: new Date(),
    fromStatus: oldStatus,
    toStatus: decision,
    changedBy: reviewerUser.id || reviewerUser._id,
    reason: comments || `Thẩm định bởi ${reviewerUser.name || 'Giảng viên'}`,
    comments,
  });

  await skill.save();
  return skill;
};

/**
 * Confirm an AI-suggested skill by the student.
 * NOTE: Student confirmation sets status = 'confirmed', but classification remains 'self_reported'
 * until assessed through evidence!
 */
const confirmSkill = async (studentId, skillId, { proficiency } = {}) => {
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);

  skill.status = 'confirmed';
  if (proficiency && PROFICIENCY_LEVELS.includes(proficiency)) {
    skill.proficiency = proficiency;
    skill.proficiencyLevel = PROFICIENCY_NUMBERS[proficiency];
  }
  skill.lastAssessedAt = new Date();
  await skill.save();
  return skill;
};

/**
 * Reject an AI-suggested skill.
 */
const rejectSkill = async (studentId, skillId) => {
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);
  if (['verified'].includes(skill.classification)) {
    throw new AppError('Không thể từ chối kỹ năng đã được thẩm định chính thức', 400);
  }
  skill.status = 'rejected';
  skill.verificationStatus = 'REJECTED';
  await skill.save();
  return skill;
};

/**
 * Update proficiency level manually.
 */
const updateProficiency = async (studentId, skillId, proficiency) => {
  if (!PROFICIENCY_LEVELS.includes(proficiency)) {
    throw new AppError('Trình độ không hợp lệ', 400);
  }
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);

  skill.proficiency = proficiency;
  skill.proficiencyLevel = PROFICIENCY_NUMBERS[proficiency];
  skill.lastAssessedAt = new Date();
  await skill.save();
  return skill;
};

/**
 * Remove skill.
 */
const removeSkill = async (studentId, skillId) => {
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);
  if (skill.classification === 'verified') {
    throw new AppError('Không thể xoá kỹ năng đã được giảng viên thẩm định và xác thực', 400);
  }
  skill.isActive = false;
  await skill.save();
  return true;
};

/**
 * Get pending skills for review.
 */
const getPendingReview = async (studentId) => {
  return StudentSkill.find({
    student: studentId,
    isActive: true,
    $or: [
      { status: 'ai_suggested' },
      { verificationStatus: { $in: ['PENDING_REVIEW', 'MORE_EVIDENCE_REQUIRED'] } },
    ],
  }).lean();
};

module.exports = {
  getProfile,
  getProfileMetrics,
  addManualSkill,
  upsertAISuggestions,
  submitEvidence,
  reviewEvidence,
  confirmSkill,
  rejectSkill,
  updateProficiency,
  removeSkill,
  getPendingReview,
};
