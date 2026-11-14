// Điều phối module gợi ý: nạp dữ liệu, chấm điểm (lớp 1), dùng vector (lớp 2),
// sinh giải thích / hiểu câu hỏi (lớp 3), ghi log tương tác.
const mongoose = require('mongoose');
const config = require('./config');
const AppError = require('../utils/app-error');
const { User, Team, JoinRequest, Enrollment, StudentSkill } = require('../models');
const TeamInvitation = require('../models/team-invitation.model');
const Taxonomy = require('../models/taxonomy.model');
const RecommendationEvent = require('../models/recommendation-event.model');
const { buildStudentProfile, buildTeamProfile } = require('./profile');
const {
  scoreTeamsForStudent,
  recommendGroupsForStudent,
  recommendMembersForGroup,
  byScoreDesc,
} = require('./ranking');
const { queryMatch, blendScores, hybridSemantic, passesHardFilters } = require('./query-match');
const { getVectors } = require('./embedding/sync');
const { getEmbeddingProvider } = require('./embedding/providers');
const { normalizeSkill } = require('./skill-catalog');
const { parseTeamQuery } = require('./llm/query-parser');
const { explain } = require('./llm/explainer');
const { suggestTopics } = require('./llm/topic-suggester');

const MEMBER_FIELDS = 'name avatarUrl major gpa skills skillLevels preferredRoles goal interests description';

const clampLimit = (value, fallback) =>
  Math.min(Math.max(Number(value) || fallback, 1), config.defaultLimits.max);

const toId = (v) => v.toString();

const teamPayload = (doc, profile) => ({
  _id: doc._id,
  name: doc.name,
  topic: doc.topic,
  major: doc.major,
  description: doc.description,
  skillsNeeded: doc.skillsNeeded,
  status: doc.status,
  leader: doc.leader ? { _id: doc.leader._id, name: doc.leader.name, avatarUrl: doc.leader.avatarUrl } : null,
  memberCount: profile.size,
  capacity: profile.capacity,
  missingSkills: profile.missing.map((m) => m.skill),
  openRoles: profile.openRoles,
});

const studentPayload = (doc) => ({
  _id: doc._id,
  name: doc.name,
  avatarUrl: doc.avatarUrl,
  major: doc.major,
  skills: doc.skills,
  preferredRoles: doc.preferredRoles,
  description: doc.description,
});

const logEvents = (events) =>
  RecommendationEvent.insertMany(events, { ordered: false }).catch((err) =>
    console.warn(`[recommendation] không ghi được log: ${err.message}`)
  );

// ----- Chiều sinh viên -> nhóm -----

const loadStudentContext = async (studentId) => {
  const user = await User.findOne({ _id: studentId, role: 'student' }).lean();
  if (!user) throw new AppError('Không tìm thấy sinh viên', 404);

  const [teamDocs, rejectedRequests, rejectedInvites, pendingRequests, courseIds, studentSkills] = await Promise.all([
    Team.find({ status: 'recruiting' })
      .populate('members.user', MEMBER_FIELDS)
      .populate('leader', 'name avatarUrl')
      .lean(),
    JoinRequest.distinct('team', { applicant: user._id, status: 'rejected' }),
    TeamInvitation.distinct('team', { invitee: user._id, status: 'rejected' }),
    JoinRequest.distinct('team', { applicant: user._id, status: 'pending' }),
    Enrollment.distinct('course', { student: user._id }),
    StudentSkill.find({ student: user._id, isActive: true }).lean(),
  ]);

  user.studentSkillDocs = studentSkills || [];

  const docs = teamDocs.filter((t) => t.members.every((m) => m.user)); // bỏ thành viên đã bị xoá
  const teamProfiles = docs.map((doc) => buildTeamProfile(doc, doc.members.map((m) => buildStudentProfile(m.user))));
  const teamIds = docs.map((d) => toId(d._id));
  const [studentVectors, teamVectors] = await Promise.all([
    getVectors('student', [toId(user._id)]),
    getVectors('team', teamIds),
  ]);

  return {
    user,
    student: buildStudentProfile(user),
    docs: new Map(docs.map((d) => [toId(d._id), d])),
    teamProfiles,
    pendingTeamIds: new Set(pendingRequests.map(toId)),
    ctx: {
      rejectedTeamIds: new Set([...rejectedRequests, ...rejectedInvites].map(toId)),
      enrolledCourseIds: new Set(courseIds.map(toId)),
      studentVector: studentVectors.get(toId(user._id)) || null,
      teamVectors,
    },
  };
};

const formatTeamResults = async (context, items, { criteria = null, source, wantReply = false, needsOnboarding }) => {
  const studentId = toId(context.user._id);
  const { reply, explanations } = await explain(
    items.map((r) => ({ ...r, id: r.team.id, name: r.team.name, studentId, teamId: r.team.id })),
    { perspective: 'student', criteria, wantReply, needsOnboarding }
  );
  const recommendations = items.map((r, index) => ({
    team: teamPayload(context.docs.get(r.team.id), r.team),
    score: r.score,
    score_breakdown: r.score_breakdown,
    ...(r.query_breakdown ? { query_breakdown: r.query_breakdown, profile_score: r.profile_score } : {}),
    weights_used: r.weights_used,
    explanation: explanations.get(r.team.id).text,
    explanation_source: explanations.get(r.team.id).source,
    fairness_slot: Boolean(r.fairness_slot),
    pending_request: context.pendingTeamIds.has(r.team.id),
    rank: index + 1,
  }));

  logEvents(
    recommendations.map((r) => ({
      user: context.user._id,
      kind: 'impression',
      direction: 'student_to_team',
      source,
      team: r.team._id,
      rank: r.rank,
      score: r.score,
      scoreBreakdown: r.score_breakdown,
      query: criteria,
    }))
  );
  return { reply, recommendations };
};

const getGroupRecommendations = async (studentId, { limit } = {}) => {
  const [context, vocab] = await Promise.all([loadStudentContext(studentId), loadVocab()]);
  const result = recommendGroupsForStudent(
    context.student,
    context.teamProfiles,
    context.ctx,
    clampLimit(limit, config.defaultLimits.groups)
  );
  const topicsPromise = suggestTopicsFor(context, vocab);
  if (result.needs_onboarding) {
    return { ...result, recommendations: [], topic_suggestions: await topicsPromise };
  }
  const [{ recommendations }, topicSuggestions] = await Promise.all([
    formatTeamResults(context, result.recommendations, { source: 'profile', needsOnboarding: false }),
    topicsPromise,
  ]);
  return { ...result, recommendations, topic_suggestions: topicSuggestions };
};

const loadVocab = async () => {
  const [skills, userMajors, teamMajors] = await Promise.all([
    Taxonomy.distinct('normalizedName', { type: 'skill', isActive: true }),
    User.distinct('major', { role: 'student' }),
    Team.distinct('major'),
  ]);
  return {
    skills: [...new Set(skills.map(normalizeSkill))],
    majors: [...new Set([...userMajors, ...teamMajors].filter(Boolean))],
  };
};

// Đề tài gợi ý để tự lập nhóm; tránh trùng các nhóm đang tuyển. Lỗi thì trả mảng rỗng.
const suggestTopicsFor = (context, vocab, criteria = null, excludeTopics = []) => {
  const existingTopics = [...context.docs.values()].flatMap((d) => [d.name, d.topic]).filter(Boolean);
  return suggestTopics({ user: context.user, criteria, existingTopics, excludeTopics, vocab }).catch((err) => {
    console.warn(`[recommendation] không gợi ý được đề tài: ${err.message}`);
    return [];
  });
};

const embedQuery = async (text) => {
  if (!config.embedding.enabled) return null;
  try {
    const [vector] = await getEmbeddingProvider().embed([text]);
    return vector;
  } catch (err) {
    console.warn(`[recommendation] không tính được embedding cho câu hỏi: ${err.message}`);
    return null;
  }
};

const isRelevant = (criteria, result) => {
  if (result.relevance === null) return true; // không có tín hiệu nào để lọc
  const structured = criteria.skills.length || criteria.majors.length || criteria.roles.length;
  if (!structured && result.query_breakdown.semantic !== null) {
    return result.query_breakdown.semantic >= config.chat.minSemanticOnly;
  }
  return result.relevance >= config.chat.minRelevance;
};

const topicReply = (count, criteria, isMore = false) => {
  if (!count && isMore) {
    return 'Mình đã gợi ý hết các đề tài phù hợp với yêu cầu này. Bạn thử mô tả lĩnh vực khác, hoặc bấm "Bắt đầu lại" để xem lại từ đầu nhé.';
  }
  if (!count) return 'Mình chưa nghĩ ra đề tài phù hợp lúc này. Bạn thử mô tả lĩnh vực hoặc kỹ năng muốn dùng nhé.';
  if (isMore) return `Đây là ${count} đề tài khác, không trùng với các đề tài mình đã gợi ý. Chọn một đề tài và bấm "Tạo nhóm với đề tài này" để lập nhóm ngay.`;
  const parts = [];
  if (criteria.majors.length) parts.push(`ngành ${criteria.majors.join(', ')}`);
  if (criteria.skills.length) parts.push(`kỹ năng ${criteria.skills.join(', ')}`);
  const about = parts.length ? `theo yêu cầu ${parts.join('; ')} và hồ sơ của bạn` : 'dựa trên hồ sơ và yêu cầu của bạn';
  return `Đây là ${count} đề tài mình gợi ý ${about}. Chọn một đề tài và bấm "Tạo nhóm với đề tài này" để lập nhóm ngay.`;
};

// Chat: sinh viên mô tả nhóm muốn tìm, hệ thống trả về câu trả lời + danh sách nhóm.
const chatGroupRecommendations = async (studentId, { message, history = [], excludeTopics = [], limit } = {}) => {
  // Đề tài đã gợi ý trong cuộc chat: không đưa lại
  const shownTopics = [...new Set(excludeTopics.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim()))];
  const text = String(message || '').trim().slice(0, config.chat.maxMessageLength);
  if (!text) throw new AppError('Vui lòng nhập yêu cầu tìm nhóm', 400);
  const prior = history
    .filter((h) => typeof h === 'string' && h.trim())
    .slice(-config.chat.maxHistory)
    .map((h) => h.trim().slice(0, config.chat.maxMessageLength));

  const [context, vocab] = await Promise.all([loadStudentContext(studentId), loadVocab()]);
  const criteria = await parseTeamQuery(text, prior, vocab);
  const needsOnboarding = context.student.skills.size === 0;
  logEvents([{ user: context.user._id, kind: 'chat_query', direction: 'student_to_team', source: 'chat', query: { message: text, ...criteria } }]);

  // Chỉ xin gợi ý đề tài: trả đề tài, không kèm nhóm.
  if (criteria.intent === 'suggest_topic') {
    const topicSuggestions = await suggestTopicsFor(context, vocab, criteria, shownTopics);
    return {
      reply: topicReply(topicSuggestions.length, criteria, shownTopics.length > 0),
      criteria,
      intent: criteria.intent,
      needs_onboarding: needsOnboarding,
      suggest_create_team: topicSuggestions.length === 0,
      recommendations: [],
      topic_suggestions: topicSuggestions,
    };
  }

  // Câu hỏi là văn bản mới nên phải tính embedding lúc gọi (chỉ 1 câu, model đã nạp sẵn).
  const queryVector = await embedQuery(criteria.topic || text);

  const eligible = scoreTeamsForStudent(context.student, context.teamProfiles, context.ctx).filter((r) =>
    passesHardFilters(criteria, r.team)
  );
  const semantic = hybridSemantic(queryVector, eligible.map((r) => r.team.id), context.ctx.teamVectors);
  const ranked = eligible
    .map((r) => {
      const q = queryMatch(criteria, r.team, { semantic: semantic.get(r.team.id) ?? null });
      return {
        ...r,
        relevance: q.score,
        profile_score: r.score,
        score: blendScores(q.score, r.score),
        query_breakdown: q.breakdown,
        query_details: q.details,
      };
    })
    // Chỉ giữ nhóm thật sự khớp yêu cầu; không lấp cho đủ số lượng.
    .filter((r) => isRelevant(criteria, r))
    .sort(byScoreDesc)
    .slice(0, clampLimit(limit, config.defaultLimits.groups))
    .map(({ relevance, ...r }) => r);

  // Tìm nhóm: chỉ kèm đề tài khi hỏi cả hai hoặc không có nhóm nào khớp (để tự lập nhóm).
  const [{ reply, recommendations }, topicSuggestions] = await Promise.all([
    formatTeamResults(context, ranked, { criteria, source: 'chat', wantReply: true, needsOnboarding }),
    criteria.intent === 'both' || ranked.length === 0 ? suggestTopicsFor(context, vocab, criteria, shownTopics) : [],
  ]);

  return {
    reply,
    criteria,
    intent: criteria.intent,
    needs_onboarding: needsOnboarding,
    suggest_create_team: recommendations.length === 0,
    recommendations,
    topic_suggestions: topicSuggestions,
  };
};

const logClick = async (userId, { teamId, candidateId, source = 'profile' }) => {
  const valid = (id) => id && mongoose.isValidObjectId(id);
  if (!valid(teamId)) throw new AppError('Thiếu nhóm', 400);
  if (candidateId && !valid(candidateId)) throw new AppError('Sinh viên không hợp lệ', 400);
  await RecommendationEvent.create({
    user: userId,
    kind: 'click',
    direction: candidateId ? 'team_to_student' : 'student_to_team',
    source: source === 'chat' ? 'chat' : 'profile',
    team: teamId,
    candidate: candidateId || null,
  });
};

// ----- Chiều nhóm -> sinh viên -----

const getMemberRecommendations = async (teamId, requester, { limit } = {}) => {
  if (!mongoose.isValidObjectId(teamId)) throw new AppError('Không tìm thấy nhóm', 404);
  const doc = await Team.findById(teamId).populate('members.user', MEMBER_FIELDS).lean();
  if (!doc) throw new AppError('Không tìm thấy nhóm', 404);
  const isLeader = toId(doc.leader) === requester.id;
  if (!isLeader && requester.role !== 'admin') {
    throw new AppError('Chỉ trưởng nhóm mới xem được gợi ý thành viên', 403);
  }

  const team = buildTeamProfile(doc, doc.members.filter((m) => m.user).map((m) => buildStudentProfile(m.user)));
  const [candidateDocs, rejectedRequests, rejectedInvites, pendingInvites, courseStudents] = await Promise.all([
    User.find({ role: 'student', isActive: true, _id: { $nin: [...team.memberIds] } }).select(MEMBER_FIELDS).lean(),
    JoinRequest.distinct('applicant', { team: doc._id, status: 'rejected' }),
    TeamInvitation.distinct('invitee', { team: doc._id, status: 'rejected' }),
    TeamInvitation.distinct('invitee', { team: doc._id, status: 'pending' }),
    doc.course ? Enrollment.distinct('student', { course: doc.course }) : Promise.resolve([]),
  ]);

  const candidates = candidateDocs.map(buildStudentProfile);
  const [teamVectors, studentVectors] = await Promise.all([
    getVectors('team', [team.id]),
    getVectors('student', candidates.map((c) => c.id)),
  ]);

  const result = recommendMembersForGroup(
    team,
    candidates,
    {
      rejectedStudentIds: new Set([...rejectedRequests, ...rejectedInvites].map(toId)),
      pendingInviteeIds: new Set(pendingInvites.map(toId)),
      courseStudentIds: new Set(courseStudents.map(toId)),
      teamVector: teamVectors.get(team.id) || null,
      studentVectors,
    },
    clampLimit(limit, config.defaultLimits.members)
  );

  const docsById = new Map(candidateDocs.map((d) => [toId(d._id), d]));
  const { explanations } = await explain(
    result.recommendations.map((r) => ({ ...r, id: r.student.id, name: r.student.name, studentId: r.student.id, teamId: team.id })),
    { perspective: 'team' }
  );
  const recommendations = result.recommendations.map((r, index) => ({
    student: studentPayload(docsById.get(r.student.id)),
    score: r.score,
    score_breakdown: r.score_breakdown,
    weights_used: r.weights_used,
    explanation: explanations.get(r.student.id).text,
    explanation_source: explanations.get(r.student.id).source,
    rank: index + 1,
  }));

  logEvents(
    recommendations.map((r) => ({
      user: requester.id,
      kind: 'impression',
      direction: 'team_to_student',
      team: doc._id,
      candidate: r.student._id,
      rank: r.rank,
      score: r.score,
      scoreBreakdown: r.score_breakdown,
    }))
  );
  return { team_open: result.team_open, recommendations };
};

module.exports = {
  getGroupRecommendations,
  chatGroupRecommendations,
  getMemberRecommendations,
  logClick,
};
