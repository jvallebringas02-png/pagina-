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
    var disparadores = ['cambia', 'cambiar', 'cambiame', 'pon el idioma', 'poner el idioma', 'switch to', 'change language', 'change the language', 'set language', 'habla en', 'hablame en', 'responde en', 'responder en', 'idioma a', 'language to'];
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
        quick_publicar: "¿Cómo publico?", quick_vender: "¿Cómo vendo?", quick_seguridad: "Seguridad", quick_reportar: "Reportar", btn_limpiar: "Limpiar Conversación" },
    en: { account_btn: "My Account", content_title: " Circular Economy Catalog", content_subtitle: "Discover items available for exchange in your area", featured_title: "Featured Items", search_placeholder: "What are you looking for today? Ex: shirt, laptop, cars...", login_tab: "Sign In", register_tab: "Sign Up", assistant_header: "🤖 AI Assistant", footer_desc: "Connecting businesses and neighbors smartly.",
        menu_inicio: "Home", menu_perfil: "My Profile", menu_publicaciones: "My Listings", menu_blog: "My Blog", menu_mensajes: "Messages", menu_favoritos: "Favorites", menu_config: "Settings",
        panel_alcance: "Your Reach", panel_intereses: "Your Interests", btn_publicar: "Post",
        quick_publicar: "How do I post?", quick_vender: "How do I sell?", quick_seguridad: "Safety", quick_reportar: "Report", btn_limpiar: "Clear Conversation" },
    pt: { account_btn: "Minha Conta", content_title: "🌱 Catálogo de Economia Circular", content_subtitle: "Descubra itens disponíveis para troca na sua área", featured_title: "Itens em Destaque", search_placeholder: "O que você procura hoje? Ex: camisa, laptop, carros...", login_tab: "Entrar", register_tab: "Registrar", assistant_header: "🤖 Assistente de IA", footer_desc: "Conectando empresas e vizinhos de forma inteligente.",
        menu_inicio: "Início", menu_perfil: "Meu Perfil", menu_publicaciones: "Minhas Publicações", menu_blog: "Meu Blog", menu_mensajes: "Mensagens", menu_favoritos: "Favoritos", menu_config: "Configurações",
        panel_alcance: "Seu Alcance", panel_intereses: "Seus Interesses", btn_publicar: "Publicar",
        quick_publicar: "Como publico?", quick_vender: "Como vendo?", quick_seguridad: "Segurança", quick_reportar: "Denunciar", btn_limpiar: "Limpar Conversa" },
    fr: { account_btn: "Mon Compte", content_title: "🌱 Catalogue d'Économie Circulaire", content_subtitle: "Découvrez des articles disponibles pour l'échange dans votre région", featured_title: "Articles en Vedette", search_placeholder: "Que cherchez-vous aujourd'hui? Ex: chemise, ordinateur, voitures...", login_tab: "Se connecter", register_tab: "S'inscrire", assistant_header: "🤖 Assistant IA", footer_desc: "Connecter les entreprises et les voisins intelligemment.",
        menu_inicio: "Accueil", menu_perfil: "Mon Profil", menu_publicaciones: "Mes Annonces", menu_blog: "Mon Blog", menu_mensajes: "Messages", menu_favoritos: "Favoris", menu_config: "Paramètres",
        panel_alcance: "Votre Portée", panel_intereses: "Vos Intérêts", btn_publicar: "Publier",
        quick_publicar: "Comment publier?", quick_vender: "Comment vendre?", quick_seguridad: "Sécurité", quick_reportar: "Signaler", btn_limpiar: "Effacer la Conversation" },
    de: { account_btn: "Mein Konto", content_title: "🌱 Katalog der Kreislaufwirtschaft", content_subtitle: "Entdecke verfügbare Artikel zum Tausch in deiner Region", featured_title: "Empfohlene Artikel", search_placeholder: "Was suchst du heute? Z.B: Hemd, Laptop, Autos...", login_tab: "Anmelden", register_tab: "Registrieren", assistant_header: "🤖 KI-Assistent", footer_desc: "Verbindet Geschäfte und Nachbarn auf intelligente Weise.",
        menu_inicio: "Start", menu_perfil: "Mein Profil", menu_publicaciones: "Meine Anzeigen", menu_mensajes: "Nachrichten", menu_favoritos: "Favoriten", menu_config: "Einstellungen",
        panel_alcance: "Deine Reichweite", panel_intereses: "Deine Interessen", btn_publicar: "Veröffentlichen",
        quick_publicar: "Wie veröffentliche ich?", quick_vender: "Wie verkaufe ich?", quick_seguridad: "Sicherheit", quick_reportar: "Melden", btn_limpiar: "Unterhaltung löschen" },
    it: { account_btn: "Il Mio Account", content_title: "🌱 Catalogo dell'Economia Circolare", content_subtitle: "Scopri gli articoli disponibili per lo scambio nella tua zona", featured_title: "Articoli in Evidenza", search_placeholder: "Cosa cerchi oggi? Es: camicia, laptop, auto...", login_tab: "Accedi", register_tab: "Registrati", assistant_header: "🤖 Assistente IA", footer_desc: "Collega attività e vicini in modo intelligente.",
        menu_inicio: "Home", menu_perfil: "Il Mio Profilo", menu_publicaciones: "I Miei Annunci", menu_mensajes: "Messaggi", menu_favoritos: "Preferiti", menu_config: "Impostazioni",
        panel_alcance: "La Tua Portata", panel_intereses: "I Tuoi Interessi", btn_publicar: "Pubblica",
        quick_publicar: "Come pubblico?", quick_vender: "Come vendo?", quick_seguridad: "Sicurezza", quick_reportar: "Segnala", btn_limpiar: "Cancella Conversazione" },
    ru: { account_btn: "Мой аккаунт", content_title: "🌱 Каталог циркулярной экономики", content_subtitle: "Найдите товары для обмена в вашем районе", featured_title: "Избранные товары", search_placeholder: "Что вы ищете сегодня? Напр: рубашка, ноутбук, машина...", login_tab: "Войти", register_tab: "Регистрация", assistant_header: "🤖 ИИ-Ассистент", footer_desc: "Умное соединение бизнеса и соседей.",
        menu_inicio: "Главная", menu_perfil: "Мой профиль", menu_publicaciones: "Мои объявления", menu_mensajes: "Сообщения", menu_favoritos: "Избранное", menu_config: "Настройки",
        panel_alcance: "Ваш охват", panel_intereses: "Ваши интересы", btn_publicar: "Опубликовать",
        quick_publicar: "Как опубликовать?", quick_vender: "Как продать?", quick_seguridad: "Безопасность", quick_reportar: "Пожаловаться", btn_limpiar: "Очистить чат" },
    zh: { account_btn: "我的账户", content_title: "🌱 循环经济目录", content_subtitle: "发现你所在地区可交换的物品", featured_title: "精选商品", search_placeholder: "您今天在找什么？例如：衬衫、笔记本电脑、汽车...", login_tab: "登录", register_tab: "注册", assistant_header: "🤖 AI助手", footer_desc: "智能连接商家与邻里。",
        menu_inicio: "首页", menu_perfil: "我的资料", menu_publicaciones: "我的发布", menu_mensajes: "消息", menu_favoritos: "收藏", menu_config: "设置",
        panel_alcance: "你的覆盖范围", panel_intereses: "你的兴趣", btn_publicar: "发布",
        quick_publicar: "如何发布？", quick_vender: "如何出售？", quick_seguridad: "安全", quick_reportar: "举报", btn_limpiar: "清除对话" },
    ja: { account_btn: "マイアカウント", content_title: "🌱 循環経済カタログ", content_subtitle: "あなたの地域で交換できるアイテムを見つけよう", featured_title: "おすすめ商品", search_placeholder: "今日は何をお探しですか？例：シャツ、ノートパソコン、車...", login_tab: "ログイン", register_tab: "登録", assistant_header: "🤖 AIアシスタント", footer_desc: "お店と近隣をスマートにつなぐ。",
        menu_inicio: "ホーム", menu_perfil: "マイプロフィール", menu_publicaciones: "マイ出品", menu_mensajes: "メッセージ", menu_favoritos: "お気に入り", menu_config: "設定",
        panel_alcance: "あなたの範囲", panel_intereses: "あなたの興味", btn_publicar: "出品する",
        quick_publicar: "出品方法は？", quick_vender: "販売方法は？", quick_seguridad: "安全", quick_reportar: "通報", btn_limpiar: "会話をクリア" },
    ko: { account_btn: "내 계정", content_title: "🌱 순환 경제 카탈로그", content_subtitle: "지역 내 교환 가능한 물품을 찾아보세요", featured_title: "추천 상품", search_placeholder: "오늘은 무엇을 찾으세요? 예: 셔츠, 노트북, 자동차...", login_tab: "로그인", register_tab: "회원가입", assistant_header: "🤖 AI 어시스턴트", footer_desc: "상점과 이웃을 스마트하게 연결합니다.",
        menu_inicio: "홈", menu_perfil: "내 프로필", menu_publicaciones: "내 게시물", menu_mensajes: "메시지", menu_favoritos: "즐겨찾기", menu_config: "설정",
        panel_alcance: "내 도달 범위", panel_intereses: "내 관심사", btn_publicar: "게시하기",
        quick_publicar: "게시하는 방법은?", quick_vender: "판매하는 방법은?", quick_seguridad: "보안", quick_reportar: "신고", btn_limpiar: "대화 지우기" },
    ar: { account_btn: "حسابي", content_title: "🌱 كتالوج الاقتصاد الدائري", content_subtitle: "اكتشف العناصر المتاحة للتبادل في منطقتك", featured_title: "منتجات مميزة", search_placeholder: "عن ماذا تبحث اليوم؟ مثال: قميص، حاسوب، سيارات...", login_tab: "تسجيل الدخول", register_tab: "إنشاء حساب", assistant_header: "🤖 المساعد الذكي", footer_desc: "ربط المتاجر والجيران بذكاء.",
        menu_inicio: "الرئيسية", menu_perfil: "ملفي الشخصي", menu_publicaciones: "إعلاناتي", menu_mensajes: "الرسائل", menu_favoritos: "المفضلة", menu_config: "الإعدادات",
        panel_alcance: "نطاقك", panel_intereses: "اهتماماتك", btn_publicar: "نشر",
        quick_publicar: "كيف أنشر؟", quick_vender: "كيف أبيع؟", quick_seguridad: "الأمان", quick_reportar: "إبلاغ", btn_limpiar: "مسح المحادثة" },
    hi: { account_btn: "मेरा खाता", content_title: "🌱 सर्कुलर इकॉनमी कैटलॉग", content_subtitle: "अपने क्षेत्र में विनिमय के लिए उपलब्ध वस्तुएं खोजें", featured_title: "प्रमुख वस्तुएं", search_placeholder: "आज आप क्या ढूंढ रहे हैं? जैसे: शर्ट, लैपटॉप, कार...", login_tab: "लॉगिन करें", register_tab: "रजिस्टर करें", assistant_header: "🤖 AI सहायक", footer_desc: "व्यवसायों और पड़ोसियों को समझदारी से जोड़ना।",
        menu_inicio: "होम", menu_perfil: "मेरी प्रोफ़ाइल", menu_publicaciones: "मेरी पोस्ट", menu_mensajes: "संदेश", menu_favoritos: "पसंदीदा", menu_config: "सेटिंग्स",
        panel_alcance: "आपकी पहुंच", panel_intereses: "आपकी रुचियां", btn_publicar: "पोस्ट करें",
        quick_publicar: "मैं कैसे पोस्ट करूं?", quick_vender: "मैं कैसे बेचूं?", quick_seguridad: "सुरक्षा", quick_reportar: "रिपोर्ट करें", btn_limpiar: "बातचीत साफ़ करें" },
    nl: { account_btn: "Mijn Account", content_title: "🌱 Circulaire Economie Catalogus", content_subtitle: "Ontdek artikelen beschikbaar voor ruil in jouw omgeving", featured_title: "Uitgelichte Artikelen", search_placeholder: "Wat zoek je vandaag? Bijv: shirt, laptop, auto's...", login_tab: "Inloggen", register_tab: "Registreren", assistant_header: "🤖 AI-Assistent", footer_desc: "Verbindt bedrijven en buren op een slimme manier.",
        menu_inicio: "Start", menu_perfil: "Mijn Profiel", menu_publicaciones: "Mijn Advertenties", menu_mensajes: "Berichten", menu_favoritos: "Favorieten", menu_config: "Instellingen",
        panel_alcance: "Jouw Bereik", panel_intereses: "Jouw Interesses", btn_publicar: "Plaatsen",
        quick_publicar: "Hoe plaats ik?", quick_vender: "Hoe verkoop ik?", quick_seguridad: "Veiligheid", quick_reportar: "Rapporteren", btn_limpiar: "Gesprek wissen" },
    tr: { account_btn: "Hesabım", content_title: "🌱 Döngüsel Ekonomi Kataloğu", content_subtitle: "Bölgenizde takas için mevcut ürünleri keşfedin", featured_title: "Öne Çıkan Ürünler", search_placeholder: "Bugün ne arıyorsun? Örn: gömlek, laptop, araba...", login_tab: "Giriş Yap", register_tab: "Kayıt Ol", assistant_header: "🤖 Yapay Zeka Asistanı", footer_desc: "İşletmeleri ve komşuları akıllıca birbirine bağlar.",
        menu_inicio: "Ana Sayfa", menu_perfil: "Profilim", menu_publicaciones: "İlanlarım", menu_mensajes: "Mesajlar", menu_favoritos: "Favoriler", menu_config: "Ayarlar",
        panel_alcance: "Erişimin", panel_intereses: "İlgi Alanların", btn_publicar: "Yayınla",
        quick_publicar: "Nasıl yayınlarım?", quick_vender: "Nasıl satarım?", quick_seguridad: "Güvenlik", quick_reportar: "Bildir", btn_limpiar: "Sohbeti Temizle" },
    bg: { account_btn: "Моят акаунт", content_title: "🌱 Каталог на кръговата икономика", content_subtitle: "Открийте налични артикули за размяна във вашия район", featured_title: "Препоръчани артикули", search_placeholder: "Какво търсите днес? Напр: риза, лаптоп, коли...", login_tab: "Вход", register_tab: "Регистрация", assistant_header: "🤖 ИИ Асистент", footer_desc: "Свързва бизнеси и съседи по интелигентен начин.",
        menu_inicio: "Начало", menu_perfil: "Моят профил", menu_publicaciones: "Моите обяви", menu_mensajes: "Съобщения", menu_favoritos: "Любими", menu_config: "Настройки",
        panel_alcance: "Вашият обхват", panel_intereses: "Вашите интереси", btn_publicar: "Публикувай",
        quick_publicar: "Как да публикувам?", quick_vender: "Как да продам?", quick_seguridad: "Сигурност", quick_reportar: "Докладвай", btn_limpiar: "Изчисти разговора" },
    fr: { account_btn: "Mon Compte", content_title: "🌱 Catalogue d'Économie Circulaire", content_subtitle: "Découvrez des articles disponibles pour échange dans votre région", featured_title: "Articles en Vedette", search_placeholder: "Que cherchez-vous aujourd'hui ? Ex : chemise, ordinateur, voiture...", login_tab: "Connexion", register_tab: "S'inscrire", assistant_header: "🤖 Assistant IA", footer_desc: "Connecter commerces et voisins intelligemment.",
        menu_inicio: "Accueil", menu_perfil: "Mon Profil", menu_publicaciones: "Mes Annonces", menu_mensajes: "Messages", menu_favoritos: "Favoris", menu_config: "Paramètres",
        panel_alcance: "Votre Portée", panel_intereses: "Vos Intérêts", btn_publicar: "Publier",
        quick_publicar: "Comment publier ?", quick_vender: "Comment vendre ?", quick_seguridad: "Sécurité", quick_reportar: "Signaler", btn_limpiar: "Effacer la Conversation" },
    pt: { account_btn: "Minha Conta", content_title: "🌱 Catálogo de Economia Circular", content_subtitle: "Descubra artigos disponíveis para troca na sua região", featured_title: "Artigos em Destaque", search_placeholder: "O que você está procurando hoje? Ex: camisa, laptop, carros...", login_tab: "Entrar", register_tab: "Cadastrar-se", assistant_header: "🤖 Assistente IA", footer_desc: "Conectando comércios e vizinhos de forma inteligente.",
        menu_inicio: "Início", menu_perfil: "Meu Perfil", menu_publicaciones: "Minhas Publicações", menu_mensajes: "Mensagens", menu_favoritos: "Favoritos", menu_config: "Configurações",
        panel_alcance: "Seu Alcance", panel_intereses: "Seus Interesses", btn_publicar: "Publicar",
        quick_publicar: "Como publico?", quick_vender: "Como vendo?", quick_seguridad: "Segurança", quick_reportar: "Denunciar", btn_limpiar: "Limpar Conversa" },
};

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
}

document.addEventListener('click', function(event) {
    if (!event.target.closest('.language-selector-wrapper')) { document.getElementById('languageDropdown').classList.remove('show'); }
});

// ============================================
// FUNCIONES IA
// ============================================
