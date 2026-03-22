import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpyvksnsfihybemvxvap.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNweXZrc25zZmloeWJlbXZ4dmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTgwNjMsImV4cCI6MjA4OTY5NDA2M30.LHDXuuylGg6rbMp4JegxGB85z6uNu4Umcc46fpOQAFQ'

export const supabase = createClient(supabaseUrl, supabaseKey)