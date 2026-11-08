import client from './client';

export const authApi = {
  register: (payload) => client.post('/auth/register', payload),
  login: (payload) => client.post('/auth/login', payload),
  me: () => client.get('/auth/me'),
  forgotPassword: (payload) => client.post('/auth/forgot-password', payload),
  resetPassword: (payload) => client.post('/auth/reset-password', payload),
  changePassword: (payload) => client.post('/auth/change-password', payload),
  logout: () => client.post('/auth/logout'),
};

export const userApi = {
  updateProfile: (payload) => client.patch('/users/me', payload),
  uploadAvatar: (formData) => client.post('/users/me/avatar', formData),
  searchStudents: (params) => client.get('/users/students', { params }),
  publicProfile: (id) => client.get(`/users/students/${id}`),
  list: (params) => client.get('/users', { params }),
  create: (payload) => client.post('/users', payload),
  update: (id, payload) => client.patch(`/users/${id}`, payload),
  remove: (id) => client.delete(`/users/${id}`),
};

export const teamApi = {
  list: (params) => client.get('/teams', { params }),
  mine: () => client.get('/teams/mine'),
  recommended: (params) => client.get('/teams/recommended', { params }),
  get: (id) => client.get(`/teams/${id}`),
  create: (payload) => client.post('/teams', payload),
  update: (id, payload) => client.patch(`/teams/${id}`, payload),
  remove: (id) => client.delete(`/teams/${id}`),
  leave: (id) => client.post(`/teams/${id}/leave`),
  removeMember: (id, userId) => client.delete(`/teams/${id}/members/${userId}`),
  recommendedTeammates: (id, params) => client.get(`/teams/${id}/recommended-teammates`, { params }),
  invitations: (id, params) => client.get(`/teams/${id}/invitations`, { params }),
  invite: (id, payload) => client.post(`/teams/${id}/invitations`, payload),
  requestJoin: (id, payload) => client.post(`/teams/${id}/join-requests`, payload),
  teamRequests: (id, params) => client.get(`/teams/${id}/join-requests`, { params }),
  decideRequest: (requestId, payload) => client.patch(`/teams/join-requests/${requestId}`, payload),
  messages: (id, params) => client.get(`/teams/${id}/messages`, { params }),
  sendMessage: (id, content) => client.post(`/teams/${id}/messages`, { content }),
  resources: (id) => client.get(`/teams/${id}/resources`),
  uploadFile: (id, formData) => client.post(`/teams/${id}/resources/files`, formData),
  addLink: (id, payload) => client.post(`/teams/${id}/resources/links`, payload),
  removeResource: (id, resourceId) => client.delete(`/teams/${id}/resources/${resourceId}`),
  downloadResource: (id, resourceId) => client.get(`/teams/${id}/resources/${resourceId}/download`, { responseType: 'blob' }),
};

export const recommendationApi = {
  groups: (studentId = 'me', params) => client.get(`/students/${studentId}/group-recommendations`, { params }),
  chat: (payload, studentId = 'me') => client.post(`/students/${studentId}/group-recommendations/chat`, payload),
  members: (teamId, params) => client.get(`/groups/${teamId}/member-recommendations`, { params }),
  click: (payload) => client.post('/recommendations/events', payload),
};

export const invitationApi = {
  mine: (params) => client.get('/team-invitations/mine', { params }),
  accept: (id) => client.post(`/team-invitations/${id}/accept`),
  reject: (id) => client.post(`/team-invitations/${id}/reject`),
};

export const joinRequestApi = {
  mine: (params) => client.get('/join-requests/mine', { params }),
  cancel: (requestId) => client.post(`/join-requests/${requestId}/cancel`),
};

export const courseApi = {
  list: (params) => client.get('/courses', { params }),
  get: (id) => client.get(`/courses/${id}`),
  create: (payload) => client.post('/courses', payload),
  update: (id, payload) => client.patch(`/courses/${id}`, payload),
  remove: (id) => client.delete(`/courses/${id}`),
  enroll: (id) => client.post(`/courses/${id}/enroll`),
  unenroll: (id) => client.delete(`/courses/${id}/enroll`),
  roster: (id) => client.get(`/courses/${id}/roster`),
  gradebook: (id) => client.get(`/courses/${id}/gradebook`),
  analytics: (id) => client.get(`/courses/${id}/analytics`),
};

export const lessonApi = {
  list: (courseId) => client.get('/lessons', { params: { course: courseId } }),
  create: (payload) => client.post('/lessons', payload),
  update: (id, payload) => client.patch(`/lessons/${id}`, payload),
  remove: (id) => client.delete(`/lessons/${id}`),
  complete: (id) => client.post(`/lessons/${id}/complete`),
  uncomplete: (id) => client.delete(`/lessons/${id}/complete`),
};

export const calendarApi = {
  upcoming: () => client.get('/calendar/upcoming'),
};

export const gamificationApi = {
  leaderboard: () => client.get('/gamification/leaderboard'),
};

export const searchApi = {
  global: (q) => client.get('/search', { params: { q } }),
};

export const eventApi = {
  get: (id) => client.get(`/posts/${id}`),
  register: (id) => client.post(`/posts/${id}/registrations`),
  cancel: (id) => client.delete(`/posts/${id}/registrations/me`),
  participants: (id, params) => client.get(`/posts/${id}/participants`, { params }),
  removeParticipant: (id, userId) => client.delete(`/posts/${id}/participants/${userId}`),
};

export const assignmentApi = {
  list: (params) => client.get('/assignments', { params }),
  get: (id) => client.get(`/assignments/${id}`),
  create: (payload) => client.post('/assignments', payload),
  update: (id, payload) => client.patch(`/assignments/${id}`, payload),
  remove: (id) => client.delete(`/assignments/${id}`),
  submit: (id, formData) => client.post(`/assignments/${id}/submissions`, formData),
  submissions: (id) => client.get(`/assignments/${id}/submissions`),
  grade: (id, submissionId, payload) =>
    client.post(`/assignments/${id}/submissions/${submissionId}/grade`, payload),
  downloadSubmission: (id, submissionId) => client.get(`/assignments/${id}/submissions/${submissionId}/download`, { responseType: 'blob' }),
  myGradebook: () => client.get('/assignments/gradebook/mine'),
};

export const materialApi = {
  list: (params) => client.get('/materials', { params }),
  upload: (formData) => client.post('/materials', formData),
  download: (id) => client.get(`/materials/${id}/download`, { responseType: 'blob' }),
  update: (id, payload) => client.patch(`/materials/${id}`, payload),
  remove: (id) => client.delete(`/materials/${id}`),
};

export const quizApi = {
  list: (params) => client.get('/quizzes', { params }),
  get: (id) => client.get(`/quizzes/${id}`),
  create: (payload) => client.post('/quizzes', payload),
  generateAi: (payload) => client.post('/quizzes/generate-ai', payload),
  analytics: (id) => client.get(`/quizzes/${id}/analytics`),
  import: (formData) => client.post('/quizzes/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  template: () => client.get('/quizzes/import-template', { responseType: 'blob' }),
  sample: () => client.get('/quizzes/import-sample', { responseType: 'blob' }),
  submit: (id, payload) => client.post(`/quizzes/${id}/attempts`, payload),
  myAttempts: (params) => client.get('/quizzes/attempts/mine', { params }),
  update: (id, payload) => client.patch(`/quizzes/${id}`, payload),
  remove: (id) => client.delete(`/quizzes/${id}`),
};

export const announcementApi = {
  list: (params) => client.get('/announcements', { params }),
  create: (payload) => client.post('/announcements', payload),
  broadcast: (payload) => client.post('/announcements/broadcast', payload),
  update: (id, payload) => client.patch(`/announcements/${id}`, payload),
  remove: (id) => client.delete(`/announcements/${id}`),
};

export const postApi = {
  list: (params) => client.get('/posts', { params }),
  create: (payload) => client.post('/posts', payload),
  update: (id, payload) => client.patch(`/posts/${id}`, payload),
  remove: (id) => client.delete(`/posts/${id}`),
  react: (id, payload) => client.post(`/posts/${id}/react`, payload),
  comments: (id, params) => client.get(`/posts/${id}/comments`, { params }),
  addComment: (id, content) => client.post(`/posts/${id}/comments`, { content }),
  removeComment: (id, commentId) => client.delete(`/posts/${id}/comments/${commentId}`),
};

export const notificationApi = {
  list: (params) => client.get('/notifications', { params }),
  markRead: (id) => client.post(`/notifications/${id}/read`),
  markAllRead: () => client.post('/notifications/read-all'),
  send: (payload) => client.post('/notifications/send', payload),
};

export const adminApi = {
  stats: () => client.get('/admin/stats'),
  activity: () => client.get('/admin/activity'),
  reports: (params) => client.get('/admin/reports', { params }),
  settings: () => client.get('/admin/settings'),
  updateSettings: (payload) => client.patch('/admin/settings', payload),
  clubs: (params) => client.get('/admin/clubs', { params }),
  createClub: (payload) => client.post('/admin/clubs', payload),
  updateClub: (id, payload) => client.patch(`/admin/clubs/${id}`, payload),
  deleteClub: (id) => client.delete(`/admin/clubs/${id}`),
  registrations: (params) => client.get('/admin/club-registrations', { params }),
  approveRegistration: (id) => client.post(`/admin/club-registrations/${id}/approve`),
  rejectRegistration: (id, payload) => client.post(`/admin/club-registrations/${id}/reject`, payload),
  taxonomies: (params) => client.get('/admin/taxonomies', { params }),
  createTaxonomy: (payload) => client.post('/admin/taxonomies', payload),
  updateTaxonomy: (id, payload) => client.patch(`/admin/taxonomies/${id}`, payload),
  deleteTaxonomy: (id) => client.delete(`/admin/taxonomies/${id}`),
};
