import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  getProfile,
  updateProfile,
  validateSession
} from '../controllers/authController';

const router = express.Router();

// Auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/password', protect, updatePassword);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/validate', protect, validateSession);

export default router;