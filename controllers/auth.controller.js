const db = require('../models');
const { User } = db;
const { generateToken, verifyToken } = require('../utils/jwt');
const ResponseHelper = require('../src/utils/response');
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../src/constants/response');

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ResponseHelper.error(
          res,
          'Email already registered',
          HTTP_STATUS.CONFLICT
        );
      }

      const newUser = await User.create({ name, email, password });

      const tokens = AuthController.generateUserTokens(newUser);

      const responseData = {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        },
        tokens
      };

      return ResponseHelper.success(
        res,
        responseData,
        'User registered successfully',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Register Error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.scope('withPassword').findOne({ where: { email } });
      if (!user) {
        return ResponseHelper.error(
          res,
          'Invalid email or password',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return ResponseHelper.error(
          res,
          'Invalid email or password',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const tokens = AuthController.generateUserTokens(user);

      const responseData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        tokens
      };

      return ResponseHelper.success(
        res,
        responseData,
        'Login successful'
      );
    } catch (error) {
      console.error('Login Error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return ResponseHelper.success(res, user);
    } catch (error) {
      console.error('Get profile error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async logout(req, res) {
    try {
      console.log(`User ${req.user.id} logged out`);

      return ResponseHelper.success(
        res,
        null,
        'Logged out successfully'
      );
    } catch (error) {
      console.error('Logout error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const decoded = verifyToken(refreshToken, 'refresh');
      if (!decoded) {
        return ResponseHelper.error(
          res,
          'Invalid refresh token',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const newAccessToken = generateToken(
        { id: decoded.id, email: decoded.email },
        'access'
      );

      return ResponseHelper.success(
        res,
        { accessToken: newAccessToken },
        'Token refreshed successfully'
      );
    } catch (error) {
      console.error('Refresh token error:', error);
      return ResponseHelper.error(res);
    }
  }

  // Helper method untuk generate tokens
  static generateUserTokens(user) {
    const payload = { id: user.id, email: user.email };
    return {
      accessToken: generateToken(payload, 'access'),
      refreshToken: generateToken(payload, 'refresh')
    };
  }
}

// Export methods untuk backward compatibility
module.exports = {
  register: AuthController.register,
  login: AuthController.login,
  me: AuthController.me,
  logout: AuthController.logout,
  refreshToken: AuthController.refreshToken
};
