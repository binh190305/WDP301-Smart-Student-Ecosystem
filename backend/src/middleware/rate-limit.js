const AppError = require('../utils/app-error');

const createRateLimit = ({ windowMs, max, message }) => {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = requests.get(key);

    if (!current || current.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
      next(new AppError(message, 429));
      return;
    }

    next();
  };
};

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Bạn đã gửi quá nhiều yêu cầu xác thực, vui lòng thử lại sau',
});

const uploadRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Bạn đã tải lên quá nhiều tệp, vui lòng thử lại sau',
});

const aiChatRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'Bạn đã gửi quá nhiều tin nhắn cho trợ lý AI, vui lòng thử lại sau ít phút',
});

module.exports = { authRateLimit, uploadRateLimit, aiChatRateLimit };
