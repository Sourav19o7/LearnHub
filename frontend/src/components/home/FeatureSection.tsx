import {
    AcademicCapIcon,
    UserGroupIcon,
    ClockIcon,
    DevicePhoneMobileIcon,
    DocumentCheckIcon,  // Changed from CertificateIcon
    CursorArrowRaysIcon,
  } from '@heroicons/react/24/outline';
  
  const features = [
    {
      name: 'Expert instructors',
      description:
        'Learn from industry experts who are passionate about teaching and sharing their knowledge.',
      icon: AcademicCapIcon,
    },
    {
      name: 'Interactive community',
      description:
        'Connect with other learners, share ideas, and collaborate on projects in our thriving community.',
      icon: UserGroupIcon,
    },
    {
      name: 'Learn at your own pace',
      description:
        'Access course content anytime and progress through the material at a pace that works for you.',
      icon: ClockIcon,
    },
    {
      name: 'Mobile learning',
      description:
        'Learn on the go with our mobile-friendly platform. Study anywhere, anytime.',
      icon: DevicePhoneMobileIcon,
    },
    {
      name: 'Certification',
      description:
        'Earn certificates upon course completion to showcase your skills and knowledge to employers.',
      icon: DocumentCheckIcon,  // Changed from CertificateIcon
    },
    {
      name: 'Hands-on exercises',
      description:
        'Apply what you learn through practical exercises, quizzes, and real-world projects.',
      icon: CursorArrowRaysIcon,
    },
  ];
  
  const FeatureSection = () => {
    return (
      <div className="py-12 bg-gray-50 dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 dark:text-primary-400 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              A better way to learn
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              Our platform offers a comprehensive and flexible learning experience
              designed to help you achieve your goals.
            </p>
          </div>
  
          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {feature.name}
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    );
  };
  
  export default FeatureSection;