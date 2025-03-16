import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import PrivateRoute from './components/auth/PrivateRoute';
import InstructorRoute from './components/auth/InstructorRoute';
import AdminRoute from './components/auth/AdminRoute';
import LoadingScreen from './components/common/LoadingScreen';

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Main Pages
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetails = lazy(() => import('./pages/CourseDetails'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const EnrolledCourses = lazy(() => import('./pages/student/EnrolledCourses'));
const CourseContent = lazy(() => import('./pages/student/CourseContent'));
const Assignments = lazy(() => import('./pages/student/Assignments'));
const AssignmentDetails = lazy(() => import('./pages/student/AssignmentDetails'));
const UserProfile = lazy(() => import('./pages/student/Profile'));

// Instructor Pages
const InstructorDashboard = lazy(() => import('./pages/instructor/Dashboard'));
const CourseManagement = lazy(() => import('./pages/instructor/CourseManagement'));
const CreateCourse = lazy(() => import('./pages/instructor/CreateCourse'));
const EditCourse = lazy(() => import('./pages/instructor/EditCourse'));
const CourseStudents = lazy(() => import('./pages/instructor/CourseStudents'));
const AssignmentManagement = lazy(() => import('./pages/instructor/AssignmentManagement'));
const InstructorProfile = lazy(() => import('./pages/instructor/Profile'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AllCourses = lazy(() => import('./pages/admin/AllCourses'));

// Not Found
const NotFound = lazy(() => import('./pages/NotFound'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Student Routes */}
        <Route
          element={
            <PrivateRoute>
              <DashboardLayout userRole="student" />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/dashboard/courses" element={<EnrolledCourses />} />
          <Route path="/dashboard/courses/:courseId" element={<CourseContent />} />
          <Route path="/dashboard/assignments" element={<Assignments />} />
          <Route path="/dashboard/assignments/:assignmentId" element={<AssignmentDetails />} />
          <Route path="/dashboard/profile" element={<UserProfile />} />
        </Route>

        {/* Instructor Routes */}
        <Route
          element={
            <InstructorRoute>
              <DashboardLayout userRole="instructor" />
            </InstructorRoute>
          }
        >
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/courses" element={<CourseManagement />} />
          <Route path="/instructor/courses/create" element={<CreateCourse />} />
          <Route path="/instructor/courses/:courseId/edit" element={<EditCourse />} />
          <Route path="/instructor/courses/:courseId/students" element={<CourseStudents />} />
          <Route path="/instructor/assignments" element={<AssignmentManagement />} />
          <Route path="/instructor/profile" element={<InstructorProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route
          element={
            <AdminRoute>
              <DashboardLayout userRole="admin" />
            </AdminRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/courses" element={<AllCourses />} />
        </Route>

        {/* Redirect /dashboard based on role */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

// This component determines the correct dashboard to redirect to based on user role
const Dashboard = () => {
  // This would come from your auth context
  const userRole = localStorage.getItem('userRole') || 'student';

  switch (userRole) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'instructor':
      return <Navigate to="/instructor/dashboard" replace />;
    case 'student':
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default AppRoutes;