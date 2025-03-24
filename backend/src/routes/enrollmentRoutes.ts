import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  enrollInCourse,
  getUserEnrollments,
  getCourseEnrollments,
  updateEnrollmentProgress,
  completeEnrollment,
  unenrollFromCourse,
  getCourseProgress // You'll need to implement this function
} from '../controllers/enrollmentController';

const router = express.Router();

// Existing enrollment routes
router.route('/')
  .get(protect, getUserEnrollments)
  .post(protect, enrollInCourse);

router.route('/course/:courseId')
  .get(protect, getCourseEnrollments)
  .delete(protect, unenrollFromCourse);

router.route('/:id/progress')
  .put(protect, updateEnrollmentProgress);

router.route('/:id/complete')
  .put(protect, completeEnrollment);

// Add this new route for getting course progress
router.route('/progress/:courseId')
  .get(protect, getCourseProgress);

export default router;