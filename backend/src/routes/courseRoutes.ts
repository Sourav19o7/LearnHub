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
  
  // Lesson routes - Added these
  getCourseLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  completeLesson,
  getSectionLessons,
  
  // Other existing routes
  getCourseAssignments,
  getCourseReviews,
  getCourseStudyMaterials,
  addStudyMaterial,
  removeStudyMaterial
} from '../controllers/courseController';

import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


const router = express.Router();

// Special 'me' routes
router.get('/me', protect, getMyCourses);

// Instructor-specific routes
router.get('/instructor', protect, isInstructor, getInstructorCourses);

// Course routes - IMPORTANT: These routes should match your frontend paths
router.route('/')
  .get(getCourses)
  .post(protect, upload.single('coverImage'), createCourse);

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

// Lesson routes
router.route('/:id/lessons')
  .get(getCourseLessons);

// Nested routes for section-based lessons (enforcing the hierarchy)
router.route('/:courseId/sections/:sectionId/lessons')
.get(protect, getSectionLessons)
  .post(protect, isInstructor, createLesson);

router.route('/:courseId/sections/:sectionId/lessons/:lessonId')
  .get(protect, getLessonById)
  .put(protect, isInstructor, updateLesson)
  .delete(protect, isInstructor, deleteLesson);

router.route('/:courseId/sections/:sectionId/lessons/:lessonId/complete')
  .put(protect, completeLesson);

// Related course content
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