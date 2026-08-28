/* ==========================================
   remarket-db - Módulo de Favoritos
   Guardar y gestionar publicaciones favoritas
   ========================================== */

import { supabase } from '../services/supabase-client.js';

/**
 * Inicializa el módulo de favoritos
 */
export function inicializarFavoritos() {
  console.log('❤️ Módulo de favoritos inicializado');
  // Aquí se podrían cargar los favoritos al iniciar sesión
}

/**
 * Agrega una publicación a favoritos
 * @param {string} publicacionId - ID de la publicación
 * @returns {Promise<Object>} Resultado
 */
export async function agregarFavorito(publicacionId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Debes iniciar sesión para guardar favoritos');
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verificar si ya es favorito para evitar duplicados
    const { data: existe } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('articulo_id', publicacionId)
      .single();

    if (existe) {
      console.log('ℹ️ Ya está en favoritos');
      return { success: true, message: 'Ya estaba en favoritos' };
    }

    const { data, error } = await supabase.from('favoritos').insert({
      usuario_id: user.id,
      articulo_id: publicacionId,
      creado_en: new Date().toISOString()
    });

    if (error) throw error;

    console.log('❤️ Agregado a favoritos:', publicacionId);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error al agregar favorito:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina una publicación de favoritos
 * @param {string} publicacionId - ID de la publicación
 * @returns {Promise<Object>} Resultado
 */
export async function eliminarFavorito(publicacionId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('usuario_id', user.id)
      .eq('articulo_id', publicacionId);

    if (error) throw error;

    console.log(' Eliminado de favoritos:', publicacionId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error al eliminar favorito:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Alterna el estado de favorito (agrega o quita) y actualiza el botón UI
 * @param {string} publicacionId - ID de la publicación
 * @param {HTMLElement} boton - El botón del corazón clickeado
 */
export async function toggleFavorito(publicacionId, boton) {
  const esFav = await esFavorito(publicacionId);
  
  let resultado;
  if (esFav) {
    resultado = await eliminarFavorito(publicacionId);
    if (resultado.success && boton) {
      boton.classList.remove('activo');
      boton.textContent = '🤍'; // Corazón vacío
    }
  } else {
    resultado = await agregarFavorito(publicacionId);
    if (resultado.success && boton) {
      boton.classList.add('activo');
      boton.textContent = '❤️'; // Corazón lleno
    }
  }
  
  return resultado;
}

/**
 * Verifica si una publicación está en favoritos
 * @param {string} publicacionId - ID de la publicación
 * @returns {Promise<boolean>}
 */
export async function esFavorito(publicacionId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('articulo_id', publicacionId)
      .single();

    if (error) return false; // No encontrado o error
    return !!data;

  } catch (error) {
    return false;
  }
}

/**
 * Obtiene todas las publicaciones favoritas del usuario actual
 * @returns {Promise<Array>} Lista de publicaciones favoritas
 */
export async function obtenerMisFavoritos() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('favoritos')
      .select(`
        articulo_id,
        articulos:articulo_id (
          id, titulo, descripcion, categoria, modalidad, precio, ubicacion, fotos
        )
      `)
      .eq('usuario_id', user.id)
      .order('creado_en', { ascending: false });

    if (error) throw error;

    // Extraer solo los datos de los artículos
    const favoritos = data.map(f => f.articulos).filter(a => a !== null);
    console.log(`❤️ Favoritos cargados: ${favoritos.length}`);
    
    return favoritos;

  } catch (error) {
    console.error('❌ Error al obtener favoritos:', error);
    return [];
  }
}

/**
 * Cuenta cuántos favoritos tiene el usuario
 * @returns {Promise<number>}
 */
export async function contarFavoritos() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('favoritos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.id);

    if (error) throw error;
    return count || 0;

  } catch (error) {
    console.error(' Error contando favoritos:', error);
    return 0;
  }
}

export default {
  inicializarFavoritos,
  agregarFavorito,
  eliminarFavorito,
  toggleFavorito,
  esFavorito,
  obtenerMisFavoritos,
  contarFavoritos
};