// Provider embedding theo cùng một interface:
//   { name: string, embed(texts: string[]): Promise<number[][]> }
// Đổi provider bằng biến môi trường EMBEDDING_PROVIDER, không cần sửa code gọi.
const path = require('path');
const config = require('../config');

// multilingual-e5 chạy local bằng transformers.js (ONNX, không cần Python).
// e5 yêu cầu tiền tố "query: " cho bài toán so khớp đối xứng.
const createLocalE5Provider = ({ model }) => {
  let extractorPromise = null;
  const load = async () => {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.cacheDir = path.resolve(__dirname, '../../../.cache/models');
    return pipeline('feature-extraction', model, { dtype: 'q8' });
  };
  return {
    name: model,
    async embed(texts) {
      if (!extractorPromise) {
        extractorPromise = load().catch((err) => {
          extractorPromise = null;
          throw err;
        });
      }
      const extractor = await extractorPromise;
      const output = await extractor(texts.map((t) => `query: ${t}`), { pooling: 'mean', normalize: true });
      return output.tolist();
    },
  };
};

// API dạng OpenAI /v1/embeddings (OpenAI, Ollama, vLLM, ...).
const createOpenAICompatibleProvider = ({ model, apiUrl, apiKey }) => ({
  name: model,
  async embed(texts) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({ model, input: texts }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Embedding API lỗi ${res.status}`);
    const json = await res.json();
    return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  },
});

const factories = {
  'local-e5': createLocalE5Provider,
  'openai-compatible': createOpenAICompatibleProvider,
};

let cached = null;
const getEmbeddingProvider = () => {
  if (!cached) {
    const factory = factories[config.embedding.provider];
    if (!factory) throw new Error(`Không hỗ trợ embedding provider: ${config.embedding.provider}`);
    cached = factory(config.embedding);
  }
  return cached;
};

module.exports = { getEmbeddingProvider, createLocalE5Provider, createOpenAICompatibleProvider };
