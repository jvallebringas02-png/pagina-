/* ==========================================
   remarket-db - Módulo de Publicaciones
   Crear, editar y eliminar publicaciones
   ========================================== */

import { supabase } from '../services/supabase-client.js';
import { CONFIG } from '../config.js';

/**
 * Inicializa el módulo de publicaciones
 */
export function inicializarPublicaciones() {
  console.log('📦 Módulo de publicaciones inicializado');
}

/**
 * Crea una nueva publicación
 * @param {Object} datos - Datos de la publicación
 * @returns {Promise<Object>} Resultado
 */
export async function crearPublicacion(datos) {
  try {
    console.log('📝 Creando publicación...');

    // Validar datos obligatorios
    const validacion = validarDatosPublicacion(datos);
    if (!validacion.valida) {
      return { success: false, error: validacion.mensaje };
    }

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para publicar' };
    }

    // Subir fotos si existen
    let fotosUrls = [];
    if (datos.fotos && datos.fotos.length > 0) {
      fotosUrls = await subirFotos(datos.fotos, user.id);
    }

    // Insertar en la base de datos
    const { data, error } = await supabase.from('articulos').insert({
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      modalidad: datos.modalidad,
      precio: datos.precio || 0,
      ubicacion: datos.ubicacion,
      alcance: datos.alcance,
      volumen: datos.volumen || null,
      fotos: fotosUrls,
      usuario_id: user.id,
      estado: 'activo',
      creado_en: new Date().toISOString()
    });

    if (error) throw error;

    console.log('✅ Publicación creada:', datos.titulo);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error al crear publicación:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Valida los datos de una publicación
 * @param {Object} datos
 * @returns {Object} Resultado de validación
 */
function validarDatosPublicacion(datos) {
  if (!datos.titulo || datos.titulo.trim().length === 0) {
    return { valida: false, mensaje: 'El título es obligatorio' };
  }

  if (datos.titulo.length > CONFIG.MAX_TITULO_CARACTERES) {
    return { valida: false, mensaje: `El título no puede tener más de ${CONFIG.MAX_TITULO_CARACTERES} caracteres` };
  }

  if (!datos.descripcion || datos.descripcion.trim().length === 0) {
    return { valida: false, mensaje: 'La descripción es obligatoria' };
  }

  if (datos.descripcion.length > CONFIG.MAX_DESCRIPCION_CARACTERES) {
    return { valida: false, mensaje: `La descripción no puede tener más de ${CONFIG.MAX_DESCRIPCION_CARACTERES} caracteres` };
  }

  if (!datos.categoria) {
    return { valida: false, mensaje: 'Debes seleccionar una categoría' };
  }

  if (!datos.modalidad) {
    return { valida: false, mensaje: 'Debes seleccionar una modalidad (Venta, Trueque o Donación)' };
  }

  if (!datos.ubicacion) {
    return { valida: false, mensaje: 'Debes indicar la ubicación' };
  }

  return { valida: true, mensaje: 'Datos válidos' };
}

/**
 * Sube fotos al storage de Supabase
 * @param {FileList} fotos - Archivos de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} URLs de las fotos
 */
async function subirFotos(fotos, userId) {
  const urls = [];
  const bucket = 'fotos-articulos';

  for (let i = 0; i < Math.min(fotos.length, CONFIG.MAX_FOTOS); i++) {
    const file = fotos[i];
    const fileName = `${userId}/${Date.now()}_${i}_${file.name}`;

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    } catch (error) {
      console.error(`❌ Error subiendo foto ${i}:`, error);
    }
  }

  return urls;
}

/**
 * Edita una publicación existente
 * @param {string} id - ID de la publicación
 * @param {Object} datos - Nuevos datos
 * @returns {Promise<Object>} Resultado
 */
export async function editarPublicacion(id, datos) {
  try {
    console.log('✏️ Editando publicación:', id);

    const { data, error } = await supabase
      .from('articulos')
      .update({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        categoria: datos.categoria,
        modalidad: datos.modalidad,
        precio: datos.precio,
        ubicacion: datos.ubicacion,
        alcance: datos.alcance,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Publicación editada');
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error al editar publicación:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina (desactiva) una publicación
 * @param {string} id - ID de la publicación
 * @returns {Promise<Object>} Resultado
 */
export async function eliminarPublicacion(id) {
  try {
    console.log('🗑️ Eliminando publicación:', id);

    const { error } = await supabase
      .from('articulos')
      .update({ estado: 'inactivo' })
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Publicación eliminada');
    return { success: true };

  } catch (error) {
    console.error('❌ Error al eliminar publicación:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene las publicaciones de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de publicaciones
 */
export async function obtenerMisPublicaciones(userId) {
  try {
    const { data, error } = await supabase
      .from('articulos')
      .select('*')
      .eq('usuario_id', userId)
      .eq('estado', 'activo')
      .order('creado_en', { ascending: false });

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error al obtener publicaciones:', error);
    return [];
  }
}

/**
 * Maneja la selección de archivos para fotos
 * @param {FileList} files - Archivos seleccionados
 * @returns {Object} Resultado con archivos válidos y errores
 */
export function manejarSeleccionFotos(files) {
  const archivosValidos = [];
  const errores = [];

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  const tamanoMaximo = 5 * 1024 * 1024; // 5MB

  Array.from(files).forEach(file => {
    if (!tiposPermitidos.includes(file.type)) {
      errores.push(`${file.name}: formato no permitido (solo JPG, PNG, WEBP)`);
    } else if (file.size > tamanoMaximo) {
      errores.push(`${file.name}: excede el tamaño máximo de 5MB`);
    } else {
      archivosValidos.push(file);
    }
  });

  if (archivosValidos.length > CONFIG.MAX_FOTOS) {
    errores.push(`Solo se permiten ${CONFIG.MAX_FOTOS} fotos máximo`);
    return { archivos: archivosValidos.slice(0, CONFIG.MAX_FOTOS), errores };
  }

  return { archivos: archivosValidos, errores };
}

export default {
  inicializarPublicaciones,
  crearPublicacion,
  editarPublicacion,
  eliminarPublicacion,
  obtenerMisPublicaciones,
  manejarSeleccionFotos
};