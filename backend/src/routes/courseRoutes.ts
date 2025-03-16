import express from 'express';
import { protect, isInstructor, isAdmin } from '../middleware/authMiddleware';
import { 
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
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