import { getSupabase, getServiceSupabase } from '../config/supabase';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { 
  Course, 
  Section, 
  Lesson, 
  Assignment, 
  CourseReview, 
  StudyMaterial,
  PaginationParams,
  FilterParams
} from '../types';

class CourseService {
  // Create a new course
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const supabase = getSupabase();
    
    // Validate required fields
    if (!courseData.title || !courseData.description || !courseData.instructor_id) {
      throw new ApiError(400, 'Title, description, and instructor are required');
    }
    
    // Ensure proper defaults
    const newCourse = {
      ...courseData,
      is_published: courseData.is_published || false,
      difficulty_level: courseData.difficulty_level || 'beginner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('courses')
      .insert(newCourse)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error creating course: ${error.message}`);
      throw new ApiError(500, `Failed to create course: ${error.message}`);
    }
    
    return data as Course;
  }
  
  // Get courses with pagination and filtering
  async getCourses(
    pagination: PaginationParams, 
    filters: FilterParams
  ): Promise<{ courses: Course[]; total: number; totalPages: number }> {
    const supabase = getSupabase();
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    
    // Start building the query
    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }
    
    if (filters.instructor_id) {
      query = query.eq('instructor_id', filters.instructor_id);
    }
    
    if (filters.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    } else {
      // By default, only show published courses
      query = query.eq('is_published', true);
    }
    
    if (filters.price_min !== undefined) {
      query = query.gte('price', filters.price_min);
    }
    
    if (filters.price_max !== undefined) {
      query = query.lte('price', filters.price_max);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Execute query with pagination
    const { data, error, count } = await query.range(from, to);
    
    if (error) {
      logger.error(`Error fetching courses: ${error.message}`);
      throw new ApiError(500, `Failed to fetch courses: ${error.message}`);
    }
    
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      courses: data as Course[],
      total,
      totalPages
    };
  }
  
  // Get course by ID
  async getCourseById(courseId: string): Promise<Course | null> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:profiles(id, first_name, last_name, avatar_url, bio)
      `)
      .eq('id', courseId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Course not found
      }
      
      logger.error(`Error fetching course: ${error.message}`);
      throw new ApiError(500, `Failed to fetch course: ${error.message}`);
    }
    
    return data as Course;
  }
  
  // Update course
  async updateCourse(courseId: string, courseData: Partial<Course>): Promise<Course> {
    const supabase = getSupabase();
    
    // Prevent updating critical fields
    const { instructor_id, created_at, ...updateData } = courseData;
    
    // Update the timestamp
    const updatedCourse = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('courses')
      .update(updatedCourse)
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error updating course: ${error.message}`);
      throw new ApiError(500, `Failed to update course: ${error.message}`);
    }
    
    return data as Course;
  }
  
  // Delete course
  async deleteCourse(courseId: string): Promise<void> {
    const supabase = getServiceSupabase(); // Using service role for cascading delete
    
    // First check if course exists
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new ApiError(404, 'Course not found');
      }
      
      logger.error(`Error fetching course for deletion: ${fetchError.message}`);
      throw new ApiError(500, `Failed to fetch course: ${fetchError.message}`);
    }
    
    // Delete course
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) {
      logger.error(`Error deleting course: ${error.message}`);
      throw new ApiError(500, `Failed to delete course: ${error.message}`);
    }
  }
  
  // Update course publish status
  async updateCourseStatus(courseId: string, isPublished: boolean): Promise<Course> {
    return this.updateCourse(courseId, { is_published: isPublished });
  }
  
  // Get course sections
  async getCourseSections(courseId: string): Promise<Section[]> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    
    if (error) {
      logger.error(`Error fetching course sections: ${error.message}`);
      throw new ApiError(500, `Failed to fetch course sections: ${error.message}`);
    }
    
    return data as Section[];
  }
  
  // Create course section
  async createSection(courseId: string, sectionData: Partial<Section>): Promise<Section> {
    const supabase = getSupabase();
    
    // Get the next order index
    const { data: existingSections, error: countError } = await supabase
      .from('sections')
      .select('order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: false })
      .limit(1);
    
    if (countError) {
      logger.error(`Error counting sections: ${countError.message}`);
      throw new ApiError(500, `Failed to count sections: ${countError.message}`);
    }
    
    const nextOrderIndex = existingSections && existingSections.length > 0 
      ? (existingSections[0].order_index + 1) 
      : 1;
    
    const newSection = {
      course_id: courseId,
      title: sectionData.title,
      order_index: sectionData.order_index || nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('sections')
      .insert(newSection)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error creating section: ${error.message}`);
      throw new ApiError(500, `Failed to create section: ${error.message}`);
    }
    
    return data as Section;
  }
  
  // Update course section
  async updateSection(courseId: string, sectionId: string, sectionData: Partial<Section>): Promise<Section> {
    const supabase = getSupabase();
    
    // Prevent updating critical fields
    const { course_id, created_at, ...updateData } = sectionData;
    
    // Update the timestamp
    const updatedSection = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('sections')
      .update(updatedSection)
      .eq('id', sectionId)
      .eq('course_id', courseId) // Ensure section belongs to course
      .select()
      .single();
    
    if (error) {
      logger.error(`Error updating section: ${error.message}`);
      throw new ApiError(500, `Failed to update section: ${error.message}`);
    }
    
    return data as Section;
  }
  
  // Delete course section
  async deleteSection(courseId: string, sectionId: string): Promise<void> {
    const supabase = getServiceSupabase(); // Using service role for cascading delete
    
    // First check if section exists and belongs to course
    const { data: section, error: fetchError } = await supabase
      .from('sections')
      .select('id')
      .eq('id', sectionId)
      .eq('course_id', courseId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new ApiError(404, 'Section not found');
      }
      
      logger.error(`Error fetching section for deletion: ${fetchError.message}`);
      throw new ApiError(500, `Failed to fetch section: ${fetchError.message}`);
    }
    
    // Delete section
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId);
    
    if (error) {
      logger.error(`Error deleting section: ${error.message}`);
      throw new ApiError(500, `Failed to delete section: ${error.message}`);
    }
  }
  
  // Get course lessons
  async getCourseLessons(courseId: string, userId?: string): Promise<Lesson[]> {
    const supabase = getSupabase();
    
    // Get the course to check if user is instructor or if course is published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id, is_published')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      if (courseError.code === 'PGRST116') {
        throw new ApiError(404, 'Course not found');
      }
      
      logger.error(`Error fetching course for lessons: ${courseError.message}`);
      throw new ApiError(500, `Failed to fetch course: ${courseError.message}`);
    }
    
    // Check if user is enrolled or is instructor
    let isEnrolled = false;
    let isInstructor = false;
    
    if (userId) {
      isInstructor = course.instructor_id === userId;
      
      if (!isInstructor) {
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle();
        
        if (!enrollmentError && enrollment) {
          isEnrolled = true;
        }
      }
    }
    
    // Build query for lessons
    let query = supabase
      .from('lessons')
      .select(`
        *,
        section:sections(id, title, order_index)
      `)
      .eq('sections.course_id', courseId)
      .order('sections.order_index')
      .order('order_index');
    
    // If user is not instructor or enrolled, only show free preview lessons and from published courses
    if (!isInstructor && !isEnrolled) {
      if (!course.is_published) {
        return []; // Return empty array if course is not published
      }
      
      query = query.eq('is_free_preview', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error(`Error fetching lessons: ${error.message}`);
      throw new ApiError(500, `Failed to fetch lessons: ${error.message}`);
    }
    
    return data as Lesson[];
  }
  
  // Get course assignments
  async getCourseAssignments(courseId: string, userId: string): Promise<Assignment[]> {
    const supabase = getSupabase();
    
    // Check if user is instructor or enrolled in the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      if (courseError.code === 'PGRST116') {
        throw new ApiError(404, 'Course not found');
      }
      
      logger.error(`Error fetching course for assignments: ${courseError.message}`);
      throw new ApiError(500, `Failed to fetch course: ${courseError.message}`);
    }
    
    const isInstructor = course.instructor_id === userId;
    
    if (!isInstructor) {
      // Check if user is enrolled
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      
      if (enrollmentError || !enrollment) {
        throw new ApiError(403, 'You must be enrolled in this course to view assignments');
      }
    }
    
    // Get assignments
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        submissions:assignment_submissions(id, status, grade, submitted_at)
      `)
      .eq('course_id', courseId)
      .or(`submissions.user_id.eq.${userId},submissions.is_null`)
      .order('due_date', { ascending: true });
    
    if (error) {
      logger.error(`Error fetching assignments: ${error.message}`);
      throw new ApiError(500, `Failed to fetch assignments: ${error.message}`);
    }
    
    return data as Assignment[];
  }
  
  // Get course reviews
  async getCourseReviews(courseId: string): Promise<CourseReview[]> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('course_reviews')
      .select(`
        *,
        user:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error(`Error fetching course reviews: ${error.message}`);
      throw new ApiError(500, `Failed to fetch course reviews: ${error.message}`);
    }
    
    return data as CourseReview[];
  }
  
  // Get course study materials
  async getCourseStudyMaterials(courseId: string, userId: string): Promise<StudyMaterial[]> {
    const supabase = getSupabase();
    
    // Check if user is instructor or enrolled in the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      if (courseError.code === 'PGRST116') {
        throw new ApiError(404, 'Course not found');
      }
      
      logger.error(`Error fetching course for materials: ${courseError.message}`);
      throw new ApiError(500, `Failed to fetch course: ${courseError.message}`);
    }
    
    const isInstructor = course.instructor_id === userId;
    
    if (!isInstructor) {
      // Check if user is enrolled
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      
      if (enrollmentError || !enrollment) {
        throw new ApiError(403, 'You must be enrolled in this course to view study materials');
      }
    }
    
    // Get study materials
    const { data, error } = await supabase
      .from('study_materials')
      .select(`
        *,
        section:sections(id, title, order_index),
        lesson:lessons(id, title, order_index)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error(`Error fetching study materials: ${error.message}`);
      throw new ApiError(500, `Failed to fetch study materials: ${error.message}`);
    }
    
    return data as StudyMaterial[];
  }
  
  // Add study material
  async addStudyMaterial(courseId: string, materialData: Partial<StudyMaterial>): Promise<StudyMaterial> {
    const supabase = getSupabase();
    
    // Validate required fields
    if (!materialData.title || !materialData.file_url || !materialData.file_type) {
      throw new ApiError(400, 'Title, file URL, and file type are required');
    }
    
    // Create the study material
    const newMaterial = {
      course_id: courseId,
      section_id: materialData.section_id,
      lesson_id: materialData.lesson_id,
      title: materialData.title,
      description: materialData.description,
      file_url: materialData.file_url,
      file_type: materialData.file_type,
      size_bytes: materialData.size_bytes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('study_materials')
      .insert(newMaterial)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error adding study material: ${error.message}`);
      throw new ApiError(500, `Failed to add study material: ${error.message}`);
    }
    
    return data as StudyMaterial;
  }
  
  // Remove study material
  async removeStudyMaterial(courseId: string, materialId: string): Promise<void> {
    const supabase = getSupabase();
    
    // First check if material exists and belongs to course
    const { data: material, error: fetchError } = await supabase
      .from('study_materials')
      .select('id')
      .eq('id', materialId)
      .eq('course_id', courseId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new ApiError(404, 'Study material not found');
      }
      
      logger.error(`Error fetching study material: ${fetchError.message}`);
      throw new ApiError(500, `Failed to fetch study material: ${fetchError.message}`);
    }
    
    // Delete study material
    const { error } = await supabase
      .from('study_materials')
      .delete()
      .eq('id', materialId);
    
    if (error) {
      logger.error(`Error removing study material: ${error.message}`);
      throw new ApiError(500, `Failed to remove study material: ${error.message}`);
    }
  }
}

export default new CourseService();