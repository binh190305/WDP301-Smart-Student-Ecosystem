// Job nền đồng bộ vector: chỉ tính lại khi văn bản hồ sơ/nhóm thay đổi (so hash).
// API gợi ý chỉ đọc vector đã lưu, không bao giờ gọi model lúc xử lý request.
const config = require('../config');
const { User, Team } = require('../../models');
const Embedding = require('../../models/embedding.model');
const { getEmbeddingProvider } = require('./providers');
const { buildStudentText, buildTeamText, hashText } = require('./texts');

const keyOf = (ownerType, owner) => `${ownerType}:${owner}`;

// items: [{ ownerType, owner, text }]; existing: [{ ownerType, owner, textHash }]
// -> { toEmbed: [...items có hash mới], staleKeys: [...embedding không còn chủ] }
const planSync = (items, existing) => {
  const existingHash = new Map(existing.map((e) => [keyOf(e.ownerType, e.owner), e.textHash]));
  const current = new Set();
  const toEmbed = [];
  for (const item of items) {
    const key = keyOf(item.ownerType, item.owner);
    current.add(key);
    const textHash = hashText(item.text);
    if (existingHash.get(key) !== textHash) toEmbed.push({ ...item, textHash });
  }
  const staleKeys = existing.map((e) => keyOf(e.ownerType, e.owner)).filter((k) => !current.has(k));
  return { toEmbed, staleKeys };
};

const loadItems = async () => {
  const [students, teams] = await Promise.all([
    User.find({ role: 'student', isActive: true }).select('skills preferredRoles interests description').lean(),
    Team.find({ status: { $ne: 'closed' } }).select('name topic description skillsNeeded').lean(),
  ]);
  return [
    ...students.map((u) => ({ ownerType: 'student', owner: u._id.toString(), text: buildStudentText(u) })),
    ...teams.map((t) => ({ ownerType: 'team', owner: t._id.toString(), text: buildTeamText(t) })),
  ];
};

let running = null;

const syncEmbeddings = async ({ provider = getEmbeddingProvider(), log = () => {} } = {}) => {
  if (running) return running; // không chạy chồng
  running = (async () => {
    const items = await loadItems();
    const existing = await Embedding.find({ model: provider.name }).select('ownerType owner textHash').lean();
    const { toEmbed, staleKeys } = planSync(
      items,
      existing.map((e) => ({ ...e, owner: e.owner.toString() }))
    );

    for (let i = 0; i < toEmbed.length; i += config.embedding.batchSize) {
      const batch = toEmbed.slice(i, i + config.embedding.batchSize);
      const vectors = await provider.embed(batch.map((b) => b.text));
      await Embedding.bulkWrite(
        batch.map((b, j) => ({
          updateOne: {
            filter: { ownerType: b.ownerType, owner: b.owner, model: provider.name },
            update: { $set: { textHash: b.textHash, vector: vectors[j] } },
            upsert: true,
          },
        }))
      );
    }

    if (staleKeys.length) {
      await Embedding.deleteMany({
        model: provider.name,
        $or: staleKeys.map((k) => {
          const [ownerType, owner] = k.split(':');
          return { ownerType, owner };
        }),
      });
    }

    const result = { total: items.length, embedded: toEmbed.length, removed: staleKeys.length };
    if (result.embedded || result.removed) log(`[embedding] đồng bộ xong: ${JSON.stringify(result)}`);
    return result;
  })().finally(() => {
    running = null;
  });
  return running;
};

// Đọc vector đã lưu. ownerIds: mảng id (string) -> Map(id -> vector)
const getVectors = async (ownerType, ownerIds, model = getEmbeddingProvider().name) => {
  if (!config.embedding.enabled || !ownerIds.length) return new Map();
  const docs = await Embedding.find({ ownerType, owner: { $in: ownerIds }, model }).select('owner vector').lean();
  return new Map(docs.map((d) => [d.owner.toString(), d.vector]));
};

// Chạy ngay khi khởi động rồi lặp theo chu kỳ. Lỗi chỉ ghi log, không làm sập server.
const startEmbeddingJob = ({ log = console.log } = {}) => {
  if (!config.embedding.enabled) return null;
  const tick = () => syncEmbeddings({ log }).catch((err) => log(`[embedding] lỗi đồng bộ: ${err.message}`));
  tick();
  const timer = setInterval(tick, config.embedding.syncIntervalMs);
  timer.unref();
  return timer;
};

module.exports = { planSync, syncEmbeddings, getVectors, startEmbeddingJob };
