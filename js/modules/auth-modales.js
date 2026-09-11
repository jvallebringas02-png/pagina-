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
var AUTH_MODAL_HTML = `
<div class="modal-content" style="max-width: 480px; padding: 30px;">
<button class="modal-close-btn" onclick="toggleAuthModal(false)">&times;</button>
<h2 style="text-align: center; margin-bottom: 5px; color: var(--purpura-ia);">Bienvenido a remarket-db</h2>
<p style="text-align: center; color: var(--texto-secundario); margin-bottom: 25px; font-size: 14px;">Tu portal de economía circular inteligente</p>
<div id="authAlert" class="alert"></div>

<div class="auth-tabs">
    <button id="tabLogin" class="auth-tab active" onclick="switchAuthTab('login')">Iniciar Sesión</button>
    <button id="tabRegister" class="auth-tab" onclick="switchAuthTab('register')">Registrarse</button>
</div>

<div id="loginForm" class="auth-form active">
<button class="btn-auth btn-google" onclick="loginWithSocial('google')">
<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M18.1713 8.36791H17.5001V8.33325H10.0001V11.6666H14.7096C14.0225 13.6072 12.1771 15 10.0001 15C7.23867 15 5.00012 12.7614 5.00012 10C5.00012 7.23858 7.23867 5 10.0001 5C11.2746 5 12.4346 5.47858 13.3171 6.26291L15.6829 3.89708C14.1854 2.49958 12.1926 1.66658 10.0001 1.66658C5.39762 1.66658 1.66675 5.39741 1.66675 9.99991C1.66675 14.6024 5.39762 18.3332 10.0001 18.3332C14.6026 18.3332 18.3334 14.6024 18.3334 9.99991C18.3334 9.44158 18.2784 8.89575 18.1713 8.36791Z" fill="#EA4335"/></svg>
Continuar con Google
</button>
<div class="divider"><span>o usa tu correo</span></div>
<div class="form-group">
<label>Correo Electrónico</label>
<input type="email" id="loginEmail" placeholder="tu@email.com">
</div>
<div class="form-group">
<label>Contraseña</label>
<input type="password" id="loginPassword" placeholder="••••••••">
</div>
<button class="btn-auth btn-auth-primary" onclick="loginWithEmail()">Iniciar Sesión</button>
<div class="magic-link-option">
<a onclick="showMagicLinkForm()">¿Olvidaste tu contraseña? Entra sin ella</a>
</div>
</div>

<div id="registerForm" class="auth-form">
<div class="form-group">
<label>Nombre Completo *</label>
<input type="text" id="registerName" placeholder="Juan Pérez" required>
</div>
<div class="form-group">
<label>Correo Electrónico *</label>
<input type="email" id="registerEmail" placeholder="tu@email.com" required>
</div>
<div class="form-group">
<label>Contraseña (mínimo 8 caracteres) *</label>
<input type="password" id="registerPassword" placeholder="••••••••" required minlength="8">
<div class="password-strength"><div class="password-strength-bar" id="passwordStrengthBar"></div></div>
<div class="password-hint" id="passwordHint">Usa mayúsculas, números y símbolos para mayor seguridad</div>
</div>
<div class="form-group">
<label>Fecha de Nacimiento *</label>
<input type="date" id="registerDob" required>
<div class="age-error" id="ageError">⚠️ Debes ser mayor de 18 años para registrarte.</div>
</div>
<div class="form-group">
<label>País *</label>
<select id="registerCountry" required>
<option value="">Selecciona tu país</option>
<option value="PE">🇵🇪 Perú</option>
<option value="MX">🇲🇽 México</option>
<option value="CO">🇨🇴 Colombia</option>
<option value="AR">🇦🇷 Argentina</option>
<option value="CL">🇨🇱 Chile</option>
<option value="EC">🇪🇨 Ecuador</option>
<option value="BO">🇧🇴 Bolivia</option>
<option value="VE">🇻🇪 Venezuela</option>
<option value="ES">🇪🇸 España</option>
<option value="US">🇺🇸 Estados Unidos</option>
<option value="BR">🇧🇷 Brasil</option>
<option value="BG">🇧🇬 Bulgaria</option>
<option value="OT">🌍 Otro país</option>
</select>
</div>
<div class="form-group">
<label>Celular (opcional)</label>
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
Declaro ser <strong>mayor de 18 años</strong> y acepto la <a href="#" onclick="alert('Términos y Condiciones: pendiente de implementación'); return false;">Declaración Jurada y Términos de Uso</a>. Autorizo el tratamiento de mis datos conforme a la Ley de Protección de Datos Personales.
</label>
</div>
<button class="btn-auth btn-auth-primary" onclick="registerUser()">Crear Cuenta</button>
<div class="magic-link-option">
<a onclick="showMagicLinkForm()">📧 Registrarme con Link Mágico (sin contraseña)</a>
</div>
</div>

<div id="magicLinkForm" class="auth-form">
<div class="form-group">
<label>Correo Electrónico</label>
<input type="email" id="magicEmail" placeholder="tu@email.com">
</div>
<button class="btn-auth btn-auth-primary" onclick="sendMagicLink()">Enviar Link Mágico</button>
<div class="magic-link-option">
<a onclick="switchAuthTab('login')">← Volver al inicio de sesión</a>
</div>
</div>
</div>
`;
function toggleAuthModal(show) {
    var modal = document.getElementById('authModal');
    if (show) {
        // Se crea recién ahora, la primera vez que hace falta -- el campo de contraseña no
        // existe en la página hasta este momento, ni siquiera oculto, así el navegador no lo
        // detecta antes de que alguien realmente abra el login.
        if (!modal.innerHTML.trim()) { modal.innerHTML = AUTH_MODAL_HTML; }
        modal.style.display = 'flex';
        hideAuthAlert();
    } else {
        hideAuthAlert();
        modal.style.display = 'none';
        modal.innerHTML = '';
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    if (tab === 'login') { document.querySelectorAll('.auth-tab')[0].classList.add('active'); document.getElementById('loginForm').classList.add('active'); } 
    else if (tab === 'register') { document.querySelectorAll('.auth-tab')[1].classList.add('active'); document.getElementById('registerForm').classList.add('active'); showAssistantProactive('📝 Para registrarte necesitas: Nombre, Correo, Contraseña, Fecha de Nacimiento (+18) y País. ¿Necesitas ayuda?'); }
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
    if (!email || !password) { showAuthAlert('Ingresa tu correo y contraseña', 'error'); return; }
    var btn = document.querySelector('#loginForm .btn-auth-primary');
    var textoOriginal = btn.textContent;
    btn.textContent = '⏳ Verificando...';
    btn.disabled = true;
    try {
        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (error) throw error;
        loginAttempts = 0;
        await procesarSesionSupabaseAuth(data.user);
    } catch (e) {
        loginAttempts++;
        await logAccess('login_fallido', email, e.message || 'Credenciales inválidas');
        showAuthAlert('Correo o contraseña incorrectos', 'error');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

async function loginWithSocial(provider) {
    var { error } = await supabase.auth.signInWithOAuth({ provider: provider, options: { redirectTo: window.location.origin } });
    if (error) { await logAccess('login_' + provider + '_fallido', null, error.message); showAuthAlert('Error al iniciar con ' + provider, 'error'); } else { await logAccess('login_' + provider + '_exitoso', null); }
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
    if (!name || !email || !password || !dob || !country) { showAuthAlert('Completa todos los campos obligatorios (*)', 'error'); return; }
    if (password.length < 8) { showAuthAlert('La contraseña debe tener al menos 8 caracteres', 'error'); return; }
    if (!terms) { showAuthAlert('Debes aceptar la Declaración Jurada y Términos de Uso', 'error'); return; }
    var edad = calcularEdadDesdeFecha(dob);
    if (edad < 18) { showAuthAlert('Debes ser mayor de 18 años para registrarte', 'error'); return; }
    var btn = document.querySelector('#registerForm .btn-auth-primary');
    var textoOriginal = btn.textContent;
    btn.textContent = '⏳ Creando cuenta...';
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
            showAuthAlert('✅ Cuenta creada. ¡Bienvenido!', 'success');
            limpiarFormularioRegistro();
            await procesarSesionSupabaseAuth(signUpData.user);
        } else {
            showAuthAlert('✅ Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión', 'success');
            limpiarFormularioRegistro();
            setTimeout(function() {
                switchAuthTab('login');
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginPassword').focus();
            }, 2000);
        }
    } catch (e) {
        await logAccess('registro_fallido', email, e.message);
        showAuthAlert('Error al registrar: ' + (e.message || 'Intenta de nuevo'), 'error');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

async function sendMagicLink() {
    var email = document.getElementById('magicEmail').value.trim(); if (!email) { showAuthAlert('Ingresa tu correo', 'error'); return; }
    var { error } = await supabase.auth.signInWithOtp({ email });
    if (error) { await logAccess('link_magico_fallido', email, error.message); showAuthAlert('Error al enviar el link: ' + error.message, 'error'); } else { await logAccess('link_magico_enviado', email); showAuthAlert('✅ Link mágico enviado. Revisa tu correo (y la carpeta de Spam).', 'success'); }
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
