import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const ContactSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  subject: Yup.string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters'),
  message: Yup.string()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters'),
});

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any, { resetForm }: any) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Message sent successfully! We will get back to you soon.');
      resetForm();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-surface-900">
      {/* Header */}
      <div className="bg-primary-700 dark:bg-primary-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-primary-100">
            Have questions, feedback, or need assistance? We're here to help.
          </p>
        </div>
      </div>

      {/* Contact content */}
      <div className="mx-auto max-w-7xl py-16 px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Contact information */}
          <div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
              Get in touch
            </h2>
            <p className="mt-3 text-lg text-surface-600 dark:text-surface-300">
              Our team is ready to assist you with any questions about our platform, courses, or how to get started.
            </p>
            <dl className="mt-8 space-y-6">
              <dt>
                <span className="sr-only">Email</span>
              </dt>
              <dd className="flex text-base text-surface-600 dark:text-surface-300">
                <EnvelopeIcon
                  className="h-6 w-6 flex-shrink-0 text-primary-500 dark:text-primary-400"
                  aria-hidden="true"
                />
                <span className="ml-3">support@learnhub.example.com</span>
              </dd>
              <dt>
                <span className="sr-only">Phone number</span>
              </dt>
              <dd className="flex text-base text-surface-600 dark:text-surface-300">
                <PhoneIcon
                  className="h-6 w-6 flex-shrink-0 text-primary-500 dark:text-primary-400"
                  aria-hidden="true"
                />
                <span className="ml-3">+1 (555) 123-4567</span>
              </dd>
              <dt>
                <span className="sr-only">Address</span>
              </dt>
              <dd className="flex text-base text-surface-600 dark:text-surface-300">
                <MapPinIcon
                  className="h-6 w-6 flex-shrink-0 text-primary-500 dark:text-primary-400"
                  aria-hidden="true"
                />
                <span className="ml-3">
                  123 Learning Lane<br />
                  Suite 200<br />
                  San Francisco, CA 94107
                </span>
              </dd>
            </dl>
            <p className="mt-6 text-base text-surface-600 dark:text-surface-300">
              <strong className="font-semibold text-surface-900 dark:text-white">Looking to teach?</strong>{' '}
              <a href="/teach" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                Apply to become an instructor
              </a>
            </p>
          </div>

          {/* Contact form */}
          <div className="mt-12 lg:col-span-2 lg:mt-0">
            <div className="card">
              <h3 className="text-lg font-medium text-surface-900 dark:text-white">
                Send us a message
              </h3>
              <div className="mt-5">
                <Formik
                  initialValues={{
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                  }}
                  validationSchema={ContactSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched }) => (
                    <Form className="grid grid-cols-1 gap-y-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Name
                        </label>
                        <div className="mt-1">
                          <Field
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            className={`block w-full rounded-md border ${
                              errors.name && touched.name
                                ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                                : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                            } py-3 px-4 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 dark:bg-surface-800 dark:text-white`}
                          />
                          <ErrorMessage
                            name="name"
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
                            autoComplete="email"
                            className={`block w-full rounded-md border ${
                              errors.email && touched.email
                                ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                                : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                            } py-3 px-4 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 dark:bg-surface-800 dark:text-white`}
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
                          htmlFor="subject"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Subject
                        </label>
                        <div className="mt-1">
                          <Field
                            id="subject"
                            name="subject"
                            type="text"
                            className={`block w-full rounded-md border ${
                              errors.subject && touched.subject
                                ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                                : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                            } py-3 px-4 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 dark:bg-surface-800 dark:text-white`}
                          />
                          <ErrorMessage
                            name="subject"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                          Message
                        </label>
                        <div className="mt-1">
                          <Field
                            id="message"
                            name="message"
                            as="textarea"
                            rows={4}
                            className={`block w-full rounded-md border ${
                              errors.message && touched.message
                                ? 'border-error-300 dark:border-error-700 focus:ring-error-500 dark:focus:ring-error-400'
                                : 'border-surface-300 dark:border-surface-700 focus:ring-primary-500 dark:focus:ring-primary-400'
                            } py-3 px-4 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 dark:bg-surface-800 dark:text-white`}
                          />
                          <ErrorMessage
                            name="message"
                            component="p"
                            className="mt-2 text-sm text-error-600 dark:text-error-400"
                          />
                        </div>
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-filled px-6 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-surface-50 dark:bg-surface-800">
        <div className="mx-auto max-w-7xl py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-base text-surface-600 dark:text-surface-300">
                Can't find the answer you're looking for? Contact our support team for assistance.
              </p>
            </div>
            <div className="mt-12 lg:col-span-2 lg:mt-0">
              <dl className="space-y-6">
                {[
                  {
                    question: 'How do I enroll in a course?',
                    answer:
                      'To enroll in a course, browse our course catalog, select the course you\'re interested in, and click the "Enroll" button. If it\'s a free course, you\'ll get immediate access. For paid courses, you\'ll be directed to complete the payment process.',
                  },
                  {
                    question: 'Can I access courses on mobile devices?',
                    answer:
                      'Yes, our platform is fully responsive and works on all mobile devices. You can access your courses on smartphones and tablets through your web browser.',
                  },
                  {
                    question: 'How do I get a certificate after completing a course?',
                    answer:
                      'Once you\'ve completed all required lessons and assignments for a course, a certificate will automatically be generated and added to your profile. You can download and share your certificates at any time.',
                  },
                  {
                    question: 'What payment methods do you accept?',
                    answer:
                      'We accept major credit cards (Visa, MasterCard, American Express), PayPal, and various local payment methods depending on your region.',
                  },
                  {
                    question: 'Can I get a refund if I\'m not satisfied with a course?',
                    answer:
                      'Yes, we offer a 30-day money-back guarantee for most courses. If you\'re not satisfied with your purchase, you can request a refund within 30 days of enrollment.',
                  },
                ].map((faq) => (
                  <div key={faq.question}>
                    <dt className="text-lg font-medium text-surface-900 dark:text-white">
                      {faq.question}
                    </dt>
                    <dd className="mt-2 text-base text-surface-600 dark:text-surface-300">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;