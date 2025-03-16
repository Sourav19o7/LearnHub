import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  DocumentCheckIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Assignment {
  id: string;
  title: string;
  description: string;
  course_id: string;
  course: {
    id: string;
    title: string;
  };
  due_date: string;
  max_score: number;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  feedback?: string;
  submission?: {
    id: string;
    content: string;
    submitted_at: string;
    attachment_url?: string;
  };
}

const AssignmentDetails = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch assignment details
  const { data, isLoading, error } = useQuery(
    ['assignment', assignmentId],
    async () => {
      const response = await api.get(`/assignments/${assignmentId}`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // If the assignment has a submission, set the content to the submission content
        if (data?.data?.submission?.content) {
          setContent(data.data.submission.content);
        }
      }
    }
  );

  const assignment: Assignment = data?.data;

  // Submit assignment mutation
  const submitAssignment = useMutation(
    async () => {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('content', content);
      if (file) {
        formData.append('attachment', file);
      }
      
      return await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    {
      onSuccess: () => {
        toast.success('Assignment submitted successfully!');
        queryClient.invalidateQueries(['assignment', assignmentId]);
        queryClient.invalidateQueries(['assignments']);
      },
      onError: () => {
        toast.error('Failed to submit assignment. Please try again.');
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    }
  );

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file remove
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !file) {
      toast.error('Please provide either text content or upload a file');
      return;
    }
    
    submitAssignment.mutate();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if assignment is overdue
  const isOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return now > due;
  };

  if (isLoading) return <LoadingScreen />;

  if (error || !assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Assignment Not Found
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            The assignment you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            to="/dashboard/assignments"
            className="inline-flex items-center btn-filled"
          >
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/dashboard/assignments"
          className="inline-flex items-center text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Assignments
        </Link>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-lg shadow-sm dark:shadow-dark-sm overflow-hidden">
        {/* Assignment header */}
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <div className="flex flex-wrap justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                {assignment.title}
              </h1>
              <div className="mt-2 flex items-center">
                <Link 
                  to={`/dashboard/courses/${assignment.course.id}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {assignment.course.title}
                </Link>
                <span 
                  className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${assignment.status === 'pending' 
                      ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300' 
                      : assignment.status === 'submitted'
                      ? 'bg-info-100 text-info-800 dark:bg-info-900/50 dark:text-info-300'
                      : 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300'
                    }`
                  }
                >
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 text-right">
              <div className="flex items-center justify-end text-sm text-surface-600 dark:text-surface-400">
                <ClockIcon className="h-5 w-5 mr-1.5 text-surface-500 dark:text-surface-400" />
                <span className={isOverdue(assignment.due_date) && assignment.status === 'pending' ? 'text-error-600 dark:text-error-400' : ''}>
                  Due: {formatDate(assignment.due_date)}
                </span>
              </div>
              
              {isOverdue(assignment.due_date) && assignment.status === 'pending' && (
                <div className="flex items-center justify-end text-sm text-error-600 dark:text-error-400 mt-1">
                  <ExclamationCircleIcon className="h-4 w-4 mr-0.5" />
                  Overdue
                </div>
              )}
              
              <div className="flex items-center justify-end text-sm text-surface-600 dark:text-surface-400 mt-1">
                <DocumentTextIcon className="h-5 w-5 mr-1.5 text-surface-500 dark:text-surface-400" />
                <span>Max Score: {assignment.max_score} points</span>
              </div>
              
              {assignment.status === 'graded' && (
                <div className="flex items-center justify-end text-sm text-success-600 dark:text-success-400 mt-1">
                  <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                  <span>Score: {assignment.score} / {assignment.max_score}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignment description */}
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
            Instructions
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
          </div>
        </div>

        {/* Assignment submission or feedback */}
        {assignment.status === 'graded' ? (
          <div className="p-6">
            <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
              Submission & Feedback
            </h2>
            
            {assignment.submission && (
              <div className="mb-6 bg-surface-50 dark:bg-surface-700 p-4 rounded-lg">
                <h3 className="text-md font-medium text-surface-900 dark:text-white mb-2">
                  Your Submission ({formatDate(assignment.submission.submitted_at)})
                </h3>
                
                <div className="prose dark:prose-invert max-w-none mb-4">
                  <p>{assignment.submission.content}</p>
                </div>

                {assignment.submission.attachment_url && (
                  <div className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                    <PaperClipIcon className="h-5 w-5 mr-1.5" />
                    <a 
                      href={assignment.submission.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      View Attachment
                    </a>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg">
              <h3 className="text-md font-medium text-success-900 dark:text-success-200 mb-2 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-1.5 text-success-500 dark:text-success-400" />
                Instructor Feedback
              </h3>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-success-800 dark:text-success-300">
                  {assignment.feedback || "No written feedback provided."}
                </p>
              </div>
              
              <div className="mt-4 text-success-800 dark:text-success-300">
                <span className="font-medium">Score:</span> {assignment.score} / {assignment.max_score} points
              </div>
            </div>
          </div>
        ) : assignment.status === 'submitted' ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white">
                Your Submission
              </h2>
              
              <div className="flex items-center text-info-600 dark:text-info-400">
                <DocumentCheckIcon className="h-5 w-5 mr-1.5" />
                <span>Submitted on {formatDate(assignment.submission?.submitted_at || '')}</span>
              </div>
            </div>
            
            <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg mb-6">
              <div className="prose dark:prose-invert max-w-none mb-4">
                <p>{assignment.submission?.content}</p>
              </div>
              
              {assignment.submission?.attachment_url && (
                <div className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                  <PaperClipIcon className="h-5 w-5 mr-1.5" />
                  <a 
                    href={assignment.submission.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </div>
            
            <div className="text-center p-4 border border-info-200 dark:border-info-800 rounded-lg bg-info-50 dark:bg-info-900/20">
              <p className="text-info-800 dark:text-info-300">
                Your submission is awaiting grading. You'll be notified when feedback is available.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
                Submit Your Assignment
              </h2>
              
              <div className="mb-4">
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  Assignment Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-surface-300 dark:border-surface-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-surface-800 dark:text-white"
                  placeholder="Write your assignment here..."
                />
              </div>
              
              <div className="mb-6">
                <label
                  htmlFor="attachment"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  Attachment (optional)
                </label>
                
                <div className="mt-1 flex items-center">
                  <span className="inline-block h-12 w-12 overflow-hidden rounded-md bg-surface-100 dark:bg-surface-700">
                    <PaperClipIcon className="h-full w-full text-surface-500 dark:text-surface-400" />
                  </span>
                  
                  <div className="ml-5 flex-grow">
                    {file ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-surface-900 dark:text-white">
                            {file.name}
                          </div>
                          <div className="text-xs text-surface-500 dark:text-surface-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="ml-4 text-sm font-medium text-error-600 dark:text-error-400 hover:text-error-500 dark:hover:text-error-300"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex text-sm">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1 text-surface-500 dark:text-surface-400">or drag and drop</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || (!content.trim() && !file)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-5 w-5 mr-1.5" />
                      Submit Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetails;