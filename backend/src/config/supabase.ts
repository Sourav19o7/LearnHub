import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

let supabase: SupabaseClient;
let serviceSupabase: SupabaseClient;

/**
 * Initializes the Supabase client and tests the connection
 */
export const initializeSupabase = async (): Promise<void> => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    logger.error('Supabase URL or Key is missing in environment variables');
    process.exit(1);
  }
  
  try {
    // Initialize the client with enhanced logging
    logger.info(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 20)}...`);
    
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    
    // Test the connection
    logger.info('Testing database connection...');
    await checkDatabaseHealth();
    
    logger.info('Supabase client initialized successfully');
  } catch (error: any) { // Explicitly type as any to avoid TypeScript error
    logger.error(`Failed to initialize Supabase client: ${error.message}`);
    throw error;
  }
};

/**
 * Tests database connection by checking for existence of specified tables
 * @param tableNames Array of table names to test
 * @returns Object with test results for each table
 */
export const testDatabaseConnection = async (tableNames: string[]): Promise<Record<string, any>> => {
  const results: Record<string, any> = {
    success: true,
    tables: {}
  };
  
  try {
    // Test each table
    for (const tableName of tableNames) {
      try {
        logger.info(`Testing connection to table: ${tableName}`);
        const { data, error } = await supabase.from(tableName).select('count');
        
        if (error) {
          if (error.code === 'PGRST116') {
            logger.error(`Table "${tableName}" does not exist`);
            logger.error('Please run the database migrations to create the required tables');
            results.tables[tableName] = {
              exists: false,
              error: `Table does not exist: ${error.message}`,
              code: error.code
            };
          } else {
            logger.error(`Error querying table "${tableName}": ${error.message}`);
            logger.error(`Error code: ${error.code}`);
            logger.error(`Error details: ${JSON.stringify(error.details)}`);
            results.tables[tableName] = {
              exists: false,
              error: error.message,
              code: error.code,
              details: error.details
            };
          }
          results.success = false;
        } else {
          logger.info(`Successfully connected to table: ${tableName}`);
          results.tables[tableName] = {
            exists: true,
            success: true
          };
        }
      } catch (tableError: any) {
        logger.error(`Exception testing table "${tableName}": ${tableError.message}`);
        results.tables[tableName] = {
          exists: false,
          error: tableError.message
        };
        results.success = false;
      }
    }
    
    // Log overall result
    if (results.success) {
      logger.info(`Database connection test successful for all ${tableNames.length} tables`);
    } else {
      logger.error(`Database connection test failed for some tables`);
    }
    
    return results;
  } catch (error: any) {
    logger.error(`Database connection test threw an exception: ${error.message}`);
    return {
      success: false,
      error: error.message,
      message: 'Failed to connect to database'
    };
  }
};

/**
 * Check health of all critical database tables
 * Useful for diagnostics and monitoring
 */
export const checkDatabaseHealth = async (): Promise<Record<string, any>> => {
  // Define all the tables we need for the application
  const tables = [
    'profiles', 
    'courses', 
    'sections', 
    'lessons', 
    'enrollments', 
    'assignments',
    'assignment_submissions',
    'course_reviews',
    'study_materials',
    'lesson_progress'
  ];
  
  return testDatabaseConnection(tables);
};

/**
 * Returns the initialized Supabase client
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    logger.error('Supabase client not initialized');
    throw new Error('Supabase client not initialized. Make sure to call initializeSupabase() first.');
  }
  return supabase;
};

/**
 * Returns a Supabase client with service role for admin operations
 * Creates a new client instance each time to ensure we have fresh credentials
 */
export const getServiceSupabase = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    logger.error('Supabase URL or Service Key is missing in environment variables');
    throw new Error('Supabase URL or Service Key is missing');
  }
  
  // Create a new service client each time
  try {
    serviceSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false
      }
    });
    return serviceSupabase;
  } catch (error: any) { // Explicitly type as any to avoid TypeScript error
    logger.error(`Failed to create service Supabase client: ${error.message}`);
    throw error;
  }
};