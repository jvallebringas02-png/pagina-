import CONFIG from './config.js';

// ==========================================
// SECCIÓN 1: DETECTOR DE UBICACIÓN (CORREGIDO)
// ==========================================
async function detectarUbicacion() {
  try {
    const respuesta = await fetch('https://ipapi.co/json/');
    const datos = await respuesta.json();
    if (datos.error) {
      throw new Error("API de IP falló: " + datos.error);
    }
    console.log("✅ Usuario detectado en:", datos.city, datos.country);
    document.getElementById('texto-ubicacion').innerText = datos.city + ', ' + datos.country;
    cargarMuroDinamico(datos.city, datos.country);
  } catch (error) {
    console.error("❌ Error detectando IP:", error);
    document.getElementById('texto-ubicacion').innerText = "Callao, Perú";
    cargarMuroDinamico("Callao", "Perú");
  }
}

// ==========================================
// SECCIÓN 2: MURO DINÁMICO
// ==========================================
function cargarMuroDinamico(ciudad, pais) {
  const muro = document.getElementById('muro-publicaciones');
  const patrocinadores = document.getElementById('lista-patrocinadores');
  muro.innerHTML = '<p>🔍 Buscando artículos en <b>' + ciudad + '</b>...</p>';
  setTimeout(function() {
    muro.innerHTML = '<div class="tarjeta-destacada"><h3> Bienvenido a la Economía Circular en ' + ciudad + '</h3><p>Aún no hay muchas publicaciones en tu zona. ¡Sé el primero en publicar!</p></div>';
    if (patrocinadores) {
      patrocinadores.innerHTML = '<div class="patrocinador-vacio"><p>Espacio disponible para negocios de ' + ciudad + '</p></div>';
    }
  }, 1500);
}

// ==========================================
// SECCIÓN 3: BÚSQUEDA MULTIMEDIA
// ==========================================
async function buscarEnLaWebConMultimedia(query) {
  console.log("🌐 Buscando multimedia para:", query);
  const resultados = { articulos: [], videos: [], query: query };
  
  try {
    const wikiResponse = await fetch('https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrnamespace=0&gsrlimit=4&gsrsearch=' + encodeURIComponent(query) + '&prop=pageimages|extracts&pithumbsize=400&exintro&explaintext&exlimit=4&format=json&origin=*');
    const wikiData = await wikiResponse.json();
    if (wikiData.query && wikiData.query.pages) {
      Object.values(wikiData.query.pages).forEach(function(page) {
        resultados.articulos.push({
          titulo: page.title,
          extracto: page.extract ? page.extract.substring(0, 200) : 'Sin descripción disponible.',
          imagen: page.thumbnail ? page.thumbnail.source : null,
          url: 'https://es.wikipedia.org/wiki/' + encodeURIComponent(page.title.replace(/ /g, '_')),
          tipo: 'wikipedia'
        });
      });
    }
    
    resultados.videos.push({
      titulo: '🎥 Videos sobre "' + query + '"',
      embedUrl: null,
      searchUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
      tipo: 'youtube-link'
    });
    
    return resultados;
  } catch (error) {
    console.error(" Error buscando multimedia:", error);
    return null;
  }
}

// ==========================================
// SECCIÓN 4: BÚSQUEDA EN SUPABASE
// ==========================================
async function buscarEnSupabase(query, ciudad) {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase no configurado");
    return [];
  }
  
  try {
    const response = await fetch(CONFIG.SUPABASE_URL + '/rest/v1/articulos?or=(titulo.ilike.%' + query + '%,descripcion.ilike.%' + query + '%)&limit=6', {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY
      }
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(function(item) {
      return {
        titulo: item.titulo || 'Sin título',
        descripcion: item.descripcion || 'Sin descripción',
        precio: item.precio || 'Consultar',
        imagen: item.imagen_url || null,
        ciudad: item.ciudad || ciudad,
        id: item.id,
        tipo: 'producto'
      };
    });
  } catch (error) {
    console.error("❌ Error buscando en Supabase:", error);
    return [];
  }
}

// ==========================================
// SECCIÓN 5: PINTAR RESULTADOS EN EL MURO
// ==========================================
function mostrarResultadosMultimediaEnMuro(resultados, query) {
  const muro = document.getElementById('muro-publicaciones');
  if (!resultados || (resultados.articulos.length === 0 && resultados.videos.length === 0)) {
    muro.innerHTML = '<div class="search-empty"><h3>🔍 No encontré resultados para "' + query + '"</h3><p>Intenta con otra palabra.</p></div>';
    return;
  }
  
  var tarjetasHTML = resultados.articulos.map(function(art) {
    return '<a href="' + art.url + '" target="_blank" class="result-card">' + 
      (art.imagen ? '<img src="' + art.imagen + '" alt="' + art.titulo + '" class="card-img">' : '<div class="card-img-placeholder">📄</div>') +
      '<div class="card-body"><h4>' + art.titulo + '</h4><p>' + art.extracto + '</p><span class="btn-leer">Leer más →</span></div></a>';
  }).join('');
  
  var videosHTML = '';
  if (resultados.videos.length > 0) {
    var primerVideo = resultados.videos[0];
    if (primerVideo.tipo === 'youtube-link') {
      videosHTML = '<div class="video-section"><h3>🎥 Videos relacionados</h3><a href="' + primerVideo.searchUrl + '" target="_blank" class="youtube-link-card"><div class="youtube-icon">▶️</div><div><h4>' + primerVideo.titulo + '</h4><p>Haz clic para ver videos en YouTube</p></div></a></div>';
    }
  }
  
  muro.innerHTML = '<div class="multimedia-search"><h2 class="search-title">🔍 Resultados para: "' + query + '"</h2><p class="search-subtitle">' + resultados.articulos.length + ' artículos + videos encontrados</p>' + 
    (tarjetasHTML ? '<div class="results-grid">' + tarjetasHTML + '</div>' : '') + videosHTML + '</div>';
}

function mostrarProductosEnMuro(productos, query) {
  const muro = document.getElementById('muro-publicaciones');
  if (productos.length === 0) {
    muro.innerHTML = '<div class="search-empty"><h3>😕 No hay "' + query + '" disponible en tu zona</h3><p>¿Quieres ser el primero en publicar uno?</p></div>';
    return;
  }
  
  var tarjetasHTML = productos.map(function(prod) {
    return '<div class="result-card producto-card">' + 
      (prod.imagen ? '<img src="' + prod.imagen + '" alt="' + prod.titulo + '" class="card-img">' : '<div class="card-img-placeholder">📦</div>') +
      '<div class="card-body"><h4>' + prod.titulo + '</h4><p>' + prod.descripcion + '</p><div class="producto-meta"><span class="precio">💰 ' + prod.precio + '</span><span class="ciudad">📍 ' + prod.ciudad + '</span></div><button class="btn-contactar">Contactar</button></div></div>';
  }).join('');
  
  muro.innerHTML = '<div class="multimedia-search"><h2 class="search-title">️ Productos: "' + query + '"</h2><p class="search-subtitle">' + productos.length + ' productos encontrados</p><div class="results-grid">' + tarjetasHTML + '</div></div>';
}

// ==========================================
// SECCIÓN 6: DETECTOR DE INTENCIÓN
// ==========================================
function detectarTipoDeBusqueda(texto) {
  const t = texto.toLowerCase();
  const palabrasBusqueda = ['muéstrame', 'muestrame', 'busca', 'buscar', 'busco', 'qué es', 'que es', 'quién es', 'quien es', 'cómo', 'como', 'explicame', 'explícame', 'historia', 'información', 'video', 'videos', 'foro', 'noticias', 'últimas', 'actualidad', 'novedades', 'noticia', 'nuevo', 'nueva', 'youtube'];
  const palabrasPropias = ['vender', 'comprar', 'trueque', 'donar', 'publicar', 'bicicleta', 'ropa', 'celular', 'artículo', 'articulo', 'laptop', 'mueble', 'libro', 'zapato', 'carro', 'auto'];
  
  if (palabrasPropias.some(function(p) { return t.includes(p); })) return 'PRODUCTOS';
  if (palabrasBusqueda.some(function(p) { return t.includes(p); })) return 'WEB';
  return 'CONVERSACION';
}

// ==========================================
// SECCIÓN 7: ASISTENTE IA
// ==========================================
const chatInput = document.getElementById('chat-input');
const chatBtn = document.getElementById('chat-btn');
const chatHistorial = document.getElementById('chat-historial');

if (chatBtn) chatBtn.addEventListener('click', enviarMensajeIA);
if (chatInput) chatInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') enviarMensajeIA(); });

async function enviarMensajeIA() {
  const texto = chatInput.value.trim();
  if (!texto) return;
  
  chatHistorial.innerHTML += '<div class="msg-usuario">' + texto + '</div>';
  chatInput.value = '';
  chatHistorial.innerHTML += '<div class="msg-ia" id="ia-escribiendo">🤖 Pensando...</div>';
  
  try {
    const tipo = detectarTipoDeBusqueda(texto);
    const ubicacion = document.getElementById('texto-ubicacion').innerText || "Callao, Perú";
    const ciudad = ubicacion.split(',')[0].trim();
    
    // DETECTOR DE PREGUNTAS SOBRE REMARKET-DB
    const preguntasSobrePlataforma = ['que ofrece', 'qué ofrece', 'que es remarket', 'qué es remarket', 'sobre la pagina', 'sobre la página', 'sobre remarket', 'de que trata', 'de qué trata', 'para que sirve', 'para qué sirve', 'como funciona', 'cómo funciona', 'que hace', 'qué hace', 'que venden', 'qué venden', 'que puedo hacer', 'qué puedo hacer'];
    const esSobrePlataforma = preguntasSobrePlataforma.some(function(p) { return texto.toLowerCase().includes(p); });
    
    if (esSobrePlataforma) {
      document.getElementById('ia-escribiendo').remove();
      chatHistorial.innerHTML += '<div class="msg-ia">remarket-db es una plataforma peruana de economía circular  donde puedes:<br><br>✅ <b>Publicar</b> artículos de segunda mano<br>✅ <b>Vender</b> o <b>comprar</b> productos usados<br>✅ <b>Truequear</b> objetos sin usar dinero<br>✅ <b>Donar</b> lo que ya no necesitas<br><br>Todo esto ayuda a reutilizar en lugar de botar a la basura. ♻️<br><br>¿Quieres publicar algo o buscar algún artículo?</div>';
      return;
    }
    
    if (tipo === 'PRODUCTOS') {
      document.getElementById('ia-escribiendo').innerText = "🔍 Buscando productos...";
      const productos = await buscarEnSupabase(texto, ciudad);
      if (productos.length > 0) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">¡Encontré ' + productos.length + ' productos de "' + texto + '" en ' + ciudad + '! 🛍️ Los puedes ver en el panel central.</div>';
        mostrarProductosEnMuro(productos, texto);
        return;
      } else {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">Aún no hay "' + texto + '" en ' + ciudad + ', pero puedes ser el primero en publicar uno. </div>';
        return;
      }
    }
    
    if (tipo === 'WEB') {
      document.getElementById('ia-escribiendo').innerText = "🌐 Buscando en la web...";
      const resultados = await buscarEnLaWebConMultimedia(texto);
      if (resultados && (resultados.articulos.length > 0 || resultados.videos.length > 0)) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">¡Encontré información sobre "' + texto + '"!  Te dejé artículos y videos en el panel central. 👇</div>';
        mostrarResultadosMultimediaEnMuro(resultados, texto);
        return;
      }
    }
    
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mensajeEnriquecido = '[CONTEXTO: Usuario en ' + ubicacion + ', hora: ' + horaActual + '] ' + texto;
    const respuestaIA = await llamarGroqConModeloDisponible(mensajeEnriquecido);
    document.getElementById('ia-escribiendo').remove();
    
    if (!respuestaIA || respuestaIA.trim().length < 5) {
      chatHistorial.innerHTML += '<div class="msg-ia">⚠️ No pude generar una respuesta. Intenta de nuevo.</div>';
    } else {
      chatHistorial.innerHTML += '<div class="msg-ia">' + respuestaIA + '</div>';
    }
  } catch (error) {
    console.error("❌ Error:", error);
    document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message
