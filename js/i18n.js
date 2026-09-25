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
    es: { legal_traduciendo: "Traduciendo…", legal_nota_ia: "Traducción automática. La versión en español es la que tiene validez legal.", legal_nota_es: "Mostrando la versión en español, que es la que tiene validez legal.", banner_ia: "🚀 IA Autónoma: Generando contexto, cumplimiento legal y ético de economía circular.", guia_zona: "📍 Aquí tienes lo que hay disponible cerca de ti.", guia_recientes: "🆕 Esto es lo último que se publicó.", guia_novedades_label: "Lo más reciente", guia_buscar: "🔎 Escribe arriba lo que estás buscando.", sponsors_title: "Patrocinadores", footer_empresa: "Empresa", footer_transparencia: "Transparencia", footer_legal: "Legal", footer_quienes: "Quiénes Somos", footer_contacto: "Comunícate con el Administrador", footer_reclamos: "Libro de Reclamaciones", footer_terminos: "Términos y condiciones", footer_privacidad: "Política de privacidad", menu_buscar_personas: "Buscar Personas", quick_zona: "Ver mi zona", quick_recientes: "Lo último publicado", quick_categorias: "Categorías", quick_mundial: "Mundial", quick_buscar: "Buscar algo", ph_asistente: "Escribe tu duda aquí...",
        account_btn: "Mi Cuenta", content_title: "🌱 Catálogo de Economía Circular", content_subtitle: "Descubre artículos disponibles para intercambio en tu zona", featured_title: "Artículos Destacados", search_placeholder: "¿Qué estás buscando hoy? Ej: camisa, laptop, carros...", login_tab: "Iniciar Sesión", register_tab: "Registrarse", assistant_header: "🤖 Asistente IA", footer_desc: "Conectando comercios y vecinos de forma inteligente.",
        menu_inicio: "Inicio", menu_perfil: "Mi Perfil", menu_publicaciones: "Mis Publicaciones", menu_mensajes: "Mensajes", menu_favoritos: "Favoritos", menu_config: "Configuración",
        panel_alcance: "Tu Alcance", panel_intereses: "Tus Intereses", btn_publicar: "Publicar",
        quick_publicar: "¿Cómo publico?", quick_vender: "¿Cómo vendo?", quick_seguridad: "Seguridad", quick_reportar: "Reportar", btn_limpiar: "Limpiar Conversación", bienvenida_title: "👋 Bienvenido a remarket-db", bienvenida_subtitle: "Conoce la plataforma antes de empezar" },
    en: { ask_publicar: "How can I post an item?", ask_vender: "How do I sell something valuable safely?", ask_seguridad: "What safety measures do you have?", ask_reportar: "I want to report a suspicious listing.", msg_contacto: "📩 Here is the form to contact the administrator. Use it for questions or suggestions; for a formal complaint, use the Complaints Book.", msg_reclamo: "📋 Here is the Complaints Book. Use it if you had a specific problem with a purchase, sale or listing and want it formally recorded.", msg_reporte: "🚩 Let's register your report about \"{p}\". Complete the remaining fields and it will be formally recorded.", volver_inicio: "Back to home", legal_traduciendo: "Translating…", legal_nota_ia: "Automatic translation. The Spanish version is the legally valid one.", legal_nota_es: "Showing the Spanish version, which is the legally valid one.", banner_ia: "🚀 Autonomous AI: Generating context, legal and ethical compliance for the circular economy.", guia_zona: "📍 Here's what's available near you.", guia_recientes: "🆕 Here's the latest posted.", guia_novedades_label: "Latest", guia_buscar: "🔎 Type above what you're looking for.", sponsors_title: "Sponsors", footer_empresa: "Company", footer_transparencia: "Transparency", footer_legal: "Legal", footer_quienes: "About Us", footer_contacto: "Contact the Administrator", footer_reclamos: "Complaints Book", footer_terminos: "Terms and Conditions", footer_privacidad: "Privacy Policy", menu_buscar_personas: "Find People", quick_zona: "See my area", quick_recientes: "Latest posted", quick_categorias: "Categories", quick_mundial: "Worldwide", quick_buscar: "Search for something", ph_asistente: "Type your question here...",
        account_btn: "My Account", content_title: "🌱 Circular Economy Catalog", content_subtitle: "Discover items available for exchange in your area", featured_title: "Featured Items", search_placeholder: "What are you looking for today? Ex: shirt, laptop, cars...", login_tab: "Sign In", register_tab: "Sign Up", assistant_header: "🤖 AI Assistant", footer_desc: "Connecting businesses and neighbors smartly.",
        menu_inicio: "Home", menu_perfil: "My Profile", menu_publicaciones: "My Listings", menu_blog: "My Blog", menu_mensajes: "Messages", menu_favoritos: "Favorites", menu_config: "Settings",
        panel_alcance: "Your Reach", panel_intereses: "Your Interests", btn_publicar: "Post",
        quick_publicar: "How do I post?", quick_vender: "How do I sell?", quick_seguridad: "Safety", quick_reportar: "Report", btn_limpiar: "Clear Conversation", bienvenida_title: "👋 Welcome to remarket-db", bienvenida_subtitle: "Get to know the platform before you start" },
    pt: { ask_publicar: "Como posso publicar um item?", ask_vender: "Como vendo algo de valor com segurança?", ask_seguridad: "Que medidas de segurança vocês têm?", ask_reportar: "Quero denunciar uma publicação suspeita.", msg_contacto: "📩 Aqui está o formulário para falar com o administrador. Use-o para dúvidas ou sugestões; para uma reclamação formal, use o Livro de Reclamações.", msg_reclamo: "📋 Aqui está o Livro de Reclamações. Use-o se teve um problema concreto com uma compra, venda ou publicação e quer deixá-lo registrado formalmente.", msg_reporte: "🚩 Vamos registrar sua denúncia sobre \"{p}\". Preencha os demais dados e ficará registrado formalmente.", volver_inicio: "Voltar ao início", legal_traduciendo: "Traduzindo…", legal_nota_ia: "Tradução automática. A versão em espanhol é a que tem validade legal.", legal_nota_es: "Mostrando a versão em espanhol, que é a que tem validade legal.", banner_ia: "🚀 IA Autônoma: Gerando contexto, conformidade legal e ética da economia circular.", guia_zona: "📍 Aqui está o que há disponível perto de você.", guia_recientes: "🆕 Aqui está o que foi publicado mais recentemente.", guia_novedades_label: "Mais recente", guia_buscar: "🔎 Digite acima o que você está procurando.", sponsors_title: "Patrocinadores", footer_empresa: "Empresa", footer_transparencia: "Transparência", footer_legal: "Legal", footer_quienes: "Quem Somos", footer_contacto: "Fale com o Administrador", footer_reclamos: "Livro de Reclamações", footer_terminos: "Termos e condições", footer_privacidad: "Política de privacidade", menu_buscar_personas: "Buscar Pessoas", quick_zona: "Ver minha região", quick_recientes: "Últimas publicações", quick_categorias: "Categorias", quick_mundial: "Mundial", quick_buscar: "Buscar algo", ph_asistente: "Digite sua dúvida aqui...",
        account_btn: "Minha Conta", content_title: "🌱 Catálogo de Economia Circular", content_subtitle: "Descubra itens disponíveis para troca na sua área", featured_title: "Itens em Destaque", search_placeholder: "O que você procura hoje? Ex: camisa, laptop, carros...", login_tab: "Entrar", register_tab: "Registrar", assistant_header: "🤖 Assistente de IA", footer_desc: "Conectando empresas e vizinhos de forma inteligente.",
        menu_inicio: "Início", menu_perfil: "Meu Perfil", menu_publicaciones: "Minhas Publicações", menu_blog: "Meu Blog", menu_mensajes: "Mensagens", menu_favoritos: "Favoritos", menu_config: "Configurações",
        panel_alcance: "Seu Alcance", panel_intereses: "Seus Interesses", btn_publicar: "Publicar",
        quick_publicar: "Como publico?", quick_vender: "Como vendo?", quick_seguridad: "Segurança", quick_reportar: "Denunciar", btn_limpiar: "Limpar Conversa", bienvenida_title: "👋 Bem-vindo ao remarket-db", bienvenida_subtitle: "Conheça a plataforma antes de começar" },
    fr: { ask_publicar: "Comment puis-je publier un article ?", ask_vender: "Comment vendre un objet de valeur en toute sécurité ?", ask_seguridad: "Quelles mesures de sécurité avez-vous ?", ask_reportar: "Je veux signaler une annonce suspecte.", msg_contacto: "📩 Voici le formulaire pour contacter l'administrateur. Utilisez-le pour vos questions ou suggestions ; pour une réclamation formelle, utilisez le Livre de réclamations.", msg_reclamo: "📋 Voici le Livre de réclamations. Utilisez-le si vous avez eu un problème précis avec un achat, une vente ou une annonce et souhaitez le consigner officiellement.", msg_reporte: "🚩 Enregistrons votre signalement concernant \"{p}\". Complétez les autres champs et il sera consigné officiellement.", volver_inicio: "Retour à l'accueil", legal_traduciendo: "Traduction en cours…", legal_nota_ia: "Traduction automatique. Seule la version espagnole est juridiquement valable.", legal_nota_es: "Affichage de la version espagnole, seule juridiquement valable.", banner_ia: "🚀 IA Autonome : génération du contexte, conformité légale et éthique de l'économie circulaire.", guia_zona: "📍 Voici ce qui est disponible près de chez vous.", guia_recientes: "🆕 Voici les dernières publications.", guia_novedades_label: "Le plus récent", guia_buscar: "🔎 Écrivez ci-dessus ce que vous recherchez.", sponsors_title: "Partenaires", footer_empresa: "Entreprise", footer_transparencia: "Transparence", footer_legal: "Mentions légales", footer_quienes: "Qui sommes-nous", footer_contacto: "Contacter l'administrateur", footer_reclamos: "Livre de réclamations", footer_terminos: "Conditions générales", footer_privacidad: "Politique de confidentialité", menu_buscar_personas: "Rechercher des personnes", quick_zona: "Voir ma zone", quick_recientes: "Dernières publications", quick_categorias: "Catégories", quick_mundial: "Mondial", quick_buscar: "Rechercher quelque chose", ph_asistente: "Écrivez votre question ici...",
        account_btn: "Mon Compte", content_title: "🌱 Catalogue d'Économie Circulaire", content_subtitle: "Découvrez des articles disponibles pour l'échange dans votre région", featured_title: "Articles en Vedette", search_placeholder: "Que cherchez-vous aujourd'hui? Ex: chemise, ordinateur, voitures...", login_tab: "Se connecter", register_tab: "S'inscrire", assistant_header: "🤖 Assistant IA", footer_desc: "Connecter les entreprises et les voisins intelligemment.",
        menu_inicio: "Accueil", menu_perfil: "Mon Profil", menu_publicaciones: "Mes Annonces", menu_blog: "Mon Blog", menu_mensajes: "Messages", menu_favoritos: "Favoris", menu_config: "Paramètres",
        panel_alcance: "Votre Portée", panel_intereses: "Vos Intérêts", btn_publicar: "Publier",
        quick_publicar: "Comment publier?", quick_vender: "Comment vendre?", quick_seguridad: "Sécurité", quick_reportar: "Signaler", btn_limpiar: "Effacer la Conversation", bienvenida_title: "👋 Bienvenue sur remarket-db", bienvenida_subtitle: "Découvrez la plateforme avant de commencer" },
    de: { ask_publicar: "Wie kann ich einen Artikel veröffentlichen?", ask_vender: "Wie verkaufe ich etwas Wertvolles sicher?", ask_seguridad: "Welche Sicherheitsmaßnahmen habt ihr?", ask_reportar: "Ich möchte ein verdächtiges Angebot melden.", msg_contacto: "📩 Hier ist das Formular, um den Administrator zu kontaktieren. Nutze es für Fragen oder Vorschläge; für eine formelle Beschwerde gibt es das Beschwerdebuch.", msg_reclamo: "📋 Hier ist das Beschwerdebuch. Nutze es, wenn du ein konkretes Problem mit einem Kauf, Verkauf oder Angebot hattest und es offiziell festhalten möchtest.", msg_reporte: "🚩 Wir erfassen deine Meldung zu \"{p}\". Fülle die übrigen Felder aus, dann wird sie offiziell festgehalten.", volver_inicio: "Zurück zur Startseite", legal_traduciendo: "Wird übersetzt…", legal_nota_ia: "Automatische Übersetzung. Rechtlich gültig ist die spanische Fassung.", legal_nota_es: "Es wird die spanische Fassung angezeigt, die rechtlich gültig ist.", banner_ia: "🚀 Autonome KI: Erzeugt Kontext sowie rechtliche und ethische Konformität für die Kreislaufwirtschaft.", guia_zona: "📍 Hier ist, was in deiner Nähe verfügbar ist.", guia_recientes: "🆕 Das ist das zuletzt Veröffentlichte.", guia_novedades_label: "Neueste", guia_buscar: "🔎 Schreibe oben, wonach du suchst.", sponsors_title: "Sponsoren", footer_empresa: "Unternehmen", footer_transparencia: "Transparenz", footer_legal: "Rechtliches", footer_quienes: "Über uns", footer_contacto: "Administrator kontaktieren", footer_reclamos: "Beschwerdebuch", footer_terminos: "Allgemeine Geschäftsbedingungen", footer_privacidad: "Datenschutzerklärung", menu_buscar_personas: "Personen suchen", quick_zona: "Meine Region ansehen", quick_recientes: "Neueste Beiträge", quick_categorias: "Kategorien", quick_mundial: "Weltweit", quick_buscar: "Etwas suchen", ph_asistente: "Schreibe deine Frage hier...",
        account_btn: "Mein Konto", content_title: "🌱 Katalog der Kreislaufwirtschaft", content_subtitle: "Entdecke verfügbare Artikel zum Tausch in deiner Region", featured_title: "Empfohlene Artikel", search_placeholder: "Was suchst du heute? Z.B: Hemd, Laptop, Autos...", login_tab: "Anmelden", register_tab: "Registrieren", assistant_header: "🤖 KI-Assistent", footer_desc: "Verbindet Geschäfte und Nachbarn auf intelligente Weise.",
        menu_inicio: "Start", menu_perfil: "Mein Profil", menu_publicaciones: "Meine Anzeigen", menu_mensajes: "Nachrichten", menu_favoritos: "Favoriten", menu_config: "Einstellungen",
        panel_alcance: "Deine Reichweite", panel_intereses: "Deine Interessen", btn_publicar: "Veröffentlichen",
        quick_publicar: "Wie veröffentliche ich?", quick_vender: "Wie verkaufe ich?", quick_seguridad: "Sicherheit", quick_reportar: "Melden", btn_limpiar: "Unterhaltung löschen", bienvenida_title: "👋 Willkommen bei remarket-db", bienvenida_subtitle: "Lernen Sie die Plattform kennen, bevor Sie starten" },
    it: { ask_publicar: "Come posso pubblicare un articolo?", ask_vender: "Come vendo qualcosa di valore in modo sicuro?", ask_seguridad: "Quali misure di sicurezza avete?", ask_reportar: "Voglio segnalare un annuncio sospetto.", msg_contacto: "📩 Ecco il modulo per contattare l'amministratore. Usalo per domande o suggerimenti; per un reclamo formale c'è il Libro dei reclami.", msg_reclamo: "📋 Ecco il Libro dei reclami. Usalo se hai avuto un problema concreto con un acquisto, una vendita o un annuncio e vuoi registrarlo formalmente.", msg_reporte: "🚩 Registriamo la tua segnalazione su \"{p}\". Completa gli altri dati e verrà registrata formalmente.", volver_inicio: "Torna alla home", legal_traduciendo: "Traduzione in corso…", legal_nota_ia: "Traduzione automatica. La versione in spagnolo è quella legalmente valida.", legal_nota_es: "Visualizzazione della versione in spagnolo, che è quella legalmente valida.", banner_ia: "🚀 IA Autonoma: genera contesto, conformità legale ed etica dell'economia circolare.", guia_zona: "📍 Ecco cosa è disponibile vicino a te.", guia_recientes: "🆕 Ecco le ultime pubblicazioni.", guia_novedades_label: "Più recenti", guia_buscar: "🔎 Scrivi sopra cosa stai cercando.", sponsors_title: "Sponsor", footer_empresa: "Azienda", footer_transparencia: "Trasparenza", footer_legal: "Legale", footer_quienes: "Chi siamo", footer_contacto: "Contatta l'amministratore", footer_reclamos: "Libro dei reclami", footer_terminos: "Termini e condizioni", footer_privacidad: "Informativa sulla privacy", menu_buscar_personas: "Cerca persone", quick_zona: "Vedi la mia zona", quick_recientes: "Ultimi pubblicati", quick_categorias: "Categorie", quick_mundial: "Mondiale", quick_buscar: "Cerca qualcosa", ph_asistente: "Scrivi qui la tua domanda...",
        account_btn: "Il Mio Account", content_title: "🌱 Catalogo dell'Economia Circolare", content_subtitle: "Scopri gli articoli disponibili per lo scambio nella tua zona", featured_title: "Articoli in Evidenza", search_placeholder: "Cosa cerchi oggi? Es: camicia, laptop, auto...", login_tab: "Accedi", register_tab: "Registrati", assistant_header: "🤖 Assistente IA", footer_desc: "Collega attività e vicini in modo intelligente.",
        menu_inicio: "Home", menu_perfil: "Il Mio Profilo", menu_publicaciones: "I Miei Annunci", menu_mensajes: "Messaggi", menu_favoritos: "Preferiti", menu_config: "Impostazioni",
        panel_alcance: "La Tua Portata", panel_intereses: "I Tuoi Interessi", btn_publicar: "Pubblica",
        quick_publicar: "Come pubblico?", quick_vender: "Come vendo?", quick_seguridad: "Sicurezza", quick_reportar: "Segnala", btn_limpiar: "Cancella Conversazione", bienvenida_title: "👋 Benvenuto su remarket-db", bienvenida_subtitle: "Scopri la piattaforma prima di iniziare" },
    ru: { ask_publicar: "Как опубликовать товар?", ask_vender: "Как безопасно продать ценную вещь?", ask_seguridad: "Какие у вас меры безопасности?", ask_reportar: "Хочу пожаловаться на подозрительное объявление.", msg_contacto: "📩 Вот форма для связи с администратором. Используйте её для вопросов и предложений; для официальной жалобы есть Книга жалоб.", msg_reclamo: "📋 Вот Книга жалоб. Используйте её, если у вас возникла конкретная проблема с покупкой, продажей или объявлением и вы хотите зафиксировать её официально.", msg_reporte: "🚩 Зарегистрируем вашу жалобу на «{p}». Заполните остальные поля, и она будет официально зафиксирована.", volver_inicio: "Вернуться на главную", legal_traduciendo: "Перевод…", legal_nota_ia: "Автоматический перевод. Юридическую силу имеет испанская версия.", legal_nota_es: "Показана испанская версия, имеющая юридическую силу.", banner_ia: "🚀 Автономный ИИ: формирует контекст, правовое и этическое соответствие циркулярной экономики.", guia_zona: "📍 Вот что доступно рядом с вами.", guia_recientes: "🆕 Вот последние публикации.", guia_novedades_label: "Последние", guia_buscar: "🔎 Напишите выше, что вы ищете.", sponsors_title: "Спонсоры", footer_empresa: "Компания", footer_transparencia: "Прозрачность", footer_legal: "Правовая информация", footer_quienes: "О нас", footer_contacto: "Связаться с администратором", footer_reclamos: "Книга жалоб", footer_terminos: "Условия использования", footer_privacidad: "Политика конфиденциальности", menu_buscar_personas: "Поиск людей", quick_zona: "Моя зона", quick_recientes: "Последние публикации", quick_categorias: "Категории", quick_mundial: "Весь мир", quick_buscar: "Найти что-нибудь", ph_asistente: "Напишите свой вопрос здесь...",
        account_btn: "Мой аккаунт", content_title: "🌱 Каталог циркулярной экономики", content_subtitle: "Найдите товары для обмена в вашем районе", featured_title: "Избранные товары", search_placeholder: "Что вы ищете сегодня? Напр: рубашка, ноутбук, машина...", login_tab: "Войти", register_tab: "Регистрация", assistant_header: "🤖 ИИ-Ассистент", footer_desc: "Умное соединение бизнеса и соседей.",
        menu_inicio: "Главная", menu_perfil: "Мой профиль", menu_publicaciones: "Мои объявления", menu_mensajes: "Сообщения", menu_favoritos: "Избранное", menu_config: "Настройки",
        panel_alcance: "Ваш охват", panel_intereses: "Ваши интересы", btn_publicar: "Опубликовать",
        quick_publicar: "Как опубликовать?", quick_vender: "Как продать?", quick_seguridad: "Безопасность", quick_reportar: "Пожаловаться", btn_limpiar: "Очистить чат", bienvenida_title: "👋 Добро пожаловать в remarket-db", bienvenida_subtitle: "Узнайте о платформе, прежде чем начать" },
    zh: { ask_publicar: "我该如何发布商品？", ask_vender: "如何安全地出售贵重物品？", ask_seguridad: "你们有哪些安全措施？", ask_reportar: "我想举报一条可疑的发布。", msg_contacto: "📩 这是联系管理员的表单。可用于咨询或建议；如需正式投诉，请使用投诉簿。", msg_reclamo: "📋 这是投诉簿。如果您在购买、出售或发布中遇到具体问题，并希望正式登记，请使用它。", msg_reporte: "🚩 我们来登记您对“{p}”的举报。请填写其余信息，系统将正式记录。", volver_inicio: "返回首页", legal_traduciendo: "正在翻译…", legal_nota_ia: "机器翻译。以西班牙语版本为准，具有法律效力。", legal_nota_es: "正在显示西班牙语版本，该版本具有法律效力。", banner_ia: "🚀 自治人工智能：生成循环经济的背景信息、法律与道德合规。", guia_zona: "📍 这是您附近可用的内容。", guia_recientes: "🆕 这是最新发布的内容。", guia_novedades_label: "最新", guia_buscar: "🔎 请在上方输入您要查找的内容。", sponsors_title: "赞助商", footer_empresa: "公司", footer_transparencia: "透明度", footer_legal: "法律", footer_quienes: "关于我们", footer_contacto: "联系管理员", footer_reclamos: "投诉簿", footer_terminos: "条款和条件", footer_privacidad: "隐私政策", menu_buscar_personas: "查找用户", quick_zona: "查看我的区域", quick_recientes: "最新发布", quick_categorias: "分类", quick_mundial: "全球", quick_buscar: "搜索内容", ph_asistente: "在此输入您的问题...",
        account_btn: "我的账户", content_title: "🌱 循环经济目录", content_subtitle: "发现你所在地区可交换的物品", featured_title: "精选商品", search_placeholder: "您今天在找什么？例如：衬衫、笔记本电脑、汽车...", login_tab: "登录", register_tab: "注册", assistant_header: "🤖 AI助手", footer_desc: "智能连接商家与邻里。",
        menu_inicio: "首页", menu_perfil: "我的资料", menu_publicaciones: "我的发布", menu_mensajes: "消息", menu_favoritos: "收藏", menu_config: "设置",
        panel_alcance: "你的覆盖范围", panel_intereses: "你的兴趣", btn_publicar: "发布",
        quick_publicar: "如何发布？", quick_vender: "如何出售？", quick_seguridad: "安全", quick_reportar: "举报", btn_limpiar: "清除对话", bienvenida_title: "👋 欢迎来到 remarket-db", bienvenida_subtitle: "开始之前先了解平台" },
    ja: { ask_publicar: "商品はどうやって投稿できますか？", ask_vender: "価値のあるものを安全に売るにはどうすればいいですか？", ask_seguridad: "どのような安全対策がありますか？", ask_reportar: "不審な投稿を報告したいです。", msg_contacto: "📩 管理者への連絡フォームです。ご質問やご提案にご利用ください。正式な苦情には苦情申立帳をご利用ください。", msg_reclamo: "📋 苦情申立帳です。購入・販売・投稿で具体的な問題があり、正式に記録したい場合にご利用ください。", msg_reporte: "🚩 「{p}」についての報告を登録します。残りの項目を入力すると、正式に記録されます。", volver_inicio: "ホームに戻る", legal_traduciendo: "翻訳中…", legal_nota_ia: "自動翻訳です。法的効力を持つのはスペイン語版です。", legal_nota_es: "法的効力を持つスペイン語版を表示しています。", banner_ia: "🚀 自律型AI:循環経済のコンテキスト、法令遵守、倫理的整合性を生成中。", guia_zona: "📍 近くで利用できるものはこちらです。", guia_recientes: "🆕 最新の投稿はこちらです。", guia_novedades_label: "最新", guia_buscar: "🔎 上の欄に探しているものを入力してください。", sponsors_title: "スポンサー", footer_empresa: "会社情報", footer_transparencia: "透明性", footer_legal: "法的情報", footer_quienes: "私たちについて", footer_contacto: "管理者に連絡", footer_reclamos: "苦情申立帳", footer_terminos: "利用規約", footer_privacidad: "プライバシーポリシー", menu_buscar_personas: "人を探す", quick_zona: "私の地域を見る", quick_recientes: "最新の投稿", quick_categorias: "カテゴリー", quick_mundial: "世界", quick_buscar: "何か探す", ph_asistente: "ここに質問を入力...",
        account_btn: "マイアカウント", content_title: "🌱 循環経済カタログ", content_subtitle: "あなたの地域で交換できるアイテムを見つけよう", featured_title: "おすすめ商品", search_placeholder: "今日は何をお探しですか？例：シャツ、ノートパソコン、車...", login_tab: "ログイン", register_tab: "登録", assistant_header: "🤖 AIアシスタント", footer_desc: "お店と近隣をスマートにつなぐ。",
        menu_inicio: "ホーム", menu_perfil: "マイプロフィール", menu_publicaciones: "マイ出品", menu_mensajes: "メッセージ", menu_favoritos: "お気に入り", menu_config: "設定",
        panel_alcance: "あなたの範囲", panel_intereses: "あなたの興味", btn_publicar: "出品する",
        quick_publicar: "出品方法は？", quick_vender: "販売方法は？", quick_seguridad: "安全", quick_reportar: "通報", btn_limpiar: "会話をクリア", bienvenida_title: "👋 remarket-dbへようこそ", bienvenida_subtitle: "始める前にプラットフォームを知ろう" },
    ko: { ask_publicar: "물품은 어떻게 게시하나요?", ask_vender: "가치 있는 물건을 안전하게 판매하려면 어떻게 해야 하나요?", ask_seguridad: "어떤 보안 조치가 있나요?", ask_reportar: "의심스러운 게시물을 신고하고 싶어요.", msg_contacto: "📩 관리자에게 문의하는 양식입니다. 문의나 제안에 사용하세요. 정식 불만은 고객 불만 접수를 이용해 주세요.", msg_reclamo: "📋 고객 불만 접수 양식입니다. 구매, 판매 또는 게시물과 관련해 구체적인 문제가 있어 공식적으로 기록하고 싶을 때 사용하세요.", msg_reporte: "🚩 \"{p}\"에 대한 신고를 접수하겠습니다. 나머지 항목을 작성하시면 공식적으로 기록됩니다.", volver_inicio: "홈으로 돌아가기", legal_traduciendo: "번역 중…", legal_nota_ia: "자동 번역입니다. 법적 효력은 스페인어 버전에 있습니다.", legal_nota_es: "법적 효력이 있는 스페인어 버전을 표시합니다.", banner_ia: "🚀 자율 AI: 순환 경제의 맥락과 법적·윤리적 준수를 생성 중입니다.", guia_zona: "📍 근처에서 이용 가능한 항목입니다.", guia_recientes: "🆕 최근에 게시된 항목입니다.", guia_novedades_label: "최신순", guia_buscar: "🔎 위에 찾으시는 것을 입력하세요.", sponsors_title: "후원사", footer_empresa: "회사", footer_transparencia: "투명성", footer_legal: "법적 고지", footer_quienes: "회사 소개", footer_contacto: "관리자에게 문의", footer_reclamos: "고객 불만 접수", footer_terminos: "이용약관", footer_privacidad: "개인정보 처리방침", menu_buscar_personas: "사람 찾기", quick_zona: "내 지역 보기", quick_recientes: "최신 게시물", quick_categorias: "카테고리", quick_mundial: "전 세계", quick_buscar: "무엇이든 검색", ph_asistente: "궁금한 점을 입력하세요...",
        account_btn: "내 계정", content_title: "🌱 순환 경제 카탈로그", content_subtitle: "지역 내 교환 가능한 물품을 찾아보세요", featured_title: "추천 상품", search_placeholder: "오늘은 무엇을 찾으세요? 예: 셔츠, 노트북, 자동차...", login_tab: "로그인", register_tab: "회원가입", assistant_header: "🤖 AI 어시스턴트", footer_desc: "상점과 이웃을 스마트하게 연결합니다.",
        menu_inicio: "홈", menu_perfil: "내 프로필", menu_publicaciones: "내 게시물", menu_mensajes: "메시지", menu_favoritos: "즐겨찾기", menu_config: "설정",
        panel_alcance: "내 도달 범위", panel_intereses: "내 관심사", btn_publicar: "게시하기",
        quick_publicar: "게시하는 방법은?", quick_vender: "판매하는 방법은?", quick_seguridad: "보안", quick_reportar: "신고", btn_limpiar: "대화 지우기", bienvenida_title: "👋 remarket-db에 오신 것을 환영합니다", bienvenida_subtitle: "시작하기 전에 플랫폼을 알아보세요" },
    ar: { ask_publicar: "كيف يمكنني نشر منتج؟", ask_vender: "كيف أبيع شيئًا ثمينًا بأمان؟", ask_seguridad: "ما هي إجراءات الأمان لديكم؟", ask_reportar: "أريد الإبلاغ عن منشور مشبوه.", msg_contacto: "📩 هذا هو نموذج التواصل مع المسؤول. استخدمه للاستفسارات أو الاقتراحات؛ وللشكاوى الرسمية استخدم سجل الشكاوى.", msg_reclamo: "📋 هذا هو سجل الشكاوى. استخدمه إذا واجهت مشكلة محددة في عملية شراء أو بيع أو منشور وتريد تسجيلها رسميًا.", msg_reporte: "🚩 لنسجّل بلاغك بشأن \"{p}\". أكمل باقي البيانات وسيتم تسجيله رسميًا.", volver_inicio: "العودة إلى الرئيسية", legal_traduciendo: "جارٍ الترجمة…", legal_nota_ia: "ترجمة آلية. النسخة الإسبانية هي النسخة المعتمدة قانونيًا.", legal_nota_es: "يتم عرض النسخة الإسبانية، وهي المعتمدة قانونيًا.", banner_ia: "🚀 ذكاء اصطناعي مستقل: يولّد السياق والامتثال القانوني والأخلاقي للاقتصاد الدائري.", guia_zona: "📍 إليك ما هو متاح بالقرب منك.", guia_recientes: "🆕 إليك آخر ما تم نشره.", guia_novedades_label: "الأحدث", guia_buscar: "🔎 اكتب أعلاه ما تبحث عنه.", sponsors_title: "الرعاة", footer_empresa: "الشركة", footer_transparencia: "الشفافية", footer_legal: "قانوني", footer_quienes: "من نحن", footer_contacto: "تواصل مع المسؤول", footer_reclamos: "سجل الشكاوى", footer_terminos: "الشروط والأحكام", footer_privacidad: "سياسة الخصوصية", menu_buscar_personas: "البحث عن أشخاص", quick_zona: "عرض منطقتي", quick_recientes: "أحدث المنشورات", quick_categorias: "الفئات", quick_mundial: "عالمي", quick_buscar: "ابحث عن شيء", ph_asistente: "اكتب سؤالك هنا...",
        account_btn: "حسابي", content_title: "🌱 كتالوج الاقتصاد الدائري", content_subtitle: "اكتشف العناصر المتاحة للتبادل في منطقتك", featured_title: "منتجات مميزة", search_placeholder: "عن ماذا تبحث اليوم؟ مثال: قميص، حاسوب، سيارات...", login_tab: "تسجيل الدخول", register_tab: "إنشاء حساب", assistant_header: "🤖 المساعد الذكي", footer_desc: "ربط المتاجر والجيران بذكاء.",
        menu_inicio: "الرئيسية", menu_perfil: "ملفي الشخصي", menu_publicaciones: "إعلاناتي", menu_mensajes: "الرسائل", menu_favoritos: "المفضلة", menu_config: "الإعدادات",
        panel_alcance: "نطاقك", panel_intereses: "اهتماماتك", btn_publicar: "نشر",
        quick_publicar: "كيف أنشر؟", quick_vender: "كيف أبيع؟", quick_seguridad: "الأمان", quick_reportar: "إبلاغ", btn_limpiar: "مسح المحادثة", bienvenida_title: "👋 مرحبًا بك في remarket-db", bienvenida_subtitle: "تعرف على المنصة قبل البدء" },
    hi: { ask_publicar: "मैं कोई वस्तु कैसे पोस्ट करूँ?", ask_vender: "मैं कीमती चीज़ सुरक्षित तरीके से कैसे बेचूँ?", ask_seguridad: "आपके पास कौन-से सुरक्षा उपाय हैं?", ask_reportar: "मैं एक संदिग्ध पोस्ट की रिपोर्ट करना चाहता हूँ।", msg_contacto: "📩 यह व्यवस्थापक से संपर्क करने का फ़ॉर्म है। प्रश्नों या सुझावों के लिए इसका उपयोग करें; औपचारिक शिकायत के लिए शिकायत पुस्तिका है।", msg_reclamo: "📋 यह शिकायत पुस्तिका है। यदि किसी खरीद, बिक्री या पोस्ट में आपको कोई खास समस्या हुई है और आप उसे औपचारिक रूप से दर्ज कराना चाहते हैं, तो इसका उपयोग करें।", msg_reporte: "🚩 चलिए \"{p}\" के बारे में आपकी रिपोर्ट दर्ज करते हैं। बाकी जानकारी भरें, और यह औपचारिक रूप से दर्ज हो जाएगी।", volver_inicio: "होम पर वापस जाएँ", legal_traduciendo: "अनुवाद हो रहा है…", legal_nota_ia: "स्वचालित अनुवाद। कानूनी रूप से मान्य संस्करण स्पेनिश है।", legal_nota_es: "स्पेनिश संस्करण दिखाया जा रहा है, जो कानूनी रूप से मान्य है।", banner_ia: "🚀 स्वायत्त AI: सर्कुलर इकॉनमी के लिए संदर्भ, कानूनी और नैतिक अनुपालन तैयार कर रहा है।", guia_zona: "📍 यह रहा जो आपके आस-पास उपलब्ध है।", guia_recientes: "🆕 यह रहा जो हाल ही में पोस्ट किया गया।", guia_novedades_label: "नवीनतम", guia_buscar: "🔎 ऊपर लिखें कि आप क्या खोज रहे हैं।", sponsors_title: "प्रायोजक", footer_empresa: "कंपनी", footer_transparencia: "पारदर्शिता", footer_legal: "कानूनी", footer_quienes: "हमारे बारे में", footer_contacto: "व्यवस्थापक से संपर्क करें", footer_reclamos: "शिकायत पुस्तिका", footer_terminos: "नियम और शर्तें", footer_privacidad: "गोपनीयता नीति", menu_buscar_personas: "लोगों को खोजें", quick_zona: "मेरा क्षेत्र देखें", quick_recientes: "नवीनतम पोस्ट", quick_categorias: "श्रेणियाँ", quick_mundial: "दुनिया भर", quick_buscar: "कुछ खोजें", ph_asistente: "अपना प्रश्न यहाँ लिखें...",
        account_btn: "मेरा खाता", content_title: "🌱 सर्कुलर इकॉनमी कैटलॉग", content_subtitle: "अपने क्षेत्र में विनिमय के लिए उपलब्ध वस्तुएं खोजें", featured_title: "प्रमुख वस्तुएं", search_placeholder: "आज आप क्या ढूंढ रहे हैं? जैसे: शर्ट, लैपटॉप, कार...", login_tab: "लॉगिन करें", register_tab: "रजिस्टर करें", assistant_header: "🤖 AI सहायक", footer_desc: "व्यवसायों और पड़ोसियों को समझदारी से जोड़ना।",
        menu_inicio: "होम", menu_perfil: "मेरी प्रोफ़ाइल", menu_publicaciones: "मेरी पोस्ट", menu_mensajes: "संदेश", menu_favoritos: "पसंदीदा", menu_config: "सेटिंग्स",
        panel_alcance: "आपकी पहुंच", panel_intereses: "आपकी रुचियां", btn_publicar: "पोस्ट करें",
        quick_publicar: "मैं कैसे पोस्ट करूं?", quick_vender: "मैं कैसे बेचूं?", quick_seguridad: "सुरक्षा", quick_reportar: "रिपोर्ट करें", btn_limpiar: "बातचीत साफ़ करें", bienvenida_title: "👋 remarket-db में आपका स्वागत है", bienvenida_subtitle: "शुरू करने से पहले प्लेटफ़ॉर्म को जानें" },
    nl: { ask_publicar: "Hoe kan ik een artikel plaatsen?", ask_vender: "Hoe verkoop ik iets waardevols veilig?", ask_seguridad: "Welke veiligheidsmaatregelen hebben jullie?", ask_reportar: "Ik wil een verdacht bericht melden.", msg_contacto: "📩 Hier is het formulier om contact op te nemen met de beheerder. Gebruik het voor vragen of suggesties; voor een formele klacht is er het Klachtenboek.", msg_reclamo: "📋 Hier is het Klachtenboek. Gebruik het als je een concreet probleem had met een aankoop, verkoop of bericht en dit officieel wilt laten vastleggen.", msg_reporte: "🚩 We leggen je melding over \"{p}\" vast. Vul de overige gegevens in en het wordt officieel geregistreerd.", volver_inicio: "Terug naar home", legal_traduciendo: "Bezig met vertalen…", legal_nota_ia: "Automatische vertaling. De Spaanse versie is de juridisch geldige versie.", legal_nota_es: "De Spaanse versie wordt getoond; die is juridisch geldig.", banner_ia: "🚀 Autonome AI: genereert context, wettelijke en ethische naleving voor de circulaire economie.", guia_zona: "📍 Dit is wat er beschikbaar is bij jou in de buurt.", guia_recientes: "🆕 Dit is het laatst geplaatste.", guia_novedades_label: "Meest recent", guia_buscar: "🔎 Typ hierboven wat je zoekt.", sponsors_title: "Sponsors", footer_empresa: "Bedrijf", footer_transparencia: "Transparantie", footer_legal: "Juridisch", footer_quienes: "Over ons", footer_contacto: "Neem contact op met de beheerder", footer_reclamos: "Klachtenboek", footer_terminos: "Algemene voorwaarden", footer_privacidad: "Privacybeleid", menu_buscar_personas: "Mensen zoeken", quick_zona: "Mijn regio bekijken", quick_recientes: "Laatst geplaatst", quick_categorias: "Categorieën", quick_mundial: "Wereldwijd", quick_buscar: "Iets zoeken", ph_asistente: "Typ hier je vraag...",
        account_btn: "Mijn Account", content_title: "🌱 Circulaire Economie Catalogus", content_subtitle: "Ontdek artikelen beschikbaar voor ruil in jouw omgeving", featured_title: "Uitgelichte Artikelen", search_placeholder: "Wat zoek je vandaag? Bijv: shirt, laptop, auto's...", login_tab: "Inloggen", register_tab: "Registreren", assistant_header: "🤖 AI-Assistent", footer_desc: "Verbindt bedrijven en buren op een slimme manier.",
        menu_inicio: "Start", menu_perfil: "Mijn Profiel", menu_publicaciones: "Mijn Advertenties", menu_mensajes: "Berichten", menu_favoritos: "Favorieten", menu_config: "Instellingen",
        panel_alcance: "Jouw Bereik", panel_intereses: "Jouw Interesses", btn_publicar: "Plaatsen",
        quick_publicar: "Hoe plaats ik?", quick_vender: "Hoe verkoop ik?", quick_seguridad: "Veiligheid", quick_reportar: "Rapporteren", btn_limpiar: "Gesprek wissen", bienvenida_title: "👋 Welkom bij remarket-db", bienvenida_subtitle: "Leer het platform kennen voordat je begint" },
    tr: { ask_publicar: "Bir ürünü nasıl yayınlayabilirim?", ask_vender: "Değerli bir şeyi nasıl güvenle satarım?", ask_seguridad: "Hangi güvenlik önlemlerine sahipsiniz?", ask_reportar: "Şüpheli bir ilanı bildirmek istiyorum.", msg_contacto: "📩 Yöneticiyle iletişime geçmek için form burada. Sorular veya öneriler için kullanın; resmi şikayet için Şikayet Defteri var.", msg_reclamo: "📋 Şikayet Defteri burada. Bir alım, satım veya ilanla ilgili somut bir sorun yaşadıysanız ve bunu resmî olarak kaydettirmek istiyorsanız kullanın.", msg_reporte: "🚩 \"{p}\" hakkındaki bildiriminizi kaydedelim. Diğer bilgileri doldurun, resmî olarak kayda geçecektir.", volver_inicio: "Ana sayfaya dön", legal_traduciendo: "Çevriliyor…", legal_nota_ia: "Otomatik çeviri. Hukuki geçerliliği olan sürüm İspanyolca sürümdür.", legal_nota_es: "Hukuki geçerliliği olan İspanyolca sürüm gösteriliyor.", banner_ia: "🚀 Otonom Yapay Zeka: döngüsel ekonomi için bağlam, yasal ve etik uyum oluşturuyor.", guia_zona: "📍 İşte yakınında bulunanlar.", guia_recientes: "🆕 İşte en son yayınlananlar.", guia_novedades_label: "En yeni", guia_buscar: "🔎 Yukarıya aradığınızı yazın.", sponsors_title: "Sponsorlar", footer_empresa: "Şirket", footer_transparencia: "Şeffaflık", footer_legal: "Yasal", footer_quienes: "Hakkımızda", footer_contacto: "Yönetici ile iletişime geç", footer_reclamos: "Şikayet Defteri", footer_terminos: "Şartlar ve Koşullar", footer_privacidad: "Gizlilik Politikası", menu_buscar_personas: "Kişi ara", quick_zona: "Bölgemi gör", quick_recientes: "Son yayınlananlar", quick_categorias: "Kategoriler", quick_mundial: "Dünya çapında", quick_buscar: "Bir şey ara", ph_asistente: "Sorunuzu buraya yazın...",
        account_btn: "Hesabım", content_title: "🌱 Döngüsel Ekonomi Kataloğu", content_subtitle: "Bölgenizde takas için mevcut ürünleri keşfedin", featured_title: "Öne Çıkan Ürünler", search_placeholder: "Bugün ne arıyorsun? Örn: gömlek, laptop, araba...", login_tab: "Giriş Yap", register_tab: "Kayıt Ol", assistant_header: "🤖 Yapay Zeka Asistanı", footer_desc: "İşletmeleri ve komşuları akıllıca birbirine bağlar.",
        menu_inicio: "Ana Sayfa", menu_perfil: "Profilim", menu_publicaciones: "İlanlarım", menu_mensajes: "Mesajlar", menu_favoritos: "Favoriler", menu_config: "Ayarlar",
        panel_alcance: "Erişimin", panel_intereses: "İlgi Alanların", btn_publicar: "Yayınla",
        quick_publicar: "Nasıl yayınlarım?", quick_vender: "Nasıl satarım?", quick_seguridad: "Güvenlik", quick_reportar: "Bildir", btn_limpiar: "Sohbeti Temizle", bienvenida_title: "👋 remarket-db'ye hoş geldiniz", bienvenida_subtitle: "Başlamadan önce platformu tanıyın" },
    bg: { ask_publicar: "Как мога да публикувам артикул?", ask_vender: "Как да продам нещо ценно безопасно?", ask_seguridad: "Какви мерки за сигурност имате?", ask_reportar: "Искам да докладвам подозрителна публикация.", msg_contacto: "📩 Ето формата за връзка с администратора. Използвайте я за въпроси или предложения; за официална жалба има Книга за жалби.", msg_reclamo: "📋 Ето Книгата за жалби. Използвайте я, ако сте имали конкретен проблем с покупка, продажба или публикация и искате да го регистрирате официално.", msg_reporte: "🚩 Нека регистрираме сигнала ви за „{p}“. Попълнете останалите данни и той ще бъде официално записан.", volver_inicio: "Обратно към началото", legal_traduciendo: "Превежда се…", legal_nota_ia: "Автоматичен превод. Юридически валидна е испанската версия.", legal_nota_es: "Показва се испанската версия, която е юридически валидна.", banner_ia: "🚀 Автономен ИИ: генерира контекст, правно и етично съответствие за кръговата икономика.", guia_zona: "📍 Ето какво има наблизо до теб.", guia_recientes: "🆕 Това е последно публикуваното.", guia_novedades_label: "Най-ново", guia_buscar: "🔎 Напиши по-горе какво търсиш.", sponsors_title: "Спонсори", footer_empresa: "Компания", footer_transparencia: "Прозрачност", footer_legal: "Правна информация", footer_quienes: "За нас", footer_contacto: "Свържете се с администратора", footer_reclamos: "Книга за жалби", footer_terminos: "Общи условия", footer_privacidad: "Политика за поверителност", menu_buscar_personas: "Търсене на хора", quick_zona: "Виж моя район", quick_recientes: "Последно публикувани", quick_categorias: "Категории", quick_mundial: "Целият свят", quick_buscar: "Търси нещо", ph_asistente: "Напишете въпроса си тук...",
        account_btn: "Моят акаунт", content_title: "🌱 Каталог на кръговата икономика", content_subtitle: "Открийте налични артикули за размяна във вашия район", featured_title: "Препоръчани артикули", search_placeholder: "Какво търсите днес? Напр: риза, лаптоп, коли...", login_tab: "Вход", register_tab: "Регистрация", assistant_header: "🤖 ИИ Асистент", footer_desc: "Свързва бизнеси и съседи по интелигентен начин.",
        menu_inicio: "Начало", menu_perfil: "Моят профил", menu_publicaciones: "Моите обяви", menu_mensajes: "Съобщения", menu_favoritos: "Любими", menu_config: "Настройки",
        panel_alcance: "Вашият обхват", panel_intereses: "Вашите интереси", btn_publicar: "Публикувай",
        quick_publicar: "Как да публикувам?", quick_vender: "Как да продам?", quick_seguridad: "Сигурност", quick_reportar: "Докладвай", btn_limpiar: "Изчисти разговора", bienvenida_title: "👋 Добре дошли в remarket-db", bienvenida_subtitle: "Опознайте платформата, преди да започнете" },
    // NOTA: traducción de buena fe (quechua sureño / Cusco-Collao). Se recomienda que un hablante
    // nativo la revise antes de usarla en producción, ya que el quechua no tiene una única ortografía estándar.
    qu: { legal_traduciendo: "…", legal_nota_ia: "Español simipi qillqatam kamachipi allin.", legal_nota_es: "Español simipi qillqatam rikuchichkan; chaymi kamachipi allin kachkan.", banner_ia: "🚀 Kikillanmanta IA: muyuq kawsaypa kamachisqanta, chanin ruwaytawan hunt'achishan.", banner_ia: "🚀 Kikillanmanta IA: muyuq kawsaypa kamachisqanta, chanin ruwaytawan hunt'achishan.", guia_zona: "📍 Kayqa llaqtaykipi kasqanku.", guia_recientes: "🆕 Kayqa qhipa qillqasqakuna.", guia_novedades_label: "Qhipa qillqasqa", guia_buscar: "🔎 Hawapi qillqay ima maskasqaykita.", sponsors_title: "Yanapaqkuna", footer_empresa: "Ruwaq wasi", footer_transparencia: "Sut'i kay", footer_legal: "Kamachi", footer_quienes: "Pikuna kanchik", footer_contacto: "Kamachikuqwan rimay", footer_reclamos: "Quejakuy qillqa", footer_terminos: "Kamachikuykuna", footer_privacidad: "Pakay kamachi", menu_buscar_personas: "Runakunata maskay", quick_zona: "Llaqtayta qhaway", quick_recientes: "Qhipa qillqasqa", quick_categorias: "Rakisqakuna", quick_mundial: "Tukuy pachapi", quick_buscar: "Imatapas maskay", ph_asistente: "Tapukuyniykita kaypi qillqay...",
        account_btn: "Cuentay", content_title: "🌱 Muyuq Kawsay Qhatu", content_subtitle: "Llaqtaykipi kutichisqa kaqkunata tarikuy", featured_title: "Akllasqa Kaqkuna", search_placeholder: "¿Imatataq maskanki kunan? Ejemplo: p'acha, laptop, karro...", login_tab: "Yaykuy", register_tab: "Qillqakuy", assistant_header: "🤖 IA Yanapaq", footer_desc: "Qhatukunata, wasimasikunatawan yachayniyuq tinkichisqa.",
        menu_inicio: "Qallariy", menu_perfil: "Perfilniy", menu_publicaciones: "Qillqasqaykuna", menu_mensajes: "Willakuykuna", menu_favoritos: "Munasqaykuna", menu_config: "Allichaykuna",
        panel_alcance: "Chayasqayki", panel_intereses: "Munasqaykikuna", btn_publicar: "Qillqay",
        quick_publicar: "¿Imaynatataq qillqani?", quick_vender: "¿Imaynatataq rantikuni?", quick_seguridad: "Waqaychay", quick_reportar: "Willay", btn_limpiar: "Rimanakuyta Pichay", bienvenida_title: "👋 Allin hamusqa remarket-db-man", bienvenida_subtitle: "Qallariyta ñawpaqta plataformata riqsiy" },
    // NOTA: traducción de buena fe (aymara). Se recomienda que un hablante nativo la revise
    // antes de usarla en producción, por la misma razón que el quechua.
    ay: { legal_traduciendo: "…", legal_nota_ia: "Español aru qillqataw kamachin chiqapa.", legal_nota_es: "Español aru qillqataw uñachayata; ukaw kamachin chiqapa.", banner_ia: "🚀 Kikpach IA: muyt'at jakawimpi kamachi ukat chiqapa lurawinakampi phuqhayaski.", banner_ia: "🚀 Kikpach IA: muyt'at jakawimpi kamachi ukat chiqapa lurawinakampi phuqhayaski.", guia_zona: "📍 Akapan jumana marka pampana utjki.", guia_recientes: "🆕 Akapanwa qhipa uñstatanaka.", guia_novedades_label: "Qhipa uñstata", guia_buscar: "🔎 Patankiw qillqt'am kuna thaqhta.", sponsors_title: "Yanapirinaka", footer_empresa: "Irnaqawi uta", footer_transparencia: "Chiqa uñacht'aña", footer_legal: "Kamachi", footer_quienes: "Jiwasanakat", footer_contacto: "Irpirimpi parlt'aña", footer_reclamos: "Quejasiña qillqa", footer_terminos: "Kamachinaka", footer_privacidad: "Imantata kamachi", menu_buscar_personas: "Jaqinaka thaqhaña", quick_zona: "Markaja uñjaña", quick_recientes: "Qhipa uñstayata", quick_categorias: "Laya laya", quick_mundial: "Taqpacha uraqin", quick_buscar: "Kunatsa thaqhaña", ph_asistente: "Jiskt'añam akar qillqt'aña...",
        account_btn: "Kuentaja", content_title: "🌱 Muyt'ata Katalogo", content_subtitle: "Marka manqhankiri turkañataki utjki ukanaka jikxataña", featured_title: "Ajlliski Amtanaka", search_placeholder: "¿Kunsa jichhürux thaqhta? Sasin: isi, laptop, wasa...", login_tab: "Mantaña", register_tab: "Qillqantaña", assistant_header: "🤖 IA Yanapiri", footer_desc: "Alanaka ukat jakpast'irinaka yatiñampi apxatasiñataki.",
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
    const asistInput = document.getElementById('assistantInput'); if (asistInput && t.ph_asistente) asistInput.placeholder = t.ph_asistente;

    // Menú lateral
    var mapaMenu = { menuTextInicio: 'menu_inicio', menuTextPerfil: 'menu_perfil', menuTextPublicaciones: 'menu_publicaciones', menuTextMensajes: 'menu_mensajes', menuTextFavoritos: 'menu_favoritos', menuTextConfig: 'menu_config',
        panelTextAlcance: 'panel_alcance', panelTextIntereses: 'panel_intereses', btnPublicarTexto: 'btn_publicar',
        quickTextPublicar: 'quick_publicar', quickTextVender: 'quick_vender', quickTextSeguridad: 'quick_seguridad', quickTextReportar: 'quick_reportar', btnLimpiarTexto: 'btn_limpiar',
        menuTextBuscarPersonas: 'menu_buscar_personas',
        sponsorsTitle: 'sponsors_title', bannerText: 'banner_ia',
        sideQuickPublicar: 'quick_publicar', sideQuickVender: 'quick_vender', sideQuickZona: 'quick_zona', sideQuickRecientes: 'quick_recientes', sideQuickCategorias: 'quick_categorias', sideQuickMundial: 'quick_mundial', sideQuickBuscar: 'quick_buscar',
        footerEmpresa: 'footer_empresa', footerTransparencia: 'footer_transparencia', footerLegal: 'footer_legal', footerQuienes: 'footer_quienes', footerContacto: 'footer_contacto', footerReclamos: 'footer_reclamos', footerSeguridad: 'quick_seguridad', footerReportar: 'quick_reportar', footerTerminos: 'footer_terminos', footerPrivacidad: 'footer_privacidad' };
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
        'ay': 'Aspakiruski! Qamta yanapt\'añataki. ¿Kunsa muntaxa?',
        "de": "Hallo! Ich bin dein globaler Assistent für Kreislaufwirtschaft. Was brauchst du heute?",
        "it": "Ciao! Sono il tuo assistente globale per l'economia circolare. Di cosa hai bisogno oggi?",
        "ru": "Здравствуйте! Я ваш глобальный помощник по циркулярной экономике. Что вам нужно сегодня?",
        "zh": "你好！我是你的全球循环经济助手。今天需要什么帮助？",
        "ja": "こんにちは！私はあなたのグローバル循環経済アシスタントです。今日は何をお手伝いしましょうか？",
        "ko": "안녕하세요! 저는 글로벌 순환 경제 도우미입니다. 오늘 무엇이 필요하세요?",
        "ar": "مرحبًا! أنا مساعدك العالمي للاقتصاد الدائري. ماذا تحتاج اليوم؟",
        "hi": "नमस्ते! मैं आपका वैश्विक सर्कुलर इकॉनमी सहायक हूँ। आज आपको क्या चाहिए?",
        "nl": "Hallo! Ik ben je wereldwijde assistent voor circulaire economie. Wat heb je vandaag nodig?",
        "tr": "Merhaba! Ben küresel döngüsel ekonomi asistanınızım. Bugün neye ihtiyacınız var?"
    };
    document.getElementById('assistantResponse').innerHTML = '<div class="chat-message assistant">' + (saludos[lang] || saludos['es']) + '</div>';
    AIService.limpiarHistorial();

    aplicarTraduccionUI(lang);
    // Los botones "Visitar" de los patrocinadores se pintan una sola vez al cargar la página;
    // hay que actualizarles el texto al cambiar de idioma (sin volver a sortear los patrocinadores).
    if (typeof Institucional !== 'undefined' && Institucional.t) {
        document.querySelectorAll('.btn-sponsor').forEach(function(b) { b.textContent = Institucional.t('btn_visitar'); });
        // Si el Libro de Reclamaciones o el formulario de Contacto están abiertos, se retraducen
        // en el sitio (sin perder lo ya escrito) -- si no, se quedaban en el idioma con el que
        // se abrieron aunque el resto de la interfaz ya hubiera cambiado.
        if (Institucional.retraducirFormularioAbierto) Institucional.retraducirFormularioAbierto();
    }
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
  

// Devuelve un texto de UI en el idioma actual; si ese idioma no tiene la clave (por ejemplo
// quechua o aimara en textos nuevos), devuelve el texto por defecto que se le pase (español).
function textoUI(clave, porDefecto) {
    try {
        var t = UI_TRANSLATIONS[obtenerIdiomaPreferido()];
        if (t && t[clave]) return t[clave];
    } catch (e) { /* se usa el texto por defecto */ }
    return porDefecto;
}

// Mensajes de guía de los botones rápidos del panel lateral (Ver mi zona, Lo último publicado,
// Buscar algo). Usa el mismo mecanismo que textoUI(): las 4 claves ya están predefinidas en los
// 17 idiomas dentro de UI_TRANSLATIONS, así que esto solo mapea el "tipo" de botón a su clave --
// no hay ninguna carga ni espera, el texto ya estaba ahí desde que se abrió la página.
function obtenerMensajeGuia(tipo) {
    var claves = { zona: 'guia_zona', recientes: 'guia_recientes', novedades_label: 'guia_novedades_label', buscar: 'guia_buscar' };
    var clave = claves[tipo];
    if (!clave) return '';
    return textoUI(clave, UI_TRANSLATIONS.es[clave] || '');
}
