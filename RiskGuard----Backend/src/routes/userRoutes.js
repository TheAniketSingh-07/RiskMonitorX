import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Only admin can access this route
router.get('/', protect, getAllUsers);

export default router;
