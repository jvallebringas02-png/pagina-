/* ==========================================
   remarket-db - Aplicación Principal
   Orquestador de módulos
   ========================================== */

import { CONFIG } from './config.js';

// Estado global de la aplicación
const state = {
  usuario: null,
  chatHistory: [],
  publicaciones: []
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log(' Iniciando remarket-db...');
  inicializarInterfaz();
  cargarDatosIniciales();
});

function inicializarInterfaz() {
  // Configurar botones de idioma
  document.querySelectorAll('.idioma-opcion').forEach(opcion => {
    opcion.addEventListener('click', (e) => {
      const idioma = e.target.dataset.idioma;
      cambiarIdioma(idioma);
    });
  });

  // Configurar buscador
  const buscador = document.getElementById('buscador');
  if (buscador) {
    buscador.addEventListener('input', (e) => {
      filtrarPublicaciones(e.target.value);
    });
  }

  // Configurar filtro de categoría
  const filtroCategoria = document.getElementById('filtro-categoria');
  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', (e) => {
      filtrarPorCategoria(e.target.value);
    });
  }

  console.log('✅ Interfaz inicializada');
}

function cargarDatosIniciales() {
  // Simulación de carga de datos (aquí iría la llamada a Supabase)
  console.log('📡 Conectando con Supabase...');
  
  // Simular publicaciones para prueba
  state.publicaciones = [
    {
      id: 1,
      titulo: 'Bicicleta urbana en buen estado',
      descripcion: 'Bicicleta de 24 pulgadas, frenos funcionando. Ideal para la ciudad.',
      categoria: 'Deportes',
      modalidad: 'donacion',
      precio: 0,
      ubicacion: 'Trujillo',
      autor: 'María López',
      fecha: 'Hace 2 horas'
    },
    {
      id: 2,
      titulo: 'Lote de libros de colegio',
      descripcion: 'Libros de matemática y comunicación de 3ro de secundaria.',
      categoria: 'Libros',
      modalidad: 'trueque',
      precio: 0,
      ubicacion: 'Lima',
      autor: 'Carlos Ruiz',
      fecha: 'Hace 5 horas'
    }
  ];

  renderizarPublicaciones(state.publicaciones);
  console.log('✅ Datos cargados:', state.publicaciones.length);
}

function renderizarPublicaciones(lista) {
  const contenedor = document.getElementById('contenedor-publicaciones');
  const contador = document.getElementById('contador-resultados');
  
  if (contador) {
    contador.textContent = lista.length;
  }

  if (!contenedor) return;

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="estado-vacio">
        <div class="icono-vacio">🌱</div>
        <h3>¡Sé el primero en tu zona!</h3>
        <p>Aún no hay publicaciones que coincidan con tu búsqueda.</p>
        <button class="btn-primary" onclick="alert('Aquí se abriría el modal de publicar')">📦 Publicar mi primer artículo</button>
      </div>
    `;
    return;
  }

  const html = lista.map(pub => `
    <article class="tarjeta-publicacion">
      <div class="tarjeta-header">
        <div class="autor-info">
          <div class="avatar-placeholder" style="width:40px;height:40px;border-radius:50%;background:#ddd;display:flex;align-items:center;justify-content:center;">👤</div>
          <div class="autor-datos">
            <span class="autor-nombre">${pub.autor}</span>
            <span class="tiempo-publicacion">${pub.fecha}</span>
          </div>
        </div>
        <span class="badge-modalidad ${pub.modalidad}">
          ${CONFIG.MODALIDADES[pub.modalidad]?.icono || ''} ${CONFIG.MODALIDADES[pub.modalidad]?.label || pub.modalidad}
        </span>
      </div>
      <div class="tarjeta-contenido">
        <h3>${pub.titulo}</h3>
        <p>${pub.descripcion}</p>
        <div class="tarjeta-meta">
          <span class="ubicacion">📍 ${pub.ubicacion}</span>
          ${pub.precio > 0 ? `<span class="precio">S/ ${pub.precio}</span>` : '<span class="precio">Gratis/Trueque</span>'}
        </div>
      </div>
      <div class="tarjeta-footer">
        <button class="btn-qr">📱 QR</button>
        <button class="btn-contacto">💬 Contactar</button>
        <button class="btn-compartir">🔗 Compartir</button>
      </div>
    </article>
  `).join('');

  contenedor.innerHTML = `<div class="grid-publicaciones">${html}</div>`;
}

function filtrarPublicaciones(texto) {
  const filtradas = state.publicaciones.filter(pub => 
    pub.titulo.toLowerCase().includes(texto.toLowerCase()) ||
    pub.descripcion.toLowerCase().includes(texto.toLowerCase())
  );
  renderizarPublicaciones(filtradas);
}

function filtrarPorCategoria(categoria) {
  if (!categoria) {
    renderizarPublicaciones(state.publicaciones);
    return;
  }
  const filtradas = state.publicaciones.filter(pub => pub.categoria === categoria);
  renderizarPublicaciones(filtradas);
}

function cambiarIdioma(codigo) {
  console.log('🌐 Cambiando idioma a:', codigo);
  // Aquí iría la lógica de traducción
  alert(`Idioma cambiado a: ${codigo} (Función en desarrollo)`);
}

// Hacer funciones disponibles globalmente para los onclick del HTML
window.abrirModal = (tipo) => {
  console.log('📦 Abriendo modal:', tipo);
  alert(`Modal de ${tipo} (Se cargará desde templates/)`);
};

window.cerrarSesion = () => {
  console.log('🚪 Cerrando sesión...');
  alert('Sesión cerrada');
};