// Gọi Claude và nhận JSON theo schema. Mọi lỗi (thiếu key, timeout, refusal, JSON sai)
// đều ném ra để nơi gọi chuyển sang phương án dự phòng.
const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

let client = null;
const getClient = () => {
  if (!client) client = new Anthropic({ timeout: config.llm.timeoutMs, maxRetries: 1 });
  return client;
};

// Đọc env lúc gọi (không lúc require) để không phụ thuộc thứ tự nạp dotenv.
const isLlmEnabled = () => process.env.LLM_ENABLED !== 'false' && Boolean(process.env.ANTHROPIC_API_KEY);

const completeJson = async ({ system, user, schema, maxTokens = 4000 }) => {
  if (!isLlmEnabled()) throw new Error('LLM chưa được cấu hình');
  const response = await getClient().messages.create({
    model: config.llm.model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema },
    },
  });
  if (response.stop_reason !== 'end_turn') {
    throw new Error(`LLM dừng bất thường: ${response.stop_reason}`);
  }
  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('LLM không trả về nội dung');
  return JSON.parse(text);
};

module.exports = { completeJson, isLlmEnabled };
