/* ==========================================
   remarket-db - Servicio de IA
   Conexión con Groq API (Llama 3.3)
   ========================================== */

import { CONFIG } from '../config.js';

/**
 * Envía un mensaje a la IA y obtiene la respuesta
 * @param {Array} messages - Historial de mensajes
 * @param {Object} contextoUsuario - Datos del usuario
 * @returns {Promise<Object>} Respuesta de la IA
 */
export async function enviarMensajeIA(messages, contextoUsuario = {}) {
  try {
    const url = `${CONFIG.SUPABASE_URL}/functions/v1/${CONFIG.EDGE_FUNCTION_CHAT}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        messages,
        contexto_usuario: contextoUsuario
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('❌ Error en AI Service:', error);
    throw error;
  }
}

/**
 * Construye el System Prompt dinámico con el contexto del usuario
 * @param {Object} contextoUsuario - Datos del usuario
 * @returns {string} System Prompt completo
 */
export function construirSystemPrompt(contextoUsuario) {
  return `Eres el Asistente Corporativo de remarket-db.
Estilo: PROFESIONAL, ÁGIL, DIRECTO, ORIENTADO A RESULTADOS.

REGLAS:
1. NUNCA preguntes lo que ya sabes del usuario.
2. Respuestas de 1-3 oraciones máximo.
3. Tono corporativo pero cercano.
4. Anticipa necesidades según intereses del usuario.
5. Responde en el idioma configurado: ${contextoUsuario?.idioma || "Español"}.

CONTEXTO DEL USUARIO:
- Nombre: ${contextoUsuario?.nombre || "Usuario"}
- Localidad: ${contextoUsuario?.localidad || "No definida"}
- Intereses: ${contextoUsuario?.intereses?.join(", ") || "No definidos"}
- Privacidad: ${contextoUsuario?.privacidad_mensajes || "Cualquier persona"}
- Alcance preferido: ${contextoUsuario?.alcance_preferido || "Local"}

PLATAFORMA:
- Modalidades: Venta 💰, Trueque 🔄, Donación 🎁
- Categorías: Tecnología, Hogar, Ropa, Deportes, Vehículos, Agro/Alimentos, Servicios, Libros, Otros
- Moneda: Soles (S/)
- Seguridad: Declaración Jurada obligatoria

REGLA DE MANEJO DE FUERA DE TEMA:
Si el usuario pregunta por "noticias", "clima", "política" o temas ajenos a la economía circular, responde con amabilidad: 
"Mi especialidad es ayudarte a encontrar productos para vender, truequear o donar en tu zona, o asistirte con el uso de la plataforma remarket-db. No tengo acceso a noticias en tiempo real, pero ¿te gustaría que busquemos algún artículo en específico?"

FORMATO JSON OBLIGATORIO:
{
  "criterios_busqueda": {
    "accion": "mostrar_resultados|consultar|guiar",
    "categoria": "detectada o null",
    "ubicacion": "detectada o ${contextoUsuario?.localidad || 'general'}",
    "modalidad": "venta|trueque|donacion|cualquiera"
  },
  "respuesta_usuario": "Respuesta corporativa ágil de 1-3 oraciones"
}`;
}

/**
 * Valida la respuesta de la IA
 * @param {Object} respuesta - Respuesta de la IA
 * @returns {boolean} Si es válida
 */
export function validarRespuestaIA(respuesta) {
  if (!respuesta) return false;
  if (!respuesta.respuesta_usuario) return false;
  return true;
}

/**
 * Extrae los criterios de búsqueda de la respuesta
 * @param {Object} respuesta - Respuesta de la IA
 * @returns {Object} Criterios de búsqueda
 */
export function extraerCriteriosBusqueda(respuesta) {
  return respuesta.criterios_busqueda || {};
}

/**
 * Obtiene la respuesta de texto para el usuario
 * @param {Object} respuesta - Respuesta de la IA
 * @returns {string} Texto de respuesta
 */
export function obtenerRespuestaTexto(respuesta) {
  return respuesta.respuesta_usuario || 'Lo siento, no pude procesar tu mensaje.';
}

export default {
  enviarMensajeIA,
  construirSystemPrompt,
  validarRespuestaIA,
  extraerCriteriosBusqueda,
  obtenerRespuestaTexto
};