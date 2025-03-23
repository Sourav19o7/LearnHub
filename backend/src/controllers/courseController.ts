import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../middleware/errorHandler';
import { getSupabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { UserRole, Course, PaginationParams, FilterParams } from '../types';

// @desc    Get user's own courses (created if instructor, enrolled if student)
// @route   GET /api/courses/me
// @access  Private
export const getMyCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Get user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (profileError) {
    if (profileError.code === 'PGRST116') {
      throw new ApiError(404, 'User not found');
    }
    
    logger.error(`Error fetching user profile: ${profileError.message}`);
    throw new ApiError(500, `Failed to fetch user profile: ${profileError.message}`);
  }
  
  let data;
  
  // If instructor, get created courses
  if (profile.role === UserRole.INSTRUCTOR || profile.role === UserRole.ADMIN) {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error(`Error fetching instructor courses: ${error.message}`);
      throw new ApiError(500, `Failed to fetch instructor courses: ${error.message}`);
    }
    
    data = courses;
  } else {
    // If student, get enrolled courses
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });
    
    if (error) {
      logger.error(`Error fetching enrollments: ${error.message}`);
      throw new ApiError(500, `Failed to fetch enrollments: ${error.message}`);
    }
    
    // Extract course data from enrollments
    data = enrollments.map(enrollment => ({
      ...enrollment.course,
      enrollment_id: enrollment.id,
      enrolled_at: enrollment.enrolled_at,
      completed_at: enrollment.completed_at,
      progress_percentage: enrollment.progress_percentage
    }));
  }
  
  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get instructor's courses
// @route   GET /api/courses/instructor
// @access  Private (Instructor only)
export const getInstructorCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Extract pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
  
  const supabase = getSupabase();
  
  // Start building the query
  let query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('instructor_id', userId);
  
  // Apply filters from query parameters
  const category = req.query.category as string;
  const isPublished = req.query.is_published === 'true';
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (isPublished !== undefined) {
    query = query.eq('is_published', isPublished);
  }
  
  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Execute query with pagination
  const { data, error, count } = await query.range(from, to);
  
  if (error) {
    logger.error(`Error fetching instructor courses: ${error.message}`);
    throw new ApiError(500, `Failed to fetch instructor courses: ${error.message}`);
  }
  
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    count: data.length,
    total,
    totalPages,
    currentPage: page,
    data
  });
});

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log("lkjhg")
    const userId = req.user?.id;
    console.log("Reached Here", userId)
    
    if (!userId) {
      console.log('Authentication error: User ID missing in request');
      throw new ApiError(401, 'User not authenticated');
    }
    
    const supabase = getSupabase();
    
    // Validate input data
    if (!req.body) {
      console.log('Missing request body for course creation');
      throw new ApiError(400, 'Course data is required');
    }
    
    // Handle file upload if there is a cover image
    let coverImageUrl: string | undefined = undefined;
    
    if (req.file) {
      try {
        console.log(`Uploading cover image for course by instructor ${userId}`);
        
        // Upload file to Supabase storage
        const fileName = `${userId}_${Date.now()}_${req.file.originalname}`;
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('course-covers')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
          });
        
        if (uploadError) {
          console.error(`Error uploading cover image: ${uploadError.message}`, uploadError);
          throw new ApiError(500, 'Failed to upload cover image');
        }
        
        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('course-covers')
          .getPublicUrl(fileName);
          
        coverImageUrl = urlData.publicUrl;
        console.log(`Successfully uploaded cover image: ${coverImageUrl}`);
      } catch (error) {
        console.error('Error processing cover image upload:', error);
        throw new ApiError(500, 'Failed to process cover image');
      }
    }
    
    // Parse numeric body and ensure we're getting the first value if it's an array
    const priceStr = Array.isArray(req.body.price) ? req.body.price[0] : req.body.price;
    const durationStr = Array.isArray(req.body.duration_weeks) ? req.body.duration_weeks[0] : req.body.duration_weeks;
    const publishedStr = Array.isArray(req.body.is_published) ? req.body.is_published[0] : req.body.is_published;
    
    const price = priceStr ? parseFloat(priceStr) : 0;
    const duration_weeks = durationStr ? parseInt(durationStr) : 1;
    const is_published = publishedStr === 'true';
    
    // Safely extract string body
    const title = Array.isArray(req.body.title) ? req.body.title[0] : req.body.title;
    const description = Array.isArray(req.body.description) ? req.body.description[0] : req.body.description;
    const category = Array.isArray(req.body.category) ? req.body.category[0] : req.body.category;
    const difficultyLevel = Array.isArray(req.body.difficulty_level) 
  ? req.body.difficulty_level[0] as 'beginner' | 'intermediate' | 'advanced' | undefined
  : req.body.difficulty_level as 'beginner' | 'intermediate' | 'advanced' | undefined;

    
    const courseData: Partial<Course> = {
      title,
      description,
      category,
      difficulty_level: difficultyLevel,
      price,
      duration_weeks,
      instructor_id: userId,
      is_published,
      created_at: new Date().toISOString()
    };
    
    // Only add cover_image_url if it was uploaded
    if (coverImageUrl) {
      courseData.cover_image_url = coverImageUrl;
    }
    
    // Validate required body
    if (!courseData.title) {
      console.log('Course creation attempted without title');
      throw new ApiError(400, 'Course title is required');
    }
    
    console.log(`Creating new course "${courseData.title}" for instructor ${userId}`);
    
    try {
      // Insert course
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating course: ${error.message}`, error);
        logger.error(`Error creating course: ${error.message}`);
        throw new ApiError(500, 'Failed to create course');
      }
      
      console.log(`Successfully created course with ID: ${data.id}`);
      
      res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error during course creation database operation:', error);
      throw error; // Re-throw to be caught by asyncHandler
    }
  } catch (error) {
    console.error('Unexpected error in createCourse:', error);
    throw error; // Re-throw to be caught by asyncHandler
  }
});

// @desc    Get all courses with pagination and filtering
// @route   GET /api/courses
// @access  Public
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    
    // Extract pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    
    console.log(`Fetching courses with page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`);
    
    try {
      // Start building the query
      let query = supabase
        .from('courses')
        .select('*', { count: 'exact' })
        .eq('is_published', true);
      
      // Apply filters
      const category = req.query.category as string;
      const difficultyLevel = req.query.difficulty_level as string;
      const instructorId = req.query.instructor_id as string;
      const search = req.query.search as string;
      const priceMin = req.query.price_min ? parseFloat(req.query.price_min as string) : undefined;
      const priceMax = req.query.price_max ? parseFloat(req.query.price_max as string) : undefined;
      
      if (category) {
        query = query.eq('category', category);
        console.log(`Filtering by category: ${category}`);
      }
      
      if (difficultyLevel) {
        query = query.eq('difficulty_level', difficultyLevel);
        console.log(`Filtering by difficulty level: ${difficultyLevel}`);
      }
      
      if (instructorId) {
        query = query.eq('instructor_id', instructorId);
        console.log(`Filtering by instructor ID: ${instructorId}`);
      }
      
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`
        );
        console.log(`Searching for: "${search}"`);
      }
      
      if (priceMin !== undefined) {
        query = query.gte('price', priceMin);
        console.log(`Filtering by min price: ${priceMin}`);
      }
      
      if (priceMax !== undefined) {
        query = query.lte('price', priceMax);
        console.log(`Filtering by max price: ${priceMax}`);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Execute query with pagination
      const { data, error, count } = await query.range(from, to);
      
      if (error) {
        console.error(`Error fetching courses: ${error.message}`, error);
        logger.error(`Error fetching courses: ${error.message}`);
        throw new ApiError(500, 'Failed to fetch courses');
      }
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
      console.log(`Retrieved ${data.length} courses out of ${total} total`);
      
      res.status(200).json({
        success: true,
        count: data.length,
        total,
        totalPages,
        currentPage: page,
        data
      });
    } catch (error) {
      console.error('Error in courses query execution:', error);
      throw error; // Re-throw to be caught by asyncHandler
    }
  } catch (error) {
    console.error('Unexpected error in getCourses:', error);
    throw error; // Re-throw to be caught by asyncHandler
  }
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles(id, first_name, last_name, email)
    `)
    .eq('id', courseId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Optional: Check if course is published, unless user is the instructor or an admin
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  if (!data.is_published && 
      data.instructor_id !== userId && 
      userRole !== UserRole.ADMIN) {
    throw new ApiError(403, 'Course is not published');
  }
  
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor only)
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const userId = req.user?.id;
    
    console.log(`Attempting to update course ${courseId} by user ${userId}`);
    
    const supabase = getSupabase();
    
    // Validate inputs
    if (!userId) {
      console.log('Authentication error: User ID missing in request');
      throw new ApiError(401, 'User not authenticated');
    }
    
    // Validate request body
    if (!req.body) {
      console.log('Missing request body for course update');
      throw new ApiError(400, 'Update data is required');
    }
    
    try {
      // First, check if the course exists and belongs to the instructor
      const { data: existingCourse, error: fetchError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log(`Course not found with ID: ${courseId}`);
          throw new ApiError(404, 'Course not found');
        }
        
        console.error(`Error fetching course: ${fetchError.message}`, fetchError);
        logger.error(`Error fetching course: ${fetchError.message}`);
        throw new ApiError(500, 'Failed to fetch course');
      }
      
      // Check instructor ownership
      if (existingCourse.instructor_id !== userId) {
        console.log(`Unauthorized update attempt: User ${userId} is not the owner of course ${courseId}`);
        throw new ApiError(403, 'Not authorized to update this course');
      }
      
      // Process body to handle potential arrays
      const processedbody: Record<string, any> = {};
      
      // Process each field to handle arrays
      Object.entries(req.body).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          processedbody[key] = value[0];
        } else {
          processedbody[key] = value;
        }
      });
      
      // Handle difficulty_level specifically to ensure it's a valid value
      if (processedbody.difficulty_level) {
        const difficultyLevel = processedbody.difficulty_level as string;
        if (!['beginner', 'intermediate', 'advanced'].includes(difficultyLevel)) {
          processedbody.difficulty_level = 'beginner'; // Default to beginner if invalid
        }
      }
      
      // Parse numeric body
      if (processedbody.price) {
        processedbody.price = parseFloat(processedbody.price);
      }
      
      if (processedbody.duration_weeks) {
        processedbody.duration_weeks = parseInt(processedbody.duration_weeks);
      }
      
      if (processedbody.is_published !== undefined) {
        processedbody.is_published = processedbody.is_published === 'true';
      }
      
      // Prepare update data
      const updateData = {
        ...processedbody,
        updated_at: new Date().toISOString()
      };
      
      // Remove any body that shouldn't be updated
      if ('id' in updateData) delete updateData.id;
      if ('instructor_id' in updateData) delete updateData.instructor_id;
      if ('created_at' in updateData) delete updateData.created_at;
      
      console.log(`Updating course ${courseId} with data:`, updateData);
      
      // Update the course
      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating course: ${error.message}`, error);
        logger.error(`Error updating course: ${error.message}`);
        throw new ApiError(500, 'Failed to update course');
      }
      
      console.log(`Successfully updated course: ${data.id}`);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error(`Error in updateCourse for course ${courseId}:`, error);
      throw error; // Re-throw to be caught by asyncHandler
    }
  } catch (error) {
    console.error('Unexpected error in updateCourse:', error);
    throw error; // Re-throw to be caught by asyncHandler
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor only)
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // First, check if the course exists and belongs to the instructor
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${fetchError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to delete this course');
  }
  
  // Delete the course
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
  
  if (error) {
    logger.error(`Error deleting course: ${error.message}`);
    throw new ApiError(500, 'Failed to delete course');
  }
  
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
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // First, check if the course exists and belongs to the instructor
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${fetchError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to publish this course');
  }
  
  // Check if course is already published
  if (existingCourse.is_published) {
    throw new ApiError(400, 'Course is already published');
  }
  
  // Update course to published
  const { data, error } = await supabase
    .from('courses')
    .update({ 
      is_published: true,
      published_at: new Date().toISOString() 
    })
    .eq('id', courseId)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error publishing course: ${error.message}`);
    throw new ApiError(500, 'Failed to publish course');
  }
  
  res.status(200).json({
    success: true,
    message: 'Course published successfully',
    data
  });
});

// @desc    Unpublish course
// @route   PUT /api/courses/:id/unpublish
// @access  Private (Instructor only)
export const unpublishCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // First, check if the course exists and belongs to the instructor
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${fetchError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (existingCourse.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to unpublish this course');
  }
  
  // Check if course is already unpublished
  if (!existingCourse.is_published) {
    throw new ApiError(400, 'Course is already unpublished');
  }
  
  // Update course to unpublished
  const { data, error } = await supabase
    .from('courses')
    .update({ 
      is_published: false,
      published_at: null 
    })
    .eq('id', courseId)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error unpublishing course: ${error.message}`);
    throw new ApiError(500, 'Failed to unpublish course');
  }
  
  res.status(200).json({
    success: true,
    message: 'Course unpublished successfully',
    data
  });
});

// @desc    Get course sections
// @route   GET /api/courses/:id/sections
// @access  Public/Private (depends on course visibility)
export const getCourseSections = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.id;
  const supabase = getSupabase();
  
  // First, check course visibility
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('is_published, instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check course visibility
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  if (!course.is_published && 
      course.instructor_id !== userId && 
      userRole !== UserRole.ADMIN) {
    throw new ApiError(403, 'Course is not accessible');
  }
  
  // Fetch sections
  const { data: sections, error } = await supabase
    .from('sections')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true });
  
  if (error) {
    logger.error(`Error fetching course sections: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course sections');
  }
  
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
  try {
    const courseId = req.params.id;
    const userId = req.user?.id;
    
    console.log(`Attempting to create a new section for course ${courseId} by user ${userId}`);
    
    const supabase = getSupabase();
    
    // Validate inputs
    if (!userId) {
      console.log('Authentication error: User ID missing in request');
      throw new ApiError(401, 'User not authenticated');
    }
    
    // Validate request body
    if (!req.body) {
      console.log('Missing request body for section creation');
      throw new ApiError(400, 'Section data is required');
    }
    
    try {
      // Check course ownership
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();
      
      if (courseError) {
        if (courseError.code === 'PGRST116') {
          console.log(`Course not found with ID: ${courseId}`);
          throw new ApiError(404, 'Course not found');
        }
        
        console.error(`Error fetching course: ${courseError.message}`, courseError);
        logger.error(`Error fetching course: ${courseError.message}`);
        throw new ApiError(500, 'Failed to fetch course');
      }
      
      // Check instructor ownership
      if (course.instructor_id !== userId) {
        console.log(`Unauthorized section creation attempt: User ${userId} is not the owner of course ${courseId}`);
        throw new ApiError(403, 'Not authorized to add sections to this course');
      }
      
      // Process body to handle potential arrays
      const processedbody: Record<string, any> = {};
      
      // Process each field to handle arrays
      Object.entries(req.body).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          processedbody[key] = value[0];
        } else {
          processedbody[key] = value;
        }
      });
      
      // Get the current highest order_index in this course
      const { data: sectionOrders, error: orderError } = await supabase
        .from('sections')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1);
      
      const nextOrderIndex = sectionOrders && sectionOrders.length > 0 ? sectionOrders[0].order_index + 1 : 1;
      
      // Extract the title from processed body
      const title = processedbody.title;
      
      // Validate required body
      if (!title) {
        console.log('Section creation attempted without title');
        throw new ApiError(400, 'Section title is required');
      }
      
      // Prepare section data
      const sectionData = {
        title,
        ...processedbody,
        course_id: courseId,
        order_index: nextOrderIndex,
        created_at: new Date().toISOString()
      };
      
      console.log(`Creating new section "${title}" for course ${courseId}`);
      
      // Insert section
      const { data, error } = await supabase
        .from('sections')
        .insert(sectionData)
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating section: ${error.message}`, error);
        logger.error(`Error creating section: ${error.message}`);
        throw new ApiError(500, 'Failed to create section');
      }
      
      console.log(`Successfully created section with ID: ${data.id}`);
      
      res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      console.error(`Error in createSection for course ${courseId}:`, error);
      throw error; // Re-throw to be caught by asyncHandler
    }
  } catch (error) {
    console.error('Unexpected error in createSection:', error);
    throw error; // Re-throw to be caught by asyncHandler
  }
});

// @desc    Update course section
// @route   PUT /api/courses/:courseId/sections/:sectionId
// @access  Private (Instructor only)
export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId;
    const sectionId = req.params.sectionId;
    const userId = req.user?.id;
    
    console.log(`Attempting to update section ${sectionId} in course ${courseId} by user ${userId}`);
    
    const supabase = getSupabase();
    
    // Validate inputs
    if (!userId) {
      console.log('Authentication error: User ID missing in request');
      throw new ApiError(401, 'User not authenticated');
    }
    
    // Validate request body
    if (!req.body) {
      console.log('Missing request body for section update');
      throw new ApiError(400, 'Update data is required');
    }
    
    try {
      // Check course and section ownership
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .select('course_id')
        .eq('id', sectionId)
        .eq('course_id', courseId)
        .single();
      
      if (sectionError) {
        if (sectionError.code === 'PGRST116') {
          console.log(`Section not found with ID: ${sectionId}`);
          throw new ApiError(404, 'Section not found');
        }
        
        console.error(`Error fetching section: ${sectionError.message}`, sectionError);
        logger.error(`Error fetching section: ${sectionError.message}`);
        throw new ApiError(500, 'Failed to fetch section');
      }
      
      // Verify course ownership
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();
      
      if (courseError) {
        if (courseError.code === 'PGRST116') {
          console.log(`Course not found with ID: ${courseId}`);
          throw new ApiError(404, 'Course not found');
        }
        
        console.error(`Error fetching course: ${courseError.message}`, courseError);
        logger.error(`Error fetching course: ${courseError.message}`);
        throw new ApiError(500, 'Failed to fetch course');
      }
      
      // Check instructor ownership
      if (course.instructor_id !== userId) {
        console.log(`Unauthorized section update attempt: User ${userId} is not the owner of course ${courseId}`);
        throw new ApiError(403, 'Not authorized to update sections in this course');
      }
      
      // Process body to handle potential arrays
      const processedbody: Record<string, any> = {};
      
      // Process each field to handle arrays
      Object.entries(req.body).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          processedbody[key] = value[0];
        } else {
          processedbody[key] = value;
        }
      });
      
      // Handle order_index/order if it exists
      if (processedbody.order_index) {
        processedbody.order_index = parseInt(processedbody.order_index);
      }
      
      // Prepare update data
      const updateData = {
        ...processedbody,
        updated_at: new Date().toISOString()
      };
      
      // Remove any body that shouldn't be updated
      if ('id' in updateData) delete updateData.id;
      if ('course_id' in updateData) delete updateData.course_id;
      if ('created_at' in updateData) delete updateData.created_at;
      
      console.log(`Updating section ${sectionId} with data:`, updateData);
      
      // Update section
      const { data, error } = await supabase
        .from('sections')
        .update(updateData)
        .eq('id', sectionId)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating section: ${error.message}`, error);
        logger.error(`Error updating section: ${error.message}`);
        throw new ApiError(500, 'Failed to update section');
      }
      
      console.log(`Successfully updated section: ${data.id}`);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error(`Error in updateSection for section ${sectionId} in course ${courseId}:`, error);
      throw error; // Re-throw to be caught by asyncHandler
    }
  } catch (error) {
    console.error('Unexpected error in updateSection:', error);
    throw error; // Re-throw to be caught by asyncHandler
  }
});

// @desc    Delete course section
// @route   DELETE /api/courses/:courseId/sections/:sectionId
// @access  Private (Instructor only)
export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const sectionId = req.params.sectionId;
  const userId = req.user?.id;
  
  const supabase = getSupabase();
  
  // Validate inputs
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  // Check course and section ownership
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('course_id')
    .eq('id', sectionId)
    .eq('course_id', courseId)
    .single();
  
  if (sectionError) {
    if (sectionError.code === 'PGRST116') {
      throw new ApiError(404, 'Section not found');
    }
    
    logger.error(`Error fetching section: ${sectionError.message}`);
    throw new ApiError(500, 'Failed to fetch section');
  }
  
  // Verify course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to delete sections in this course');
  }
  
  // Delete section
  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', sectionId);
  
  if (error) {
    logger.error(`Error deleting section: ${error.message}`);
    throw new ApiError(500, 'Failed to delete section');
  }
  
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
  const supabase = getSupabase();
  
  // First, check course visibility
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('is_published, instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check course visibility
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  // Check if user is enrolled, is the instructor, is an admin, or course is published
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  
  const isAccessible = course.is_published || 
    course.instructor_id === userId || 
    userRole === UserRole.ADMIN ||
    !!enrollment;
  
  if (!isAccessible) {
    throw new ApiError(403, 'Course is not accessible');
  }
  
  // Fetch lessons with their associated content
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      *,
      section:sections(id, title),
      content:lesson_contents(*)
    `)
    .eq('course_id', courseId)
    .order('order', { ascending: true });
  
  if (error) {
    logger.error(`Error fetching course lessons: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course lessons');
  }
  
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
  
  const supabase = getSupabase();
  
  // First, check course and user access
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check user access
  const userRole = req.user?.role;
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  
  const isAccessible = course.instructor_id === userId || 
    userRole === UserRole.ADMIN ||
    (course.is_published && !!enrollment);
  
  if (!isAccessible) {
    throw new ApiError(403, 'Not authorized to access course assignments');
  }
  
  // Fetch assignments based on user role
  let query = supabase
    .from('assignments')
    .select(`
      *,
      submissions:assignment_submissions(
        id, 
        status, 
        grade, 
        submitted_at
      )
    `)
    .eq('course_id', courseId);
  
  // If not instructor or admin, only show submissions for the current user
  if (course.instructor_id !== userId && userRole !== UserRole.ADMIN) {
    query = query.eq('submissions.user_id', userId);
  }
  
  const { data: assignments, error } = await query;
  
  if (error) {
    logger.error(`Error fetching course assignments: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course assignments');
  }
  
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
  const supabase = getSupabase();
  
  // First, check if course exists and is published
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('is_published')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Fetch reviews with user details
  const { data: reviews, error } = await supabase
    .from('course_reviews')
    .select(`
      *,
      user:profiles(id, first_name, last_name, profile_image_url)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  if (error) {
    logger.error(`Error fetching course reviews: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course reviews');
  }
  
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
  
  const supabase = getSupabase();
  
  // First, check course and user access
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check user access
  const userRole = req.user?.role;
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  
  const isAccessible = course.instructor_id === userId || 
    userRole === UserRole.ADMIN ||
    (course.is_published && !!enrollment);
  
  if (!isAccessible) {
    throw new ApiError(403, 'Not authorized to access course materials');
  }
  
  // Fetch study materials
  const { data: materials, error } = await supabase
    .from('course_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  if (error) {
    logger.error(`Error fetching course materials: ${error.message}`);
    throw new ApiError(500, 'Failed to fetch course materials');
  }
  
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
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to add materials to this course');
  }
  
  // Prepare material data
  const materialData = {
    ...req.body,
    course_id: courseId,
    created_at: new Date().toISOString(),
    created_by: userId
  };
  
  // Validate required body
  if (!materialData.title || !materialData.file_url) {
    throw new ApiError(400, 'Title and file URL are required');
  }
  
  // Insert material
  const { data, error } = await supabase
    .from('course_materials')
    .insert(materialData)
    .select()
    .single();
  
  if (error) {
    logger.error(`Error adding study material: ${error.message}`);
    throw new ApiError(500, 'Failed to add study material');
  }
  
  res.status(201).json({
    success: true,
    data
  });
});

// @desc    Remove study material from course
// @route   DELETE /api/courses/:courseId/materials/:materialId
// @access  Private (Instructor only)
export const removeStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const materialId = req.params.materialId;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check material existence and course ownership
  const { data: material, error: materialError } = await supabase
    .from('course_materials')
    .select('course_id')
    .eq('id', materialId)
    .eq('course_id', courseId)
    .single();
  
  if (materialError) {
    if (materialError.code === 'PGRST116') {
      throw new ApiError(404, 'Study material not found');
    }
    
    logger.error(`Error fetching material: ${materialError.message}`);
    throw new ApiError(500, 'Failed to fetch study material');
  }
  
  // Verify course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to remove materials from this course');
  }
  
  // Delete material
  const { error } = await supabase
    .from('course_materials')
    .delete()
    .eq('id', materialId);
  
  if (error) {
    logger.error(`Error removing study material: ${error.message}`);
    throw new ApiError(500, 'Failed to remove study material');
  }
  
  res.status(200).json({
    success: true,
    message: 'Study material removed successfully'
  });
});

// Add these functions to your courseController.ts file

// @desc    Create a new lesson
// @route   POST /api/courses/:courseId/sections/:sectionId/lessons
// @access  Private (Instructor only)
export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId;
    const sectionId = req.params.sectionId;
    const userId = req.user?.id;
    
    console.log(`Attempting to create a new lesson for course ${courseId}, section ${sectionId} by user ${userId}`);
    
    const supabase = getSupabase();
    
    // Validate inputs
    if (!userId) {
      console.log('Authentication error: User ID missing in request');
      throw new ApiError(401, 'User not authenticated');
    }
    
    // Validate request body
    if (!req.body) {
      console.log('Missing request body for lesson creation');
      throw new ApiError(400, 'Lesson data is required');
    }
    
    try {
      // Check course ownership
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();
      
      if (courseError) {
        if (courseError.code === 'PGRST116') {
          console.log(`Course not found with ID: ${courseId}`);
          throw new ApiError(404, 'Course not found');
        }
        
        console.error(`Error fetching course: ${courseError.message}`, courseError);
        logger.error(`Error fetching course: ${courseError.message}`);
        throw new ApiError(500, 'Failed to fetch course');
      }
      
      // Check instructor ownership
      if (course.instructor_id !== userId) {
        console.log(`Unauthorized lesson creation attempt: User ${userId} is not the owner of course ${courseId}`);
        throw new ApiError(403, 'Not authorized to add lessons to this course');
      }
      
      // Check if section exists and belongs to this course
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .select('id')
        .eq('id', sectionId)
        .eq('course_id', courseId)
        .single();
      
      if (sectionError) {
        if (sectionError.code === 'PGRST116') {
          console.log(`Section not found with ID: ${sectionId}`);
          throw new ApiError(404, 'Section not found');
        }
        
        console.error(`Error fetching section: ${sectionError.message}`, sectionError);
        logger.error(`Error fetching section: ${sectionError.message}`);
        throw new ApiError(500, 'Failed to fetch section');
      }
      
      // Process body to handle potential arrays from form data
      const processedBody: Record<string, any> = {};
      
      // Process each field to handle arrays
      Object.entries(req.body).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          processedBody[key] = value[0];
        } else {
          processedBody[key] = value;
        }
      });
      
      // Get the current highest order in this section
      const { data: lessonOrders, error: orderError } = await supabase
        .from('lessons')
        .select('order')
        .eq('section_id', sectionId)
        .order('order', { ascending: false })
        .limit(1);
      
      const nextOrder = lessonOrders && lessonOrders.length > 0 ? (lessonOrders[0].order || 0) + 1 : 1;
      
      // Extract data from processed body
      const { title, description, content, duration_minutes } = processedBody;
      
      // Validate required data
      if (!title) {
        console.log('Lesson creation attempted without title');
        throw new ApiError(400, 'Lesson title is required');
      }
      
      // Prepare lesson data
      const lessonData = {
        title,
        description: description || '',
        content : content || '',
        course_id: courseId,
        section_id: sectionId,  // Always use the section from the URL params
        duration_minutes: duration_minutes ? parseInt(duration_minutes) : 0,
        order: nextOrder,
        created_at: new Date().toISOString(),
        created_by: userId
      };
      
      console.log(`Creating new lesson "${title}" for section ${sectionId} in course ${courseId}`);
      
      // Begin a transaction to create the lesson and its content
      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select()
        .single();
      
      if (lessonError) {
        console.error(`Error creating lesson: ${lessonError.message}`, lessonError);
        logger.error(`Error creating lesson: ${lessonError.message}`);
        throw new ApiError(500, 'Failed to create lesson');
      }
      
      // If content is provided, create lesson content
      if (content) {
        const contentData = {
          lesson_id: newLesson.id,
          content: content,
          created_at: new Date().toISOString()
        };
        
        const { error: contentError } = await supabase
          .from('lesson_contents')
          .insert(contentData);
        
        if (contentError) {
          console.error(`Error creating lesson content: ${contentError.message}`, contentError);
          logger.error(`Error creating lesson content: ${contentError.message}`);
          // Don't throw an error here, we'll still return the lesson without content
        }
      }
      
      // Fetch the complete lesson with its content
      const { data: completeLesson, error: fetchError } = await supabase
        .from('lessons')
        .select(`
          *,
          content:lesson_contents(*)
        `)
        .eq('id', newLesson.id)
        .single();
      
      if (fetchError) {
        console.error(`Error fetching complete lesson: ${fetchError.message}`, fetchError);
        logger.error(`Error fetching complete lesson: ${fetchError.message}`);
        // Still return the basic lesson data
        res.status(201).json({
          success: true,
          data: newLesson
        });
        return;
      }
      
      console.log(`Successfully created lesson with ID: ${newLesson.id}`);
      
      res.status(201).json({
        success: true,
        data: completeLesson
      });
    } catch (error) {
      console.error(`Error in createLesson for course ${courseId}:`, error);
      throw error; // Re-throw to be caught by asyncHandler
    }
  } catch (error) {
    console.error('Unexpected error in createLesson:', error);
    throw error; // Re-throw to be caught by asyncHandler
  }
});

// @desc    Get a single lesson
// @route   GET /api/courses/:courseId/sections/:sectionId/lessons/:lessonId
// @access  Private (Enrolled students and instructor)
export const getLessonById = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const sectionId = req.params.sectionId;
  const lessonId = req.params.lessonId;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // First, check course and user access
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id, is_published')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check user access
  const userRole = req.user?.role;
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  
  const isAccessible = course.instructor_id === userId || 
    userRole === UserRole.ADMIN ||
    (course.is_published && !!enrollment);
  
  if (!isAccessible) {
    throw new ApiError(403, 'Not authorized to access this lesson');
  }
  
  // Check if section exists and belongs to this course
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('id')
    .eq('id', sectionId)
    .eq('course_id', courseId)
    .single();
    
  if (sectionError) {
    if (sectionError.code === 'PGRST116') {
      throw new ApiError(404, 'Section not found');
    }
    
    logger.error(`Error fetching section: ${sectionError.message}`);
    throw new ApiError(500, 'Failed to fetch section');
  }
  
  // Fetch the lesson with its content
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      *,
      section:sections(id, title),
      content:lesson_contents(*)
    `)
    .eq('id', lessonId)
    .eq('section_id', sectionId)
    .eq('course_id', courseId)
    .single();
  
  if (lessonError) {
    if (lessonError.code === 'PGRST116') {
      throw new ApiError(404, 'Lesson not found');
    }
    
    logger.error(`Error fetching lesson: ${lessonError.message}`);
    throw new ApiError(500, 'Failed to fetch lesson');
  }
  
  // If student is accessing, update the progress
  if (enrollment && course.instructor_id !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.INSTRUCTOR) {
    try {
      // Check if lesson progress entry exists
      const { data: existingProgress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('id, completed')
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollment.id)
        .single();
      
      if (progressError && progressError.code !== 'PGRST116') {
        // Log error but don't fail the request
        logger.error(`Error checking lesson progress: ${progressError.message}`);
      }
      
      // If progress doesn't exist, create it
      if (!existingProgress) {
        const { error: insertError } = await supabase
          .from('lesson_progress')
          .insert({
            lesson_id: lessonId,
            enrollment_id: enrollment.id,
            started_at: new Date().toISOString(),
            completed: false
          });
        
        if (insertError) {
          // Log error but don't fail the request
          logger.error(`Error creating lesson progress: ${insertError.message}`);
        }
      }
    } catch (error) {
      // Log error but don't fail the request
      logger.error(`Error updating lesson progress: ${error}`);
    }
  }
  
  res.status(200).json({
    success: true,
    data: lesson
  });
  
  // If student is accessing, update the progress
  if (enrollment && course.instructor_id !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.INSTRUCTOR) {
    try {
      // Check if lesson progress entry exists
      const { data: existingProgress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('id, completed')
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollment.id)
        .single();
      
      if (progressError && progressError.code !== 'PGRST116') {
        // Log error but don't fail the request
        logger.error(`Error checking lesson progress: ${progressError.message}`);
      }
      
      // If progress doesn't exist, create it
      if (!existingProgress) {
        const { error: insertError } = await supabase
          .from('lesson_progress')
          .insert({
            lesson_id: lessonId,
            enrollment_id: enrollment.id,
            started_at: new Date().toISOString(),
            completed: false
          });
        
        if (insertError) {
          // Log error but don't fail the request
          logger.error(`Error creating lesson progress: ${insertError.message}`);
        }
      }
    } catch (error) {
      // Log error but don't fail the request
      logger.error(`Error updating lesson progress: ${error}`);
    }
  }
  
  res.status(200).json({
    success: true,
    data: lesson
  });
});

// @desc    Update lesson
// @route   PUT /api/courses/:courseId/sections/:sectionId/lessons/:lessonId
// @access  Private (Instructor only)
export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId;
    const sectionId = req.params.sectionId;
    const lessonId = req.params.lessonId;
    const userId = req.user?.id;
    
    console.log(`Attempting to update lesson ${lessonId} in section ${sectionId}, course ${courseId} by user ${userId}`);
    
    const supabase = getSupabase();
    
    // Validate inputs
    if (!userId) {
      console.log('Authentication error: User ID missing in request');
      throw new ApiError(401, 'User not authenticated');
    }
    
    // Validate request body
    if (!req.body) {
      console.log('Missing request body for lesson update');
      throw new ApiError(400, 'Update data is required');
    }
    
    try {
      // Check course ownership
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();
      
      if (courseError) {
        if (courseError.code === 'PGRST116') {
          console.log(`Course not found with ID: ${courseId}`);
          throw new ApiError(404, 'Course not found');
        }
        
        console.error(`Error fetching course: ${courseError.message}`, courseError);
        logger.error(`Error fetching course: ${courseError.message}`);
        throw new ApiError(500, 'Failed to fetch course');
      }
      
      // Check instructor ownership
      if (course.instructor_id !== userId) {
        console.log(`Unauthorized lesson update attempt: User ${userId} is not the owner of course ${courseId}`);
        throw new ApiError(403, 'Not authorized to update lessons in this course');
      }
      
      // Check if section exists and belongs to this course
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .select('id')
        .eq('id', sectionId)
        .eq('course_id', courseId)
        .single();
        
      if (sectionError) {
        if (sectionError.code === 'PGRST116') {
          console.log(`Section not found with ID: ${sectionId}`);
          throw new ApiError(404, 'Section not found');
        }
        
        console.error(`Error fetching section: ${sectionError.message}`, sectionError);
        logger.error(`Error fetching section: ${sectionError.message}`);
        throw new ApiError(500, 'Failed to fetch section');
      }
      
      // Check if lesson exists and belongs to this section and course
      const { data: existingLesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('section_id', sectionId)
        .eq('course_id', courseId)
        .single();
      
      if (lessonError) {
        if (lessonError.code === 'PGRST116') {
          console.log(`Lesson not found with ID: ${lessonId}`);
          throw new ApiError(404, 'Lesson not found');
        }
        
        console.error(`Error fetching lesson: ${lessonError.message}`, lessonError);
        logger.error(`Error fetching lesson: ${lessonError.message}`);
        throw new ApiError(500, 'Failed to fetch lesson');
      }
      
      // Process body to handle potential arrays from form data
      const processedBody: Record<string, any> = {};
      
      // Process each field to handle arrays
      Object.entries(req.body).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          processedBody[key] = value[0];
        } else {
          processedBody[key] = value;
        }
      });
      
      // Extract content from processed body for separate handling
      const { content, ...otherFields } = processedBody;
      
      // Prepare lesson update data with type annotation
      const updateData: Record<string, any> = {
        ...otherFields,
        updated_at: new Date().toISOString(),
        updated_by: userId
      };
      
      // If duration_minutes is provided, parse it
      if (updateData.duration_minutes) {
        updateData.duration_minutes = parseInt(updateData.duration_minutes || '0');
      }
      
      // If order is provided, parse it
      if (updateData.order) {
        updateData.order = parseInt(updateData.order || '0');
      }
      
      // Remove fields that shouldn't be updated
      if ('id' in updateData) delete updateData.id;
      if ('course_id' in updateData) delete updateData.course_id;
      if ('created_at' in updateData) delete updateData.created_at;
      if ('created_by' in updateData) delete updateData.created_by;
      
      console.log(`Updating lesson ${lessonId} with data:`, updateData);
      
      // Begin a transaction to update the lesson and its content
      const { data: updatedLesson, error: updateError } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', lessonId)
        .select()
        .single();
      
      if (updateError) {
        console.error(`Error updating lesson: ${updateError.message}`, updateError);
        logger.error(`Error updating lesson: ${updateError.message}`);
        throw new ApiError(500, 'Failed to update lesson');
      }
      
      // If content is provided, update or create lesson content
      if (content !== undefined) {
        // Check if content exists
        const { data: existingContent, error: contentCheckError } = await supabase
          .from('lesson_contents')
          .select('id')
          .eq('lesson_id', lessonId)
          .single();
        
        if (contentCheckError && contentCheckError.code !== 'PGRST116') {
          console.error(`Error checking lesson content: ${contentCheckError.message}`, contentCheckError);
          logger.error(`Error checking lesson content: ${contentCheckError.message}`);
          // Don't throw an error here, we'll still return the updated lesson
        }
        
        const contentData = {
          content: content,
          updated_at: new Date().toISOString()
        };
        
        let contentError;
        
        if (existingContent) {
          // Update existing content
          const { error } = await supabase
            .from('lesson_contents')
            .update(contentData)
            .eq('id', existingContent.id);
          
          contentError = error;
        } else {
          // Create new content
          const { error } = await supabase
            .from('lesson_contents')
            .insert({
              ...contentData,
              lesson_id: lessonId,
              created_at: new Date().toISOString()
            });
          
          contentError = error;
        }
        
        if (contentError) {
          console.error(`Error updating lesson content: ${contentError.message}`, contentError);
          logger.error(`Error updating lesson content: ${contentError.message}`);
          // Don't throw an error here, we'll still return the updated lesson
        }
      }
      
      // Fetch the complete updated lesson with its content
      const { data: completeLesson, error: fetchError } = await supabase
        .from('lessons')
        .select(`
          *,
          section:sections(id, title),
          content:lesson_contents(*)
        `)
        .eq('id', lessonId)
        .single();
      
      if (fetchError) {
        console.error(`Error fetching complete updated lesson: ${fetchError.message}`, fetchError);
        logger.error(`Error fetching complete updated lesson: ${fetchError.message}`);
        // Still return the basic updated lesson data
        res.status(200).json({
          success: true,
          data: updatedLesson
        });
        return;
      }
      
      console.log(`Successfully updated lesson with ID: ${lessonId}`);
      
      res.status(200).json({
        success: true,
        data: completeLesson
      });
    } catch (error) {
      console.error(`Error in updateLesson for lesson ${lessonId} in course ${courseId}:`, error);
      throw error; // Re-throw to be caught by asyncHandler
    }
  } catch (error) {
    console.error('Unexpected error in updateLesson:', error);
    throw error; // Re-throw to be caught by asyncHandler
  }
});

// @desc    Delete lesson
// @route   DELETE /api/courses/:courseId/sections/:sectionId/lessons/:lessonId
// @access  Private (Instructor only)
export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const sectionId = req.params.sectionId;
  const lessonId = req.params.lessonId;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check course ownership
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();
  
  if (courseError) {
    if (courseError.code === 'PGRST116') {
      throw new ApiError(404, 'Course not found');
    }
    
    logger.error(`Error fetching course: ${courseError.message}`);
    throw new ApiError(500, 'Failed to fetch course');
  }
  
  // Check instructor ownership
  if (course.instructor_id !== userId) {
    throw new ApiError(403, 'Not authorized to delete lessons in this course');
  }
  
  // Check if section exists and belongs to the course
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('id')
    .eq('id', sectionId)
    .eq('course_id', courseId)
    .single();
  
  if (sectionError) {
    if (sectionError.code === 'PGRST116') {
      throw new ApiError(404, 'Section not found');
    }
    
    logger.error(`Error fetching section: ${sectionError.message}`);
    throw new ApiError(500, 'Failed to fetch section');
  }
  
  // Check if lesson exists and belongs to this section and course
  const { data: existingLesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id')
    .eq('id', lessonId)
    .eq('section_id', sectionId)
    .eq('course_id', courseId)
    .single();
  
  if (lessonError) {
    if (lessonError.code === 'PGRST116') {
      throw new ApiError(404, 'Lesson not found');
    }
    
    logger.error(`Error fetching lesson: ${lessonError.message}`);
    throw new ApiError(500, 'Failed to fetch lesson');
  }
  
  // Delete the lesson content first
  const { error: contentDeleteError } = await supabase
    .from('lesson_contents')
    .delete()
    .eq('lesson_id', lessonId);
  
  if (contentDeleteError) {
    // Log error but continue with lesson deletion
    logger.error(`Error deleting lesson content: ${contentDeleteError.message}`);
  }
  
  // Delete lesson progress
  const { error: progressDeleteError } = await supabase
    .from('lesson_progress')
    .delete()
    .eq('lesson_id', lessonId);
  
  if (progressDeleteError) {
    // Log error but continue with lesson deletion
    logger.error(`Error deleting lesson progress: ${progressDeleteError.message}`);
  }
  
  // Delete the lesson
  const { error: lessonDeleteError } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);
  
  if (lessonDeleteError) {
    logger.error(`Error deleting lesson: ${lessonDeleteError.message}`);
    throw new ApiError(500, 'Failed to delete lesson');
  }
  
  // Re-order remaining lessons
  const { data: remainingLessons, error: fetchRemainingError } = await supabase
    .from('lessons')
    .select('id, order')
    .eq('course_id', courseId)
    .order('order', { ascending: true });
  
  if (!fetchRemainingError && remainingLessons) {
    // Update lesson orders to be sequential
    for (let i = 0; i < remainingLessons.length; i++) {
      const lesson = remainingLessons[i];
      if (lesson.order !== i + 1) {
        const { error: orderUpdateError } = await supabase
          .from('lessons')
          .update({ order: i + 1 })
          .eq('id', lesson.id);
        
        if (orderUpdateError) {
          // Log error but don't fail the request
          logger.error(`Error updating lesson order: ${orderUpdateError.message}`);
        }
      }
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Lesson deleted successfully'
  });
});

// @desc    Mark lesson as completed
// @route   PUT /api/courses/:courseId/sections/:sectionId/lessons/:lessonId/complete
// @access  Private (Enrolled students only)
export const completeLesson = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  const sectionId = req.params.sectionId;
  const lessonId = req.params.lessonId;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }
  
  const supabase = getSupabase();
  
  // Check if user is enrolled in the course
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  
  if (enrollmentError) {
    if (enrollmentError.code === 'PGRST116') {
      throw new ApiError(403, 'You are not enrolled in this course');
    }
    
    logger.error(`Error checking enrollment: ${enrollmentError.message}`);
    throw new ApiError(500, 'Failed to check enrollment');
  }
  
  // Check if lesson exists and belongs to this section and course
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id')
    .eq('id', lessonId)
    .eq('section_id', sectionId)
    .eq('course_id', courseId)
    .single();
  
  if (lessonError) {
    if (lessonError.code === 'PGRST116') {
      throw new ApiError(404, 'Lesson not found');
    }
    
    logger.error(`Error fetching lesson: ${lessonError.message}`);
    throw new ApiError(500, 'Failed to fetch lesson');
  }
  
  // Check if progress record exists
  const { data: progress, error: progressError } = await supabase
    .from('lesson_progress')
    .select('id, completed')
    .eq('lesson_id', lessonId)
    .eq('enrollment_id', enrollment.id)
    .single();
  
  if (progressError && progressError.code !== 'PGRST116') {
    logger.error(`Error checking lesson progress: ${progressError.message}`);
    throw new ApiError(500, 'Failed to check lesson progress');
  }
  
  let progressId;
  
  if (progress) {
    // Update existing progress record
    progressId = progress.id;
    
    if (!progress.completed) {
      const { error: updateError } = await supabase
        .from('lesson_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', progressId);
      
      if (updateError) {
        logger.error(`Error updating lesson progress: ${updateError.message}`);
        throw new ApiError(500, 'Failed to update lesson progress');
      }
    }
  } else {
    // Create new progress record
    const { data: newProgress, error: createError } = await supabase
      .from('lesson_progress')
      .insert({
        lesson_id: lessonId,
        enrollment_id: enrollment.id,
        started_at: new Date().toISOString(),
        completed: true,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      logger.error(`Error creating lesson progress: ${createError.message}`);
      throw new ApiError(500, 'Failed to create lesson progress');
    }
    
    progressId = newProgress.id;
  }
  
  // Update the enrollment progress percentage
  try {
    // Get total number of lessons in course
    const { count, error: countError } = await supabase
      .from('lessons')
      .select('id', { count: 'exact' })
      .eq('course_id', courseId);
    
    if (countError) {
      throw countError;
    }
    
    // Ensure totalLessons is a number and not null
    const totalLessons = count ?? 0;
    
    // Get number of completed lessons
    const { count: countCompleted, error: completedError } = await supabase
      .from('lesson_progress')
      .select('id', { count: 'exact' })
      .eq('enrollment_id', enrollment.id)
      .eq('completed', true);
    
    if (completedError) {
      throw completedError;
    }
    
    // Ensure completedLessons is a number and not null
    const completedLessons = countCompleted ?? 0;
    
    // Calculate progress percentage
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;
    
    // Update enrollment record
    const { error: enrollmentUpdateError } = await supabase
      .from('enrollments')
      .update({
        progress_percentage: progressPercentage,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);
    
    if (enrollmentUpdateError) {
      throw enrollmentUpdateError;
    }
    
    // Check if all lessons are completed and update enrollment status if needed
    if (totalLessons > 0 && completedLessons >= totalLessons) {
      const { error: completeError } = await supabase
        .from('enrollments')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', enrollment.id)
        .is('completed_at', null);
      
      if (completeError) {
        throw completeError;
      }
    }
  } catch (error) {
    // Log error but don't fail the request
    logger.error(`Error updating enrollment progress: ${error}`);
  }
  
  res.status(200).json({
    success: true,
    message: 'Lesson marked as completed'
  });
});