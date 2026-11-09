const Anthropic = require('@anthropic-ai/sdk');
const AppError = require('../utils/app-error');

const SYSTEM_PROMPT = `Bạn là một chuyên gia khảo thí và sư phạm đại học. Nhiệm vụ của bạn là soạn thảo bộ câu hỏi trắc nghiệm khách quan dựa trên chủ đề hoặc tài liệu được cung cấp.

Yêu cầu định dạng JSON đầu ra:
Bạn PHẢI trả về đúng định dạng JSON tuân thủ schema sau:
{
  "questions": [
    {
      "questionText": "Nội dung câu hỏi ngắn gọn, rõ ràng, mang tính sư phạm và bám sát kiến thức thực tế của chủ đề?",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "correctIndexes": [0],
      "explanation": "Giải thích chi tiết và chính xác vì sao đáp án này là đúng."
    }
  ]
}

Quy tắc biên soạn:
1. Mỗi câu hỏi phải có từ 3 đến 4 lựa chọn (options).
2. "correctIndexes" là mảng chỉ số (0-based) của đáp án đúng (ví dụ: [0] hoặc [1] hoặc [2] hoặc [3]).
3. "explanation" phải giải thích kiến thức chuyên môn rõ ràng, dễ hiểu.
4. Ngôn ngữ câu hỏi phải khớp với ngôn ngữ của chủ đề hoặc tài liệu đầu vào (mặc định là Tiếng Việt).
5. TUYỆT ĐỐI chỉ trả về chuỗi JSON thuần túy, không có văn bản phụ trợ hay thẻ markdown.`;

const buildUserPrompt = ({ prompt, text, questionCount = 5, difficulty = 'medium' }) => {
  const diffMap = {
    easy: 'Dễ (nhận biết khái niệm, định nghĩa cơ bản)',
    medium: 'Trung bình (hiểu và áp dụng kiến thức thực tiễn)',
    hard: 'Nâng cao (phân tích, so sánh, giải quyết tình huống kỹ thuật)',
  };

  let content = `Hãy biên soạn chính xác ${questionCount} câu hỏi trắc nghiệm ở mức độ: ${diffMap[difficulty] || diffMap.medium}.\n`;
  if (prompt && prompt.trim()) {
    content += `\nChủ đề bài học / Yêu cầu cụ thể:\n"${prompt.trim()}"\n`;
  }
  if (text && text.trim()) {
    content += `\nTài liệu / Văn bản bài giảng tham khảo:\n${text.trim().slice(0, 10000)}\n`;
  }

  return content;
};

// Gọi Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
// const generateWithGemini = async ({ prompt, text, questionCount, difficulty, customKey }) => {
//   const apiKey = (customKey || process.env.GEMINI_API_KEY || '').trim();
//   if (!apiKey) return null;

//   // Thử model mới nhất theo khuyến nghị của Google AI Studio: gemini-3.8-flash -> gemini-2.5-flash -> gemini-1.5-flash
//   const models = [
//     process.env.GEMINI_MODEL,
//     'gemini-3.8-flash',
//     'gemini-2.5-flash',
//     'gemini-1.5-flash',
//   ].filter(Boolean);
//   let lastError = null;

//   const userContent = buildUserPrompt({ prompt, text, questionCount, difficulty });
//   const body = {
//     contents: [
//       {
//         role: 'user',
//         parts: [{ text: `${SYSTEM_PROMPT}\n\n${userContent}` }],
//       },
//     ],
//     generationConfig: {
//       temperature: 0.7,
//       responseMimeType: 'application/json',
//     },
//   };

//   for (const model of models) {
//     try {
//       const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
//       const res = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body),
//       });

//       if (!res.ok) {
//         const errorText = await res.text();
//         throw new Error(`${model} error ${res.status}: ${errorText}`);
//       }

//       const data = await res.json();
//       const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//       if (!textOutput) throw new Error('Gemini không trả về nội dung');

//       const cleanJson = textOutput.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
//       const parsed = JSON.parse(cleanJson);
//       return parsed.questions || parsed;
//     } catch (err) {
//       lastError = err;
//     }
//   }

//   throw new Error(`Google Gemini API thất bại: ${lastError?.message}`);
// };

const generateWithGemini = async ({ prompt, text, questionCount, difficulty, customKey }) => {
  const apiKey = (customKey || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;

  const models = [
    process.env.GEMINI_MODEL,
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
  ].filter(Boolean);

  const userContent = buildUserPrompt({ prompt, text, questionCount, difficulty });
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  };

  const errors = [];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
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
        const err = new Error(`${model} error ${res.status}: ${errorText}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textOutput = parts.map((p) => p.text || '').join('').trim();
      if (!textOutput) throw new Error(`${model}: Gemini không trả về nội dung`);

      const cleanJson = textOutput.replace(/```(?:json)?/gi, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed.questions || parsed;
    } catch (err) {
      errors.push(err.message);
      console.error('[Gemini]', err.message);

      // Key sai / request sai: thử model khác cũng vô ích
      if (err.status === 400 || err.status === 401 || err.status === 403) break;
    }
  }

  throw new Error(`Google Gemini API thất bại:\n${errors.join('\n')}`);
};

// Gọi OpenAI API (gpt-4o-mini)
const generateWithOpenAI = async ({ prompt, text, questionCount, difficulty, customKey }) => {
  const apiKey = (customKey || process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return null;

  const userContent = buildUserPrompt({ prompt, text, questionCount, difficulty });
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI không trả về nội dung');

  const parsed = JSON.parse(content);
  return parsed.questions || parsed;
};

// Gọi Anthropic Claude API
const generateWithAnthropic = async ({ prompt, text, questionCount, difficulty, customKey }) => {
  const apiKey = (customKey || process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey, timeout: 25000, maxRetries: 1 });
  const userContent = buildUserPrompt({ prompt, text, questionCount, difficulty });

  const response = await client.messages.create({
    model: process.env.LLM_MODEL || 'claude-3-5-haiku-20241022',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === 'text')?.text;
  if (!textBlock) throw new Error('Claude không trả về nội dung');

  const cleanJson = textBlock.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  return parsed.questions || parsed;
};

/**
 * Hàm điều phối chính để sinh câu hỏi trắc nghiệm bằng AI thực tế
 */
const generateQuizQuestions = async ({ prompt, text, questionCount = 5, difficulty = 'medium', apiKey, provider }) => {
  const count = Math.min(Math.max(Number(questionCount) || 5, 1), 20);

  // Xác định xem có key nào khả dụng không
  const hasGeminiKey = Boolean(apiKey && (provider === 'gemini' || !provider)) || Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAiKey = Boolean(apiKey && provider === 'openai') || Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropicKey = Boolean(apiKey && provider === 'anthropic') || Boolean(process.env.ANTHROPIC_API_KEY);

  if (!hasGeminiKey && !hasOpenAiKey && !hasAnthropicKey) {
    throw new AppError(
      'Hệ thống chưa có API Key của AI. Bạn vui lòng dán API Key Google Gemini (miễn phí tại aistudio.google.com) hoặc OpenAI vào ô cấu hình để AI sinh câu hỏi thực tế.',
      400
    );
  }

  // 1. Thử Gemini nếu có key
  if (hasGeminiKey) {
    try {
      const q = await generateWithGemini({
        prompt,
        text,
        questionCount: count,
        difficulty,
        customKey: provider === 'gemini' || !provider ? apiKey : undefined,
      });
      if (Array.isArray(q) && q.length > 0) return sanitizeQuestions(q, count);
    } catch (err) {
      if (!hasOpenAiKey && !hasAnthropicKey) {
        throw new AppError(`Lỗi kết nối Gemini API: ${err.message}`, 400);
      }
      console.warn('[AI Quiz] Gemini failed, attempting next provider:', err.message);
    }
  }

  // 2. Thử OpenAI nếu có key
  if (hasOpenAiKey) {
    try {
      const q = await generateWithOpenAI({
        prompt,
        text,
        questionCount: count,
        difficulty,
        customKey: provider === 'openai' ? apiKey : undefined,
      });
      if (Array.isArray(q) && q.length > 0) return sanitizeQuestions(q, count);
    } catch (err) {
      if (!hasAnthropicKey) {
        throw new AppError(`Lỗi kết nối OpenAI API: ${err.message}`, 400);
      }
      console.warn('[AI Quiz] OpenAI failed, attempting next provider:', err.message);
    }
  }

  // 3. Thử Anthropic nếu có key
  if (hasAnthropicKey) {
    try {
      const q = await generateWithAnthropic({
        prompt,
        text,
        questionCount: count,
        difficulty,
        customKey: provider === 'anthropic' ? apiKey : undefined,
      });
      if (Array.isArray(q) && q.length > 0) return sanitizeQuestions(q, count);
    } catch (err) {
      throw new AppError(`Lỗi kết nối Claude API: ${err.message}`, 400);
    }
  }

  throw new AppError('AI không thể xử lý nội dung này. Vui lòng kiểm tra lại API Key hoặc chủ đề nhập vào.', 400);
};

const sanitizeQuestions = (questions, count) => {
  return questions.slice(0, count).map((q, idx) => {
    const questionText = String(q.questionText || `Câu hỏi số ${idx + 1}`).trim();
    const options =
      Array.isArray(q.options) && q.options.length >= 2
        ? q.options.map((o) => String(o).trim())
        : ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'];

    let correctIndexes =
      Array.isArray(q.correctIndexes) && q.correctIndexes.length > 0
        ? q.correctIndexes.map(Number).filter((n) => !isNaN(n) && n >= 0 && n < options.length)
        : [0];
    if (correctIndexes.length === 0) correctIndexes = [0];

    const explanation = String(q.explanation || 'Đáp án chính xác theo kiến thức bài học.').trim();

    return {
      questionText,
      options,
      correctIndexes,
      explanation,
    };
  });
};

module.exports = {
  generateQuizQuestions,
};
