import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhsrsefdgjwcapsnnnsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoc3JzZWZkZ2p3Y2Fwc25ubnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTA0NDgsImV4cCI6MjEwNDI2NjQ0OH0.bMz4_mV2_oGSn24mR-AsvPIFKXW1WAZ-05ZRog7FYYo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

