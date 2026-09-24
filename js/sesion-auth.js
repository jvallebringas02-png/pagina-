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
            showAuthAlert('✅ ¡Bienvenido! Completa tu perfil (edad, ciudad) en Configuración cuando puedas.', 'info');
        }

        guardarSesionUsuario(usuarioFinal);
        aplicarLocalidadGuardada(usuarioFinal);
        await logAccess('login_exitoso', authUser.email, 'Vía procesarSesionSupabaseAuth');
        updateUIForUser(usuarioFinal);
        toggleAuthModal(false);
        showAssistantProactive('¡Bienvenido ' + (usuarioFinal.nombres || (authUser.email ? authUser.email.split('@')[0] : 'Usuario')) + '! 🎉 Tu sesión está activa. ¿En qué puedo ayudarte hoy?');
        irAlFeed();
        ejecutarAccionPendienteLogin();
    } catch (e) {
        console.warn('No se pudo procesar la sesión de autenticación:', e);
    }
}
