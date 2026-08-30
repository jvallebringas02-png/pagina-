import CONFIG from './config.js';

// ==========================================
// SECCIÓN 1: DETECTOR DE UBICACIÓN
// ==========================================
async function detectarUbicacion() {
  try {
    const respuesta = await fetch('https://ip-api.com/json/?fields=country,city,lang');
    const datos = await respuesta.json();
    if (datos.status === 'success') {
      console.log("✅ Usuario detectado en:", datos.city, datos.country);
      document.getElementById('texto-ubicacion').innerText = `${datos.city}, ${datos.country}`;
      cargarMuroDinamico(datos.city, datos.country);
      if (datos.lang && datos.lang !== 'es') {
        traducirPagina(datos.lang);
      }
    } else {
      throw new Error("API de IP falló");
    }
  } catch (error) {
    console.error("❌ Error detectando IP:", error);
    document.getElementById('texto-ubicacion').innerText = "Callao, Perú";
    cargarMuroDinamico("Callao", "Perú");
  }
}

// ==========================================
// SECCIÓN 2: MURO DINÁMICO (BIENVENIDA)
// ==========================================
function cargarMuroDinamico(ciudad, pais) {
  const muro = document.getElementById('muro-publicaciones');
  const patrocinadores = document.getElementById('lista-patrocinadores');
  muro.innerHTML = `<p>🔍 Buscando artículos en <b>${ciudad}</b>...</p>`;
  setTimeout(() => {
    muro.innerHTML = `
      <div class="tarjeta-destacada"> 
        <h3>🌱 Bienvenido a la Economía Circular en ${ciudad}</h3> 
        <p>Aún no hay muchas publicaciones en tu zona. ¡Sé el primero en publicar!</p> 
      </div>`;
    if (patrocinadores) {
      patrocinadores.innerHTML = `<div class="patrocinador-vacio"><p>Espacio disponible para negocios de ${ciudad}</p></div>`;
    }
  }, 1500);
}

// ==========================================
// SECCIÓN 3: BÚSQUEDA MULTIMEDIA (Wikipedia + YouTube)
// ==========================================
async function buscarEnLaWebConMultimedia(query) {
  console.log(`🌐 Buscando multimedia para: "${query}"`);
  const resultados = { articulos: [], videos: [], query: query };
  
  try {
    // 1. Wikipedia (siempre funciona, gratis e ilimitado)
    const wikiResponse = await fetch(`https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrnamespace=0&gsrlimit=4&gsrsearch=${encodeURIComponent(query)}&prop=pageimages|extracts&pithumbsize=400&exintro&explaintext&exlimit=4&format=json&origin=*`);
    const wikiData = await wikiResponse.json();
    if (wikiData.query && wikiData.query.pages) {
      Object.values(wikiData.query.pages).forEach(page => {
        resultados.articulos.push({
          titulo: page.title,
          extracto: page.extract ? page.extract.substring(0, 200) : 'Sin descripción disponible.',
          imagen: page.thumbnail ? page.thumbnail.source : null,
          url: `https://es.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
          tipo: 'wikipedia'
        });
      });
    }
    
    // 2. YouTube - Método CORREGIDO
    if (CONFIG.YOUTUBE_API_KEY) {
      // Si tienes API key, usar búsqueda real
      const ytResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query)}&type=video&key=${CONFIG.YOUTUBE_API_KEY}`);
      const ytData = await ytResponse.json();
      if (ytData.items) {
        ytData.items.forEach(item => {
          resultados.videos.push({
            titulo: item.snippet.title,
            videoId: item.id.videoId,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
            tipo: 'youtube'
          });
        });
      }
    } else {
      // Fallback: mostrar enlace de búsqueda de YouTube (siempre funciona)
      resultados.videos.push({
        titulo: `🎥 Buscar "${query}" en YouTube`,
        embedUrl: null,
        searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        tipo: 'youtube-link'
      });
    }
    
    return resultados;
  } catch (error) {
    console.error(" Error buscando multimedia:", error);
    return null;
  }
}

// ==========================================
// SECCIÓN 4: BÚSQUEDA EN SUPABASE (PRODUCTOS REALES)
// ==========================================
async function buscarEnSupabase(query, ciudad) {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase no configurado");
    return [];
  }
  
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/articulos?or=(titulo.ilike.%${query}%,descripcion.ilike.%${query}%)&ciudad=eq.${ciudad}&limit=6`, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(item => ({
      titulo: item.titulo || 'Sin título',
      descripcion: item.descripcion || 'Sin descripción',
      precio: item.precio || 'Consultar',
      imagen: item.imagen_url || null,
      ciudad: item.ciudad || ciudad,
      id: item.id,
      tipo: 'producto'
    }));
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
    muro.innerHTML = `<div class="search-empty"><h3>🔍 No encontré resultados para "${query}"</h3><p>Intenta con otra palabra.</p></div>`;
    return;
  }
  
  // Tarjetas de Wikipedia
  const tarjetasHTML = resultados.articulos.map(art => `
    <a href="${art.url}" target="_blank" class="result-card">
      ${art.imagen ? `<img src="${art.imagen}" alt="${art.titulo}" class="card-img">` : '<div class="card-img-placeholder">📄</div>'}
      <div class="card-body">
        <h4>${art.titulo}</h4>
        <p>${art.extracto}</p>
        <span class="btn-leer">Leer más →</span>
      </div>
    </a>
  `).join('');
  
  // Videos de YouTube
  let videosHTML = '';
  if (resultados.videos.length > 0) {
    const primerVideo = resultados.videos[0];
    if (primerVideo.tipo === 'youtube-link') {
      videosHTML = `
        <div class="video-section">
          <h3>🎥 Videos relacionados</h3>
          <a href="${primerVideo.searchUrl}" target="_blank" class="youtube-link-card">
            <div class="youtube-icon">▶️</div>
            <div>
              <h4>${primerVideo.titulo}</h4>
              <p>Haz clic para ver videos en YouTube</p>
            </div>
          </a>
        </div>
      `;
    } else {
      videosHTML = `
        <div class="video-section">
          <h3>🎥 Videos relacionados</h3>
          <div class="video-container">
            <iframe width="100%" height="450" src="${primerVideo.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      `;
    }
  }
  
  muro.innerHTML = `
    <div class="multimedia-search">
      <h2 class="search-title">🔍 Resultados para: "${query}"</h2>
      <p class="search-subtitle">${resultados.articulos.length} artículos + videos encontrados</p>
      ${tarjetasHTML ? `<div class="results-grid">${tarjetasHTML}</div>` : ''}
      ${videosHTML}
    </div>
  `;
}

function mostrarProductosEnMuro(productos, query) {
  const muro = document.getElementById('muro-publicaciones');
  if (productos.length === 0) {
    muro.innerHTML = `
      <div class="search-empty">
        <h3>😕 No hay "${query}" disponible en tu zona</h3>
        <p>¿Quieres ser el primero en publicar uno?</p>
        <button class="btn-publicar">📸 Publicar ahora</button>
      </div>
    `;
    return;
  }
  
  const tarjetasHTML = productos.map(prod => `
    <div class="result-card producto-card">
      ${prod.imagen ? `<img src="${prod.imagen}" alt="${prod.titulo}" class="card-img">` : '<div class="card-img-placeholder">📦</div>'}
      <div class="card-body">
        <h4>${prod.titulo}</h4>
        <p>${prod.descripcion}</p>
        <div class="producto-meta">
          <span class="precio">💰 ${prod.precio}</span>
          <span class="ciudad"> ${prod.ciudad}</span>
        </div>
        <button class="btn-contactar">Contactar</button>
      </div>
    </div>
  `).join('');
  
  muro.innerHTML = `
    <div class="multimedia-search">
      <h2 class="search-title">🛍️ Productos: "${query}"</h2>
      <p class="search-subtitle">${productos.length} productos encontrados en tu zona</p>
      <div class="results-grid">${tarjetasHTML}</div>
    </div>
  `;
}

// ==========================================
// SECCIÓN 6: DETECTOR DE INTENCIÓN
// ==========================================
function detectarTipoDeBusqueda(texto) {
  const t = texto.toLowerCase();
  
  // Palabras de búsqueda web general
  const palabrasBusqueda = ['muéstrame', 'muestrame', 'busca', 'buscar', 'busco', 'qué es', 'que es', 'quién es', 'quien es', 'cómo', 'como', 'explicame', 'explícame', 'historia', 'información', 'video', 'videos', 'foro', 'página', 'pagina', 'noticias', 'últimas', 'actualidad', 'novedades', 'noticia', 'nuevo', 'nueva', 'youtube', 'dime sobre', 'dime de'];
  
  // Palabras de productos (Supabase)
  const palabrasPropias = ['vender', 'comprar', 'trueque', 'donar', 'publicar', 'bicicleta', 'ropa', 'celular', 'artículo', 'articulo', 'laptop', 'mueble', 'libro', 'zapato', 'carro', 'auto'];
  
  if (palabrasPropias.some(p => t.includes(p))) return 'PRODUCTOS';
  if (palabrasBusqueda.some(p => t.includes(p))) return 'WEB';
  return 'CONVERSACION';
}

// ==========================================
// SECCIÓN 7: ASISTENTE IA (CHAT)
// ==========================================
const chatInput = document.getElementById('chat-input');
const chatBtn = document.getElementById('chat-btn');
const chatHistorial = document.getElementById('chat-historial');

if (chatBtn) chatBtn.addEventListener('click', () => enviarMensajeIA());
if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensajeIA(); });

async function enviarMensajeIA() {
  const texto = chatInput.value.trim();
  if (!texto) return;
  
  chatHistorial.innerHTML += `<div class="msg-usuario">${texto}</div>`;
  chatInput.value = '';
  chatHistorial.innerHTML += `<div class="msg-ia" id="ia-escribiendo">🤖 Pensando...</div>`;
  
  try {
    const tipo = detectarTipoDeBusqueda(texto);
    const ubicacion = document.getElementById('texto-ubicacion').innerText || "Callao, Perú";
    const ciudad = ubicacion.split(',')[0].trim();
    
    // Si es búsqueda de productos → Supabase
    if (tipo === 'PRODUCTOS') {
      document.getElementById('ia-escribiendo').innerText = "🔍 Buscando productos...";
      const productos = await buscarEnSupabase(texto, ciudad);
      
      if (productos.length > 0) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += `<div class="msg-ia">¡Encontré ${productos.length} productos de "${texto}" en ${ciudad}! 🛍️ Los puedes ver en el panel central.</div>`;
        mostrarProductosEnMuro(productos, texto);
        return;
      } else {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += `<div class="msg-ia">Aún no hay "${texto}" en ${ciudad}, pero puedes ser el primero en publicar uno. 📸</div>`;
        return;
      }
    }
    
    // Si es búsqueda web → Wikipedia + YouTube
    if (tipo === 'WEB') {
      document.getElementById('ia-escribiendo').innerText = " Buscando en la web...";
      const resultados = await buscarEnLaWebConMultimedia(texto);
      if (resultados && (resultados.articulos.length > 0 || resultados.videos.length > 0)) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += `<div class="msg-ia">¡Encontré información sobre "${texto}"! 🎯 Te dejé artículos y videos en el panel central. 👇</div>`;
        mostrarResultadosMultimediaEnMuro(resultados, texto);
        return;
      }
    }
    
    // Si es conversación → IA
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mensajeEnriquecido = `[CONTEXTO: Usuario en ${ubicacion}, hora: ${horaActual}] ${texto}`;
    
    const respuestaIA = await llamarGroqConModeloDisponible(mensajeEnriquecido);
    document.getElementById('ia-escribiendo').remove();
    
    if (!respuestaIA || respuestaIA.trim().length < 5) {
      chatHistorial.innerHTML += `<div class="msg-ia">️ No pude generar una respuesta. Intenta de nuevo.</div>`;
    } else {
      chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
    }
  } catch (error) {
    console.error("❌ Error:", error);
    document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message;
  }
}

// ==========================================
// SECCIÓN 8: CASCADA DE MODELOS GROQ
// ==========================================
async function obtenerModelosDisponibles() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}` } });
    if (!response.ok) throw new Error('No se pudo obtener la lista');
    const data = await response.json();
    return data.data.filter(m => {
      const id = m.id.toLowerCase();
      return (id.includes('llama') || id.includes('gemma') || id.includes('mixtral') || id.includes('deepseek') || id.includes('qwen')) && !id.includes('classifier') && !id.includes('embed');
    }).map(m => m.id);
  } catch (error) {
    return ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  }
}

async function llamarGroqConModeloDisponible(mensaje) {
  const modelos = await obtenerModelosDisponibles();
  let ultimoError = null;
  
  for (let i = 0; i < modelos.length; i++) {
    const modelo = modelos[i];
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { 
              role: 'system', 
              content: `Eres el asistente virtual de remarket-db.

SOBRE remarket-db:
- Es una plataforma peruana de economía circular
- Los usuarios publican, venden, compran, truequean y donan artículos de segunda mano
- Objetivo: reutilizar en lugar de desechar, reducir desperdicios
- Ubicada principalmente en Callao, Perú

REGLAS OBLIGATORIAS:
1. Responde SIEMPRE en español
2. Sé BREVE: máximo 2-3 oraciones
3. Sé AMIGABLE y natural
4. NUNCA muestres tu proceso de pensamiento
5. NUNCA uses inglés
6. NUNCA digas "analizando", "pensando", "verificando", "constraints", "draft"
7. SOLO entrega la respuesta final limpia

EJEMPLOS CORRECTOS:
- Usuario: "hola" → Tú: "¡Hola! 👋 ¿En qué puedo ayudarte hoy?"
- Usuario: "qué es remarket-db" → Tú: "Es una plataforma de economía circular donde puedes publicar, vender o truequear artículos de segunda mano. 🌱"
- Usuario: "dime la hora" → Tú: "Son las [hora] en [ciudad]. ¿Necesitas algo más?"

EJEMPLOS INCORRECTOS (NUNCA HAGAS ESTO):
- "Here's a thinking process..."
- "Analyze User Input..."
- Respuestas en inglés
- Respuestas largas de más de 3 oraciones

FORMATO DE SALIDA: Solo el mensaje final. Nada más.`
            },
            { role: 'user', content: mensaje }
          ],
          temperature: 0.5,
          max_tokens: 200,
          presence_penalty: 0.5,
          frequency_penalty: 0.5
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        ultimoError = new Error(errorData.error?.message || `Error ${response.status}`);
        continue;
      }
      const data = await response.json();
      return limpiarRespuestaIA(data.choices[0].message.content);
    } catch (error) {
      ultimoError = error;
      continue;
    }
  }
  throw new Error(ultimoError?.message || 'Ningún modelo disponible');
}

// ==========================================
// SECCIÓN 9: FILTRO ULTRA-AGRESIVO
// ==========================================
function limpiarRespuestaIA(respuesta) {
  const patronesBasura = [
    /Here's a thinking process[:\s]*/gi,
    /User (is|in|at).*?(time|location|city|country)/gi,
    /likely a typo/gi,
    /No especificaste/gi,
    /what does.*promote/gi,
    /Analyze User/gi,
    /Draft response/gi,
    /Check constraints/gi,
    /Final Polish/gi,
    /Mental Draft/gi,
    /All rules satisfied/gi,
    /Output matches/gi,
    /Formulate Response/gi,
    /Identify Key/gi,
    /\[.*?\]/g,
    /^\d+\.\s/gm,
    /Spanish only/gi,
    /Brief, natural/gi,
    /conversational/gi,
    /Address the user/gi,
    /Max \d+-\d+ sentences/gi
  ];

  let textoLimpio = respuesta;
  patronesBasura.forEach(patron => { textoLimpio = textoLimpio.replace(patron, ''); });

  const lineas = textoLimpio.split('\n');
  const lineasValidas = [];
  for (let linea of lineas) {
    const l = linea.trim();
    const lower = l.toLowerCase();
    if (l.length < 15) continue;
    if (lower.includes('thinking') || lower.includes('process') || lower.includes('constraint') || lower.includes('draft') || lower.includes('user in') || lower.includes('response:') || lower.includes('analyze') || lower.includes('formulate')) continue;
    lineasValidas.push(l);
  }

  let respuestaFinal = lineasValidas.join(' ').replace(/\s+/g, ' ').replace(/\*\*/g, '').trim();
  return respuestaFinal.length < 20 ? "Hola, soy el asistente de remarket-db. ¿En qué puedo ayudarte hoy?" : respuestaFinal;
}

// ==========================================
// SECCIÓN 10: TRADUCTOR Y ESTILOS
// ==========================================
function traducirPagina(idioma) {
  if (idioma === 'en') document.querySelector('h1').innerText = 'Circular Economy Catalog';
  if (idioma === 'it') document.querySelector('h1').innerText = 'Catalogo di Economia Circolare';
}

function agregarEstilosBuscador() {
  if (document.getElementById('estilos-buscador')) return;
  const estilos = `
    <style id="estilos-buscador">
      .multimedia-search { padding: 20px; animation: fadeIn 0.5s ease; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .search-title { color: #2c3e50; margin-bottom: 5px; font-size: 24px; }
      .search-subtitle { color: #7f8c8d; margin-bottom: 25px; font-size: 14px; }
      .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
      .result-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-decoration: none; color: inherit; transition: all 0.3s ease; display: flex; flex-direction: column; }
      .result-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
      .card-img { width: 100%; height: 180px; object-fit: cover; }
      .card-img-placeholder { width: 100%; height: 180px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 60px; color: white; }
      .card-body { padding: 15px; flex-grow: 1; display: flex; flex-direction: column; }
      .card-body h4 { color: #2980b9; margin: 0 0 10px 0; font-size: 16px; }
      .card-body p { color: #555; font-size: 13px; line-height: 1.5; margin: 0 0 15px 0; flex-grow: 1; }
      .btn-leer { color: #27ae60; font-weight: bold; font-size: 13px; }
      .producto-meta { display: flex; justify-content: space-between; margin: 10px 0; font-size: 13px; }
      .precio { color: #27ae60; font-weight: bold; }
      .ciudad { color: #7f8c8d; }
      .btn-contactar { background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; margin-top: 10px; }
      .btn-contactar:hover { background: #229954; }
      .btn-publicar { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 15px; }
      .video-section { margin-top: 30px; }
      .video-section h3 { color: #2c3e50; margin-bottom: 15px; font-size: 20px; }
      .video-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
      .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      .youtube-link-card { display: flex; align-items: center; gap: 15px; background: #ff0000; color: white; padding: 20px; border-radius: 12px; text-decoration: none; transition: all 0.3s; }
      .youtube-link-card:hover { background: #cc0000; transform: translateY(-3px); }
      .youtube-icon { font-size: 40px; }
      .youtube-link-card h4 { margin: 0 0 5px 0; }
      .youtube-link-card p { margin: 0; font-size: 13px; opacity: 0.9; }
      .search-empty { text-align: center; padding: 40px; color: #7f8c8d; }
      @media (max-width: 768px) { .results-grid { grid-template-columns: 1fr; } .video-container { padding-bottom: 75%; } }
    </style>
  `;
  document.head.insertAdjacentHTML('beforeend', estilos);
}

agregarEstilosBuscador();

// ==========================================
// SECCIÓN 11: INICIO DEL SISTEMA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 remarket-db OS Iniciado");
  console.log("🔑 Groq API Key:", CONFIG.GROQ_API_KEY ? CONFIG.GROQ_API_KEY.substring(0, 15) + "..." : "NO CONFIGURADA");
  console.log("📊 Supabase:", CONFIG.SUPABASE_URL ? "Configurado" : "NO CONFIGURADO");
  console.log(" YouTube API:", CONFIG.YOUTUBE_API_KEY ? "Configurado" : "Usando fallback");
  detectarUbicacion();
});
