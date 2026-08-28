/* ==========================================
   remarket-db - Módulo de Mensajes
   Chat entre usuarios
   ========================================== */

import { supabase } from '../services/supabase-client.js';

/**
 * Inicializa el módulo de mensajes
 */
export function inicializarMensajes() {
  console.log('💬 Módulo de mensajes inicializado');
  escucharNuevosMensajes();
}

/**
 * Envía un mensaje a otro usuario
 * @param {string} destinatarioId - ID del usuario destinatario
 * @param {string} contenido - Contenido del mensaje
 * @param {string} publicacionId - ID de la publicación relacionada (opcional)
 * @returns {Promise<Object>} Resultado
 */
export async function enviarMensaje(destinatarioId, contenido, publicacionId = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para enviar mensajes' };
    }

    if (!contenido || contenido.trim().length === 0) {
      return { success: false, error: 'El mensaje no puede estar vacío' };
    }

    const { data, error } = await supabase.from('mensajes').insert({
      emisor_id: user.id,
      destinatario_id: destinatarioId,
      contenido: contenido.trim(),
      publicacion_id: publicacionId,
      leido: false,
      creado_en: new Date().toISOString()
    });

    if (error) throw error;

    console.log('✅ Mensaje enviado a:', destinatarioId);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Carga el historial de mensajes con un usuario específico
 * @param {string} otroUsuarioId - ID del otro usuario
 * @param {number} limite - Número de mensajes a cargar (default: 50)
 * @returns {Promise<Array>} Lista de mensajes
 */
export async function cargarHistorialMensajes(otroUsuarioId, limite = 50) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('mensajes')
      .select(`
        *,
        emisor:emisor_id (nombre, foto_perfil),
        destinatario:destinatario_id (nombre, foto_perfil)
      `)
      .or(`emisor_id.eq.${user.id},destinatario_id.eq.${user.id}`)
      .or(`emisor_id.eq.${otroUsuarioId},destinatario_id.eq.${otroUsuarioId}`)
      .order('creado_en', { ascending: true })
      .limit(limite);

    if (error) throw error;

    console.log(`📜 Historial cargado: ${data?.length || 0} mensajes`);
    return data || [];

  } catch (error) {
    console.error('❌ Error cargando historial:', error);
    return [];
  }
}

/**
 * Marca un mensaje como leído
 * @param {string} mensajeId - ID del mensaje
 * @returns {Promise<Object>} Resultado
 */
export async function marcarComoLeido(mensajeId) {
  try {
    const { error } = await supabase
      .from('mensajes')
      .update({ leido: true, leido_en: new Date().toISOString() })
      .eq('id', mensajeId);

    if (error) throw error;

    return { success: true };

  } catch (error) {
    console.error('❌ Error marcando como leído:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Marca todos los mensajes de un chat como leídos
 * @param {string} otroUsuarioId - ID del otro usuario
 * @returns {Promise<Object>} Resultado
 */
export async function marcarChatComoLeido(otroUsuarioId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    const { error } = await supabase
      .from('mensajes')
      .update({ leido: true, leido_en: new Date().toISOString() })
      .eq('emisor_id', otroUsuarioId)
      .eq('destinatario_id', user.id)
      .eq('leido', false);

    if (error) throw error;

    console.log('✅ Chat marcado como leído');
    return { success: true };

  } catch (error) {
    console.error('❌ Error marcando chat como leído:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene la lista de conversaciones del usuario
 * @returns {Promise<Array>} Lista de conversaciones
 */
export async function obtenerConversaciones() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    // Obtener todos los mensajes donde el usuario es emisor o destinatario
    const { data: mensajes, error } = await supabase
      .from('mensajes')
      .select(`
        *,
        emisor:emisor_id (id, nombre, foto_perfil),
        destinatario:destinatario_id (id, nombre, foto_perfil)
      `)
      .or(`emisor_id.eq.${user.id},destinatario_id.eq.${user.id}`)
      .order('creado_en', { ascending: false });

    if (error) throw error;

    // Agrupar por usuario (conversaciones únicas)
    const conversacionesMap = new Map();
    
    mensajes.forEach(msg => {
      const otroUsuario = msg.emisor_id === user.id ? msg.destinatario : msg.emisor;
      const otroUsuarioId = msg.emisor_id === user.id ? msg.destinatario_id : msg.emisor_id;
      
      if (!conversacionesMap.has(otroUsuarioId)) {
        conversacionesMap.set(otroUsuarioId, {
          usuario: otroUsuario,
          ultimoMensaje: msg,
          noLeidos: 0
        });
      }
      
      // Contar mensajes no leídos
      if (msg.destinatario_id === user.id && !msg.leido) {
        const conv = conversacionesMap.get(otroUsuarioId);
        conv.noLeidos++;
      }
    });

    const conversaciones = Array.from(conversacionesMap.values());
    console.log(`💬 Conversaciones cargadas: ${conversaciones.length}`);
    
    return conversaciones;

  } catch (error) {
    console.error('❌ Error obteniendo conversaciones:', error);
    return [];
  }
}

/**
 * Elimina un mensaje (solo para el emisor)
 * @param {string} mensajeId - ID del mensaje
 * @returns {Promise<Object>} Resultado
 */
export async function eliminarMensaje(mensajeId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    // Verificar que el usuario es el emisor
    const { data: mensaje, error: fetchError } = await supabase
      .from('mensajes')
      .select('emisor_id')
      .eq('id', mensajeId)
      .single();

    if (fetchError) throw fetchError;

    if (mensaje.emisor_id !== user.id) {
      return { success: false, error: 'Solo puedes eliminar tus propios mensajes' };
    }

    const { error } = await supabase
      .from('mensajes')
      .delete()
      .eq('id', mensajeId);

    if (error) throw error;

    console.log('🗑️ Mensaje eliminado:', mensajeId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error eliminando mensaje:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Escucha nuevos mensajes en tiempo real (usando polling cada 5 segundos)
 * Nota: En producción, usar Supabase Realtime para websockets
 */
function escucharNuevosMensajes() {
  let ultimoMensajeId = null;
  
  setInterval(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: mensajes, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('destinatario_id', user.id)
        .eq('leido', false)
        .order('creado_en', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (mensajes && mensajes.length > 0) {
        const nuevoMensaje = mensajes[0];
        
        if (ultimoMensajeId !== nuevoMensaje.id) {
          ultimoMensajeId = nuevoMensaje.id;
          
          // Disparar evento personalizado
          window.dispatchEvent(new CustomEvent('nuevo-mensaje', {
            detail: nuevoMensaje
          }));

          console.log('🔔 Nuevo mensaje recibido');
        }
      }

    } catch (error) {
      console.error('❌ Error escuchando mensajes:', error);
    }
  }, 5000); // Cada 5 segundos
}

/**
 * Obtiene el conteo de mensajes no leídos
 * @returns {Promise<number>} Número de mensajes no leídos
 */
export async function obtenerConteoNoLeidos() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('mensajes')
      .select('*', { count: 'exact' })
      .eq('destinatario_id', user.id)
      .eq('leido', false);

    if (error) throw error;

    return count || 0;

  } catch (error) {
    console.error(' Error obteniendo conteo:', error);
    return 0;
  }
}

/**
 * Renderiza un mensaje en el chat
 * @param {Object} mensaje - Objeto del mensaje
 * @param {string} usuarioActualId - ID del usuario actual
 * @returns {string} HTML del mensaje
 */
export function renderizarMensaje(mensaje, usuarioActualId) {
  const esPropio = mensaje.emisor_id === usuarioActualId;
  const fecha = new Date(mensaje.creado_en).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return `
    <div class="mensaje ${esPropio ? 'mensaje-propio' : 'mensaje-recibido'}">
      <div class="mensaje-contenido">
        <p>${mensaje.contenido}</p>
        <span class="mensaje-tiempo">${fecha}</span>
        ${esPropio ? `<span class="mensaje-estado ${mensaje.leido ? 'leido' : 'enviado'}">✓</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Inicia un chat con un usuario específico
 * @param {string} usuarioId - ID del usuario
 * @param {string} publicacionId - ID de la publicación relacionada (opcional)
 */
export function iniciarChat(usuarioId, publicacionId = null) {
  console.log('💬 Iniciando chat con:', usuarioId);
  
  // Aquí se abriría el modal de chat
  // Por ahora, solo log
  alert(`Chat iniciado con usuario ${usuarioId}`);
}

export default {
  inicializarMensajes,
  enviarMensaje,
  cargarHistorialMensajes,
  marcarComoLeido,
  marcarChatComoLeido,
  obtenerConversaciones,
  eliminarMensaje,
  obtenerConteoNoLeidos,
  renderizarMensaje,
  iniciarChat
};