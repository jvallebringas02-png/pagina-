/* ==========================================
   remarket-db - Configuración Global
   Variables y constantes del proyecto
   ========================================== */

export const CONFIG = {
  // Supabase
  SUPABASE_URL: "https://kgaekrxngncfwbmgp.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXprcmF4bHFuY2Zjd2Jic3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzA0NDEsImV4cCI6MjA5NzQwNjQ0MX0.C4cdFMTPNAjjBahz5xBl9s1OpnqyvQVrUmzVYCreiLoi",
  
  // Groq API (IA)
  GROQ_API_KEY: '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',  ✅
  EDGE_FUNCTION_CHAT: 'chat-ia',
  
  // Categorías disponibles
  CATEGORIAS: [
    'Tecnología',
    'Hogar',
    'Ropa',
    'Deportes',
    'Vehículos',
    'Agro / Alimentos',
    'Servicios',
    'Libros',
    'Otros'
  ],
  
  // Modalidades
  MODALIDADES: {
    venta: { icono: '💰', label: 'Venta', color: '#2ecc71' },
    trueque: { icono: '🔄', label: 'Trueque', color: '#f39c12' },
    donacion: { icono: '🎁', label: 'Donación', color: '#e74c3c' }
  },
  
  // Alcances
  ALCANCES: {
    local: { icono: '📍', label: 'Local' },
    regional: { icono: '🗺️', label: 'Regional' },
    mundial: { icono: '🌎', label: 'Mundial' }
  },
  
  // Idiomas disponibles
  IDIOMAS: [
    { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
    { codigo: 'en', nombre: 'English', bandera: '🇬🇧' },
    { codigo: 'pt', nombre: 'Português', bandera: '🇧🇷' },
    { codigo: 'fr', nombre: 'Français', bandera: '🇫' },
    { codigo: 'de', nombre: 'Deutsch', bandera: '🇩' },
    { codigo: 'it', nombre: 'Italiano', bandera: '🇮' },
    { codigo: 'bg', nombre: 'Български', bandera: '🇬' },
    { codigo: 'qu', nombre: 'Quechua', bandera: '🇵🇪' },
    { codigo: 'ay', nombre: 'Aymara', bandera: '🇧🇴' },
    { codigo: 'zh', nombre: '中文 (Chino)', bandera: '🇨🇳' },
    { codigo: 'ja', nombre: '日本語 (Japonés)', bandera: '🇯' },
    { codigo: 'ko', nombre: '한국어 (Coreano)', bandera: '🇰🇷' },
    { codigo: 'ar', nombre: 'العربية (Árabe)', bandera: '🇸' },
    { codigo: 'hi', nombre: 'हिन्दी (Hindi)', bandera: '🇮🇳' },
    { codigo: 'nl', nombre: 'Nederlands', bandera: '🇳🇱' },
    { codigo: 'tr', nombre: 'Türkçe', bandera: '🇹🇷' }
  ],
  
  // Países disponibles
  PAISES: [
    { codigo: 'PE', nombre: 'Perú', bandera: '🇪', telefono: '+51' },
    { codigo: 'MX', nombre: 'México', bandera: '🇲🇽', telefono: '+52' },
    { codigo: 'CO', nombre: 'Colombia', bandera: '🇨🇴', telefono: '+57' },
    { codigo: 'AR', nombre: 'Argentina', bandera: '🇦🇷', telefono: '+54' },
    { codigo: 'CL', nombre: 'Chile', bandera: '🇨🇱', telefono: '+56' },
    { codigo: 'EC', nombre: 'Ecuador', bandera: '🇪', telefono: '+593' },
    { codigo: 'BO', nombre: 'Bolivia', bandera: '🇧🇴', telefono: '+591' },
    { codigo: 'VE', nombre: 'Venezuela', bandera: '🇻🇪', telefono: '+58' },
    { codigo: 'ES', nombre: 'España', bandera: '🇪', telefono: '+34' },
    { codigo: 'US', nombre: 'Estados Unidos', bandera: '🇺🇸', telefono: '+1' },
    { codigo: 'BR', nombre: 'Brasil', bandera: '🇧', telefono: '+55' },
    { codigo: 'BG', nombre: 'Bulgaria', bandera: '🇧🇬', telefono: '+359' }
  ],
  
  // Configuración de la IA
  IA_CONFIG: {
    TEMPERATURE: 0.7,
    MAX_TOKENS: 500,
    HISTORIAL_MENSAJES: 5
  },
  
  // Límites
  MAX_FOTOS: 5,
  MAX_TITULO_CARACTERES: 100,
  MAX_DESCRIPCION_CARACTERES: 500,
  MIN_CONTRASENA_CARACTERES: 8,
  
  // URLs de redes sociales para videos
  REDES_SOCIALES: {
    youtube: 'youtube.com',
    tiktok: 'tiktok.com',
    instagram: 'instagram.com'
  }
};

export default CONFIG;
