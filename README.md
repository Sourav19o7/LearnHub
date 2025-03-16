# LearnHub - Modern Learning Platform

LearnHub is a comprehensive, scalable online learning platform where users can upload and access courses with study plans, assignments, and materials. It features a modern Material Design interface with both light and dark themes.

![LearnHub Logo](frontend/public/logo192.png)

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Backend](#backend)
- [Frontend](#frontend)
- [Database](#database)
- [Deployment](#deployment)
- [Authentication & Authorization](#authentication--authorization)
- [Design System](#design-system)
- [Contributing](#contributing)
- [License](#license)

## Architecture Overview

LearnHub follows a modern architecture with these key components:

- **Frontend**: React Single Page Application (SPA) with TypeScript
- **Backend**: Node.js REST API with Express and TypeScript
- **Database**: PostgreSQL managed through Supabase
- **Authentication**: JWT-based auth through Supabase Auth
- **Storage**: File storage through Supabase Storage
- **Deployment**: Backend on Render, Frontend on Vercel/Netlify

The architecture is designed for scalability, maintainability, and developer experience.

## Technology Stack

### Backend
- Node.js with Express
- TypeScript for type safety
- Supabase client for database access
- JWT authentication
- Winston for logging
- Joi for validation

### Frontend
- React 18+ with functional components and hooks
- TypeScript for type safety
- React Router for navigation
- React Query for data fetching and caching
- Tailwind CSS for styling
- Material Design principles
- Formik & Yup for form handling
- Context API for state management
- Lexend font family for improved readability

### Database & Services
- PostgreSQL (via Supabase)
- Supabase Auth for authentication
- Supabase Storage for files
- Row Level Security for data protection

## Features

### User Roles & Permissions
- **Students**: Can enroll in courses, track progress, submit assignments
- **Instructors**: Can create and manage courses, grade assignments
- **Administrators**: Full platform management capabilities

### Core Functionality
- User authentication and profile management
- Course creation and management
- Rich content lessons with text, video, and code
- Assignment submission and grading
- Study material management
- Progress tracking
- Enrollment management
- Course reviews and ratings
- Dark mode and theming

## Project Structure

```
learning-platform/
│
├── frontend/                     # React frontend application
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── assets/               # Images, fonts, etc.
│   │   ├── components/           # Reusable UI components
│   │   │   ├── common/           # Common components like buttons, inputs
│   │   │   ├── layout/           # Layout components
│   │   │   └── course/           # Course-specific components
│   │   ├── context/              # React context providers
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Page components
│   │   ├── services/             # API services
│   │   ├── styles/               # Global styles
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Utility functions
│   │   ├── App.tsx               # Main App component
│   │   ├── index.tsx             # Entry point
│   │   └── routes.tsx            # Application routes
│
├── backend/                      # Node.js backend application
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   ├── controllers/          # Route controllers
│   │   ├── middleware/           # Express middleware
│   │   ├── models/               # Data models
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic services
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Utility functions
│   │   └── index.ts              # Entry point
│
├── supabase/                     # Supabase configuration
│   └── migrations/               # Database migrations
│
├── docs/                         # Documentation
├── .gitignore                    # Git ignore file
├── README.md                     # Project documentation
└── docker-compose.yml            # Docker configuration for local development
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account
- Git

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/learnhub.git
cd learnhub
```

2. Set up environment variables:
   - Create `.env` files in both `frontend` and `backend` directories based on the provided examples

3. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. Start development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm start
```

## Backend

### API Endpoints

The backend API is organized around these main resources:

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| Auth | `/api/auth/*` | Authentication routes |
| Courses | `/api/courses/*` | Course management |
| Enrollments | `/api/enrollments/*` | Enrollment management |
| Assignments | `/api/assignments/*` | Assignment management |
| Users | `/api/users/*` | User management |

### Middleware

Key middleware components:
- Authentication middleware to validate JWT tokens
- Role-based authorization middleware
- Error handling middleware
- Logging middleware

### Error Handling

The backend implements a centralized error handling system that:
- Provides consistent error responses
- Logs errors appropriately
- Handles different types of errors (validation, auth, not found, etc.)

## Frontend

### State Management

The frontend uses a combination of:
- React Query for server state
- Context API for application state
- Local state for component-specific state

### Routing

React Router v6 handles routing with:
- Public routes
- Protected routes (requiring authentication)
- Role-based routes

### Theming

The application supports:
- Light and dark themes
- Theme persistence
- Material Design color system
- Lexend font family

### Components

The component library includes:
- Layout components (MainLayout, DashboardLayout)
- Data display components (Tables, Cards, Lists)
- Form components (Inputs, Selects, Buttons)
- Feedback components (Alerts, Toasts, Loaders)

## Database

### Schema

The database schema includes these main tables:
- `profiles`: User profiles extending Supabase Auth
- `courses`: Course information
- `sections`: Course sections
- `lessons`: Individual lessons
- `enrollments`: User course enrollments
- `assignments`: Course assignments
- `assignment_submissions`: Student submissions
- `study_materials`: Course materials
- `course_reviews`: User reviews of courses
- `lesson_progress`: User lesson completion tracking

### Row Level Security

Supabase RLS policies are implemented to ensure:
- Users can only access data they're authorized to view
- Instructors can only manage their own courses
- Admins have broader access permissions

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect to the GitHub repository
3. Set the build command: `cd backend && npm install && npm run build`
4. Set the start command: `cd backend && npm start`
5. Configure environment variables

### Frontend Deployment

1. Build the frontend: `cd frontend && npm run build`
2. Deploy to Vercel or Netlify via their respective platforms or CLI tools

## Authentication & Authorization

Authentication is handled by Supabase Auth:
- JWT-based authentication
- Token refresh mechanism
- Session management

Authorization is implemented using:
- Role-based access control
- Resource-based permissions
- Row Level Security in the database

## Design System

The UI follows Material Design principles with:
- Consistent spacing and sizing
- Proper elevation (shadows)
- Responsive layouts
- Accessible color contrast
- Light and dark themes
- Lexend font for readability

See [MATERIAL-DESIGN.md](MATERIAL-DESIGN.md) for detailed information on the design system.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.