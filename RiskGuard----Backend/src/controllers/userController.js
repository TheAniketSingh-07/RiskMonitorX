import User from '../models/User.js';

// GET /api/v1/auth/users
// Only admin can access
export const getAllUsers = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied', data: null, error: null });
    }
    const users = await User.find().select('-password');
    res.json({ success: true, message: 'All users fetched', data: users, error: null });
  } catch (error) {
    next(error);
  }
};
