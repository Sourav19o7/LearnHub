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
    instructor?: UserProfile;
    price?: number;
    enrollment_count : number,
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
    lessons : Lesson[]
  }
  
  export interface Lesson {
    id: string;
    section_id: string;
    section?: Section;
    title: string;
    content: string;
    video_url?: string;
    order_index: number;
    duration_minutes?: number;
    is_free_preview: boolean;
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
    submissions?: AssignmentSubmission[];
    created_at: string;
    updated_at: string;
    submitted_at : string,
    course : Course,
    status : string
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
    course?: Course;
    enrolled_at: string;
    completed_at?: string;
    progress_percentage: number;
    last_accessed_at?: string;
  }
  
  export interface CourseReview {
    id: string;
    course_id: string;
    user_id: string;
    user?: UserProfile;
    rating: number;
    comment?: string;
    created_at: string;
    updated_at: string;
  }
  
  export 

  interface CourseFormValues {
    title: string;
    description: string;
    category: string;
    difficulty_level: string;
    price: number;
    duration_weeks: number;
    is_published: boolean;
    cover_image?: File | null;
    sections: {
      id : string,
      title: string;
      lessons: {
        id : string,
        title: string;
        content: string;
        video_url?: string;
        is_preview: boolean;
      }[];
    }[];
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
  
  export interface LessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    completed: boolean;
    completed_at?: string;
    last_position_seconds: number;
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
  
  export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    total: number;
    totalPages: number;
    currentPage: number;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: any;
  }