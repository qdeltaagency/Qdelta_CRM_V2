import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoiomtbwxnxgrncoyfpy.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaW9tdGJ3eG54Z3JuY295ZnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzQzMDksImV4cCI6MjEwNDYxMDMwOX0.evtngONrXIJ4D0b0yYTpHYJOwQZVKsNiPlRudyGI13Y';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
