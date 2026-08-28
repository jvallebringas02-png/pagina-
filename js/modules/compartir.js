/* ==========================================
   remarket-db - Módulo de Compartir
   Compartir publicaciones y generar QR
   ========================================== */

import { CONFIG } from '../config.js';

/**
 * Inicializa el módulo de compartir
 */
export function inicializarCompartir() {
  console.log('🔗 Módulo de compartir inicializado');
}

/**
 * Genera el enlace de una publicación
 * @param {string} publicacionId - ID de la publicación
 * @returns {string} URL completa
 */
export function generarEnlace(publicacionId) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?publicacion=${publicacionId}`;
}

/**
 * Copia el enlace al portapapeles
 * @param {string} publicacionId - ID de la publicación
 * @returns {Promise<boolean>} Si se copió correctamente
 */
export async function copiarEnlace(publicacionId) {
  try {
    const enlace = generarEnlace(publicacionId);
    
    await navigator.clipboard.writeText(enlace);
    
    console.log('✅ Enlace copiado:', enlace);
    return true;
  } catch (error) {
    console.error('❌ Error al copiar enlace:', error);
    
    // Fallback para navegadores antiguos
    const textarea = document.createElement('textarea');
    textarea.value = generarEnlace(publicacionId);
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    return true;
  }
}

/**
 * Comparte en redes sociales
 * @param {string} plataforma - 'facebook', 'twitter', 'whatsapp', 'telegram', 'email'
 * @param {Object} datos - Datos de la publicación
 */
export function compartirEnRedSocial(plataforma, datos) {
  const url = generarEnlace(datos.id);
  const texto = `${datos.titulo} - ${datos.descripcion?.substring(0, 100)}...`;
  
  let enlaceCompartir = '';
  
  switch (plataforma) {
    case 'facebook':
      enlaceCompartir = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      break;
    case 'twitter':
      enlaceCompartir = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
      break;
    case 'whatsapp':
      enlaceCompartir = `https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`;
      break;
    case 'telegram':
      enlaceCompartir = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto)}`;
      break;
    case 'email':
      enlaceCompartir = `mailto:?subject=${encodeURIComponent(datos.titulo)}&body=${encodeURIComponent(texto + '\n\n' + url)}`;
      break;
    default:
      console.error('Plataforma no soportada:', plataforma);
      return;
  }
  
  window.open(enlaceCompartir, '_blank', 'width=600,height=400');
  console.log(`📤 Compartido en ${plataforma}`);
}

/**
 * Genera un código QR para una publicación
 * @param {string} publicacionId - ID de la publicación
 * @returns {string} URL del servicio QR
 */
export function generarQR(publicacionId) {
  const enlace = generarEnlace(publicacionId);
  // Usar servicio gratuito de QR
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(enlace)}`;
}

/**
 * Descarga el código QR como imagen
 * @param {string} publicacionId - ID de la publicación
 * @param {string} titulo - Título de la publicación (para el nombre del archivo)
 */
export async function descargarQR(publicacionId, titulo = 'publicacion') {
  try {
    const qrUrl = generarQR(publicacionId);
    
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${titulo.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ QR descargado');
  } catch (error) {
    console.error('❌ Error al descargar QR:', error);
  }
}

/**
 * Muestra el modal de compartir con opciones
 * @param {Object} publicacion - Datos de la publicación
 */
export function mostrarOpcionesCompartir(publicacion) {
  const opciones = [
    { plataforma: 'whatsapp', icono: '', nombre: 'WhatsApp' },
    { plataforma: 'facebook', icono: '📘', nombre: 'Facebook' },
    { plataforma: 'twitter', icono: '🐦', nombre: 'Twitter' },
    { plataforma: 'telegram', icono: '✈️', nombre: 'Telegram' },
    { plataforma: 'email', icono: '📧', nombre: 'Email' },
    { plataforma: 'copiar', icono: '📋', nombre: 'Copiar enlace' }
  ];
  
  console.log(' Opciones de compartir para:', publicacion.titulo);
  
  // Aquí se abriría el modal de compartir
  // Por ahora, log de las opciones disponibles
  return opciones;
}

/**
 * Verifica si el navegador soporta Web Share API
 * @returns {boolean}
 */
export function soportaWebShare() {
  return navigator.share !== undefined;
}

/**
 * Usa Web Share API nativa (móviles)
 * @param {Object} datos - Datos a compartir
 */
export async function compartirNativo(datos) {
  if (!soportaWebShare()) {
    console.log('⚠️ Web Share API no soportada');
    return false;
  }
  
  try {
    await navigator.share({
      title: datos.titulo,
      text: datos.descripcion?.substring(0, 100),
      url: generarEnlace(datos.id)
    });
    
    console.log('✅ Compartido nativamente');
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('❌ Error en Web Share:', error);
    }
    return false;
  }
}

/**
 * Obtiene estadísticas de compartidos (simulado)
 * @param {string} publicacionId - ID de la publicación
 * @returns {Object} Estadísticas
 */
export function obtenerEstadisticasCompartidos(publicacionId) {
  // Simulación - en producción vendría de Supabase
  return {
    total: 0,
    porPlataforma: {
      whatsapp: 0,
      facebook: 0,
      twitter: 0,
      telegram: 0,
      email: 0,
      copiado: 0
    }
  };
}

export default {
  inicializarCompartir,
  generarEnlace,
  copiarEnlace,
  compartirEnRedSocial,
  generarQR,
  descargarQR,
  mostrarOpcionesCompartir,
  soportaWebShare,
  compartirNativo,
  obtenerEstadisticasCompartidos
};