/* ==========================================
   remarket-db - Módulo de Reportes
   Denuncia de publicaciones y usuarios
   ========================================== */

import { supabase } from '../services/supabase-client.js';

// Motivos predefinidos para reportar
const MOTIVOS_REPORTE = [
  { id: 'spam', texto: '📢 Spam o publicidad repetitiva' },
  { id: 'inapropiado', texto: ' Contenido inapropiado o ilegal' },
  { id: 'fraude', texto: '️ Fraude o estafa' },
  { id: 'no_existe', texto: '❌ El producto no existe o ya no está disponible' },
  { id: 'datos_falsos', texto: ' Información falsa o engañosa' },
  { id: 'otro', texto: ' Otro motivo' }
];

/**
 * Inicializa el módulo de reportes
 */
export function inicializarReportar() {
  console.log(' Módulo de reportes inicializado');
}

/**
 * Obtiene la lista de motivos para reportar
 * @returns {Array} Lista de motivos
 */
export function obtenerMotivosReporte() {
  return MOTIVOS_REPORTE;
}

/**
 * Envía un reporte de una publicación
 * @param {string} publicacionId - ID de la publicación a reportar
 * @param {string} motivo - Motivo del reporte (spam, fraude, etc.)
 * @param {string} descripcion - Descripción adicional del usuario
 * @returns {Promise<Object>} Resultado del reporte
 */
export async function enviarReporte(publicacionId, motivo, descripcion = '') {
  try {
    // Validar datos
    if (!publicacionId) {
      return { success: false, error: 'ID de publicación no válido' };
    }

    if (!motivo) {
      return { success: false, error: 'Debes seleccionar un motivo para el reporte' };
    }

    // Obtener usuario actual (si está logueado)
    const { data: { user } } = await supabase.auth.getUser();
    const usuarioId = user ? user.id : null;

    // Insertar reporte en la base de datos
    const { data, error } = await supabase.from('reportes').insert({
      publicacion_id: publicacionId,
      usuario_id: usuarioId, // Puede ser null si es un usuario anónimo
      motivo: motivo,
      descripcion: descripcion.trim(),
      estado: 'pendiente', // pendiente, revisado, descartado
      creado_en: new Date().toISOString()
    });

    if (error) throw error;

    console.log('✅ Reporte enviado para la publicación:', publicacionId);
    return { success: true, data };

  } catch (error) {
    console.error(' Error al enviar reporte:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Valida si el reporte tiene los datos mínimos requeridos
 * @param {string} motivo 
 * @returns {Object} Resultado de la validación
 */
export function validarReporte(motivo) {
  const motivosValidos = MOTIVOS_REPORTE.map(m => m.id);
  
  if (!motivo || !motivosValidos.includes(motivo)) {
    return {
      valida: false,
      mensaje: 'Por favor selecciona un motivo válido de la lista.'
    };
  }

  return {
    valida: true,
    mensaje: 'Reporte válido'
  };
}

/**
 * Renderiza las opciones de motivos en el modal de reportar
 * @param {string} contenedorId - ID del elemento HTML donde se renderizarán
 */
export function renderizarMotivos(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = MOTIVOS_REPORTE.map(motivo => `
    <label class="interes-item">
      <input type="radio" name="motivo-reporte" value="${motivo.id}">
      ${motivo.texto}
    </label>
  `).join('');
}

/**
 * Obtiene el motivo seleccionado del formulario
 * @returns {string|null} ID del motivo seleccionado
 */
export function obtenerMotivoSeleccionado() {
  const seleccionado = document.querySelector('input[name="motivo-reporte"]:checked');
  return seleccionado ? seleccionado.value : null;
}

/**
 * Muestra un mensaje de confirmación después de enviar el reporte
 */
export function mostrarConfirmacionReporte() {
  alert('✅ Gracias por tu reporte. Nuestro equipo lo revisará pronto para mantener la comunidad segura.');
}

export default {
  inicializarReportar,
  obtenerMotivosReporte,
  enviarReporte,
  validarReporte,
  renderizarMotivos,
  obtenerMotivoSeleccionado,
  mostrarConfirmacionReporte
};