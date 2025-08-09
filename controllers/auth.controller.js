const db = require('../models');
const User = db.User;
const { generateToken } = require('../utils/jwt');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const newUser = await User.create({ name, email, password });

    const accessToken = generateToken({ id: newUser.id, email: newUser.email }, 'access');
    const refreshToken = generateToken({ id: newUser.id, email: newUser.email }, 'refresh');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tokens: { accessToken, refreshToken }
      },
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    const accessToken = generateToken({ id: user.id, email: user.email }, 'access');
    const refreshToken = generateToken({ id: user.id, email: user.email }, 'refresh');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        tokens: { accessToken, refreshToken }
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('Me Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
