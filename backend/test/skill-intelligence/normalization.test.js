/**
 * Unit tests for Skill Intelligence – normalization service
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalize, normalizeMany, normalizeProficiency } = require('../../src/skill-intelligence/normalization.service');

test('SkillNormalization: normalize() lowercases and trims', () => {
  assert.equal(normalize('  React  ').normalizedName, 'react');
});

test('SkillNormalization: resolves alias reactjs -> react', () => {
  const r = normalize('ReactJS');
  assert.equal(r.normalizedName, 'react');
  assert.equal(r.aliasUsed, true);
});

test('SkillNormalization: resolves alias nodejs -> node.js', () => {
  assert.equal(normalize('NodeJS').normalizedName, 'node.js');
});

test('SkillNormalization: recognises known skill', () => {
  assert.equal(normalize('python').isKnown, true);
});

test('SkillNormalization: flags unknown skill', () => {
  assert.equal(normalize('xyzUnknownTech9999').isKnown, false);
});

test('SkillNormalization: handles empty string gracefully', () => {
  assert.equal(normalize('').normalizedName, '');
});

test('SkillNormalization: normalizeMany() deduplicates by normalizedName', () => {
  const result = normalizeMany(['React', 'ReactJS', 'react']);
  assert.equal(result.length, 1);
  assert.equal(result[0].normalizedName, 'react');
});

test('SkillNormalization: normalizeMany() filters out empty strings', () => {
  const result = normalizeMany(['', 'Python']);
  assert.equal(result.length, 1);
  assert.equal(result[0].normalizedName, 'python');
});

test('SkillNormalization: normalizeProficiency() maps "basic" to beginner', () => {
  assert.equal(normalizeProficiency('basic'), 'beginner');
});

test('SkillNormalization: normalizeProficiency() caps at intermediate when capAtIntermediate=true', () => {
  assert.equal(normalizeProficiency('expert', true), 'intermediate');
});

test('SkillNormalization: normalizeProficiency() allows expert when capAtIntermediate=false', () => {
  assert.equal(normalizeProficiency('expert', false), 'expert');
});

test('SkillNormalization: normalizeProficiency() defaults unknown values to beginner', () => {
  assert.equal(normalizeProficiency('someUnknownLevel'), 'beginner');
});
