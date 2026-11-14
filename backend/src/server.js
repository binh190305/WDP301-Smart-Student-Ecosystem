const app = require('./app');
const connectDB = require('./config/db');
const { port, mongoUri } = require('./config/env');
const { startEmbeddingJob } = require('./recommendation/embedding/sync');
const { seedGraph } = require('./skill-intelligence/knowledge-graph.service');

const start = async () => {
  try {
    await connectDB(mongoUri);
    console.log('Connected to MongoDB!');
    app.listen(port, () => {
      console.log(`Server is running at port ${port}`);
      startEmbeddingJob();
      // AI CORE 01: seed initial Knowledge Graph relationships (no-op if already seeded)
      seedGraph().catch((err) => console.warn('[skill-graph] Seed skipped:', err.message));
    });
  } catch (err) {
    console.error('Could not start the server. Error:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise error:', reason);
  });

  start();
}

module.exports = { start };
