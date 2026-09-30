function toggleVistaUsuario(loggedIn) {
    if (loggedIn) PanelUsuario.mostrar();
    else PanelUsuario.ocultar();
}

// Guarda qué quería hacer el usuario justo antes de que le pidiéramos iniciar sesión (ej:
// contactar a un vendedor, publicar algo), para retomarlo automáticamente después del login
// en vez de dejarlo "colgado" una vez que ya inició sesión. Se guarda en localStorage (no en
// una simple variable) porque el login con Google recarga la página por completo -- una
// variable normal se perdería justo antes de poder usarla.
function guardarAccionPendienteLogin(accion) {
    try { localStorage.setItem('remarket_accion_pendiente_login', JSON.stringify(accion)); } catch (e) {}
}
function ejecutarAccionPendienteLogin() {
    var accion = null;
    try {
        var raw = localStorage.getItem('remarket_accion_pendiente_login');
        if (raw) { accion = JSON.parse(raw); localStorage.removeItem('remarket_accion_pendiente_login'); }
    } catch (e) {}
    if (!accion) return;
    if (accion.tipo === 'contactar' && accion.usuarioId && typeof PanelUsuario !== 'undefined') {
        PanelUsuario.iniciarConversacionDirecta(accion.usuarioId);
    } else if (accion.tipo === 'publicar' && accion.tituloSugerido && typeof PanelUsuario !== 'undefined') {
        PanelUsuario.iniciarPublicacionDesdeAsistente(accion.tituloSugerido);
    }
}
// El modal de login se VACÍA de verdad cuando no se usa (no solo se oculta con CSS), y se
// vuelve a rellenar justo antes de mostrarlo. Así, mientras la persona está logueada o
// chateando, el campo de contraseña no existe en la página -- por eso el navegador ya no lo
// asocia con otros campos de texto (como el mensaje del chat) y deja de ofrecer autocompletar
// una contraseña ahí.
// Nombres de los países del registro en el idioma actual (la lista de códigos no cambia).
function construirOpcionesPaisAuth() {
    var banderas = { PE: '🇵🇪', MX: '🇲🇽', CO: '🇨🇴', AR: '🇦🇷', CL: '🇨🇱', EC: '🇪🇨', BO: '🇧🇴', VE: '🇻🇪', ES: '🇪🇸', US: '🇺🇸', BR: '🇧🇷', BG: '🇧🇬' };
    var html = '<option value="">' + tAuth('auth_pais_sel') + '</option>';
    Object.keys(banderas).forEach(function(c) { html += '<option value="' + c + '">' + banderas[c] + ' ' + nombrePaisAuth(c) + '</option>'; });
    html += '<option value="OT">🌍 ' + tAuth('auth_pais_otro') + '</option>';
    return html;
}

// Texto legal del registro. El orden de las palabras cambia según el idioma, por eso es UNA sola
// frase con marcadores [b]..[/b] (negrita) y [a]..[/a] (enlace), no varias partes pegadas.
function construirTerminosAuth() {
    return tAuth('auth_terminos')
        .replace('[b]', '<strong>').replace('[/b]', '</strong>')
        .replace('[a]', '<a href="#" onclick="alert(\'Términos y Condiciones: pendiente de implementación\'); return false;">').replace('[/a]', '</a>');
}

// El modal se arma con el idioma ACTUAL cada vez que se abre (antes era un texto fijo en español).
function construirAuthModalHTML() {
    return `
<div class="modal-content" style="max-width: 480px; padding: 30px;">
<button class="modal-close-btn" onclick="toggleAuthModal(false)">&times;</button>
<h2 style="text-align: center; margin-bottom: 5px; color: var(--purpura-ia);">${tAuth('auth_bienvenida')}</h2>
<p style="text-align: center; color: var(--texto-secundario); margin-bottom: 25px; font-size: 14px;">${tAuth('auth_subtitulo')}</p>
<div id="authAlert" class="alert"></div>

<div class="auth-tabs">
    <button id="tabLogin" class="auth-tab active" onclick="switchAuthTab('login')">${textoUI('login_tab', 'Iniciar Sesión')}</button>
    <button id="tabRegister" class="auth-tab" onclick="switchAuthTab('register')">${textoUI('register_tab', 'Registrarse')}</button>
</div>

<div id="loginForm" class="auth-form active">
<button class="btn-auth btn-google" onclick="loginWithSocial('google')">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M18.1713 8.36791H17.5001V8.33325H10.0001V11.6666H14.7096C14.0225 13.6072 12.1771 15 10.0001 15C7.23867 15 5.00012 12.7614 5.00012 10C5.00012 7.23858 7.23867 5 10.0001 5C11.2746 5 12.4346 5.47858 13.3171 6.26291L15.6829 3.89708C14.1854 2.49958 12.1926 1.66658 10.0001 1.66658C5.39762 1.66658 1.66675 5.39741 1.66675 9.99991C1.66675 14.6024 5.39762 18.3332 10.0001 18.3332C14.6026 18.3332 18.3334 14.6024 18.3334 9.99991C18.3334 9.44158 18.2784 8.89575 18.1713 8.36791Z" fill="#EA4335"/></svg>
${tAuth('auth_google')}
</button>
<div class="divider"><span>${tAuth('auth_o_correo')}</span></div>
<div class="form-group">
<label>${tAuth('auth_email')}</label>
<input type="email" id="loginEmail" placeholder="tu@email.com">
</div>
<div class="form-group">
<label>${tAuth('auth_password')}</label>
<input type="password" id="loginPassword" placeholder="••••••••">
</div>
<button class="btn-auth btn-auth-primary" onclick="loginWithEmail()">${tAuth('auth_btn_login')}</button>
<div class="magic-link-option">
<a onclick="showMagicLinkForm()">${tAuth('auth_olvide')}</a>
</div>
</div>

<div id="registerForm" class="auth-form">
<div class="form-group">
<label>${tAuth('auth_nombre')}</label>
<input type="text" id="registerName" placeholder="Juan Pérez" required>
</div>
<div class="form-group">
<label>${tAuth('auth_email_req')}</label>
<input type="email" id="registerEmail" placeholder="tu@email.com" required>
</div>
<div class="form-group">
<label>${tAuth('auth_password_min')}</label>
<input type="password" id="registerPassword" placeholder="••••••••" required minlength="8">
<div class="password-strength"><div class="password-strength-bar" id="passwordStrengthBar"></div></div>
<div class="password-hint" id="passwordHint">${tAuth('auth_pw_hint')}</div>
</div>
<div class="form-group">
<label>${tAuth('auth_dob')}</label>
<input type="date" id="registerDob" required>
<div class="age-error" id="ageError">${tAuth('auth_edad_error')}</div>
</div>
<div class="form-group">
<label>${tAuth('auth_pais')}</label>
<select id="registerCountry" required>
${construirOpcionesPaisAuth()}
</select>
</div>
<div class="form-group">
<label>${tAuth('auth_celular')}</label>
<div class="phone-wrapper">
<select id="phoneCode" class="country-select">
<option value="+51">🇵🇪 +51</option>
<option value="+52">🇲🇽 +52</option>
<option value="+57">🇨🇴 +57</option>
<option value="+54">🇦🇷 +54</option>
<option value="+56">🇨🇱 +56</option>
<option value="+593">🇪🇨 +593</option>
<option value="+591">🇧🇴 +591</option>
<option value="+58">🇻🇪 +58</option>
<option value="+34">🇪🇸 +34</option>
<option value="+1">🇺🇸 +1</option>
<option value="+55">🇧🇷 +55</option>
<option value="+359">🇧🇬 +359</option>
</select>
<input type="tel" id="registerPhone" placeholder="999 888 777">
</div>
</div>
<div class="checkbox-group">
<input type="checkbox" id="registerTerms" required>
<label for="registerTerms">
${construirTerminosAuth()}
</label>
</div>
<button class="btn-auth btn-auth-primary" onclick="registerUser()">${tAuth('auth_btn_registro')}</button>
<div class="magic-link-option">
<a onclick="showMagicLinkForm()">${tAuth('auth_magic_registro')}</a>
</div>
</div>

<div id="magicLinkForm" class="auth-form">
<div class="form-group">
<label>${tAuth('auth_email')}</label>
<input type="email" id="magicEmail" placeholder="tu@email.com">
</div>
<button class="btn-auth btn-auth-primary" onclick="sendMagicLink()">${tAuth('auth_magic_enviar')}</button>
<div class="magic-link-option">
<a onclick="switchAuthTab('login')">${tAuth('auth_volver_login')}</a>
</div>
</div>
</div>
`;
}

function toggleAuthModal(show) {
    var modal = document.getElementById('authModal');
    if (show) {
        // Se crea recién ahora, la primera vez que hace falta -- el campo de contraseña no
        // existe en la página hasta este momento, ni siquiera oculto, así el navegador no lo
        // detecta antes de que alguien realmente abra el login.
        if (!modal.innerHTML.trim()) { modal.innerHTML = construirAuthModalHTML(); }
        modal.style.display = 'flex';
        hideAuthAlert();
    } else {
        hideAuthAlert();
        modal.style.display = 'none';
        modal.innerHTML = '';
    }
}

// Si el modal está abierto cuando la persona cambia de idioma, se vuelve a armar en el idioma
// nuevo SIN perder lo que ya escribió ni la pestaña en la que estaba (mismo cuidado que
// Institucional.retraducirFormularioAbierto con los formularios del muro).
function retraducirAuthModalAbierto() {
    var modal = document.getElementById('authModal');
    if (!modal || !modal.innerHTML.trim()) return;
    var ids = ['loginEmail', 'loginPassword', 'registerName', 'registerEmail', 'registerPassword', 'registerDob', 'registerCountry', 'phoneCode', 'registerPhone', 'magicEmail'];
    var valores = {};
    ids.forEach(function(id) { var el = document.getElementById(id); if (el) valores[id] = el.value; });
    var terminos = document.getElementById('registerTerms');
    var aceptado = terminos ? terminos.checked : false;
    var activo = 'loginForm';
    ['loginForm', 'registerForm', 'magicLinkForm'].forEach(function(id) {
        var f = document.getElementById(id); if (f && f.classList.contains('active')) activo = id;
    });
    var barra = document.getElementById('passwordStrengthBar');
    var anchoBarra = barra ? barra.style.width : '';
    modal.innerHTML = construirAuthModalHTML();
    ids.forEach(function(id) { var el = document.getElementById(id); if (el && valores[id] !== undefined) el.value = valores[id]; });
    var t2 = document.getElementById('registerTerms'); if (t2) t2.checked = aceptado;
    var b2 = document.getElementById('passwordStrengthBar'); if (b2 && anchoBarra) b2.style.width = anchoBarra;
    // Volver a la pestaña en la que estaba (sin mostrar de nuevo el mensaje del asistente).
    document.querySelectorAll('.auth-form').forEach(function(f) { f.classList.remove('active'); });
    document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
    var form = document.getElementById(activo); if (form) form.classList.add('active');
    var tab = document.getElementById(activo === 'registerForm' ? 'tabRegister' : 'tabLogin');
    if (tab && activo !== 'magicLinkForm') tab.classList.add('active');
    else { var tl = document.getElementById('tabLogin'); if (tl) tl.classList.add('active'); }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    if (tab === 'login') { document.querySelectorAll('.auth-tab')[0].classList.add('active'); document.getElementById('loginForm').classList.add('active'); } 
    else if (tab === 'register') { document.querySelectorAll('.auth-tab')[1].classList.add('active'); document.getElementById('registerForm').classList.add('active'); showAssistantProactive(tAuth('auth_guia_registro')); }
    hideAuthAlert();
}

function showMagicLinkForm() { document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active')); document.getElementById('magicLinkForm').classList.add('active'); hideAuthAlert(); }

function showAuthAlert(message, type) { var alert = document.getElementById('authAlert'); alert.textContent = message; alert.className = 'alert alert-' + type + ' show'; setTimeout(() => { alert.classList.remove('show'); }, 5000); }

function hideAuthAlert() { var el = document.getElementById('authAlert'); if (el) el.classList.remove('show'); }

async function logAccess(accion, email, detalle) {
    try {
        var geoInfo = GeoService.obtenerInfoCompleta();
        await supabase.from('logs_acceso').insert({ usuario_id: usuarioActual ? usuarioActual.id : null, email: email, accion: accion, detalle: (detalle || '') + ' | IP: ' + geoInfo.ip + ' | ' + geoInfo.ciudad + ', ' + geoInfo.pais, ip_address: geoInfo.ip, ciudad: geoInfo.ciudad, pais: geoInfo.pais, region: geoInfo.region });
    } catch (e) { console.warn('No se pudo registrar el log:', e); }
}

async function loginWithEmail() {
    var email = document.getElementById('loginEmail').value.trim().toLowerCase();
    var password = document.getElementById('loginPassword').value;
    if (!email || !password) { showAuthAlert(tAuth('auth_err_login_vacio'), 'error'); return; }
    var btn = document.querySelector('#loginForm .btn-auth-primary');
    var textoOriginal = btn.textContent;
    btn.textContent = tAuth('auth_verificando');
    btn.disabled = true;
    try {
        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (error) throw error;
        loginAttempts = 0;
        await procesarSesionSupabaseAuth(data.user);
    } catch (e) {
        loginAttempts++;
        await logAccess('login_fallido', email, e.message || 'Credenciales inválidas');
        showAuthAlert(tAuth('auth_err_credenciales'), 'error');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

async function loginWithSocial(provider) {
    var { error } = await supabase.auth.signInWithOAuth({ provider: provider, options: { redirectTo: window.location.origin } });
    if (error) { await logAccess('login_' + provider + '_fallido', null, error.message); showAuthAlert(tAuth('auth_err_social', { p: provider }), 'error'); } else { await logAccess('login_' + provider + '_exitoso', null); }
}

async function registerUser() {
    var name = document.getElementById('registerName').value.trim();
    var email = document.getElementById('registerEmail').value.trim().toLowerCase();
    var password = document.getElementById('registerPassword').value;
    var dob = document.getElementById('registerDob').value;
    var country = document.getElementById('registerCountry').value;
    var phoneCode = document.getElementById('phoneCode').value;
    var phone = document.getElementById('registerPhone').value.trim();
    var terms = document.getElementById('registerTerms').checked;
    if (!name || !email || !password || !dob || !country) { showAuthAlert(tAuth('auth_err_obligatorios'), 'error'); return; }
    if (password.length < 8) { showAuthAlert(tAuth('auth_err_pw_corta'), 'error'); return; }
    if (!terms) { showAuthAlert(tAuth('auth_err_terminos'), 'error'); return; }
    var edad = calcularEdadDesdeFecha(dob);
    if (edad < 18) { showAuthAlert(tAuth('auth_err_edad'), 'error'); return; }
    var btn = document.querySelector('#registerForm .btn-auth-primary');
    var textoOriginal = btn.textContent;
    btn.textContent = tAuth('auth_creando');
    btn.disabled = true;
    try {
        // Nota de seguridad: ya no se consulta antes si el correo existe (evita enumeración
        // de correos registrados). Supabase Auth ya informa de forma segura si el correo
        // ya está en uso al intentar el signUp; ese caso se maneja en el catch de abajo.
        var { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: email, password: password });
        if (signUpError) throw signUpError;

        await GeoService.detectarUbicacion();
        var geoInfo = GeoService.obtenerInfoCompleta();
        var nombrePartes = separarNombreCompleto(name);
        var celular = phone ? (phoneCode + ' ' + phone) : null;
        var idioma = detectarIdiomaNavegador() || 'es';
        var { error: insertError } = await supabase.from('usuarios').insert({
            id: signUpData.user.id,
            nombres: nombrePartes.nombres,
            apellidos: nombrePartes.apellidos,
            correo_electronico: email,
            celular: celular,
            edad: edad,
            idioma_preferido: idioma,
            categoria: 'General',
            estado: 'activo',
            rol_id: 2,
            ip_registro: geoInfo.ip
        });
        if (insertError) throw insertError;
        await logAccess('registro_exitoso', email, 'IP: ' + geoInfo.ip + ' | ' + geoInfo.ciudad + ', ' + geoInfo.pais);

        if (signUpData.session) {
            showAuthAlert(tAuth('auth_ok_creada'), 'success');
            limpiarFormularioRegistro();
            await procesarSesionSupabaseAuth(signUpData.user);
        } else {
            showAuthAlert(tAuth('auth_ok_confirmar'), 'success');
            limpiarFormularioRegistro();
            setTimeout(function() {
                switchAuthTab('login');
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginPassword').focus();
            }, 2000);
        }
    } catch (e) {
        await logAccess('registro_fallido', email, e.message);
        showAuthAlert(tAuth('auth_err_registro', { m: e.message || tAuth('auth_err_reintenta') }), 'error');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

async function sendMagicLink() {
    var email = document.getElementById('magicEmail').value.trim(); if (!email) { showAuthAlert(tAuth('auth_err_sin_correo'), 'error'); return; }
    var { error } = await supabase.auth.signInWithOtp({ email });
    if (error) { await logAccess('link_magico_fallido', email, error.message); showAuthAlert(tAuth('auth_err_link', { m: error.message }), 'error'); } else { await logAccess('link_magico_enviado', email); showAuthAlert(tAuth('auth_ok_link'), 'success'); }
}

function updateUIForUser(usuario) {
    var btn = document.getElementById('accountBtn');
    var bellWrapper = document.getElementById('notifBellWrapper');
    var floatBtn = document.getElementById('floatingChatBtn');
    var btnPublicarHeader = document.getElementById('btnPublicarHeader');
    if (usuario) {
        guardarSesionUsuario(usuario);
        var inicial = ((usuario.nombres || 'U').charAt(0) + (usuario.apellidos || '').charAt(0)).toUpperCase() || 'U';
        var nombreMostrar = usuario.nombres || usuario.correo_electronico || 'Usuario';
        var fotoPerfil = usuario.foto_perfil || '';
        var avatarHtml = fotoPerfil ? `<img src="${PanelUsuario.escHtml(fotoPerfil)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #fff;">` : `<span class="user-avatar">${inicial}</span>`;
        btn.innerHTML = '<div class="user-info">' + avatarHtml + '<span class="user-email">' + PanelUsuario.escHtml(nombreMostrar) + '</span></div>';
        btn.onclick = function(e) { e.stopPropagation(); PanelUsuario.toggleMenuPerfil(); };
        if (bellWrapper) bellWrapper.classList.add('activo');
        if (floatBtn) floatBtn.classList.add('activo');
        if (btnPublicarHeader) btnPublicarHeader.classList.add('activo');
        PanelUsuario.actualizarBadgesMensajes();
        toggleVistaUsuario(true);
        iniciarLatidoConexion();
        iniciarCanalMensajesGlobal();
        pedirPermisoNotificaciones();
    } else {
        usuarioActual = null;
        window.usuarioActual = null;
        try { sessionStorage.removeItem('remarket_usuario'); } catch (e) {}
        PanelUsuario._bloqueadosCache = null;
        toggleVistaUsuario(false);
        btn.innerHTML = '';
        btn.textContent = 'Mi Cuenta';
        btn.onclick = function() { toggleAuthModal(true); };
        if (bellWrapper) bellWrapper.classList.remove('activo');
        if (floatBtn) floatBtn.classList.remove('activo');
        if (btnPublicarHeader) btnPublicarHeader.classList.remove('activo');
        PanelUsuario.cerrarMenuPerfil();
        detenerLatidoConexion();
        detenerCanalMensajesGlobal();
    }
}

var _latidoConexionInterval = null;
function iniciarLatidoConexion() {
    if (_latidoConexionInterval) return;
    var actualizar = async function() {
        if (!usuarioActual) return;
        try { await supabase.from('usuarios').update({ ultima_conexion: new Date().toISOString() }).eq('id', usuarioActual.id); } catch (e) { /* columna aún no creada en Supabase: se ignora */ }
    };
    actualizar();
    _latidoConexionInterval = setInterval(actualizar, 60000);
}
function detenerLatidoConexion() {
    if (_latidoConexionInterval) { clearInterval(_latidoConexionInterval); _latidoConexionInterval = null; }
}

// === CHAT EN TIEMPO REAL (Mejora 1 y 5) ===
// Escucha CADA mensaje nuevo insertado en la base de datos y filtra en el navegador
// si pertenece a una conversación del usuario actual (no se puede filtrar por RLS/columna
// directamente porque 'mensajes' no guarda el destinatario, solo la conversación).
var _canalMensajesGlobal = null;
function iniciarCanalMensajesGlobal() {
    if (_canalMensajesGlobal || !usuarioActual) return;
    _canalMensajesGlobal = supabase.channel('mensajes-global-' + usuarioActual.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, async function(payload) {
            var m = payload.new;
            if (m.emisor_id === usuarioActual.id) return; // mensaje propio, ya lo vemos al enviarlo
            var { data: conv } = await supabase.from('conversaciones').select('comprador_id, vendedor_id').eq('id', m.conversacion_id).maybeSingle();
            if (!conv || (conv.comprador_id !== usuarioActual.id && conv.vendedor_id !== usuarioActual.id)) return; // no es para mí

            if (typeof PanelUsuario !== 'undefined') PanelUsuario.actualizarBadgesMensajes();

            // Si tengo esa conversación abierta ahora mismo, la pinto sin recargar
            if (PanelUsuario._conversacionAbiertaId === m.conversacion_id) {
                PanelUsuario.agregarMensajeEnVivo(m, PanelUsuario._modoChatActivo);
                supabase.from('mensajes').update({ leido: true }).eq('id', m.id);
            } else if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                var autor = await PanelUsuario.obtenerAutor(m.emisor_id);
                var nombreAutor = autor ? ((autor.nombres || '') + ' ' + (autor.apellidos || '')).trim() : 'Nuevo mensaje';
                new Notification(nombreAutor, { body: m.texto_original, icon: autor && autor.foto_perfil || undefined });
            }
        })
        .subscribe();
}
function detenerCanalMensajesGlobal() {
    if (_canalMensajesGlobal) { supabase.removeChannel(_canalMensajesGlobal); _canalMensajesGlobal = null; }
}
function pedirPermisoNotificaciones() {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}

// === VENTANA FLOTANTE DE CHAT (estilo Facebook Messenger) ===
// El botón 💬 de la esquina ahora abre esta ventana encima de lo que estés viendo,
// en vez de mandarte a la sección "Mensajes" del panel.
function toggleChatFlotante() {
    if (!usuarioActual) { toggleAuthModal(true); return; }
    var win = document.getElementById('floatingChatWindow');
    if (!win) return;
    var abriendo = !win.classList.contains('activo');
    win.classList.toggle('activo');
    if (abriendo) PanelUsuario.cargarConversaciones(null, 'flotante');
    else cerrarChatFlotanteInterno();
}
function abrirChatFlotante() {
    if (!usuarioActual) { toggleAuthModal(true); return; }
    var win = document.getElementById('floatingChatWindow');
    if (win) win.classList.add('activo');
}
function cerrarChatFlotante() {
    var win = document.getElementById('floatingChatWindow');
    if (win) win.classList.remove('activo');
    cerrarChatFlotanteInterno();
}
function cerrarChatFlotanteInterno() {
    // Libera el canal en vivo de la conversación si estaba abierta en la ventana flotante
    if (PanelUsuario._modoChatActivo === 'flotante' && PanelUsuario._canalConversacionActivo) {
        supabase.removeChannel(PanelUsuario._canalConversacionActivo);
        PanelUsuario._canalConversacionActivo = null;
        PanelUsuario._conversacionAbiertaId = null;
    }
}
// "Abrir en pantalla completa": pasa la conversación actual a la sección "Mensajes" del panel
function expandirChatFlotante() {
    var convId = (PanelUsuario._modoChatActivo === 'flotante') ? PanelUsuario._conversacionAbiertaId : null;
    cerrarChatFlotante();
    PanelUsuario._convIdParaExpandir = convId;
    PanelUsuario.menuClick('mensajes');
}

async function logout() {
    if (confirm('¿Cerrar sesión?')) {
        await logAccess('logout', usuarioActual ? usuarioActual.correo_electronico : null);
        await supabase.auth.signOut();
        updateUIForUser(null);
        window.location.reload();
    }
}

// ============================================
