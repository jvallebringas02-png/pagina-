/* ==========================================
   remarket-db - Módulo Buscador (Fase 2)
   Búsqueda avanzada y filtros
   ========================================== */

import { supabase } from '../services/supabase-client.js';
import { CONFIG } from '../config.js';

/**
 * Inicializa el módulo buscador
 */
export function inicializarBuscador() {
  console.log('🔍 BuscadorMotor Fase 2 inicializado');
  configurarEventosBuscador();
}

/**
 * Configura los eventos de los inputs de búsqueda en el UI
 */
function configurarEventosBuscador() {
  const inputBuscador = document.getElementById('buscador');
  const selectCategoria = document.getElementById('filtro-categoria');

  if (inputBuscador) {
    // Búsqueda con debounce (espera 500ms después de que el usuario deje de escribir)
    let timeoutId;
    inputBuscador.addEventListener('input', (e) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        ejecutarBusqueda({ texto: e.target.value });
      }, 500);
    });
  }

  if (selectCategoria) {
    selectCategoria.addEventListener('change', (e) => {
      ejecutarBusqueda({ categoria: e.target.value });
    });
  }
}

/**
 * Ejecuta una búsqueda combinando filtros de UI y/o criterios de la IA
 * @param {Object} filtros - Objeto con los filtros a aplicar
 * @returns {Promise<Array>} Lista de artículos encontrados
 */
export async function ejecutarBusqueda(filtros = {}) {
  try {
    console.log('🔎 Ejecutando búsqueda con filtros:', filtros);

    let query = supabase
      .from('articulos')
      .select(`
        *,
        usuarios:usuario_id (nombre, foto_perfil, localidad)
      `)
      .eq('estado', 'activo');

    // 1. Filtro por texto (título o descripción)
    if (filtros.texto && filtros.texto.trim() !== '') {
      const texto = `%${filtros.texto.trim()}%`;
      // Usamos or para buscar en título y descripción
      query = query.or(`titulo.ilike.${texto},descripcion.ilike.${texto}`);
    }

    // 2. Filtro por categoría
    if (filtros.categoria && filtros.categoria !== '') {
      query = query.eq('categoria', filtros.categoria);
    }

    // 3. Filtro por ubicación (localidad)
    if (filtros.ubicacion && filtros.ubicacion !== '') {
      query = query.eq('ubicacion', filtros.ubicacion);
    }

    // 4. Filtro por modalidad
    if (filtros.modalidad && filtros.modalidad !== 'cualquiera') {
      query = query.eq('modalidad', filtros.modalidad);
    }

    // 5. Filtro por alcance
    if (filtros.alcance) {
      query = query.eq('alcance', filtros.alcance);
    }

    // Ordenar por más recientes
    query = query.order('creado_en', { ascending: false });

    // Limitar resultados (paginación básica)
    query = query.limit(50);

    const { data, error } = await query;

    if (error) throw error;

    console.log(`✅ Búsqueda completada: ${data?.length || 0} resultados`);
    
    // Disparar evento personalizado para que el muro se actualice
    window.dispatchEvent(new CustomEvent('resultados-busqueda', {
      detail: data || []
    }));

    return data || [];

  } catch (error) {
    console.error('❌ Error en el buscador:', error);
    return [];
  }
}

/**
 * Busca artículos cercanos a una ubicación específica
 * @param {string} ubicacion - Nombre de la localidad
 * @param {number} radio - Radio de búsqueda (simulado por ahora)
 * @returns {Promise<Array>}
 */
export async function buscarCercanos(ubicacion, radio = 10) {
  console.log(`📍 Buscando artículos cercanos a ${ubicacion} (radio ${radio}km)`);
  
  // Por ahora, busca en la misma ubicación
  // En el futuro, esto usará coordenadas GPS y PostGIS en Supabase
  return ejecutarBusqueda({ ubicacion });
}

/**
 * Obtiene sugerencias de búsqueda (autocompletado)
 * @param {string} texto - Texto parcial
 * @returns {Promise<Array>} Lista de sugerencias
 */
export async function obtenerSugerencias(texto) {
  if (!texto || texto.length < 2) return [];

  try {
    const { data, error } = await supabase
      .from('articulos')
      .select('titulo, categoria')
      .ilike('titulo', `%${texto}%`)
      .limit(5);

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error('❌ Error obteniendo sugerencias:', error);
    return [];
  }
}

/**
 * Limpia todos los filtros de búsqueda
 */
export function limpiarFiltros() {
  const inputBuscador = document.getElementById('buscador');
  const selectCategoria = document.getElementById('filtro-categoria');

  if (inputBuscador) inputBuscador.value = '';
  if (selectCategoria) selectCategoria.value = '';

  console.log('🧹 Filtros limpiados');
  ejecutarBusqueda({});
}

export default {
  inicializarBuscador,
  ejecutarBusqueda,
  buscarCercanos,
  obtenerSugerencias,
  limpiarFiltros
};