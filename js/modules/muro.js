/* ==========================================
   remarket-db - Módulo del Muro
   Carga y renderizado de publicaciones
   ========================================== */

import { CONFIG } from '../config.js';

/**
 * Carga publicaciones desde Supabase y las renderiza en el muro
 * @param {Object} filtros - Filtros opcionales (categoria, ubicacion, modalidad)
 */
export async function cargarPublicacionesEnMuro(filtros = {}) {
  const contenedor = document.getElementById('contenedor-publicaciones');
  const contador = document.getElementById('contador-resultados');
  
  if (!contenedor) return;

  // Mostrar loading
  contenedor.innerHTML = '<div class="loading">Cargando publicaciones...</div>';

  try {
    // Simulación de datos (después se conectará con Supabase)
    const publicaciones = obtenerPublicacionesSimuladas(filtros);

    // Actualizar contador
    if (contador) {
      contador.textContent = publicaciones.length;
    }

    // Renderizar resultados
    if (publicaciones.length === 0) {
      mostrarEstadoVacio(contenedor, filtros);
    } else {
      renderizarGridPublicaciones(contenedor, publicaciones);
    }

    console.log(`✅ ${publicaciones.length} publicaciones cargadas`);

  } catch (error) {
    console.error('❌ Error cargando publicaciones:', error);
    contenedor.innerHTML = '<div class="error">Error al cargar publicaciones. Intenta de nuevo.</div>';
  }
}

/**
 * Obtiene publicaciones simuladas (reemplazar con llamada a Supabase)
 */
function obtenerPublicacionesSimuladas(filtros) {
  // Datos de ejemplo
  const todas = [
    {
      id: 1,
      titulo: 'Bicicleta urbana en buen estado',
      descripcion: 'Bicicleta de 24 pulgadas, frenos funcionando. Ideal para la ciudad. La dono a quien la necesite.',
      categoria: 'Deportes',
      modalidad: 'donacion',
      precio: 0,
      ubicacion: 'Trujillo',
      alcance: 'local',
      autor: 'María López',
      fecha: 'Hace 2 horas',
      fotos: []
    },
    {
      id: 2,
      titulo: 'Lote de libros de colegio',
      descripcion: 'Libros de matemática y comunicación de 3ro de secundaria. Están como nuevos.',
      categoria: 'Libros',
      modalidad: 'trueque',
      precio: 0,
      ubicacion: 'Lima',
      alcance: 'regional',
      autor: 'Carlos Ruiz',
      fecha: 'Hace 5 horas',
      fotos: []
    },
    {
      id: 3,
      titulo: 'Servicio de reparación de celulares',
      descripcion: 'Técnico con experiencia repara pantallas y baterías. Pago justo o trueque por herramientas.',
      categoria: 'Servicios',
      modalidad: 'venta',
      precio: 50,
      ubicacion: 'Callao',
      alcance: 'local',
      autor: 'Ana Torres',
      fecha: 'Hace 1 día',
      fotos: []
    },
    {
      id: 4,
      titulo: 'Casaca roja talla M',
      descripcion: 'Casaca en buen estado, poco uso. Ideal para el invierno.',
      categoria: 'Ropa',
      modalidad: 'venta',
      precio: 45,
      ubicacion: 'Trujillo',
      alcance: 'local',
      autor: 'Pedro Sánchez',
      fecha: 'Hace 3 horas',
      fotos: []
    },
    {
      id: 5,
      titulo: 'Laptop Lenovo usada',
      descripcion: '8GB RAM, 256GB SSD. Funciona perfecto. Ideal para estudiantes.',
      categoria: 'Tecnología',
      modalidad: 'venta',
      precio: 1200,
      ubicacion: 'Trujillo',
      alcance: 'local',
      autor: 'Laura Mendoza',
      fecha: 'Hace 6 horas',
      fotos: []
    }
  ];

  // Aplicar filtros
  return todas.filter(pub => {
    if (filtros.categoria && pub.categoria !== filtros.categoria) return false;
    if (filtros.ubicacion && pub.ubicacion !== filtros.ubicacion) return false;
    if (filtros.modalidad && filtros.modalidad !== 'cualquiera' && pub.modalidad !== filtros.modalidad) return false;
    return true;
  });
}

/**
 * Renderiza las publicaciones en formato grid
 */
function renderizarGridPublicaciones(contenedor, publicaciones) {
  // Agrupar por categoría si hay variedad
  const porCategoria = publicaciones.reduce((acc, pub) => {
    if (!acc[pub.categoria]) acc[pub.categoria] = [];
    acc[pub.categoria].push(pub);
    return acc;
  }, {});

  let html = '<div class="grid-publicaciones">';

  if (Object.keys(porCategoria).length > 1) {
    // Múltiples categorías: mostrar agrupado
    for (const [categoria, items] of Object.entries(porCategoria)) {
      html += `
        <section class="categoria-seccion">
          <h2 class="categoria-titulo">
            ${getIconoCategoria(categoria)} ${categoria}
            <span class="contador">${items.length}</span>
          </h2>
          <div class="grid-publicaciones">
            ${items.map(pub => crearTarjetaPublicacion(pub)).join('')}
          </div>
        </section>
      `;
    }
  } else {
    // Una sola categoría o sin agrupar
    html += publicaciones.map(pub => crearTarjetaPublicacion(pub)).join('');
  }

  html += '</div>';
  contenedor.innerHTML = html;
}

/**
 * Crea el HTML de una tarjeta de publicación
 */
function crearTarjetaPublicacion(pub) {
  const modalidadInfo = CONFIG.MODALIDADES[pub.modalidad] || { icono: '', label: pub.modalidad };
  
  return `
    <article class="tarjeta-publicacion" data-id="${pub.id}">
      <div class="tarjeta-header">
        <div class="autor-info">
          <div class="avatar-placeholder" style="width:40px;height:40px;border-radius:50%;background:#ddd;display:flex;align-items:center;justify-content:center;">👤</div>
          <div class="autor-datos">
            <span class="autor-nombre">${pub.autor}</span>
            <span class="tiempo-publicacion">${pub.fecha}</span>
          </div>
        </div>
        <span class="badge-modalidad ${pub.modalidad}">
          ${modalidadInfo.icono} ${modalidadInfo.label}
        </span>
      </div>
      <div class="tarjeta-body">
        ${pub.fotos && pub.fotos.length > 0 ? `
          <div class="tarjeta-imagen">
            <img src="${pub.fotos[0]}" alt="${pub.titulo}" loading="lazy">
            ${pub.fotos.length > 1 ? `<span class="contador-fotos">+${pub.fotos.length - 1}</span>` : ''}
          </div>
        ` : '<div class="sin-imagen">📦</div>'}
        <div class="tarjeta-contenido">
          <h3>${pub.titulo}</h3>
          <p>${pub.descripcion.substring(0, 100)}${pub.descripcion.length > 100 ? '...' : ''}</p>
          <div class="tarjeta-meta">
            <span class="ubicacion">📍 ${pub.ubicacion}</span>
            ${pub.precio > 0 ? `<span class="precio">S/ ${pub.precio}</span>` : '<span class="precio">Gratis/Trueque</span>'}
          </div>
        </div>
      </div>
      <div class="tarjeta-footer">
        <button class="btn-qr" onclick="alert('QR de publicación ${pub.id}')">📱 QR</button>
        <button class="btn-contacto" onclick="alert('Contactar a ${pub.autor}')">💬 Contactar</button>
        <button class="btn-compartir" onclick="alert('Compartir publicación ${pub.id}')">🔗 Compartir</button>
      </div>
    </article>
  `;
}

/**
 * Muestra estado vacío cuando no hay resultados
 */
function mostrarEstadoVacio(contenedor, filtros) {
  const mensaje = filtros.categoria 
    ? `No hay publicaciones en ${filtros.categoria} en ${filtros.ubicacion || 'tu zona'}`
    : 'No hay publicaciones disponibles';
  
  contenedor.innerHTML = `
    <div class="estado-vacio">
      <div class="icono-vacio">🌱</div>
      <h3>${mensaje}</h3>
      <p>Sé el primero en publicar en esta categoría y localidad.</p>
      <button class="btn-primary" onclick="alert('Aquí se abriría el modal de publicar')">📦 Publicar ahora</button>
    </div>
  `;
}

/**
 * Obtiene el ícono de una categoría
 */
function getIconoCategoria(categoria) {
  const iconos = {
    'Tecnología': '💻',
    'Hogar': '🏠',
    'Ropa': '👕',
    'Deportes': '⚽',
    'Vehículos': '🚗',
    'Agro / Alimentos': '🌾',
    'Servicios': '🔧',
    'Libros': '📚',
    'Otros': '📦'
  };
  return iconos[categoria] || '📦';
}

/**
 * Filtra publicaciones por texto de búsqueda
 */
export function filtrarPorTexto(texto) {
  const contenedor = document.getElementById('contenedor-publicaciones');
  if (!contenedor) return;

  const tarjetas = contenedor.querySelectorAll('.tarjeta-publicacion');
  const textoLower = texto.toLowerCase();

  tarjetas.forEach(tarjeta => {
    const titulo = tarjeta.querySelector('h3').textContent.toLowerCase();
    const descripcion = tarjeta.querySelector('p').textContent.toLowerCase();
    
    if (titulo.includes(textoLower) || descripcion.includes(textoLower)) {
      tarjeta.style.display = '';
    } else {
      tarjeta.style.display = 'none';
    }
  });
}