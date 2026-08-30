import CONFIG from './config.js';

// ==========================================
// 1. DETECTOR DE IP
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
// 2. EL MURO DINÁMICO
// ==========================================
function cargarMuroDinamico(ciudad, pais) {
  const muro = document.getElementById('muro-publicaciones');
  const patrocinadores = document.getElementById('lista-patrocinadores');
  muro.innerHTML = `<p>🔍 Buscando artículos en <b>${ciudad}</b>...</p>`;
  setTimeout(() => {
    muro.innerHTML = `<div class="tarjeta-destacada"> <h3>🌱 Bienvenido a la Economía Circular en ${ciudad}</h3> <p>Aún no hay muchas publicaciones en tu zona. ¡Sé el primero en publicar!</p> </div>`;
    if (patrocinadores) {
      patrocinadores.innerHTML = `
        <div class="patrocinador-vacio">
          <p>Espacio disponible para negocios de ${ciudad}</p>
        </div>
      `;
    }
  }, 1500);
}

// ==========================================
// 3. 🌐 BÚSQUEDA MULTIMEDIA (Wikipedia + YouTube)
// ==========================================
async function buscarEnLaWebConMultimedia(query) {
  console.log(`🌐 Buscando multimedia para: "${query}"`);
  
  const resultados = {
    articulos: [],
    videoQuery: query
  };
  
  try {
    const wikiResponse = await fetch(
      `https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrnamespace=0&gsrlimit=6&gsrsearch=${encodeURIComponent(query)}&prop=pageimages|extracts&pithumbsize=400&exintro&explaintext&exlimit=6&format=json&origin=*`
    );
    const wikiData = await wikiResponse.json();
    
    if (wikiData.query && wikiData.query.pages) {
      const pages = Object.values(wikiData.query.pages);
      
      pages.forEach(page => {
        resultados.articulos.push({
          titulo: page.title,
          extracto: page.extract ? page.extract.substring(0, 200) : 'Sin descripción disponible.',
          imagen: page.thumbnail ? page.thumbnail.source : null,
          url: `https://es.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`
        });
      });
    }
    
    console.log(`✅ Encontrados ${resultados.articulos.length} artículos`);
    return resultados;
    
  } catch (error) {
    console.error("❌ Error buscando multimedia:", error);
    return null;
  }
}

// ==========================================
// 4. 🎨 PINTAR RESULTADOS EN EL MURO
// ==========================================
function mostrarResultadosMultimediaEnMuro(resultados, query) {
  const muro = document.getElementById('muro-publicaciones');
  
  if (!resultados || resultados.articulos.length === 0) {
    muro.innerHTML = `
      <div class="search-empty">
        <h3>🔍 No encontré resultados para "${query}"</h3>
        <p>Intenta con otra palabra o pregunta.</p>
      </div>
    `;
    return;
  }
  
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
  
  const videoHTML = `
    <div class="video-section">
      <h3>🎥 Videos relacionados</h3>
      <div class="video-container">
        <iframe 
          width="100%" 
          height="315" 
          src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    </div>
  `;
  
  muro.innerHTML = `
    <div class="multimedia-search">
      <h2 class="search-title">🔍 Resultados para: "${query}"</h2>
      <p class="search-subtitle">${resultados.articulos.length} artículos encontrados</p>
      
      <div class="results-grid">
        ${tarjetasHTML}
      </div>
      
      ${videoHTML}
    </div>
  `;
}

// ==========================================
// 5. 🧠 DETECTOR DE INTENCIÓN (MEJORADO)
// ==========================================
function detectarTipoDeBusqueda(texto) {
  const t = texto.toLowerCase();
  
  // Palabras que indican búsqueda web general
  const palabrasBusqueda = [
    'muéstrame', 'muestrame', 'busca', 'buscar', 'busco',
    'qué es', 'que es', 'quién es', 'quien es', 'cómo', 'como',
    'explicame', 'explícame', 'historia', 'información',
    'video', 'videos', 'foro', 'página', 'pagina',
    'noticias', 'últimas', 'actualidad', 'novedades',
    'noticia', 'nuevo', 'nueva'
  ];
  
  // Palabras que son de remarket-db (productos)
  const palabrasPropias = [
    'vender', 'comprar', 'trueque', 'donar', 'publicar',
    'bicicleta', 'ropa', 'celular', 'artículo', 'articulo'
  ];
  
  if (palabrasPropias.some(p => t.includes(p))) return 'PRODUCTOS';
  if (palabrasBusqueda.some(p => t.includes(p))) return 'WEB';
  return 'CONVERSACION';
}

// ==========================================
// 6. ASISTENTE IA
// ==========================================
const chatInput = document.getElementById('chat-input');
const chatBtn = document.getElementById('chat-btn');
const chatHistorial = document.getElementById('chat-historial');

if (chatBtn) {
  chatBtn.addEventListener('click', () => enviarMensajeIA());
}
if (chatInput) {
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarMensajeIA();
  });
}

async function enviarMensajeIA() {
  const texto = chatInput.value.trim();
  if (!texto) return;
  
  chatHistorial.innerHTML += `<div class="msg-usuario">${texto}</div>`;
  chatInput.value = '';
  chatHistorial.innerHTML += `<div class="msg-ia" id="ia-escribiendo">🤖 Pensando...</div>`;
  
  try {
    const tipo = detectarTipoDeBusqueda(texto);
    
    if (tipo === 'WEB') {
      document.getElementById('ia-escribiendo').innerText = "🌐 Buscando en la web...";
      const resultados = await buscarEnLaWebConMultimedia(texto);
      
      if (resultados && resultados.articulos.length > 0) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += `<div class="msg-ia">¡Encontré información sobre "${texto}"! 🎯 Te dejé artículos, imágenes y videos en el panel central. Échales un vistazo. 👇</div>`;
        mostrarResultadosMultimediaEnMuro(resultados, texto);
        return;
      }
    }
    
    const ubicacion = document.getElementById('texto-ubicacion').innerText || "Desconocida";
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mensajeEnriquecido = `[CONTEXTO: Usuario en ${ubicacion}, hora: ${horaActual}] ${texto}`;
    
    const respuestaIA = await llamarGroqConModeloDisponible(mensajeEnriquecido);
    document.getElementById('ia-escribiendo').remove();
    
    if (!respuestaIA || respuestaIA.trim().length < 5) {
      chatHistorial.innerHTML += `<div class="msg-ia">⚠️ La IA no generó una respuesta válida. Intenta de nuevo.</div>`;
    } else {
      chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
    }
    
    actualizarMuroPorIA(texto);
    
  } catch (error) {
    console.error("❌ Error de IA:", error);
    document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message;
  }
}

// ==========================================
// 7. CASCADA DE MODELOS GROQ
// ==========================================
async function obtenerModelosDisponibles() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}` }
    });
    if (!response.ok) throw new Error('No se pudo obtener la lista');
    
    const data = await response.json();
    const modelos = data.data || [];
    
    const modelosChat = modelos.filter(m => {
      const id = m.id.toLowerCase();
      const esChat = id.includes('llama') || id.includes('gemma') || id.includes('mixtral') || id.includes('deepseek') || id.includes('qwen');
      const noEsClasificacion = !id.includes('classifier') && !id.includes('embed');
      return esChat && noEsClasificacion;
    });
    
    return modelosChat.map(m => m.id);
  } catch (error) {
    console.error("❌ Error obteniendo modelos:", error);
    return [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ];
  }
}

async function llamarGroqConModeloDisponible(mensaje) {
  const modelos = await obtenerModelosDisponibles();
  if (modelos.length === 0) throw new Error('No hay modelos disponibles');
  
  let ultimoError = null;
  
  for (let i = 0; i < modelos.length; i++) {
    const modelo = modelos[i];
    try {
      console.log(`🔄 [Intento ${i + 1}] Probando: ${modelo}`);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { 
              role: 'system', 
              content: `Eres el asistente de remarket-db. Responde en español de forma BREVE y NATURAL (máximo 2-3 oraciones). NUNCA repitas el mismo mensaje. NUNCA muestres texto técnico como "constraints met", "proceed", "[Done]", "Analyze User". SOLO da la respuesta final limpia. Si te preguntan por noticias, clima o información general, responde brevemente y sugiere buscar más detalles.`
            },
            { role: 'user', content: mensaje }
          ],
          temperature: 0.8,
          max_tokens: 300,
          presence_penalty: 0.6,
          frequency_penalty: 0.5
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn(`⚠️ ${modelo} falló:`, errorData.error?.message);
        ultimoError = new Error(errorData.error?.message || `Error ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ ¡ÉXITO con ${modelo}!`);
      
      if (data.error) throw new Error(data.error.message);
      
      let respuestaFinal = data.choices[0].message.content;
      respuestaFinal = limpiarRespuestaIA(respuestaFinal);
      
      return respuestaFinal;
      
    } catch (error) {
      ultimoError = error;
      continue;
    }
  }
  throw new Error(ultimoError?.message || 'Ningún modelo disponible');
}

// ==========================================
// 8. 🛡️ FILTRO MEJORADO - Elimina TODO texto técnico y duplicados
// ==========================================
function limpiarRespuestaIA(respuesta) {
  // 1️⃣ Eliminar texto técnico OBVIO
  respuesta = respuesta.replace(/All constraints met\.? Proceed\.?/gi, '');
  respuesta = respuesta.replace(/\[Done\]/gi, '');
  respuesta = respuesta.replace(/\[.*?\]/g, '');
  respuesta = respuesta.replace(/Analyze User Input:/gi, '');
  respuesta = respuesta.replace(/Context provided:/gi, '');
  respuesta = respuesta.replace(/Query:/gi, '');
  
  // 2️⃣ Dividir en oraciones
  const oraciones = respuesta.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  // 3️⃣ Eliminar duplicados y texto técnico
  const oracionesUnicas = [];
  const vistas = new Set();
  
  const palabrasTecnicas = [
    'constraints met', 'analyze user', 'context provided', 
    'proceed', 'all rules satisfied', 'output matches',
    'thinking process', 'system prompt', 'requirements'
  ];
  
  for (let oracion of oraciones) {
    const normalizada = oracion.toLowerCase();
    
    // Saltar si es texto técnico
    if (palabrasTecnicas.some(p => normalizada.includes(p))) {
      continue;
    }
    
    // Solo agregar si no se ha visto antes y tiene contenido
    if (!vistas.has(normalizada) && oracion.length > 5) {
      vistas.add(normalizada);
      oracionesUnicas.push(oracion);
    }
  }
  
  // 4️⃣ Unir y limpiar
  let respuestaLimpia = oracionesUnicas.join('. ');
  respuestaLimpia = respuestaLimpia.replace(/\*\*/g, '').replace(/[✅✔️]/g, '').trim();
  
  // Asegurar que termine con punto
  if (respuestaLimpia.length > 0 && !respuestaLimpia.endsWith('.')) {
    respuestaLimpia += '.';
  }
  
  return respuestaLimpia.length > 10 ? respuestaLimpia : "Hola, ¿en qué puedo ayudarte?";
}

function actualizarMuroPorIA(texto) {
  const muro = document.getElementById('muro-publicaciones');
  if (texto.toLowerCase().includes('noticia') || texto.toLowerCase().includes('nuevo')) {
    muro.innerHTML = `<h3>📰 Últimas Novedades</h3><p>La IA está buscando las noticias más recientes...</p>`;
  } else if (texto.toLowerCase().includes('usuario') || texto.toLowerCase().includes('gente')) {
    muro.innerHTML = `<h3>👥 Usuarios cerca de ti</h3><p>Mostrando perfiles de tu localidad...</p>`;
  }
}

// ==========================================
// 9. TRADUCTOR AUTOMÁTICO
// ==========================================
function traducirPagina(idioma) {
  console.log(` Traduciendo página a: ${idioma}`);
  if (idioma === 'en') document.querySelector('h1').innerText = 'Circular Economy Catalog';
  if (idioma === 'it') document.querySelector('h1').innerText = 'Catalogo di Economia Circolare';
}

// ==========================================
// 10. 🎨 ESTILOS DINÁMICOS
// ==========================================
function agregarEstilosBuscador() {
  if (document.getElementById('estilos-buscador')) return;
  
  const estilos = `
    <style id="estilos-buscador">
      .multimedia-search {
        padding: 20px;
        animation: fadeIn 0.5s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .search-title {
        color: #2c3e50;
        margin-bottom: 5px;
        font-size: 24px;
      }
      
      .search-subtitle {
        color: #7f8c8d;
        margin-bottom: 25px;
        font-size: 14px;
      }
      
      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .result-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        text-decoration: none;
        color: inherit;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
      }
      
      .result-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      }
      
      .card-img {
        width: 100%;
        height: 180px;
        object-fit: cover;
      }
      
      .card-img-placeholder {
        width: 100%;
        height: 180px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 60px;
        color: white;
      }
      
      .card-body {
        padding: 15px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      
      .card-body h4 {
        color: #2980b9;
        margin: 0 0 10px 0;
        font-size: 16px;
      }
      
      .card-body p {
        color: #555;
        font-size: 13px;
        line-height: 1.5;
        margin: 0 0 15px 0;
        flex-grow: 1;
      }
      
      .btn-leer {
        color: #27ae60;
        font-weight: bold;
        font-size: 13px;
      }
      
      .video-section {
        margin-top: 30px;
      }
      
      .video-section h3 {
        color: #2c3e50;
        margin-bottom: 15px;
        font-size: 20px;
      }
      
      .video-container {
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      }
      
      .video-container iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      .search-empty {
        text-align: center;
        padding: 40px;
        color: #7f8c8d;
      }
      
      @media (max-width: 768px) {
        .results-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', estilos);
}

agregarEstilosBuscador();

// ==========================================
// 11. INICIAR EL SISTEMA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 remarket-db OS Iniciado");
  console.log("🔑 Groq API Key:", CONFIG.GROQ_API_KEY.substring(0, 15) + "...");
  detectarUbicacion();
});
