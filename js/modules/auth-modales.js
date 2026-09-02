function toggleVistaUsuario(loggedIn) {
    if (loggedIn) PanelUsuario.mostrar();
    else PanelUsuario.ocultar();
}

function toggleAuthModal(show) { document.getElementById('authModal').style.display = show ? 'flex' : 'none'; hideAuthAlert(); }

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    if (tab === 'login') { document.querySelectorAll('.auth-tab')[0].classList.add('active'); document.getElementById('loginForm').classList.add('active'); } 
    else if (tab === 'register') { document.querySelectorAll('.auth-tab')[1].classList.add('active'); document.getElementById('registerForm').classList.add('active'); showAssistantProactive('📝 Para registrarte necesitas: Nombre, Correo, Contraseña, Fecha de Nacimiento (+18) y País. ¿Necesitas ayuda?'); }
    hideAuthAlert();
}

function showMagicLinkForm() { document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active')); document.getElementById('magicLinkForm').classList.add('active'); hideAuthAlert(); }

function showAuthAlert(message, type) { var alert = document.getElementById('authAlert'); alert.textContent = message; alert.className = 'alert alert-' + type + ' show'; setTimeout(() => { alert.classList.remove('show'); }, 5000); }

function hideAuthAlert() { document.getElementById('authAlert').classList.remove('show'); }

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
        var { count, error: countError } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .eq('correo_electronico', email);
        if (countError) throw countError;
        if (count > 0) {
            await logAccess('registro_fallido', email, 'Correo ya registrado');
            showAuthAlert('Este correo ya está registrado. ¿Quieres iniciar sesión?', 'info');
            setTimeout(function() {
                var opcion = confirm('El correo ' + email + ' ya tiene una cuenta.\n\n¿Deseas ir al inicio de sesión?');
                if (opcion) { switchAuthTab('login'); document.getElementById('loginEmail').value = email; document.getElementById('loginPassword').focus(); }
            }, 1500);
            return;
        }
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
        var avatarHtml = fotoPerfil ? `<img src="${fotoPerfil}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #fff;">` : `<span class="user-avatar">${inicial}</span>`;
        btn.innerHTML = '<div class="user-info">' + avatarHtml + '<span class="user-email">' + nombreMostrar + '</span></div>';
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
