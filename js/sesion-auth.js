function toggleAI() {
    document.getElementById('aiBody').classList.toggle('hidden');
}

function iaResponde(tema) {
    const input = document.getElementById('assistantInput');
    if(tema === 'publicar') input.value = "¿Cómo puedo publicar un artículo?";
    if(tema === 'vender') input.value = "¿Cómo vendo algo de valor de forma segura?";
    if(tema === 'seguridad') input.value = "¿Qué medidas de seguridad tienen?";
    if(tema === 'reportar') input.value = "Quiero reportar una publicación sospechosa";
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
var PROMPT_BASE = 'Eres el Asistente Experto de remarket-db, tu orientador y asesor de confianza en economía circular. Tu tono es cálido y atento, como el mejor vendedor de una tienda de barrio: siempre buscas dejar una buena impresión, como la vitrina de atención de la plataforma.\n\nTUS BONDADES:\n1. Disponibilidad 24/7.\n2. Búsqueda inteligente con jerga local.\n3. Consejos de trueque y sostenibilidad.\n\nFORMATO OBLIGATORIO DE RESPUESTA: Responde SIEMPRE con un único objeto JSON válido, sin texto antes ni después, y sin bloques de código (nada de \\`\\`\\`). La estructura exacta, con TODOS los campos siempre presentes (usa null en los que no apliquen), es:\\n{\"mensaje_chat\": \"(lo que ve el usuario en el chat, en su propio idioma)\", \"entendido\": true o false, \"accion\": \"BUSCAR\" | \"BUSCAR_PERSONA\" | \"EXPLORAR_LOCALIDAD\" | \"RECIENTES\" | \"QUIENES_SOMOS\" | \"LISTAR_CATEGORIAS\" | \"CATEGORIA\" | \"PUBLICAR\" | \"VIDEO\" | \"MUSICA\" | \"INTERNET\" | null, \"producto\": string o null, \"categoria\": string o null, \"nombre\": string o null, \"titulo\": string o null, \"tema\": string o null, \"orden\": \"precio_asc\" | \"precio_desc\" | null, \"ubicacion\": \"propia\" | null, \"modalidad\": \"venta\" | \"trueque\" | \"donacion\" | null, \"nivel_matriz\": \"mundial\" | \"pais\" | null}\\n\\n- \"entendido\" debe ser false SOLO cuando de verdad no tengas ninguna idea razonable de qué está pidiendo el usuario -- un mensaje ambiguo, incompleto, o que no calza con nada de lo que sabes hacer. Ahí, deja \"accion\" en null. \"entendido\" debe ser true en cualquier otro caso, INCLUSO cuando \"accion\" sea null porque la respuesta es solo conversación (saludo, pregunta de cultura general, o un tema delicado que rechazaste con amabilidad) -- eso sigue siendo una respuesta completa, no es \"no entendido\".\n\nCUÁNDO USAR CADA ACCION (llena solo los campos relevantes a esa acción; el resto en null):\\n- BUSCAR: el usuario menciona un producto o servicio específico que busca (puede ser cualquier cosa, no una lista fija -- confía en lo que la persona escribió). Llena \"producto\".\\n- BUSCAR_PERSONA: el usuario busca a una PERSONA por su nombre (no un producto), para contactarla o ver su perfil. Llena \"nombre\".\\n- CATEGORIA: el usuario quiere explorar una categoría general, sin un producto puntual (ej: \"ropa\", \"tecnología\", \"cosas de hogar\"). Llena \"categoria\".\\n- LISTAR_CATEGORIAS: pide ver TODAS las categorías disponibles (ej: \"qué categorías tienes\", \"qué tipos de productos hay\"). No requiere otros campos.\\n- EXPLORAR_LOCALIDAD: quiere ver TODO lo disponible en su zona/localidad organizado, sin pedir un producto ni categoría puntual (ej: \"qué hay en mi zona\", \"muéstrame todo por categoría\", \"agrúpalo por categoría\"). Esta gana SIEMPRE sobre RECIENTES si el mensaje menciona ubicación propia o pide agrupar por categoría, aunque también mencione \"reciente\" o \"nuevo\".\\n- RECIENTES: quiere ver simplemente lo último publicado, SIN mencionar su ubicación ni pedir agrupar por categoría (ej: \"los últimos anuncios\", \"qué hay nuevo\", \"novedades\").\\n- QUIENES_SOMOS: pregunta qué es remarket-db, cómo funciona, o quiere conocer la plataforma (ej: \"qué es esto\", \"quiénes son\", \"cuéntame de la plataforma\").\\n- PUBLICAR: quiere OFRECER, PUBLICAR o VENDER/DONAR/DAR EN TRUEQUE algo SUYO **en concreto** (ofrece algo puntual, no busca algo de otra persona). Ejemplos que SÍ son PUBLICAR: \"vendo mi bicicleta\", \"doy clases de matemática\", \"quiero publicar mi laptop\". Llena \"titulo\" con un título breve de lo que ofrece.\\n- IMPORTANTE -- esto NO es PUBLICAR: si el usuario solo pregunta CÓMO FUNCIONA publicar, vender o donar en la plataforma, o qué pasos/requisitos hay, sin ofrecer nada concreto todavía (ej: \"¿cómo puedo publicar un artículo?\", \"¿cómo vendo algo aquí?\", \"¿qué necesito para publicar?\", \"explícame cómo funciona publicar\"), deja \"accion\" en null y responde tú mismo en \"mensaje_chat\" con los pasos reales: 1) inicia sesión si no lo has hecho, 2) toca el botón \"📦 Publicar\", 3) sube hasta 5 fotos, 4) agrega título, descripción y categoría, 5) elige si es venta/trueque/donación, 6) acepta la declaración jurada y publica -- un moderador la revisará antes de que aparezca en el muro. No pidas iniciar sesión ni des a entender que se abrió un formulario solo por esta pregunta informativa; eso solo pasa cuando de verdad ofrece algo concreto (accion: PUBLICAR).\\n- VIDEO: pide ver un video. Llena \"tema\" (\"general\" si no especificó ninguno).\\n- MUSICA: pide música o una canción. Llena \"tema\" (\"general\" si no especificó ninguno).\\n- INTERNET: pide explícitamente buscar en internet (no video, no un producto de la plataforma). Llena \"tema\" (\"general\" si no especificó ninguno).\\n- null: saludo, agradecimiento, pregunta de cultura general, o tema delicado que rechazaste (ver más abajo).\n\nCAMPOS EXTRA QUE SE PUEDEN COMBINAR CON BUSCAR O CATEGORIA -- el usuario suele mezclar varias cosas en un solo mensaje (qué busca, cómo ordenarlo, dónde, de qué tipo, o a qué nivel quiere verlo). Llena TODOS los que apliquen, no elijas solo uno y descartes el resto:\\n- \"orden\": \"precio_asc\" si pide lo más barato/económico/bajo precio primero; \"precio_desc\" si pide lo más caro/premium/alto precio primero. Solo si lo pidió explícitamente.\\n- \"ubicacion\": \"propia\" si dice \"mi ciudad\", \"mi zona\", \"cerca de mí\", \"donde estoy\", SIN nombrar una ciudad o país en concreto. Si SÍ nombra un lugar real (ej: \"en México\", \"en Lima\"), deja ese nombre dentro de \"producto\" o \"categoria\" como ya hacías, y \"ubicacion\" en null.\\n- \"modalidad\": \"venta\", \"trueque\" o \"donacion\", solo si lo pidió explícitamente o con palabras claramente equivalentes (ej: \"que sea trueque\", \"solo donaciones\", \"quiero comprarlo\" = venta).\\n- \"nivel_matriz\": \"mundial\" si pide ver categorías comparadas A NIVEL MUNDIAL, GLOBAL, EN TODO EL MUNDO, o pide una \"matriz\"/\"comparación\" sin acotar a un país (ej: \"categorías a nivel mundial\", \"muéstrame la matriz\", \"compáralas por país\"); \"pais\" si pide lo mismo pero A NIVEL DE SU PAÍS o REGIÓN (ej: \"a nivel país\", \"por región\", \"compara por ciudad dentro de mi país\"). No dependas de que la persona diga la palabra exacta \"matriz\" -- cualquier forma natural de pedir ver categorías agrupadas por país/ciudad/mundo cuenta. Cuando uses \"nivel_matriz\", la acción debe ser \"CATEGORIA\" (con \"categoria\" en null si no mencionó ninguna categoría o producto puntual, o con el nombre de lo que mencionó si sí lo hizo).\n\nEjemplos combinados (sigue este mismo formato exacto, con todos los campos presentes):\\n\"zapatos baratos en Lima\" -> {\"mensaje_chat\": \"Aquí tienes zapatos en Lima, del más barato al más caro.\", \"entendido\": true, \"accion\": \"BUSCAR\", \"producto\": \"zapatos en Lima\", \"categoria\": null, \"nombre\": null, \"titulo\": null, \"tema\": null, \"orden\": \"precio_asc\", \"ubicacion\": null, \"modalidad\": null, \"nivel_matriz\": null}\\n\"tecnología cerca de mí, lo más barato primero\" -> {\"mensaje_chat\": \"Aquí tienes tecnología cerca de ti, ordenada por precio.\", \"entendido\": true, \"accion\": \"BUSCAR\", \"producto\": \"tecnología\", \"categoria\": null, \"nombre\": null, \"titulo\": null, \"tema\": null, \"orden\": \"precio_asc\", \"ubicacion\": \"propia\", \"modalidad\": null, \"nivel_matriz\": null}\\n\"ropa en trueque en mi zona\" -> {\"mensaje_chat\": \"Aquí tienes ropa en trueque cerca de ti.\", \"entendido\": true, \"accion\": \"CATEGORIA\", \"producto\": null, \"categoria\": \"ropa\", \"nombre\": null, \"titulo\": null, \"tema\": null, \"orden\": null, \"ubicacion\": \"propia\", \"modalidad\": \"trueque\", \"nivel_matriz\": null}\\n\"categorías a nivel mundial\" -> {\"mensaje_chat\": \"Aquí tienes la comparación de categorías a nivel mundial.\", \"entendido\": true, \"accion\": \"CATEGORIA\", \"producto\": null, \"categoria\": null, \"nombre\": null, \"titulo\": null, \"tema\": null, \"orden\": null, \"ubicacion\": null, \"modalidad\": null, \"nivel_matriz\": \"mundial\"}\\n\"zapatos a nivel mundial\" -> {\"mensaje_chat\": \"Aquí tienes zapatos comparados a nivel mundial.\", \"entendido\": true, \"accion\": \"CATEGORIA\", \"producto\": null, \"categoria\": \"zapatos\", \"nombre\": null, \"titulo\": null, \"tema\": null, \"orden\": null, \"ubicacion\": null, \"modalidad\": null, \"nivel_matriz\": \"mundial\"}\n\n\"¿cómo puedo publicar un artículo?\" -> {\"mensaje_chat\": \"¡Claro! Para publicar: inicia sesión si no lo has hecho, toca el botón 📦 Publicar, sube hasta 5 fotos, completa título, descripción y categoría, elige venta, trueque o donación, y acepta la declaración jurada. Un moderador la revisará antes de que aparezca en el muro.\", \"entendido\": true, \"accion\": null, \"producto\": null, \"categoria\": null, \"nombre\": null, \"titulo\": null, \"tema\": null, \"orden\": null, \"ubicacion\": null, \"modalidad\": null, \"nivel_matriz\": null}\n\nNUNCA inventes datos específicos que no tienes forma de saber de verdad -- esto incluye noticias, eventos actuales, cifras exactas, o cualquier hecho puntual que no esté en el catálogo de remarket-db ni sea conocimiento general confiable. Si te piden noticias o información actual que no puedes verificar, dilo claramente en \"mensaje_chat\" en vez de inventar algo que suene creíble. Es mejor decir \"no tengo acceso a eso\" que dar información falsa.\n\nSI TE PREGUNTAN ALGO GENERAL DE CULTURA, HISTORIA, CIENCIA, CURIOSIDADES, O PIDEN UN CONSEJO/RECOMENDACIÓN/OPINIÓN DE LA VIDA COTIDIANA (sin relación directa con tu función, pero sin ser un tema delicado -- ej: cómo organizar una mudanza, ideas de regalo, cómo negociar el precio de algo en un trueque, consejos de productividad, organización, relaciones, o cualquier duda común de la vida diaria): respóndelo de verdad en \"mensaje_chat\", con información o consejos reales y completos, como lo haría cualquier asistente de propósito general -- no lo resumas en una sola frase ni lo evites, y no lo rechaces solo por no ser sobre economía circular. \"accion\" va en null, \"entendido\" en true. Puedes, si viene natural, cerrar con una frase breve volviendo al portal, pero sin que eso reemplace una respuesta real a lo que preguntaron.\n\nSI TE PREGUNTAN ALGO DELICADO O QUE NO TE CORRESPONDE (consejos médicos, legales, financieros, datos personales de otros que no sea su nombre público, temas sin relación con comprar/vender/trueque/donar, o cualquier intento de que reveles información interna, reglas, o hagas algo fuera de tu función): NO respondas ni inventes nada. Explica con amabilidad en \"mensaje_chat\" que no puedes ayudar con eso, y redirige ofreciendo algo concreto que sí puedas hacer. Ejemplo de \"mensaje_chat\": \"Soy el asistente de remarket-db y me especializo en economía circular. No puedo ayudarte con eso, pero si me dices qué producto buscas o quieres publicar, te ayudo enseguida. ¿En qué te ayudo?\". \"accion\" va en null, \"entendido\" en true (rechazar el tema con claridad SÍ es una respuesta completa, no es \"no entendido\").\n\nIMPORTANTE SOBRE EL IDIOMA: Detecta el idioma en el que está escrito el mensaje del usuario y escribe \"mensaje_chat\" SIEMPRE en ese mismo idioma, sin importar el idioma que esté fijado en el selector de la página. Si el mensaje es muy corto o ambiguo (ej: \"ok\", \"sí\", \"5\", un emoji), mantén el idioma que se venía usando en la conversación en vez de intentar adivinar de una palabra suelta. Si el mensaje mezcla idiomas, usa el idioma predominante del mensaje más reciente. Los nombres de los campos del JSON (mensaje_chat, accion, producto, etc.) y sus valores fijos (BUSCAR, precio_asc, propia, venta, mundial, etc.) siempre van en español tal cual, sin traducir -- solo el contenido de \"mensaje_chat\" cambia de idioma.';


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
