// ============================================
// INSTITUCIONAL: Patrocinadores, Publicidad, Quiénes Somos,
// Comunícate con el Admin, Libro de Reclamaciones
// ============================================
var Institucional = {

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
                '<button class="btn-sponsor" onclick="window.open(\'' + escHtml(p.enlace || '#') + '\', \'_blank\')">Visitar</button></div>';
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
        var texto = this.RESPALDO_QUIENES_SOMOS;
        try {
            var resultado = await supabase
                .from('contenido_administrable')
                .select('contenido')
                .eq('tipo_contenido', 'institucional')
                .eq('titulo', 'quienes_somos')
                .eq('activo', true)
                .limit(1);
            if (!resultado.error && resultado.data && resultado.data.length > 0 && resultado.data[0].contenido) texto = resultado.data[0].contenido;
        } catch (e) { /* se queda con el respaldo fijo */ }
        return texto;
    },

    mostrarQuienesSomos: async function() {
        var texto = await this.obtenerTextoQuienesSomos();
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
            this.abrirModal('Quiénes Somos', '<p>' + escHtml(texto) + '</p>');
        }
    },

    // ---------- Comunícate con el Admin / Libro de Reclamaciones ----------
    // Antes esto se resolvía como una conversación paso a paso dentro del chat del Asistente IA
    // (una pregunta a la vez). Se reemplazó por los formularios completos de una sola vez,
    // mostrados en el muro central (ver mostrarContactoAdmin/mostrarLibroReclamaciones más abajo),
    // que es donde vive la atención del usuario en el resto de la página.
    // El parámetro "desdeChat" distingue el origen: si viene del pie de página, el formulario
    // aparece directo y el Asistente se queda callado (nunca "hablaste" con él). Si en cambio el
    // usuario le escribió algo como "quiero reclamar" al chat, el Asistente sí responde una vez,
    // a modo de acuse de recibo -- y después queda en silencio mientras se llena el formulario.
    iniciarContactoGuiado: function(desdeChat) {
        if (desdeChat) UIController.mostrarRespuestaIA('¡Listo! Ya puedes completar el formulario que apareció en pantalla.');
        this.mostrarContactoAdmin();
    },
    iniciarReclamoGuiado: function(desdeChat) {
        if (desdeChat) UIController.mostrarRespuestaIA('¡Listo! Ya puedes completar el formulario que apareció en pantalla.');
        this.mostrarLibroReclamaciones();
    },

    // ---------- Comunícate con el Admin ----------
    mostrarContactoAdmin: function() {
        UIController.mostrarFormularioEnMuro('Comunícate con el Administrador', '📩', '' +
            '<form id="formContactoAdmin" onsubmit="Institucional.enviarContacto(event)">' +
            '<input type="text" id="contactoNombre" placeholder="Tu nombre" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="email" id="contactoEmail" placeholder="Tu correo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<textarea id="contactoMensaje" placeholder="Escribe tu mensaje..." required rows="4" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<button type="submit" id="contactoBtnEnviar" style="width:100%;padding:12px;background:#7C3AED;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Enviar mensaje</button>' +
            '<div id="contactoEstado" style="margin-top:10px;text-align:center;"></div>' +
            '</form>');
    },
    enviarContacto: async function(e) {
        e.preventDefault();
        var estado = document.getElementById('contactoEstado');
        var boton = document.getElementById('contactoBtnEnviar');
        // Se desactiva el botón mientras se envía, para que un doble clic por impaciencia no
        // mande el mismo mensaje dos veces. Si falla, se reactiva para que pueda reintentar.
        boton.disabled = true;
        boton.textContent = 'Enviando...';
        estado.textContent = '';
        try {
            var { error } = await supabase.from('mensajes_contacto').insert({
                nombre: document.getElementById('contactoNombre').value,
                email: document.getElementById('contactoEmail').value,
                mensaje: document.getElementById('contactoMensaje').value
            });
            if (error) throw error;
            document.getElementById('formContactoAdmin').innerHTML = '<p style="text-align:center;color:#059669;">✅ ¡Mensaje enviado! Te responderemos a tu correo pronto.</p>';
        } catch (err) {
            estado.textContent = 'No se pudo enviar. Intenta de nuevo.';
            boton.disabled = false;
            boton.textContent = 'Enviar mensaje';
        }
    },

    // ---------- Libro de Reclamaciones ----------
    mostrarLibroReclamaciones: function() {
        UIController.mostrarFormularioEnMuro('Libro de Reclamaciones', '📋', '' +
            '<form id="formReclamo" onsubmit="Institucional.enviarReclamo(event)">' +
            '<select id="reclamoTipo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"><option value="">Tipo...</option><option value="reclamo">Reclamo</option><option value="queja">Queja</option></select>' +
            '<input type="text" id="reclamoNombre" placeholder="Nombre completo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoDocumento" placeholder="DNI / documento" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="email" id="reclamoEmail" placeholder="Correo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoTelefono" placeholder="Teléfono (opcional)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoBien" placeholder="Producto o servicio relacionado" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoMonto" placeholder="Monto reclamado (opcional, ej: 150.50)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<textarea id="reclamoDetalle" placeholder="Detalle de lo ocurrido" required rows="3" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<textarea id="reclamoPedido" placeholder="¿Qué solución esperas?" required rows="2" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<button type="submit" id="reclamoBtnEnviar" style="width:100%;padding:12px;background:#DC2626;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Registrar reclamo</button>' +
            '<div id="reclamoEstado" style="margin-top:10px;text-align:center;"></div>' +
            '</form>');
    },
    enviarReclamo: async function(e) {
        e.preventDefault();
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
                estado.textContent = 'El monto reclamado debe ser un número (ej: 150.50). Déjalo vacío si no aplica.';
                return;
            }
        }
        // Se desactiva el botón mientras se envía, para que un doble clic por impaciencia no
        // registre el mismo reclamo dos veces. Si falla, se reactiva para que pueda reintentar.
        boton.disabled = true;
        boton.textContent = 'Enviando...';
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
            document.getElementById('formReclamo').innerHTML = '<p style="text-align:center;color:#059669;">✅ Tu reclamo fue registrado. Nos comunicaremos contigo pronto.</p>';
        } catch (err) {
            estado.textContent = 'No se pudo registrar. Intenta de nuevo.';
            boton.disabled = false;
            boton.textContent = 'Registrar reclamo';
        }
    }
};
