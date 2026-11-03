// Đồng bộ vector embedding thủ công (job nền trong server cũng làm việc này định kỳ).
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const { mongoUri } = require('../config/env');
const { syncEmbeddings } = require('../recommendation/embedding/sync');

const run = async () => {
  await connectDB(mongoUri);
  const started = Date.now();
  const result = await syncEmbeddings({ log: console.log });
  console.log('Kết quả:', result, `(${Date.now() - started} ms)`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
