import CONFIG from '../config.js';

const traducciones = {
  es: { nombreIdioma: "🌐 Español ▼", chatPlaceholder: "Escribe tu duda aquí...", chatBtn: "Enviar", saludoIA: "¡Hola! Soy tu asistente. ¿Qué necesitas hoy?", detectandoUbicacion: "🔍 Detectando tu ubicación...", detectandoIP: "Detectando IP..." },
  en: { nombreIdioma: "🌐 English ▼", chatPlaceholder: "Type your question...", chatBtn: "Send", saludoIA: "Hello! I'm your assistant.", detectandoUbicacion: " Detecting location...", detectandoIP: "Detecting IP..." },
  pt: { nombreIdioma: "🌐 Português ▼", chatPlaceholder: "Escreva sua dúvida...", chatBtn: "Enviar", saludoIA: "Olá! Sou seu assistente.", detectandoUbicacion: "🔍 Detectando localização...", detectandoIP: "Detectando IP..." },
  fr: { nombreIdioma: "🌐 Français ▼", chatPlaceholder: "Tapez votre question...", chatBtn: "Envoyer", saludoIA: "Bonjour! Je suis votre assistant.", detectandoUbicacion: "🔍 Détection...", detectandoIP: "Détection IP..." },
  de: { nombreIdioma: "🌐 Deutsch ▼", chatPlaceholder: "Geben Sie Ihre Frage ein...", chatBtn: "Senden", saludoIA: "Hallo! Ich bin Ihr Assistent.", detectandoUbicacion: "🔍 Standort...", detectandoIP: "IP wird erkannt..." },
  it: { nombreIdioma: "🌐 Italiano ▼", chatPlaceholder: "Scrivi la tua domanda...", chatBtn: "Invia", saludoIA: "Ciao! Sono il tuo assistente.", detectandoUbicacion: "🔍 Rilevamento...", detectandoIP: "Rilevamento IP..." },
  zh: { nombreIdioma: "🌐 中文 ▼", chatPlaceholder: "输入您的问题...", chatBtn: "发送", saludoIA: "你好！我是你的助手。", detectandoUbicacion: " 检测位置...", detectandoIP: "检测 IP..." },
  ja: { nombreIdioma: "🌐 日本語 ▼", chatPlaceholder: "質問を入力...", chatBtn: "送信", saludoIA: "こんにちは！アシスタントです。", detectandoUbicacion: "🔍 場所を検出...", detectandoIP: "IP検出..." },
  ko: { nombreIdioma: "🌐 한국어 ▼", chatPlaceholder: "질문을 입력...", chatBtn: "보내기", saludoIA: "안녕하세요! 어시스턴트입니다.", detectandoUbicacion: "🔍 위치 감지...", detectandoIP: "IP 감지..." },
  ar: { nombreIdioma: "🌐 العربية ▼", chatPlaceholder: "اكتب سؤالك...", chatBtn: "إرسال", saludoIA: "مرحبا! أنا مساعدك.", detectandoUbicacion: "🔍 اكتشاف الموقع...", detectandoIP: "اكتشاف IP..." },
  hi: { nombreIdioma: "🌐 हिन्दी ▼", chatPlaceholder: "अपना प्रश्न लिखें...", chatBtn: "भेजें", saludoIA: "नमस्ते! मैं आपका सहायक हूं।", detectandoUbicacion: "🔍 स्थान पहचान...", detectandoIP: "IP पहचान..." },
  nl: { nombreIdioma: "🌐 Nederlands ▼", chatPlaceholder: "Typ uw vraag...", chatBtn: "Verzenden", saludoIA: "Hallo! Ik ben uw assistent.", detectandoUbicacion: "🔍 Locatie...", detectandoIP: "IP detecteren..." },
  tr: { nombreIdioma: "🌐 Türkçe ▼", chatPlaceholder: "Sorunuzu yazın...", chatBtn: "Gönder", saludoIA: "Merhaba! Ben asistanınız.", detectandoUbicacion: "🔍 Konum...", detectandoIP: "IP algılanıyor..." },
  bg: { nombreIdioma: "🌐 Български ▼", chatPlaceholder: "Въведете въпрос...", chatBtn: "Изпрати", saludoIA: "Здравейте! Аз съм вашият асистент.", detectandoUbicacion: " Откриване...", detectandoIP: "Откриване на IP..." },
  qu: { nombreIdioma: "🌐 Quechua ▼", chatPlaceholder: "Tapuyniykita qillqay...", chatBtn: "Kachay", saludoIA: "Allillanchu! Noqaqa yanapaqmi.", detectandoUbicacion: "🔍 Maypi kasqayta...", detectandoIP: "IP tarispa..." },
  ay: { nombreIdioma: "🌐 Aymara ▼", chatPlaceholder: "Jiskisamaxa qillqt'asma...", chatBtn: "Apayaña", saludoIA: "Aski urukipansa! Noqaxa yanapt'ayiriwa.", detectandoUbicacion: "🔍 Mayacht'ataskiwa...", detectandoIP: "IP mayacht'askiwa..." }
};

async function detectarUbicacion() {
  try {
    const respuesta = await fetch('https://ipapi.co/json/');
    const datos = await respuesta.json();
    if (datos.error) throw new Error("API falló");
    console.log("Usuario en:", datos.city, datos.country);
    document.getElementById('texto-ubicacion').innerText = datos.city + ', ' + datos.country;
    cargarMuroDinamico(datos.city, datos.country);
  } catch (error) {
    console.error("Error IP:", error);
    try {
      const res2 = await fetch('https://ipinfo.io/json');
      const dat2 = await res2.json();
      const ciudad = dat2.city || 'Callao';
      const pais = dat2.country || 'Perú';
      document.getElementById('texto-ubicacion').innerText = ciudad + ', ' + pais;
      cargarMuroDinamico(ciudad, pais);
    } catch (error2) {
      document.getElementById('texto-ubicacion').innerText = "Callao, Perú";
      cargarMuroDinamico("Callao", "Perú");
    }
  }
}

function cargarMuroDinamico(ciudad, pais) {
  const muro = document.getElementById('muro-publicaciones');
  const patrocinadores = document.getElementById('lista-patrocinadores');
  muro.innerHTML = '<div class="tarjeta-destacada"><h3>🌱 Bienvenido a la Economía Circular en ' + ciudad + '</h3><p>Aún no hay muchas publicaciones en tu zona. ¡Sé el primero en publicar!</p></div>';
  if (patrocinadores) {
    patrocinadores.innerHTML = '<div class="patrocinador-vacio"><p>Espacio disponible para negocios de ' + ciudad + '</p></div>';
  }
}

async function obtenerClima(ciudad) {
  const ciudades = { 'callao': { lat: -12.05, lon: -77.12 }, 'lima': { lat: -12.04, lon: -77.03 }, 'viru': { lat: -8.13, lon: -78.47 }, 'cusco': { lat: -13.53, lon: -71.97 }, 'arequipa': { lat: -16.40, lon: -71.53 }, 'trujillo': { lat: -8.11, lon: -79.03 } };
  const ciudadLower = ciudad.toLowerCase().trim();
  const coords = ciudades[ciudadLower] || { lat: -12.05, lon: -77.12 };
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + coords.lat + '&longitude=' + coords.lon + '&current_weather=true');
    const data = await response.json();
    return data.current_weather;
  } catch (error) { console.error("Error clima:", error); return null; }
}

async function buscarEnLaWebConMultimedia(query) {
  const resultados = { articulos: [], videos: [], query: query };
  try {
    const wikiResponse = await fetch('https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrnamespace=0&gsrlimit=4&gsrsearch=' + encodeURIComponent(query) + '&prop=pageimages|extracts&pithumbsize=400&exintro&explaintext&exlimit=4&format=json&origin=*');
    const wikiData = await wikiResponse.json();
    if (wikiData.query && wikiData.query.pages) {
      Object.values(wikiData.query.pages).forEach(function(page) {
        resultados.articulos.push({ titulo: page.title, extracto: page.extract ? page.extract.substring(0, 200) : 'Sin descripción.', imagen: page.thumbnail ? page.thumbnail.source : null, url: 'https://es.wikipedia.org/wiki/' + encodeURIComponent(page.title.replace(/ /g, '_')) });
      });
    }
    resultados.videos.push({ titulo: '🎥 Videos sobre "' + query + '"', searchUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query) });
    return resultados;
  } catch (error) { console.error("Error multimedia:", error); return null; }
}

async function buscarEnSupabase(query, ciudad) {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return [];
  try {
    const response = await fetch(CONFIG.SUPABASE_URL + '/rest/v1/articulos?or=(titulo.ilike.%' + query + '%,descripcion.ilike.%' + query + '%)&limit=6', { headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY } });
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(function(item) { return { titulo: item.titulo || 'Sin título', descripcion: item.descripcion || 'Sin descripción', precio: item.precio || 'Consultar', imagen: item.imagen_url || null, ciudad: item.ciudad || ciudad }; });
  } catch (error) { console.error("Error Supabase:", error); return []; }
}

function mostrarResultadosMultimediaEnMuro(resultados, query) {
  const muro = document.getElementById('muro-publicaciones');
  if (!resultados || (resultados.articulos.length === 0 && resultados.videos.length === 0)) {
    muro.innerHTML = '<div class="search-empty"><h3>🔍 No encontré resultados para "' + query + '"</h3><p>Intenta con otra palabra.</p></div>';
    return;
  }
  var tarjetasHTML = resultados.articulos.map(function(art) {
    return '<a href="' + art.url + '" target="_blank" class="result-card">' + (art.imagen ? '<img src="' + art.imagen + '" alt="' + art.titulo + '" class="card-img">' : '<div class="card-img-placeholder">📄</div>') + '<div class="card-body"><h4>' + art.titulo + '</h4><p>' + art.extracto + '</p><span class="btn-leer">Leer más →</span></div></a>';
  }).join('');
  var videosHTML = resultados.videos.length > 0 ? '<div class="video-section"><h3>🎥 Videos relacionados</h3><a href="' + resultados.videos[0].searchUrl + '" target="_blank" class="youtube-link-card"><div class="youtube-icon">▶️</div><div><h4>' + resultados.videos[0].titulo + '</h4><p>Haz clic para ver videos en YouTube</p></div></a></div>' : '';
  muro.innerHTML = '<div class="multimedia-search"><h2 class="search-title"> Resultados para: "' + query + '"</h2><p class="search-subtitle">' + resultados.articulos.length + ' artículos encontrados</p>' + (tarjetasHTML ? '<div class="results-grid">' + tarjetasHTML + '</div>' : '') + videosHTML + '</div>';
}

function mostrarProductosEnMuro(productos, query) {
  const muro = document.getElementById('muro-publicaciones');
  if (productos.length === 0) {
    muro.innerHTML = '<div class="search-empty"><h3>😕 No hay "' + query + '" disponible</h3><p>¿Quieres ser el primero en publicar uno?</p></div>';
    return;
  }
  var tarjetasHTML = productos.map(function(prod) {
    return '<div class="result-card producto-card">' + (prod.imagen ? '<img src="' + prod.imagen + '" alt="' + prod.titulo + '" class="card-img">' : '<div class="card-img-placeholder"></div>') + '<div class="card-body"><h4>' + prod.titulo + '</h4><p>' + prod.descripcion + '</p><div class="producto-meta"><span class="precio">💰 ' + prod.precio + '</span><span class="ciudad">📍 ' + prod.ciudad + '</span></div><button class="btn-contactar">Contactar</button></div></div>';
  }).join('');
  muro.innerHTML = '<div class="multimedia-search"><h2 class="search-title">🛍️ Productos: "' + query + '"</h2><p class="search-subtitle">' + productos.length + ' productos encontrados</p><div class="results-grid">' + tarjetasHTML + '</div></div>';
}

function mostrarClimaEnMuro(clima, ciudad) {
  const muro = document.getElementById('muro-publicaciones');
  if (!clima) { muro.innerHTML = '<div class="search-empty"><h3>️ No pude obtener el clima</h3></div>'; return; }
  const iconos = { 0: '☀️', 1: '️', 2: '⛅', 3: '☁️', 45: '🌫️', 51: '️', 61: '🌧️', 71: '❄️', 80: '🌦️', 95: '⛈️' };
  const icono = iconos[clima.weathercode] || '🌡️';
  muro.innerHTML = '<div class="multimedia-search"><div class="clima-card"><h2>' + icono + ' Clima en ' + ciudad + '</h2><div class="clima-temp">' + clima.temperature + '°C</div><p>Viento: ' + clima.windspeed + ' km/h</p></div></div>';
}

function detectarTipoDeBusqueda(texto) {
  const t = texto.toLowerCase();
  if (t.includes('clima') || t.includes('tiempo') || t.includes('temperatura') || t.includes('lluvia') || t.includes('hace calor') || t.includes('hace frio')) return 'CLIMA';
  if (t.includes('hora') || t.includes('qué hora') || t.includes('que hora')) return 'HORA';
  const preguntasPlataforma = ['que ofrece', 'qué ofrece', 'que es remarket', 'qué es remarket', 'sobre la pagina', 'sobre la página', 'sobre remarket', 'de que trata', 'de qué trata', 'para que sirve', 'para qué sirve', 'como funciona', 'cómo funciona', 'que hace', 'qué hace', 'que venden', 'qué venden', 'que puedo hacer', 'qué puedo hacer', 'que novedades', 'qué novedades', 'novedades de la pagina', 'novedades de la página'];
  if (preguntasPlataforma.some(function(p) { return t.includes(p); })) return 'PLATAFORMA';
  const palabrasPropias = ['vender', 'comprar', 'trueque', 'donar', 'publicar', 'bicicleta', 'ropa', 'celular', 'artículo', 'articulo', 'laptop', 'mueble', 'libro', 'zapato', 'carro', 'auto', 'busco', 'buscando'];
  if (palabrasPropias.some(function(p) { return t.includes(p); })) return 'PRODUCTOS';
  const palabrasBusqueda = ['muéstrame', 'muestrame', 'busca', 'buscar', 'qué es', 'que es', 'quién es', 'quien es', 'cómo', 'como', 'explicame', 'explícame', 'historia', 'información', 'video', 'videos', 'foro', 'noticias', 'últimas', 'actualidad', 'novedades', 'noticia', 'nuevo', 'nueva', 'youtube', 'dime sobre', 'dime de'];
  if (palabrasBusqueda.some(function(p) { return t.includes(p); })) return 'WEB';
  return 'CONVERSACION';
}

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
    if (tipo === 'CLIMA') {
      document.getElementById('ia-escribiendo').innerText = "🌤️ Consultando el clima...";
      const clima = await obtenerClima(ciudad);
      if (clima) { document.getElementById('ia-escribiendo').remove(); chatHistorial.innerHTML += '<div class="msg-ia">🌡️ En ' + ciudad + ' hay ' + clima.temperature + '°C con viento de ' + clima.windspeed + ' km/h. Te dejé los detalles en el panel central.</div>'; mostrarClimaEnMuro(clima, ciudad); }
      else { document.getElementById('ia-escribiendo').remove(); chatHistorial.innerHTML += '<div class="msg-ia">⚠️ No pude obtener el clima ahora. Intenta de nuevo.</div>'; }
      return;
    }
    if (tipo === 'HORA') {
      const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      document.getElementById('ia-escribiendo').remove();
      chatHistorial.innerHTML += '<div class="msg-ia">🕐 Son las ' + horaActual + ' en ' + ubicacion + '.</div>';
      return;
    }
    if (tipo === 'PLATAFORMA') {
      document.getElementById('ia-escribiendo').remove();
      chatHistorial.innerHTML += '<div class="msg-ia">remarket-db es una plataforma peruana de economía circular donde puedes:<br><br>✅ <b>Publicar</b> artículos de segunda mano<br>✅ <b>Vender</b> o <b>comprar</b> productos usados<br>✅ <b>Truequear</b> objetos sin usar dinero<br>✅ <b>Donar</b> lo que ya no necesitas<br><br>Todo esto ayuda a reutilizar en lugar de botar a la basura. <br><br>¿Quieres publicar algo o buscar algún artículo?</div>';
      cargarMuroDinamico(ciudad, '');
      return;
    }
    if (tipo === 'PRODUCTOS') {
      document.getElementById('ia-escribiendo').innerText = "🛍️ Buscando productos...";
      const productos = await buscarEnSupabase(texto, ciudad);
      if (productos.length > 0) { document.getElementById('ia-escribiendo').remove(); chatHistorial.innerHTML += '<div class="msg-ia">¡Encontré ' + productos.length + ' productos de "' + texto + '" en ' + ciudad + '! 🛍️ Los puedes ver en el panel central.</div>'; mostrarProductosEnMuro(productos, texto); }
      else { document.getElementById('ia-escribiendo').remove(); chatHistorial.innerHTML += '<div class="msg-ia">Aún no hay "' + texto + '" en ' + ciudad + ', pero puedes ser el primero en publicar uno. </div>'; }
      return;
    }
    if (tipo === 'WEB') {
      document.getElementById('ia-escribiendo').innerText = "🌐 Buscando en la web...";
      const resultados = await buscarEnLaWebConMultimedia(texto);
      if (resultados && (resultados.articulos.length > 0 || resultados.videos.length > 0)) { document.getElementById('ia-escribiendo').remove(); chatHistorial.innerHTML += '<div class="msg-ia">¡Encontré información sobre "' + texto + '"! 🎯 Te dejé artículos y videos en el panel central. 👇</div>'; mostrarResultadosMultimediaEnMuro(resultados, texto); }
      else { document.getElementById('ia-escribiendo').remove(); chatHistorial.innerHTML += '<div class="msg-ia">No encontré resultados para "' + texto + '". Intenta con otra palabra. </div>'; }
      return;
    }
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mensajeEnriquecido = '[Usuario en ' + ubicacion + ', hora: ' + horaActual + '] ' + texto;
    const respuestaIA = await llamarGroqConModeloDisponible(mensajeEnriquecido);
    document.getElementById('ia-escribiendo').remove();
    if (!respuestaIA || respuestaIA.trim().length < 5) { chatHistorial.innerHTML += '<div class="msg-ia">⚠️ No pude generar una respuesta. Intenta de nuevo.</div>'; }
    else { chatHistorial.innerHTML += '<div class="msg-ia">' + respuestaIA + '</div>'; }
  } catch (error) { console.error("Error:", error); document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message; }
}

async function obtenerModelosDisponibles() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': 'Bearer ' + CONFIG.GROQ_API_KEY } });
    if (!response.ok) throw new Error('No se pudo obtener la lista');
    const data = await response.json();
    return data.data.filter(function(m) { const id = m.id.toLowerCase(); return (id.includes('llama') || id.includes('gemma') || id.includes('mixtral') || id.includes('deepseek') || id.includes('qwen')) && !id.includes('classifier') && !id.includes('embed'); }).map(function(m) { return m.id; });
  } catch (error) { return ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it']; }
}

async function llamarGroqConModeloDisponible(mensaje) {
  const modelos = await obtenerModelosDisponibles();
  let ultimoError = null;
  for (let i = 0; i < modelos.length; i++) {
    const modelo = modelos[i];
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Authorization': 'Bearer ' + CONFIG.GROQ_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: modelo, messages: [{ role: 'system', content: 'Eres el asistente de remarket-db. REGLA DE ORO: Responde SIEMPRE en el mismo idioma en el que el usuario te escribió. Si escribe en español, responde en español. Si escribe en inglés, responde en inglés. Si escribe en chino, responde en chino. Si escribe en quechua, responde en quechua. No traduzcas, piensa y redacta directamente en el idioma del usuario. Responde en 1-2 oraciones.' }, { role: 'user', content: mensaje }], temperature: 0.5, max_tokens: 150 }) });
      if (!response.ok) { const errorData = await response.json(); ultimoError = new Error(errorData.error?.message || 'Error ' + response.status); continue; }
      const data = await response.json();
      return limpiarRespuestaIA(data.choices[0].message.content);
    } catch (error) { ultimoError = error; continue; }
  }
  throw new Error(ultimoError?.message || 'Ningún modelo disponible');
}

function limpiarRespuestaIA(respuesta) {
  const lineas = respuesta.split('\n');
  const validas = [];
  const palabrasTecnicas = ["analyze user", "role/constraints", "key requirements", "context acknowledgment", "mention location", "remarket-db assistant", "implies database", "input:", "context:", "language:", "role:", "length:", "tone:", "formulate", "internal refinement", "user is in", "spanish - always", "never use english", "virtual assistant for", "circular economy platform", "max 2-3 sentences", "like talking to a friend", "draft response", "check constraints", "final polish", "mental draft", "all rules satisfied", "output matches", "here's a thinking", "thinking process", "formulate response"];
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    const lower = linea.toLowerCase();
    if (linea.length < 15) continue;
    const esTecnica = palabrasTecnicas.some(function(palabra) { return lower.includes(palabra); });
    if (esTecnica) continue;
    validas.push(linea);
  }
  let final = validas.join(' ').replace(/\s+/g, ' ').replace(/\*\*/g, '').trim();
  if (final.length < 10 || final.toLowerCase().includes('analyze') || final.toLowerCase().includes('constraint')) { return "¡Hola! ¿En qué puedo ayudarte hoy?"; }
  return final;
}

function aplicarTraduccion(idioma) {
  const t = traducciones[idioma] || traducciones['es'];
  const btnIdioma = document.querySelector('.btn-idioma');
  if (btnIdioma) btnIdioma.textContent = t.nombreIdioma;
  const chatInputEl = document.getElementById('chat-input');
  if (chatInputEl) chatInputEl.placeholder = t.chatPlaceholder;
  const chatBtnEl = document.getElementById('chat-btn');
  if (chatBtnEl) chatBtnEl.textContent = t.chatBtn;
  const saludoIA = document.querySelector('#chat-historial .msg-ia');
  if (saludoIA) saludoIA.textContent = t.saludoIA;
  const muroTexto = document.querySelector('#muro-publicaciones p');
  if (muroTexto && muroTexto.textContent.includes('Detectando')) { muroTexto.textContent = t.detectandoUbicacion; }
  const textoUbicacion = document.querySelector('#texto-ubicacion');
  if (textoUbicacion && textoUbicacion.textContent.includes('Detectando')) { textoUbicacion.textContent = t.detectandoIP; }
  localStorage.setItem('idiomaPreferido', idioma);
  console.log("✅ Idioma aplicado:", idioma);
}

async function detectarYAplicarIdioma() {
  const guardado = localStorage.getItem('idiomaPreferido');
  if (guardado && traducciones[guardado]) { aplicarTraduccion(guardado); return; }
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const pais = data.country_code;
    const mapa = { 'PE': 'es', 'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'EC': 'es', 'BO': 'es', 'VE': 'es', 'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'CN': 'zh', 'TW': 'zh', 'HK': 'zh', 'BR': 'pt', 'PT': 'pt', 'FR': 'fr', 'BE': 'fr', 'CH': 'fr', 'DE': 'de', 'AT': 'de', 'IT': 'it', 'JP': 'ja', 'KR': 'ko', 'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'IN': 'hi', 'NL': 'nl', 'TR': 'tr', 'BG': 'bg', 'QU': 'qu', 'AY': 'ay' };
    const idiomaDetectado = mapa[pais] || 'es';
    aplicarTraduccion(idiomaDetectado);
  } catch (error) { console.log("No se pudo detectar IP, usando español."); aplicarTraduccion('es'); }
}

function cambiarIdiomaManual(idioma) {
  aplicarTraduccion(idioma);
  location.reload();
}
window.cambiarIdiomaManual = cambiarIdiomaManual;

document.addEventListener('DOMContentLoaded', async function() {
  console.log("remarket-db OS Iniciado");
  await detectarUbicacion();
  await detectarYAplicarIdioma();
  const btnIdiomaEl = document.querySelector('.btn-idioma');
  const idiomaMenuEl = document.querySelector('.idioma-menu');
  if (btnIdiomaEl && idiomaMenuEl) {
    btnIdiomaEl.addEventListener('click', function(evento) { evento.stopPropagation(); idiomaMenuEl.classList.toggle('activo'); });
    document.addEventListener('click', function(evento) { if (!idiomaMenuEl.contains(evento.target) && !btnIdiomaEl.contains(evento.target)) { idiomaMenuEl.classList.remove('activo'); } });
    const opcionesIdioma = document.querySelectorAll('.idioma-opcion');
    opcionesIdioma.forEach(function(opcion) { opcion.addEventListener('click', function() { idiomaMenuEl.classList.remove('activo'); }); });
  }
});

const buscadorArriba = document.getElementById('buscador-principal');
if (buscadorArriba && chatInput && chatBtn) {
  buscadorArriba.addEventListener('keypress', function(evento) {
    if (evento.key === 'Enter') {
      const texto = buscadorArriba.value.trim();
      if (texto.length > 0) { chatInput.value = texto; chatBtn.click(); buscadorArriba.value = ''; }
    }
  });
}
