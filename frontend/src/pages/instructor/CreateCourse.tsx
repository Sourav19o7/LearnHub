import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import {
  ArrowLeftIcon,
  PlusCircleIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CourseFormValues } from '@/types';

const courseCategories = [
  { value: 'programming', label: 'Programming & Development' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'photography', label: 'Photography & Video' },
  { value: 'music', label: 'Music' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'language', label: 'Language Learning' },
  { value: 'science', label: 'Science & Math' },
  { value: 'personal-development', label: 'Personal Development' },
];

const difficultyLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const initialValues: CourseFormValues = {
  title: '',
  description: '',
  category: '',
  difficulty_level: 'beginner',
  price: 0,
  duration_weeks: 4,
  is_published: false,
  cover_image: null,
  sections: [
    {
      id : '',
      title: 'Getting Started',
      lessons: [
        {
          id : '',
          title: 'Introduction',
          content: '',
          video_url: '',
          is_preview: true,
        },
      ],
    },
  ],
};

const courseSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  category: Yup.string().required('Category is required'),
  difficulty_level: Yup.string().required('Difficulty level is required'),
  price: Yup.number()
    .min(0, 'Price must be non-negative')
    .required('Price is required'),
  duration_weeks: Yup.number()
    .min(1, 'Duration must be at least 1 week')
    .required('Duration is required'),
  sections: Yup.array()
    .of(
      Yup.object().shape({
        title: Yup.string().required('Section title is required'),
        lessons: Yup.array().of(
          Yup.object().shape({
            title: Yup.string().required('Lesson title is required'),
            content: Yup.string().required('Lesson content is required'),
          })
        ),
      })
    )
    .min(1, 'At least one section is required'),
});

const CreateCourse = () => {
  const navigate = useNavigate();
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (values: CourseFormValues, { setSubmitting }: any) => {
    try {
      console.log("Title", values.title)
      // First create the basic course without the nested sections/lessons
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('category', values.category);
      formData.append('difficulty_level', values.difficulty_level);
      formData.append('price', values.price.toString());
      formData.append('duration_weeks', values.duration_weeks.toString());
      formData.append('is_published', values.is_published.toString());
      
      if (values.cover_image) {
        formData.append('cover_image', values.cover_image);
      }

      // Create the course first
      const courseResponse = await api.post('/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (!courseResponse.data.success) {
        throw new Error('Failed to create course');
      }
  
      console.log("Course Response", courseResponse)
      const courseId = courseResponse.data.data.id;

      console.log("Course Id", courseId)
  
      // Then create each section and its lessons
      for (const section of values.sections) {
        const sectionResponse = await api.post(`/courses/${courseId}/sections`, {
          title: section.title,
        });
  
        if (!sectionResponse.data.success) {
          throw new Error('Failed to create section');
        }
  
        const sectionId = sectionResponse.data.data.id;
  
        // Create lessons for this section
        for (const lesson of section.lessons) {
          await api.post(`/courses/${courseId}/sections/${sectionId}/lessons`, {
            title: lesson.title,
            content: lesson.content,
            video_url: lesson.video_url || '',
            is_preview: lesson.is_preview,
          });
        }
      }
  
      toast.success('Course created successfully!');
      navigate('/instructor/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCoverImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setFieldValue('cover_image', file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCoverImage = (
    setFieldValue: (field: string, value: any) => void
  ) => {
    setFieldValue('cover_image', null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/instructor/courses')}
          className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Create New Course
        </h1>
      </div>

      <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
        <Formik
          initialValues={initialValues}
          validationSchema={courseSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="p-6 space-y-8">
              {/* Course Information */}
              <div>
                <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
                  Course Information
                </h2>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                    >
                      Course Title
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

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                    >
                      Category
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="category"
                        id="category"
                        className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                          errors.category && touched.category
                            ? 'border-error-300 dark:border-error-700'
                            : 'border-surface-300 dark:border-surface-700'
                        } rounded-md dark:bg-surface-800 dark:text-white`}
                      >
                        <option value="">Select a category</option>
                        {courseCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage
                        name="category"
                        component="p"
                        className="mt-2 text-sm text-error-600 dark:text-error-400"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="difficulty_level"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                    >
                      Difficulty Level
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="difficulty_level"
                        id="difficulty_level"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-surface-300 dark:border-surface-700 rounded-md dark:bg-surface-800 dark:text-white"
                      >
                        {difficultyLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </Field>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                    >
                      Price ($ USD)
                    </label>
                    <div className="mt-1">
                      <Field
                        type="number"
                        name="price"
                        id="price"
                        min="0"
                        step="0.01"
                        className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                          errors.price && touched.price
                            ? 'border-error-300 dark:border-error-700'
                            : 'border-surface-300 dark:border-surface-700'
                        } rounded-md dark:bg-surface-800 dark:text-white`}
                      />
                      <ErrorMessage
                        name="price"
                        component="p"
                        className="mt-2 text-sm text-error-600 dark:text-error-400"
                      />
                    </div>
                    <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
                      Set to 0 for a free course
                    </p>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="duration_weeks"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                    >
                      Duration (weeks)
                    </label>
                    <div className="mt-1">
                      <Field
                        type="number"
                        name="duration_weeks"
                        id="duration_weeks"
                        min="1"
                        className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                          errors.duration_weeks && touched.duration_weeks
                            ? 'border-error-300 dark:border-error-700'
                            : 'border-surface-300 dark:border-surface-700'
                        } rounded-md dark:bg-surface-800 dark:text-white`}
                      />
                      <ErrorMessage
                        name="duration_weeks"
                        component="p"
                        className="mt-2 text-sm text-error-600 dark:text-error-400"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                    >
                      Course Description
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

                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                      Cover Image
                    </label>
                    <div className="mt-1 flex items-center">
                      {coverImagePreview ? (
                        <div className="relative">
                          <img
                            src={coverImagePreview}
                            alt="Cover preview"
                            className="h-32 w-auto object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCoverImage(setFieldValue)}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-error-500 text-white p-1 rounded-full hover:bg-error-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="h-32 w-48 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-md flex items-center justify-center text-surface-500 dark:text-surface-400 hover:border-primary-500 dark:hover:border-primary-400 cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="text-center">
                            <PhotoIcon className="h-12 w-12 mx-auto" />
                            <p className="mt-2 text-xs">Upload Cover Image</p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCoverImageChange(e, setFieldValue)}
                      />
                    </div>
                    <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
                      Recommended size: 1280x720 pixels (16:9 ratio)
                    </p>
                  </div>

                  <div className="sm:col-span-6">
                    <div className="flex items-center">
                      <Field
                        type="checkbox"
                        name="is_published"
                        id="is_published"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 dark:border-surface-700 rounded dark:bg-surface-800"
                      />
                      <label
                        htmlFor="is_published"
                        className="ml-2 block text-sm text-surface-700 dark:text-surface-300"
                      >
                        Publish course immediately (students can enroll)
                      </label>
                    </div>
                    <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
                      If unchecked, the course will be saved as a draft
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Content */}
              <div>
                <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-4">
                  Course Content
                </h2>

                <FieldArray name="sections">
                  {({ push: pushSection, remove: removeSection }) => (
                    <div className="space-y-6">
                      {values.sections.map((section, sectionIndex) => (
                        <div
                          key={sectionIndex}
                          className="border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden"
                        >
                          <div className="bg-surface-50 dark:bg-surface-850 p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <Field
                                name={`sections.${sectionIndex}.title`}
                                type="text"
                                placeholder="Section Title"
                                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                                  errors.sections && 
                                  Array.isArray(errors.sections) === false &&
                                  typeof errors.sections === 'object' && 
                                  errors.sections[sectionIndex] &&
                                  typeof errors.sections[sectionIndex] !== 'string' &&
                                  (errors.sections[sectionIndex] as any).title &&
                                  touched.sections?.[sectionIndex]?.title
                                    ? 'border-error-300 dark:border-error-700'
                                    : 'border-surface-300 dark:border-surface-700'
                                } rounded-md dark:bg-surface-800 dark:text-white`}
                              />
                              <ErrorMessage
                                name={`sections.${sectionIndex}.title`}
                                component="p"
                                className="mt-2 text-sm text-error-600 dark:text-error-400"
                              />
                            </div>
                            
                            {sectionIndex > 0 && (
                              <button
                                type="button"
                                onClick={() => removeSection(sectionIndex)}
                                className="ml-4 text-error-600 dark:text-error-400 hover:text-error-900 dark:hover:text-error-300"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>

                          <div className="p-4">
                            <FieldArray name={`sections.${sectionIndex}.lessons`}>
                              {({ push: pushLesson, remove: removeLesson }) => (
                                <div className="space-y-4">
                                  {section.lessons.map((lesson, lessonIndex) => (
                                    <div
                                      key={lessonIndex}
                                      className="border border-surface-200 dark:border-surface-700 rounded-md p-4"
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-medium text-surface-900 dark:text-white">
                                          Lesson {lessonIndex + 1}
                                        </h4>
                                        {section.lessons.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeLesson(lessonIndex)}
                                            className="text-error-600 dark:text-error-400 hover:text-error-900 dark:hover:text-error-300"
                                          >
                                            <TrashIcon className="h-5 w-5" />
                                          </button>
                                        )}
                                      </div>

                                      <div className="space-y-4">
                                        <div>
                                          <label
                                            htmlFor={`sections.${sectionIndex}.lessons.${lessonIndex}.title`}
                                            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                                          >
                                            Lesson Title
                                          </label>
                                          <div className="mt-1">
                                            <Field
                                              type="text"
                                              name={`sections.${sectionIndex}.lessons.${lessonIndex}.title`}
                                              id={`sections.${sectionIndex}.lessons.${lessonIndex}.title`}
                                              className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border ${
                                                errors.sections && 
                                                Array.isArray(errors.sections) === false &&
                                                typeof errors.sections === 'object' && 
                                                errors.sections[sectionIndex] &&
                                                typeof errors.sections[sectionIndex] !== 'string' &&
                                                (errors.sections[sectionIndex] as any).lessons && 
                                                (errors.sections[sectionIndex] as any).lessons[lessonIndex] &&
                                                typeof (errors.sections[sectionIndex] as any).lessons[lessonIndex] !== 'string' &&
                                                (errors.sections[sectionIndex] as any).lessons[lessonIndex].title &&
                                                touched.sections?.[sectionIndex]?.lessons?.[lessonIndex]?.title
                                                  ? 'border-error-300 dark:border-error-700'
                                                  : 'border-surface-300 dark:border-surface-700'
                                              } rounded-md dark:bg-surface-800 dark:text-white`}
                                            />
                                            <ErrorMessage
                                              name={`sections.${sectionIndex}.lessons.${lessonIndex}.title`}
                                              component="p"
                                              className="mt-2 text-sm text-error-600 dark:text-error-400"
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <label
                                            htmlFor={`sections.${sectionIndex}.lessons.${lessonIndex}.content`}
                                            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                                          >
                                            Lesson Content
                                          </label>
                                          <div className="mt-1">
                                            <Field name={`sections.${sectionIndex}.lessons.${lessonIndex}.content`}>
                                              {({ field }: any) => (
                                                <ReactQuill
                                                  value={field.value}
                                                  onChange={(content) =>
                                                    setFieldValue(
                                                      `sections.${sectionIndex}.lessons.${lessonIndex}.content`,
                                                      content
                                                    )
                                                  }
                                                  theme="snow"
                                                  className="bg-white dark:bg-surface-800 text-surface-900 dark:text-white rounded-md"
                                                />
                                              )}
                                            </Field>
                                            <ErrorMessage
                                              name={`sections.${sectionIndex}.lessons.${lessonIndex}.content`}
                                              component="p"
                                              className="mt-2 text-sm text-error-600 dark:text-error-400"
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <label
                                            htmlFor={`sections.${sectionIndex}.lessons.${lessonIndex}.video_url`}
                                            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                                          >
                                            Video URL (optional)
                                          </label>
                                          <div className="mt-1">
                                            <Field
                                              type="text"
                                              name={`sections.${sectionIndex}.lessons.${lessonIndex}.video_url`}
                                              id={`sections.${sectionIndex}.lessons.${lessonIndex}.video_url`}
                                              placeholder="e.g., https://www.youtube.com/embed/VIDEO_ID"
                                              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-surface-300 dark:border-surface-700 rounded-md dark:bg-surface-800 dark:text-white"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex items-center">
                                          <Field
                                            type="checkbox"
                                            name={`sections.${sectionIndex}.lessons.${lessonIndex}.is_preview`}
                                            id={`sections.${sectionIndex}.lessons.${lessonIndex}.is_preview`}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 dark:border-surface-700 rounded dark:bg-surface-800"
                                          />
                                          <label
                                            htmlFor={`sections.${sectionIndex}.lessons.${lessonIndex}.is_preview`}
                                            className="ml-2 block text-sm text-surface-700 dark:text-surface-300"
                                          >
                                            Make this lesson available as a free preview
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  <div className="mt-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        pushLesson({
                                          title: '',
                                          content: '',
                                          video_url: '',
                                          is_preview: false,
                                        })
                                      }
                                      className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                                    >
                                      <PlusCircleIcon className="h-5 w-5 mr-1" />
                                      Add Lesson
                                    </button>
                                  </div>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        </div>
                      ))}

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() =>
                            pushSection({
                              title: '',
                              lessons: [
                                {
                                  title: '',
                                  content: '',
                                  video_url: '',
                                  is_preview: false,
                                },
                              ],
                            })
                          }
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <PlusCircleIcon className="h-5 w-5 mr-1" />
                          Add Section
                        </button>
                      </div>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 border-t border-surface-200 dark:border-surface-700 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/instructor/courses')}
                  className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CreateCourse;