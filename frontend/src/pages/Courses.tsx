import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Course, FilterParams, PaginationParams } from '../types';
import CourseCard from '../components/course/CourseCard';
import LoadingScreen from '../components/common/LoadingScreen';

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterParams>({
    category: searchParams.get('category') || undefined,
    difficulty_level: searchParams.get('difficulty_level') || undefined,
    search: searchParams.get('search') || undefined,
  });
  
  const [pagination, setPagination] = useState<PaginationParams>({
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  });

  const { data, isLoading, error } = useQuery(
    ['courses', filter, pagination],
    async () => {
      const params = {
        ...filter,
        ...pagination,
        is_published: true,
      };
      const response = await api.get('/courses', { params });
      return response.data;
    }
  );

  useEffect(() => {
    // Update search params when filter or pagination changes
    const params: Record<string, string> = {};
    
    if (filter.category) params.category = filter.category;
    if (filter.difficulty_level) params.difficulty_level = filter.difficulty_level;
    if (filter.search) params.search = filter.search;
    
    const currentPage = pagination.page || 1;
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'desc';
    
    params.page = currentPage.toString();
    params.sortBy = sortBy;
    params.sortOrder = sortOrder;
    
    setSearchParams(params);
  }, [filter, pagination, setSearchParams]);

  const handleSearch = (searchTerm: string) => {
    setFilter(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  };

  const handleFilterChange = (newFilter: Partial<FilterParams>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Error Loading Courses
          </h2>
          <p className="text-surface-600 dark:text-surface-400">
            An error occurred while loading courses. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Ensure pagination values are defined with fallbacks
  const currentPage = pagination.page || 1;
  const currentSortBy = pagination.sortBy || 'created_at';
  const currentSortOrder = pagination.sortOrder || 'desc';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">
          Browse Courses
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search courses..."
              value={filter.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filter.category || ''}
              onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
              className="px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
              <option value="science">Science</option>
              <option value="language">Language</option>
            </select>
            <select
              value={filter.difficulty_level || ''}
              onChange={(e) => handleFilterChange({ difficulty_level: e.target.value || undefined })}
              className="px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={`${currentSortBy}_${currentSortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                setPagination(prev => ({ 
                  ...prev, 
                  sortBy, 
                  sortOrder: sortOrder as 'asc' | 'desc' 
                }));
              }}
              className="px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
            >
              <option value="created_at_desc">Newest</option>
              <option value="created_at_asc">Oldest</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {data?.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((course: Course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          
          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {[...Array(data.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-surface-300 dark:border-surface-600 text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 dark:border-primary-500 text-primary-600 dark:text-primary-200'
                        : 'bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= data.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-surface-900 dark:text-white mb-2">
            No courses found
          </h3>
          <p className="text-surface-600 dark:text-surface-400">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default Courses;