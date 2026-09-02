import CONFIG from './config.js';

// ==========================================
// DICCIONARIO DE TRADUCCIONES
// ==========================================
const traducciones = {
  es: {
    nombreIdioma: "🌐 Español ▼",
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Escribe tu duda aquí...",
    chatBtn: "Enviar",
    catalogoTitulo: "🌱 Catálogo de Economía Circular",
    catalogoSub: "Descubre artículos disponibles para intercambio en tu zona",
    btnPublicar: "📦 Publicar",
    saludoIA: "¡Hola! Soy tu asistente de economía circular global. ¿Qué necesitas hoy?",
    detectandoUbicacion: "🔍 Detectando tu ubicación y cargando publicaciones...",
    tuAlcance: " Tu Alcance",
    detectandoIP: "Detectando IP...",
    patrocinadores: "Patrocinadores"
  },
  en: {
    nombreIdioma: "🌐 English ▼",
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Type your question here...",
    chatBtn: "Send",
    catalogoTitulo: "🌱 Circular Economy Catalog",
    catalogoSub: "Discover items available for exchange in your area",
    btnPublicar: "📦 Publish",
    saludoIA: "Hello! I'm your global circular economy assistant. What do you need today?",
    detectandoUbicacion: "🔍 Detecting your location and loading publications...",
    tuAlcance: "📍 Your Reach",
    detectandoIP: "Detecting IP...",
    patrocinadores: "Sponsors"
  },
  zh: {
    nombreIdioma: "🌐 中文 ▼",
    logo: "🌱 remarket-db 操作系统",
    chatPlaceholder: "在这里输入您的问题...",
    chatBtn: "发送",
    catalogoTitulo: "🌱 循环经济目录",
    catalogoSub: "发现您所在地区可用于交换的物品",
    btnPublicar: "📦 发布",
    saludoIA: "你好！我是您的全球循环经济助手。您今天需要什么？",
    detectandoUbicacion: "🔍 正在检测您的位置并加载出版物...",
    tuAlcance: "📍 您的覆盖范围",
    detectandoIP: "正在检测 IP...",
    patrocinadores: "赞助商"
  },
  pt: {
    nombreIdioma: "🌐 Português ▼",
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Escreva sua dúvida aqui...",
    chatBtn: "Enviar",
    catalogoTitulo: "🌱 Catálogo de Economia Circular",
    catalogoSub: "Descubra artigos disponíveis para troca na sua zona",
    btnPublicar: "📦 Publicar",
    saludoIA: "Olá! Sou seu assistente de economia circular global. O que você precisa hoje?",
    detectandoUbicacion: "🔍 Detectando sua localização e carregando publicações...",
    tuAlcance: "📍 Seu Alcance",
    detectandoIP: "Detectando IP...",
    patrocinadores: "Patrocinadores"
  },
  fr: {
    nombreIdioma: "🌐 Français ▼",
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Tapez votre question ici...",
    chatBtn: "Envoyer",
    catalogoTitulo: "🌱 Catalogue d'Économie Circulaire",
    catalogoSub: "Découvrez les articles disponibles pour l'échange dans votre zone",
    btnPublicar: "📦 Publier",
    saludoIA: "Bonjour! Je suis votre assistant d'économie circulaire global. Que vous faut-il aujourd'hui?",
    detectandoUbicacion: "🔍 Détection de votre emplacement et chargement des publications...",
    tuAlcance: "📍 Votre Portée",
    detectandoIP: "Détection IP...",
    patrocinadores: "Sponsors"
  },
  de: {
    nombreIdioma: "🌐 Deutsch ▼",
    logo: " remarket-db OS",
    chatPlaceholder: "Geben Sie Ihre Frage hier ein...",
    chatBtn: "Senden",
    catalogoTitulo: "🌱 Kreislaufwirtschaft Katalog",
    catalogoSub: "Entdecken Sie Artikel zum Tausch in Ihrer Region",
    btnPublicar: "📦 Veröffentlichen",
    saludoIA: "Hallo! Ich bin Ihr globaler Kreislaufwirtschaftsassistent. Was brauchen Sie heute?",
    detectandoUbicacion: "🔍 Standort wird erkannt und Publikationen werden geladen...",
    tuAlcance: "📍 Ihre Reichweite",
    detectandoIP: "IP wird erkannt...",
    patrocinadores: "Sponsoren"
  },
  it: {
    nombreIdioma: "🌐 Italiano ▼",
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Scrivi la tua domanda qui...",
    chatBtn: "Invia",
    catalogoTitulo: "🌱 Catalogo Economia Circolare",
    catalogoSub: "Scopri articoli disponibili per lo scambio nella tua zona",
    btnPublicar: "📦 Pubblica",
    saludoIA: "Ciao! Sono il tuo assistente di economia circolare globale. Cosa ti serve oggi?",
    detectandoUbicacion: "🔍 Rilevamento della posizione e caricamento pubblicazioni...",
    tuAlcance: "📍 La tua Portata",
    detectandoIP: "Rilevamento IP...",
    patrocinadores: "Sponsor"
  },
  ja: {
    nombreIdioma: "🌐 日本語 ▼",
    logo: "🌱 remarket-db オペレーティングシステム",
    chatPlaceholder: "ここに質問を入力...",
    chatBtn: "送信",
    catalogoTitulo: "🌱 循環型経済カタログ",
    catalogoSub: "お住まいの地域で交換可能なアイテムを発見",
    btnPublicar: " 公開",
    saludoIA: "こんにちは！グローバル循環型経済アシスタントです。今日は何が必要ですか？",
    detectandoUbicacion: "🔍 場所を検出して出版物を読み込んでいます...",
    tuAlcance: "📍 あなたのカバレッジ",
    detectandoIP: "IP検出中...",
    patrocinadores: "スポンサー"
  },
  ko: {
    nombreIdioma: "🌐 한국어 ▼",
    logo: "🌱 remarket-db 운영체제",
    chatPlaceholder: "여기에 질문을 입력하세요...",
    chatBtn: "보내기",
    catalogoTitulo: "🌱 순환 경제 카탈로그",
    catalogoSub: "귀하의 지역에서 교환 가능한 항목 발견",
    btnPublicar: "📦 게시",
    saludoIA: "안녕하세요! 글로벌 순환 경제 어시스턴트입니다. 오늘 무엇이 필요하신가요?",
    detectandoUbicacion: "🔍 위치 감지 및 출판물 로딩 중...",
    tuAlcance: "📍 당신의 범위",
    detectandoIP: "IP 감지 중...",
    patrocinadores: "스폰서"
  },
  ar: {
    nombreIdioma: "🌐 العربية ▼",
    logo: "🌱 remarket-db نظام التشغيل",
    chatPlaceholder: "اكتب سؤالك هنا...",
    chatBtn: "إرسال",
    catalogoTitulo: "🌱 كتالوج الاقتصاد الدائري",
    catalogoSub: "اكتشف العناصر المتاحة للتبادل في منطقتك",
    btnPublicar: "📦 نشر",
    saludoIA: "مرحبا! أنا مساعد الاقتصاد الدائري العالمي. ماذا تحتاج اليوم؟",
    detectandoUbicacion: "🔍 اكتشاف موقعك وتحميل المنشورات...",
    tuAlcance: " نطاقك",
    detectandoIP: "اكتشاف IP...",
    patrocinadores: "الرعاة"
  },
  hi: {
    nombreIdioma: "🌐 हिन्दी ▼",
    logo: "🌱 remarket-db ऑपरेटिंग सिस्टम",
    chatPlaceholder: "अपना प्रश्न यहां लिखें...",
    chatBtn: "भेजें",
    catalogoTitulo: "🌱 चक्रीय अर्थव्यवस्था कैटलॉग",
    catalogoSub: "अपने क्षेत्र में विनिमय के लिए उपलब्ध वस्तुओं की खोज करें",
    btnPublicar: "📦 प्रकाशित करें",
    saludoIA: "नमस्ते! मैं आपका वैश्विक चक्रीय अर्थव्यवस्था सहायक हूं। आज आपको क्या चाहिए?",
    detectandoUbicacion: " आपका स्थान पहचान रहे हैं और प्रकाशन लोड हो रहे हैं...",
    tuAlcance: "📍 आपकी पहुंच",
    detectandoIP: "IP पहचान रहे हैं...",
    patrocinadores: "प्रायोजक"
  },
  nl: {
    nombreIdioma: "🌐 Nederlands ▼",
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Typ hier uw vraag...",
    chatBtn: "Verzenden",
    catalogoTitulo: "🌱 Circulaire Economie Catalogus",
    catalogoSub: "Ontdek items beschikbaar voor uitwisseling in uw regio",
    btnPublicar: "📦 Publiceren",
    saludoIA: "Hallo! Ik ben uw wereldwijde circulaire economie assistent. Wat heeft u vandaag nodig?",
    detectandoUbicacion: " Uw locatie detecteren en publicaties laden...",
    tuAlcance: "📍 Uw Bereik",
    detectandoIP: "IP detecteren...",
    patrocinadores: "Sponsors"
  },
  tr: {
    nombreIdioma: "🌐 Türkçe ▼",
    logo: "🌱 remarket-db İşletim Sistemi",
    chatPlaceholder: "Sorunuzu buraya yazın...",
    chatBtn: "Gönder",
    catalogoTitulo: "🌱 Döngüsel Ekonomi Kataloğu",
    catalogoSub: "Bölgenizde değişim için mevcut öğeleri keşfedin",
    btnPublicar: "📦 Yayınla",
    saludoIA: "Merhaba! Ben küresel döngüsel ekonomi asistanınız. Bugün neye ihtiyacınız var?",
    detectandoUbicacion: "🔍 Konumunuz algılanıyor ve yayınlar yükleniyor...",
    tuAlcance: "📍 Kapsamınız",
    detectandoIP: "IP algılanıyor...",
    patrocinadores: "Sponsorlar"
  },
  bg: {
    nombreIdioma: " Български ▼",
    logo: "🌱 remarket-db ОС",
    chatPlaceholder: "Въведете въпроса си тук...",
    chatBtn: "Изпрати",
    catalogoTitulo: "🌱 Каталог на циркулярната икономика",
    catalogoSub: "Открийте артикули за обмен във вашия район",
    btnPublicar: "📦 Публикуване",
    saludoIA: "Здравейте! Аз съм вашият глобален асистент за циркулярна икономика. Какво ви трябва днес?",
    detectandoUbicacion: "🔍 Откриване на местоположението ви и зареждане на публикации...",
    tuAlcance: "📍 Вашият обхват",
    detectandoIP: "Откриване на IP...",
    patrocinadores: "Спонсори"
  },
  qu: {
    nombreIdioma: "🌐 Quechua ▼",
    logo: " remarket-db Llamk'ay Sistema",
    chatPlaceholder: "Tapuyniykita kaypi qillqay...",
    chatBtn: "Kachay",
    catalogoTitulo: " Muyuq Economia Qhatu",
    catalogoSub: "Llaqtaykipi tikranapaq kaqkunata taripay",
    btnPublicar: "📦 Qillqay",
    saludoIA: "Allillanchu! Noqaqa global muyuq economia yanapaqmi. Imatataq kunan p'unchaw munanki?",
    detectandoUbicacion: " Maypi kasqaykita tarispa qillqasqakunata apachkani...",
    tuAlcance: "📍 Qampa chayanan",
    detectandoIP: "IP tarispa...",
    patrocinadores: "Yanapaqkuna"
  },
  ay: {
    nombreIdioma: "🌐 Aymara ▼",
    logo: " remarket-db Luräwi Sistema",
    chatPlaceholder: "Jiskisamaxa aka qillqt'asma...",
    chatBtn: "Apayaña",
    catalogoTitulo: "🌱 Muyt'awi Economía Uñacht'awi",
    catalogoSub: "Aka markanxa tukuyata uñjaña",
    btnPublicar: "📦 Qillqt'aña",
    saludoIA: "Aski urukipansa! Noqaxa global muyt'awi economía yanapt'ayiriwa. Kunatix jichhüruxa muntaxa?",
    detectandoUbicacion: "🔍 Mayacht'ataskiwa ukat qillqatanaka apthapiskiwa...",
    tuAlcance: " Kamachima",
    detectandoIP: "IP mayacht'askiwa...",
    patrocinadores: "Yanapt'irinaka"
  }
};

// ==========================================
// SECCIÓN 1: DETECTOR DE UBICACIÓN
// ==========================================
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
  muro.innerHTML = '<div class="tarjeta-destacada"><h3>🌱 Bienvenido a la Economía Circular en ' + ciudad + '</h3><p>Aún no hay muchas publicaciones en tu zona. ¡Sé el primero en publicar!</p></div>';
  if (patrocinadores) {
    patrocinadores.innerHTML = '<div class="patrocinador-vacio"><p>Espacio disponible para negocios de ' + ciudad + '</p></div>';
  }
}

// ==========================================
// SECCIÓN 3: CLIMA (Open-Meteo - GRATIS, SIN API KEY)
// ==========================================
async function obtenerClima(ciudad) {
  const ciudades = {
    'callao': { lat: -12.05, lon: -77.12 },
    'lima': { lat: -12.04, lon: -77.03 },
    'viru': { lat: -8.13, lon: -78.47 },
    'cusco': { lat: -13.53, lon: -71.97 },
    'arequipa': { lat: -16.40, lon: -71.53 },
    'trujillo': { lat: -8.11, lon: -79.03 }
  };
  const ciudadLower = ciudad.toLowerCase().trim();
  const coords = ciudades[ciudadLower] || { lat: -12.05, lon: -77.12 };
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + coords.lat + '&longitude=' + coords.lon + '&current_weather=true');
    const data = await response.json();
    return data.current_weather;
  } catch (error) {
    console.error("Error clima:", error);
    return null;
  }
}

// ==========================================
// SECCIÓN 4: BÚSQUEDA MULTIMEDIA (Wikipedia + YouTube)
// ==========================================
async function buscarEnLaWebConMultimedia(query) {
  const resultados = { articulos: [], videos: [], query: query };
  try {
    const wikiResponse = await fetch('https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrnamespace=0&gsrlimit=4&gsrsearch=' + encodeURIComponent(query) + '&prop=pageimages|extracts&pithumbsize=400&exintro&explaintext&exlimit=4&format=json&origin=*');
    const wikiData = await wikiResponse.json();
    if (wikiData.query && wikiData.query.pages) {
      Object.values(wikiData.query.pages).forEach(function(page) {
        resultados.articulos.push({
          titulo: page.title,
          extracto: page.extract ? page.extract.substring(0, 200) : 'Sin descripción.',
          imagen: page.thumbnail ? page.thumbnail.source : null,
          url: 'https://es.wikipedia.org/wiki/' + encodeURIComponent(page.title.replace(/ /g, '_'))
        });
      });
    }
    resultados.videos.push({
      titulo: '🎥 Videos sobre "' + query + '"',
      searchUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
    });
    return resultados;
  } catch (error) {
    console.error("Error multimedia:", error);
    return null;
  }
}

// ==========================================
// SECCIÓN 5: BÚSQUEDA EN SUPABASE
// ==========================================
async function buscarEnSupabase(query, ciudad) {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return [];
  try {
    const response = await fetch(CONFIG.SUPABASE_URL + '/rest/v1/articulos?or=(titulo.ilike.%' + query + '%,descripcion.ilike.%' + query + '%)&limit=6', {
      headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(function(item) {
      return {
        titulo: item.titulo || 'Sin título',
        descripcion: item.descripcion || 'Sin descripción',
        precio: item.precio || 'Consultar',
        imagen: item.imagen_url || null,
        ciudad: item.ciudad || ciudad
      };
    });
  } catch (error) {
    console.error("Error Supabase:", error);
    return [];
  }
}

// ==========================================
// SECCIÓN 6: PINTAR RESULTADOS EN EL MURO
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
  var videosHTML = resultados.videos.length > 0 ?
    '<div class="video-section"><h3>🎥 Videos relacionados</h3><a href="' + resultados.videos[0].searchUrl + '" target="_blank" class="youtube-link-card"><div class="youtube-icon">▶️</div><div><h4>' + resultados.videos[0].titulo + '</h4><p>Haz clic para ver videos en YouTube</p></div></a></div>' : '';
  muro.innerHTML = '<div class="multimedia-search"><h2 class="search-title">🔍 Resultados para: "' + query + '"</h2><p class="search-subtitle">' + resultados.articulos.length + ' artículos encontrados</p>' +
    (tarjetasHTML ? '<div class="results-grid">' + tarjetasHTML + '</div>' : '') + videosHTML + '</div>';
}

function mostrarProductosEnMuro(productos, query) {
  const muro = document.getElementById('muro-publicaciones');
  if (productos.length === 0) {
    muro.innerHTML = '<div class="search-empty"><h3>😕 No hay "' + query + '" disponible</h3><p>¿Quieres ser el primero en publicar uno?</p></div>';
    return;
  }
  var tarjetasHTML = productos.map(function(prod) {
    return '<div class="result-card producto-card">' +
      (prod.imagen ? '<img src="' + prod.imagen + '" alt="' + prod.titulo + '" class="card-img">' : '<div class="card-img-placeholder">📦</div>') +
      '<div class="card-body"><h4>' + prod.titulo + '</h4><p>' + prod.descripcion + '</p><div class="producto-meta"><span class="precio">💰 ' + prod.precio + '</span><span class="ciudad">📍 ' + prod.ciudad + '</span></div><button class="btn-contactar">Contactar</button></div></div>';
  }).join('');
  muro.innerHTML = '<div class="multimedia-search"><h2 class="search-title">🛍️ Productos: "' + query + '"</h2><p class="search-subtitle">' + productos.length + ' productos encontrados</p><div class="results-grid">' + tarjetasHTML + '</div></div>';
}

function mostrarClimaEnMuro(clima, ciudad) {
  const muro = document.getElementById('muro-publicaciones');
  if (!clima) {
    muro.innerHTML = '<div class="search-empty"><h3>⚠️ No pude obtener el clima</h3></div>';
    return;
  }
  const iconos = { 0: '☀️', 1: '🌤️', 2: '', 3: '☁️', 45: '🌫️', 51: '🌦️', 61: '️', 71: '❄️', 80: '🌦️', 95: '⛈️' };
  const icono = iconos[clima.weathercode] || '🌡️';
  muro.innerHTML = '<div class="multimedia-search"><div class="clima-card"><h2>' + icono + ' Clima en ' + ciudad + '</h2><div class="clima-temp">' + clima.temperature + '°C</div><p>Viento: ' + clima.windspeed + ' km/h</p></div></div>';
}

// ==========================================
// SECCIÓN 7: DETECTOR DE INTENCIÓN AMPLIADO
// ==========================================
function detectarTipoDeBusqueda(texto) {
  const t = texto.toLowerCase();
  if (t.includes('clima') || t.includes('tiempo') || t.includes('temperatura') || t.includes('lluvia') || t.includes('hace calor') || t.includes('hace frio')) {
    return 'CLIMA';
  }
  if (t.includes('hora') || t.includes('qué hora') || t.includes('que hora')) {
    return 'HORA';
  }
  const preguntasPlataforma = ['que ofrece', 'qué ofrece', 'que es remarket', 'qué es remarket', 'sobre la pagina', 'sobre la página', 'sobre remarket', 'de que trata', 'de qué trata', 'para que sirve', 'para qué sirve', 'como funciona', 'cómo funciona', 'que hace', 'qué hace', 'que venden', 'qué venden', 'que puedo hacer', 'qué puedo hacer', 'que novedades', 'qué novedades', 'novedades de la pagina', 'novedades de la página'];
  if (preguntasPlataforma.some(function(p) { return t.includes(p); })) {
    return 'PLATAFORMA';
  }
  const palabrasPropias = ['vender', 'comprar', 'trueque', 'donar', 'publicar', 'bicicleta', 'ropa', 'celular', 'artículo', 'articulo', 'laptop', 'mueble', 'libro', 'zapato', 'carro', 'auto', 'busco', 'buscando'];
  if (palabrasPropias.some(function(p) { return t.includes(p); })) {
    return 'PRODUCTOS';
  }
  const palabrasBusqueda = ['muéstrame', 'muestrame', 'busca', 'buscar', 'qué es', 'que es', 'quién es', 'quien es', 'cómo', 'como', 'explicame', 'explícame', 'historia', 'información', 'video', 'videos', 'foro', 'noticias', 'últimas', 'actualidad', 'novedades', 'noticia', 'nuevo', 'nueva', 'youtube', 'dime sobre', 'dime de'];
  if (palabrasBusqueda.some(function(p) { return t.includes(p); })) {
    return 'WEB';
  }
  return 'CONVERSACION';
}

// ==========================================
// SECCIÓN 8: ASISTENTE IA
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
  chatHistorial.innerHTML += '<div class="msg-ia" id="ia-escribiendo"> Pensando...</div>';
  try {
    const tipo = detectarTipoDeBusqueda(texto);
    const ubicacion = document.getElementById('texto-ubicacion').innerText || "Callao, Perú";
    const ciudad = ubicacion.split(',')[0].trim();
    if (tipo === 'CLIMA') {
      document.getElementById('ia-escribiendo').innerText = "️ Consultando el clima...";
      const clima = await obtenerClima(ciudad);
      if (clima) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">🌡️ En ' + ciudad + ' hay ' + clima.temperature + '°C con viento de ' + clima.windspeed + ' km/h. Te dejé los detalles en el panel central.</div>';
        mostrarClimaEnMuro(clima, ciudad);
      } else {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">⚠️ No pude obtener el clima ahora. Intenta de nuevo.</div>';
      }
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
      document.getElementById('ia-escribiendo').innerText = "️ Buscando productos...";
      const productos = await buscarEnSupabase(texto, ciudad);
      if (productos.length > 0) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">¡Encontré ' + productos.length + ' productos de "' + texto + '" en ' + ciudad + '! 🛍️ Los puedes ver en el panel central.</div>';
        mostrarProductosEnMuro(productos, texto);
      } else {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">Aún no hay "' + texto + '" en ' + ciudad + ', pero puedes ser el primero en publicar uno. </div>';
      }
      return;
    }
    if (tipo === 'WEB') {
      document.getElementById('ia-escribiendo').innerText = "🌐 Buscando en la web...";
      const resultados = await buscarEnLaWebConMultimedia(texto);
      if (resultados && (resultados.articulos.length > 0 || resultados.videos.length > 0)) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">¡Encontré información sobre "' + texto + '"!  Te dejé artículos y videos en el panel central. 👇</div>';
        mostrarResultadosMultimediaEnMuro(resultados, texto);
      } else {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">No encontré resultados para "' + texto + '". Intenta con otra palabra. 🔍</div>';
      }
      return;
    }
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit',
