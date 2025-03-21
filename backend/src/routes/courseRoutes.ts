import express from 'express';
import { protect, isInstructor, isAdmin } from '../middleware/authMiddleware';
import { 
  // Instructor-specific routes
  getInstructorCourses,
  
  // Course routes
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,

  // Special 'me' routes for courses
  getMyCourses,

  // Course-related content routes
  getCourseSections,
  createSection,
  updateSection,
  deleteSection,
  getCourseLessons,
  getCourseAssignments,
  getCourseReviews,
  getCourseStudyMaterials,
  addStudyMaterial,
  removeStudyMaterial
} from '../controllers/courseController';

const router = express.Router();

// Special 'me' routes
router.get('/me', protect, getMyCourses);

// Instructor-specific routes
router.get('/instructor', protect, isInstructor, getInstructorCourses);

// Course routes
router.route('/')
  .get(getCourses)
  .post(protect, createCourse);

router.route('/:id')
  .get(getCourseById)
  .put(protect, isInstructor, updateCourse)
  .delete(protect, isInstructor, deleteCourse);

router.route('/:id/publish')
  .put(protect, isInstructor, publishCourse);

router.route('/:id/unpublish')
  .put(protect, isInstructor, unpublishCourse);

// Course sections
router.route('/:id/sections')
  .get(getCourseSections)
  .post(protect, isInstructor, createSection);

router.route('/:courseId/sections/:sectionId')
  .put(protect, isInstructor, updateSection)
  .delete(protect, isInstructor, deleteSection);

// Related course content
router.route('/:id/lessons')
  .get(getCourseLessons);

router.route('/:id/assignments')
  .get(getCourseAssignments);

router.route('/:id/reviews')
  .get(getCourseReviews);

// Study materials
router.route('/:id/materials')
  .get(getCourseStudyMaterials)
  .post(protect, isInstructor, addStudyMaterial);

router.route('/:courseId/materials/:materialId')
  .delete(protect, isInstructor, removeStudyMaterial);

export default router;