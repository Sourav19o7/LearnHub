import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
  UserCircleIcon,
  AtSymbolIcon,
  PhoneIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  HomeIcon,
  GlobeAltIcon,
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon,
  XMarkIcon,
  PencilIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

interface ProfileFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  education?: string;
  occupation?: string;
  interests?: string;
  expertise?: string;
  teaching_experience?: string;
}

const profileSchema = Yup.object().shape({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().nullable(),
  bio: Yup.string().nullable(),
  location: Yup.string().nullable(),
  website: Yup.string().url('Must be a valid URL').nullable(),
  education: Yup.string().nullable(),
  occupation: Yup.string().nullable(),
  interests: Yup.string().nullable(),
  expertise: Yup.string().nullable(),
  teaching_experience: Yup.string().nullable(),
});

const InstructorProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'instructor'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile
  const { data, isLoading, error } = useQuery(
    ['userProfile', user?.id],
    async () => {
      const response = await api.get(`/user/profile`);
      return response.data;
    },
    {
      enabled: !!user?.id,
    }
  );

  // Fetch instructor stats
  const { data: statsData } = useQuery(
    ['instructorStats', user?.id],
    async () => {
      const response = await api.get(`/instructor/stats`);
      return response.data;
    },
    {
      enabled: !!user?.id,
    }
  );

  // Update profile mutation
  const updateProfile = useMutation(
    async (values: ProfileFormValues) => {
      const formData = new FormData();
      
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      if (avatar) {
        formData.append('avatar', avatar);
      }
      
      const response = await api.put('/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        queryClient.invalidateQueries(['userProfile', user?.id]);
        setIsEditing(false);
        setAvatar(null);
      },
      onError: () => {
        toast.error('Failed to update profile');
      },
    }
  );

  // Password change schema
  const passwordSchema = Yup.object().shape({
    current_password: Yup.string().required('Current password is required'),
    new_password: Yup.string()
      .required('New password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirm_password: Yup.string()
      .required('Please confirm your password')
      .oneOf([Yup.ref('new_password')], 'Passwords must match'),
  });

  // Change password mutation
  const changePassword = useMutation(
    async (values: { current_password: string; new_password: string }) => {
      const response = await api.put('/user/password', values);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setIsChangingPassword(false);
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || 'Failed to change password'
        );
      },
    }
  );

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Error Loading Profile
          </h2>
          <p className="text-surface-600 dark:text-surface-400">
            An error occurred while loading your profile. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const userProfile = data.data;
  const stats = statsData?.data || {
    courses_count: 0,
    students_count: 0,
    ratings_avg: 0,
    revenue_total: 0,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Instructor Profile
        </h1>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-lg shadow-sm dark:shadow-dark-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-surface-200 dark:border-surface-700">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-surface-600 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('instructor')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'instructor'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-surface-600 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200'
              }`}
            >
              Instructor Information
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'account'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-surface-600 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200'
              }`}
            >
              Account Settings
            </button>
          </nav>
        </div>

        {activeTab === 'profile' && (
          <div className="p-6">
            {isEditing ? (
              <Formik
                initialValues={{
                  first_name: userProfile.first_name || '',
                  last_name: userProfile.last_name || '',
                  email: userProfile.email || '',
                  phone: userProfile.phone || '',
                  bio: userProfile.bio || '',
                  location: userProfile.location || '',
                  website: userProfile.website || '',
                  education: userProfile.education || '',
                  occupation: userProfile.occupation || '',
                  interests: userProfile.interests || '',
                  expertise: userProfile.expertise || '',
                  teaching_experience: userProfile.teaching_experience || '',
                }}
                validationSchema={profileSchema}
                onSubmit={(values) => updateProfile.mutate(values)}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="mb-6 flex items-center">
                      <div className="mr-4 relative">
                        <div className="h-24 w-24 rounded-full overflow-hidden bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                          {avatar ? (
                            <img
                              src={URL.createObjectURL(avatar)}
                              alt="Avatar preview"
                              className="h-full w-full object-cover"
                            />
                          ) : userProfile.avatar_url ? (
                            <img
                              src={userProfile.avatar_url}
                              alt="Avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="h-full w-full text-surface-400 dark:text-surface-500" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-primary-600 text-white p-1 rounded-full hover:bg-primary-700"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-medium text-surface-900 dark:text-white">
                          Profile Picture
                        </h2>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                          Choose a professional photo for your instructor profile.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="first_name"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          First name
                        </label>
                        <div className="mt-1">
                          <Field
                            id="first_name"
                            name="first_name"
                            type="text"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                          <ErrorMessage
                            name="first_name"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="last_name"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Last name
                        </label>
                        <div className="mt-1">
                          <Field
                            id="last_name"
                            name="last_name"
                            type="text"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                          <ErrorMessage
                            name="last_name"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Email
                        </label>
                        <div className="mt-1">
                          <Field
                            id="email"
                            name="email"
                            type="email"
                            disabled
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm bg-surface-100 dark:bg-surface-700 cursor-not-allowed dark:text-white"
                          />
                          <ErrorMessage
                            name="email"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Phone
                        </label>
                        <div className="mt-1">
                          <Field
                            id="phone"
                            name="phone"
                            type="text"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="bio"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Bio
                        </label>
                        <div className="mt-1">
                          <Field
                            id="bio"
                            name="bio"
                            as="textarea"
                            rows={3}
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Location
                        </label>
                        <div className="mt-1">
                          <Field
                            id="location"
                            name="location"
                            type="text"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="website"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Website
                        </label>
                        <div className="mt-1">
                          <Field
                            id="website"
                            name="website"
                            type="text"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                          <ErrorMessage
                            name="website"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="education"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Education
                        </label>
                        <div className="mt-1">
                          <Field
                            id="education"
                            name="education"
                            type="text"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="occupation"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Occupation
                        </label>
                        <div className="mt-1">
                          <Field
                            id="occupation"
                            name="occupation"
                            type="text"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="interests"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Interests
                        </label>
                        <div className="mt-1">
                          <Field
                            id="interests"
                            name="interests"
                            as="textarea"
                            rows={2}
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setAvatar(null);
                        }}
                        className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                      {userProfile.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="h-full w-full text-surface-400 dark:text-surface-500" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                        {userProfile.first_name} {userProfile.last_name}
                      </h2>
                      <p className="text-surface-600 dark:text-surface-400">
                        Joined {new Date(userProfile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        Bio
                      </dt>
                      <dd className="mt-1 text-surface-900 dark:text-white">
                        {userProfile.bio || 'No bio provided'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-surface-500 dark:text-surface-400 flex items-center">
                        <AtSymbolIcon className="h-5 w-5 mr-1 text-surface-400" />
                        Email
                      </dt>
                      <dd className="mt-1 text-surface-900 dark:text-white">
                        {userProfile.email}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-surface-500 dark:text-surface-400 flex items-center">
                        <PhoneIcon className="h-5 w-5 mr-1 text-surface-400" />
                        Phone
                      </dt>
                      <dd className="mt-1 text-surface-900 dark:text-white">
                        {userProfile.phone || 'Not provided'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-surface-500 dark:text-surface-400 flex items-center">
                        <HomeIcon className="h-5 w-5 mr-1 text-surface-400" />
                        Location
                      </dt>
                      <dd className="mt-1 text-surface-900 dark:text-white">
                        {userProfile.location || 'Not provided'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-surface-500 dark:text-surface-400 flex items-center">
                        <GlobeAltIcon className="h-5 w-5 mr-1 text-surface-400" />
                        Website
                      </dt>
                      <dd className="mt-1 text-surface-900 dark:text-white">
                        {userProfile.website ? (
                          <a
                            href={userProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            {userProfile.website}
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-surface-500 dark:text-surface-400 flex items-center">
                        <AcademicCapIcon className="h-5 w-5 mr-1 text-surface-400" />
                        Education
                      </dt>
                      <dd className="mt-1 text-surface-900 dark:text-white">
                        {userProfile.education || 'Not provided'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-surface-500 dark:text-surface-400 flex items-center">
                        <BriefcaseIcon className="h-5 w-5 mr-1 text-surface-400" />
                        Occupation
                      </dt>
                      <dd className="mt-1 text-surface-900 dark:text-white">
                        {userProfile.occupation || 'Not provided'}
                      </dd>
                    </div>

                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        Interests
                      </dt>
                      <dd className="mt-1 text-surface-900 dark:text-white">
                        {userProfile.interests || 'No interests specified'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'instructor' && (
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
                Instructor Stats
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white dark:bg-surface-850 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        Total Courses
                      </p>
                      <p className="text-3xl font-bold text-surface-900 dark:text-white">
                        {stats.courses_count}
                      </p>
                    </div>
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                      <BookOpenIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-surface-850 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        Total Students
                      </p>
                      <p className="text-3xl font-bold text-surface-900 dark:text-white">
                        {stats.students_count}
                      </p>
                    </div>
                    <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                      <UsersIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-surface-850 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        Average Rating
                      </p>
                      <p className="text-3xl font-bold text-surface-900 dark:text-white">
                        {stats.ratings_avg ? stats.ratings_avg.toFixed(1) : '0.0'}
                      </p>
                    </div>
                    <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-warning-600 dark:text-warning-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-364 1.118l-2.8 2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-surface-850 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold text-surface-900 dark:text-white">
                        ${stats.revenue_total?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="p-3 bg-info-50 dark:bg-info-900/20 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-info-600 dark:text-info-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
                Instructor Information
              </h2>
              {isEditing ? (
                <Formik
                  initialValues={{
                    expertise: userProfile.expertise || '',
                    teaching_experience: userProfile.teaching_experience || '',
                  }}
                  onSubmit={(values) => {
                    const allValues = {
                      ...userProfile,
                      ...values,
                    };
                    updateProfile.mutate(allValues);
                  }}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-6">
                      <div>
                        <label
                          htmlFor="expertise"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Areas of Expertise
                        </label>
                        <div className="mt-1">
                          <Field
                            id="expertise"
                            name="expertise"
                            as="textarea"
                            rows={3}
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                            placeholder="Describe your areas of expertise and specialization (e.g., Web Development, Data Science, Digital Marketing)"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="teaching_experience"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Teaching Experience
                        </label>
                        <div className="mt-1">
                          <Field
                            id="teaching_experience"
                            name="teaching_experience"
                            as="textarea"
                            rows={3}
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                            placeholder="Share your teaching experience and credentials (e.g., years of experience, certifications, notable accomplishments)"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-medium text-surface-900 dark:text-white">
                      Areas of Expertise
                    </h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-surface-700 dark:text-surface-300 mb-6">
                    {userProfile.expertise || 'No expertise information provided.'}
                  </p>

                  <h3 className="text-md font-medium text-surface-900 dark:text-white mb-4">
                    Teaching Experience
                  </h3>
                  <p className="text-surface-700 dark:text-surface-300">
                    {userProfile.teaching_experience || 'No teaching experience information provided.'}
                  </p>

                  <div className="mt-6 p-4 bg-surface-50 dark:bg-surface-850 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div className="flex items-center">
                      <CloudArrowUpIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-surface-900 dark:text-white">
                          Complete your instructor profile
                        </h4>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                          A complete profile helps build trust with potential students and increases your course visibility.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
                Account Information
              </h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-surface-500 dark:text-surface-400">
                    Email
                  </dt>
                  <dd className="mt-1 text-surface-900 dark:text-white">
                    {userProfile.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-surface-500 dark:text-surface-400">
                    Account Created
                  </dt>
                  <dd className="mt-1 text-surface-900 dark:text-white">
                    {new Date(userProfile.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
                Change Password
              </h2>

              {isChangingPassword ? (
                <Formik
                  initialValues={{
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                  }}
                  validationSchema={passwordSchema}
                  onSubmit={(values) =>
                    changePassword.mutate({
                      current_password: values.current_password,
                      new_password: values.new_password,
                    })
                  }
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-4 max-w-lg">
                      <div>
                        <label
                          htmlFor="current_password"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Current Password
                        </label>
                        <div className="mt-1">
                          <Field
                            id="current_password"
                            name="current_password"
                            type="password"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                          <ErrorMessage
                            name="current_password"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="new_password"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          New Password
                        </label>
                        <div className="mt-1">
                          <Field
                            id="new_password"
                            name="new_password"
                            type="password"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                          <ErrorMessage
                            name="new_password"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="confirm_password"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Confirm New Password
                        </label>
                        <div className="mt-1">
                          <Field
                            id="confirm_password"
                            name="confirm_password"
                            type="password"
                            className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                          />
                          <ErrorMessage
                            name="confirm_password"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsChangingPassword(false)}
                          className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              ) : (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700"
                >
                  Change Password
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorProfile;