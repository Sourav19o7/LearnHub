import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
            <Logo />
            <p className="text-surface-500 dark:text-surface-400 text-sm mt-2">
              Learn at your own pace with expert-led courses
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 tracking-wider uppercase mb-4">
                Platform
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/courses" className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150">
                    Courses
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 tracking-wider uppercase mb-4">
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 tracking-wider uppercase mb-4">
                Connect
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-150"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-surface-200 dark:border-surface-800 pt-8 md:flex md:items-center md:justify-between">
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-surface-400 dark:text-surface-500">
              &copy; {currentYear} LearnHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;