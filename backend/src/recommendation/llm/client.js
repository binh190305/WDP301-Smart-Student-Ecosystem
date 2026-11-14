// Gọi Claude, Gemini hoặc OpenAI và nhận JSON theo schema.
// Mọi lỗi đều ném ra để nơi gọi chuyển sang phương án dự phòng.
const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

let anthropicClient = null;
const getAnthropicClient = () => {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: config.llm?.timeoutMs || 30000,
      maxRetries: 1,
    });
  }
  return anthropicClient;
};

// Đọc env lúc gọi (không lúc require) để không phụ thuộc thứ tự nạp dotenv.
const isLlmEnabled = () =>
  process.env.LLM_ENABLED !== 'false' &&
  Boolean(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

/**
 * Gọi Google Gemini REST API (native fetch)
 */
const completeWithGemini = async ({ system, user, schema, maxTokens = 4000 }) => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY chưa được cấu hình');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error('Gemini không trả về nội dung');

  const cleanJson = textOutput.replace(/```(?:json)?/gi, '').trim();
  return JSON.parse(cleanJson);
};

/**
 * Gọi Anthropic Claude API
 */
const completeWithAnthropic = async ({ system, user, schema, maxTokens = 4000 }) => {
  const response = await getAnthropicClient().messages.create({
    model: config.llm?.model || 'claude-3-5-sonnet-20241022',
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

/**
 * Gọi OpenAI API
 */
const completeWithOpenAI = async ({ system, user, maxTokens = 4000 }) => {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY chưa được cấu hình');

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI không trả về nội dung');
  return JSON.parse(content);
};

/**
 * Điều phối gọi LLM tương ứng theo API key hiện có
 */
const completeJson = async ({ system, user, schema, maxTokens = 4000 }) => {
  if (!isLlmEnabled()) throw new Error('LLM chưa được cấu hình');

  if (process.env.GEMINI_API_KEY) {
    return completeWithGemini({ system, user, schema, maxTokens });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return completeWithAnthropic({ system, user, schema, maxTokens });
  }

  if (process.env.OPENAI_API_KEY) {
    return completeWithOpenAI({ system, user, maxTokens });
  }

  throw new Error('Chưa cấu hình API Key cho bất kỳ LLM nào (Gemini, Anthropic, OpenAI)');
};

module.exports = { completeJson, isLlmEnabled };
