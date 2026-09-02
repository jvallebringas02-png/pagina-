// ============================================================
// 🗺️ GUÍA DE NAVEGACIÓN DEL CÓDIGO (ver "los pasos a seguir")
// ============================================================
// Este índice ubica cada FASE del manual dentro del archivo.
// Busca las etiquetas [FASE X] con Ctrl+F para saltar a esa parte.
//
// FASE 0  - Config y conexión a Supabase ......... var CONFIG, GeoService
// FASE 1  - Correcciones críticas:
//   1.1 Persistencia de idioma ................... obtenerIdiomaPreferido(), changeLanguage()
//   1.2 Botón de Facebook eliminado ............... (ver modal de login en el HTML)
// FASE 2  - Panel de Usuario estilo Facebook ...... objeto PanelUsuario (mostrar/ocultar, menú, tarjetas)
// FASE 3  - Publicaciones (solo fotos) ............ PanelUsuario: sección "PUBLICAR"
// FASE 4  - Feed social (likes, comentarios, vistas) PanelUsuario: "FEED", "RENDER POST", "LIKES", "COMENTARIOS...", "COMPARTIR..."
// FASE 5  - Funciones sociales (seguir/bloquear) .. PanelUsuario: "ACCIONES SOCIALES"
// FASE 6  - Chat con moderación + traducción ...... PanelUsuario: "CHAT", "BUSCADOR DE PERSONAS..."
// FASE 7  - Perfil de usuario completo ............ PanelUsuario: "PERFIL ESTILO FACEBOOK"
// FASE 8  - Personalización inteligente ........... PanelUsuario: "TENDENCIAS" (parcial, feed algorítmico pendiente)
// FASE 9  - Panel de Moderador .................... ⏳ pendiente de implementar
// FASE 10 - Panel de Administrador ................ ⏳ pendiente de implementar
// FASE 11 - Sistema de notificaciones .............. parcial: actualizarBadgesMensajes()
// ============================================================

// ============================================
// CONFIGURACIÓN
// ============================================
var CONFIG = {
    GROQ_API_URL: "https://kqazkraxlqncfcwbbsps.supabase.co/functions/v1/chat-ia",
    SUPABASE_URL: "https://kqazkraxlqncfcwbbsps.supabase.co",
    SUPABASE_KEY: "sb_publishable_9xuQa7wsNT4LYCKHOGRDPQ_9eccAk-G"
};
var MI_API_KEY = CONFIG.SUPABASE_KEY;
let usuarioActual = null;
var loginAttempts = 0;

// ============================================
// GEOLOCALIZACIÓN
// ============================================
var GeoService = {
    ip: 'Desconocida', ciudad: 'Desconocida', pais: 'Desconocido', region: 'Desconocida',
    zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone, gpsLatitud: null, gpsLongitud: null, fuente: 'IP',
    detectarUbicacion: async function() {
        try {
            var response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error('Error en API');
            var data = await response.json();
            if (data && data.ip) {
                this.ip = data.ip; this.ciudad = data.city || 'Desconocida';
                this.pais = data.country_name || 'Desconocido'; this.region = data.region || 'Desconocida';
            }
        } catch (e) {
            console.warn('️ No se pudo detectar la ubicación:', e);
            try { var response2 = await fetch('https://api.ipify.org?format=json'); var data2 = await response2.json(); this.ip = data2.ip; } catch (e2) { console.warn('️ No se pudo obtener la IP'); }
        }
    },
    obtenerInfoCompleta: function() {
        return { ip: this.ip, ciudad: this.ciudad, pais: this.pais, region: this.region, zona_horaria: this.zonaHoraria, gps_latitud: this.gpsLatitud, gps_longitud: this.gpsLongitud, fuente_ubicacion: this.fuente };
    }
};

