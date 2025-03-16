import express from 'express';
import { protect, isInstructor } from '../middleware/authMiddleware';
import { 
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
  getSubmissions,
  getSubmissionById
} from '../controllers/assignmentController';

const router = express.Router();

// Assignment routes
router.route('/')
  .post(protect, isInstructor, createAssignment);

router.route('/:id')
  .get(protect, getAssignmentById)
  .put(protect, isInstructor, updateAssignment)
  .delete(protect, isInstructor, deleteAssignment);

// Submission routes
router.route('/:id/submissions')
  .get(protect, getSubmissions)
  .post(protect, submitAssignment);

router.route('/:assignmentId/submissions/:submissionId')
  .get(protect, getSubmissionById);

router.route('/:assignmentId/submissions/:submissionId/grade')
  .put(protect, isInstructor, gradeSubmission);

export default router;