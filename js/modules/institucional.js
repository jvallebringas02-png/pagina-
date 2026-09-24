// ============================================
// INSTITUCIONAL: Patrocinadores, Publicidad, Quiénes Somos,
// Comunícate con el Admin, Libro de Reclamaciones
// ============================================
var Institucional = {

    // Devuelve el texto en el idioma actual del sitio; si falta esa clave o ese idioma, cae a español.
    t: function(clave) {
        var idioma = obtenerIdiomaPreferido();
        var dict = INSTITUCIONAL_TEXTOS[idioma] || INSTITUCIONAL_TEXTOS.es;
        return dict[clave] || INSTITUCIONAL_TEXTOS.es[clave] || clave;
    },

    // ---------- Motor común de niveles + peso + vigencia, usado por Patrocinadores y Publicidad ----------
    // Nivel más específico gana: ciudad -> país -> mundial (sin ubicación). Dentro del nivel
    // ganador, cada anuncio compite por un sorteo pesado según su "peso" (peso 1 = gratis/por
    // defecto; se sube a mano desde el Panel de Administrador cuando alguien paga por más
    // visibilidad). Nunca un anuncio de un nivel más amplio gana sobre uno más específico.
    filtrarVigentesYNivelGanador: function(lista) {
        var hoy = new Date();
        var vigentes = lista.filter(function(a) {
            var desdeOk = !a.vigente_desde || new Date(a.vigente_desde) <= hoy;
            var hastaOk = !a.vigente_hasta || new Date(a.vigente_hasta) >= hoy;
            return desdeOk && hastaOk;
        });
        var ciudad = (typeof UbicacionUsuario !== 'undefined') ? UbicacionUsuario.ciudad : null;
        var pais = (typeof UbicacionUsuario !== 'undefined') ? UbicacionUsuario.pais : null;
        var porCiudad = vigentes.filter(function(a) { return a.ciudad && a.ciudad === ciudad; });
        if (porCiudad.length) return porCiudad;
        var porPais = vigentes.filter(function(a) { return !a.ciudad && a.pais && a.pais === pais; });
        if (porPais.length) return porPais;
        return vigentes.filter(function(a) { return !a.ciudad && !a.pais; });
    },
    // Sorteo pesado: cada anuncio aporta "boletos" a la bolsa según su peso (por defecto 1).
    sorteoPesado: function(lista) {
        var total = lista.reduce(function(s, a) { return s + (a.peso || 1); }, 0);
        var r = Math.random() * total;
        for (var i = 0; i < lista.length; i++) {
            r -= (lista[i].peso || 1);
            if (r <= 0) return lista[i];
        }
        return lista[lista.length - 1];
    },
    // Sorteo pesado sin repetir, para elegir varios (ej. la lista de Patrocinadores).
    elegirVariosSinRepetir: function(lista, cuantos) {
        var restante = lista.slice(), elegidos = [];
        while (restante.length && elegidos.length < cuantos) {
            var ganador = this.sorteoPesado(restante);
            elegidos.push(ganador);
            restante = restante.filter(function(a) { return a !== ganador; });
        }
        return elegidos;
    },

    // ---------- Patrocinadores (dinámico, desde la base de datos) ----------
    RESPALDO_PATROCINADORES: [
        { titulo: 'Municipalidad de Trujillo', enlace: 'https://www.munitrujillo.gob.pe' },
        { titulo: 'Cámara de Comercio', enlace: 'https://www.camaratru.org.pe' }
    ],

    cargarPatrocinadores: async function() {
        var contenedor = document.getElementById('patrocinadoresLista');
        if (!contenedor) return;
        var lista = this.RESPALDO_PATROCINADORES;
        try {
            var resultado = await supabase
                .from('contenido_administrable')
                .select('titulo, imagen_url, enlace, pais, ciudad, peso, vigente_desde, vigente_hasta')
                .eq('tipo_contenido', 'patrocinador')
                .eq('activo', true);
            if (!resultado.error && resultado.data && resultado.data.length > 0) {
                var ganadores = this.filtrarVigentesYNivelGanador(resultado.data);
                if (ganadores.length) lista = this.elegirVariosSinRepetir(ganadores, 4);
            }
        } catch (e) { /* se queda con el respaldo fijo */ }

        contenedor.innerHTML = lista.map(function(p) {
            return '<div class="sponsor-card"><div class="sponsor-name">' + escHtml(p.titulo) + '</div>' +
                '<button class="btn-sponsor" onclick="window.open(\'' + escHtml(p.enlace || '#') + '\', \'_blank\')">' + Institucional.t('btn_visitar') + '</button></div>';
        }).join('');
    },

    // ---------- Publicidad (dinámico, con rotación por tiempo mientras la persona sigue en la página) ----------
    _publicidadCandidatos: null,
    _publicidadInterval: null,

    cargarPublicidad: async function() {
        var contenedor = document.getElementById('publicidadSlot');
        if (!contenedor) return;
        try {
            var resultado = await supabase
                .from('contenido_administrable')
                .select('titulo, contenido, imagen_url, enlace, pais, ciudad, peso, vigente_desde, vigente_hasta')
                .eq('tipo_contenido', 'publicidad')
                .eq('activo', true);
            if (resultado.error || !resultado.data || resultado.data.length === 0) { contenedor.innerHTML = ''; return; }
            var ganadores = this.filtrarVigentesYNivelGanador(resultado.data);
            if (!ganadores.length) { contenedor.innerHTML = ''; return; }
            this._publicidadCandidatos = ganadores;
            this.pintarUnAnuncio();
            // Si hay más de uno compitiendo en el mismo nivel, rota cada 20s -- así, con el
            // tiempo, los que tienen el mismo peso se reparten las apariciones de forma pareja,
            // en vez de quedarse pegados en el que salió la primera vez.
            if (this._publicidadInterval) clearInterval(this._publicidadInterval);
            if (ganadores.length > 1) {
                this._publicidadInterval = setInterval(function() { Institucional.pintarUnAnuncio(); }, 20000);
            }
        } catch (e) { contenedor.innerHTML = ''; }
    },
    pintarUnAnuncio: function() {
        var contenedor = document.getElementById('publicidadSlot');
        if (!contenedor || !this._publicidadCandidatos || !this._publicidadCandidatos.length) return;
        var ad = this.sorteoPesado(this._publicidadCandidatos);
        contenedor.innerHTML = '<a href="' + escHtml(ad.enlace || '#') + '" target="_blank" rel="noopener" style="display:block;background:white;border-radius:12px;padding:14px;margin-bottom:16px;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
            (ad.imagen_url ? '<img src="' + escHtml(ad.imagen_url) + '" alt="' + escHtml(ad.titulo) + '" style="width:100%;border-radius:8px;margin-bottom:8px;">' : '') +
            '<strong style="display:block;">' + escHtml(ad.titulo) + '</strong><p style="margin:4px 0 0;font-size:13px;color:#6B7280;">' + escHtml(ad.contenido || '') + '</p>' +
            '</a>';
    },

    // ---------- Modal genérico reutilizable ----------
    abrirModal: function(titulo, contenidoHTML) {
        var existente = document.getElementById('modalInstitucional');
        if (existente) existente.remove();
        var modal = document.createElement('div');
        modal.id = 'modalInstitucional';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = '<div class="modal-fb">' +
            '<div class="modal-fb-header"><h3>' + titulo + '</h3><button onclick="Institucional.cerrarModal()" style="border:none;background:none;font-size:20px;cursor:pointer;">✕</button></div>' +
            '<div class="modal-fb-body">' + contenidoHTML + '</div>' +
            '</div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) { if (e.target === modal) Institucional.cerrarModal(); });
    },
    cerrarModal: function() {
        var modal = document.getElementById('modalInstitucional');
        if (modal) modal.remove();
    },

    // ---------- Quiénes Somos ----------
    RESPALDO_QUIENES_SOMOS: 'remarket-db es una plataforma peruana de economía circular que conecta a vecinos y comercios para vender, donar e intercambiar productos de segunda mano. Creemos que darle una segunda vida a lo que ya tienes es una forma simple y poderosa de cuidar el planeta y fortalecer la comunidad.',

    obtenerTextoQuienesSomos: async function() {
        var registro = { id: null, contenido: this.RESPALDO_QUIENES_SOMOS, traducciones: {} };
        try {
            var resultado = await supabase
                .from('contenido_administrable')
                .select('id, contenido, traducciones')
                .eq('tipo_contenido', 'institucional')
                .eq('titulo', 'quienes_somos')
                .eq('activo', true)
                .limit(1);
            if (!resultado.error && resultado.data && resultado.data.length > 0 && resultado.data[0].contenido) registro = resultado.data[0];
        } catch (e) { /* se queda con el respaldo fijo */ }
        return registro;
    },

    // Reutiliza el mismo sistema de traducción con caché que usa el artículo del muro
    // (chat-ia -> Groq la primera vez, y se guarda en la fila para no repetir el gasto).
    traducirTextoInstitucional: async function(id, textoOriginal, traducciones, idioma) {
        if (idioma === 'es' || !id) return textoOriginal;
        if (traducciones && traducciones[idioma] && traducciones[idioma].contenido) return traducciones[idioma].contenido;
        try {
            var res = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': MI_API_KEY, 'Authorization': 'Bearer ' + MI_API_KEY },
                body: JSON.stringify({ traducir_articulo: true, articulo_id: id, idioma: idioma, idioma_nombre: NOMBRES_IDIOMA_DISPLAY[idioma] || idioma })
            });
            var data = await res.json();
            if (data && data.contenido) return data.contenido;
        } catch (e) { /* si falla, se muestra en español antes que no mostrar nada */ }
        return textoOriginal;
    },

    mostrarQuienesSomos: async function() {
        var idioma = obtenerIdiomaPreferido();
        var registro = await this.obtenerTextoQuienesSomos();
        var texto = await this.traducirTextoInstitucional(registro.id, registro.contenido, registro.traducciones, idioma);
        var panelActivo = document.getElementById('userPanelView') && document.getElementById('userPanelView').classList.contains('active');
        if (panelActivo && typeof PanelUsuario !== 'undefined') {
            var cont = document.getElementById('userFeedContainer');
            if (cont) {
                cont.innerHTML = '<div style="padding:10px 4px;font-size:13px;color:var(--texto-secundario);">🌱 Sobre remarket-db · <a href="#" onclick="event.preventDefault();PanelUsuario.cargarFeed();">Volver al inicio</a></div>' +
                    '<div style="background:#fff;border-radius:12px;padding:20px;line-height:1.6;">' + escHtml(texto) + '</div>';
            }
        } else if (typeof UIController !== 'undefined' && UIController.mostrarQuienesSomosEnMuro) {
            UIController.mostrarQuienesSomosEnMuro(texto);
        } else {
            this.abrirModal(Institucional.t('titulo_quienes_somos'), '<p>' + escHtml(texto) + '</p>');
        }
    },

    // ---------- Términos y condiciones / Política de privacidad ----------
    // A diferencia de "Quiénes Somos", este texto NO se consulta desde Supabase: es un
    // documento legal, y necesita quedar con historial de versiones (quién cambió qué y
    // cuándo) -- eso lo da el historial de Git del código, no una fila de base de datos
    // editable sin registro. Cuando exista el Panel de Administrador con una tabla propia
    // de documentos legales versionados, este texto se puede migrar ahí.
    RESPALDO_TERMINOS: `Al usar remarket-db aceptas estas condiciones:

1. Qué es remarket-db: somos un espacio que conecta vecinos y comercios para vender, donar o intercambiar productos de segunda mano. No somos dueños de los productos publicados ni parte de las transacciones entre usuarios.

2. Tu cuenta: eres responsable de la información que registras y de mantener segura tu cuenta. La información que publiques (productos, ubicación, mensajes) debe ser veraz.

3. Contenido prohibido: no se permite publicar productos ilegales, contenido falso, ofensivo o que infrinja derechos de terceros. remarket-db puede remover publicaciones que incumplan estas reglas, con o sin aviso previo.

4. Transacciones entre usuarios: las ventas, trueques y donaciones se acuerdan directamente entre los usuarios. remarket-db no garantiza la calidad, entrega, pago ni cumplimiento de ningún acuerdo entre partes, y no interviene en disputas salvo para fines de moderación de la plataforma.

5. Asistente de IA: el asistente es una herramienta de ayuda para buscar y navegar la plataforma; su información puede contener errores y no reemplaza tu propio criterio antes de una transacción.

6. Cambios: podemos actualizar estos términos; el uso continuo de la plataforma después de un cambio implica su aceptación.

Última actualización: [completar fecha].`,

    RESPALDO_PRIVACIDAD: `En remarket-db recopilamos:

- Datos de registro: nombre, correo y los datos de tu perfil (ciudad, país, foto) que decides completar.
- Ubicación aproximada: mediante tu IP, para mostrarte productos cercanos.
- Contenido que publicas: productos, mensajes de chat, comentarios y reportes.

Usamos estos datos para: mostrarte contenido relevante por cercanía, permitir la mensajería entre usuarios, y moderar publicaciones que incumplan las reglas de la comunidad.

No vendemos tus datos a terceros. Compartimos información únicamente con los proveedores que dan soporte técnico a la plataforma (como el servicio de base de datos), bajo sus propias políticas de seguridad.

Tienes derecho a acceder, rectificar, cancelar u oponerte al uso de tus datos personales (derechos ARCO), conforme a la Ley N° 29733 de Protección de Datos Personales del Perú. Para ejercerlos, escríbenos a través de "Comunícate con el Administrador".

Última actualización: [completar fecha].`,

    mostrarTerminos: function() {
        this.mostrarDocumentoLegal('terminos', this.RESPALDO_TERMINOS, 'footer_terminos', 'Términos y condiciones');
    },

    mostrarPrivacidad: function() {
        this.mostrarDocumentoLegal('privacidad', this.RESPALDO_PRIVACIDAD, 'footer_privacidad', 'Política de privacidad');
    },

    // ---------- Traducción con IA de los documentos legales ----------
    // El texto en español es la versión con validez legal; la traducción es solo una ayuda de
    // lectura y así se avisa en el propio modal. Se guarda en localStorage por idioma para no
    // gastar la IA cada vez. La clave incluye el largo del texto: si editas el documento, la
    // traducción vieja deja de usarse sola.
    // Quechua y aimara se muestran en español a propósito: un modelo de IA general no traduce
    // esos idiomas con la fiabilidad que exige un texto legal.
    IDIOMAS_LEGAL_SOLO_ES: ['qu', 'ay'],
    NOMBRES_IDIOMA_LEGAL: { en: 'inglés', pt: 'portugués', fr: 'francés', de: 'alemán', it: 'italiano', ru: 'ruso', bg: 'búlgaro', zh: 'chino', ja: 'japonés', ko: 'coreano', ar: 'árabe', hi: 'hindi', nl: 'neerlandés', tr: 'turco' },

    traducirDocumentoLegal: async function(clave, textoEs, idioma) {
        var claveCache = 'legal_tr:' + clave + ':' + idioma + ':' + textoEs.length;
        try { var guardado = localStorage.getItem(claveCache); if (guardado) return guardado; } catch (e) { /* sin caché */ }
        var nombre = this.NOMBRES_IDIOMA_LEGAL[idioma];
        if (!nombre) return null;
        var instruccion = 'Eres un traductor profesional. Traduce el siguiente fragmento de un documento legal al idioma ' + nombre + '. Conserva la numeración, los guiones y los saltos de línea. No resumas, no omitas nada y no agregues comentarios. No traduzcas "remarket-db", "ARCO" ni "Ley N° 29733". Responde solo con la traducción.';

        // Se traduce párrafo por párrafo (en vez de todo el documento de una vez): los textos cortos
        // pasan mejor por el límite de tamaño y de tiempo de la función de IA. Cada párrafo se
        // reintenta una vez, y si alguno falla se muestra TODO en español (no se mezclan idiomas).
        async function traducirParte(parte) {
            if (!parte.trim()) return parte;
            for (var intento = 1; intento <= 2; intento++) {
                var controlador = new AbortController();
                var temporizador = setTimeout(function() { controlador.abort(); }, 25000);
                try {
                    var res = await fetch(CONFIG.GROQ_API_URL, {
                        method: 'POST',
                        signal: controlador.signal,
                        headers: { 'Content-Type': 'application/json', 'apikey': MI_API_KEY, 'Authorization': 'Bearer ' + MI_API_KEY },
                        body: JSON.stringify({ messages: [{ role: 'system', content: instruccion }, { role: 'user', content: parte }] })
                    });
                    var cuerpo = await res.text();
                    var data = null;
                    try { data = JSON.parse(cuerpo); } catch (e) { /* respuesta que no es JSON */ }
                    var salida = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
                    if (res.ok && salida && salida.trim()) return salida.trim();
                    console.warn('remarket-db: la traducción legal (' + idioma + ') falló, intento ' + intento + '. HTTP ' + res.status + ': ' + cuerpo.slice(0, 300));
                } catch (e) {
                    console.warn('remarket-db: la traducción legal (' + idioma + ') no llegó (red o tiempo), intento ' + intento + '.', e);
                } finally {
                    clearTimeout(temporizador);
                }
                if (intento < 2) await new Promise(function(r) { setTimeout(r, 1500); });
            }
            return null;
        }

        var partes = textoEs.split(/\n{2,}/);
        var resultados = [];
        for (var i = 0; i < partes.length; i += 3) {
            var lote = await Promise.all(partes.slice(i, i + 3).map(traducirParte));
            resultados = resultados.concat(lote);
        }
        if (resultados.some(function(r) { return r === null; })) return null;
        var traducido = resultados.join('\n\n');
        try { localStorage.setItem(claveCache, traducido); } catch (e) { /* sin caché */ }
        return traducido;
    },

    mostrarDocumentoLegal: async function(clave, textoEs, claveTitulo, tituloEs) {
        var self = this;
        var idioma = obtenerIdiomaPreferido();
        var ui = (typeof UI_TRANSLATIONS !== 'undefined' && (UI_TRANSLATIONS[idioma] || UI_TRANSLATIONS.es)) || {};
        var titulo = escHtml(ui[claveTitulo] || tituloEs);
        function nota(texto) {
            return texto ? '<p style="font-size:12px;color:var(--texto-secundario);margin:0 0 12px;">' + escHtml(texto) + '</p>' : '';
        }
        function cuerpo(notaTexto, texto) {
            return nota(notaTexto) + '<p style="white-space:pre-line;">' + escHtml(texto) + '</p>';
        }
        if (idioma === 'es') { this.abrirModal(titulo, cuerpo('', textoEs)); return; }
        if (this.IDIOMAS_LEGAL_SOLO_ES.indexOf(idioma) !== -1) { this.abrirModal(titulo, cuerpo(ui.legal_nota_es, textoEs)); return; }

        // Se abre de inmediato con un aviso de carga y luego se rellena, para no dejar la pantalla congelada
        this.abrirModal(titulo, nota(ui.legal_traduciendo || 'Traduciendo…'));
        var modal = document.getElementById('modalInstitucional');
        if (modal) modal.dataset.doc = clave + ':' + idioma;

        var traducido = await this.traducirDocumentoLegal(clave, textoEs, idioma);

        // Si mientras tanto la persona cerró el modal o abrió otro documento, no se toca nada
        var actual = document.getElementById('modalInstitucional');
        if (!actual || actual.dataset.doc !== clave + ':' + idioma) return;
        var cont = actual.querySelector('.modal-fb-body');
        if (!cont) return;
        cont.innerHTML = traducido ? cuerpo(ui.legal_nota_ia, traducido) : cuerpo(ui.legal_nota_es, textoEs);
    },

    // ---------- Comunícate con el Admin / Libro de Reclamaciones ----------
    // Antes esto se resolvía como una conversación paso a paso dentro del chat del Asistente IA
    // (una pregunta a la vez). Se reemplazó por los formularios completos de una sola vez,
    // mostrados en el muro central (ver mostrarContactoAdmin/mostrarLibroReclamaciones más abajo).
    // El Asistente avisa siempre con un mensaje corto cuando el formulario aparece en pantalla,
    // sin importar si se activó desde el pie de página o escribiéndole algo al chat -- así queda
    // consistente en los dos casos, y después se queda en silencio mientras se llena el formulario.
    iniciarContactoGuiado: function() {
        UIController.mostrarRespuestaIA('📩 Aquí tienes el formulario para comunicarte con el administrador -- úsalo para consultas, sugerencias, o cualquier tema que no sea un reclamo formal (para eso está el Libro de Reclamaciones). Completa tus datos y el mensaje, y el equipo te responderá.');
        this.mostrarContactoAdmin();
    },
    iniciarReclamoGuiado: function() {
        UIController.mostrarRespuestaIA('📋 Aquí tienes el Libro de Reclamaciones -- úsalo si tuviste un problema concreto con una compra, venta o publicación y quieres dejarlo registrado formalmente. Completa los datos y el detalle de lo ocurrido, y quedará constancia de tu reclamo.');
        this.mostrarLibroReclamaciones();
    },

    // Reportar una publicación puntual desde su tarjeta -- reusa el mismo Libro de
    // Reclamaciones (ya funciona sin necesitar cuenta), pero llega con el tipo "Reporte" y
    // el nombre del producto ya llenados, para que la persona no tenga que escribirlo de nuevo.
    reportarPublicacion: function(tituloProducto) {
        UIController.mostrarRespuestaIA('🚩 Vamos a registrar tu reporte sobre "' + tituloProducto + '" -- completa el resto de los datos y quedará constancia formal.');
        this.mostrarLibroReclamaciones({ tipo: 'reporte', bien: tituloProducto });
    },

    // ---------- Comunícate con el Admin ----------
    mostrarContactoAdmin: function() {
        var t = this.t.bind(this);
        UIController.mostrarFormularioEnMuro(t('titulo_contacto'), '📩', '' +
            '<form id="formContactoAdmin" onsubmit="Institucional.enviarContacto(event)">' +
            '<input type="text" id="contactoNombre" placeholder="' + t('ph_nombre') + '" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="email" id="contactoEmail" placeholder="' + t('ph_correo') + '" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<textarea id="contactoMensaje" placeholder="' + t('ph_mensaje') + '" required rows="4" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<button type="submit" id="contactoBtnEnviar" style="width:100%;padding:12px;background:#7C3AED;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">' + t('btn_enviar_mensaje') + '</button>' +
            '<div id="contactoEstado" style="margin-top:10px;text-align:center;"></div>' +
            '</form>');
    },
    enviarContacto: async function(e) {
        e.preventDefault();
        var t = this.t.bind(this);
        var estado = document.getElementById('contactoEstado');
        var boton = document.getElementById('contactoBtnEnviar');
        // Se desactiva el botón mientras se envía, para que un doble clic por impaciencia no
        // mande el mismo mensaje dos veces. Si falla, se reactiva para que pueda reintentar.
        boton.disabled = true;
        boton.textContent = t('enviando');
        estado.textContent = '';
        try {
            var { error } = await supabase.from('mensajes_contacto').insert({
                nombre: document.getElementById('contactoNombre').value,
                email: document.getElementById('contactoEmail').value,
                mensaje: document.getElementById('contactoMensaje').value
            });
            if (error) throw error;
            document.getElementById('formContactoAdmin').innerHTML = '<p style="text-align:center;color:#059669;">' + t('exito_mensaje') + '</p>';
        } catch (err) {
            estado.textContent = t('error_mensaje');
            boton.disabled = false;
            boton.textContent = t('btn_enviar_mensaje');
        }
    },

    // ---------- Libro de Reclamaciones ----------
    // prefill (opcional): { tipo: 'reclamo'|'queja'|'reporte', bien: 'nombre del producto' } --
    // se usa cuando se llega desde el botón "Reportar" de una tarjeta puntual.
    mostrarLibroReclamaciones: function(prefill) {
        var t = this.t.bind(this);
        var tipoSel = (prefill && prefill.tipo) || '';
        var bienVal = (prefill && prefill.bien) ? escHtml(prefill.bien) : '';
        function opt(valor, texto) { return '<option value="' + valor + '"' + (tipoSel === valor ? ' selected' : '') + '>' + texto + '</option>'; }
        UIController.mostrarFormularioEnMuro(t('titulo_reclamo'), '📋', '' +
            '<form id="formReclamo" onsubmit="Institucional.enviarReclamo(event)">' +
            '<select id="reclamoTipo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"><option value="">' + t('ph_tipo') + '</option>' + opt('reclamo', t('opt_reclamo')) + opt('queja', t('opt_queja')) + opt('reporte', t('opt_reclamo')) + '</select>' +
            '<input type="text" id="reclamoNombre" placeholder="' + t('ph_nombre_completo') + '" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoDocumento" placeholder="' + t('ph_documento') + '" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="email" id="reclamoEmail" placeholder="' + t('ph_correo') + '" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoTelefono" placeholder="' + t('ph_telefono') + '" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoBien" placeholder="' + t('ph_bien') + '" required value="' + bienVal + '" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoMonto" placeholder="' + t('ph_monto') + '" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<textarea id="reclamoDetalle" placeholder="' + t('ph_detalle') + '" required rows="3" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<textarea id="reclamoPedido" placeholder="' + t('ph_pedido') + '" required rows="2" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<button type="submit" id="reclamoBtnEnviar" style="width:100%;padding:12px;background:#DC2626;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">' + t('btn_registrar') + '</button>' +
            '<div id="reclamoEstado" style="margin-top:10px;text-align:center;"></div>' +
            '</form>');
    },
    enviarReclamo: async function(e) {
        e.preventDefault();
        var t = this.t.bind(this);
        var estado = document.getElementById('reclamoEstado');
        var boton = document.getElementById('reclamoBtnEnviar');
        var montoTexto = document.getElementById('reclamoMonto').value.trim();
        var monto = null;
        // El monto es opcional -- pero si lo llenaron, debe ser un número (admite coma o punto
        // decimal), para no guardar algo como "como cien soles" en un campo pensado para montos.
        if (montoTexto !== '') {
            var montoNormalizado = montoTexto.replace(',', '.').replace(/[^0-9.]/g, '');
            monto = parseFloat(montoNormalizado);
            if (isNaN(monto)) {
                estado.textContent = t('error_monto');
                return;
            }
        }
        // Se desactiva el botón mientras se envía, para que un doble clic por impaciencia no
        // registre el mismo reclamo dos veces. Si falla, se reactiva para que pueda reintentar.
        boton.disabled = true;
        boton.textContent = t('enviando');
        estado.textContent = '';
        try {
            var { error } = await supabase.from('libro_reclamaciones').insert({
                tipo: document.getElementById('reclamoTipo').value,
                nombre_consumidor: document.getElementById('reclamoNombre').value,
                documento_identidad: document.getElementById('reclamoDocumento').value,
                email: document.getElementById('reclamoEmail').value,
                telefono: document.getElementById('reclamoTelefono').value || null,
                descripcion_bien_servicio: document.getElementById('reclamoBien').value,
                monto_reclamado: monto,
                detalle: document.getElementById('reclamoDetalle').value,
                pedido_consumidor: document.getElementById('reclamoPedido').value
            });
            if (error) throw error;
            document.getElementById('formReclamo').innerHTML = '<p style="text-align:center;color:#059669;">' + t('exito_reclamo') + '</p>';
        } catch (err) {
            estado.textContent = t('error_reclamo');
            boton.disabled = false;
            boton.textContent = t('btn_registrar');
        }
    }
};
