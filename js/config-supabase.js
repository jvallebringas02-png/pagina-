  // Configuración de Supabase
  const SUPABASE_URL = 'https://kqazkraxlqncfcwbbsps.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXprcmF4bHFuY2Zjd2Jic3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzA0NDEsImV4cCI6MjA5NzQwNjQ0MX0.C4cdFMTPNAjjBahz5xBl9s1OpnqyvQVrUmzVYCreiLo';
  
  // Inicializar cliente
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase conectado - remarket-db');
