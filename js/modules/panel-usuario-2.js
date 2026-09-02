Object.assign(PanelUsuario, {
    // === PERFIL ESTILO FACEBOOK === [FASE 7 - Perfil de Usuario Completo]
    cargarMiPerfilFB: async function() {
        this.cargarPerfilUsuario(usuarioActual ? usuarioActual.id : null);
    },
    cargarPerfilUsuario: async function(usuarioId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        if (!usuarioId) usuarioId = usuarioActual.id;
        var esMiPerfil = usuarioId === usuarioActual.id;
        this._perfilViendoId = usuarioId;
        var container = document.getElementById('userFeedContainer');
        if (this._scrollObserver) this._scrollObserver.disconnect();
        container.innerHTML = '<div class="feed-loading"><div class="search-loading-spinner"></div><p>Cargando perfil...</p></div>';

        try {
            var { data: usuario, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', usuarioId)
                .single();
            if (error) throw error;

            // Contar publicaciones (solo aprobadas si es el perfil de otra persona)
            var qPublicaciones = supabase.from('productos').select('id', { count: 'exact', head: true }).eq('usuario_id', usuarioId);
            if (!esMiPerfil) qPublicaciones = qPublicaciones.eq('estado', 'aprobado');
            var { count: totalPublicaciones } = await qPublicaciones;

            var { count: totalSeguidores } = await supabase.from('seguidores').select('id', { count: 'exact', head: true }).eq('seguido_id', usuarioId);
            var { count: totalSiguiendo } = await supabase.from('seguidores').select('id', { count: 'exact', head: true }).eq('seguidor_id', usuarioId);

            var { data: productos } = await supabase.from('productos').select('likes_count').eq('usuario_id', usuarioId);
            var totalLikes = (productos || []).reduce(function(sum, p) { return sum + (p.likes_count || 0); }, 0);

            // Tarjeta de Confianza: calificaciones
            var promedioEstrellas = null, totalResenas = 0;
            try {
                var { data: calif } = await supabase.from('calificaciones').select('estrellas').eq('usuario_calificado_id', usuarioId);
                if (calif && calif.length) {
                    totalResenas = calif.length;
                    promedioEstrellas = (calif.reduce(function(s, c) { return s + c.estrellas; }, 0) / totalResenas);
                }
            } catch (e) { /* tabla calificaciones aún no creada en Supabase */ }

            var yaSigo = false;
            if (!esMiPerfil) {
                try {
                    var { data: sig } = await supabase.from('seguidores').select('id').eq('seguidor_id', usuarioActual.id).eq('seguido_id', usuarioId).maybeSingle();
                    yaSigo = !!sig;
                } catch (e) {}
            }

            var nombreCompleto = ((usuario.nombres || '') + ' ' + (usuario.apellidos || '')).trim() || 'Usuario';
            var inicial = nombreCompleto.charAt(0).toUpperCase();
            var fechaRegistro = usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long' }) : '';
            var fotoPerfil = usuario.foto_perfil || '';
            var fotoPortada = usuario.foto_portada || '';
            var ubicacion = usuario.ciudad ? '📍 ' + usuario.ciudad + (usuario.pais ? ', ' + usuario.pais : '') : '📍 Sin ubicación';
            var nombreUsuarioHandle = '@' + (usuario.nombre_usuario || (usuario.correo_electronico || 'usuario').split('@')[0]);

            var portadaHtml = esMiPerfil
                ? `<div class="perfil-portada" onclick="document.getElementById('inputPortada').click()">
                        ${fotoPortada ? `<img src="${fotoPortada}" alt="Portada">` : ''}
                        <div class="perfil-portada-hover">🖼️ Haz clic para cambiar portada</div>
                        <div class="perfil-portada-btn"><i class="fas fa-camera"></i> Editar portada</div>
                        <input type="file" id="inputPortada" accept="image/*" style="display:none;" onchange="PanelUsuario.subirPortada(this.files[0])">
                   </div>`
                : `<div class="perfil-portada">${fotoPortada ? `<img src="${fotoPortada}" alt="Portada">` : ''}</div>`;

            var avatarHtml = esMiPerfil
                ? `<div class="perfil-avatar-wrapper">
                        <div class="perfil-avatar">${fotoPerfil ? `<img src="${fotoPerfil}" alt="Foto de perfil">` : `<div class="perfil-avatar-text">${inicial}</div>`}</div>
                        <div class="perfil-avatar-btn" onclick="event.stopPropagation();document.getElementById('inputFotoPerfil').click()"><i class="fas fa-camera"></i></div>
                        <input type="file" id="inputFotoPerfil" accept="image/*" style="display:none;" onchange="PanelUsuario.subirFotoPerfil(this.files[0])">
                   </div>`
                : `<div class="perfil-avatar-wrapper"><div class="perfil-avatar">${fotoPerfil ? `<img src="${fotoPerfil}" alt="Foto de perfil">` : `<div class="perfil-avatar-text">${inicial}</div>`}</div></div>`;

            var botonesHtml = esMiPerfil
                ? `<button class="perfil-btn perfil-btn-secondary" onclick="PanelUsuario.editarPerfil()"><i class="fas fa-edit"></i> Editar perfil</button>`
                : `<button class="perfil-btn ${yaSigo ? 'perfil-btn-secondary' : 'perfil-btn-primary'}" id="perfilBtnSeguir" onclick="PanelUsuario.toggleSeguirDesdePerfil('${usuarioId}')">${yaSigo ? '✓ Siguiendo' : '➕ Seguir'}</button>
                   <button class="perfil-btn perfil-btn-secondary" onclick="PanelUsuario.iniciarChatDesdePerfil('${usuarioId}')"><i class="fas fa-comment"></i> Mensaje</button>`;

            var estrellasHtml = '';
            if (promedioEstrellas != null) {
                for (var s = 1; s <= 5; s++) estrellasHtml += '<span style="color:' + (s <= Math.round(promedioEstrellas) ? '#F59E0B' : '#D1D5DB') + ';">★</span>';
            }

            var html = `
                <div class="perfil-container">
                    ${portadaHtml}
                    <div class="perfil-info">
                        <div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;">
                            ${avatarHtml}
                            <div style="flex:1;min-width:200px;">
                                <h2 class="perfil-nombre">${this.escHtml(nombreCompleto)}</h2>
                                <div style="color:var(--texto-secundario);font-size:14px;margin-bottom:2px;">${this.escHtml(nombreUsuarioHandle)}</div>
                                <div class="perfil-datos">
                                    <span>${ubicacion}</span>
                                    ${fechaRegistro ? `<span>🗓️ Miembro desde ${fechaRegistro}</span>` : ''}
                                </div>
                            </div>
                            <div class="perfil-botones">${botonesHtml}</div>
                        </div>
                    </div>
                </div>

                <!-- TARJETA DE CONFIANZA -->
                <div style="background:#fff;border-radius:12px;padding:18px 20px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:flex;flex-wrap:wrap;gap:20px;align-items:center;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${promedioEstrellas != null ? `<span style="font-size:16px;">${estrellasHtml}</span><strong>${promedioEstrellas.toFixed(1)}/5</strong><span style="color:var(--texto-terciario);font-size:13px;">(${totalResenas})</span>` : `<span style="color:var(--texto-terciario);font-size:13px;">⭐ Sin calificaciones aún</span>`}
                    </div>
                    <div style="color:var(--texto-secundario);font-size:13px;">📦 ${totalPublicaciones || 0} publicaciones</div>
                    <div style="color:var(--texto-secundario);font-size:13px;">⏱️ Responde en menos de 1 hora</div>
                    ${usuario.biografia ? `<div style="width:100%;color:var(--texto-secundario);font-size:13px;border-top:1px solid var(--borde-suave);padding-top:10px;margin-top:4px;">${this.escHtml((usuario.biografia || '').substring(0, 200))}</div>` : ''}
                </div>

                <div class="perfil-estadisticas">
                    <div class="perfil-estadistica"><strong>${totalPublicaciones || 0}</strong><span>Publicaciones</span></div>
                    <div class="perfil-estadistica"><strong>${totalSeguidores || 0}</strong><span>Seguidores</span></div>
                    <div class="perfil-estadistica"><strong>${totalSiguiendo || 0}</strong><span>Siguiendo</span></div>
                    <div class="perfil-estadistica"><strong>${totalLikes || 0}</strong><span>Me gusta</span></div>
                </div>

                <div class="perfil-tabs">
                    <button class="perfil-tab active" data-tab="publicaciones" onclick="PanelUsuario.cambiarPestanaPerfil('publicaciones')"><i class="fas fa-newspaper"></i> Publicaciones</button>
                    <button class="perfil-tab" data-tab="acerca" onclick="PanelUsuario.cambiarPestanaPerfil('acerca')"><i class="fas fa-info-circle"></i> Acerca de</button>
                    <button class="perfil-tab" data-tab="resenas" onclick="PanelUsuario.cambiarPestanaPerfil('resenas')"><i class="fas fa-star"></i> Reseñas</button>
                </div>

                <div id="perfilContenido">
                    <div class="feed-loading"><div class="search-loading-spinner"></div><p>Cargando...</p></div>
                </div>
            `;

            container.innerHTML = html;
            this._perfilUsuarioObjActual = usuario;
            this.cambiarPestanaPerfil('publicaciones');

        } catch (e) {
            console.warn('Error cargando perfil:', e);
            container.innerHTML = '<div class="feed-empty"><p>No se pudo cargar el perfil.</p></div>';
        }
    },

    toggleSeguirDesdePerfil: async function(usuarioId) {
        var btn = document.getElementById('perfilBtnSeguir');
        try {
            var { data: existente } = await supabase.from('seguidores').select('id').eq('seguidor_id', usuarioActual.id).eq('seguido_id', usuarioId).maybeSingle();
            if (existente) {
                await supabase.from('seguidores').delete().eq('id', existente.id);
                if (btn) { btn.textContent = '➕ Seguir'; btn.classList.remove('perfil-btn-secondary'); btn.classList.add('perfil-btn-primary'); }
            } else {
                await supabase.from('seguidores').insert({ seguidor_id: usuarioActual.id, seguido_id: usuarioId });
                if (btn) { btn.textContent = '✓ Siguiendo'; btn.classList.remove('perfil-btn-primary'); btn.classList.add('perfil-btn-secondary'); }
            }
        } catch (e) { this.mostrarToast('No se pudo actualizar. Intenta de nuevo.'); }
    },

    iniciarChatDesdePerfil: async function(usuarioId) {
        try {
            var { data: convExistente } = await supabase.from('conversaciones').select('id')
                .or('and(comprador_id.eq.' + usuarioActual.id + ',vendedor_id.eq.' + usuarioId + '),and(comprador_id.eq.' + usuarioId + ',vendedor_id.eq.' + usuarioActual.id + ')')
                .maybeSingle();
            var convId = convExistente ? convExistente.id : null;
            if (!convId) {
                var { data: nueva, error } = await supabase.from('conversaciones').insert({ comprador_id: usuarioActual.id, vendedor_id: usuarioId }).select('id').single();
                if (error) throw error;
                convId = nueva.id;
            }
            this.menuClick('mensajes');
            var self = this;
            setTimeout(function() { self.abrirConversacion(convId); }, 300);
        } catch (e) { this.mostrarToast('No se pudo iniciar el chat.'); }
    },

    cambiarPestanaPerfil: function(tab) {
        document.querySelectorAll('.perfil-tab').forEach(function(el) {
            el.classList.remove('active');
        });
        var tabEl = document.querySelector('.perfil-tab[data-tab="' + tab + '"]');
        if (tabEl) tabEl.classList.add('active');

        var esMiPerfil = this._perfilViendoId === usuarioActual.id;
        var u = this._perfilUsuarioObjActual || usuarioActual;
        var container = document.getElementById('perfilContenido');
        if (tab === 'publicaciones') {
            if (esMiPerfil) {
                container.innerHTML = `
                    <div style="background:#fff;border-radius:12px;padding:32px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                        <div style="font-size:48px;margin-bottom:12px;">📦</div>
                        <p style="color:var(--texto-secundario);margin-bottom:16px;">Administra tus publicaciones (incluye borradores) desde "Mis Publicaciones" en el menú.</p>
                        <button class="btn-publicar" onclick="PanelUsuario.menuClick('publicaciones')">Ir a Mis Publicaciones</button>
                    </div>
                `;
            } else {
                this.cargarPublicacionesDeOtro(this._perfilViendoId);
            }
        } else if (tab === 'acerca') {
            container.innerHTML = `
                <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                    <h3 style="margin-bottom:12px;"><i class="fas fa-info-circle"></i> Acerca de</h3>
                    <p style="color:var(--texto-secundario);">${this.escHtml(u.biografia || 'Este usuario aún no ha escrito una biografía.')}</p>
                    ${u.ciudad ? `<p style="margin-top:12px;color:var(--texto-secundario);"><i class="fas fa-map-marker-alt"></i> ${this.escHtml(u.ciudad)}${u.pais ? ', ' + this.escHtml(u.pais) : ''}</p>` : ''}
                    ${u.sitio_web ? `<p style="margin-top:12px;"><i class="fas fa-globe"></i> <a href="${this.escHtml(u.sitio_web)}" target="_blank" rel="noopener">${this.escHtml(u.sitio_web)}</a></p>` : ''}
                    ${u.red_social ? `<p style="margin-top:12px;"><i class="fas fa-share-alt"></i> ${this.escHtml(u.red_social)}</p>` : ''}
                    ${esMiPerfil ? `<p style="margin-top:12px;color:var(--texto-secundario);"><i class="fas fa-envelope"></i> ${this.escHtml(u.correo_electronico || '')}</p>` : ''}
                </div>
            `;
        } else if (tab === 'resenas') {
            this.cargarResenasPerfil(this._perfilViendoId);
        }
    },

    cargarPublicacionesDeOtro: async function(usuarioId) {
        var container = document.getElementById('perfilContenido');
        try {
            var { data: productos } = await supabase.from('productos').select('*').eq('usuario_id', usuarioId).eq('estado', 'aprobado').order('created_at', { ascending: false });
            if (!productos || !productos.length) {
                container.innerHTML = '<div class="feed-empty"><div style="font-size:48px;margin-bottom:12px;">📭</div><p>Este usuario aún no tiene publicaciones.</p></div>';
                return;
            }
            var self = this;
            var html = '';
            for (var i = 0; i < productos.length; i++) {
                var autor = await self.obtenerAutor(productos[i].usuario_id);
                html += self.renderPost(productos[i], autor, false);
            }
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<div class="feed-empty"><p>Error al cargar publicaciones.</p></div>';
        }
    },

    cargarResenasPerfil: async function(usuarioId) {
        var container = document.getElementById('perfilContenido');
        var self = this;
        try {
            var { data: resenas } = await supabase.from('calificaciones').select('*').eq('usuario_calificado_id', usuarioId).order('created_at', { ascending: false });
            if (!resenas || !resenas.length) {
                container.innerHTML = '<div class="feed-empty"><div style="font-size:48px;margin-bottom:12px;">⭐</div><p>Sin reseñas todavía.</p></div>';
                return;
            }
            var promedio = resenas.reduce(function(s, r) { return s + r.estrellas; }, 0) / resenas.length;
            var html = '<div style="background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);"><strong style="font-size:18px;">' + promedio.toFixed(1) + '/5</strong> <span style="color:var(--texto-secundario);font-size:13px;">(' + resenas.length + ' reseñas)</span></div>';
            for (var i = 0; i < resenas.length; i++) {
                var r = resenas[i];
                var autor = await self.obtenerAutor(r.usuario_califica_id);
                var nombre = autor ? ((autor.nombres || '') + ' ' + (autor.apellidos || '')).trim() : 'Usuario';
                var estrellasHtml = '';
                for (var s = 1; s <= 5; s++) estrellasHtml += '<span style="color:' + (s <= r.estrellas ? '#F59E0B' : '#D1D5DB') + ';">★</span>';
                html += '<div style="background:#fff;border-radius:10px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;"><strong style="font-size:14px;">' + self.escHtml(nombre) + '</strong><span style="font-size:12px;color:var(--texto-terciario);">' + self.tiempoRelativo(r.created_at) + '</span></div>' +
                    '<div style="margin:4px 0;">' + estrellasHtml + '</div>' +
                    (r.comentario ? '<div style="font-size:13px;color:var(--texto-secundario);">' + self.escHtml(r.comentario) + '</div>' : '') +
                    '</div>';
            }
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<div class="feed-empty"><p>Sin reseñas todavía.</p></div>';
        }
    },

    editarPerfil: function() {
        alert('✏️ Editar perfil - Próximamente: podrás cambiar biografía, ciudad y más');
    },

    subirFotoPerfil: async function(file) {
        if (!file) return;
        try {
            var path = 'perfiles/' + usuarioActual.id + '/foto_perfil_' + Date.now() + '.jpg';
            var { data, error } = await supabase.storage
                .from('avatars')
                .upload(path, file);
            if (error) throw error;
            
            var { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(path);
                
            await supabase
                .from('usuarios')
                .update({ foto_perfil: urlData.publicUrl })
                .eq('id', usuarioActual.id);
                
            this.mostrarToast('✅ Foto de perfil actualizada');
            this.cargarMiPerfilFB();
        } catch (e) {
            this.mostrarToast('Error al subir foto: ' + e.message);
        }
    },

    subirPortada: async function(file) {
        if (!file) return;
        try {
            var path = 'portadas/' + usuarioActual.id + '/portada_' + Date.now() + '.jpg';
            var { data, error } = await supabase.storage
                .from('portadas')
                .upload(path, file);
            if (error) throw error;
            
            var { data: urlData } = supabase.storage
                .from('portadas')
                .getPublicUrl(path);
                
            await supabase
                .from('usuarios')
                .update({ foto_portada: urlData.publicUrl })
                .eq('id', usuarioActual.id);
                
            this.mostrarToast('✅ Portada actualizada');
            this.cargarMiPerfilFB();
        } catch (e) {
            this.mostrarToast('Error al subir portada: ' + e.message);
        }
    },

    // === COMPARTIR ESTILO FACEBOOK === [FASE 4 - Compartir Publicaciones]
    abrirModalCompartirFB: function(productoId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        this._productoCompartiendo = productoId;

        document.getElementById('compartirTexto').value = '';
        document.getElementById('compartirBuscarPersona').value = '';
        document.getElementById('compartirResultadosPersona').innerHTML = '';
        document.getElementById('compartirSugerenciasIA').innerHTML = '';
        document.getElementById('compartirAlert').style.display = 'none';
        document.getElementById('compartirFiltroRubro').value = '';
        document.querySelectorAll('.compartir-filtro-zona').forEach(function(b) { b.classList.remove('activo'); });
        this._destinatariosSeleccionados = [];
        this.renderChipsSeleccionados();

        // El acordeón siempre nace con "Enviar por mensaje" abierto, y las demás cerradas
        document.querySelectorAll('.compartir-opcion').forEach(function(el) { el.classList.remove('abierta'); });
        document.getElementById('compartirOpcionMensaje').classList.add('abierta');

        this.cargarVistaPreviaCompartir(productoId);
        document.getElementById('modalCompartirFB').style.display = 'flex';
    },

    toggleOpcionCompartir: function(nombre) {
        var idContenido = nombre === 'mensaje' ? 'compartirContenidoMensaje' : 'compartirContenidoRepostear';
        var opcion = document.getElementById(idContenido).closest('.compartir-opcion');
        var yaAbierta = opcion.classList.contains('abierta');

        // Acordeón: solo una sección expandida a la vez, como en Facebook
        document.querySelectorAll('.compartir-opcion').forEach(function(el) { el.classList.remove('abierta'); });
        if (!yaAbierta) opcion.classList.add('abierta');
    },

    cerrarModalCompartir: function() {
        document.getElementById('modalCompartirFB').style.display = 'none';
    },

    cargarVistaPreviaCompartir: async function(productoId) {
        try {
            var { data: producto, error } = await supabase
                .from('productos')
                .select('*, usuarios!productos_usuario_id_fkey(nombres, apellidos)')
                .eq('id', productoId)
                .maybeSingle();
                
            if (error || !producto) return;
            
            var autor = producto.usuarios || {};
            var nombreAutor = ((autor.nombres || '') + ' ' + (autor.apellidos || '')).trim() || 'Usuario';
            var titulo = producto.titulo || 'Sin título';
            var desc = producto.descripcion || '';
            var fecha = this.tiempoRelativo(producto.created_at);
            var imagen = (producto.fotos && producto.fotos.length) ? producto.fotos[0] : null;
            
            document.getElementById('compartirPreviewNombre').textContent = nombreAutor;
            document.getElementById('compartirPreviewAvatar').textContent = nombreAutor.charAt(0).toUpperCase();
            document.getElementById('compartirPreviewFecha').textContent = fecha;
            document.getElementById('compartirPreviewTitulo').textContent = titulo;
            document.getElementById('compartirPreviewDesc').textContent = desc.substring(0, 120);
            
            var imgContainer = document.getElementById('compartirPreviewImagen');
            if (imagen) {
                imgContainer.innerHTML = `<img src="${imagen}" alt="${titulo}">`;
            } else {
                imgContainer.innerHTML = '📷';
            }

            this._categoriaProductoCompartiendo = producto.categoria || null;
            this.sugerirPersonasInteresadas(producto.categoria);
        } catch (e) {
            console.warn('Error cargando vista previa:', e);
        }
    },

    // Contactos recientes del chat: prioridad #1 en las sugerencias de Compartir, igual que Facebook
    obtenerContactosRecientes: async function(limite) {
        try {
            var bloqueados = await this.obtenerBloqueados();
            var { data: convs, error } = await supabase.from('conversaciones').select('comprador_id, vendedor_id, updated_at')
                .or('comprador_id.eq.' + usuarioActual.id + ',vendedor_id.eq.' + usuarioActual.id)
                .order('updated_at', { ascending: false }).limit(15);
            if (error) throw error;
            var vistos = {};
            var contactos = [];
            for (var i = 0; i < (convs || []).length && contactos.length < (limite || 5); i++) {
                var otroId = convs[i].comprador_id === usuarioActual.id ? convs[i].vendedor_id : convs[i].comprador_id;
                if (vistos[otroId] || bloqueados.indexOf(otroId) !== -1) continue;
                vistos[otroId] = true;
                var otro = await this.obtenerAutor(otroId);
                if (otro) contactos.push({ id: otroId, nombres: otro.nombres, apellidos: otro.apellidos, foto_perfil: otro.foto_perfil });
            }
            return contactos;
        } catch (e) {
            console.warn('Error obteniendo contactos recientes:', e);
            return [];
        }
    },

    // Sugerencia de IA: busca usuarios cuyos intereses coinciden con la categoría del producto
    sugerirPersonasInteresadas: async function(categoria) {
        var cont = document.getElementById('compartirSugerenciasIA');
        if (!cont) return;
        cont.innerHTML = '<div class="user-picker-empty">🤖 Buscando sugerencias...</div>';
        var self = this;
        function pintarCirculos(titulo, candidatos) {
            if (!candidatos.length) return false;
            cont.innerHTML = '<div style="font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">' + titulo + '</div>' +
                '<div class="compartir-contactos-row">' + candidatos.map(function(u) {
                    var nombre = ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
                    var inicial = nombre.charAt(0).toUpperCase() || 'U';
                    var nombreEscapado = self.escHtml(nombre).replace(/'/g, "\\'");
                    var fotoHtml = u.foto_perfil ? '<img src="' + u.foto_perfil + '">' : inicial;
                    return '<div class="compartir-contacto-circulo" id="pickerItem-' + u.id + '" onclick="PanelUsuario.seleccionarPersonaPicker(\'' + u.id + '\', \'' + nombreEscapado + '\', \'compartir\')">' +
                        '<div class="compartir-contacto-avatar-wrap"><div class="compartir-contacto-avatar">' + fotoHtml + '</div><span class="compartir-contacto-check">✓</span></div>' +
                        '<div class="compartir-contacto-nombre">' + self.escHtml(nombre.split(' ')[0]) + '</div></div>';
                }).join('') + '</div>';
            return true;
        }
        function pintarLista(titulo, candidatos, etiquetaFn) {
            if (!candidatos.length) return false;
            cont.innerHTML = '<div style="font-size:12px;color:var(--texto-secundario);margin-bottom:6px;">' + titulo + '</div>' +
                candidatos.map(function(u) {
                    var nombre = ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
                    var inicial = nombre.charAt(0).toUpperCase() || 'U';
                    var nombreEscapado = self.escHtml(nombre).replace(/'/g, "\\'");
                    var fotoHtml = u.foto_perfil ? '<img src="' + u.foto_perfil + '" class="user-picker-avatar" style="border-radius:50%;width:44px;height:44px;object-fit:cover;">' : '<div class="user-picker-avatar" style="width:44px;height:44px;">' + inicial + '</div>';
                    return '<div class="user-picker-item" id="pickerItem-' + u.id + '" onclick="PanelUsuario.seleccionarPersonaPicker(\'' + u.id + '\', \'' + nombreEscapado + '\', \'compartir\')">' +
                        '<div class="user-picker-avatar-wrap">' + fotoHtml + '<span class="check-seleccionado">✓</span></div>' +
                        '<div style="flex:1;"><div class="user-picker-name">' + self.escHtml(nombre) + '</div>' +
                        '<div class="user-picker-email">' + etiquetaFn(u) + '</div></div></div>';
                }).join('');
            return true;
        }
        try {
            // Prioridad 1: gente con la que ya chateaste antes, como círculos, igual que en Facebook
            var recientes = await this.obtenerContactosRecientes(6);
            if (pintarCirculos('🕑 Contactos recientes', recientes)) return;

            // Prioridad 2: si no hay contactos, gente interesada en la categoría del producto
            if (categoria) {
                var bloqueados = await this.obtenerBloqueados();
                var { data, error } = await supabase
                    .from('usuarios')
                    .select('id, nombres, apellidos, foto_perfil, categoria')
                    .ilike('categoria', '%' + categoria + '%')
                    .neq('id', usuarioActual.id)
                    .limit(5);
                if (error) throw error;
                var candidatos = (data || []).filter(function(u) { return bloqueados.indexOf(u.id) === -1; });
                if (pintarLista('✨ Personas interesadas en <strong>' + this.escHtml(categoria) + '</strong>:', candidatos, function(u) { return '✨ Interesado en ' + self.escHtml(u.categoria || categoria); })) return;
            }
            cont.innerHTML = '<div class="user-picker-empty">💡 Busca por nombre, categoría o zona arriba (ej: "gente de tecnología cerca de mí").</div>';
        } catch (e) {
            cont.innerHTML = '';
            console.warn('No se pudo cargar sugerencias:', e);
        }
    },

    // === CONFIGURACIÓN (intereses y localidad) ===
    // === REPORTAR PUBLICACIÓN ===
    _productoReportando: null,

    OPCIONES_REPORTE_PUBLICACION: ['Estafa o fraude', 'Contenido ofensivo', 'Precio falso o engañoso', 'Producto o servicio prohibido', 'Otro'],
    OPCIONES_REPORTE_USUARIO: ['Acoso o comportamiento abusivo', 'Estafa o fraude', 'Suplantación de identidad', 'Spam', 'Otro'],
    _renderOpcionesReportar: function(opciones) {
        document.getElementById('reportarOpciones').innerHTML = opciones.map(function(op, i) {
            return '<label style="display:flex;align-items:center;gap:8px;font-size:14px;"><input type="radio" name="reportarMotivo" value="' + op + '"' + (i === 0 ? ' checked' : '') + '> ' + op + '</label>';
        }).join('');
    },
    abrirModalReportar: function(productoId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        this._productoReportando = productoId;
        this._usuarioReportando = null;
        document.getElementById('reportarTitulo').textContent = 'Reportar publicación';
        document.getElementById('reportarPregunta').textContent = '¿Por qué quieres reportar esta publicación?';
        this._renderOpcionesReportar(this.OPCIONES_REPORTE_PUBLICACION);
        document.getElementById('reportarDetalle').value = '';
        document.getElementById('reportarAlert').style.display = 'none';
        document.getElementById('modalReportar').style.display = 'flex';
    },
    abrirModalReportarUsuario: function(usuarioId, nombre) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        this._productoReportando = null;
        this._usuarioReportando = usuarioId;
        document.getElementById('reportarTitulo').textContent = 'Reportar a ' + nombre;
        document.getElementById('reportarPregunta').textContent = '¿Por qué quieres reportar a este usuario?';
        this._renderOpcionesReportar(this.OPCIONES_REPORTE_USUARIO);
        document.getElementById('reportarDetalle').value = '';
        document.getElementById('reportarAlert').style.display = 'none';
        document.getElementById('modalReportar').style.display = 'flex';
    },

    cerrarModalReportar: function() {
        document.getElementById('modalReportar').style.display = 'none';
    },

    enviarReporte: async function() {
        var alertEl = document.getElementById('reportarAlert');
        var motivoRadio = document.querySelector('input[name="reportarMotivo"]:checked');
        var motivo = motivoRadio ? motivoRadio.value : 'Otro';
        var detalle = document.getElementById('reportarDetalle').value.trim();
        try {
            var { error } = await supabase.from('reportes').insert({
                producto_id: this._productoReportando || null,
                usuario_reportado_id: this._usuarioReportando || null,
                usuario_reporta_id: usuarioActual.id,
                motivo: motivo,
                detalle: detalle || null,
                estado: 'pendiente'
            });
            if (error) throw error;
            this.cerrarModalReportar();
            this.mostrarToast('✅ Gracias por avisarnos. Vamos a revisar esta publicación.');
        } catch (e) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = 'No se pudo enviar el reporte: ' + (e.message || 'intenta de nuevo');
            alertEl.style.display = 'block';
        }
    },

    abrirModalConfiguracion: function() {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var actuales = usuarioActual.categoria ? usuarioActual.categoria.split(',').map(function(c) { return c.trim(); }) : [];
        document.querySelectorAll('#configInteresesGrid input[type=checkbox]').forEach(function(chk) {
            chk.checked = actuales.indexOf(chk.value) !== -1;
        });
        document.getElementById('configCiudad').value = usuarioActual.ciudad || (typeof UbicacionUsuario !== 'undefined' ? UbicacionUsuario.ciudad.replace('🌍 ', '') : '') || '';
        document.getElementById('configPais').value = usuarioActual.pais || (typeof UbicacionUsuario !== 'undefined' ? UbicacionUsuario.pais : '') || '';
        document.getElementById('configNotifMensajes').checked = usuarioActual.notif_mensajes !== false;
        document.getElementById('configNotifComentarios').checked = usuarioActual.notif_comentarios !== false;
        document.getElementById('configNotifLikes').checked = usuarioActual.notif_likes !== false;
        var privacidadActual = usuarioActual.privacidad_mensajes || 'todos';
        var radioPriv = document.querySelector('input[name="configPrivacidad"][value="' + privacidadActual + '"]');
        if (radioPriv) radioPriv.checked = true;
        document.getElementById('configNuevaPassword').value = '';
        document.getElementById('configNuevoCorreo').value = '';
        document.getElementById('configAlert').style.display = 'none';
        document.getElementById('configPasswordAlert').style.display = 'none';
        document.getElementById('configCorreoAlert').style.display = 'none';
        document.getElementById('modalConfiguracion').style.display = 'flex';
    },

    cerrarModalConfiguracion: function() {
        document.getElementById('modalConfiguracion').style.display = 'none';
    },

    guardarConfiguracion: async function() {
        var alertEl = document.getElementById('configAlert');
        var seleccionados = Array.from(document.querySelectorAll('#configInteresesGrid input[type=checkbox]:checked')).map(function(chk) { return chk.value; });
        var categoria = seleccionados.length ? seleccionados.join(', ') : 'General';
        var ciudad = document.getElementById('configCiudad').value.trim();
        var pais = document.getElementById('configPais').value.trim();
        var notifMensajes = document.getElementById('configNotifMensajes').checked;
        var notifComentarios = document.getElementById('configNotifComentarios').checked;
        var notifLikes = document.getElementById('configNotifLikes').checked;
        var privacidadRadio = document.querySelector('input[name="configPrivacidad"]:checked');
        var privacidad = privacidadRadio ? privacidadRadio.value : 'todos';
        try {
            var { error } = await supabase.from('usuarios').update({
                categoria: categoria,
                ciudad: ciudad || null,
                pais: pais || null,
                notif_mensajes: notifMensajes,
                notif_comentarios: notifComentarios,
                notif_likes: notifLikes,
                privacidad_mensajes: privacidad
            }).eq('id', usuarioActual.id);
            if (error) throw error;
            usuarioActual.categoria = categoria;
            usuarioActual.ciudad = ciudad || null;
            usuarioActual.pais = pais || null;
            usuarioActual.notif_mensajes = notifMensajes;
            usuarioActual.notif_comentarios = notifComentarios;
            usuarioActual.notif_likes = notifLikes;
            usuarioActual.privacidad_mensajes = privacidad;
            window.usuarioActual = usuarioActual;
            if (ciudad && typeof UbicacionUsuario !== 'undefined') {
                UbicacionUsuario.ciudad = ciudad;
                UbicacionUsuario.pais = pais || UbicacionUsuario.pais;
                UbicacionUsuario.actualizarUI();
            }
            this.actualizarTarjetasUsuario();
            this.mostrarToast('✅ Configuración guardada');
            this.cerrarModalConfiguracion();
        } catch (e) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = 'Error al guardar: ' + (e.message || 'intenta de nuevo');
            alertEl.style.display = 'block';
        }
    },

    cambiarPasswordCuenta: async function() {
        var alertEl = document.getElementById('configPasswordAlert');
        var nueva = document.getElementById('configNuevaPassword').value;
        if (!nueva || nueva.length < 6) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = 'La contraseña debe tener al menos 6 caracteres';
            alertEl.style.display = 'block';
            return;
        }
        try {
            var { error } = await supabase.auth.updateUser({ password: nueva });
            if (error) throw error;
            document.getElementById('configNuevaPassword').value = '';
            alertEl.className = 'alert alert-success';
            alertEl.textContent = '✅ Contraseña actualizada';
            alertEl.style.display = 'block';
        } catch (e) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = 'No se pudo cambiar: ' + (e.message || 'intenta de nuevo');
            alertEl.style.display = 'block';
        }
    },

    cambiarCorreoCuenta: async function() {
        var alertEl = document.getElementById('configCorreoAlert');
        var nuevo = document.getElementById('configNuevoCorreo').value.trim();
        if (!nuevo || nuevo.indexOf('@') === -1) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = 'Ingresa un correo válido';
            alertEl.style.display = 'block';
            return;
        }
        try {
            var { error } = await supabase.auth.updateUser({ email: nuevo });
            if (error) throw error;
            alertEl.className = 'alert alert-success';
            alertEl.textContent = '✅ Revisa tu correo actual y el nuevo para confirmar el cambio';
            alertEl.style.display = 'block';
        } catch (e) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = 'No se pudo cambiar: ' + (e.message || 'intenta de nuevo');
            alertEl.style.display = 'block';
        }
    },

    confirmarCompartirFB: async function() {
        var productoId = this._productoCompartiendo;
        var texto = document.getElementById('compartirTexto').value.trim();
        
        try {
            var { data: existente } = await supabase
                .from('reposts')
                .select('id')
                .eq('usuario_id', usuarioActual.id)
                .eq('producto_id', productoId)
                .maybeSingle();
                
            if (existente) {
                await supabase
                    .from('reposts')
                    .update({ comentario: texto || null })
                    .eq('id', existente.id);
            } else {
                await supabase
                    .from('reposts')
                    .insert({ 
                        usuario_id: usuarioActual.id, 
                        producto_id: productoId, 
                        comentario: texto || null 
                    });
            }
            
            this.mostrarToast('✅ Publicación compartida en tu perfil');
            this.cerrarModalCompartir();
            this.cargarFeed();
        } catch (e) {
            this.mostrarToast('Error al compartir: ' + (e.message || 'intenta de nuevo'));
        }
    },

    // === COMENTARIOS ESTILO FACEBOOK === [FASE 4 - Comentarios]
    toggleComentarios: async function(productoId) {
        var box = document.getElementById('commentsBox-' + productoId);
        if (!box) return;
        var abrir = box.style.display === 'none';
        box.style.display = abrir ? 'block' : 'none';
        if (abrir) await this.cargarComentariosFB(productoId);
    },

    cargarComentariosFB: async function(productoId) {
        var lista = document.getElementById('commentsList-' + productoId);
        if (!lista) return;
        lista.innerHTML = '<span style="color:var(--texto-terciario);">Cargando comentarios...</span>';
        try {
            var { data: comentarios, error } = await supabase
                .from('comentarios')
                .select('*')
                .eq('producto_id', productoId)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            if (!comentarios || !comentarios.length) { 
                lista.innerHTML = '<span style="color:var(--texto-terciario);">Sé el primero en comentar.</span>'; 
                return; 
            }
            
            var autoresCache = {};
            var html = '';
            for (var i = 0; i < comentarios.length; i++) {
                var c = comentarios[i];
                var nombre = 'Usuario';
                var foto = '';
                if (c.usuario_id) {
                    if (autoresCache[c.usuario_id]) {
                        nombre = autoresCache[c.usuario_id].nombre;
                        foto = autoresCache[c.usuario_id].foto;
                    } else {
                        var { data: u } = await supabase
                            .from('usuarios')
                            .select('nombres, apellidos, foto_perfil')
                            .eq('id', c.usuario_id)
                            .maybeSingle();
                        if (u) { 
                            nombre = ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
                            foto = u.foto_perfil || '';
                            autoresCache[c.usuario_id] = { nombre: nombre, foto: foto };
                        }
                    }
                }
                var inicial = nombre.charAt(0).toUpperCase();
                var fotoHtml = foto ? `<img src="${foto}" alt="${nombre}">` : inicial;
                var esMio = usuarioActual && c.usuario_id === usuarioActual.id;
                
                html += `
                    <div class="comment-item" id="comment-${c.id}">
                        <div class="comment-avatar">${fotoHtml}</div>
                        <div class="comment-body">
                            <div class="comment-header">
                                <span class="comment-name">${this.escHtml(nombre)}</span>
                                <span class="comment-time">${this.tiempoRelativo(c.created_at)}</span>
                            </div>
                            <div class="comment-text">${this.escHtml(c.texto)}</div>
                            <div class="comment-actions">
                                <button onclick="PanelUsuario.likeComentario('${c.id}')"><i class="far fa-thumbs-up"></i> Me gusta</button>
                                ${esMio ? `<button class="delete-btn" onclick="PanelUsuario.eliminarComentario('${c.id}')"><i class="fas fa-trash"></i> Eliminar</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
            lista.innerHTML = html;
        } catch (e) {
            lista.innerHTML = '<span style="color:var(--texto-terciario);">No se pudieron cargar los comentarios.</span>';
        }
    },

    enviarComentarioFB: async function(productoId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var input = document.getElementById('commentInput-' + productoId);
        var texto = input ? input.value.trim() : '';
        if (!texto) return;
        
        try {
            var { data: comentario, error } = await supabase
                .from('comentarios')
                .insert({ 
                    usuario_id: usuarioActual.id, 
                    producto_id: productoId, 
                    texto: texto 
                })
                .select()
                .single();
            if (error) throw error;
            
            if (input) input.value = '';
            
            var lista = document.getElementById('commentsList-' + productoId);
            if (lista) {
                var nombreCompleto = ((usuarioActual.nombres || '') + ' ' + (usuarioActual.apellidos || '')).trim() || 'Usuario';
                var inicial = nombreCompleto.charAt(0).toUpperCase();
                var foto = usuarioActual.foto_perfil || '';
                var fotoHtml = foto ? `<img src="${foto}" alt="${nombreCompleto}">` : inicial;
                
                var htmlComentario = `
                    <div class="comment-item" id="comment-${comentario.id}" style="animation: aparecerComentario 0.3s ease;">
                        <div class="comment-avatar">${fotoHtml}</div>
                        <div class="comment-body">
                            <div class="comment-header">
                                <span class="comment-name">${this.escHtml(nombreCompleto)}</span>
                                <span class="comment-time">Ahora</span>
                            </div>
                            <div class="comment-text">${this.escHtml(texto)}</div>
                            <div class="comment-actions">
                                <button onclick="PanelUsuario.likeComentario('${comentario.id}')"><i class="far fa-thumbs-up"></i> Me gusta</button>
                                <button class="delete-btn" onclick="PanelUsuario.eliminarComentario('${comentario.id}')"><i class="fas fa-trash"></i> Eliminar</button>
                            </div>
                        </div>
                    </div>
                `;
                lista.insertAdjacentHTML('afterbegin', htmlComentario);
                // Quitar el mensaje "Sé el primero..."
                var emptyMsg = lista.querySelector('span');
                if (emptyMsg && emptyMsg.textContent.includes('primero')) emptyMsg.remove();
            }
            
            var countEl = document.getElementById('commentsCount-' + productoId);
            var countBoxEl = document.getElementById('commentsCountBox-' + productoId);
            if (countEl) {
                var nuevoCount = parseInt(countEl.textContent || '0', 10) + 1;
                countEl.textContent = nuevoCount;
                if (countBoxEl) countBoxEl.textContent = nuevoCount;
                await supabase
                    .from('productos')
                    .update({ comentarios_count: nuevoCount })
                    .eq('id', productoId);
            }
            
        } catch (e) {
            this.mostrarToast('Error al comentar: ' + (e.message || 'intenta de nuevo'));
        }
    },

    likeComentario: async function(comentarioId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        // Aquí implementarías la tabla 'comentarios_likes' en Supabase
        this.mostrarToast('❤️ Me gusta en comentario (próximamente)');
    },

    eliminarComentario: async function(comentarioId) {
        if (!confirm('¿Eliminar este comentario?')) return;
        try {
            await supabase.from('comentarios').delete().eq('id', comentarioId);
            var el = document.getElementById('comment-' + comentarioId);
            if (el) el.remove();
            this.mostrarToast('🗑️ Comentario eliminado');
        } catch (e) {
            this.mostrarToast('Error al eliminar');
        }
    },

    // === LIKES === [FASE 4.2 - Sistema de Likes]
    toggleLike: async function(productoId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var btn = document.getElementById('likeBtn-' + productoId);
        var countEl = document.getElementById('likesCount-' + productoId);
        if (btn) btn.disabled = true;
        try {
            var { data: existente } = await supabase.from('likes').select('id').eq('usuario_id', usuarioActual.id).eq('producto_id', productoId).maybeSingle();
            var count = parseInt((countEl && countEl.textContent) || '0', 10);
            if (existente) {
                await supabase.from('likes').delete().eq('id', existente.id);
                count = Math.max(0, count - 1);
                if (btn) { btn.classList.remove('active-like'); btn.innerHTML = '👍 Me gusta'; }
            } else {
                await supabase.from('likes').insert({ usuario_id: usuarioActual.id, producto_id: productoId });
                count = count + 1;
                if (btn) { btn.classList.add('active-like'); btn.innerHTML = '💜 Me gusta'; }
            }
            if (countEl) countEl.textContent = count;
            supabase.from('productos').update({ likes_count: count }).eq('id', productoId).then(function(){}, function(){});
        } catch (e) {
            console.warn('Error al dar like:', e);
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    // === GUARDAR FAVORITO === [FASE 4 - Favoritos]
    accionFeed: function(tipo, productoId) {
        if (tipo === 'save') {
            this.toggleFavorito(productoId);
        }
    },

    toggleFavorito: async function(productoId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var btn = document.getElementById('saveBtn-' + productoId);
        if (btn) btn.disabled = true;
        try {
            var { data: existente } = await supabase.from('favoritos').select('id').eq('usuario_id', usuarioActual.id).eq('producto_id', productoId).maybeSingle();
            if (existente) {
                await supabase.from('favoritos').delete().eq('id', existente.id);
                if (btn) { btn.classList.remove('active-like'); btn.innerHTML = '🔖 Guardar'; }
                this.mostrarToast('Quitado de favoritos');
            } else {
                await supabase.from('favoritos').insert({ usuario_id: usuarioActual.id, producto_id: productoId });
                if (btn) { btn.classList.add('active-like'); btn.innerHTML = '✅ Guardado'; }
                this.mostrarToast('🔖 Guardado en favoritos');
            }
        } catch (e) {
            this.mostrarToast('Error al guardar');
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    // === ACCIONES SOCIALES (Seguir, Bloquear, Preferido) === [FASE 5 - Funciones Sociales]
    toggleMenuAutor: function(postId) {
        var el = document.getElementById('autorMenu-' + postId);
        if (!el) return;
        var abrir = !el.classList.contains('abierto');
        document.querySelectorAll('.autor-menu-dropdown.abierto').forEach(function(d) { d.classList.remove('abierto'); });
        if (abrir) el.classList.add('abierto');
    },

    toggleSeguir: async function(autorUid, postId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        if (autorUid === usuarioActual.id) { this.mostrarToast('No puedes seguirte a ti mismo'); return; }
        var btn = document.getElementById('seguirBtn-' + postId);
        try {
            var { data: existente } = await supabase.from('seguidores').select('id').eq('seguidor_id', usuarioActual.id).eq('seguido_id', autorUid).maybeSingle();
            if (existente) {
                await supabase.from('seguidores').delete().eq('id', existente.id);
                if (btn) btn.textContent = '➕ Seguir';
                this.mostrarToast('Dejaste de seguir a este usuario');
            } else {
                await supabase.from('seguidores').insert({ seguidor_id: usuarioActual.id, seguido_id: autorUid });
                if (btn) btn.textContent = '✅ Siguiendo';
                this.mostrarToast('👤 Ahora sigues a este usuario');
            }
        } catch (e) {
            this.mostrarToast('Error al seguir');
        }
        this.toggleMenuAutor(postId);
    },

    toggleFavoritoUsuario: async function(autorUid, postId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var btn = document.getElementById('prefBtn-' + postId);
        try {
            var { data: existente } = await supabase.from('usuarios_preferidos').select('id').eq('usuario_id', usuarioActual.id).eq('favorito_id', autorUid).maybeSingle();
            if (existente) {
                await supabase.from('usuarios_preferidos').delete().eq('id', existente.id);
                if (btn) btn.textContent = '⭐ Marcar preferido';
                this.mostrarToast('Quitado de preferidos');
            } else {
                await supabase.from('usuarios_preferidos').insert({ usuario_id: usuarioActual.id, favorito_id: autorUid });
                if (btn) btn.textContent = '✅ Es preferido';
                this.mostrarToast('⭐ Usuario marcado como preferido');
            }
        } catch (e) {
            this.mostrarToast('Error al marcar preferido');
        }
        this.toggleMenuAutor(postId);
    },

    toggleBloqueado: async function(autorUid, postId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        if (!confirm('¿Bloquear a este usuario? Ya no verás sus publicaciones en tu feed.')) return;
        try {
            await supabase.from('bloqueados').insert({ bloqueador_id: usuarioActual.id, bloqueado_id: autorUid });
            this._bloqueadosCache = null;
            this.mostrarToast('🚫 Usuario bloqueado');
            this.toggleMenuAutor(postId);
            this.cargarFeed();
        } catch (e) {
            this.mostrarToast('Error al bloquear');
        }
    },
});
