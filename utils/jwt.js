const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  // Fail fast: beri log yang jelas sehingga kamu tahu .env belum benar
  console.error('FATAL: JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not set in .env');
  // don't throw here to avoid crash on import in dev — but you can choose to throw
}

const generateToken = (payload, type = 'access') => {
  const secret = type === 'refresh' ? REFRESH_SECRET : ACCESS_SECRET;
  const expiresIn = type === 'refresh'
    ? (process.env.JWT_REFRESH_EXPIRES_IN || '7d')
    : (process.env.JWT_ACCESS_EXPIRES_IN || '15m');

  if (!secret) {
    throw new Error(`Missing ${type} secret for JWT`);
  }

  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token, type = 'access') => {
  const secret = type === 'refresh' ? REFRESH_SECRET : ACCESS_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
