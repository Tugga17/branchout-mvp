import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://brreqsggxcponhjuekot.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycmVxc2dneGNwb25oanVla290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTI5MjYsImV4cCI6MjA4MDI4ODkyNn0.rffcytR7XR0dnpCkr06N5P0XTjV1Krf7P0H5VVVskdA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
