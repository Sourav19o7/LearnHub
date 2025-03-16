import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

let supabase: SupabaseClient;

export const initializeSupabase = (): void => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    logger.error('Supabase URL or Key is missing in environment variables');
    process.exit(1);
  }
  
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  });
  
  logger.info('Supabase client initialized');
};

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    logger.error('Supabase client not initialized');
    throw new Error('Supabase client not initialized');
  }
  return supabase;
};

// Service role client for admin operations
export const getServiceSupabase = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    logger.error('Supabase URL or Service Key is missing in environment variables');
    throw new Error('Supabase URL or Service Key is missing');
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false
    }
  });
};