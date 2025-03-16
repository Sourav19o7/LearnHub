import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = 'h-8 w-auto' }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-full w-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          fill={isDark ? "#64b5f6" : "#1976d2"}
        />
        <path
          d="M2 17L12 22L22 17"
          stroke={isDark ? "#64b5f6" : "#1976d2"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke={isDark ? "#64b5f6" : "#1976d2"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="ml-2 text-xl font-bold text-surface-900 dark:text-white">LearnHub</span>
    </div>
  );
};

export default Logo;