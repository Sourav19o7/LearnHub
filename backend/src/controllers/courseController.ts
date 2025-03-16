import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../middleware/errorHandler';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { Course, PaginationParams, FilterParams } from '../types';
import courseService from '../services/courseService';

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const courseData: Partial<Course> = {
    ...req.body,
    instructor_id: userId,
    is_published: false
  };
  
  const course = await courseService.createCourse(courseData);
  
  res.status(201).json({
    success: true,
    data: course
  });
});

// @desc    Get all courses with pagination and filtering
// @route   GET /api/courses
// @access  Public
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  // Extract pagination parameters
  const paginationParams: PaginationParams = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    sortBy: req.query.sortBy as string || 'created_at',
    sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
  };
  
  // Extract filter parameters
  const filterParams: FilterParams = {
    category: req.query.category as string,
    difficulty_level: req.query.difficulty_level as string,
    instructor_id: req.query.instructor_id as string,
    is_published: req.query.is_published === 'true',
    price_min: req.query.price_min ? parseFloat(req.query.price_min as string) : undefined,
    price_max: req.query.price_max ? parseFloat(req.query.price_max as string) : undefined,
    search: req.query.search as string
  };
  
  // Filter out undefined values
  Object.keys(filterParams).forEach(key => {
    if (filterParams[key as keyof FilterParams] === undefined) {
      delete filterParams[key as keyof FilterParams];
    }
  });
  
  const { courses, total, totalPages } = await courseService.getCourses(paginationParams, filterParams);
  
  res.status(200).json({
    success: true,
    count: courses.length,
    total,
    totalPages,
    currentPage: paginationParams.page,
    data: courses
  });
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  
  const course = await courseService.getCourseById(courseId);
  
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  
  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor only)
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Check if course exists and belongs to instructor
  const existingCourse = await courseService.getCourseById(courseId);
  
  if (!existingCourse) {
    throw new ApiError(404, 'Course not found');
  }
  
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to update this course');
  }
  
  const updatedCourse = await courseService.updateCourse(courseId, req.body);
  
  res.status(200).json({
    success: true,
    data: updatedCourse
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor only)
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Check if course exists and belongs to instructor
  const existingCourse = await courseService.getCourseById(courseId);
  
  if (!existingCourse) {
    throw new ApiError(404, 'Course not found');
  }
  
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to delete this course');
  }
  
  await courseService.deleteCourse(courseId);
  
  res.status(200).json({
    success: true,
    message: 'Course deleted successfully'
  });
});

// @desc    Publish course
// @route   PUT /api/courses/:id/publish
// @access  Private (Instructor only)
export const publishCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  
  const course = await courseService.updateCourseStatus(courseId, true);
  
  res.status(200).json({
    success: true,
    message: 'Course published successfully',
    data: course
  });
});

// @desc    Unpublish course
// @route   PUT /api/courses/:id/unpublish
// @access  Private (Instructor only)
export const unpublishCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  
  const course = await courseService.updateCourseStatus(courseId, false);
  
  res.status(200).json({
    success: true,
    message: 'Course unpublished successfully',
    data: course
  });
});

// @desc    Get course sections
// @route   GET /api/courses/:id/sections
// @access  Public
export const getCourseSections = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  
  const sections = await courseService.getCourseSections(courseId);
  
  res.status(200).json({
    success: true,
    count: sections.length,
    data: sections
  });
});

// @desc    Create course section
// @route   POST /api/courses/:id/sections
// @access  Private (Instructor only)
export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  
  const section = await courseService.createSection(courseId, req.body);
  
  res.status(201).json({
    success: true,
    data: section
  });
});

// @desc    Update course section
// @route   PUT /api/courses/:courseId/sections/:sectionId
// @access  Private (Instructor only)
export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const sectionId = req.params.sectionId;
  
  const section = await courseService.updateSection(courseId, sectionId, req.body);
  
  res.status(200).json({
    success: true,
    data: section
  });
});

// @desc    Delete course section
// @route   DELETE /api/courses/:courseId/sections/:sectionId
// @access  Private (Instructor only)
export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const sectionId = req.params.sectionId;
  
  await courseService.deleteSection(courseId, sectionId);
  
  res.status(200).json({
    success: true,
    message: 'Section deleted successfully'
  });
});

// @desc    Get course lessons
// @route   GET /api/courses/:id/lessons
// @access  Public/Private (depends on lesson visibility)
export const getCourseLessons = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  const lessons = await courseService.getCourseLessons(courseId, userId);
  
  res.status(200).json({
    success: true,
    count: lessons.length,
    data: lessons
  });
});

// @desc    Get course assignments
// @route   GET /api/courses/:id/assignments
// @access  Private (Enrolled students and instructor)
export const getCourseAssignments = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const assignments = await courseService.getCourseAssignments(courseId, userId);
  
  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments
  });
});

// @desc    Get course reviews
// @route   GET /api/courses/:id/reviews
// @access  Public
export const getCourseReviews = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  
  const reviews = await courseService.getCourseReviews(courseId);
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get course study materials
// @route   GET /api/courses/:id/materials
// @access  Private (Enrolled students and instructor)
export const getCourseStudyMaterials = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const materials = await courseService.getCourseStudyMaterials(courseId, userId);
  
  res.status(200).json({
    success: true,
    count: materials.length,
    data: materials
  });
});

// @desc    Add study material to course
// @route   POST /api/courses/:id/materials
// @access  Private (Instructor only)
export const addStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  
  const material = await courseService.addStudyMaterial(courseId, req.body);
  
  res.status(201).json({
    success: true,
    data: material
  });
});

// @desc    Remove study material from course
// @route   DELETE /api/courses/:courseId/materials/:materialId
// @access  Private (Instructor only)
export const removeStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const materialId = req.params.materialId;
  
  await courseService.removeStudyMaterial(courseId, materialId);
  
  res.status(200).json({
    success: true,
    message: 'Study material removed successfully'
  });
});