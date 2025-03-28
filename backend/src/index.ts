import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { initializeSupabase } from './config/supabase';
import { logger } from './utils/logger';

// API Routes
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import userRoutes from './routes/userRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import assignmentRoutes from './routes/assignmentRoutes';

// Load environment variables
dotenv.config();

// Use environment variable for the frontend URL
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL] 
  : ['http://localhost:3000', 'http://127.0.0.1:3000', '*'];

// Initialize app
const app = express();
const PORT = process.env.PORT || 4000;

// Setup middleware first in case we need to log errors during initialization
app.use(morgan('dev')); // Request logging

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.status(204).end();
});

// Initialize Supabase with better error handling
(async () => {
  try {
    logger.info('Initializing Supabase connection...');
    await initializeSupabase();
    logger.info('Supabase connection established successfully.');
    startServer();
  } catch (error: any) { // Explicitly type error as any
    logger.error(`Failed to initialize Supabase: ${error.message}`);
    logger.error('The application might have limited functionality.');
    logger.error('Make sure your database is properly set up and credentials are correct.');
    
    // Still start the server so we can access diagnostics endpoints
    startServer();
  }
})();

function startServer() {
  // Security middleware
  app.use(helmet({ 
    crossOriginResourcePolicy: false // Allow cross-origin resource sharing
  }));

  // Body parsing middleware - for regular JSON and URL-encoded data
  app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with increased limit
  app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies with increased limit

  // Don't apply formidable globally as it can interfere with other middleware
  // Instead, apply it selectively in your routes

  // Add diagnostic endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      server: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Add database check endpoint
  app.get('/api/health/db', async (req, res) => {
    try {
      const { getSupabase, checkDatabaseHealth } = require('./config/supabase');
      
      // Try to get the client first as a basic check
      try {
        getSupabase();
        
        // If that works, check all the tables
        const health = await checkDatabaseHealth();
        return res.status(health.success ? 200 : 500).json(health);
      } catch (error: any) { // Explicitly type error as any
        return res.status(500).json({
          success: false,
          message: 'Database connection is not initialized',
          error: error.message
        });
      }
    } catch (error: any) { // Explicitly type error as any
      return res.status(500).json({
        success: false,
        message: 'Error checking database health',
        error: error.message
      });
    }
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/enrollments', enrollmentRoutes);
  app.use('/api/assignments', assignmentRoutes);

  // Base route
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Learning Platform API',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/api/health'
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start server
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`Health endpoint available at http://localhost:${PORT}/api/health`);
    logger.info(`Database health check available at http://localhost:${PORT}/api/health/db`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    logger.error('Unhandled Rejection:', err);
    // Close server & exit process
    server.close(() => {
      logger.info('Server closed due to unhandled promise rejection');
      process.exit(1);
    });
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
    });
  });
}

export default app;