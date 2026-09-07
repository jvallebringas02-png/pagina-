// ============================================
// INSTITUCIONAL: Patrocinadores, Publicidad, Quiénes Somos,
// Comunícate con el Admin, Libro de Reclamaciones
// ============================================
var Institucional = {

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
            var { data, error } = await supabase
                .from('contenido_administrable')
                .select('titulo, imagen_url, enlace')
                .eq('tipo_contenido', 'patrocinador')
                .eq('activo', true);
            if (!error && data && data.length > 0) lista = data;
        } catch (e) { /* se queda con el respaldo fijo */ }

        contenedor.innerHTML = lista.map(function(p) {
            return '<div class="sponsor-card"><div class="sponsor-name">' + p.titulo + '</div>' +
                '<button class="btn-sponsor" onclick="window.open(\'' + (p.enlace || '#') + '\', \'_blank\')">Visitar</button></div>';
        }).join('');
    },

    // ---------- Publicidad (dinámico, desde la base de datos, solo si hay algo activo) ----------
    cargarPublicidad: async function() {
        var contenedor = document.getElementById('publicidadSlot');
        if (!contenedor) return;
        try {
            var { data, error } = await supabase
                .from('contenido_administrable')
                .select('titulo, contenido, imagen_url, enlace')
                .eq('tipo_contenido', 'publicidad')
                .eq('activo', true)
                .limit(1);
            if (error || !data || data.length === 0) { contenedor.innerHTML = ''; return; }
            var ad = data[0];
            contenedor.innerHTML = '<a href="' + (ad.enlace || '#') + '" target="_blank" style="display:block;background:white;border-radius:12px;padding:14px;margin-bottom:16px;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
                (ad.imagen_url ? '<img src="' + ad.imagen_url + '" alt="' + ad.titulo + '" style="width:100%;border-radius:8px;margin-bottom:8px;">' : '') +
                '<strong style="display:block;">' + ad.titulo + '</strong><p style="margin:4px 0 0;font-size:13px;color:#6B7280;">' + (ad.contenido || '') + '</p>' +
                '</a>';
        } catch (e) { contenedor.innerHTML = ''; }
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
    mostrarQuienesSomos: function() {
        this.abrirModal('Quiénes Somos', '<p>remarket-db es una plataforma peruana de economía circular que conecta a vecinos y comercios para vender, donar e intercambiar productos de segunda mano. Creemos que darle una segunda vida a lo que ya tienes es una forma simple y poderosa de cuidar el planeta y fortalecer la comunidad.</p>');
    },

    // ---------- Comunícate con el Admin ----------
    mostrarContactoAdmin: function() {
        this.abrirModal('Comunícate con el Administrador', '' +
            '<form id="formContactoAdmin" onsubmit="Institucional.enviarContacto(event)">' +
            '<input type="text" id="contactoNombre" placeholder="Tu nombre" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="email" id="contactoEmail" placeholder="Tu correo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<textarea id="contactoMensaje" placeholder="Escribe tu mensaje..." required rows="4" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<button type="submit" style="width:100%;padding:12px;background:#7C3AED;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Enviar mensaje</button>' +
            '<div id="contactoEstado" style="margin-top:10px;text-align:center;"></div>' +
            '</form>');
    },
    enviarContacto: async function(e) {
        e.preventDefault();
        var estado = document.getElementById('contactoEstado');
        estado.textContent = 'Enviando...';
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
        }
    },

    // ---------- Libro de Reclamaciones ----------
    mostrarLibroReclamaciones: function() {
        this.abrirModal('Libro de Reclamaciones', '' +
            '<form id="formReclamo" onsubmit="Institucional.enviarReclamo(event)">' +
            '<select id="reclamoTipo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"><option value="">Tipo...</option><option value="reclamo">Reclamo</option><option value="queja">Queja</option></select>' +
            '<input type="text" id="reclamoNombre" placeholder="Nombre completo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoDocumento" placeholder="DNI / documento" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="email" id="reclamoEmail" placeholder="Correo" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoTelefono" placeholder="Teléfono (opcional)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoBien" placeholder="Producto o servicio relacionado" required style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<input type="text" id="reclamoMonto" placeholder="Monto reclamado (opcional)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;">' +
            '<textarea id="reclamoDetalle" placeholder="Detalle de lo ocurrido" required rows="3" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<textarea id="reclamoPedido" placeholder="¿Qué solución esperas?" required rows="2" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #E5E7EB;"></textarea>' +
            '<button type="submit" style="width:100%;padding:12px;background:#DC2626;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Registrar reclamo</button>' +
            '<div id="reclamoEstado" style="margin-top:10px;text-align:center;"></div>' +
            '</form>');
    },
    enviarReclamo: async function(e) {
        e.preventDefault();
        var estado = document.getElementById('reclamoEstado');
        estado.textContent = 'Enviando...';
        try {
            var { error } = await supabase.from('libro_reclamaciones').insert({
                tipo: document.getElementById('reclamoTipo').value,
                nombre_consumidor: document.getElementById('reclamoNombre').value,
                documento_identidad: document.getElementById('reclamoDocumento').value,
                email: document.getElementById('reclamoEmail').value,
                telefono: document.getElementById('reclamoTelefono').value || null,
                descripcion_bien_servicio: document.getElementById('reclamoBien').value,
                monto_reclamado: document.getElementById('reclamoMonto').value || null,
                detalle: document.getElementById('reclamoDetalle').value,
                pedido_consumidor: document.getElementById('reclamoPedido').value
            });
            if (error) throw error;
            document.getElementById('formReclamo').innerHTML = '<p style="text-align:center;color:#059669;">✅ Tu reclamo fue registrado. Nos comunicaremos contigo pronto.</p>';
        } catch (err) {
            estado.textContent = 'No se pudo registrar. Intenta de nuevo.';
        }
    }
};
