const User = require('../models/User');
const Lender = require('../models/Lender');
const Borrower = require('../models/Borrower');
const { generateToken } = require('../utils/helpers');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    const user = await User.findOne({ username }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    let profile;
    if (user.role === 'lender') {
      profile = await Lender.findOne({ userId: user._id });
    } else if (user.role === 'borrower') {
      profile = await Borrower.findOne({ userId: user._id });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        profile: profile || null
      }
    });
  } catch (error) {
    next(error);
  }
};