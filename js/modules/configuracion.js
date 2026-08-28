/* ==========================================
   remarket-db - Módulo de Configuración
   Preferencias del usuario
   ========================================== */

import { supabase } from '../services/supabase-client.js';
import { CONFIG } from '../config.js';

// Configuración por defecto
const configuracionDefault = {
  intereses: ['General'],
  privacidad_mensajes: 'Cualquier persona',
  alcance_preferido: 'Local',
  idioma: 'Español',
  localidad: 'Trujillo',
  notificaciones: {
    mensajes: true,
    comentarios: true,
    me_gusta: true,
    nuevas_publicaciones: false
  }
};

/**
 * Inicializa el módulo de configuración
 */
export function inicializarConfiguracion() {
  console.log('⚙️ Módulo de configuración inicializado');
  cargarConfiguracionUsuario();
}

/**
 * Carga la configuración del usuario desde Supabase
 * @returns {Promise<Object>} Configuración del usuario
 */
export async function cargarConfiguracionUsuario() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('ℹ️ No hay usuario logueado, usando configuración por defecto');
      return configuracionDefault;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('intereses, privacidad, alcance, idioma, localidad, notificaciones')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    console.log('✅ Configuración cargada:', data);
    return data || configuracionDefault;

  } catch (error) {
    console.error('❌ Error cargando configuración:', error);
    return configuracionDefault;
  }
}

/**
 * Guarda la configuración del usuario en Supabase
 * @param {Object} configuracion - Nueva configuración
 * @returns {Promise<Object>} Resultado
 */
export async function guardarConfiguracion(configuracion) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    const { error } = await supabase
      .from('usuarios')
      .update({
        intereses: configuracion.intereses || configuracionDefault.intereses,
        privacidad: configuracion.privacidad_mensajes || configuracionDefault.privacidad_mensajes,
        alcance: configuracion.alcance_preferido || configuracionDefault.alcance_preferido,
        idioma: configuracion.idioma || configuracionDefault.idioma,
        localidad: configuracion.localidad || configuracionDefault.localidad,
        notificaciones: configuracion.notificaciones || configuracionDefault.notificaciones,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) throw error;

    console.log('✅ Configuración guardada');
    return { success: true };

  } catch (error) {
    console.error(' Error guardando configuración:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza los intereses del usuario
 * @param {Array} intereses - Lista de intereses
 * @returns {Promise<Object>} Resultado
 */
export async function actualizarIntereses(intereses) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ intereses })
      .eq('id', user.id);

    if (error) throw error;

    console.log('✅ Intereses actualizados:', intereses);
    return { success: true };

  } catch (error) {
    console.error('❌ Error actualizando intereses:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza la privacidad de mensajes
 * @param {string} privacidad - 'Cualquier persona' o 'Solo personas que sigo'
 * @returns {Promise<Object>} Resultado
 */
export async function actualizarPrivacidad(privacidad) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ privacidad })
      .eq('id', user.id);

    if (error) throw error;

    console.log('✅ Privacidad actualizada:', privacidad);
    return { success: true };

  } catch (error) {
    console.error('❌ Error actualizando privacidad:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza el alcance preferido
 * @param {string} alcance - 'Local', 'Regional' o 'Mundial'
 * @returns {Promise<Object>} Resultado
 */
export async function actualizarAlcance(alcance) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ alcance })
      .eq('id', user.id);

    if (error) throw error;

    console.log('✅ Alcance actualizado:', alcance);
    return { success: true };

  } catch (error) {
    console.error('❌ Error actualizando alcance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza la localidad del usuario
 * @param {string} localidad - Nueva localidad
 * @returns {Promise<Object>} Resultado
 */
export async function actualizarLocalidad(localidad) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ localidad })
      .eq('id', user.id);

    if (error) throw error;

    console.log('✅ Localidad actualizada:', localidad);
    return { success: true };

  } catch (error) {
    console.error(' Error actualizando localidad:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza las preferencias de notificaciones
 * @param {Object} notificaciones - Objeto con preferencias
 * @returns {Promise<Object>} Resultado
 */
export async function actualizarNotificaciones(notificaciones) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión' };
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ notificaciones })
      .eq('id', user.id);

    if (error) throw error;

    console.log('✅ Notificaciones actualizadas:', notificaciones);
    return { success: true };

  } catch (error) {
    console.error('❌ Error actualizando notificaciones:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene las categorías disponibles para intereses
 * @returns {Array} Lista de categorías
 */
export function obtenerCategoriasIntereses() {
  return CONFIG.CATEGORIAS;
}

/**
 * Obtiene las opciones de privacidad
 * @returns {Array} Lista de opciones
 */
export function obtenerOpcionesPrivacidad() {
  return [
    { valor: 'Cualquier persona', label: ' Cualquier persona puede escribirme' },
    { valor: 'Solo personas que sigo', label: '🔒 Solo personas que sigo' }
  ];
}

/**
 * Obtiene las opciones de alcance
 * @returns {Array} Lista de opciones
 */
export function obtenerOpcionesAlcance() {
  return [
    { valor: 'Local', label: '📍 Local (mi zona)', icono: '📍' },
    { valor: 'Regional', label: '️ Regional (mi ciudad/región)', icono: '🗺️' },
    { valor: 'Mundial', label: '🌎 Mundial', icono: '🌎' }
  ];
}

/**
 * Renderiza el formulario de configuración en el modal
 * @param {Object} configuracion - Configuración actual del usuario
 */
export function renderizarFormularioConfiguracion(configuracion) {
  // Renderizar intereses
  const contenedorIntereses = document.getElementById('contenedor-intereses');
  if (contenedorIntereses) {
    const categorias = obtenerCategoriasIntereses();
    contenedorIntereses.innerHTML = categorias.map(cat => `
      <label class="interes-item ${configuracion.intereses?.includes(cat) ? 'seleccionado' : ''}">
        <input type="checkbox" value="${cat}" ${configuracion.intereses?.includes(cat) ? 'checked' : ''}>
        ${cat}
      </label>
    `).join('');

    // Agregar event listeners
    contenedorIntereses.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.target.parentElement.classList.toggle('seleccionado', e.target.checked);
      });
    });
  }

  // Renderizar privacidad
  const contenedorPrivacidad = document.getElementById('contenedor-privacidad');
  if (contenedorPrivacidad) {
    const opciones = obtenerOpcionesPrivacidad();
    contenedorPrivacidad.innerHTML = opciones.map(op => `
      <label class="opcion-modalidad ${configuracion.privacidad_mensajes === op.valor ? 'seleccionada' : ''}">
        <input type="radio" name="privacidad" value="${op.valor}" ${configuracion.privacidad_mensajes === op.valor ? 'checked' : ''}>
        ${op.label}
      </label>
    `).join('');

    contenedorPrivacidad.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        contenedorPrivacidad.querySelectorAll('.opcion-modalidad').forEach(o => o.classList.remove('seleccionada'));
        e.target.parentElement.classList.add('seleccionada');
      });
    });
  }

  // Renderizar alcance
  const contenedorAlcance = document.getElementById('contenedor-alcance');
  if (contenedorAlcance) {
    const opciones = obtenerOpcionesAlcance();
    contenedorAlcance.innerHTML = opciones.map(op => `
      <label class="opcion-alcance ${configuracion.alcance_preferido === op.valor ? 'seleccionada' : ''}">
        <input type="radio" name="alcance" value="${op.valor}" ${configuracion.alcance_preferido === op.valor ? 'checked' : ''}>
        ${op.icono} ${op.label}
      </label>
    `).join('');

    contenedorAlcance.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        contenedorAlcance.querySelectorAll('.opcion-alcance').forEach(o => o.classList.remove('seleccionada'));
        e.target.parentElement.classList.add('seleccionada');
      });
    });
  }

  // Renderizar localidad
  const inputLocalidad = document.getElementById('input-localidad');
  if (inputLocalidad) {
    inputLocalidad.value = configuracion.localidad || 'Trujillo';
  }

  // Renderizar notificaciones
  const notificaciones = configuracion.notificaciones || configuracionDefault.notificaciones;
  Object.keys(notificaciones).forEach(key => {
    const checkbox = document.getElementById(`notif-${key}`);
    if (checkbox) {
      checkbox.checked = notificaciones[key];
    }
  });
}

/**
 * Recopila los datos del formulario de configuración
 * @returns {Object} Datos de configuración
 */
export function recopilarDatosConfiguracion() {
  // Intereses
  const intereses = Array.from(document.querySelectorAll('#contenedor-intereses input:checked'))
    .map(cb => cb.value);

  // Privacidad
  const privacidad = document.querySelector('input[name="privacidad"]:checked')?.value || 'Cualquier persona';

  // Alcance
  const alcance = document.querySelector('input[name="alcance"]:checked')?.value || 'Local';

  // Localidad
  const localidad = document.getElementById('input-localidad')?.value || 'Trujillo';

  // Notificaciones
  const notificaciones = {
    mensajes: document.getElementById('notif-mensajes')?.checked || false,
    comentarios: document.getElementById('notif-comentarios')?.checked || false,
    me_gusta: document.getElementById('notif-me_gusta')?.checked || false,
    nuevas_publicaciones: document.getElementById('notif-nuevas_publicaciones')?.checked || false
  };

  return {
    intereses: intereses.length > 0 ? intereses : ['General'],
    privacidad_mensajes: privacidad,
    alcance_preferido: alcance,
    localidad,
    notificaciones
  };
}

export default {
  inicializarConfiguracion,
  cargarConfiguracionUsuario,
  guardarConfiguracion,
  actualizarIntereses,
  actualizarPrivacidad,
  actualizarAlcance,
  actualizarLocalidad,
  actualizarNotificaciones,
  obtenerCategoriasIntereses,
  obtenerOpcionesPrivacidad,
  obtenerOpcionesAlcance,
  renderizarFormularioConfiguracion,
  recopilarDatosConfiguracion
};