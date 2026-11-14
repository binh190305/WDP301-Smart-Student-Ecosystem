/**
 * Competency Catalog & Evidence Evaluator
 * Defines standard competencies for key skills (React, SQL, Node.js, Python, TypeScript, Docker, etc.)
 * and provides evidence relevance scoring and rubric assessment.
 */
const { normalizeSkill } = require('../recommendation/skill-catalog');

const STANDARD_COMPETENCIES = {
  react: [
    { name: 'Components & JSX', description: 'Functional components, props passing, conditional rendering', requiredLevel: 2, keywords: ['component', 'jsx', 'props', 'render'] },
    { name: 'State Management', description: 'useState, useReducer, Redux or Zustand state flow', requiredLevel: 3, keywords: ['state', 'usestate', 'usereducer', 'redux', 'zustand', 'store'] },
    { name: 'Hooks Lifecycle', description: 'useEffect, useMemo, useCallback, custom hooks', requiredLevel: 3, keywords: ['hook', 'useeffect', 'usememo', 'usecallback', 'lifecycle'] },
    { name: 'Context API', description: 'Global context provider and consumer pattern', requiredLevel: 3, keywords: ['context', 'createcontext', 'usecontext', 'provider'] },
    { name: 'API Integration', description: 'Axios, Fetch, async side effects, loading and error states', requiredLevel: 3, keywords: ['axios', 'fetch', 'api', 'async', 'await', 'rest', 'endpoint'] },
    { name: 'Performance Optimization', description: 'Code splitting, memoization, virtualization', requiredLevel: 4, keywords: ['performance', 'memo', 'lazy', 'suspense', 'optimization', 'profiler'] },
  ],
  'node.js': [
    { name: 'Async/Await & Event Loop', description: 'Non-blocking I/O, Promises, Streams, Event Loop mechanics', requiredLevel: 3, keywords: ['async', 'await', 'promise', 'event loop', 'stream', 'buffer'] },
    { name: 'Express Routing & Middleware', description: 'Request/response lifecycle, custom middlewares, router modularization', requiredLevel: 3, keywords: ['express', 'route', 'middleware', 'next', 'request', 'response'] },
    { name: 'JWT Authentication & Security', description: 'Token issuance, bcrypt hashing, helmet, CORS, authorization guards', requiredLevel: 3, keywords: ['jwt', 'token', 'auth', 'bcrypt', 'security', 'role', 'session'] },
    { name: 'Database Integration', description: 'ORM/ODM connection, transactions, schema modeling', requiredLevel: 3, keywords: ['mongoose', 'mongodb', 'orm', 'odm', 'query', 'connection', 'schema'] },
    { name: 'Error Handling & Logging', description: 'Global error handler, Winston/Morgan logs, graceful degradation', requiredLevel: 3, keywords: ['error', 'exception', 'logging', 'winston', 'status code'] },
  ],
  sql: [
    { name: 'Basic Queries & Filters', description: 'SELECT, WHERE, ORDER BY, GROUP BY, HAVING', requiredLevel: 2, keywords: ['select', 'where', 'group by', 'order by', 'having', 'filter'] },
    { name: 'Table Joins', description: 'INNER JOIN, LEFT/RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN', requiredLevel: 3, keywords: ['join', 'inner join', 'left join', 'foreign key'] },
    { name: 'Aggregation & Window Functions', description: 'SUM, AVG, COUNT, OVER, PARTITION BY, RANK', requiredLevel: 3, keywords: ['aggregate', 'sum', 'avg', 'count', 'window', 'partition by'] },
    { name: 'Database Design & Normalization', description: '1NF, 2NF, 3NF, ER diagrams, primary/foreign keys', requiredLevel: 3, keywords: ['design', 'schema', 'normalization', 'primary key', 'foreign key', 'ddl'] },
    { name: 'Indexing & Query Optimization', description: 'B-Tree indexes, EXPLAIN ANALYZE, slow query tuning', requiredLevel: 4, keywords: ['index', 'explain', 'optimize', 'execution plan', 'performance'] },
  ],
  python: [
    { name: 'Core Data Structures', description: 'Lists, dicts, tuples, sets, comprehensions, generators', requiredLevel: 2, keywords: ['list', 'dict', 'set', 'comprehension', 'generator', 'tuple'] },
    { name: 'Object-Oriented Programming', description: 'Classes, inheritance, polymorphism, encapsulation, dunder methods', requiredLevel: 3, keywords: ['class', 'oop', 'inheritance', 'method', 'dunder'] },
    { name: 'Data Manipulation (Pandas/NumPy)', description: 'DataFrames, Series, filtering, transformations, vector operations', requiredLevel: 3, keywords: ['pandas', 'numpy', 'dataframe', 'series', 'transformation'] },
    { name: 'Machine Learning Basics', description: 'Scikit-Learn, data splitting, train/test, classification, regression', requiredLevel: 3, keywords: ['scikit-learn', 'sklearn', 'train', 'test', 'model', 'regression', 'classification'] },
    { name: 'API & Web Frameworks', description: 'FastAPI, Flask, Django REST endpoints', requiredLevel: 3, keywords: ['fastapi', 'flask', 'django', 'rest', 'route'] },
  ],
  typescript: [
    { name: 'Type Annotations & Primitives', description: 'Primitive types, arrays, union/intersection types', requiredLevel: 2, keywords: ['type', 'string', 'number', 'union', 'intersection'] },
    { name: 'Interfaces & Type Aliases', description: 'Defining object shapes, extending interfaces, declaration merging', requiredLevel: 3, keywords: ['interface', 'type', 'implements', 'extends'] },
    { name: 'Generics', description: 'Generic functions, generic classes, constraints, keyof', requiredLevel: 4, keywords: ['generic', 'keyof', 'typeof', 'constraint', 'template'] },
    { name: 'Utility Types', description: 'Partial, Pick, Omit, Record, Readonly, ReturnType', requiredLevel: 3, keywords: ['partial', 'pick', 'omit', 'record', 'readonly', 'utility'] },
  ],
  docker: [
    { name: 'Dockerfile Creation', description: 'FROM, WORKDIR, COPY, RUN, CMD, ENTRYPOINT, caching layers', requiredLevel: 2, keywords: ['dockerfile', 'layer', 'cmd', 'entrypoint', 'copy', 'run'] },
    { name: 'Container Lifecycle', description: 'docker build, run, stop, ps, logs, exec', requiredLevel: 2, keywords: ['build', 'run', 'stop', 'exec', 'container'] },
    { name: 'Docker Compose Orchestration', description: 'docker-compose.yml services, volumes, networks, environment vars', requiredLevel: 3, keywords: ['compose', 'service', 'volume', 'network', 'environment'] },
    { name: 'Multi-stage Builds & Optimization', description: 'Shrinking image sizes, Alpine bases, layer caching', requiredLevel: 4, keywords: ['multi-stage', 'alpine', 'optimization', 'size', 'cache'] },
  ],
  mongodb: [
    { name: 'Document CRUD', description: 'insertOne, find, updateOne, deleteMany, filter operators', requiredLevel: 2, keywords: ['crud', 'find', 'insert', 'update', 'delete', 'operator'] },
    { name: 'Schema Modeling (Mongoose)', description: 'Schemas, Models, virtuals, middleware pre/post hooks', requiredLevel: 3, keywords: ['mongoose', 'schema', 'model', 'virtual', 'pre', 'post'] },
    { name: 'Aggregation Pipeline', description: '$match, $group, $lookup, $project, $unwind', requiredLevel: 4, keywords: ['aggregation', 'pipeline', 'match', 'group', 'lookup', 'project'] },
    { name: 'Indexing & Performance', description: 'Compound indexes, text indexes, executionStats', requiredLevel: 3, keywords: ['index', 'compound', 'explain', 'stats', 'performance'] },
  ],
  git: [
    { name: 'Basic Versioning', description: 'git add, commit, push, pull, status, log', requiredLevel: 2, keywords: ['add', 'commit', 'push', 'pull', 'status', 'log'] },
    { name: 'Branching & Flow', description: 'git checkout, branch, merge, GitFlow strategy', requiredLevel: 3, keywords: ['branch', 'checkout', 'merge', 'gitflow', 'pr', 'pull request'] },
    { name: 'Conflict Resolution & Rebasing', description: 'Resolving merge conflicts, git rebase, cherry-pick', requiredLevel: 3, keywords: ['conflict', 'rebase', 'cherry-pick', 'resolve', 'stash'] },
  ],
};

/**
 * Returns standard competencies for a skill name, or generates sensible defaults.
 */
const getStandardCompetencies = (skillName) => {
  const normalized = normalizeSkill(skillName);
  if (STANDARD_COMPETENCIES[normalized]) {
    return STANDARD_COMPETENCIES[normalized].map((c) => ({
      name: c.name,
      description: c.description,
      requiredLevel: c.requiredLevel,
      score: null,
      status: 'untested',
      evidenceSnippet: '',
      strengths: '',
      weaknesses: '',
    }));
  }
  // Generic fallback competencies
  return [
    { name: `Kiến thức cơ bản ${skillName}`, description: `Nắm vững cú pháp và khái niệm nền tảng của ${skillName}`, requiredLevel: 2, score: null, status: 'untested' },
    { name: `Ứng dụng thực hành ${skillName}`, description: `Xây dựng chức năng thực tế trong dự án với ${skillName}`, requiredLevel: 3, score: null, status: 'untested' },
    { name: `Tối ưu & Xử lý lỗi ${skillName}`, description: `Debug, kiểm thử và tối ưu hoá mã nguồn ${skillName}`, requiredLevel: 4, score: null, status: 'untested' },
  ];
};

/**
 * Evaluates the relevance and score of an evidence snippet for a given skill.
 * Checks for keyword matches and competency demonstration.
 * @param {string} skillName
 * @param {string} text
 * @returns {{ relevance: number, demonstratedCompetencies: string[], feedback: string, suggestedScore: number }}
 */
const evaluateEvidenceRelevance = (skillName, text = '') => {
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return {
      relevance: 0.1,
      demonstratedCompetencies: [],
      feedback: 'Bằng chứng quá ngắn hoặc không có nội dung cụ thể để phân tích.',
      suggestedScore: 20,
    };
  }

  const normalized = normalizeSkill(skillName);
  const textLower = text.toLowerCase();
  const comps = STANDARD_COMPETENCIES[normalized] || [];

  const demonstrated = [];
  let matchCount = 0;

  for (const c of comps) {
    const hits = (c.keywords || []).filter((kw) => textLower.includes(kw));
    if (hits.length > 0) {
      demonstrated.push(c.name);
      matchCount += hits.length;
    }
  }

  // Check if skill name itself appears in text
  const nameAppears = textLower.includes(skillName.toLowerCase()) || textLower.includes(normalized);

  if (!nameAppears && matchCount === 0) {
    return {
      relevance: 0.15,
      demonstratedCompetencies: [],
      feedback: `Nội dung bằng chứng không chứa từ khoá hay khái niệm liên quan đến kỹ năng ${skillName}. Cần bổ sung tài liệu cụ thể hơn.`,
      suggestedScore: 25,
    };
  }

  const relevance = Math.min(1.0, 0.4 + (demonstrated.length / (comps.length || 3)) * 0.4 + Math.min(matchCount, 6) * 0.05);
  const suggestedScore = Math.min(95, Math.round(55 + relevance * 35));

  return {
    relevance: Number(relevance.toFixed(2)),
    demonstratedCompetencies: demonstrated,
    feedback: demonstrated.length > 0
      ? `Bằng chứng thể hiện năng lực trong các chủ đề: ${demonstrated.join(', ')}.`
      : `Bằng chứng có đề cập đến ${skillName} nhưng chưa chi tiết các competency kỹ thuật chuyên sâu.`,
    suggestedScore,
  };
};

module.exports = {
  STANDARD_COMPETENCIES,
  getStandardCompetencies,
  evaluateEvidenceRelevance,
};

