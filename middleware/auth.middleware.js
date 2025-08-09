const { verifyToken } = require('../utils/jwt');

const authMiddleware = (tokenType = 'access') => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Authorization token missing or malformed',
        });
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token, tokenType);

      if (!decoded || !decoded.id) {
        return res.status(401).json({
          success: false,
          message: 'Token payload invalid',
        });
      }

      req.user = decoded;
      return next();
    } catch (err) {
      console.error('Auth middleware error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Token invalid or expired',
      });
    }
  };
};

module.exports = {
  authAccess: authMiddleware('access'), // untuk API biasa
  authRefresh: authMiddleware('refresh'), // untuk endpoint refresh token
};
