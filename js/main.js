document.addEventListener("DOMContentLoaded", async function() {
    // Se resuelve cuando el muro del panel termina de cargar (lo llama PanelUsuario.cargarFeed). Sirve para dejar
    // las cargas pesadas (productos, IP) para DESPUÉS del muro cuando la persona ya tiene sesión.
    window._feedListo = new Promise(function(resolver) { window._resolverFeedListo = resolver; });
    var idioma = obtenerIdiomaPreferido();
    // Antes de acá, este archivo tenía sus propias copias cortas de estos 2 diccionarios (con
    // 16/17 y 7/17 idiomas nada más). Ahora usa las mismas variables globales que ya define
    // i18n.js -- las que se cargan antes que este archivo -- para no tener 2 fuentes de verdad
    // que se puedan desincronizar. Ver BITACORA-SESION-COLISION-SESIONES.md.
    var textoIdioma = document.getElementById('selectedLanguage');
    if (textoIdioma) { textoIdioma.textContent = NOMBRES_IDIOMA_DISPLAY[idioma] || idioma.toUpperCase(); }

    var saludoInicial = SALUDOS_IA[idioma] || SALUDOS_IA['es'];
    var chat = document.getElementById('assistantResponse');
    if (chat) {
        // Los accesos rápidos (zona, últimos, categorías, mundial, buscar, etc.) ya no van
        // como botones dentro del chat -- viven de forma permanente en la barra lateral
        // (#sidebarQuick), así que el saludo queda solo con el mensaje.
        chat.innerHTML = '<div class="chat-message assistant">' + saludoInicial + '</div>';
    }
    
    aplicarTraduccionUI(idioma);
    
    UIController.init();

    // Antes esta pregunta ("¿hay sesión?") se hacía dos veces por separado -- una vez aquí y otra
    // más abajo -- y si Supabase tardaba un instante en confirmar la sesión guardada, esta primera
    // consulta decía "no hay sesión" (mostrando el muro) mientras que la segunda, ya un poco después,
    // sí la encontraba (mostrando el panel) -- eso causaba el parpadeo del muro al iniciar sesión.
    // Ahora se consulta una sola vez y el mismo resultado se reutiliza más abajo.
    var haySesionLocal = !!cargarSesionUsuario();
    var sesionSupabaseInicial = null;
    try {
        var { data: { session: sesionInicial } } = await supabase.auth.getSession();
        sesionSupabaseInicial = sesionInicial || null;
    } catch (e) { /* si falla, asumimos que no hay sesión */ }
    var haySesionSupabase = !!(sesionSupabaseInicial && sesionSupabaseInicial.user);

    // Carga lenta (ubicación por IP, productos de Supabase y de la API externa). Solo sirve para el buscador y el
    // asistente. No bloquea la sesión, y se inicia UNA sola vez (iniciarCargaPesada es idempotente).
    var _cargaPesadaPromesa = null;
    function iniciarCargaPesada() {
        if (_cargaPesadaPromesa) return _cargaPesadaPromesa;
        _cargaPesadaPromesa = (async function() {
            await UbicacionUsuario.detectarPorIP();
            // la ciudad guardada por la persona tiene prioridad sobre la detectada por IP
            if (window.usuarioActual) {
                aplicarLocalidadGuardada(window.usuarioActual);
                // la tarjeta "Tu Alcance" se pintó antes de que llegara la ciudad por IP: se refresca
                try { if (typeof PanelUsuario !== 'undefined' && PanelUsuario.cargarLocalidad) PanelUsuario.cargarLocalidad(); } catch (e) {}
            }
            var productosSupabase = await cargarProductosSupabase();
            var productosAPI = await cargarProductosAPI();
            BuscadorMotor.construirIndice(Database.articulos.concat(productosSupabase).concat(productosAPI));
        })();
        return _cargaPesadaPromesa;
    }
    window._asegurarCargaPesada = iniciarCargaPesada;
    // Para buscador/asistente: esperan la carga pero como máximo `ms` (por si la red está muy lenta).
    window._esperarCargaPesada = function(ms) {
        return Promise.race([iniciarCargaPesada(), new Promise(function(r) { setTimeout(r, ms || 5000); })]);
    };
    var cargaPesada = null;
    if (haySesionLocal || haySesionSupabase) {
        // Con sesión: primero el muro; la carga pesada empieza cuando el muro ya se pintó (o a los 8 s como máximo).
        Promise.race([window._feedListo, new Promise(function(r) { setTimeout(r, 8000); })]).then(function() { iniciarCargaPesada(); });
    } else {
        cargaPesada = iniciarCargaPesada();
    }
    if (!(haySesionLocal || haySesionSupabase)) {
        // no hay sesión: se quita la pantalla de "cargando cuenta" (por si el token guardado ya había vencido)
        document.documentElement.classList.remove('con-sesion');
    }

    if (haySesionLocal || haySesionSupabase) {
        // Ya sabemos que hay sesión: NO se pinta el catálogo de invitado aquí, porque se alcanzaría
        // a ver un instante (con productos de prueba incluidos) antes de que el panel de usuario lo
        // reemplace unas líneas más abajo (irAlFeed -> toggleVistaUsuario(true)) -- eso era el
        // "parpadeo" de productos de prueba que se veía justo al iniciar sesión.
        var catalogoEl = document.getElementById('catalogContainer');
        if (catalogoEl) catalogoEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--texto-secundario);">Cargando tu cuenta...</div>';
    } else {
        await ContenidoInfo.mostrarEnMuro(idioma);
    }
    Institucional.cargarPatrocinadores();
    Institucional.cargarPublicidad();
    
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
        if (sesionSupabaseInicial && sesionSupabaseInicial.user) {
            await procesarSesionSupabaseAuth(sesionSupabaseInicial.user);
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

    // Enlace vencido o ya usado: explicarlo en vez de dejar la página principal sin aviso.
    try { avisarEnlaceVencido(!!(sesionSupabaseInicial && sesionSupabaseInicial.user) || !!sesionLocalRestaurada); } catch (e) {}

    
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
