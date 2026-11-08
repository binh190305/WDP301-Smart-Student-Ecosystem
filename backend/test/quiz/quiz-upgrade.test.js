const test = require('node:test');
const assert = require('node:assert/strict');
const { generateQuizQuestions } = require('../../src/services/ai-quiz.service');
const {
  createQuizSchema,
  updateQuizSchema,
  submitAttemptSchema,
  generateAiQuizSchema,
} = require('../../src/validators/quiz.validator');

test('AI Quiz Generator: thông báo rõ ràng khi chưa có API key', async () => {
  await assert.rejects(
    async () => {
      await generateQuizQuestions({
        prompt: 'Lập trình hướng đối tượng OOP trong Java',
        questionCount: 3,
        difficulty: 'medium',
      });
    },
    (err) => {
      assert.ok(err.message.includes('API Key'));
      return true;
    }
  );
});

test('Quiz Validator: xác thực tạo quiz với cài đặt mới (timer, maxAttempts, passingPercentage, explanation)', () => {
  const payload = {
    title: 'Kiểm tra giữa kỳ Kiến trúc phần mềm',
    timeLimitMinutes: 45,
    maxAttempts: 2,
    passingPercentage: 60,
    shuffleQuestions: true,
    questions: [
      {
        questionText: 'Mô hình MVC gồm các thành phần nào?',
        options: ['Model, View, Controller', 'Main, View, Core', 'Module, Variable, Constant'],
        correctIndexes: [0],
        explanation: 'MVC là viết tắt của Model, View, Controller.',
      },
    ],
  };

  const { error, value } = createQuizSchema.validate(payload);
  assert.equal(error, undefined);
  assert.equal(value.timeLimitMinutes, 45);
  assert.equal(value.maxAttempts, 2);
  assert.equal(value.passingPercentage, 60);
  assert.equal(value.shuffleQuestions, true);
  assert.equal(value.questions[0].explanation, 'MVC là viết tắt của Model, View, Controller.');
});

test('Quiz Validator: xác thực schema sinh AI quiz', () => {
  const valid = generateAiQuizSchema.validate({
    prompt: 'Lịch sử phát triển của Internet',
    questionCount: 5,
    difficulty: 'easy',
  });
  assert.equal(valid.error, undefined);

  const invalid = generateAiQuizSchema.validate({
    questionCount: 5,
  });
  assert.ok(invalid.error); // Phải có prompt hoặc text
});

test('Quiz Validator: submit attempt có timeSpentSeconds', () => {
  const valid = submitAttemptSchema.validate({
    answers: [[0], [1, 2]],
    timeSpentSeconds: 120,
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.value.timeSpentSeconds, 120);
});

