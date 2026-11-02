// Chuẩn hoá tên kỹ năng và ánh xạ kỹ năng -> vai trò trong nhóm đồ án.

const ROLES = {
  frontend: 'Frontend',
  backend: 'Backend',
  mobile: 'Mobile',
  ai_data: 'AI/Dữ liệu',
  ui_ux: 'UI/UX',
  devops_security: 'DevOps/Bảo mật',
  ba_pm: 'Phân tích nghiệp vụ/Quản lý dự án',
  marketing: 'Marketing/Truyền thông',
};

const ALIASES = {
  reactjs: 'react',
  'react.js': 'react',
  nodejs: 'node.js',
  node: 'node.js',
  js: 'javascript',
  ts: 'typescript',
  'c sharp': 'c#',
  dotnet: '.net',
  'asp.net': '.net',
  'asp.net core': '.net',
  postgres: 'postgresql',
  mssql: 'sql server',
  ml: 'machine learning',
  'ui ux': 'ui/ux',
  'ui/ux design': 'ui/ux',
  k8s: 'kubernetes',
  ba: 'business analysis',
  pm: 'project management',
};

const SKILL_ROLES = {
  javascript: ['frontend', 'backend'],
  typescript: ['frontend', 'backend'],
  react: ['frontend'],
  'html/css': ['frontend'],
  vue: ['frontend'],
  angular: ['frontend'],
  webflow: ['frontend', 'ui_ux'],
  'node.js': ['backend'],
  express: ['backend'],
  java: ['backend'],
  'spring boot': ['backend'],
  'c#': ['backend'],
  '.net': ['backend'],
  mongodb: ['backend'],
  mysql: ['backend'],
  postgresql: ['backend'],
  'sql server': ['backend'],
  sql: ['backend', 'ai_data'],
  'system design': ['backend'],
  algorithms: ['backend'],
  'react native': ['mobile'],
  flutter: ['mobile'],
  kotlin: ['mobile'],
  swift: ['mobile'],
  python: ['ai_data', 'backend'],
  'machine learning': ['ai_data'],
  tensorflow: ['ai_data'],
  pandas: ['ai_data'],
  'data analysis': ['ai_data'],
  'recommender system': ['ai_data'],
  'deep learning': ['ai_data'],
  figma: ['ui_ux'],
  'ui/ux': ['ui_ux'],
  photoshop: ['ui_ux'],
  illustrator: ['ui_ux'],
  docker: ['devops_security'],
  kubernetes: ['devops_security'],
  linux: ['devops_security'],
  'network security': ['devops_security'],
  'web security': ['devops_security'],
  'reverse engineering': ['devops_security'],
  'business analysis': ['ba_pm'],
  'project management': ['ba_pm'],
  excel: ['ba_pm'],
  'content marketing': ['marketing'],
  seo: ['marketing'],
  canva: ['marketing', 'ui_ux'],
  'social media': ['marketing'],
};

const normalizeSkill = (name) => {
  const key = String(name || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return ALIASES[key] || key;
};

const rolesForSkill = (skill) => SKILL_ROLES[normalizeSkill(skill)] || [];

const normalizeRole = (role) => {
  const key = String(role || '').trim().toLowerCase();
  return ROLES[key] ? key : null;
};

const roleLabel = (role) => ROLES[role] || role;

module.exports = { ROLES, normalizeSkill, rolesForSkill, normalizeRole, roleLabel };
