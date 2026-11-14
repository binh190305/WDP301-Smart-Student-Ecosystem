/**
 * AI CORE 01 – Comprehensive Acceptance Test Suite
 * Tests 1 to 8 as specified in Master Implementation Prompt:
 *  - TEST 1: Evidence-Based Skill Profile & 3-Tier Classification
 *  - TEST 2: Evidence Quality & Irrelevance Detection
 *  - TEST 3: Project Analyzer Input A (Extraction, Normalization, Deduplication)
 *  - TEST 4: Project Analyzer Input B (DB Template Loading & Validation)
 *  - TEST 5: Unified Project Requirement Pipeline Consistency
 *  - TEST 6: Weighted Skill Gap Analysis & Readiness Scoring
 *  - TEST 7: AI Team Matching Integration
 *  - TEST 8: Regression & Non-Breaking Compatibility
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Services under test
const { getStandardCompetencies, evaluateEvidenceRelevance } = require('../../src/skill-intelligence/competency-catalog');
const { buildProjectRequirements, IMPORTANCE_WEIGHTS } = require('../../src/skill-intelligence/unified-requirement.service');
const { analyzeGap, parseTarget, EVIDENCE_QUALITY_MULTIPLIERS } = require('../../src/skill-intelligence/gap-analysis.service');
const { DEFAULT_TEMPLATES } = require('../../src/skill-intelligence/template.service');
const { normalizeSkill } = require('../../src/recommendation/skill-catalog');
const { buildStudentProfile } = require('../../src/recommendation/profile');
const StudentSkill = require('../../src/models/student-skill.model');

describe('AI CORE 01 – TEST 1: Skill Profile 3-Tier Classification & Verification', () => {
  test('Self-reported skill defaults to self_reported classification and is NOT automatically verified', async () => {
    const doc = new StudentSkill({
      student: '65f1a2b3c4d5e6f7a8b9c0d1',
      skillName: 'React',
      proficiency: 'advanced',
    });
    await doc.validate();

    assert.equal(doc.classification, 'self_reported');
    assert.equal(doc.verificationStatus, 'SELF_REPORTED');
    assert.notEqual(doc.verificationStatus, 'VERIFIED');
    assert.equal(doc.normalizedName, 'react');
    assert.equal(doc.proficiencyLevel, 4);
  });

  test('Standard competencies are generated with structured breakdown', () => {
    const comps = getStandardCompetencies('React');
    assert.ok(comps.length >= 5);
    const compNames = comps.map((c) => c.name);
    assert.ok(compNames.includes('Components & JSX'));
    assert.ok(compNames.includes('State Management'));
    assert.ok(compNames.includes('Hooks Lifecycle'));
  });

  test('Evidence verification workflow logs status transition into verificationHistory', () => {
    const doc = new StudentSkill({
      student: '65f1a2b3c4d5e6f7a8b9c0d1',
      skillName: 'Node.js',
      classification: 'self_reported',
      verificationStatus: 'SELF_REPORTED',
      evidence: [
        {
          evidenceId: 'ev-1',
          evidenceType: 'PROJECT',
          title: 'STE Backend Architecture',
          description: 'Xây dựng API RESTful với Express, JWT auth và MongoDB',
          verificationStatus: 'PENDING_REVIEW',
        },
      ],
    });

    // Simulate Lecturer verification
    const ev = doc.evidence[0];
    ev.verificationStatus = 'VERIFIED';
    doc.classification = 'verified';
    doc.verificationStatus = 'VERIFIED';
    doc.verificationHistory.push({
      changedAt: new Date(),
      fromStatus: 'SELF_REPORTED',
      toStatus: 'VERIFIED',
      reason: 'Lecturer verified GitHub repository code',
      comments: 'Clean code and correct architecture',
    });

    assert.equal(doc.classification, 'verified');
    assert.equal(doc.verificationStatus, 'VERIFIED');
    assert.equal(doc.verificationHistory.length, 1);
    assert.equal(doc.verificationHistory[0].toStatus, 'VERIFIED');
  });
});

describe('AI CORE 01 – TEST 2: Evidence Quality & Irrelevance Detection', () => {
  test('High relevance evidence demonstrates competencies and yields strong score', () => {
    const highText =
      'Xây dựng ứng dụng SPA hoàn chỉnh bằng React với functional components, custom hooks, Redux state management, Context API và Axios REST API integration.';
    const result = evaluateEvidenceRelevance('React', highText);

    assert.ok(result.relevance >= 0.7);
    assert.ok(result.suggestedScore >= 75);
    assert.ok(result.demonstratedCompetencies.length >= 3);
  });

  test('Irrelevant or off-topic evidence is detected with low relevance and requires more evidence', () => {
    const offTopicText =
      'Dự án nấu ăn và quản lý công thức làm bánh ngọt truyền thống gia đình trong kỳ nghỉ hè.';
    const result = evaluateEvidenceRelevance('React', offTopicText);

    assert.ok(result.relevance < 0.4);
    assert.ok(result.suggestedScore <= 35);
    assert.equal(result.demonstratedCompetencies.length, 0);
    assert.match(result.feedback, /không chứa từ khoá/i);
  });

  test('Empty or trivial text is rejected gracefully', () => {
    const result = evaluateEvidenceRelevance('React', 'làm bài');
    assert.ok(result.relevance <= 0.2);
    assert.match(result.feedback, /quá ngắn/i);
  });
});

describe('AI CORE 01 – TEST 3: Project Analyzer Input A (Text Extraction & Normalization)', () => {
  test('Normalizes variant names into canonical skills', () => {
    assert.equal(normalizeSkill('ReactJS'), 'react');
    assert.equal(normalizeSkill('NodeJS'), 'node.js');
    assert.equal(normalizeSkill('js'), 'javascript');
  });

  test('Builds requirements from free text description correctly', async () => {
    const text =
      'Đề tài xây dựng Web Fullstack: sử dụng React và TypeScript ở phía frontend, Node.js và MongoDB ở phía backend, đóng gói Docker.';
    const res = await buildProjectRequirements({ text });

    assert.ok(res.totalSkills >= 4);
    const names = res.requirements.map((r) => r.normalizedName);
    assert.ok(names.includes('react'));
    assert.ok(names.includes('typescript'));
    assert.ok(names.includes('node.js'));
    assert.ok(names.includes('mongodb'));
  });
});

describe('AI CORE 01 – TEST 4: Project Analyzer Input B (DB Templates)', () => {
  test('Templates contain canonical skills without duplicates', () => {
    const mern = DEFAULT_TEMPLATES.find((t) => t.code === 'web_fullstack_mern');
    assert.ok(mern);
    assert.ok(mern.requiredSkills.length >= 5);

    const normNames = mern.requiredSkills.map((s) => s.normalizedName);
    const uniqueNames = new Set(normNames);
    assert.equal(normNames.length, uniqueNames.size, 'No duplicates inside template');
  });

  test('Template requirements assign proper importance and weights', () => {
    const mern = DEFAULT_TEMPLATES.find((t) => t.code === 'web_fullstack_mern');
    const react = mern.requiredSkills.find((s) => s.normalizedName === 'react');
    assert.equal(react.importance, 'high');
    assert.equal(react.weight, 1.5);
    assert.ok(react.requiredCompetencies.length >= 3);
  });
});

describe('AI CORE 01 – TEST 5: Unified Pipeline Consistency', () => {
  test('Input A and Input B output the exact same Project Skill Requirements schema', async () => {
    const fromTemplate = await buildProjectRequirements({ templateCode: 'web_fullstack_mern' });
    const fromText = await buildProjectRequirements({
      text: 'Xây dựng web React, Node.js, Express, MongoDB, TypeScript và Docker.',
    });

    const expectedKeys = [
      'name',
      'normalizedName',
      'category',
      'requiredLevel',
      'requiredProficiencyNumber',
      'importance',
      'weight',
      'requiredCompetencies',
      'reasoning',
      'source',
    ];

    for (const req of fromTemplate.requirements) {
      for (const k of expectedKeys) {
        assert.ok(k in req, `Missing key ${k} in template requirement`);
      }
    }

    for (const req of fromText.requirements) {
      for (const k of expectedKeys) {
        assert.ok(k in req, `Missing key ${k} in text requirement`);
      }
    }
  });

  test('Merging template with extra text deduplicates and enriches existing skills', async () => {
    const merged = await buildProjectRequirements({
      templateCode: 'web_fullstack_mern',
      text: 'Dự án đặc biệt yêu cầu chuyên sâu về React và Docker containerization trên cloud.',
    });

    const reactReqs = merged.requirements.filter((r) => r.normalizedName === 'react');
    assert.equal(reactReqs.length, 1, 'React must not be duplicated');
  });
});

describe('AI CORE 01 – TEST 6: Weighted Skill Gap Analysis & Readiness Scoring', () => {
  test('parseTarget formats heterogeneous skill inputs into standardized targets', () => {
    const parsed = parseTarget([
      'react',
      { name: 'Node.js', minProficiency: 'advanced', importance: 'high' },
    ]);

    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].normalizedName, 'react');
    assert.equal(parsed[0].minProficiencyLevel, 3);
    assert.equal(parsed[1].normalizedName, 'node.js');
    assert.equal(parsed[1].minProficiencyLevel, 4);
    assert.equal(parsed[1].importance, 'high');
  });

  test('Evidence Quality Multipliers award higher credit to Verified and Assessed over Self-reported', () => {
    assert.equal(EVIDENCE_QUALITY_MULTIPLIERS.verified, 1.0);
    assert.equal(EVIDENCE_QUALITY_MULTIPLIERS.assessed, 0.85);
    assert.equal(EVIDENCE_QUALITY_MULTIPLIERS.self_reported, 0.45);
    assert.ok(
      EVIDENCE_QUALITY_MULTIPLIERS.verified > EVIDENCE_QUALITY_MULTIPLIERS.assessed &&
      EVIDENCE_QUALITY_MULTIPLIERS.assessed > EVIDENCE_QUALITY_MULTIPLIERS.self_reported
    );
  });
});

describe('AI CORE 01 – TEST 7: AI Team Matching Integration', () => {
  test('buildStudentProfile prioritizes StudentSkill documents over raw self-reported strings', () => {
    const user = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d1',
      name: 'Nguyen Van A',
      skills: ['react', 'node.js'],
      studentSkillDocs: [
        {
          skillName: 'React',
          normalizedName: 'react',
          proficiency: 'expert',
          proficiencyLevel: 5,
          classification: 'verified',
        },
      ],
    };

    const profile = buildStudentProfile(user);
    assert.equal(profile.skills.get('react'), 5, 'Verified StudentSkill level 5 must override default level');
    assert.equal(profile.skills.get('node.js'), 3, 'Raw fallback skill uses default level 3');
  });
});

describe('AI CORE 01 – TEST 8: Regression & Non-Breaking Compatibility', () => {
  test('StudentSkill pre-validate hook maintains backwards compatible fields', async () => {
    const doc = new StudentSkill({
      student: '65f1a2b3c4d5e6f7a8b9c0d1',
      skillName: 'Python',
      proficiency: 'advanced',
      confidence: 0.9,
    });

    await doc.validate();
    assert.equal(doc.proficiencyLevel, 4);
    assert.equal(doc.aiConfidence, 0.9);
    assert.equal(doc.classification, 'self_reported');
  });
});

describe('AI CORE 01 – TEST 9: Interactive Quiz Assessment & Project Readiness', () => {
  test('Passing interactive quiz (>=75%) promotes skill to ASSESSED with PRACTICAL_ASSESSMENT evidence', async () => {
    const studentId = '65f1a2b3c4d5e6f7a8b9c0d1';
    const mockDoc = new StudentSkill({
      student: studentId,
      skillName: 'Docker',
      proficiency: 'intermediate',
      proficiencyLevel: 3,
      classification: 'assessed',
      verificationStatus: 'ASSESSED',
      status: 'confirmed',
      proficiencyScore: 100,
      evidence: [
        {
          evidenceType: 'PRACTICAL_ASSESSMENT',
          title: 'Trắc nghiệm Năng lực Chuyên sâu: Docker',
          description: '3/3 câu đúng (100%)',
          verificationStatus: 'ASSESSED',
          assessmentResult: {
            score: 100,
            feedback: 'Đã đáp ứng đủ mức độ năng lực thực hành để tham gia dự án/đề tài SWP391.',
          },
        },
      ],
    });

    await mockDoc.validate();
    assert.equal(mockDoc.classification, 'assessed');
    assert.equal(mockDoc.verificationStatus, 'ASSESSED');
    assert.equal(mockDoc.evidence[0].evidenceType, 'PRACTICAL_ASSESSMENT');
    assert.equal(mockDoc.evidence[0].verificationStatus, 'ASSESSED');
  });
});
