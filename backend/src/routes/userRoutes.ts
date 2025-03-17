import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware';
import { 
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getUserCourses,
  getUserAssignments,
  getUserEnrollments,
  getUserStats
} from '../controllers/userController';

const router = express.Router();

// Special 'me' routes - no special handling needed now
// The controllers now check for /me/ in the URL or "me" as the id parameter
router.get('/me/assignments', protect, getUserAssignments);
router.get('/me/courses', protect, getUserCourses);
router.get('/me/enrollments', protect, getUserEnrollments);
router.get('/me/stats', protect, getUserStats);

// User management routes (admin only)
router.route('/')
  .get(protect, isAdmin, getUsers);

router.route('/:id')
  .get(protect, isAdmin, getUserById)
  .delete(protect, isAdmin, deleteUser);

router.route('/:id/role')
  .put(protect, isAdmin, updateUserRole);

// User data routes (admin and self access)
router.route('/:id/courses')
  .get(protect, getUserCourses);

router.route('/:id/assignments')
  .get(protect, getUserAssignments);

router.route('/:id/enrollments')
  .get(protect, getUserEnrollments);

router.route('/:id/stats')
  .get(protect, getUserStats);

export default router;