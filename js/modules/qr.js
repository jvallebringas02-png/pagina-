/* ==========================================
   remarket-db - Módulo de Códigos QR
   Generar, mostrar y descargar QR
   ========================================== */

import { CONFIG } from '../config.js';

// Servicio gratuito para generar QR (sin API key)
const QR_SERVICE_URL = 'https://api.qrserver.com/v1/create-qr-code/';

/**
 * Inicializa el módulo de QR
 */
export function inicializarQR() {
  console.log('📱 Módulo de QR inicializado');
}

/**
 * Genera la URL de un código QR para una publicación
 * @param {string} publicacionId - ID de la publicación
 * @param {number} tamano - Tamaño en píxeles (default: 200)
 * @returns {string} URL de la imagen QR
 */
export function generarURLQR(publicacionId, tamano = 200) {
  const enlace = obtenerEnlacePublicacion(publicacionId);
  return `${QR_SERVICE_URL}?size=${tamano}x${tamano}&data=${encodeURIComponent(enlace)}&margin=10`;
}

/**
 * Obtiene el enlace público de una publicación
 * @param {string} publicacionId - ID de la publicación
 * @returns {string} URL completa
 */
export function obtenerEnlacePublicacion(publicacionId) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?publicacion=${publicacionId}`;
}

/**
 * Muestra el modal con el código QR de una publicación
 * @param {string} publicacionId - ID de la publicación
 * @param {string} titulo - Título de la publicación
 */
export function mostrarQR(publicacionId, titulo = 'Publicación') {
  console.log('📱 Mostrando QR para:', titulo);

  // Si existe el modal de QR en el DOM, actualizarlo
  const contenedorQR = document.getElementById('qr-imagen');
  const contenedorEnlace = document.getElementById('qr-enlace');
  const contenedorTitulo = document.getElementById('qr-titulo');

  if (contenedorQR) {
    const urlQR = generarURLQR(publicacionId, 250);
    contenedorQR.innerHTML = `<img src="${urlQR}" alt="QR de ${titulo}" style="width:250px;height:250px;">`;
  }

  if (contenedorEnlace) {
    contenedorEnlace.textContent = obtenerEnlacePublicacion(publicacionId);
  }

  if (contenedorTitulo) {
    contenedorTitulo.textContent = titulo;
  }

  // Abrir modal si existe la función
  if (typeof window.abrirModal === 'function') {
    window.abrirModal('qr', { id: publicacionId, titulo });
  }
}

/**
 * Descarga el código QR como imagen PNG
 * @param {string} publicacionId - ID de la publicación
 * @param {string} titulo - Título de la publicación
 */
export async function descargarQR(publicacionId, titulo = 'publicacion') {
  try {
    const urlQR = generarURLQR(publicacionId, 400);
    
    const response = await fetch(urlQR);
    if (!response.ok) throw new Error('Error al obtener el QR');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    // Nombre de archivo limpio
    const nombreArchivo = `qr-${titulo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ QR descargado:', nombreArchivo);
    return { success: true };

  } catch (error) {
    console.error('❌ Error al descargar QR:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Copia el enlace de la publicación al portapapeles
 * @param {string} publicacionId - ID de la publicación
 * @returns {Promise<boolean>}
 */
export async function copiarEnlace(publicacionId) {
  try {
    const enlace = obtenerEnlacePublicacion(publicacionId);
    await navigator.clipboard.writeText(enlace);
    console.log('✅ Enlace copiado:', enlace);
    return true;
  } catch (error) {
    console.error('❌ Error al copiar:', error);
    // Fallback para navegadores antiguos
    const textarea = document.createElement('textarea');
    textarea.value = obtenerEnlacePublicacion(publicacionId);
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

/**
 * Genera un QR con datos personalizados (para stickers físicos)
 * @param {Object} datos - Datos a codificar
 * @param {number} tamano - Tamaño en píxeles
 * @returns {string} URL del QR
 */
export function generarQRPersonalizado(datos, tamano = 300) {
  const texto = typeof datos === 'string' 
    ? datos 
    : JSON.stringify(datos);
  
  return `${QR_SERVICE_URL}?size=${tamano}x${tamano}&data=${encodeURIComponent(texto)}&margin=10&color=000000&bgcolor=ffffff`;
}

/**
 * Verifica si el navegador soporta la API de escaneo de QR (cámara)
 * @returns {boolean}
 */
export function soportaEscaneoQR() {
  return 'BarcodeDetector' in window || navigator.mediaDevices !== undefined;
}

/**
 * Escanea un código QR usando la cámara del dispositivo
 * @returns {Promise<string|null>} Contenido del QR escaneado
 */
export async function escanearQR() {
  if (!soportaEscaneoQR()) {
    alert('Tu navegador no soporta el escaneo de QR. Usa la cámara de tu teléfono.');
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    // Usar BarcodeDetector si está disponible
    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      
      return new Promise((resolve) => {
        const detectar = async () => {
          const codigos = await detector.detect(video);
          if (codigos.length > 0) {
            stream.getTracks().forEach(track => track.stop());
            resolve(codigos[0].rawValue);
          } else {
            requestAnimationFrame(detectar);
          }
        };
        detectar();
        
        // Timeout de 30 segundos
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          resolve(null);
        }, 30000);
      });
    }

  } catch (error) {
    console.error('❌ Error al escanear QR:', error);
    return null;
  }
}

export default {
  inicializarQR,
  generarURLQR,
  obtenerEnlacePublicacion,
  mostrarQR,
  descargarQR,
  copiarEnlace,
  generarQRPersonalizado,
  soportaEscaneoQR,
  escanearQR
};