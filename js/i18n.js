// ============================================
// IDIOMA
// ============================================
var idiomaDetectado = 'es';
var IDIOMAS_SOPORTADOS = ['es', 'en', 'bg', 'fr', 'pt', 'de', 'it', 'ru', 'zh', 'ja', 'qu', 'ay', 'ko', 'ar', 'hi', 'nl', 'tr'];

function detectarIdiomaNavegador() {
    var lang = navigator.language || navigator.userLanguage || 'es';
    var codigo = lang.split('-')[0].toLowerCase();
    if (IDIOMAS_SOPORTADOS.includes(codigo)) { idiomaDetectado = codigo; } else { idiomaDetectado = 'es'; }
    return idiomaDetectado;
}

// Micro-Paso 1.1: Persistencia del idioma.
// Prioridad: 1) idioma guardado por el usuario en localStorage,
//            2) idioma del usuario logueado (usuarioActual.idioma_preferido),
//            3) idioma detectado por el navegador (fallback).
function obtenerIdiomaPreferido() {
    try {
        var guardado = localStorage.getItem('idioma_preferido');
        if (guardado && IDIOMAS_SOPORTADOS.includes(guardado)) {
            idiomaDetectado = guardado;
            return guardado;
        }
    } catch (e) { console.warn('No se pudo leer idioma_preferido de localStorage:', e); }
    return detectarIdiomaNavegador();
}

// Permite pedirle al chat que cambie el idioma escribiéndolo, ej: "cambia el idioma a inglés", "switch to english".
var NOMBRES_IDIOMA_DISPLAY = { es: 'Español', en: 'English', bg: 'Български', fr: 'Français', pt: 'Português', de: 'Deutsch', it: 'Italiano', ru: 'Русский', zh: '中文', ja: '日本語', qu: 'Quechua', ay: 'Aymara', ko: '한국어', ar: 'العربية', hi: 'हिन्दी', nl: 'Nederlands', tr: 'Türkçe' };
var MAPA_IDIOMAS_DETECCION = {
    'espanol': 'es', 'castellano': 'es', 'spanish': 'es',
    'ingles': 'en', 'english': 'en',
    'frances': 'fr', 'french': 'fr',
    'portugues': 'pt', 'portuguese': 'pt',
    'aleman': 'de', 'german': 'de', 'deutsch': 'de',
    'italiano': 'it', 'italian': 'it',
    'ruso': 'ru', 'russian': 'ru',
    'chino': 'zh', 'chinese': 'zh', 'mandarin': 'zh',
    'japones': 'ja', 'japanese': 'ja',
    'quechua': 'qu',
    'aymara': 'ay',
    'coreano': 'ko', 'korean': 'ko',
    'arabe': 'ar', 'arabic': 'ar',
    'hindi': 'hi',
    'holandes': 'nl', 'neerlandes': 'nl', 'dutch': 'nl',
    'turco': 'tr', 'turkish': 'tr',
    'bulgaro': 'bg', 'bulgarian': 'bg'
};
// Devuelve el código de idioma detectado en el mensaje si el usuario está pidiendo un cambio de idioma, o null si no.
function detectarCambioIdiomaEnMensaje(mensaje) {
    var sinTildes = function(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    var texto = ' ' + sinTildes(mensaje) + ' ';
    var disparadores = ['cambia', 'cambiar', 'cambiame', 'pon el idioma', 'poner el idioma', 'switch to', 'change language', 'change the language', 'set language', 'habla en', 'hablar en', 'hablame en', 'hablarme en', 'puedes hablar en', 'podrias hablar en', 'me hablas en', 'responde en', 'responder en', 'respondeme en', 'idioma a', 'language to'];
    var tieneDisparador = disparadores.some(function(d) { return texto.indexOf(d) !== -1; });
    if (!tieneDisparador) return null;
    for (var palabra in MAPA_IDIOMAS_DETECCION) {
        if (texto.indexOf(' ' + palabra) !== -1) return MAPA_IDIOMAS_DETECCION[palabra];
    }
    return null;
}
// Aplica el cambio de idioma pedido desde el chat, reutilizando la misma función del panel visual.
function aplicarCambioIdiomaDesdeChat(codigo) {
    changeLanguage(codigo, NOMBRES_IDIOMA_DISPLAY[codigo] || codigo.toUpperCase(), null);
}

// ============================================
// TRADUCCIONES UI
// ============================================
const UI_TRANSLATIONS = {
    es: { account_btn: "Mi Cuenta", content_title: "🌱 Catálogo de Economía Circular", content_subtitle: "Descubre artículos disponibles para intercambio en tu zona", featured_title: "Artículos Destacados", search_placeholder: "¿Qué estás buscando hoy? Ej: camisa, laptop, carros...", login_tab: "Iniciar Sesión", register_tab: "Registrarse", assistant_header: "🤖 Asistente IA", footer_desc: "Conectando comercios y vecinos de forma inteligente.",
        menu_inicio: "Inicio", menu_perfil: "Mi Perfil", menu_publicaciones: "Mis Publicaciones", menu_mensajes: "Mensajes", menu_favoritos: "Favoritos", menu_config: "Configuración",
        panel_alcance: "Tu Alcance", panel_intereses: "Tus Intereses", btn_publicar: "Publicar",
        quick_publicar: "¿Cómo publico?", quick_vender: "¿Cómo vendo?", quick_seguridad: "Seguridad", quick_reportar: "Reportar", btn_limpiar: "Limpiar Conversación", bienvenida_title: "👋 Bienvenido a remarket-db", bienvenida_subtitle: "Conoce la plataforma antes de empezar" },
    en: { account_btn: "My Account", content_title: "🌱 Circular Economy Catalog", content_subtitle: "Discover items available for exchange in your area", featured_title: "Featured Items", search_placeholder: "What are you looking for today? Ex: shirt, laptop, cars...", login_tab: "Sign In", register_tab: "Sign Up", assistant_header: "🤖 AI Assistant", footer_desc: "Connecting businesses and neighbors smartly.",
        menu_inicio: "Home", menu_perfil: "My Profile", menu_publicaciones: "My Listings", menu_blog: "My Blog", menu_mensajes: "Messages", menu_favoritos: "Favorites", menu_config: "Settings",
        panel_alcance: "Your Reach", panel_intereses: "Your Interests", btn_publicar: "Post",
        quick_publicar: "How do I post?", quick_vender: "How do I sell?", quick_seguridad: "Safety", quick_reportar: "Report", btn_limpiar: "Clear Conversation", bienvenida_title: "👋 Welcome to remarket-db", bienvenida_subtitle: "Get to know the platform before you start" },
    pt: { account_btn: "Minha Conta", content_title: "🌱 Catálogo de Economia Circular", content_subtitle: "Descubra itens disponíveis para troca na sua área", featured_title: "Itens em Destaque", search_placeholder: "O que você procura hoje? Ex: camisa, laptop, carros...", login_tab: "Entrar", register_tab: "Registrar", assistant_header: "🤖 Assistente de IA", footer_desc: "Conectando empresas e vizinhos de forma inteligente.",
        menu_inicio: "Início", menu_perfil: "Meu Perfil", menu_publicaciones: "Minhas Publicações", menu_blog: "Meu Blog", menu_mensajes: "Mensagens", menu_favoritos: "Favoritos", menu_config: "Configurações",
        panel_alcance: "Seu Alcance", panel_intereses: "Seus Interesses", btn_publicar: "Publicar",
        quick_publicar: "Como publico?", quick_vender: "Como vendo?", quick_seguridad: "Segurança", quick_reportar: "Denunciar", btn_limpiar: "Limpar Conversa", bienvenida_title: "👋 Bem-vindo ao remarket-db", bienvenida_subtitle: "Conheça a plataforma antes de começar" },
    fr: { account_btn: "Mon Compte", content_title: "🌱 Catalogue d'Économie Circulaire", content_subtitle: "Découvrez des articles disponibles pour l'échange dans votre région", featured_title: "Articles en Vedette", search_placeholder: "Que cherchez-vous aujourd'hui? Ex: chemise, ordinateur, voitures...", login_tab: "Se connecter", register_tab: "S'inscrire", assistant_header: "🤖 Assistant IA", footer_desc: "Connecter les entreprises et les voisins intelligemment.",
        menu_inicio: "Accueil", menu_perfil: "Mon Profil", menu_publicaciones: "Mes Annonces", menu_blog: "Mon Blog", menu_mensajes: "Messages", menu_favoritos: "Favoris", menu_config: "Paramètres",
        panel_alcance: "Votre Portée", panel_intereses: "Vos Intérêts", btn_publicar: "Publier",
        quick_publicar: "Comment publier?", quick_vender: "Comment vendre?", quick_seguridad: "Sécurité", quick_reportar: "Signaler", btn_limpiar: "Effacer la Conversation", bienvenida_title: "👋 Bienvenue sur remarket-db", bienvenida_subtitle: "Découvrez la plateforme avant de commencer" },
    de: { account_btn: "Mein Konto", content_title: "🌱 Katalog der Kreislaufwirtschaft", content_subtitle: "Entdecke verfügbare Artikel zum Tausch in deiner Region", featured_title: "Empfohlene Artikel", search_placeholder: "Was suchst du heute? Z.B: Hemd, Laptop, Autos...", login_tab: "Anmelden", register_tab: "Registrieren", assistant_header: "🤖 KI-Assistent", footer_desc: "Verbindet Geschäfte und Nachbarn auf intelligente Weise.",
        menu_inicio: "Start", menu_perfil: "Mein Profil", menu_publicaciones: "Meine Anzeigen", menu_mensajes: "Nachrichten", menu_favoritos: "Favoriten", menu_config: "Einstellungen",
        panel_alcance: "Deine Reichweite", panel_intereses: "Deine Interessen", btn_publicar: "Veröffentlichen",
        quick_publicar: "Wie veröffentliche ich?", quick_vender: "Wie verkaufe ich?", quick_seguridad: "Sicherheit", quick_reportar: "Melden", btn_limpiar: "Unterhaltung löschen", bienvenida_title: "👋 Willkommen bei remarket-db", bienvenida_subtitle: "Lernen Sie die Plattform kennen, bevor Sie starten" },
    it: { account_btn: "Il Mio Account", content_title: "🌱 Catalogo dell'Economia Circolare", content_subtitle: "Scopri gli articoli disponibili per lo scambio nella tua zona", featured_title: "Articoli in Evidenza", search_placeholder: "Cosa cerchi oggi? Es: camicia, laptop, auto...", login_tab: "Accedi", register_tab: "Registrati", assistant_header: "🤖 Assistente IA", footer_desc: "Collega attività e vicini in modo intelligente.",
        menu_inicio: "Home", menu_perfil: "Il Mio Profilo", menu_publicaciones: "I Miei Annunci", menu_mensajes: "Messaggi", menu_favoritos: "Preferiti", menu_config: "Impostazioni",
        panel_alcance: "La Tua Portata", panel_intereses: "I Tuoi Interessi", btn_publicar: "Pubblica",
        quick_publicar: "Come pubblico?", quick_vender: "Come vendo?", quick_seguridad: "Sicurezza", quick_reportar: "Segnala", btn_limpiar: "Cancella Conversazione", bienvenida_title: "👋 Benvenuto su remarket-db", bienvenida_subtitle: "Scopri la piattaforma prima di iniziare" },
    ru: { account_btn: "Мой аккаунт", content_title: "🌱 Каталог циркулярной экономики", content_subtitle: "Найдите товары для обмена в вашем районе", featured_title: "Избранные товары", search_placeholder: "Что вы ищете сегодня? Напр: рубашка, ноутбук, машина...", login_tab: "Войти", register_tab: "Регистрация", assistant_header: "🤖 ИИ-Ассистент", footer_desc: "Умное соединение бизнеса и соседей.",
        menu_inicio: "Главная", menu_perfil: "Мой профиль", menu_publicaciones: "Мои объявления", menu_mensajes: "Сообщения", menu_favoritos: "Избранное", menu_config: "Настройки",
        panel_alcance: "Ваш охват", panel_intereses: "Ваши интересы", btn_publicar: "Опубликовать",
        quick_publicar: "Как опубликовать?", quick_vender: "Как продать?", quick_seguridad: "Безопасность", quick_reportar: "Пожаловаться", btn_limpiar: "Очистить чат", bienvenida_title: "👋 Добро пожаловать в remarket-db", bienvenida_subtitle: "Узнайте о платформе, прежде чем начать" },
    zh: { account_btn: "我的账户", content_title: "🌱 循环经济目录", content_subtitle: "发现你所在地区可交换的物品", featured_title: "精选商品", search_placeholder: "您今天在找什么？例如：衬衫、笔记本电脑、汽车...", login_tab: "登录", register_tab: "注册", assistant_header: "🤖 AI助手", footer_desc: "智能连接商家与邻里。",
        menu_inicio: "首页", menu_perfil: "我的资料", menu_publicaciones: "我的发布", menu_mensajes: "消息", menu_favoritos: "收藏", menu_config: "设置",
        panel_alcance: "你的覆盖范围", panel_intereses: "你的兴趣", btn_publicar: "发布",
        quick_publicar: "如何发布？", quick_vender: "如何出售？", quick_seguridad: "安全", quick_reportar: "举报", btn_limpiar: "清除对话", bienvenida_title: "👋 欢迎来到 remarket-db", bienvenida_subtitle: "开始之前先了解平台" },
    ja: { account_btn: "マイアカウント", content_title: "🌱 循環経済カタログ", content_subtitle: "あなたの地域で交換できるアイテムを見つけよう", featured_title: "おすすめ商品", search_placeholder: "今日は何をお探しですか？例：シャツ、ノートパソコン、車...", login_tab: "ログイン", register_tab: "登録", assistant_header: "🤖 AIアシスタント", footer_desc: "お店と近隣をスマートにつなぐ。",
        menu_inicio: "ホーム", menu_perfil: "マイプロフィール", menu_publicaciones: "マイ出品", menu_mensajes: "メッセージ", menu_favoritos: "お気に入り", menu_config: "設定",
        panel_alcance: "あなたの範囲", panel_intereses: "あなたの興味", btn_publicar: "出品する",
        quick_publicar: "出品方法は？", quick_vender: "販売方法は？", quick_seguridad: "安全", quick_reportar: "通報", btn_limpiar: "会話をクリア", bienvenida_title: "👋 remarket-dbへようこそ", bienvenida_subtitle: "始める前にプラットフォームを知ろう" },
    ko: { account_btn: "내 계정", content_title: "🌱 순환 경제 카탈로그", content_subtitle: "지역 내 교환 가능한 물품을 찾아보세요", featured_title: "추천 상품", search_placeholder: "오늘은 무엇을 찾으세요? 예: 셔츠, 노트북, 자동차...", login_tab: "로그인", register_tab: "회원가입", assistant_header: "🤖 AI 어시스턴트", footer_desc: "상점과 이웃을 스마트하게 연결합니다.",
        menu_inicio: "홈", menu_perfil: "내 프로필", menu_publicaciones: "내 게시물", menu_mensajes: "메시지", menu_favoritos: "즐겨찾기", menu_config: "설정",
        panel_alcance: "내 도달 범위", panel_intereses: "내 관심사", btn_publicar: "게시하기",
        quick_publicar: "게시하는 방법은?", quick_vender: "판매하는 방법은?", quick_seguridad: "보안", quick_reportar: "신고", btn_limpiar: "대화 지우기", bienvenida_title: "👋 remarket-db에 오신 것을 환영합니다", bienvenida_subtitle: "시작하기 전에 플랫폼을 알아보세요" },
    ar: { account_btn: "حسابي", content_title: "🌱 كتالوج الاقتصاد الدائري", content_subtitle: "اكتشف العناصر المتاحة للتبادل في منطقتك", featured_title: "منتجات مميزة", search_placeholder: "عن ماذا تبحث اليوم؟ مثال: قميص، حاسوب، سيارات...", login_tab: "تسجيل الدخول", register_tab: "إنشاء حساب", assistant_header: "🤖 المساعد الذكي", footer_desc: "ربط المتاجر والجيران بذكاء.",
        menu_inicio: "الرئيسية", menu_perfil: "ملفي الشخصي", menu_publicaciones: "إعلاناتي", menu_mensajes: "الرسائل", menu_favoritos: "المفضلة", menu_config: "الإعدادات",
        panel_alcance: "نطاقك", panel_intereses: "اهتماماتك", btn_publicar: "نشر",
        quick_publicar: "كيف أنشر؟", quick_vender: "كيف أبيع؟", quick_seguridad: "الأمان", quick_reportar: "إبلاغ", btn_limpiar: "مسح المحادثة", bienvenida_title: "👋 مرحبًا بك في remarket-db", bienvenida_subtitle: "تعرف على المنصة قبل البدء" },
    hi: { account_btn: "मेरा खाता", content_title: "🌱 सर्कुलर इकॉनमी कैटलॉग", content_subtitle: "अपने क्षेत्र में विनिमय के लिए उपलब्ध वस्तुएं खोजें", featured_title: "प्रमुख वस्तुएं", search_placeholder: "आज आप क्या ढूंढ रहे हैं? जैसे: शर्ट, लैपटॉप, कार...", login_tab: "लॉगिन करें", register_tab: "रजिस्टर करें", assistant_header: "🤖 AI सहायक", footer_desc: "व्यवसायों और पड़ोसियों को समझदारी से जोड़ना।",
        menu_inicio: "होम", menu_perfil: "मेरी प्रोफ़ाइल", menu_publicaciones: "मेरी पोस्ट", menu_mensajes: "संदेश", menu_favoritos: "पसंदीदा", menu_config: "सेटिंग्स",
        panel_alcance: "आपकी पहुंच", panel_intereses: "आपकी रुचियां", btn_publicar: "पोस्ट करें",
        quick_publicar: "मैं कैसे पोस्ट करूं?", quick_vender: "मैं कैसे बेचूं?", quick_seguridad: "सुरक्षा", quick_reportar: "रिपोर्ट करें", btn_limpiar: "बातचीत साफ़ करें", bienvenida_title: "👋 remarket-db में आपका स्वागत है", bienvenida_subtitle: "शुरू करने से पहले प्लेटफ़ॉर्म को जानें" },
    nl: { account_btn: "Mijn Account", content_title: "🌱 Circulaire Economie Catalogus", content_subtitle: "Ontdek artikelen beschikbaar voor ruil in jouw omgeving", featured_title: "Uitgelichte Artikelen", search_placeholder: "Wat zoek je vandaag? Bijv: shirt, laptop, auto's...", login_tab: "Inloggen", register_tab: "Registreren", assistant_header: "🤖 AI-Assistent", footer_desc: "Verbindt bedrijven en buren op een slimme manier.",
        menu_inicio: "Start", menu_perfil: "Mijn Profiel", menu_publicaciones: "Mijn Advertenties", menu_mensajes: "Berichten", menu_favoritos: "Favorieten", menu_config: "Instellingen",
        panel_alcance: "Jouw Bereik", panel_intereses: "Jouw Interesses", btn_publicar: "Plaatsen",
        quick_publicar: "Hoe plaats ik?", quick_vender: "Hoe verkoop ik?", quick_seguridad: "Veiligheid", quick_reportar: "Rapporteren", btn_limpiar: "Gesprek wissen", bienvenida_title: "👋 Welkom bij remarket-db", bienvenida_subtitle: "Leer het platform kennen voordat je begint" },
    tr: { account_btn: "Hesabım", content_title: "🌱 Döngüsel Ekonomi Kataloğu", content_subtitle: "Bölgenizde takas için mevcut ürünleri keşfedin", featured_title: "Öne Çıkan Ürünler", search_placeholder: "Bugün ne arıyorsun? Örn: gömlek, laptop, araba...", login_tab: "Giriş Yap", register_tab: "Kayıt Ol", assistant_header: "🤖 Yapay Zeka Asistanı", footer_desc: "İşletmeleri ve komşuları akıllıca birbirine bağlar.",
        menu_inicio: "Ana Sayfa", menu_perfil: "Profilim", menu_publicaciones: "İlanlarım", menu_mensajes: "Mesajlar", menu_favoritos: "Favoriler", menu_config: "Ayarlar",
        panel_alcance: "Erişimin", panel_intereses: "İlgi Alanların", btn_publicar: "Yayınla",
        quick_publicar: "Nasıl yayınlarım?", quick_vender: "Nasıl satarım?", quick_seguridad: "Güvenlik", quick_reportar: "Bildir", btn_limpiar: "Sohbeti Temizle", bienvenida_title: "👋 remarket-db'ye hoş geldiniz", bienvenida_subtitle: "Başlamadan önce platformu tanıyın" },
    bg: { account_btn: "Моят акаунт", content_title: "🌱 Каталог на кръговата икономика", content_subtitle: "Открийте налични артикули за размяна във вашия район", featured_title: "Препоръчани артикули", search_placeholder: "Какво търсите днес? Напр: риза, лаптоп, коли...", login_tab: "Вход", register_tab: "Регистрация", assistant_header: "🤖 ИИ Асистент", footer_desc: "Свързва бизнеси и съседи по интелигентен начин.",
        menu_inicio: "Начало", menu_perfil: "Моят профил", menu_publicaciones: "Моите обяви", menu_mensajes: "Съобщения", menu_favoritos: "Любими", menu_config: "Настройки",
        panel_alcance: "Вашият обхват", panel_intereses: "Вашите интереси", btn_publicar: "Публикувай",
        quick_publicar: "Как да публикувам?", quick_vender: "Как да продам?", quick_seguridad: "Сигурност", quick_reportar: "Докладвай", btn_limpiar: "Изчисти разговора", bienvenida_title: "👋 Добре дошли в remarket-db", bienvenida_subtitle: "Опознайте платформата, преди да започнете" },
    // NOTA: traducción de buena fe (quechua sureño / Cusco-Collao). Se recomienda que un hablante
    // nativo la revise antes de usarla en producción, ya que el quechua no tiene una única ortografía estándar.
    qu: { account_btn: "Cuentay", content_title: "🌱 Muyuq Kawsay Qhatu", content_subtitle: "Llaqtaykipi kutichisqa kaqkunata tarikuy", featured_title: "Akllasqa Kaqkuna", search_placeholder: "¿Imatataq maskanki kunan? Ejemplo: p'acha, laptop, karro...", login_tab: "Yaykuy", register_tab: "Qillqakuy", assistant_header: "🤖 IA Yanapaq", footer_desc: "Qhatukunata, wasimasikunatawan yachayniyuq tinkichisqa.",
        menu_inicio: "Qallariy", menu_perfil: "Perfilniy", menu_publicaciones: "Qillqasqaykuna", menu_mensajes: "Willakuykuna", menu_favoritos: "Munasqaykuna", menu_config: "Allichaykuna",
        panel_alcance: "Chayasqayki", panel_intereses: "Munasqaykikuna", btn_publicar: "Qillqay",
        quick_publicar: "¿Imaynatataq qillqani?", quick_vender: "¿Imaynatataq rantikuni?", quick_seguridad: "Waqaychay", quick_reportar: "Willay", btn_limpiar: "Rimanakuyta Pichay", bienvenida_title: "👋 Allin hamusqa remarket-db-man", bienvenida_subtitle: "Qallariyta ñawpaqta plataformata riqsiy" },
    // NOTA: traducción de buena fe (aymara). Se recomienda que un hablante nativo la revise
    // antes de usarla en producción, por la misma razón que el quechua.
    ay: { account_btn: "Kuentaja", content_title: "🌱 Muyt'ata Katalogo", content_subtitle: "Marka manqhankiri turkañataki utjki ukanaka jikxataña", featured_title: "Ajlliski Amtanaka", search_placeholder: "¿Kunsa jichhürux thaqhta? Sasin: isi, laptop, wasa...", login_tab: "Mantaña", register_tab: "Qillqantaña", assistant_header: "🤖 IA Yanapiri", footer_desc: "Alanaka ukat jakpast'irinaka yatiñampi apxatasiñataki.",
        menu_inicio: "Qalltawi", menu_perfil: "Perfilja", menu_publicaciones: "Qillqatanaka", menu_mensajes: "Aruskipäwinaka", menu_favoritos: "Munat Amtanaka", menu_config: "Wakichäwinaka",
        panel_alcance: "Puriwipa", panel_intereses: "Munañanaka", btn_publicar: "Uñstayaña",
        quick_publicar: "¿Kamsa apayasi?", quick_vender: "¿Kamsa aljta?", quick_seguridad: "Jark'aqäwi", quick_reportar: "Yatiyaña", btn_limpiar: "Aruskipäwi Q'umachaña", bienvenida_title: "👋 Suma Jutawi remarket-db-ru", bienvenida_subtitle: "Qalltañataki plataforma uñt'ama" },
};

// Título de la sección informativa del muro ("Sobre remarket-db"). Aparte de UI_TRANSLATIONS
// porque ese contenido lo pinta contenido-info.js, no aplicarTraduccionUI.
var SOBRE_TITULO_TRADUCIDO = { es: 'Sobre remarket-db', en: 'About remarket-db', pt: 'Sobre o remarket-db', fr: 'À propos de remarket-db', de: 'Über remarket-db', it: 'Info su remarket-db', ru: 'О remarket-db', zh: '关于 remarket-db', ja: 'remarket-dbについて', ko: 'remarket-db 소개', ar: 'حول remarket-db', hi: 'remarket-db के बारे में', nl: 'Over remarket-db', tr: 'remarket-db Hakkında', bg: 'За remarket-db', qu: 'remarket-db Rikuchisqa', ay: 'remarket-db Toqita' };
function obtenerSobreTitulo(lang) { return SOBRE_TITULO_TRADUCIDO[lang] || SOBRE_TITULO_TRADUCIDO['es']; }

function aplicarTraduccionUI(lang) {
    const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['es'];
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn && !accountBtn.querySelector('.user-email')) accountBtn.textContent = t.account_btn;
    const contentTitle = document.getElementById('contentTitle'); if (contentTitle) contentTitle.textContent = t.content_title;
    const contentSubtitle = document.getElementById('contentSubtitle'); if (contentSubtitle) contentSubtitle.textContent = t.content_subtitle;
    const featuredTitle = document.getElementById('featuredTitle'); if (featuredTitle) featuredTitle.textContent = t.featured_title;
    const assistantHeader = document.getElementById('assistantHeaderTitle'); if (assistantHeader) assistantHeader.textContent = t.assistant_header;
    const searchInput = document.getElementById('dynamicSearch'); if (searchInput) searchInput.placeholder = t.search_placeholder;
    const tabLogin = document.getElementById('tabLogin'); if (tabLogin) tabLogin.textContent = t.login_tab;
    const tabRegister = document.getElementById('tabRegister'); if (tabRegister) tabRegister.textContent = t.register_tab;
    const footerDesc = document.getElementById('footerDesc'); if (footerDesc) footerDesc.textContent = t.footer_desc;

    // Menú lateral
    var mapaMenu = { menuTextInicio: 'menu_inicio', menuTextPerfil: 'menu_perfil', menuTextPublicaciones: 'menu_publicaciones', menuTextMensajes: 'menu_mensajes', menuTextFavoritos: 'menu_favoritos', menuTextConfig: 'menu_config',
        panelTextAlcance: 'panel_alcance', panelTextIntereses: 'panel_intereses', btnPublicarTexto: 'btn_publicar',
        quickTextPublicar: 'quick_publicar', quickTextVender: 'quick_vender', quickTextSeguridad: 'quick_seguridad', quickTextReportar: 'quick_reportar', btnLimpiarTexto: 'btn_limpiar' };
    Object.keys(mapaMenu).forEach(function(elId) {
        var el = document.getElementById(elId);
        if (el && t[mapaMenu[elId]]) el.textContent = t[mapaMenu[elId]];
    });
}

// ============================================
// DROPDOWN DE IDIOMA
// ============================================
function toggleLanguageDropdown() { document.getElementById('languageDropdown').classList.toggle('show'); }

function changeLanguage(lang, nombre, elementoClic) {
    idiomaDetectado = lang;
    try { localStorage.setItem('idioma_preferido', lang); } catch (e) { console.warn('No se pudo guardar idioma_preferido:', e); }
    document.getElementById('selectedLanguage').textContent = nombre || lang.toUpperCase();
    document.querySelectorAll('.language-dropdown-item').forEach(i => i.classList.remove('active'));
    var origenClic = elementoClic || (typeof event !== 'undefined' && event ? event.currentTarget : null);
    if (origenClic && origenClic.classList) origenClic.classList.add('active');
    var dropdownEl = document.getElementById('languageDropdown');
    if (dropdownEl) dropdownEl.classList.remove('show');
    
    var saludos = {
        'es': '¡Hola! Soy tu asistente de economía circular global. ¿Qué necesitas hoy?',
        'en': 'Hello! I am your global circular economy assistant. What do you need today?',
        'pt': 'Olá! Sou seu assistente de economia circular global. O que você precisa hoje?',
        'fr': 'Bonjour! Je suis votre assistant mondial d\'économie circulaire. De quoi avez-vous besoin aujourd\'hui?',
        'bg': 'Здравейте! Аз съм вашият асистент за кръгова икономика.',
        'qu': 'Allin p\'unchaw! Qamta yanapayta munani. ¿Imatataq munanki?',
        'ay': 'Aspakiruski! Qamta yanapt\'añataki. ¿Kunsa muntaxa?'
    };
    document.getElementById('assistantResponse').innerHTML = '<div class="chat-message assistant">' + (saludos[lang] || saludos['es']) + '</div>';
    AIService.limpiarHistorial();

    aplicarTraduccionUI(lang);
    // Si el muro está mostrando el contenido informativo (usuario sin sesión, sin búsqueda
    // activa), hay que volver a pintarlo -- si no, se queda en el idioma con el que cargó
    // la página la primera vez, aunque el resto de la interfaz ya haya cambiado.
    if (!usuarioActual && typeof ContenidoInfo !== 'undefined' && document.getElementById('articulosContainer')) {
        ContenidoInfo.mostrarEnMuro(lang);
    }
}

document.addEventListener('click', function(event) {
    if (!event.target.closest('.language-selector-wrapper')) { document.getElementById('languageDropdown').classList.remove('show'); }
});

// ============================================
// DETECCIÓN AUTOMÁTICA DE IDIOMA POR ESCRITURA
// ============================================
// Cambia la interfaz sola cuando el usuario escribe en otro idioma en el buscador o el chat,
// SIN que tenga que pedirlo con una frase como "switch to english".
// Quechua y aymara quedan fuera a propósito: no hay base confiable de palabras comunes para
// detectarlos con este método simple, así que para esos dos el cambio sigue siendo manual
// (selector 🌐, o pedírselo directamente al chat).
var IDIOMAS_AUTODETECTABLES = ['es', 'en', 'pt', 'fr', 'de', 'it', 'nl', 'tr', 'ru', 'bg', 'zh', 'ja', 'ko', 'ar', 'hi'];

// Palabras muy comunes y distintivas por idioma (artículos, pronombres, saludos), sin tildes.
var PALABRAS_COMUNES_IDIOMA = {
    es: ['el', 'la', 'los', 'las', 'que', 'es', 'como', 'para', 'quiero', 'hola', 'gracias', 'donde', 'necesito', 'puedo'],
    en: ['the', 'is', 'are', 'you', 'and', 'what', 'how', 'my', 'want', 'hello', 'thanks', 'where', 'need', 'can'],
    pt: ['o', 'a', 'os', 'as', 'voce', 'para', 'com', 'isso', 'nao', 'como', 'meu', 'minha', 'quero', 'ola', 'obrigado'],
    fr: ['le', 'la', 'les', 'vous', 'est', 'avec', 'pour', 'comment', 'je', 'moi', 'bonjour', 'merci', 'veux'],
    de: ['der', 'die', 'das', 'und', 'ist', 'sie', 'ich', 'wie', 'fur', 'mochte', 'danke', 'hallo'],
    it: ['il', 'gli', 'sono', 'tu', 'come', 'per', 'che', 'vorrei', 'ciao', 'grazie'],
    nl: ['het', 'een', 'jij', 'met', 'hoe', 'wil', 'hallo', 'dank'],
    tr: ['bir', 'bu', 've', 'ile', 'nasil', 'ben', 'sen', 'istiyorum', 'merhaba', 'tesekkur']
};

// Detecta el idioma "real" del mensaje del usuario. Devuelve un código de IDIOMAS_AUTODETECTABLES
// o null si el mensaje es demasiado corto/ambiguo para decidir (en ese caso NO se cambia nada).
function detectarIdiomaEscritoEnMensaje(mensaje) {
    if (!mensaje) return null;
    var texto = mensaje.trim();
    // Mensajes cortos o ambiguos (ok, sí, 5, un emoji) no alcanzan para decidir con confianza.
    // Se cuentan letras de CUALQUIER alfabeto (\p{L}), no solo el latino -- si no, un mensaje
    // en chino, árabe, coreano, etc. siempre "mediría" longitud 0 y nunca se detectaría.
    if (texto.replace(/[^\p{L}]/gu, '').length < 8) return null;

    // 1) Alfabetos/escrituras propias: mucho más confiables que listas de palabras.
    if (/[\u4E00-\u9FFF]/.test(texto) && !/[\u3040-\u30FF]/.test(texto)) return 'zh'; // chino (sin hiragana/katakana)
    if (/[\u3040-\u30FF]/.test(texto)) return 'ja'; // japonés (hiragana/katakana)
    if (/[\uAC00-\uD7A3]/.test(texto)) return 'ko'; // coreano
    if (/[\u0600-\u06FF]/.test(texto)) return 'ar'; // árabe
    if (/[\u0900-\u097F]/.test(texto)) return 'hi'; // hindi
    if (/[\u0400-\u04FF]/.test(texto)) {
        // Cirílico: ruso y búlgaro comparten alfabeto. "что" es marcador típico de ruso,
        // "какво"/"ли" de búlgaro. Si no hay marcador claro, no se arriesga el cambio.
        var bajo = texto.toLowerCase();
        if (bajo.indexOf('какво') !== -1 || bajo.indexOf(' ли ') !== -1) return 'bg';
        if (bajo.indexOf('что') !== -1 || bajo.indexOf('привет') !== -1) return 'ru';
        return null;
    }

    // 2) Alfabeto latino: se cuentan coincidencias de palabras comunes por idioma.
    // La puntuación (comas, signos de interrogación, etc.) se convierte en espacio para que
    // palabras como "Bonjour," o "¿Hola?" sí se reconozcan como la palabra suelta que son.
    var normalizado = ' ' + texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\s]/gu, ' ') + ' ';
    var mejorIdioma = null, mejorPuntaje = 0, segundoPuntaje = 0;
    ['es', 'en', 'pt', 'fr', 'de', 'it', 'nl', 'tr'].forEach(function(codigo) {
        var puntaje = 0;
        PALABRAS_COMUNES_IDIOMA[codigo].forEach(function(palabra) {
            if (normalizado.indexOf(' ' + palabra + ' ') !== -1) puntaje++;
        });
        if (puntaje > mejorPuntaje) { segundoPuntaje = mejorPuntaje; mejorPuntaje = puntaje; mejorIdioma = codigo; }
        else if (puntaje > segundoPuntaje) { segundoPuntaje = puntaje; }
    });
    // Se exige al menos 2 coincidencias y una ventaja clara sobre el segundo idioma más probable,
    // para no cambiar el idioma por una sola palabra que coincide por casualidad entre dos idiomas.
    if (mejorIdioma && mejorPuntaje >= 2 && mejorPuntaje > segundoPuntaje) return mejorIdioma;
    return null;
}

// Igual que changeLanguage(), pero sin limpiar el historial del chat ni pintar un saludo nuevo:
// se usa cuando el cambio de idioma es "detectado" en silencio a partir de lo que el usuario
// escribió, no porque lo haya pedido explícitamente.
function aplicarIdiomaSilencioso(lang) {
    if (lang === idiomaDetectado) return; // ya está en ese idioma, no hacer nada
    idiomaDetectado = lang;
    try { localStorage.setItem('idioma_preferido', lang); } catch (e) { console.warn('No se pudo guardar idioma_preferido:', e); }
    var nombre = NOMBRES_IDIOMA_DISPLAY[lang] || lang.toUpperCase();
    var selectedEl = document.getElementById('selectedLanguage');
    if (selectedEl) selectedEl.textContent = nombre;
    document.querySelectorAll('.language-dropdown-item').forEach(function(i) { i.classList.remove('active'); });
    aplicarTraduccionUI(lang);
    if (!usuarioActual && typeof ContenidoInfo !== 'undefined' && document.getElementById('articulosContainer')) {
        ContenidoInfo.mostrarEnMuro(lang);
    }
}

// ============================================
// FUNCIONES IA
// ============================================
  
