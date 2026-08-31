import CONFIG from './config.js';

// ==========================================
// DICCIONARIO DE TRADUCCIONES
// ==========================================
const traducciones = {
  es: {
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Escribe tu duda aquí...",
    chatBtn: "Enviar",
    catalogoTitulo: " Catálogo de Economía Circular",
    catalogoSub: "Descubre artículos disponibles para intercambio en tu zona",
    btnPublicar: "📦 Publicar",
    saludoIA: "¡Hola! Soy tu asistente de economía circular global. ¿Qué necesitas hoy?",
    detectandoUbicacion: " Detectando tu ubicación y cargando publicaciones...",
    tuAlcance: "📍 Tu Alcance",
    detectandoIP: "Detectando IP...",
    patrocinadores: "Patrocinadores"
  },
  en: {
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Type your question here...",
    chatBtn: "Send",
    catalogoTitulo: " Circular Economy Catalog",
    catalogoSub: "Discover items available for exchange in your area",
    btnPublicar: "📦 Publish",
    saludoIA: "Hello! I'm your global circular economy assistant. What do you need today?",
    detectandoUbicacion: "🔍 Detecting your location and loading publications...",
    tuAlcance: " Your Reach",
    detectandoIP: "Detecting IP...",
    patrocinadores: "Sponsors"
  },
  zh: {
    logo: "🌱 remarket-db 操作系统",
    chatPlaceholder: "在这里输入您的问题...",
    chatBtn: "发送",
    catalogoTitulo: " 循环经济目录",
    catalogoSub: "发现您所在地区可用于交换的物品",
    btnPublicar: "📦 发布",
    saludoIA: "你好！我是您的全球循环经济助手。您今天需要什么？",
    detectandoUbicacion: "🔍 正在检测您的位置并加载出版物...",
    tuAlcance: "📍 您的覆盖范围",
    detectandoIP: "正在检测 IP...",
    patrocinadores: "赞助商"
  },
  pt: {
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
    logo: "🌱 remarket-db OS",
    chatPlaceholder: "Tapez votre question ici...",
    chatBtn: "Envoyer",
    catalogoTitulo: "🌱 Catalogue d'Économie Circulaire",
    catalogoSub: "Découvrez les articles disponibles pour l'échange dans votre zone",
    btnPublicar: "📦 Publier",
    saludoIA: "Bonjour! Je suis votre assistant d'économie circulaire global. Que vous faut-il aujourd'hui?",
    detectandoUbicacion: "🔍 Détection de votre emplacement et chargement des publications...",
    tuAlcance: " Votre Portée",
    detectandoIP: "Détection IP...",
    patrocinadores: "Sponsors"
  },
  de: {
    logo: "🌱 remarket-db OS",
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
    logo: "🌱 remarket-db オペレーティングシステム",
    chatPlaceholder: "ここに質問を入力...",
    chatBtn: "送信",
    catalogoTitulo: "🌱 循環型経済カタログ",
    catalogoSub: "お住まいの地域で交換可能なアイテムを発見",
    btnPublicar: "📦 公開",
    saludoIA: "こんにちは！グローバル循環型経済アシスタントです。今日は何が必要ですか？",
    detectandoUbicacion: " 場所を検出して出版物を読み込んでいます...",
    tuAlcance: "📍 あなたのカバレッジ",
    detectandoIP: "IP検出中...",
    patrocinadores: "スポンサー"
  },
  ko: {
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
    logo: "🌱 remarket-db نظام التشغيل",
    chatPlaceholder: "اكتب سؤالك هنا...",
    chatBtn: "إرسال",
    catalogoTitulo: "🌱 كتالوج الاقتصاد الدائري",
    catalogoSub: "اكتشف العناصر المتاحة للتبادل في منطقتك",
    btnPublicar: "📦 نشر",
    saludoIA: "مرحبا! أنا مساعد الاقتصاد الدائري العالمي. ماذا تحتاج اليوم؟",
    detectandoUbicacion: " اكتشاف موقعك وتحميل المنشورات...",
    tuAlcance: "📍 نطاقك",
    detectandoIP: "اكتشاف IP...",
    patrocinadores: "الرعاة"
  },
  hi: {
    logo: " remarket-db ऑपरेटिंग सिस्टम",
    chatPlaceholder: "अपना प्रश्न यहां लिखें...",
    chatBtn: "भेजें",
    catalogoTitulo: " चक्रीय अर्थव्यवस्था कैटलॉग",
    catalogoSub: "अपने क्षेत्र में विनिमय के लिए उपलब्ध वस्तुओं की खोज करें",
    btnPublicar: "📦 प्रकाशित करें",
    saludoIA: "नमस्ते! मैं आपका वैश्विक चक्रीय अर्थव्यवस्था सहायक हूं। आज आपको क्या चाहिए?",
    detectandoUbicacion: "🔍 आपका स्थान पहचान रहे हैं और प्रकाशन लोड हो रहे हैं...",
    tuAlcance: "📍 आपकी पहुंच",
    detectandoIP: "IP पहचान रहे हैं...",
    patrocinadores: "प्रायोजक"
  },
  nl: {
    logo: " remarket-db OS",
    chatPlaceholder: "Typ hier uw vraag...",
    chatBtn: "Verzenden",
    catalogoTitulo: "🌱 Circulaire Economie Catalogus",
    catalogoSub: "Ontdek items beschikbaar voor uitwisseling in uw regio",
    btnPublicar: "📦 Publiceren",
    saludoIA: "Hallo! Ik ben uw wereldwijde circulaire economie assistent. Wat heeft u vandaag nodig?",
    detectandoUbicacion: "🔍 Uw locatie detecteren en publicaties laden...",
    tuAlcance: " Uw Bereik",
    detectandoIP: "IP detecteren...",
    patrocinadores: "Sponsors"
  },
  tr: {
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
    logo: "🌱 remarket-db Llamk'ay Sistema",
    chatPlaceholder: "Tapuyniykita kaypi qillqay...",
    chatBtn: "Kachay",
    catalogoTitulo: "🌱 Muyuq Economia Qhatu",
    catalogoSub: "Llaqtaykipi tikranapaq kaqkunata taripay",
    btnPublicar: "📦 Qillqay",
    saludoIA: "Allillanchu! Noqaqa global muyuq economia yanapaqmi. Imatataq kunan p'unchaw munanki?",
    detectandoUbicacion: "🔍 Maypi kasqaykita tarispa qillqasqakunata apachkani...",
    tuAlcance: "📍 Qampa chayanan",
    detectandoIP: "IP tarispa...",
    patrocinadores: "Yanapaqkuna"
  },
  ay: {
    logo: "🌱 remarket-db Luräwi Sistema",
    chatPlaceholder: "Jiskisamaxa aka qillqt'asma...",
    chatBtn: "Apayaña",
    catalogoTitulo: "🌱 Muyt'awi Economía Uñacht'awi",
    catalogoSub: "Aka markanxa tukuyata uñjaña",
    btnPublicar: "📦 Qillqt'aña",
    saludoIA: "Aski urukipansa! Noqaxa global muyt'awi economía yanapt'ayiriwa. Kunatix jichhüruxa muntaxa?",
    detectandoUbicacion: " Mayacht'ataskiwa ukat qillqatanaka apthapiskiwa...",
    tuAlcance: "📍 Kamachima",
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
  muro.innerHTML = '<div class="multimedia-search"><h2 class="search-title"> Resultados para: "' + query + '"</h2><p class="search-subtitle">' + resultados.articulos.length + ' artículos encontrados</p>' +
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
  const iconos = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 51: '🌦️', 61: '🌧️', 71: '️', 80: '🌦️', 95: '⛈️' };
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
  chatHistorial.innerHTML += '<div class="msg-ia" id="ia-escribiendo">🤖 Pensando...</div>';
  try {
    const tipo = detectarTipoDeBusqueda(texto);
    const ubicacion = document.getElementById('texto-ubicacion').innerText || "Callao, Perú";
    const ciudad = ubicacion.split(',')[0].trim();
    if (tipo === 'CLIMA') {
      document.getElementById('ia-escribiendo').innerText = "🌤️ Consultando el clima...";
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
      chatHistorial.innerHTML += '<div class="msg-ia"> Son las ' + horaActual + ' en ' + ubicacion + '.</div>';
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
      if (productos.length > 0) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">¡Encontré ' + productos.length + ' productos de "' + texto + '" en ' + ciudad + '! 🛍️ Los puedes ver en el panel central.</div>';
        mostrarProductosEnMuro(productos, texto);
      } else {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">Aún no hay "' + texto + '" en ' + ciudad + ', pero puedes ser el primero en publicar uno. 📸</div>';
      }
      return;
    }
    if (tipo === 'WEB') {
      document.getElementById('ia-escribiendo').innerText = "🌐 Buscando en la web...";
      const resultados = await buscarEnLaWebConMultimedia(texto);
      if (resultados && (resultados.articulos.length > 0 || resultados.videos.length > 0)) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">¡Encontré información sobre "' + texto + '"! 🎯 Te dejé artículos y videos en el panel central. 👇</div>';
        mostrarResultadosMultimediaEnMuro(resultados, texto);
      } else {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += '<div class="msg-ia">No encontré resultados para "' + texto + '". Intenta con otra palabra. 🔍</div>';
      }
      return;
    }
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mensajeEnriquecido = '[Usuario en ' + ubicacion + ', hora: ' + horaActual + '] ' + texto;
    const respuestaIA = await llamarGroqConModeloDisponible(mensajeEnriquecido);
    document.getElementById('ia-escribiendo').remove();
    if (!respuestaIA || respuestaIA.trim().length < 5) {
      chatHistorial.innerHTML += '<div class="msg-ia">⚠️ No pude generar una respuesta. Intenta de nuevo.</div>';
    } else {
      chatHistorial.innerHTML += '<div class="msg-ia">' + respuestaIA + '</div>';
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message;
  }
}

// ==========================================
// SECCIÓN 9: GROQ
// ==========================================
async function obtenerModelosDisponibles() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': 'Bearer ' + CONFIG.GROQ_API_KEY } });
    if (!response.ok) throw new Error('No se pudo obtener la lista');
    const data = await response.json();
    return data.data.filter(function(m) {
      const id = m.id.toLowerCase();
      return (id.includes('llama') || id.includes('gemma') || id.includes('mixtral') || id.includes('deepseek') || id.includes('qwen')) && !id.includes('classifier') && !id.includes('embed');
    }).map(function(m) { return m.id; });
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
        headers: { 'Authorization': 'Bearer ' + CONFIG.GROQ_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { role: 'system', content: 'Eres el asistente de remarket-db. REGLA DE ORO: Responde SIEMPRE en el mismo idioma en el que el usuario te escribió. Si escribe en español, responde en español. Si escribe en inglés, responde en inglés. Si escribe en chino, responde en chino. Si escribe en quechua, responde en quechua. No traduzcas, piensa y redacta directamente en el idioma del usuario. Responde en 1-2 oraciones.' },
            { role: 'user', content: mensaje }
          ],
          temperature: 0.5,
          max_tokens: 150
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        ultimoError = new Error(errorData.error?.message || 'Error ' + response.status);
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
// SECCIÓN 10: FILTRO ULTRA-AGRESIVO
// ==========================================
function limpiarRespuestaIA(respuesta) {
  const lineas = respuesta.split('\n');
  const validas = [];
  const palabrasTecnicas = [
    'analyze user', 'role/constraints', 'key requirements',
    'context acknowledgment', 'mention location', 'remarket-db assistant',
    'implies database', 'input:', 'context:', 'language:', 'role:',
    'length:', 'tone:', 'formulate', 'internal refinement',
    'user is in', 'spanish - always', 'never use english',
    'virtual assistant for', 'circular economy platform',
    'max 2-3 sentences', 'like talking to a friend',
    'draft response', 'check constraints', 'final polish',
    'mental draft', 'all rules satisfied', 'output matches',
    'here\'s a thinking', 'thinking process', 'formulate response'
  ];
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    const lower = linea.toLowerCase();
    if (linea.length < 15) continue;
    const esTecnica = palabrasTecnicas.some(function(palabra) {
      return lower.includes(palabra);
    });
    if (esTecnica) continue;
    validas.push(linea);
  }
  let final = validas.join(' ').replace(/\s+/g, ' ').replace(/\*\*/g, '').trim();
  if (final.length < 10 || final.toLowerCase().includes('analyze') || final.toLowerCase().includes('constraint')) {
    return "¡Hola! ¿En qué puedo ayudarte hoy?";
  }
  return final;
}

// ==========================================
// SECCIÓN 11: ESTILOS
// ==========================================
function agregarEstilosBuscador() {
  if (document.getElementById('estilos-buscador')) return;
  const estilos = '<style id="estilos-buscador">.multimedia-search{padding:20px;animation:fadeIn 0.5s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.search-title{color:#2c3e50;margin-bottom:5px;font-size:24px}.search-subtitle{color:#7f8c8d;margin-bottom:25px;font-size:14px}.results-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-bottom:30px}.result-card{background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);text-decoration:none;color:inherit;transition:all 0.3s ease;display:flex;flex-direction:column}.result-card:hover{transform:translateY(-5px);box-shadow:0 8px 25px rgba(0,0,0,0.15)}.card-img{width:100%;height:180px;object-fit:cover}.card-img-placeholder{width:100%;height:180px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;font-size:60px;color:white}.card-body{padding:15px;flex-grow:1;display:flex;flex-direction:column}.card-body h4{color:#2980b9;margin:0 0 10px 0;font-size:16px}.card-body p{color:#555;font-size:13px;line-height:1.5;margin:0 0 15px 0;flex-grow:1}.btn-leer{color:#27ae60;font-weight:bold;font-size:13px}.producto-meta{display:flex;justify-content:space-between;margin:10px 0;font-size:13px}.precio{color:#27ae60;font-weight:bold}.ciudad{color:#7f8c8d}.btn-contactar{background:#27ae60;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;margin-top:10px}.video-section{margin-top:30px}.video-section h3{color:#2c3e50;margin-bottom:15px;font-size:20px}.youtube-link-card{display:flex;align-items:center;gap:15px;background:#ff0000;color:white;padding:20px;border-radius:12px;text-decoration:none;transition:all 0.3s}.youtube-link-card:hover{background:#cc0000;transform:translateY(-3px)}.youtube-icon{font-size:40px}.youtube-link-card h4{margin:0 0 5px 0}.youtube-link-card p{margin:0;font-size:13px;opacity:0.9}.search-empty{text-align:center;padding:40px;color:#7f8c8d}.clima-card{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px;border-radius:16px;text-align:center}.clima-card h2{margin:0 0 20px 0;font-size:28px}.clima-temp{font-size:72px;font-weight:bold;margin:20px 0}@media (max-width:768px){.results-grid{grid-template-columns:1fr}}</style>';
  document.head.insertAdjacentHTML('beforeend', estilos);
}
agregarEstilosBuscador();

// ==========================================
// SECCIÓN 13: SISTEMA DE TRADUCCIÓN
// ==========================================
function aplicarTraduccion(idioma) {
  const t = traducciones[idioma] || traducciones['es'];
  const logo = document.querySelector('.logo');
  if (logo) logo.textContent = t.logo;
  const chatInputEl = document.getElementById('chat-input');
  if (chatInputEl) chatInputEl.placeholder = t.chatPlaceholder;
  const chatBtnEl = document.getElementById('chat-btn');
  if (chatBtnEl) chatBtnEl.textContent = t.chatBtn;
  const catTitulo = document.querySelector('.catalogo h2');
  if (catTitulo) catTitulo.textContent = t.catalogoTitulo;
  const catSub = document.querySelector('.subtitulo');
  if (catSub) catSub.textContent = t.catalogoSub;
  const saludoIA = document.querySelector('#chat-historial .msg-ia');
  if (saludoIA) saludoIA.textContent = t.saludoIA;
  const muroTexto = document.querySelector('#muro-publicaciones p');
  if (muroTexto && muroTexto.textContent.includes('Detectando')) {
    muroTexto.textContent = t.detectandoUbicacion;
  }
  const textoUbicacion = document.querySelector('#texto-ubicacion');
  if (textoUbicacion && textoUbicacion.textContent.includes('Detectando')) {
    textoUbicacion.textContent = t.detectandoIP;
  }
  localStorage.setItem('idiomaPreferido', idioma);
  console.log("✅ Idioma aplicado:", idioma);
}

async function detectarYAplicarIdioma() {
  const guardado = localStorage.getItem('idiomaPreferido');
  if (guardado && traducciones[guardado]) {
    aplicarTraduccion(guardado);
    return;
  }
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const pais = data.country_code;
    const mapa = { 
      'PE': 'es', 'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'EC': 'es', 'BO': 'es', 'VE': 'es',
      'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
      'CN': 'zh', 'TW': 'zh', 'HK': 'zh',
      'BR': 'pt', 'PT': 'pt',
      'FR': 'fr', 'BE': 'fr', 'CH': 'fr',
      'DE': 'de', 'AT': 'de',
      'IT': 'it', 'JP': 'ja', 'KR': 'ko',
      'SA': 'ar', 'AE': 'ar', 'EG': 'ar',
      'IN': 'hi', 'NL': 'nl', 'TR': 'tr', 'BG': 'bg', 'QU': 'qu', 'AY': 'ay'
    };
    const idiomaDetectado = mapa[pais] || 'es';
    aplicarTraduccion(idiomaDetectado);
  } catch (error) {
    console.log("No se pudo detectar IP, usando español.");
    aplicarTraduccion('es');
  }
}

function cambiarIdiomaManual(idioma) {
  aplicarTraduccion(idioma);
  location.reload();
}
window.cambiarIdiomaManual = cambiarIdiomaManual;

// ==========================================
// SECCIÓN 12: INICIO
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log("remarket-db OS Iniciado");
  await detectarUbicacion();
  await detectarYAplicarIdioma();
});

// ==========================================
// CONECTAR EL BUSCADOR DE ARRIBA
// ==========================================
const buscadorArriba = document.getElementById('buscador-principal');
if (buscadorArriba && chatInput && chatBtn) {
  buscadorArriba.addEventListener('keypress', function(evento) {
    if (evento.key === 'Enter') {
      const texto = buscadorArriba.value.trim();
      if (texto.length > 0) {
        chatInput.value = texto;
        chatBtn.click();
        buscadorArriba.value = '';
      }
    }
  });
}
