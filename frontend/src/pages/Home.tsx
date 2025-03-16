import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Course } from '../types';
import CourseCard from '../components/course/CourseCard';
import Hero from '../components/home/Hero';
import FeatureSection from '../components/home/FeatureSection';
import Testimonials from '../components/home/Testimonials';
import CTA from '../components/home/CTA';

const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);

  const { data: coursesData, isLoading } = useQuery(['featuredCourses'], async () => {
    // Fetch featured courses with pagination and filter
    const response = await api.get('/courses', {
      params: {
        page: 1,
        limit: 6,
        is_published: true,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }
    });
    return response.data;
  });

  useEffect(() => {
    if (coursesData?.data) {
      setFeaturedCourses(coursesData.data);
    }
  }, [coursesData]);

  return (
    <div>
      {/* Hero Section */}
      <Hero />

      {/* Featured Courses Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Courses
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Start your learning journey with our top courses
            </p>
          </div>

          {isLoading ? (
            <div className="mt-12 flex justify-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              <div className="mt-12 text-center">
                <Link
                  to="/courses"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Browse All Courses
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <FeatureSection />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <CTA />
    </div>
  );
};

export default Home;