/* ==========================================
   remarket-db - Módulo de Idiomas
   Sistema de traducción multi-idioma
   ========================================== */

import { CONFIG } from '../config.js';

// Traducciones disponibles
const traducciones = {
  es: {
    nombre: 'Español',
    bienvenida: '¡Hola! Soy tu asistente de economía circular global.',
    catalogo: 'Catálogo de Economía Circular',
    subtitulo: 'Descubre artículos disponibles para intercambio en tu zona',
    buscar: 'Buscar...',
    cualquierRubro: 'Cualquier rubro',
    resultados: 'Resultados para:',
    resultadosTexto: 'resultados',
    tendencias: 'Tendencias locales',
    cargando: 'Cargando...',
    publicar: 'Publicar',
    miCuenta: 'Mi Cuenta',
    miPerfil: 'Mi Perfil',
    configuracion: 'Configuración',
    cerrarSesion: 'Cerrar Sesión',
    articulosDestacados: 'Artículos Destacados',
    patrocinadores: 'Patrocinadores',
    visitar: 'Visitar',
    empresa: 'Empresa',
    quienesSomos: 'Quiénes Somos',
    gestion: 'Gestión',
    panelAdmin: 'Panel Administrador',
    transparencia: 'Transparencia',
    libroReclamaciones: 'Libro de Reclamaciones',
    inicio: 'Inicio',
    misPublicaciones: 'Mis Publicaciones',
    buscarPersonas: 'Buscar Personas',
    mensajes: 'Mensajes',
    favoritos: 'Favoritos',
    tuAlcance: 'Tu Alcance',
    tusIntereses: 'Tus Intereses',
    general: 'General',
    otroIdioma: '¿Otro idioma? Traduce aquí',
    noResultados: 'No hay publicaciones disponibles',
    sePrimero: '¡Sé el primero en tu zona!',
    noPublicacionesZona: 'Aún no hay publicaciones en esta categoría y localidad.',
    publicarAhora: 'Publicar ahora'
  },
  en: {
    nombre: 'English',
    bienvenida: 'Hello! I am your global circular economy assistant.',
    catalogo: 'Circular Economy Catalog',
    subtitulo: 'Discover items available for exchange in your area',
    buscar: 'Search...',
    cualquierRubro: 'Any category',
    resultados: 'Results for:',
    resultadosTexto: 'results',
    tendencias: 'Local trends',
    cargando: 'Loading...',
    publicar: 'Publish',
    miCuenta: 'My Account',
    miPerfil: 'My Profile',
    configuracion: 'Settings',
    cerrarSesion: 'Log Out',
    articulosDestacados: 'Featured Items',
    patrocinadores: 'Sponsors',
    visitar: 'Visit',
    empresa: 'Company',
    quienesSomos: 'About Us',
    gestion: 'Management',
    panelAdmin: 'Admin Panel',
    transparencia: 'Transparency',
    libroReclamaciones: 'Complaints Book',
    inicio: 'Home',
    misPublicaciones: 'My Posts',
    buscarPersonas: 'Find People',
    mensajes: 'Messages',
    favoritos: 'Favorites',
    tuAlcance: 'Your Reach',
    tusIntereses: 'Your Interests',
    general: 'General',
    otroIdioma: 'Another language? Translate here',
    noResultados: 'No publications available',
    sePrimero: 'Be the first in your area!',
    noPublicacionesZona: 'There are no publications in this category and location yet.',
    publicarAhora: 'Publish now'
  },
  pt: {
    nombre: 'Português',
    bienvenida: 'Olá! Sou seu assistente de economia circular global.',
    catalogo: 'Catálogo de Economia Circular',
    subtitulo: 'Descubra itens disponíveis para troca na sua área',
    buscar: 'Buscar...',
    cualquierRubro: 'Qualquer categoria',
    resultados: 'Resultados para:',
    resultadosTexto: 'resultados',
    tendencias: 'Tendências locais',
    cargando: 'Carregando...',
    publicar: 'Publicar',
    miCuenta: 'Minha Conta',
    miPerfil: 'Meu Perfil',
    configuracion: 'Configurações',
    cerrarSesion: 'Sair',
    articulosDestacados: 'Itens em Destaque',
    patrocinadores: 'Patrocinadores',
    visitar: 'Visitar',
    empresa: 'Empresa',
    quienesSomos: 'Quem Somos',
    gestion: 'Gestão',
    panelAdmin: 'Painel Admin',
    transparencia: 'Transparência',
    libroReclamaciones: 'Livro de Reclamações',
    inicio: 'Início',
    misPublicaciones: 'Minhas Publicações',
    buscarPersonas: 'Buscar Pessoas',
    mensajes: 'Mensagens',
    favoritos: 'Favoritos',
    tuAlcance: 'Seu Alcance',
    tusIntereses: 'Seus Interesses',
    general: 'Geral',
    otroIdioma: 'Outro idioma? Traduza aqui',
    noResultados: 'Nenhuma publicação disponível',
    sePrimero: 'Seja o primeiro na sua área!',
    noPublicacionesZona: 'Ainda não há publicações nesta categoria e localidade.',
    publicarAhora: 'Publicar agora'
  },
  qu: {
    nombre: 'Quechua',
    bienvenida: 'Allinmi! uqaqa llapan pachapi muyu muyu qhatu yanapaqmi kani.',
    catalogo: 'Muyu Muyu Qhatu',
    subtitulo: 'Kay llaqtaykikunapi t\'ikranapaq kaqkunata taripay',
    buscar: 'Maskhay...',
    cualquierRubro: 'Ima laya',
    resultados: 'Tarikuqkuna:',
    resultadosTexto: 'tarikuqkuna',
    tendencias: 'Kay llaqtapi riqsisqa',
    cargando: 'Cargachkanki...',
    publicar: 'Qillqay',
    miCuenta: 'Ñuqa Qillqa',
    miPerfil: 'Ñuqa Rikch\'ay',
    configuracion: 'Allichaykuna',
    cerrarSesion: 'Lluqsiy',
    articulosDestacados: 'Riqsisqa Kaqkuna',
    patrocinadores: 'Yanapaqkuna',
    visitar: 'Rikuy',
    empresa: 'Llank\'ana',
    quienesSomos: 'Pi kasqanchik',
    gestion: 'Kamachiy',
    panelAdmin: 'Kamachiq Panel',
    transparencia: 'Qawachiy',
    libroReclamaciones: 'K\'iklluy Qillqa',
    inicio: 'Qallariy',
    misPublicaciones: 'Ñuqa Qillqasqaykuna',
    buscarPersonas: 'Runakunata Maskhay',
    mensajes: 'Willakuykuna',
    favoritos: 'Munakuqkuna',
    tuAlcance: 'Qam Chayay',
    tusIntereses: 'Qam Munakuqkuna',
    general: 'Sapaq',
    otroIdioma: 'Huk rimay? Kaypi t\'ikray',
    noResultados: 'Mana qillqasqa kanchu',
    sePrimero: 'Ñawpaq kaq kay llaqtaykipi!',
    noPublicacionesZona: 'Manaraqmi kay layapi, kay llaqtapipis qillqasqa kanchu.',
    publicarAhora: 'Kunan qillqay'
  },
  ay: {
    nombre: 'Aymara',
    bienvenida: 'Aski! Naxa mayacht\'at qhatu yanapt\'ayiriwa.',
    catalogo: 'Mayacht\'at Qhatu',
    subtitulo: 'Aka markanxa tukuyaña uñacht\'ayata uñjaña',
    buscar: 'Thaqaña...',
    cualquierRubro: 'Kunaymana',
    resultados: 'Jikxatata:',
    resultadosTexto: 'jikxatata',
    tendencias: 'Aka markan yatiyatanaka',
    cargando: 'Apthapiskiwa...',
    publicar: 'Qillqt\'aña',
    miCuenta: 'Naxa Qillqata',
    miPerfil: 'Naxa Uñacht\'ayaña',
    configuracion: 'Allichawi',
    cerrarSesion: 'Mistuña',
    articulosDestacados: 'Uñacht\'ayata Ukanaka',
    patrocinadores: 'Yanapt\'ayirinaka',
    visitar: 'Uñjaña',
    empresa: 'Lurawi',
    quienesSomos: 'Kunamsa',
    gestion: 'Kamachiri',
    panelAdmin: 'Kamachiri Panel',
    transparencia: 'Uñacht\'ayawi',
    libroReclamaciones: 'K\'uchuxtaña Qillqa',
    inicio: 'Qallta',
    misPublicaciones: 'Naxa Qillqt\'atanaka',
    buscarPersonas: 'Jaqinaka Thaqaña',
    mensajes: 'Yatiyatanaka',
    favoritos: 'Munatanaka',
    tuAlcance: 'Qama Thayaña',
    tusIntereses: 'Qama Munatanaka',
    general: 'Taqpach',
    otroIdioma: 'Juk\'amp rimay? Aka thayawa',
    noResultados: 'Janiwa qillqt\'ata utjkiti',
    sePrimero: 'Nayraqata aka markanxa!',
    noPublicacionesZona: 'Janiwa aka layana, aka markanxa qillqt\'ata utjkiti.',
    publicarAhora: 'Kunana qillqt\'aña'
  },
  fr: {
    nombre: 'Français',
    bienvenida: 'Bonjour! Je suis votre assistant d\'économie circulaire mondiale.',
    catalogo: 'Catalogue d\'Économie Circulaire',
    subtitulo: 'Découvrez des articles disponibles pour l\'échange dans votre région',
    buscar: 'Rechercher...',
    cualquierRubro: 'Toute catégorie',
    resultados: 'Résultats pour:',
    resultadosTexto: 'résultats',
    tendencias: 'Tendances locales',
    cargando: 'Chargement...',
    publicar: 'Publier',
    miCuenta: 'Mon Compte',
    miPerfil: 'Mon Profil',
    configuracion: 'Paramètres',
    cerrarSesion: 'Déconnexion',
    articulosDestacados: 'Articles en Vedette',
    patrocinadores: 'Sponsors',
    visitar: 'Visiter',
    empresa: 'Entreprise',
    quienesSomos: 'À Propos',
    gestion: 'Gestion',
    panelAdmin: 'Panneau Admin',
    transparencia: 'Transparence',
    libroReclamaciones: 'Livre de Réclamations',
    inicio: 'Accueil',
    misPublicaciones: 'Mes Publications',
    buscarPersonas: 'Trouver des Personnes',
    mensajes: 'Messages',
    favoritos: 'Favoris',
    tuAlcance: 'Votre Portée',
    tusIntereses: 'Vos Intérêts',
    general: 'Général',
    otroIdioma: 'Autre langue? Traduisez ici',
    noResultados: 'Aucune publication disponible',
    sePrimero: 'Soyez le premier dans votre région!',
    noPublicacionesZona: 'Il n\'y a pas encore de publications dans cette catégorie et localité.',
    publicarAhora: 'Publier maintenant'
  },
  de: {
    nombre: 'Deutsch',
    bienvenida: 'Hallo! Ich bin Ihr globaler Kreislaufwirtschaftsassistent.',
    catalogo: 'Kreislaufwirtschaft-Katalog',
    subtitulo: 'Entdecken Sie Artikel zum Tausch in Ihrer Region',
    buscar: 'Suchen...',
    cualquierRubro: 'Alle Kategorien',
    resultados: 'Ergebnisse für:',
    resultadosTexto: 'Ergebnisse',
    tendencias: 'Lokale Trends',
    cargando: 'Laden...',
    publicar: 'Veröffentlichen',
    miCuenta: 'Mein Konto',
    miPerfil: 'Mein Profil',
    configuracion: 'Einstellungen',
    cerrarSesion: 'Abmelden',
    articulosDestacados: 'Ausgewählte Artikel',
    patrocinadores: 'Sponsoren',
    visitar: 'Besuchen',
    empresa: 'Unternehmen',
    quienesSomos: 'Über Uns',
    gestion: 'Verwaltung',
    panelAdmin: 'Admin-Panel',
    transparencia: 'Transparenz',
    libroReclamaciones: 'Beschwerdebuch',
    inicio: 'Startseite',
    misPublicaciones: 'Meine Beiträge',
    buscarPersonas: 'Personen Suchen',
    mensajes: 'Nachrichten',
    favoritos: 'Favoriten',
    tuAlcance: 'Ihre Reichweite',
    tusIntereses: 'Ihre Interessen',
    general: 'Allgemein',
    otroIdioma: 'Andere Sprache? Hier übersetzen',
    noResultados: 'Keine Veröffentlichungen verfügbar',
    sePrimero: 'Seien Sie der Erste in Ihrer Region!',
    noPublicacionesZona: 'Es gibt noch keine Veröffentlichungen in dieser Kategorie und Region.',
    publicarAhora: 'Jetzt veröffentlichen'
  },
  it: {
    nombre: 'Italiano',
    bienvenida: 'Ciao! Sono il tuo assistente di economia circolare globale.',
    catalogo: 'Catalogo di Economia Circolare',
    subtitulo: 'Scopri articoli disponibili per lo scambio nella tua zona',
    buscar: 'Cerca...',
    cualquierRubro: 'Qualsiasi categoria',
    resultados: 'Risultati per:',
    resultadosTexto: 'risultati',
    tendencias: 'Tendenze locali',
    cargando: 'Caricamento...',
    publicar: 'Pubblica',
    miCuenta: 'Il Mio Account',
    miPerfil: 'Il Mio Profilo',
    configuracion: 'Impostazioni',
    cerrarSesion: 'Disconnetti',
    articulosDestacados: 'Articoli in Evidenza',
    patrocinadores: 'Sponsor',
    visitar: 'Visita',
    empresa: 'Azienda',
    quienesSomos: 'Chi Siamo',
    gestion: 'Gestione',
    panelAdmin: 'Pannello Admin',
    transparencia: 'Trasparenza',
    libroReclamaciones: 'Libro dei Reclami',
    inicio: 'Home',
    misPublicaciones: 'Le Mie Pubblicazioni',
    buscarPersonas: 'Cerca Persone',
    mensajes: 'Messaggi',
    favoritos: 'Preferiti',
    tuAlcance: 'La Tua Portata',
    tusIntereses: 'I Tuoi Interessi',
    general: 'Generale',
    otroIdioma: 'Altra lingua? Traduci qui',
    noResultados: 'Nessuna pubblicazione disponibile',
    sePrimero: 'Sii il primo nella tua zona!',
    noPublicacionesZona: 'Non ci sono ancora pubblicazioni in questa categoria e località.',
    publicarAhora: 'Pubblica ora'
  },
  zh: {
    nombre: '中文 (Chino)',
    bienvenida: '你好！我是您的全球循环经济助手。',
    catalogo: '循环经济目录',
    subtitulo: '发现您所在地区可用于交换的物品',
    buscar: '搜索...',
    cualquierRubro: '任何类别',
    resultados: '结果：',
    resultadosTexto: '结果',
    tendencias: '本地趋势',
    cargando: '加载中...',
    publicar: '发布',
    miCuenta: '我的账户',
    miPerfil: '我的资料',
    configuracion: '设置',
    cerrarSesion: '退出',
    articulosDestacados: '精选文章',
    patrocinadores: '赞助商',
    visitar: '访问',
    empresa: '公司',
    quienesSomos: '关于我们',
    gestion: '管理',
    panelAdmin: '管理面板',
    transparencia: '透明度',
    libroReclamaciones: '投诉簿',
    inicio: '首页',
    misPublicaciones: '我的发布',
    buscarPersonas: '找人',
    mensajes: '消息',
    favoritos: '收藏',
    tuAlcance: '您的范围',
    tusIntereses: '您的兴趣',
    general: '通用',
    otroIdioma: '其他语言？在这里翻译',
    noResultados: '没有可用的发布',
    sePrimero: '成为您地区的第一个！',
    noPublicacionesZona: '此类别和地区还没有发布。',
    publicarAhora: '立即发布'
  },
  ja: {
    nombre: '日本語 (Japonés)',
    bienvenida: 'こんにちは！グローバル循環経済アシスタントです。',
    catalogo: '循環経済カタログ',
    subtitulo: 'お住まいの地域で交換可能なアイテムを発見',
    buscar: '検索...',
    cualquierRubro: 'すべてのカテゴリ',
    resultados: '結果：',
    resultadosTexto: '件',
    tendencias: 'ローカルトレンド',
    cargando: '読み込み中...',
    publicar: '投稿',
    miCuenta: 'マイアカウント',
    miPerfil: 'マイプロフィール',
    configuracion: '設定',
    cerrarSesion: 'ログアウト',
    articulosDestacados: '注目の記事',
    patrocinadores: 'スポンサー',
    visitar: '訪問',
    empresa: '会社',
    quienesSomos: '私たちについて',
    gestion: '管理',
    panelAdmin: '管理パネル',
    transparencia: '透明性',
    libroReclamaciones: '苦情帳',
    inicio: 'ホーム',
    misPublicaciones: 'マイ投稿',
    buscarPersonas: '人を検索',
    mensajes: 'メッセージ',
    favoritos: 'お気に入り',
    tuAlcance: 'あなたの範囲',
    tusIntereses: 'あなたの興味',
    general: '一般',
    otroIdioma: '他の言語？ここで翻訳',
    noResultados: '利用可能な投稿はありません',
    sePrimero: 'あなたの地域で最初に投稿しましょう！',
    noPublicacionesZona: 'このカテゴリと地域にはまだ投稿がありません。',
    publicarAhora: '今すぐ投稿'
  },
  ko: {
    nombre: '한국어 (Coreano)',
    bienvenida: '안녕하세요! 글로벌 순환 경제 어시스턴트입니다.',
    catalogo: '순환 경제 카탈로그',
    subtitulo: '귀하의 지역에서 교환 가능한 품목 발견',
    buscar: '검색...',
    cualquierRubro: '모든 카테고리',
    resultados: '결과:',
    resultadosTexto: '결과',
    tendencias: '로컬 트렌드',
    cargando: '로딩 중...',
    publicar: '게시',
    miCuenta: '내 계정',
    miPerfil: '내 프로필',
    configuracion: '설정',
    cerrarSesion: '로그아웃',
    articulosDestacados: '추천 기사',
    patrocinadores: '스폰서',
    visitar: '방문',
    empresa: '회사',
    quienesSomos: '소개',
    gestion: '관리',
    panelAdmin: '관리 패널',
    transparencia: '투명성',
    libroReclamaciones: '불만 도서',
    inicio: '홈',
    misPublicaciones: '내 게시',
    buscarPersonas: '사람 찾기',
    mensajes: '메시지',
    favoritos: '즐겨찾기',
    tuAlcance: '귀하의 범위',
    tusIntereses: '귀하의 관심사',
    general: '일반',
    otroIdioma: '다른 언어? 여기서 번역',
    noResultados: '사용 가능한 게시 없음',
    sePrimero: '당신 지역에서 첫 번째가 되세요!',
    noPublicacionesZona: '이 카테고리 및 지역에는 아직 게시가 없습니다.',
    publicarAhora: '지금 게시'
  },
  ar: {
    nombre: 'العربية (Árabe)',
    bienvenida: 'مرحبا! أنا مساعدك للاقتصاد الدائري العالمي.',
    catalogo: 'كتالوج الاقتصاد الدائري',
    subtitulo: 'اكتشف العناصر المتاحة للتبادل في منطقتك',
    buscar: 'بحث...',
    cualquierRubro: 'أي فئة',
    resultados: 'النتائج لـ:',
    resultadosTexto: 'نتائج',
    tendencias: 'الاتجاهات المحلية',
    cargando: 'جار التحميل...',
    publicar: 'نشر',
    miCuenta: 'حسابي',
    miPerfil: 'ملفي',
    configuracion: 'الإعدادات',
    cerrarSesion: 'تسجيل الخروج',
    articulosDestacados: 'المقالات المميزة',
    patrocinadores: 'الرعاة',
    visitar: 'زيارة',
    empresa: 'الشركة',
    quienesSomos: 'من نحن',
    gestion: 'الإدارة',
    panelAdmin: 'لوحة الإدارة',
    transparencia: 'الشفافية',
    libroReclamaciones: 'كتاب الشكاوى',
    inicio: 'الرئيسية',
    misPublicaciones: 'منشوراتي',
    buscarPersonas: 'البحث عن أشخاص',
    mensajes: 'الرسائل',
    favoritos: 'المفضلة',
    tuAlcance: 'نطاقك',
    tusIntereses: 'اهتماماتك',
    general: 'عام',
    otroIdioma: 'لغة أخرى؟ ترجم هنا',
    noResultados: 'لا توجد منشورات متاحة',
    sePrimero: 'كن الأول في منطقتك!',
    noPublicacionesZona: 'لا توجد منشورات بعد في هذه الفئة والمنطقة.',
    publicarAhora: 'انشر الآن'
  },
  hi: {
    nombre: 'हिन्दी (Hindi)',
    bienvenida: 'नमस्ते! मैं आपका वैश्विक चक्रीय अर्थव्यवस्था सहायक हूं।',
    catalogo: 'चक्रीय अर्थव्यवस्था कैटलॉग',
    subtitulo: 'अपने क्षेत्र में विनिमय के लिए उपलब्ध वस्तुएं खोजें',
    buscar: 'खोजें...',
    cualquierRubro: 'कोई भी श्रेणी',
    resultados: 'परिणाम:',
    resultadosTexto: 'परिणाम',
    tendencias: 'स्थानीय रुझान',
    cargando: 'लोड हो रहा है...',
    publicar: 'प्रकाशित करें',
    miCuenta: 'मेरा खाता',
    miPerfil: 'मेरी प्रोफ़ाइल',
    configuracion: 'सेटिंग्स',
    cerrarSesion: 'लॉग आउट',
    articulosDestacados: 'विशेष लेख',
    patrocinadores: 'प्रायोजक',
    visitar: 'विज़िट करें',
    empresa: 'कंपनी',
    quienesSomos: 'हमारे बारे में',
    gestion: 'प्रबंधन',
    panelAdmin: 'एडमिन पैनल',
    transparencia: 'पारदर्शिता',
    libroReclamaciones: 'शिकायत पुस्तक',
    inicio: 'होम',
    misPublicaciones: 'मेरे पोस्ट',
    buscarPersonas: 'लोग खोजें',
    mensajes: 'संदेश',
    favoritos: 'पसंदीदा',
    tuAlcance: 'आपकी पहुंच',
    tusIntereses: 'आपकी रुचियां',
    general: 'सामान्य',
    otroIdioma: 'अन्य भाषा? यहां अनुवाद करें',
    noResultados: 'कोई पोस्ट उपलब्ध नहीं',
    sePrimero: 'अपने क्षेत्र में पहले बनें!',
    noPublicacionesZona: 'इस श्रेणी और स्थान पर अभी तक कोई पोस्ट नहीं है।',
    publicarAhora: 'अभी प्रकाशित करें'
  },
  nl: {
    nombre: 'Nederlands',
    bienvenida: 'Hallo! Ik ben uw wereldwijde circulaire economie assistent.',
    catalogo: 'Circulaire Economie Catalogus',
    subtitulo: 'Ontdek artikelen beschikbaar voor uitwisseling in uw regio',
    buscar: 'Zoeken...',
    cualquierRubro: 'Elke categorie',
    resultados: 'Resultaten voor:',
    resultadosTexto: 'resultaten',
    tendencias: 'Lokale trends',
    cargando: 'Laden...',
    publicar: 'Publiceren',
    miCuenta: 'Mijn Account',
    miPerfil: 'Mijn Profiel',
    configuracion: 'Instellingen',
    cerrarSesion: 'Uitloggen',
    articulosDestacados: 'Uitgelichte Artikelen',
    patrocinadores: 'Sponsors',
    visitar: 'Bezoek',
    empresa: 'Bedrijf',
    quienesSomos: 'Over Ons',
    gestion: 'Beheer',
    panelAdmin: 'Admin Paneel',
    transparencia: 'Transparantie',
    libroReclamaciones: 'Klachtenboek',
    inicio: 'Home',
    misPublicaciones: 'Mijn Publicaties',
    buscarPersonas: 'Mensen Zoeken',
    mensajes: 'Berichten',
    favoritos: 'Favorieten',
    tuAlcance: 'Uw Bereik',
    tusIntereses: 'Uw Interesses',
    general: 'Algemeen',
    otroIdioma: 'Andere taal? Vertaal hier',
    noResultados: 'Geen publicaties beschikbaar',
    sePrimero: 'Wees de eerste in uw regio!',
    noPublicacionesZona: 'Er zijn nog geen publicaties in deze categorie en locatie.',
    publicarAhora: 'Nu publiceren'
  },
  tr: {
    nombre: 'Türkçe',
    bienvenida: 'Merhaba! Ben küresel döngüsel ekonomi asistanınızım.',
    catalogo: 'Döngüsel Ekonomi Kataloğu',
    subtitulo: 'Bölgenizdeki değişim için mevcut öğeleri keşfedin',
    buscar: 'Ara...',
    cualquierRubro: 'Herhangi bir kategori',
    resultados: 'Sonuçlar:',
    resultadosTexto: 'sonuç',
    tendencias: 'Yerel trendler',
    cargando: 'Yükleniyor...',
    publicar: 'Yayınla',
    miCuenta: 'Hesabım',
    miPerfil: 'Profilim',
    configuracion: 'Ayarlar',
    cerrarSesion: 'Çıkış Yap',
    articulosDestacados: 'Öne Çıkan Makaleler',
    patrocinadores: 'Sponsorlar',
    visitar: 'Ziyaret Et',
    empresa: 'Şirket',
    quienesSomos: 'Hakkımızda',
    gestion: 'Yönetim',
    panelAdmin: 'Yönetici Paneli',
    transparencia: 'Şeffaflık',
    libroReclamaciones: 'Şikayet Kitabı',
    inicio: 'Ana Sayfa',
    misPublicaciones: 'Yayınlarım',
    buscarPersonas: 'Kişi Ara',
    mensajes: 'Mesajlar',
    favoritos: 'Favoriler',
    tuAlcance: 'Kapsamınız',
    tusIntereses: 'İlgi Alanlarınız',
    general: 'Genel',
    otroIdioma: 'Başka dil? Burada çevir',
    noResultados: 'Mevcut yayın yok',
    sePrimero: 'Bölgenizde ilk olun!',
    noPublicacionesZona: 'Bu kategori ve bölgede henüz yayın yok.',
    publicarAhora: 'Şimdi yayınla'
  },
  bg: {
    nombre: 'Български',
    bienvenida: 'Здравейте! Аз съм вашият глобален асистент за кръгова икономика.',
    catalogo: 'Каталог на Кръговата Икономика',
    subtitulo: 'Открийте артикули, налични за обмен във вашия район',
    buscar: 'Търсене...',
    cualquierRubro: 'Всяка категория',
    resultados: 'Резултати за:',
    resultadosTexto: 'резултата',
    tendencias: 'Локални тенденции',
    cargando: 'Зареждане...',
    publicar: 'Публикуване',
    miCuenta: 'Моят Акаунт',
    miPerfil: 'Моят Профил',
    configuracion: 'Настройки',
    cerrarSesion: 'Изход',
    articulosDestacados: 'Избрани Статии',
    patrocinadores: 'Спонсори',
    visitar: 'Посети',
    empresa: 'Компания',
    quienesSomos: 'За Нас',
    gestion: 'Управление',
    panelAdmin: 'Админ Панел',
    transparencia: 'Прозрачност',
    libroReclamaciones: 'Книга на Жалбите',
    inicio: 'Начало',
    misPublicaciones: 'Моите Публикации',
    buscarPersonas: 'Търсене на Хора',
    mensajes: 'Съобщения',
    favoritos: 'Любими',
    tuAlcance: 'Вашият Обхват',
    tusIntereses: 'Вашите Интересы',
    general: 'Общо',
    otroIdioma: 'Друг език? Преведете тук',
    noResultados: 'Няма налични публикации',
    sePrimero: 'Бъдете първи във вашия район!',
    noPublicacionesZona: 'Все още няма публикации в тази категория и местоположение.',
    publicarAhora: 'Публикувайте сега'
  }
};

// Idioma actual
let idiomaActual = 'es';

/**
 * Inicializa el módulo de idiomas
 */
export function inicializarIdiomas() {
  console.log('🌐 Módulo de idiomas inicializado');
  
  // Cargar idioma guardado
  const idiomaGuardado = localStorage.getItem('idioma-preferido');
  if (idiomaGuardado && traducciones[idiomaGuardado]) {
    idiomaActual = idiomaGuardado;
  }
  
  // Aplicar traducciones iniciales
  aplicarTraducciones();
  
  // Configurar selector de idioma
  configurarSelectorIdioma();
}

/**
 * Configura el selector de idioma en el header
 */
function configurarSelectorIdioma() {
  const opciones = document.querySelectorAll('.idioma-opcion');
  opciones.forEach(opcion => {
    opcion.addEventListener('click', (e) => {
      const codigo = e.target.dataset.idioma;
      if (codigo && traducciones[codigo]) {
        cambiarIdioma(codigo);
      }
    });
  });
}

/**
 * Cambia el idioma de la aplicación
 * @param {string} codigo - Código del idioma (es, en, pt, etc.)
 */
export function cambiarIdioma(codigo) {
  if (!traducciones[codigo]) {
    console.error(`❌ Idioma no encontrado: ${codigo}`);
    return;
  }
  
  idiomaActual = codigo;
  localStorage.setItem('idioma-preferido', codigo);
  
  aplicarTraducciones();
  console.log(` Idioma cambiado a: ${traducciones[codigo].nombre}`);
}

/**
 * Aplica las traducciones a todos los elementos de la interfaz
 */
function aplicarTraducciones() {
  const t = traducciones[idiomaActual];
  
  // Aplicar traducciones por data-atributos
  document.querySelectorAll('[data-trad]').forEach(elemento => {
    const clave = elemento.dataset.trad;
    if (t[clave]) {
      elemento.textContent = t[clave];
    }
  });
  
  // Actualizar textos específicos por ID
  actualizarTexto('titulo-catalogo', t.catalogo);
  actualizarTexto('subtitulo-catalogo', t.subtitulo);
  actualizarTexto('placeholder-buscador', t.buscar, 'placeholder');
  actualizarTexto('texto-tendencias', t.tendencias);
  actualizarTexto('texto-publicar', t.publicar);
  actualizarTexto('texto-mi-cuenta', t.miCuenta);
  actualizarTexto('texto-inicio', t.inicio);
  actualizarTexto('texto-mensajes', t.mensajes);
  actualizarTexto('texto-favoritos', t.favoritos);
  
  // Actualizar dirección del texto para árabe
  if (idiomaActual === 'ar') {
    document.body.dir = 'rtl';
  } else {
    document.body.dir = 'ltr';
  }
}

/**
 * Actualiza el texto de un elemento
 */
function actualizarTexto(id, texto, atributo = 'textContent') {
  const elemento = document.getElementById(id);
  if (elemento) {
    if (atributo === 'placeholder') {
      elemento.placeholder = texto;
    } else {
      elemento.textContent = texto;
    }
  }
}

/**
 * Obtiene una traducción específica
 * @param {string} clave - Clave de traducción
 * @returns {string} Texto traducido
 */
export function obtenerTraduccion(clave) {
  return traducciones[idiomaActual][clave] || traducciones.es[clave] || clave;
}

/**
 * Obtiene el idioma actual
 * @returns {string} Código del idioma
 */
export function getIdiomaActual() {
  return idiomaActual;
}

/**
 * Obtiene la lista de idiomas disponibles
 * @returns {Array} Lista de idiomas
 */
export function getIdiomasDisponibles() {
  return CONFIG.IDIOMAS;
}

export default {
  inicializarIdiomas,
  cambiarIdioma,
  obtenerTraduccion,
  getIdiomaActual,
  getIdiomasDisponibles
};