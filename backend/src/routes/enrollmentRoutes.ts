import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  enrollInCourse,
  getUserEnrollments,
  getCourseEnrollments,
  updateEnrollmentProgress,
  completeEnrollment,
  unenrollFromCourse
} from '../controllers/enrollmentController';

const router = express.Router();

// Enrollment routes
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

export default router;