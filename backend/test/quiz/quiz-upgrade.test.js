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

test('Quiz Validator: hỗ trợ câu hỏi/lựa chọn dài do AI sinh và cho phép course rỗng/null', () => {
  const longPayload = {
    title: 'Trắc nghiệm: lập trình pro Microservices',
    course: '',
    timeLimitMinutes: 15,
    maxAttempts: 0,
    passingPercentage: 50,
    shuffleQuestions: false,
    questions: [
      {
        questionText: 'Trong kiến trúc Microservices, khi cần cập nhật dữ liệu vào Database nghiệp vụ đồng thời phát sinh một sự kiện (Event) lên Message Broker (như Kafka/RabbitMQ) mà phải đảm bảo tính nhất quán dữ liệu (không bị hiện tượng ghi DB thành công nhưng mất message hoặc ngược lại), giải pháp kiến trúc nào là tối ưu và phổ biến nhất?',
        options: [
          'Sử dụng giao thức Two-Phase Commit (2PC) / XA Transactions giữa Database và Message Broker.',
          'Áp dụng Transactional Outbox Pattern kết hợp với cơ chế Change Data Capture (CDC) hoặc Polling Publisher để đọc event từ bảng Outbox trong DB rồi gửi sang Message Broker một cách bất đồng bộ nhưng đảm bảo at-least-once delivery.',
          'Bọc cả thao tác lưu DB và publish message vào cùng một try-catch block; nếu publish thất bại thì thực hiện DB rollback thủ công qua code ứng dụng nghiệp vụ.',
          'Sử dụng kỹ thuật Exponential Backoff Retry trực tiếp tại tầng service khi gọi Message Broker.',
        ],
        correctIndexes: [1],
        explanation: 'Transactional Outbox Pattern giải quyết triệt để bài toán Dual-Write bằng cách ghi message vào một bảng Outbox nằm trong cùng một database transaction với bảng nghiệp vụ.',
      },
    ],
  };

  const { error, value } = createQuizSchema.validate(longPayload);
  assert.equal(error, undefined);
  assert.equal(value.course, '');
  assert.ok(value.questions[0].options[1].length > 200);
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

