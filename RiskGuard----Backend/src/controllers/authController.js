import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400);
      return res.json({ success: false, message: 'Please add all fields', data: null, error: null });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return res.json({ success: false, message: 'User already exists', data: null, error: null });
    }
    const user = await User.create({ name, email, password });
    res.status(201).json({ success: true, message: 'Registration successful', data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) }, error: null });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      return next(new Error('Duplicate user data detected. Please use a different email.'));
    }
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      return res.json({ success: false, message: 'Please provide email and password', data: null, error: null });
    }
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({ success: true, message: 'Login successful', data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) }, error: null });
    } else {
      res.status(401);
      return res.json({ success: false, message: 'Invalid email or password', data: null, error: null });
    }
  } catch (error) { next(error); }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, message: 'Profile fetched', data: user, error: null });
  } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return res.json({ success: false, message: 'User not found', data: null, error: null });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.body.settings) {
      user.settings = { ...user.settings, ...req.body.settings };
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        settings: updatedUser.settings,
        token: generateToken(updatedUser._id)
      },
      error: null
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400); return next(new Error('Email already taken'));
    }
    next(error);
  }
};
