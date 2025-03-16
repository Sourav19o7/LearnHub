import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../middleware/errorHandler';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { Assignment, AssignmentSubmission } from '../types';

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Instructor only)
export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const { course_id, section_id, title, description, due_date, points } = req.body;
  
  if (!course_id || !title || !description) {
    throw new ApiError(400, 'Course ID, title, and description are required');
  }
  
  const supabase = getSupabase();
  
  // Check if user is instructor of the course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', course_id)
    .single();
  
  if (courseError || !course) {
    throw new ApiError(404, 'Course not found');
  }
  
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to create assignments for this course');
  }
  
  // Create assignment
  const newAssignment = {
    course_id,
    section_id: section_id || null,
    title,
    description,
    due_date: due_date || null,
    points: points || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('assignments')
    .insert(newAssignment)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error creating assignment: ${error.message}`);
    throw new ApiError(500, `Failed to create assignment: ${error.message}`);
  }
  
  res.status(201).json({
    success: true,
    data
  });
});

// @desc    Get assignment by ID
// @route   GET /api/assignments/:id
// @access  Private (Enrolled students and instructor)
export const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Get assignment with course details
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      *,
      course:courses(id, title, instructor_id),
      section:sections(id, title)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError(404, 'Assignment not found');
    }
    
    logger.error(`Error fetching assignment: ${error.message}`);
    throw new ApiError(500, `Failed to fetch assignment: ${error.message}`);
  }
  
  // Check if user is instructor or enrolled in the course
  const isInstructor = assignment.course.instructor_id === userId;
  
  if (!isInstructor) {
    // Check if user is enrolled
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', assignment.course_id)
      .maybeSingle();
    
    if (enrollmentError || !enrollment) {
      throw new ApiError(403, 'You must be enrolled in this course to view this assignment');
    }
  }
  
  // Get user's submission if exists
  const { data: submission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', id)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (submissionError) {
    logger.error(`Error fetching submission: ${submissionError.message}`);
  }
  
  res.status(200).json({
    success: true,
    data: {
      ...assignment,
      submission: submission || null
    }
  });
});

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (Instructor only)
export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check if assignment exists and user is the instructor
  const { data: assignment, error: fetchError } = await supabase
    .from('assignments')
    .select(`id, course:courses(instructor_id)`)
    .eq('id', id)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Assignment not found');
    }
    
    logger.error(`Error fetching assignment: ${fetchError.message}`);
    throw new ApiError(500, `Failed to fetch assignment: ${fetchError.message}`);
  }
  
  if (assignment.course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to update this assignment');
  }
  
  // Update assignment
  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };
  
  // Prevent updating critical fields
  delete updateData.id;
  delete updateData.course_id;
  delete updateData.created_at;
  
  const { data, error } = await supabase
    .from('assignments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error updating assignment: ${error.message}`);
    throw new ApiError(500, `Failed to update assignment: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Instructor only)
export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check if assignment exists and user is the instructor
  const { data: assignment, error: fetchError } = await supabase
    .from('assignments')
    .select(`id, course:courses(instructor_id)`)
    .eq('id', id)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Assignment not found');
    }
    
    logger.error(`Error fetching assignment: ${fetchError.message}`);
    throw new ApiError(500, `Failed to fetch assignment: ${fetchError.message}`);
  }
  
  if (assignment.course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to delete this assignment');
  }
  
  // Delete assignment (will cascade delete submissions as well)
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);
  
  if (error) {
    logger.error(`Error deleting assignment: ${error.message}`);
    throw new ApiError(500, `Failed to delete assignment: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully'
  });
});

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submissions
// @access  Private (Enrolled students only)
export const submitAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const { content, attachments } = req.body;
  
  if (!content) {
    throw new ApiError(400, 'Submission content is required');
  }
  
  const supabase = getSupabase();
  
  // Check if assignment exists
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select(`id, course_id, due_date`)
    .eq('id', id)
    .single();
  
  if (assignmentError) {
    if (assignmentError.code === 'PGRST116') {
      throw new ApiError(404, 'Assignment not found');
    }
    
    logger.error(`Error fetching assignment: ${assignmentError.message}`);
    throw new ApiError(500, `Failed to fetch assignment: ${assignmentError.message}`);
  }
  
  // Check if user is enrolled in course
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', assignment.course_id)
    .maybeSingle();
  
  if (enrollmentError || !enrollment) {
    throw new ApiError(403, 'You must be enrolled in this course to submit assignments');
  }
  
  // Check if assignment is past due date
  if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
    throw new ApiError(400, 'This assignment is past its due date');
  }
  
  // Check if submission already exists
  const { data: existingSubmission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .select('id, status')
    .eq('assignment_id', id)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (submissionError) {
    logger.error(`Error checking existing submission: ${submissionError.message}`);
    throw new ApiError(500, `Failed to check existing submission: ${submissionError.message}`);
  }
  
  let submission;
  
  if (existingSubmission) {
    // Only allow resubmission if not already graded
    if (existingSubmission.status === 'graded') {
      throw new ApiError(400, 'Cannot update a submission that has already been graded');
    }
    
    // Update existing submission
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        content,
        attachments,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', existingSubmission.id)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error updating submission: ${error.message}`);
      throw new ApiError(500, `Failed to update submission: ${error.message}`);
    }
    
    submission = data;
  } else {
    // Create new submission
    const newSubmission: Partial<AssignmentSubmission> = {
      assignment_id: id,
      user_id: userId,
      content,
      attachments,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert(newSubmission)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error creating submission: ${error.message}`);
      throw new ApiError(500, `Failed to create submission: ${error.message}`);
    }
    
    submission = data;
  }
  
  res.status(201).json({
    success: true,
    data: submission
  });
});

// @desc    Grade a submission
// @route   PUT /api/assignments/:assignmentId/submissions/:submissionId/grade
// @access  Private (Instructor only)
export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId, submissionId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const { grade, feedback } = req.body;
  
  if (grade === undefined) {
    throw new ApiError(400, 'Grade is required');
  }
  
  const supabase = getSupabase();
  
  // Check if assignment exists and user is the instructor
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select(`id, course:courses(instructor_id), points`)
    .eq('id', assignmentId)
    .single();
  
  if (assignmentError) {
    if (assignmentError.code === 'PGRST116') {
      throw new ApiError(404, 'Assignment not found');
    }
    
    logger.error(`Error fetching assignment: ${assignmentError.message}`);
    throw new ApiError(500, `Failed to fetch assignment: ${assignmentError.message}`);
  }
  
  if (assignment.course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to grade submissions for this assignment');
  }
  
  // Validate grade is within assignment points range
  if (assignment.points !== null && (grade < 0 || grade > assignment.points)) {
    throw new ApiError(400, `Grade must be between 0 and ${assignment.points}`);
  }
  
  // Check if submission exists
  const { data: submission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .select('id')
    .eq('id', submissionId)
    .eq('assignment_id', assignmentId)
    .single();
  
  if (submissionError) {
    if (submissionError.code === 'PGRST116') {
      throw new ApiError(404, 'Submission not found');
    }
    
    logger.error(`Error fetching submission: ${submissionError.message}`);
    throw new ApiError(500, `Failed to fetch submission: ${submissionError.message}`);
  }
  
  // Update the submission with grade
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({
      grade,
      feedback,
      status: 'graded',
      graded_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error grading submission: ${error.message}`);
    throw new ApiError(500, `Failed to grade submission: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Instructor only)
export const getSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check if assignment exists and user is the instructor
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select(`id, course:courses(instructor_id)`)
    .eq('id', id)
    .single();
  
  if (assignmentError) {
    if (assignmentError.code === 'PGRST116') {
      throw new ApiError(404, 'Assignment not found');
    }
    
    logger.error(`Error fetching assignment: ${assignmentError.message}`);
    throw new ApiError(500, `Failed to fetch assignment: ${assignmentError.message}`);
  }
  
  const isInstructor = assignment.course.instructor_id === userId;
  
  // If not instructor, check if user is trying to view their own submission
  if (!isInstructor) {
    // Get user's submission if exists
    const { data: submission, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (submissionError) {
      logger.error(`Error fetching submission: ${submissionError.message}`);
      throw new ApiError(500, `Failed to fetch submission: ${submissionError.message}`);
    }
    
    return res.status(200).json({
      success: true,
      data: submission ? [submission] : []
    });
  }
  
  // For instructor, get all submissions with student details
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      student:profiles(id, first_name, last_name, email, avatar_url)
    `)
    .eq('assignment_id', id)
    .order('submitted_at', { ascending: false });
  
  if (error) {
    logger.error(`Error fetching submissions: ${error.message}`);
    throw new ApiError(500, `Failed to fetch submissions: ${error.message}`);
  }
  
  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get a specific submission
// @route   GET /api/assignments/:assignmentId/submissions/:submissionId
// @access  Private (Student who made submission or instructor)
export const getSubmissionById = asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId, submissionId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Get the submission with user and assignment details
  const { data: submission, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      student:profiles(id, first_name, last_name, email, avatar_url),
      assignment:assignments(
        id, 
        title, 
        description, 
        due_date, 
        points,
        course:courses(id, title, instructor_id)
      )
    `)
    .eq('id', submissionId)
    .eq('assignment_id', assignmentId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError(404, 'Submission not found');
    }
    
    logger.error(`Error fetching submission: ${error.message}`);
    throw new ApiError(500, `Failed to fetch submission: ${error.message}`);
  }
  
  const isInstructor = submission.assignment.course.instructor_id === userId;
  const isSubmitter = submission.user_id === userId;
  
  // Only the submitter or instructor can view the submission
  if (!isInstructor && !isSubmitter) {
    throw new ApiError(403, 'Not authorized to view this submission');
  }
  
  res.status(200).json({
    success: true,
    data: submission
  });
});