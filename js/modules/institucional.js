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
                '<button class="btn-sponsor" data-ui-accion="abrirlink" data-url="' + escHtml(p.enlace || '#') + '">' + Institucional.t('btn_visitar') + '</button></div>';
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

    // Traduce con la cuenta de Groq dedicada a traducciones (separada de la del chat, ver
    // BITACORA-SESION-CUOTA-GROQ.md) y guarda el resultado en la fila de contenido_administrable,
    // para no volver a pagar el costo la próxima vez que alguien lo pida en el mismo idioma.
    traducirTextoInstitucional: async function(id, textoOriginal, traducciones, idioma) {
        if (idioma === 'es' || !id) return textoOriginal;
        // Quechua y aimara: se queda el español (aunque haya una traducción guardada de antes), porque
        // la IA gratuita inventa palabras en estos idiomas. Misma lista que usan los documentos legales.
        if (this.IDIOMAS_LEGAL_SOLO_ES.indexOf(idioma) !== -1) return textoOriginal;
        if (traducciones && traducciones[idioma] && traducciones[idioma].contenido) return traducciones[idioma].contenido;
        try {
            var res = await fetch(CONFIG.TRADUCCION_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': MI_API_KEY, 'Authorization': 'Bearer ' + MI_API_KEY },
                body: JSON.stringify({ texto: textoOriginal, idioma: NOMBRES_IDIOMA_DISPLAY[idioma] || idioma })
            });
            var data = await res.json();
            var traducido = data.choices && data.choices[0] ? data.choices[0].message.content.trim() : null;
            if (traducido) {
                this._guardarTraduccionInstitucional(id, traducciones, idioma, traducido); // en silencio, no bloquea la respuesta
                return traducido;
            }
        } catch (e) { /* si falla, se muestra en español antes que no mostrar nada */ }
        return textoOriginal;
    },

    // Guarda la traducción en la misma fila de contenido_administrable (columna traducciones,
    // JSONB) -- antes esto lo hacía el servidor solo; ahora que el endpoint de traducción es
    // liviano y no toca la base de datos, el guardado queda del lado del cliente, igual que ya
    // hace TraduccionProductos con los productos.
    _guardarTraduccionInstitucional: async function(id, traduccionesActuales, idioma, textoTraducido) {
        try {
            var nuevas = traduccionesActuales || {};
            nuevas[idioma] = { contenido: textoTraducido };
            await supabase.from('contenido_administrable').update({ traducciones: nuevas }).eq('id', id);
        } catch (e) {
            console.warn('remarket-db: no se pudo guardar la traducción institucional en Supabase.', e);
        }
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
        this.mostrarDocumentoLegal(this.RESPALDO_TERMINOS, 'footer_terminos', 'Términos y condiciones', 'terminos_condiciones');
    },

    mostrarPrivacidad: function() {
        this.mostrarDocumentoLegal(this.RESPALDO_PRIVACIDAD, 'footer_privacidad', 'Política de privacidad', 'politica_privacidad');
    },

    // ---------- Documentos legales traducidos ----------
    // El texto en español es la versión con validez legal. Se lee de la tabla contenido_administrable
    // (tipo 'institucional', igual que "Quiénes Somos"); si no está ahí, se usa el respaldo fijo de arriba.
    // La traducción usa el MISMO sistema que ya traduce el artículo del muro y "Quiénes Somos": la función
    // chat-ia traduce la fila, la guarda en su columna `traducciones` y desde entonces se sirve desde ahí
    // (una sola vez por idioma para todos los visitantes). No se manda ningún prompt desde el navegador.
    // Quechua y aimara se muestran en español a propósito: un modelo de IA general no traduce esos idiomas
    // con la fiabilidad que exige un texto legal.
    IDIOMAS_LEGAL_SOLO_ES: ['qu', 'ay'],

    obtenerDocumentoLegalDB: async function(tituloDB) {
        try {
            var r = await supabase
                .from('contenido_administrable')
                .select('id, contenido, traducciones')
                .eq('tipo_contenido', 'institucional')
                .eq('titulo', tituloDB)
                .eq('activo', true)
                .limit(1);
            if (!r.error && r.data && r.data.length > 0 && r.data[0].contenido) return r.data[0];
        } catch (e) { /* se queda con el respaldo fijo */ }
        return null;
    },

    mostrarDocumentoLegal: async function(textoRespaldo, claveTitulo, tituloEs, tituloDB) {
        var idioma = obtenerIdiomaPreferido();
        var ui = (typeof UI_TRANSLATIONS !== 'undefined' && (UI_TRANSLATIONS[idioma] || UI_TRANSLATIONS.es)) || {};
        var titulo = escHtml(ui[claveTitulo] || tituloEs);
        var marca = tituloDB + ':' + idioma;
        function nota(texto) {
            return texto ? '<p style="font-size:12px;color:var(--texto-secundario);margin:0 0 12px;">' + escHtml(texto) + '</p>' : '';
        }
        function cuerpo(notaTexto, texto) {
            return nota(notaTexto) + '<p style="white-space:pre-line;">' + escHtml(texto) + '</p>';
        }
        // Solo se actualiza si la persona no cerró el modal ni abrió otro documento mientras tanto
        function pintar(html) {
            var m = document.getElementById('modalInstitucional');
            if (!m || m.dataset.doc !== marca) return;
            var c = m.querySelector('.modal-fb-body');
            if (c) c.innerHTML = html;
        }

        // Se abre de inmediato: en español con el texto de respaldo, en otros idiomas con un aviso de carga
        if (idioma === 'es') this.abrirModal(titulo, cuerpo('', textoRespaldo));
        else this.abrirModal(titulo, nota(ui.legal_traduciendo || 'Traduciendo…'));
        var modal = document.getElementById('modalInstitucional');
        if (modal) modal.dataset.doc = marca;

        var registro = await this.obtenerDocumentoLegalDB(tituloDB);
        var textoEs = registro ? registro.contenido : textoRespaldo;

        if (idioma === 'es') { if (registro && registro.contenido !== textoRespaldo) pintar(cuerpo('', textoEs)); return; }
        if (this.IDIOMAS_LEGAL_SOLO_ES.indexOf(idioma) !== -1 || !registro) { pintar(cuerpo(ui.legal_nota_es, textoEs)); return; }

        var traducido = await this.traducirTextoInstitucional(registro.id, registro.contenido, registro.traducciones, idioma);
        if (traducido && traducido !== registro.contenido) {
            pintar(cuerpo(ui.legal_nota_ia, traducido));
        } else {
            console.warn('remarket-db: no se pudo traducir el documento legal "' + tituloDB + '" al idioma ' + idioma + '; se muestra en español.');
            pintar(cuerpo(ui.legal_nota_es, textoEs));
        }
    },

    // ---------- Comunícate con el Admin / Libro de Reclamaciones ----------
    // Antes esto se resolvía como una conversación paso a paso dentro del chat del Asistente IA
    // (una pregunta a la vez). Se reemplazó por los formularios completos de una sola vez,
    // mostrados en el muro central (ver mostrarContactoAdmin/mostrarLibroReclamaciones más abajo).
    // El Asistente avisa siempre con un mensaje corto cuando el formulario aparece en pantalla,
    // sin importar si se activó desde el pie de página o escribiéndole algo al chat -- así queda
    // consistente en los dos casos, y después se queda en silencio mientras se llena el formulario.
    iniciarContactoGuiado: function() {
        UIController.mostrarRespuestaIA(textoUI('msg_contacto', '📩 Aquí tienes el formulario para comunicarte con el administrador -- úsalo para consultas, sugerencias, o cualquier tema que no sea un reclamo formal (para eso está el Libro de Reclamaciones). Completa tus datos y el mensaje, y el equipo te responderá.'));
        this.mostrarContactoAdmin();
    },
    // Seguridad (pie de página): texto fijo, SIN llamar a la IA. No gasta cuota de Groq ni busca en
    // internet/YouTube, y no falla si el asistente está sin cupo. Los textos están en i18n-institucional.js;
    // los idiomas sin traducción caen a español (ver Institucional.t).
    iniciarSeguridadGuiado: function() {
        UIController.mostrarRespuestaIA(this.t('msg_seguridad'));
        this.mostrarSeguridad();
    },
    mostrarSeguridad: function() {
        var t = this.t.bind(this);
        var item = function(clave) { return '<li style="margin-bottom:8px;">' + escHtml(t(clave)) + '</li>'; };
        var boton = function(accion, texto) {
            return '<button type="button" onclick="' + accion + '" style="padding:10px 14px;background:#7C3AED;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin:0 8px 8px 0;">' + escHtml(texto) + '</button>';
        };
        UIController.mostrarFormularioEnMuro(t('titulo_seguridad'), '🛡️', '' +
            '<div style="line-height:1.6;">' +
            '<h4 style="margin:0 0 8px;">' + escHtml(t('seg_hace_t')) + '</h4>' +
            '<ul style="margin:0 0 16px;padding-left:20px;">' + item('seg_h1') + item('seg_h2') + item('seg_h3') + '</ul>' +
            '<h4 style="margin:0 0 8px;">' + escHtml(t('seg_tu_t')) + '</h4>' +
            '<ul style="margin:0 0 16px;padding-left:20px;">' + item('seg_t1') + item('seg_t2') + item('seg_t3') + '</ul>' +
            '<p style="font-size:13px;color:var(--texto-secundario);margin:0 0 16px;">' + escHtml(t('seg_aviso')) + '</p>' +
            boton('Institucional.iniciarReclamoGuiado()', textoUI('footer_reclamos', 'Libro de Reclamaciones')) +
            boton('Institucional.iniciarContactoGuiado()', textoUI('footer_contacto', 'Comunícate con el Administrador')) +
            '</div>');
    },
    iniciarReclamoGuiado: function() {
        UIController.mostrarRespuestaIA(textoUI('msg_reclamo', '📋 Aquí tienes el Libro de Reclamaciones -- úsalo si tuviste un problema concreto con una compra, venta o publicación y quieres dejarlo registrado formalmente. Completa los datos y el detalle de lo ocurrido, y quedará constancia de tu reclamo.'));
        this.mostrarLibroReclamaciones();
    },

    // Reportar una publicación puntual desde su tarjeta -- reusa el mismo Libro de
    // Reclamaciones (ya funciona sin necesitar cuenta), pero llega con el tipo "Reporte" y
    // el nombre del producto ya llenados, para que la persona no tenga que escribirlo de nuevo.
    reportarPublicacion: function(tituloProducto) {
        UIController.mostrarRespuestaIA(textoUI('msg_reporte', '🚩 Vamos a registrar tu reporte sobre "{p}" -- completa el resto de los datos y quedará constancia formal.').replace('{p}', function() { return tituloProducto; }));
        this.mostrarLibroReclamaciones({ tipo: 'reporte', bien: tituloProducto });
    },

    // Si el usuario cambia de idioma con el formulario de Contacto o el Libro de Reclamaciones
    // abierto, hay que actualizar sus textos (título, placeholders, botón) al nuevo idioma --
    // pero SIN reconstruir el <form>, porque eso borraría lo que la persona ya haya escrito.
    // Por eso acá se tocan solo las propiedades de texto (textContent, placeholder), nunca
    // .value ni .innerHTML del formulario.
    retraducirFormularioAbierto: function() {
        // El enlace del pie ("Danos tu opinión") se traduce siempre, haya o no un formulario abierto.
        this.retraducirPieOpinion();
        if (!UIController.formularioAbierto) return;
        var t = this.t.bind(this);
        var banner = UIController.elementos.searchResultsContent && UIController.elementos.searchResultsContent.querySelector('.ai-context-banner strong');

        if (document.getElementById('formContactoAdmin')) {
            var tituloC = t('titulo_contacto');
            UIController.elementos.searchQuery.textContent = tituloC;
            if (banner) banner.textContent = tituloC;
            var cNombre = document.getElementById('contactoNombre'); if (cNombre) cNombre.placeholder = t('ph_nombre');
            var cEmail = document.getElementById('contactoEmail'); if (cEmail) cEmail.placeholder = t('ph_correo');
            var cMsg = document.getElementById('contactoMensaje'); if (cMsg) cMsg.placeholder = t('ph_mensaje');
            var cBtn = document.getElementById('contactoBtnEnviar'); if (cBtn && !cBtn.disabled) cBtn.textContent = t('btn_enviar_mensaje');
        } else if (document.getElementById('formReclamo')) {
            var tituloR = t('titulo_reclamo');
            UIController.elementos.searchQuery.textContent = tituloR;
            if (banner) banner.textContent = tituloR;
            var tipoSel = document.getElementById('reclamoTipo');
            if (tipoSel && tipoSel.options.length >= 4) {
                tipoSel.options[0].textContent = t('ph_tipo');
                tipoSel.options[1].textContent = t('opt_reclamo');
                tipoSel.options[2].textContent = t('opt_queja');
                tipoSel.options[3].textContent = t('opt_reporte');
            }
            var placeholdersReclamo = { reclamoNombre: 'ph_nombre_completo', reclamoDocumento: 'ph_documento', reclamoEmail: 'ph_correo', reclamoTelefono: 'ph_telefono', reclamoBien: 'ph_bien', reclamoMonto: 'ph_monto', reclamoDetalle: 'ph_detalle', reclamoPedido: 'ph_pedido' };
            Object.keys(placeholdersReclamo).forEach(function(id) { var el = document.getElementById(id); if (el) el.placeholder = t(placeholdersReclamo[id]); });
            var rBtn = document.getElementById('reclamoBtnEnviar'); if (rBtn && !rBtn.disabled) rBtn.textContent = t('btn_registrar');
        } else if (document.getElementById('formOpinion')) {
            var tituloO = t('titulo_opinion');
            UIController.elementos.searchQuery.textContent = tituloO;
            if (banner) banner.textContent = tituloO;
            var oPreg = document.getElementById('opinionPregunta'); if (oPreg) oPreg.textContent = t('op_pregunta');
            var oMin = document.getElementById('opinionMin'); if (oMin) oMin.textContent = t('op_min');
            var oMax = document.getElementById('opinionMax'); if (oMax) oMax.textContent = t('op_max');
            var oCom = document.getElementById('opinionComentario'); if (oCom) oCom.placeholder = t('ph_opinion');
            var oBtn = document.getElementById('opinionBtnEnviar'); if (oBtn && !oBtn.disabled) oBtn.textContent = t('btn_enviar_opinion');
        }
    },

    // ---------- Opinión sobre la página (buzón privado del administrador) ----------
    // Una nota del 1 al 10 (obligatoria) y un comentario corto (opcional). NO se publica nada:
    // la opinión entra por la función registrar_opinion (Supabase) a una tabla que nadie puede
    // leer desde la página; solo la ve el administrador. Quién la escribió, si tenía sesión, lo
    // anota el servidor con la sesión real (no se manda desde el navegador). Ver
    // BITACORA-OPINIONES-PAGINA.md y opiniones-pagina.sql.
    _notaOpinion: 0,

    // Pone el texto del enlace del pie en el idioma actual (el pie vive en index.html).
    retraducirPieOpinion: function() {
        var el = document.getElementById('footerOpinion');
        if (el) el.textContent = this.t('titulo_opinion');
    },

    mostrarOpinion: function() {
        var t = this.t.bind(this);
        this._notaOpinion = 0;
        var botones = '';
        for (var n = 1; n <= 10; n++) {
            botones += '<button type="button" class="op-nota" data-nota="' + n + '" aria-pressed="false" aria-label="' + n + '" onclick="Institucional.elegirNota(' + n + ')" ' +
                'style="padding:12px 0;border-radius:8px;border:1px solid #D1D5DB;background:#fff;color:#111827;font-weight:600;font-size:16px;cursor:pointer;">' + n + '</button>';
        }
        UIController.mostrarFormularioEnMuro(t('titulo_opinion'), '⭐', '' +
            '<form id="formOpinion" onsubmit="Institucional.enviarOpinion(event)">' +
            '<p id="opinionPregunta" style="margin:0 0 10px;font-weight:600;">' + escHtml(t('op_pregunta')) + '</p>' +
            // Los números van siempre de izquierda a derecha (1 → 10), también en idiomas de derecha a izquierda.
            '<div style="direction:ltr;display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">' + botones + '</div>' +
            '<div style="display:flex;justify-content:space-between;gap:8px;margin:8px 0 12px;font-size:12px;color:#6B7280;">' +
                '<span id="opinionMin">' + escHtml(t('op_min')) + '</span><span id="opinionMax" style="text-align:end;">' + escHtml(t('op_max')) + '</span></div>' +
            '<textarea id="opinionComentario" placeholder="' + escHtml(t('ph_opinion')) + '" rows="3" minlength="5" maxlength="500" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<button type="submit" id="opinionBtnEnviar" style="width:100%;padding:12px;background:#7C3AED;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">' + escHtml(t('btn_enviar_opinion')) + '</button>' +
            '<div id="opinionEstado" role="status" style="margin-top:10px;text-align:center;"></div>' +
            '</form>');
    },

    // Marca el número elegido (solo cambia el aspecto de los botones y guarda la nota en memoria).
    elegirNota: function(n) {
        n = parseInt(n, 10);
        if (!(n >= 1 && n <= 10)) return;
        this._notaOpinion = n;
        var botones = document.querySelectorAll('#formOpinion .op-nota');
        for (var i = 0; i < botones.length; i++) {
            var activo = (parseInt(botones[i].getAttribute('data-nota'), 10) === n);
            botones[i].setAttribute('aria-pressed', activo ? 'true' : 'false');
            botones[i].style.background = activo ? '#7C3AED' : '#fff';
            botones[i].style.color = activo ? '#fff' : '#111827';
            botones[i].style.borderColor = activo ? '#7C3AED' : '#D1D5DB';
        }
        var estado = document.getElementById('opinionEstado');
        if (estado) estado.textContent = '';
    },

    enviarOpinion: async function(e) {
        e.preventDefault();
        var t = this.t.bind(this);
        var estado = document.getElementById('opinionEstado');
        var boton = document.getElementById('opinionBtnEnviar');
        if (!this._notaOpinion) { estado.textContent = t('op_elige_nota'); return; }
        // Se desactiva el botón mientras se envía (un doble clic no manda dos opiniones); si falla, se reactiva.
        boton.disabled = true;
        boton.textContent = t('enviando');
        estado.textContent = '';
        try {
            var comentario = document.getElementById('opinionComentario').value.trim();
            var { error } = await supabase.rpc('registrar_opinion', {
                p_nota: this._notaOpinion,
                p_comentario: comentario || null,
                p_idioma: obtenerIdiomaPreferido()
            });
            if (error) throw error;
            this._notaOpinion = 0;
            var form = document.getElementById('formOpinion');
            if (form) form.innerHTML = '<p style="text-align:center;color:#059669;">' + escHtml(t('exito_opinion')) + '</p>';
        } catch (err) {
            console.error('remarket-db: no se pudo registrar la opinión', err);
            estado.textContent = t('error_opinion');
            boton.disabled = false;
            boton.textContent = t('btn_enviar_opinion');
        }
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
            var datos = {
                nombre: document.getElementById('contactoNombre').value.trim(),
                email: document.getElementById('contactoEmail').value.trim(),
                mensaje: document.getElementById('contactoMensaje').value.trim()
            };
            // Ya no se inserta directo en la tabla: la función registrar_contacto (Supabase) valida
            // los tamaños, guarda y devuelve el código y la fecha del comprobante (fase1-constancia.sql).
            var { data, error } = await supabase.rpc('registrar_contacto', {
                p_nombre: datos.nombre,
                p_email: datos.email,
                p_mensaje: datos.mensaje
            });
            if (error) throw error;
            var res = Array.isArray(data) ? data[0] : data;
            if (!res || !res.codigo) throw new Error('registrar_contacto no devolvió un código');
            this.mostrarConstancia('formContactoAdmin', 'contacto', datos, res, t('exito_mensaje'));
        } catch (err) {
            console.error('remarket-db: no se pudo enviar el mensaje al administrador', err);
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
            '<select id="reclamoTipo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"><option value="">' + t('ph_tipo') + '</option>' + opt('reclamo', t('opt_reclamo')) + opt('queja', t('opt_queja')) + opt('reporte', t('opt_reporte')) + '</select>' +
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
            var datos = {
                tipo: document.getElementById('reclamoTipo').value,
                nombre: document.getElementById('reclamoNombre').value.trim(),
                documento: document.getElementById('reclamoDocumento').value.trim(),
                email: document.getElementById('reclamoEmail').value.trim(),
                telefono: document.getElementById('reclamoTelefono').value.trim(),
                bien: document.getElementById('reclamoBien').value.trim(),
                monto: monto,
                detalle: document.getElementById('reclamoDetalle').value.trim(),
                pedido: document.getElementById('reclamoPedido').value.trim()
            };
            // Ya no se inserta directo en la tabla: la función registrar_reclamo (Supabase) valida
            // los tamaños, escribe en las columnas reales de libro_reclamaciones y devuelve el código
            // y la fecha del comprobante (ver fase1-constancia.sql).
            var { data, error } = await supabase.rpc('registrar_reclamo', {
                p_tipo: datos.tipo,
                p_nombre: datos.nombre,
                p_documento: datos.documento,
                p_email: datos.email,
                p_telefono: datos.telefono || null,
                p_bien: datos.bien,
                p_monto: datos.monto,
                p_detalle: datos.detalle,
                p_pedido: datos.pedido
            });
            if (error) throw error;
            var res = Array.isArray(data) ? data[0] : data;
            if (!res || !res.codigo) throw new Error('registrar_reclamo no devolvió un código');
            this.mostrarConstancia('formReclamo', 'reclamo', datos, res, t('exito_reclamo'));
        } catch (err) {
            console.error('remarket-db: no se pudo registrar el reclamo', err);
            estado.textContent = t('error_reclamo');
            boton.disabled = false;
            boton.textContent = t('btn_registrar');
        }
    },

    // ---------- Constancia (comprobante) del reclamo y del mensaje al administrador ----------
    // DECISIÓN (07/10/2026): el comprobante va SIEMPRE en inglés, sin importar el idioma de la
    // pantalla (la página es de alcance mundial y el documento debe leerse igual en todas partes).
    // Lo que la persona escribió se imprime tal cual, sin traducir. Para añadir el español junto a
    // cada etiqueta (por si lo debe leer INDECOPI o un abogado), poner esto en true.
    CONSTANCIA_CON_ESPANOL: false,
    _constanciaActual: null,

    CONSTANCIA_CSS:
        '.cns{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:14px;line-height:1.5;text-align:left;direction:ltr;}' +
        '.cns h2{font-size:18px;margin:0 0 4px 0;}' +
        '.cns .cns-sitio{color:#555;font-size:12px;margin-bottom:12px;}' +
        '.cns .cns-codigo{font-size:20px;font-weight:700;letter-spacing:1px;margin:8px 0 12px 0;padding:8px 10px;background:#F3F4F6;border-radius:6px;word-break:break-all;}' +
        '.cns table{width:100%;border-collapse:collapse;}' +
        '.cns th,.cns td{border:1px solid #D1D5DB;padding:6px 8px;vertical-align:top;font-size:13px;}' +
        '.cns th{width:34%;background:#F9FAFB;text-align:left;font-weight:600;}' +
        '.cns td{white-space:pre-wrap;word-break:break-word;}' +
        '.cns .cns-nota{margin-top:12px;font-size:12px;color:#444;}',

    _etq: function(en, es) {
        return this.CONSTANCIA_CON_ESPANOL ? (en + ' / ' + es) : en;
    },

    // Fecha legible + hora universal, para que no haya dudas de zona horaria en el documento.
    formatearFechaConstancia: function(iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return String(iso || '');
        var utc = d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
        try {
            var local = new Intl.DateTimeFormat('en-GB', {
                year: 'numeric', month: 'short', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short'
            }).format(d);
            return local + '  (' + utc + ')';
        } catch (err) {
            return utc;
        }
    },

    // Devuelve el HTML del comprobante (sin <html>/<body>): se usa igual en pantalla y en el PDF.
    // Todo lo que escribió la persona pasa por escHtml -- lo escribe cualquier visitante anónimo.
    htmlConstancia: function(clase, datos, res) {
        var self = this;
        var sitio = (typeof location !== 'undefined' && location.hostname) ? location.hostname : 'this site';
        var esReclamo = (clase === 'reclamo');
        var tipos = { reclamo: ['Complaint', 'Reclamo'], queja: ['Grievance', 'Queja'], reporte: ['Report', 'Reporte'] };
        var tipo = tipos[datos.tipo] || null;
        var titulo = esReclamo ? self._etq('Complaint receipt', 'Constancia de reclamo') : self._etq('Contact ticket', 'Ticket de atención');

        function fila(en, es, valor) {
            if (valor === null || valor === undefined || String(valor).trim() === '') return '';
            return '<tr><th>' + escHtml(self._etq(en, es)) + '</th><td>' + escHtml(String(valor)) + '</td></tr>';
        }

        var filas = '';
        filas += fila('Code', 'Código', res.codigo);
        filas += fila('Date and time', 'Fecha y hora', self.formatearFechaConstancia(res.fecha));
        if (esReclamo) {
            filas += fila('Type', 'Tipo', tipo ? (self.CONSTANCIA_CON_ESPANOL ? tipo[0] + ' / ' + tipo[1] : tipo[0]) : datos.tipo);
            filas += fila('Full name', 'Nombre completo', datos.nombre);
            filas += fila('ID document', 'Documento de identidad', datos.documento);
            filas += fila('Email', 'Correo electrónico', datos.email);
            filas += fila('Phone', 'Teléfono', datos.telefono);
            filas += fila('Related product or service', 'Producto o servicio relacionado', datos.bien);
            filas += fila('Amount claimed', 'Monto reclamado', (typeof datos.monto === 'number' && !isNaN(datos.monto)) ? datos.monto.toFixed(2) : '');
            filas += fila('Details of what happened', 'Detalle de lo ocurrido', datos.detalle);
            filas += fila('Requested resolution', 'Solución solicitada', datos.pedido);
        } else {
            filas += fila('Name', 'Nombre', datos.nombre);
            filas += fila('Email', 'Correo electrónico', datos.email);
            filas += fila('Message', 'Mensaje', datos.mensaje);
        }

        var nota = 'This receipt only records that the information above was submitted through ' + sitio +
            ' on the date shown. ' + sitio + ' only connects users and is not a party to any transaction between them; ' +
            'this receipt does not imply acceptance of liability or a commitment to a specific outcome. ' +
            'Keep this code to refer to this submission.';
        var notaEs = 'Esta constancia solo registra que la información anterior fue enviada a través de ' + sitio +
            ' en la fecha indicada. ' + sitio + ' solo pone en contacto a los usuarios y no es parte de ninguna operación entre ellos; ' +
            'esta constancia no implica reconocimiento de responsabilidad ni compromiso de un resultado. ' +
            'Conserve este código para referirse a este envío.';
        if (esReclamo && datos.tipo === 'reporte') {
            nota += ' A report is a notice sent to the site administrator; it is not a claim addressed to a specific seller or provider.';
            notaEs += ' Un reporte es un aviso al administrador del sitio; no es un reclamo dirigido a un vendedor o proveedor específico.';
        }

        return '<style>' + self.CONSTANCIA_CSS + '</style>' +
            '<div class="cns">' +
            '<h2>' + escHtml(titulo) + '</h2>' +
            '<div class="cns-sitio">' + escHtml(sitio) + '</div>' +
            '<div class="cns-codigo">' + escHtml(res.codigo) + '</div>' +
            '<table>' + filas + '</table>' +
            '<div class="cns-nota">' + escHtml(nota) + (self.CONSTANCIA_CON_ESPANOL ? '<br><br>' + escHtml(notaEs) : '') + '</div>' +
            '</div>';
    },

    // Reemplaza el formulario por el mensaje de éxito + el comprobante + el botón de PDF.
    mostrarConstancia: function(idFormulario, clase, datos, res, textoExito) {
        var t = this.t.bind(this);
        var form = document.getElementById(idFormulario);
        if (!form) return;
        var cuerpo = this.htmlConstancia(clase, datos, res);
        this._constanciaActual = { codigo: res.codigo, cuerpo: cuerpo };
        form.innerHTML =
            '<p style="text-align:center;color:#059669;">' + textoExito + '</p>' +
            '<div style="border:1px solid #E5E7EB;border-radius:8px;padding:12px;margin:10px 0;">' + cuerpo + '</div>' +
            '<button type="button" onclick="Institucional.imprimirConstancia()" style="width:100%;padding:12px;background:#111827;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">' + escHtml(t('btn_guardar_pdf')) + '</button>' +
            '<p style="margin-top:8px;font-size:12px;color:#6B7280;text-align:center;">' + escHtml(t('msg_guarda_codigo')) + '</p>';
    },

    // Abre la impresión del navegador SOLO con la constancia (no con la página entera). El título
    // del documento es el código, así que el nombre de archivo que sugiere "Guardar como PDF" es el código.
    imprimirConstancia: function() {
        var c = this._constanciaActual;
        if (!c) return;
        var doc = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<title>' + escHtml(c.codigo) + '</title>' +
            '<style>@page{margin:18mm;} body{margin:16px;}</style></head><body>' + c.cuerpo + '</body></html>';
        var w = null;
        try { w = window.open('', '_blank'); } catch (err) { w = null; }
        if (w && w.document) {
            w.document.open(); w.document.write(doc); w.document.close();
            try { w.focus(); } catch (err) {}
            setTimeout(function() { try { w.print(); } catch (err) {} }, 400);
            return;
        }
        // Respaldo si el navegador bloquea la ventana nueva: iframe oculto.
        var f = document.createElement('iframe');
        f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
        document.body.appendChild(f);
        var d = f.contentWindow.document;
        d.open(); d.write(doc); d.close();
        setTimeout(function() {
            try { f.contentWindow.focus(); f.contentWindow.print(); } catch (err) {}
            setTimeout(function() { if (f.parentNode) f.parentNode.removeChild(f); }, 2000);
        }, 400);
    }
};
