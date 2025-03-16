import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="bg-white dark:bg-surface-900">
      {/* Hero Section */}
      <div className="relative bg-primary-700 dark:bg-primary-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-20"
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
            alt="Students"
          />
          <div className="absolute inset-0 bg-primary-700 dark:bg-primary-900 mix-blend-multiply" />
        </div>
        <div className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <h1 className="text-center text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            About LearnHub
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xl text-primary-100">
            Transforming the way people learn with technology and community.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-white dark:bg-surface-900">
        <div className="mx-auto max-w-7xl py-16 px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
                Our Mission
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-surface-600 dark:text-surface-300">
                At LearnHub, our mission is to create a global learning community where anyone, anywhere can access quality education, develop skills, and achieve their potential.
              </p>
              <div className="mt-8 overflow-hidden">
                <dl className="-mx-8 -mt-8 flex flex-wrap">
                  <div className="flex flex-col px-8 pt-8">
                    <dt className="order-2 text-base font-medium text-surface-600 dark:text-surface-400">
                      Students
                    </dt>
                    <dd className="order-1 text-2xl font-bold text-primary-600 dark:text-primary-400 sm:text-3xl">
                      25,000+
                    </dd>
                  </div>
                  <div className="flex flex-col px-8 pt-8">
                    <dt className="order-2 text-base font-medium text-surface-600 dark:text-surface-400">
                      Courses
                    </dt>
                    <dd className="order-1 text-2xl font-bold text-primary-600 dark:text-primary-400 sm:text-3xl">
                      500+
                    </dd>
                  </div>
                  <div className="flex flex-col px-8 pt-8">
                    <dt className="order-2 text-base font-medium text-surface-600 dark:text-surface-400">
                      Instructors
                    </dt>
                    <dd className="order-1 text-2xl font-bold text-primary-600 dark:text-primary-400 sm:text-3xl">
                      100+
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:pl-8">
              <div className="aspect-w-5 aspect-h-3 overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
                <img
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                  alt="Team collaboration"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-surface-50 dark:bg-surface-800">
        <div className="mx-auto max-w-7xl py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              Our Story
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-surface-600 dark:text-surface-300">
              LearnHub was founded in 2022 with a simple idea: education should be accessible, engaging, and tailored to the modern learner. Our platform began as a small project with a handful of courses and has since grown into a thriving ecosystem of learners and educators.
            </p>
            <p className="mt-4 max-w-3xl text-lg text-surface-600 dark:text-surface-300">
              Today, we're proud to offer hundreds of courses across diverse subjects, taught by industry experts and educators who are passionate about sharing their knowledge. Our community continues to grow, driven by our commitment to innovation, quality, and the transformative power of education.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              Our Values
            </h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-white dark:bg-surface-900 p-6 shadow-md dark:shadow-dark-md">
                <h3 className="text-xl font-medium text-surface-900 dark:text-white">Accessibility</h3>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  We believe quality education should be available to everyone, regardless of location or background.
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-surface-900 p-6 shadow-md dark:shadow-dark-md">
                <h3 className="text-xl font-medium text-surface-900 dark:text-white">Innovation</h3>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  We continuously evolve our platform to enhance the learning experience through technology.
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-surface-900 p-6 shadow-md dark:shadow-dark-md">
                <h3 className="text-xl font-medium text-surface-900 dark:text-white">Community</h3>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  We foster meaningful connections between students and instructors to enrich the learning journey.
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-surface-900 p-6 shadow-md dark:shadow-dark-md">
                <h3 className="text-xl font-medium text-surface-900 dark:text-white">Excellence</h3>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  We uphold high standards for our content and platform to ensure the best learning outcomes.
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-surface-900 p-6 shadow-md dark:shadow-dark-md">
                <h3 className="text-xl font-medium text-surface-900 dark:text-white">Inclusion</h3>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  We embrace diversity and create an environment where everyone feels welcomed and valued.
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-surface-900 p-6 shadow-md dark:shadow-dark-md">
                <h3 className="text-xl font-medium text-surface-900 dark:text-white">Growth</h3>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  We champion lifelong learning and personal development for both our users and our team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white dark:bg-surface-900">
        <div className="mx-auto max-w-7xl py-16 px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              Meet Our Team
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-surface-600 dark:text-surface-300">
              Our diverse team brings together expertise in education, technology, and design to create the best learning experience possible.
            </p>

            <ul className="grid gap-8 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3">
              {[
                {
                  name: 'Emma Rodriguez',
                  role: 'CEO & Co-Founder',
                  imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                },
                {
                  name: 'Michael Chen',
                  role: 'CTO & Co-Founder',
                  imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                },
                {
                  name: 'Ava Johnson',
                  role: 'Head of Content',
                  imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                },
                {
                  name: 'David Kim',
                  role: 'Lead Developer',
                  imageUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                },
                {
                  name: 'Sofia Patel',
                  role: 'UX Designer',
                  imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                },
                {
                  name: 'James Wilson',
                  role: 'Community Manager',
                  imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                },
              ].map((person) => (
                <li key={person.name}>
                  <div className="flex items-center space-x-4 lg:space-x-6">
                    <img
                      className="h-16 w-16 rounded-full lg:h-20 lg:w-20 object-cover"
                      src={person.imageUrl}
                      alt=""
                    />
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium text-surface-900 dark:text-white">
                        {person.name}
                      </h3>
                      <p className="text-surface-600 dark:text-surface-400">{person.role}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700 dark:bg-primary-900">
        <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:flex lg:items-center lg:justify-between lg:py-16 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start learning?</span>
            <span className="block text-primary-200">Join our community today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-primary-600 hover:bg-primary-50"
              >
                Sign up for free
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-5 py-3 text-base font-medium text-white hover:bg-primary-700"
              >
                Explore courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;