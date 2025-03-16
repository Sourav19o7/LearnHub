import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  submission_count: number;
  graded_count: number;
}

interface Submission {
  id: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  content: string;
  attachment_url?: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  is_graded: boolean;
}

const assignmentSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  due_date: Yup.date().required('Due date is required'),
  max_score: Yup.number()
    .required('Maximum score is required')
    .positive('Score must be positive'),
});

const gradeSchema = Yup.object().shape({
  score: Yup.number()
    .required('Score is required')
    .min(0, 'Score cannot be negative'),
  feedback: Yup.string().required('Feedback is required'),
});

const AssignmentManagement = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showGradeForm, setShowGradeForm] = useState(false);

  // Fetch course details
  const { data: courseData, isLoading: isLoadingCourse, error: courseError } = useQuery(
    ['course', courseId],
    async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    }
  );

  // Fetch course assignments
  const { data: assignmentsData, isLoading: isLoadingAssignments, error: assignmentsError } = useQuery(
    ['course-assignments', courseId],
    async () => {
      const response = await api.get(`/courses/${courseId}/assignments`);
      return response.data;
    },
    {
      enabled: !!courseId
    }
  );

  // Fetch submissions for selected assignment
  const { data: submissionsData, isLoading: isLoadingSubmissions, error: submissionsError } = useQuery(
    ['assignment-submissions', selectedAssignment?.id],
    async () => {
      const response = await api.get(`/assignments/${selectedAssignment?.id}/submissions`);
      return response.data;
    },
    {
      enabled: !!selectedAssignment?.id
    }
  );

  // Create assignment mutation
  const createAssignment = useMutation(
    async (values: any) => {
      return await api.post(`/courses/${courseId}/assignments`, values);
    },
    {
      onSuccess: () => {
        toast.success('Assignment created successfully');
        setShowCreateForm(false);
        queryClient.invalidateQueries(['course-assignments', courseId]);
      },
      onError: () => {
        toast.error('Failed to create assignment');
      },
    }
  );

  // Delete assignment mutation
  const deleteAssignment = useMutation(
    async (assignmentId: string) => {
      return await api.delete(`/assignments/${assignmentId}`);
    },
    {
      onSuccess: () => {
        toast.success('Assignment deleted successfully');
        queryClient.invalidateQueries(['course-assignments', courseId]);
      },
      onError: () => {
        toast.error('Failed to delete assignment');
      },
    }
  );

  // Grade submission mutation
  const gradeSubmission = useMutation(
    async ({ submissionId, values }: { submissionId: string; values: any }) => {
      return await api.post(`/submissions/${submissionId}/grade`, values);
    },
    {
      onSuccess: () => {
        toast.success('Submission graded successfully');
        setShowGradeForm(false);
        queryClient.invalidateQueries(['assignment-submissions', selectedAssignment?.id]);
        queryClient.invalidateQueries(['course-assignments', courseId]);
      },
      onError: () => {
        toast.error('Failed to grade submission');
      },
    }
  );

  const handleCreateAssignment = (values: any, { setSubmitting }: any) => {
    createAssignment.mutate({
      title: values.title,
      description: values.description,
      due_date: values.due_date,
      max_score: values.max_score,
    });
    setSubmitting(false);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      deleteAssignment.mutate(assignmentId);
    }
  };

  const handleShowSubmissions = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissions(true);
  };

  const handleGradeSubmission = (values: any, { setSubmitting }: any) => {
    if (!selectedSubmission) return;
    
    gradeSubmission.mutate({
      submissionId: selectedSubmission.id,
      values: {
        score: values.score,
        feedback: values.feedback,
      },
    });
    setSubmitting(false);
  };

  const isLoading = isLoadingCourse || isLoadingAssignments || (showSubmissions && isLoadingSubmissions);
  const error = courseError || assignmentsError || (showSubmissions && submissionsError);
  
  const course = courseData?.data;
  const assignments: Assignment[] = assignmentsData?.data || [];
  const submissions: Submission[] = submissionsData?.data || [];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) return <LoadingScreen />;

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Course Not Found
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            The course you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/instructor/courses')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={() => navigate('/instructor/courses')}
              className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              Assignments - {course.title}
            </h1>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setShowSubmissions(false);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Assignment
          </button>
        </div>
      </div>

      {/* Create Assignment Form */}
      {showCreateForm && (
        <div className="mb-8 bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
          <div className="p-4 bg-surface-50 dark:bg-surface-850 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-surface-900 dark:text-white">
              Create New Assignment
            </h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <Formik
              initialValues={{
                title: '',
                description: '',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 week from now
                max_score: 100,
              }}
              validationSchema={assignmentSchema}
              onSubmit={handleCreateAssignment}
            >
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form className="space-y-6">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                    >
                      Assignment Title
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="title"
                        id="title"
                        className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                          errors.title && touched.title
                            ? 'border-error-300 dark:border-error-700'
                            : 'border-surface-300 dark:border-surface-700'
                        } rounded-md dark:bg-surface-800 dark:text-white`}
                      />
                      <ErrorMessage
                        name="title"
                        component="p"
                        className="mt-2 text-sm text-error-600 dark:text-error-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                    >
                      Assignment Description
                    </label>
                    <div className="mt-1">
                      <Field name="description">
                        {({ field }: any) => (
                          <ReactQuill
                            value={field.value}
                            onChange={(content) => setFieldValue('description', content)}
                            theme="snow"
                            className="bg-white dark:bg-surface-800 text-surface-900 dark:text-white rounded-md"
                          />
                        )}
                      </Field>
                      <ErrorMessage
                        name="description"
                        component="p"
                        className="mt-2 text-sm text-error-600 dark:text-error-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="due_date"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                      >
                        Due Date
                      </label>
                      <div className="mt-1">
                        <Field
                          type="date"
                          name="due_date"
                          id="due_date"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                            errors.due_date && touched.due_date
                              ? 'border-error-300 dark:border-error-700'
                              : 'border-surface-300 dark:border-surface-700'
                          } rounded-md dark:bg-surface-800 dark:text-white`}
                        />
                        <ErrorMessage
                          name="due_date"
                          component="p"
                          className="mt-2 text-sm text-error-600 dark:text-error-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="max_score"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                      >
                        Maximum Score
                      </label>
                      <div className="mt-1">
                        <Field
                          type="number"
                          name="max_score"
                          id="max_score"
                          min="1"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                            errors.max_score && touched.max_score
                              ? 'border-error-300 dark:border-error-700'
                              : 'border-surface-300 dark:border-surface-700'
                          } rounded-md dark:bg-surface-800 dark:text-white`}
                        />
                        <ErrorMessage
                          name="max_score"
                          component="p"
                          className="mt-2 text-sm text-error-600 dark:text-error-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="mr-3 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Assignment'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* Submissions View */}
      {showSubmissions && selectedAssignment ? (
        <div className="mb-8 bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
          <div className="p-4 bg-surface-50 dark:bg-surface-850 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-surface-900 dark:text-white">
              Submissions - {selectedAssignment.title}
            </h2>
            <button
              onClick={() => {
                setShowSubmissions(false);
                setSelectedAssignment(null);
              }}
              className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 border-b border-surface-200 dark:border-surface-700 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-50 dark:bg-surface-850 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Due Date
              </h3>
              <p className="text-lg font-medium text-surface-900 dark:text-white mt-1">
                {formatDate(selectedAssignment.due_date)}
              </p>
            </div>
            <div className="bg-surface-50 dark:bg-surface-850 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Total Submissions
              </h3>
              <p className="text-lg font-medium text-surface-900 dark:text-white mt-1">
                {selectedAssignment.submission_count} submissions
              </p>
            </div>
            <div className="bg-surface-50 dark:bg-surface-850 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Graded
              </h3>
              <p className="text-lg font-medium text-surface-900 dark:text-white mt-1">
                {selectedAssignment.graded_count} / {selectedAssignment.submission_count} submissions
              </p>
            </div>
          </div>
          
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                <thead className="bg-surface-50 dark:bg-surface-850">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                    >
                      Student
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                    >
                      Submitted
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                    >
                      Grade
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-surface-50 dark:hover:bg-surface-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-surface-200 dark:bg-surface-700">
                            {submission.student.avatar_url ? (
                              <img
                                src={submission.student.avatar_url}
                                alt={`${submission.student.first_name} ${submission.student.last_name}`}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-10 w-10 text-surface-500 dark:text-surface-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-surface-900 dark:text-white">
                              {submission.student.first_name} {submission.student.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1 text-surface-500 dark:text-surface-400" />
                          {formatDate(submission.submitted_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.is_graded ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300">
                            Graded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                        {submission.is_graded ? (
                          <span className="font-medium">
                            {submission.score} / {selectedAssignment.max_score}
                          </span>
                        ) : (
                          <span className="text-surface-500 dark:text-surface-400">
                            Not graded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowGradeForm(true);
                          }}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                        >
                          {submission.is_graded ? 'Update Grade' : 'Grade'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            // In a real app, you would open a modal or redirect to view the submission
                            toast.success('Viewing submission content');
                          }}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-surface-400 dark:text-surface-500" />
              <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
                No submissions yet
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                No students have submitted this assignment yet.
              </p>
            </div>
          )}
          
          {/* Grade Submission Form */}
          {showGradeForm && selectedSubmission && (
            <div className="border-t border-surface-200 dark:border-surface-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-surface-900 dark:text-white">
                  {selectedSubmission.is_graded ? 'Update Grade' : 'Grade Submission'}
                </h3>
                <button
                  onClick={() => {
                    setShowGradeForm(false);
                    setSelectedSubmission(null);
                  }}
                  className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6 bg-surface-50 dark:bg-surface-850 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-surface-900 dark:text-white mb-2">
                  Submission from {selectedSubmission.student.first_name} {selectedSubmission.student.last_name}
                </h4>
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedSubmission.content }} />
                </div>
                {selectedSubmission.attachment_url && (
                  <div className="mt-4">
                    <a
                      href={selectedSubmission.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-1" />
                      View Attachment
                    </a>
                  </div>
                )}
              </div>
              
              <Formik
                initialValues={{
                  score: selectedSubmission.score || 0,
                  feedback: selectedSubmission.feedback || '',
                }}
                validationSchema={gradeSchema}
                onSubmit={handleGradeSubmission}
              >
                {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-1">
                        <label
                          htmlFor="score"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Score
                        </label>
                        <div className="mt-1">
                          <Field
                            type="number"
                            name="score"
                            id="score"
                            min="0"
                            max={selectedAssignment.max_score}
                            className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                              errors.score && touched.score
                                ? 'border-error-300 dark:border-error-700'
                                : 'border-surface-300 dark:border-surface-700'
                            } rounded-md dark:bg-surface-800 dark:text-white`}
                          />
                          <ErrorMessage
                            name="score"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                        <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                          Out of {selectedAssignment.max_score} points
                        </p>
                      </div>

                      <div className="sm:col-span-5">
                        <label
                          htmlFor="feedback"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Feedback
                        </label>
                        <div className="mt-1">
                          <Field name="feedback">
                            {({ field }: any) => (
                              <ReactQuill
                                value={field.value}
                                onChange={(content) => setFieldValue('feedback', content)}
                                theme="snow"
                                className="bg-white dark:bg-surface-800 text-surface-900 dark:text-white rounded-md"
                              />
                            )}
                          </Field>
                          <ErrorMessage
                            name="feedback"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowGradeForm(false);
                          setSelectedSubmission(null);
                        }}
                        className="mr-3 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : (selectedSubmission.is_graded ? 'Update Grade' : 'Submit Grade')}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Assignments List */}
          {assignments.length > 0 ? (
            <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                  <thead className="bg-surface-50 dark:bg-surface-850">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                      >
                        Assignment
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                      >
                        Due Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                      >
                        Submissions
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-surface-50 dark:hover:bg-surface-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-surface-500 dark:text-surface-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-surface-900 dark:text-white">
                                {assignment.title}
                              </div>
                              <div className="text-sm text-surface-500 dark:text-surface-400">
                                Max score: {assignment.max_score} points
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                          {formatDate(assignment.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-surface-700 dark:text-surface-300">
                            {assignment.submission_count} submissions
                          </div>
                          <div className="text-sm text-surface-500 dark:text-surface-400">
                            {assignment.graded_count} graded
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleShowSubmissions(assignment)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                          >
                            Submissions
                          </button>
                          <button
                            onClick={() => {
                              // In a real app, you would navigate to edit or implement edit functionality
                              toast.success('Edit functionality would be implemented here');
                            }}
                            className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 mr-4"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-error-600 dark:text-error-400 hover:text-error-900 dark:hover:text-error-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-surface-400 dark:text-surface-500" />
                <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
                  No assignments yet
                </h3>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  Create your first assignment for this course.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Assignment
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssignmentManagement;