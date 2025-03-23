export enum UserRole {
    STUDENT = 'student',
    INSTRUCTOR = 'instructor',
    ADMIN = 'admin'
  }
  
  export interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    bio?: string;
    role: UserRole;
    created_at: string;
    updated_at: string;
  }
  
  export interface Course {
    id: string;
    title: string;
    description: string;
    cover_image_url?: string;
    instructor_id: string;
    price?: number;
    is_published: boolean;
    category: string;
    tags?: string[];
    duration_weeks?: number;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    created_at: string;
    updated_at: string;
  }
  
  export interface Section {
    id: string;
    course_id: string;
    title: string;
    order_index: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface Assignment {
    id: string;
    course_id: string;
    section_id?: string;
    title: string;
    description: string;
    due_date?: string;
    points?: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface AssignmentSubmission {
    id: string;
    assignment_id: string;
    user_id: string;
    content: string;
    attachments?: string[];
    status: 'submitted' | 'graded' | 'returned';
    grade?: number;
    feedback?: string;
    submitted_at: string;
    graded_at?: string;
  }
  
  export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    enrolled_at: string;
    completed_at?: string;
    progress_percentage: number;
    last_accessed_at?: string;
  }
  
  export interface CourseReview {
    id: string;
    course_id: string;
    user_id: string;
    rating: number;
    comment?: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface StudyMaterial {
    id: string;
    course_id: string;
    section_id?: string;
    lesson_id?: string;
    title: string;
    description?: string;
    file_url: string;
    file_type: string;
    size_bytes?: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
  
  export interface FilterParams {
    category?: string;
    difficulty_level?: string;
    instructor_id?: string;
    is_published?: boolean;
    price_min?: number;
    price_max?: number;
    search?: string;
  }

  export interface Lesson {
    id: string;
    course_id: string;  // Add this field
    section_id: string;
    title: string;
    video_url?: string;
    order: number;      // Rename from order_index
    duration_minutes?: number;
    is_preview: boolean; // Rename from is_free_preview
    created_at: string;
    updated_at?: string;
  }
  
  // Add this new interface for lesson content
  export interface LessonContent {
    id: string;
    lesson_id: string;
    content: string;
    created_at: string;
    updated_at?: string;
  }