import { useState } from 'react';

const testimonials = [
  {
    id: 1,
    content:
      'I have completed several courses on LearnHub, and each one has been exceptional. The instructors are knowledgeable, the content is comprehensive, and the platform is user-friendly.',
    author: {
      name: 'Sarah Johnson',
      role: 'Software Developer',
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  {
    id: 2,
    content:
      'LearnHub has transformed my career. I was able to transition from a different field into tech thanks to the quality courses and the support from the community.',
    author: {
      name: 'Marcus Chen',
      role: 'Data Analyst',
      image:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  {
    id: 3,
    content:
      'What sets LearnHub apart is the practical, hands-on approach. The projects and exercises helped me apply what I learned immediately to my work.',
    author: {
      name: 'Emily Rodriguez',
      role: 'UI/UX Designer',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  {
    id: 4,
    content:
      'I appreciate the flexibility of LearnHub. As a working professional, I can learn at my own pace and fit courses into my busy schedule.',
    author: {
      name: 'David Thompson',
      role: 'Product Manager',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
];

const Testimonials = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  return (
    <section className="py-12 bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our Students Say
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Join thousands of satisfied learners who have transformed their skills and careers with LearnHub.
            </p>
          </div>

          <div className="mt-12 max-w-lg mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8 sm:px-10 sm:py-10">
                <div 
                  key={testimonials[activeTestimonial].id}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <img
                      className="h-16 w-16 rounded-full"
                      src={testimonials[activeTestimonial].author.image}
                      alt={testimonials[activeTestimonial].author.name}
                    />
                    <span className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-1">
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <blockquote className="mt-6 text-center text-gray-800">
                    <p className="text-lg italic">"{testimonials[activeTestimonial].content}"</p>
                  </blockquote>
                  <div className="mt-4 font-medium text-gray-900">
                    {testimonials[activeTestimonial].author.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonials[activeTestimonial].author.role}
                  </div>
                </div>
              </div>

              <div className="flex border-t border-gray-200 divide-x divide-gray-200">
                <button
                  onClick={prevTestimonial}
                  className="flex-1 py-4 text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={nextTestimonial}
                  className="flex-1 py-4 text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center"
                >
                  Next
                  <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-3">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`h-2 w-2 rounded-full focus:outline-none ${
                    idx === activeTestimonial ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                  onClick={() => setActiveTestimonial(idx)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;