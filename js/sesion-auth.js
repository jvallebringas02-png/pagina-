function toggleAI() {
    document.getElementById('aiBody').classList.toggle('hidden');
}

function iaResponde(tema) {
    const input = document.getElementById('assistantInput');
    // La pregunta se manda en el idioma elegido en la página, para que el Asistente responda en ese idioma
    // (quechua y aimara usan la pregunta en español).
    if(tema === 'publicar') input.value = textoUI('ask_publicar', "¿Cómo puedo publicar un artículo?");
    if(tema === 'vender') input.value = textoUI('ask_vender', "¿Cómo vendo algo de valor de forma segura?");
    if(tema === 'seguridad') input.value = textoUI('ask_seguridad', "¿Qué medidas de seguridad tienen?");
    if(tema === 'reportar') input.value = textoUI('ask_reportar', "Quiero reportar una publicación sospechosa");
    document.getElementById('assistantForm').dispatchEvent(new Event('submit'));
}

function showAssistantProactive(message) { 
    var chat = document.getElementById('assistantResponse'); 
    chat.innerHTML = '<div class="chat-message assistant">' + message + '</div>'; 
    document.getElementById('assistantInput').focus(); 
    document.getElementById('aiBody').classList.remove('hidden');
}

// ============================================
// SYSTEM PROMPTS
// ============================================
// 🔒 El PROMPT_BASE ya NO vive aquí -- se movió por completo al servidor (función
// chat-ia en Supabase), que es quien de verdad lo usa. Esta copia se eliminó porque
// el servidor descarta cualquier mensaje "system" que mande el cliente, así que
// tenerla aquí era código muerto que además causó confusión (dos copias desincronizadas
// fueron la causa raíz de un bug donde la IA nunca respondía en el formato correcto).
// Si necesitan ver o editar el prompt real, está en index.ts de la función chat-ia.


// ============================================
// AUTENTICACIÓN
// ============================================
function calcularEdadDesdeFecha(dob) {
    var fechaNac = new Date(dob);
    var hoy = new Date();
    var edad = hoy.getFullYear() - fechaNac.getFullYear();
    var mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
    return edad;
}

function separarNombreCompleto(nombreCompleto) {
    var partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 1) return { nombres: partes[0], apellidos: partes[0] };
    return { nombres: partes[0], apellidos: partes.slice(1).join(' ') };
}

function limpiarFormularioRegistro() {
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerDob').value = '';
    document.getElementById('registerCountry').value = '';
    document.getElementById('registerPhone').value = '';
    document.getElementById('registerTerms').checked = false;
    var bar = document.getElementById('passwordStrengthBar');
    if (bar) bar.style.width = '0%';
    var errorEl = document.getElementById('ageError');
    if (errorEl) errorEl.classList.remove('show');
}

function irAlFeed() {
    if (usuarioActual) {
        toggleVistaUsuario(true);
        var feed = document.getElementById('userFeedContainer');
        if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        var catalogo = document.getElementById('catalogContainer') || document.querySelector('.content-section');
        if (catalogo) catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function guardarSesionUsuario(usuario) {
    usuarioActual = usuario;
    window.usuarioActual = usuario;
    try { sessionStorage.setItem('remarket_usuario', JSON.stringify(usuario)); } catch (e) { console.warn('No se pudo guardar sesión:', e); }
}

// La ciudad que el usuario guardó a mano en Configuración debe tener prioridad sobre la que
// se detecta automáticamente por IP -- si no, cada vez que recarga la página, detectarPorIP()
// vuelve a pisar lo que había guardado, y parece que "no se guardó" aunque sí quedó en la BD.
function aplicarLocalidadGuardada(usuario) {
    if (usuario && usuario.ciudad && typeof UbicacionUsuario !== 'undefined') {
        UbicacionUsuario.ciudad = usuario.ciudad;
        if (usuario.pais) UbicacionUsuario.pais = usuario.pais;
        UbicacionUsuario.actualizarUI();
    }
}

function cargarSesionUsuario() {
    try {
        var guardado = sessionStorage.getItem('remarket_usuario');
        if (guardado) {
            var usuario = JSON.parse(guardado);
            guardarSesionUsuario(usuario);
            updateUIForUser(usuario);
            aplicarLocalidadGuardada(usuario);
            return usuario;
        }
    } catch (e) { console.warn('No se pudo restaurar sesión:', e); }
    return null;
}

async function procesarSesionSupabaseAuth(authUser) {
    if (!authUser) return;
    try {
        var { data: usuarioExistente, error: buscarError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
        if (buscarError) throw buscarError;

        var usuarioFinal = usuarioExistente;

        if (!usuarioFinal) {
            var meta = authUser.user_metadata || {};
            var nombreCompleto = meta.full_name || meta.name || (authUser.email ? authUser.email.split('@')[0] : 'Usuario');
            var nombrePartes = separarNombreCompleto(nombreCompleto);
            var idioma = detectarIdiomaNavegador() || 'es';
            var geoInfo = {};
            try { geoInfo = GeoService.obtenerInfoCompleta(); } catch (ge) {}

            var { data: usuarioCreado, error: crearError } = await supabase
                .from('usuarios')
                .insert({
                    id: authUser.id,
                    nombres: nombrePartes.nombres,
                    apellidos: nombrePartes.apellidos,
                    correo_electronico: authUser.email,
                    edad: 18,
                    idioma_preferido: idioma,
                    categoria: 'General',
                    estado: 'activo',
                    rol_id: 2,
                    ip_registro: geoInfo.ip || null
                })
                .select()
                .single();
            if (crearError) throw crearError;
            usuarioFinal = usuarioCreado;
            await logAccess('registro_social_exitoso', authUser.email, 'Cuenta creada automáticamente vía proveedor externo');
            showAuthAlert(tAuth('auth_ok_perfil'), 'info');
        }

        guardarSesionUsuario(usuarioFinal);
        aplicarLocalidadGuardada(usuarioFinal);
        await logAccess('login_exitoso', authUser.email, 'Vía procesarSesionSupabaseAuth');
        updateUIForUser(usuarioFinal);
        toggleAuthModal(false);
        showAssistantProactive('¡Bienvenido ' + (usuarioFinal.nombres || (authUser.email ? authUser.email.split('@')[0] : 'Usuario')) + '! 🎉 Tu sesión está activa. ¿En qué puedo ayudarte hoy?');
        irAlFeed();
        ejecutarAccionPendienteLogin();
        // Si entró con el enlace pedido desde "Olvidé mi contraseña", se abre Configuración para que cree la nueva.
        if (consumirSenalNuevaClave()) {
            setTimeout(function() {
                try { PanelUsuario.abrirModalConfiguracion('clave'); } catch (e2) { console.warn('No se pudo abrir Configuración:', e2); }
            }, 800);
        }
    } catch (e) {
        console.warn('No se pudo procesar la sesión de autenticación:', e);
    }
}

// ¿La persona entró con un enlace pedido desde "Olvidé mi contraseña"? Se sabe por dos señales:
// A) la dirección trae ?nueva-clave=1 (viaja dentro del enlace, sirve aunque lo abra en otro dispositivo);
// B) una marca guardada en este navegador al pedir el enlace (respaldo, vale 1 hora).
// Se consume una sola vez: la lee, la borra y limpia la dirección.
function consumirSenalNuevaClave() {
    var senal = false;
    try {
        var params = new URLSearchParams(window.location.search);
        if (params.get('nueva-clave') === '1') {
            senal = true;
            params.delete('nueva-clave');
            var resto = params.toString();
            history.replaceState(null, '', window.location.pathname + (resto ? '?' + resto : '') + window.location.hash);
        }
    } catch (e) {}
    try {
        var t = parseInt(localStorage.getItem('remarket_nueva_clave') || '0', 10);
        if (t) {
            localStorage.removeItem('remarket_nueva_clave');
            if (Date.now() - t < 60 * 60 * 1000) senal = true;
        }
    } catch (e) {}
    return senal;
}

// Si la persona abre un enlace vencido o ya usado, la dirección trae #error=...otp_expired.
// Antes solo volvía al muro sin explicación; ahora se le dice qué pasó y puede pedir otro enlace.
function avisarEnlaceVencido(haySesion) {
    var h = window.location.hash || '';
    if (h.indexOf('error_code=') === -1 && h.indexOf('error=access_denied') === -1) return;
    var vencido = h.indexOf('otp_expired') !== -1;
    try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
    if (haySesion || !vencido) return;
    toggleAuthModal(true);
    showMagicLinkForm('olvido');
    showAuthAlert(tAuth('auth_err_link_vencido'), 'error');
}
