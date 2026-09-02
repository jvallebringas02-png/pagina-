document.addEventListener("DOMContentLoaded", async function() {
    var idioma = obtenerIdiomaPreferido();
    var nombresIdiomas = { 'es': 'Español', 'en': 'English', 'pt': 'Português', 'fr': 'Français', 'de': 'Deutsch', 'it': 'Italiano', 'bg': 'Български', 'qu': 'Quechua', 'ay': 'Aymara', 'zh': '中文', 'ja': '日本語', 'ko': '한국어', 'ar': 'العربية', 'hi': 'हिन्दी', 'nl': 'Nederlands', 'tr': 'Türkçe' };
    var textoIdioma = document.getElementById('selectedLanguage');
    if (textoIdioma) { textoIdioma.textContent = nombresIdiomas[idioma] || idioma.toUpperCase(); }
    
    var saludos = { 'es': '¡Hola! Soy tu asistente de economía circular global. ¿Qué necesitas hoy?', 'en': 'Hello! I am your global circular economy assistant. What do you need today?', 'pt': 'Olá! Sou seu assistente de economia circular global.', 'fr': 'Bonjour! Je suis votre assistant mondial d\'économie circulaire.', 'bg': 'Здравейте! Аз съм вашият асистент за кръгова икономика.', 'qu': 'Allin p\'unchaw! Qamta yanapayta munani.', 'ay': 'Aspakiruski! Qamta yanapt\'añataki.' };
    var saludoInicial = saludos[idioma] || saludos['es'];
    var chat = document.getElementById('assistantResponse');
    if (chat) { chat.innerHTML = '<div class="chat-message assistant">' + saludoInicial + '</div>'; }
    
    aplicarTraduccionUI(idioma);
    
    UIController.init();
    await UbicacionUsuario.detectarPorIP();
    
    var productosSupabase = await cargarProductosSupabase();
    var productosAPI = await cargarProductosAPI();
    var productosTotales = Database.articulos.concat(productosSupabase).concat(productosAPI);
    
    BuscadorMotor.construirIndice(productosTotales);
    UIController.renderizarArticulos(productosTotales);
    
    document.getElementById('assistantForm').addEventListener('submit', EventController.manejarEnvioMensaje);
    document.getElementById('searchForm').addEventListener('submit', EventController.manejarBusquedaPrincipal);
    document.getElementById('clearChatBtn').addEventListener('click', EventController.manejarLimpiarChat);
    document.getElementById('closeSearchBtn').addEventListener('click', function() { UIController.cerrarResultados(); });
    document.getElementById('modalCloseBtn').addEventListener('click', function() { UIController.cerrarModal(); });
    document.getElementById('qrModalCloseBtn').addEventListener('click', function() { UIController.cerrarQRModal(); });
    window.onclick = function(e) { if (e.target === UIController.elementos.modal) UIController.cerrarModal(); if (e.target === document.getElementById('qrModal')) UIController.cerrarQRModal();
        var dropdown = document.getElementById('userMenuDropdown');
        var wrapper = document.getElementById('userMenuDropdownWrapper');
        if (dropdown && dropdown.classList.contains('abierto') && wrapper && !wrapper.contains(e.target)) { PanelUsuario.cerrarMenuPerfil(); }
        if (!e.target.closest('.autor-menu-wrapper')) { document.querySelectorAll('.autor-menu-dropdown.abierto').forEach(function(d) { d.classList.remove('abierto'); }); }
    };
    
    var sesionLocalRestaurada = cargarSesionUsuario();
    try {
        var { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
            await procesarSesionSupabaseAuth(session.user);
        } else if (!sesionLocalRestaurada) {
            document.getElementById('accountBtn').onclick = function() { toggleAuthModal(true); };
        }
    } catch (e) {
        console.warn('No se pudo verificar la sesión de Supabase Auth:', e);
        if (!sesionLocalRestaurada) {
            document.getElementById('accountBtn').onclick = function() { toggleAuthModal(true); };
        }
    }

    supabase.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' && session && session.user) {
            procesarSesionSupabaseAuth(session.user);
        }
    });

    
    // Agregar modal de nuevo mensaje (solo el HTML falta en el DOM)
    if (!document.getElementById('modalNuevoMensaje')) {
        var modalNuevoMsj = document.createElement('div');
        modalNuevoMsj.id = 'modalNuevoMensaje';
        modalNuevoMsj.className = 'modal-overlay';
        modalNuevoMsj.innerHTML = `
            <div class="modal-content" style="max-width:420px;padding:28px;">
                <button class="modal-close-btn" onclick="PanelUsuario.cerrarModalNuevoMensaje()">&times;</button>
                <h3 style="text-align:center;margin-bottom:16px;color:var(--purpura-ia);">✉️ Nuevo mensaje</h3>
                <div id="nuevoMsjAlert" class="alert"></div>
                <label class="form-label">Buscar persona por nombre, iniciales o zona</label>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
                    <button type="button" id="filtroZona-local-nuevoMsj" data-nivel="local" data-contexto="nuevoMsj" class="compartir-filtro-zona" onclick="PanelUsuario.setFiltroZonaPersona('nuevoMsj','local')">📍 Local</button>
                    <button type="button" id="filtroZona-regional-nuevoMsj" data-nivel="regional" data-contexto="nuevoMsj" class="compartir-filtro-zona" onclick="PanelUsuario.setFiltroZonaPersona('nuevoMsj','regional')">🗺️ Regional</button>
                    <button type="button" id="filtroZona-pais-nuevoMsj" data-nivel="pais" data-contexto="nuevoMsj" class="compartir-filtro-zona" onclick="PanelUsuario.setFiltroZonaPersona('nuevoMsj','pais')">🌎 País</button>
                </div>
                <input type="text" id="nuevoMsjBuscarPersona" class="form-input" placeholder="Escribe un nombre o iniciales (ej: J P)..." oninput="PanelUsuario.onBuscarPersonaInput(this.value, 'nuevoMsj')" autocomplete="off">
                <div id="nuevoMsjResultadosPersona" class="user-picker-results"></div>
            </div>
        `;
        document.body.appendChild(modalNuevoMsj);
    }
});
