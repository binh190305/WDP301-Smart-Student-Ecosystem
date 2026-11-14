const path = require('path');
const fs = require('fs');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const AVATARS_ROOT = path.join(UPLOADS_ROOT, 'avatars');

const datedSubdir = (date = new Date()) => {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return path.join(year, month, day);
};

const publicUrlFor = (file) => {
  const relative = path.relative(UPLOADS_ROOT, file.path).split(path.sep).join('/');
  return `/uploads/${relative}`;
};

const avatarUrlFor = (file) => {
  const relative = path.relative(AVATARS_ROOT, file.path).split(path.sep).join('/');
  return `/uploads/avatars/${relative}`;
};

const protectedUrlFor = (type, ids) => {
  if (type === 'material') return `/api/materials/${ids.materialId}/download`;
  if (type === 'teamResource') return `/api/teams/${ids.teamId}/resources/${ids.resourceId}/download`;
  if (type === 'submission') {
    return `/api/assignments/${ids.assignmentId}/submissions/${ids.submissionId}/download`;
  }
  throw new Error('Unsupported protected upload type');
};

const resolveUploadPath = (fileUrl) => {
  if (!fileUrl) return null;
  const relative = fileUrl.replace(/^\/uploads\//, '');
  const resolved = path.resolve(UPLOADS_ROOT, relative);
  if (resolved !== UPLOADS_ROOT && !resolved.startsWith(UPLOADS_ROOT + path.sep)) return null;
  return resolved;
};

const resolveStoredPath = (storagePath, fileUrl) => {
  if (storagePath) {
    const resolved = path.resolve(storagePath);
    if (resolved.startsWith(UPLOADS_ROOT + path.sep) && fs.existsSync(resolved)) {
      return resolved;
    }
    const match = storagePath.split(/[\\/]uploads[\\/]/i);
    if (match.length > 1) {
      const relPath = match[match.length - 1];
      const remapped = path.resolve(UPLOADS_ROOT, relPath);
      if (remapped.startsWith(UPLOADS_ROOT + path.sep) && fs.existsSync(remapped)) {
        return remapped;
      }
    }
  }
  return resolveUploadPath(fileUrl);
};

module.exports = {
  UPLOADS_ROOT,
  AVATARS_ROOT,
  datedSubdir,
  publicUrlFor,
  avatarUrlFor,
  protectedUrlFor,
  resolveUploadPath,
  resolveStoredPath,
};
