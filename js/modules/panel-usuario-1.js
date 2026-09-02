var PanelUsuario = {
    // === MENÚ DE PERFIL === [FASE 2.2 - Barra Superior Mejorada]
    toggleMenuPerfil: function() {
        var el = document.getElementById('userMenuDropdown');
        if (el) el.classList.toggle('abierto');
    },
    cerrarMenuPerfil: function() {
        var el = document.getElementById('userMenuDropdown');
        if (el) el.classList.remove('abierto');
    },

    // === MOSTRAR/OCULTAR PANEL === [FASE 2.1 - Layout de 3 Columnas]
    mostrar: function() {
        document.getElementById('publicView').classList.add('hidden');
        document.getElementById('userPanelView').classList.add('active');
        var buscador = document.getElementById('dynamicSearch');
        if (buscador) buscador.value = ''; // el panel empieza con el buscador limpio, sin arrastrar lo que se escribió en la página pública
        this.moverWidgetsAlPanel();
        this.actualizarTarjetasUsuario();
        this.cargarFeed();
        this.cargarTendencias();
    },
    ocultar: function() {
        document.getElementById('userPanelView').classList.remove('active');
        document.getElementById('publicView').classList.remove('hidden');
        var buscador = document.getElementById('dynamicSearch');
        if (buscador) buscador.value = '';
        this.moverWidgetsAPublico();
    },
    moverWidgetsAlPanel: function() {
        var asistente = document.getElementById('assistantBox');
        var sponsors = document.getElementById('sponsorsBox');
        if (asistente) document.getElementById('assistantSlotRight').appendChild(asistente);
        if (sponsors) document.getElementById('sponsorsSlotRight').appendChild(sponsors);
    },
    moverWidgetsAPublico: function() {
        var asistente = document.getElementById('assistantBox');
        var sponsors = document.getElementById('sponsorsBox');
        var publicLeft = document.getElementById('publicSidebarLeft');
        var sidebarRight = document.querySelector('#publicView .sidebar-right');
        var banner = document.getElementById('bannerText');
        if (asistente && publicLeft) publicLeft.appendChild(asistente);
        if (sponsors && sidebarRight) {
            if (banner) sidebarRight.insertBefore(sponsors, banner.nextSibling);
            else sidebarRight.appendChild(sponsors);
        }
    },

    // === TARJETAS DE USUARIO === [FASE 2.1 - Columna Izquierda]
    actualizarTarjetasUsuario: function() {
        if (!usuarioActual) return;
        var intereses = document.getElementById('interesesContent');
        var cats = usuarioActual.categoria ? usuarioActual.categoria.split(',').map(function(c) { return c.trim(); }) : ['General'];
        intereses.innerHTML = cats.map(function(c) { return '<span class="interest-tag">' + c + '</span>'; }).join('');
        this.cargarLocalidad();
    },
    cargarLocalidad: async function() {
        var el = document.getElementById('alcanceContent');
        if (!usuarioActual) return;
        if (usuarioActual.localidad_id) {
            try {
                var { data, error } = await supabase.from('localidades').select('*').eq('id', usuarioActual.localidad_id).maybeSingle();
                if (!error && data) {
                    var ciudad = data.ciudad || data.nombre || data.localidad || '';
                    var pais = data.pais || data.pais_nombre || '';
                    el.innerHTML = '<strong style="color:#7C3AED;">' + (ciudad || 'Tu zona') + '</strong><br>' + (pais || '') + '<br><span style="font-size:12px;">Publicaciones filtradas por tu localidad</span>';
                    return;
                }
            } catch (e) { console.warn('Localidad no disponible:', e); }
        }
        el.innerHTML = '<strong style="color:#7C3AED;">' + (UbicacionUsuario.ciudad || 'Global') + '</strong><br>' + (UbicacionUsuario.pais || 'Mundo') + '<br><span style="font-size:12px;">Define tu localidad en Configuración</span>';
    },

    // === UTILIDADES === [Helpers generales, sin fase específica]
    tiempoRelativo: function(fecha) {
        if (!fecha) return 'Reciente';
        var diff = Date.now() - new Date(fecha).getTime();
        var mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return 'Hace ' + mins + ' min';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return 'Hace ' + hrs + ' h';
        var dias = Math.floor(hrs / 24);
        if (dias < 7) return 'Hace ' + dias + ' d';
        return new Date(fecha).toLocaleDateString('es-PE');
    },
    escHtml: function(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    },
    mostrarToast: function(msg) {
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#111827;color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;z-index:900;box-shadow:0 4px 15px rgba(0,0,0,0.2);max-width:90%;text-align:center;';
        document.body.appendChild(t);
        setTimeout(function() { t.remove(); }, 2500);
    },

    // === RENDER POST === [FASE 4.1 - Tarjetas de Publicación Estilo Facebook]
    renderPost: function(item, autor, yaLike) {
        var imgs = [];
        if (item.imagen_url) imgs.push(item.imagen_url);
        if (item.imagenes && Array.isArray(item.imagenes)) imgs = imgs.concat(item.imagenes);
        if (item.fotos && Array.isArray(item.fotos)) imgs = imgs.concat(item.fotos);
        imgs = imgs.slice(0, 5);
        var id = this.escHtml(item.id);
        var imgHtml;
        if (imgs.length > 1) {
            imgHtml = '<div class="feed-post-carousel">' +
                '<div class="feed-post-carousel-track" id="carruselTrack-' + id + '" onscroll="PanelUsuario.actualizarDotsCarrusel(this)">' +
                imgs.map(function(u, i) { return '<img class="feed-post-image" src="' + this.escHtml(u) + '" alt="' + this.escHtml(item.titulo || '') + ' foto ' + (i + 1) + '">'; }, this).join('') +
                '</div>' +
                '<button type="button" class="feed-post-carousel-arrow prev" onclick="PanelUsuario.moverCarrusel(\'' + id + '\', -1)">‹</button>' +
                '<button type="button" class="feed-post-carousel-arrow next" onclick="PanelUsuario.moverCarrusel(\'' + id + '\', 1)">›</button>' +
                '<div class="feed-post-carousel-dots">' + imgs.map(function(u, i) { return '<span class="dot' + (i === 0 ? ' active' : '') + '"></span>'; }).join('') + '</div>' +
                '</div>';
        } else if (imgs.length === 1) {
            imgHtml = '<img class="feed-post-image" src="' + this.escHtml(imgs[0]) + '" alt="' + this.escHtml(item.titulo || '') + '">';
        } else {
            imgHtml = '<div class="feed-post-image-placeholder">' + (item.icono || '📦') + '</div>';
        }
        var nombre = autor ? ((autor.nombres || '') + ' ' + (autor.apellidos || '')).trim() : 'Usuario';
        var inicial = nombre.charAt(0).toUpperCase() || 'U';
        var avatarHtml = (autor && autor.foto_perfil) ? '<img src="' + this.escHtml(autor.foto_perfil) + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;cursor:pointer;" onclick="PanelUsuario.cargarPerfilUsuario(\'' + this.escHtml(item.usuario_id || '') + '\')">' : '<div class="feed-post-avatar" style="cursor:pointer;" onclick="PanelUsuario.cargarPerfilUsuario(\'' + this.escHtml(item.usuario_id || '') + '\')">' + inicial + '</div>';
        var ciudad = item.ciudad || item.localidad || UbicacionUsuario.ciudad || '';
        var vistas = item.vistas || 0;
        var likesCount = item.likes_count || 0;
        var comentariosCount = item.comentarios_count || 0;
        var MODALIDADES = { venta: 'Venta', trueque: 'Trueque', donacion: 'Donación', servicio: 'Servicio' };
        var modalidadTexto = MODALIDADES[item.modalidad] || '';
        var precio = item.precio != null ? 'S/ ' + item.precio : (item.precio_oferta != null ? 'S/ ' + item.precio_oferta : (modalidadTexto === 'Donación' ? 'Gratis' : 'Consultar'));
        var precioHtml = precio + (modalidadTexto ? ' <span style="font-size:13px;font-weight:600;color:var(--texto-secundario);">· ' + modalidadTexto + '</span>' : '');
        var autorUid = this.escHtml(item.usuario_id || '');
        var esPropio = usuarioActual && item.usuario_id === usuarioActual.id;
        var menuAutorHtml = '';
        if (autorUid && !esPropio) {
            menuAutorHtml = '<div class="autor-menu-wrapper" style="margin-left:auto;position:relative;">' +
                '<button class="autor-menu-btn" onclick="PanelUsuario.toggleMenuAutor(\'' + id + '\')">⋯</button>' +
                '<div class="autor-menu-dropdown" id="autorMenu-' + id + '">' +
                '<button onclick="PanelUsuario.toggleSeguir(\'' + autorUid + '\', \'' + id + '\')" id="seguirBtn-' + id + '">➕ Seguir</button>' +
                '<button onclick="PanelUsuario.iniciarConversacionDirecta(\'' + autorUid + '\')">💬 Enviar mensaje</button>' +
                '<button onclick="PanelUsuario.toggleFavoritoUsuario(\'' + autorUid + '\', \'' + id + '\')" id="prefBtn-' + id + '">⭐ Marcar preferido</button>' +
                '<button onclick="PanelUsuario.toggleBloqueado(\'' + autorUid + '\', \'' + id + '\')" class="logout-item">🚫 Bloquear usuario</button>' +
                '<button onclick="PanelUsuario.abrirModalReportar(\'' + id + '\')" class="logout-item">🚩 Reportar publicación</button>' +
                '</div></div>';
        }
        var videoHtmlFeed = '';
        if (item.video_url) {
            videoHtmlFeed = '<a href="' + this.escHtml(item.video_url) + '" target="_blank" rel="noopener" style="display:flex;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--borde);text-decoration:none;color:inherit;">' +
                (item.video_miniatura ? '<img src="' + this.escHtml(item.video_miniatura) + '" style="width:56px;height:56px;object-fit:cover;border-radius:6px;flex-shrink:0;">' : '<span style="font-size:24px;">▶️</span>') +
                '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">▶️ ' + this.escHtml(item.video_titulo || 'Video') + '</div>' +
                '<div style="font-size:11px;color:var(--texto-secundario);">' + (item.video_plataforma === 'youtube' ? 'YouTube' : item.video_plataforma === 'tiktok' ? 'TikTok' : 'Instagram') + '</div></div></a>';
        }
        return '<article class="feed-post" data-id="' + id + '" data-autor="' + autorUid + '">' +
            '<div class="feed-post-header">' + avatarHtml +
            '<div class="feed-post-meta"><div class="feed-post-name" style="cursor:pointer;" onclick="PanelUsuario.cargarPerfilUsuario(\'' + autorUid + '\')">' + this.escHtml(nombre) + '</div>' +
            '<div class="feed-post-time">' + this.tiempoRelativo(item.created_at || item.fecha_creacion) + '</div>' +
            (ciudad ? '<div class="feed-post-location">📍 ' + this.escHtml(ciudad) + '</div>' : '') + '</div>' + menuAutorHtml + '</div>' +
            imgHtml +
            videoHtmlFeed +
            '<div class="feed-post-body"><div class="feed-post-title">' + this.escHtml(item.titulo || item.nombre || 'Sin título') + '</div>' +
            '<div class="feed-post-desc">' + this.escHtml((item.descripcion || item.detalle || '').substring(0, 200)) + '</div>' +
            '<div class="feed-post-price">' + precioHtml + '</div></div>' +
            '<div class="feed-post-stats">👁️ ' + vistas + ' vistas · <span id="likesCount-' + id + '">' + likesCount + '</span> me gusta · <span id="commentsCount-' + id + '">' + comentariosCount + '</span> comentarios</div>' +
            '<div class="feed-post-actions">' +
            '<button class="feed-action-btn' + (yaLike ? ' active-like' : '') + '" id="likeBtn-' + id + '" onclick="PanelUsuario.toggleLike(\'' + id + '\')">' + (yaLike ? '💜' : '👍') + ' Me gusta</button>' +
            '<button class="feed-action-btn" onclick="PanelUsuario.toggleComentarios(\'' + id + '\')">💬 Comentar</button>' +
            '<button class="feed-action-btn" onclick="PanelUsuario.abrirModalCompartirFB(\'' + id + '\')">🔄 Compartir</button>' +
            '<button class="feed-action-btn" id="saveBtn-' + id + '" onclick="PanelUsuario.accionFeed(\'save\',\'' + id + '\')">🔖 Guardar</button>' +
            '</div>' +
            '<div class="feed-comments-box" id="commentsBox-' + id + '" style="display:none;padding:12px 16px;border-top:1px solid var(--borde-suave);background:var(--fondo-secundario);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
            '<span style="font-weight:600;font-size:14px;color:var(--texto-principal);">💬 Comentarios</span>' +
            '<span id="commentsCountBox-' + id + '" style="font-size:13px;color:var(--texto-secundario);">' + comentariosCount + '</span>' +
            '</div>' +
            '<div id="commentsList-' + id + '" style="margin-bottom:12px;"></div>' +
            '<div class="comment-input-wrapper">' +
            '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, var(--purpura-ia), var(--azul-confianza));color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;" id="commentAvatar-' + id + '">' + (usuarioActual ? ((usuarioActual.nombres || 'U').charAt(0).toUpperCase()) : 'U') + '</div>' +
            '<input type="text" class="comment-input" id="commentInput-' + id + '" placeholder="Escribe un comentario..." style="flex:1;border:none;padding:10px 0;font-size:14px;outline:none;background:transparent;" onkeydown="if(event.key===\'Enter\'){PanelUsuario.enviarComentarioFB(\'' + id + '\')}">' +
            '<button onclick="PanelUsuario.enviarComentarioFB(\'' + id + '\')" style="background:var(--purpura-ia);color:#fff;border:none;padding:8px 16px;border-radius:999px;font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap;transition:background 0.2s;">Publicar</button>' +
            '</div></div>' +
            '</article>';
    },

    moverCarrusel: function(id, dir) {
        var track = document.getElementById('carruselTrack-' + id);
        if (!track) return;
        track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
    },
    actualizarDotsCarrusel: function(track) {
        var index = Math.round(track.scrollLeft / track.clientWidth);
        var dots = track.parentElement.querySelectorAll('.feed-post-carousel-dots .dot');
        dots.forEach(function(d, i) { d.classList.toggle('active', i === index); });
    },

    // === FEED === [FASE 4 - Feed Social / FASE 8 - Feed Algorítmico]
    feedPagina: 0,
    feedTamanoPagina: 10,
    feedCargandoMas: false,
    feedSinMasResultados: false,
    autoresCacheGlobal: {},
    
    obtenerAutor: async function(uid) {
        if (!uid) return null;
        if (this.autoresCacheGlobal[uid]) return this.autoresCacheGlobal[uid];
        if (usuarioActual && usuarioActual.id === uid) { this.autoresCacheGlobal[uid] = usuarioActual; return usuarioActual; }
        var { data: u } = await supabase.from('usuarios').select('nombres, apellidos, correo_electronico, idioma_preferido, foto_perfil, ultima_conexion').eq('id', uid).maybeSingle();
        if (u) this.autoresCacheGlobal[uid] = u;
        return u;
    },
    
    obtenerBloqueados: async function() {
        if (!usuarioActual) return [];
        if (this._bloqueadosCache) return this._bloqueadosCache;
        try {
            var { data } = await supabase.from('bloqueados').select('bloqueado_id').eq('bloqueador_id', usuarioActual.id);
            this._bloqueadosCache = (data || []).map(function(b) { return b.bloqueado_id; });
        } catch (e) { this._bloqueadosCache = []; }
        return this._bloqueadosCache;
    },

    obtenerFeedCombinado: async function(desde, tamano) {
        var limiteBusqueda = desde + tamano + 20;
        var items = [];
        var bloqueados = await this.obtenerBloqueados();
        try {
            var { data: productos, error: errProd } = await supabase.from('productos').select('*').eq('estado', 'aprobado').order('created_at', { ascending: false }).limit(limiteBusqueda);
            if (errProd) throw errProd;
            (productos || []).forEach(function(p) { if (bloqueados.indexOf(p.usuario_id) === -1) items.push({ tipo: 'original', fecha: p.created_at, producto: p }); });
        } catch (e) { console.warn('No se pudieron cargar productos:', e); }
        try {
            var { data: reposts, error: errRep } = await supabase.from('reposts').select('id, usuario_id, producto_id, created_at, comentario').order('created_at', { ascending: false }).limit(limiteBusqueda);
            if (errRep) throw errRep;
            if (reposts && reposts.length) {
                var idsProductos = reposts.map(function(r) { return r.producto_id; }).filter(Boolean);
                if (idsProductos.length) {
                    var { data: productosRepost } = await supabase.from('productos').select('*').in('id', idsProductos).eq('estado', 'aprobado');
                    var mapaProductos = {};
                    (productosRepost || []).forEach(function(p) { mapaProductos[p.id] = p; });
                    reposts.forEach(function(r) {
                        var prod = mapaProductos[r.producto_id];
                        if (prod && bloqueados.indexOf(r.usuario_id) === -1 && bloqueados.indexOf(prod.usuario_id) === -1) items.push({ tipo: 'repost', fecha: r.created_at, producto: prod, resharerUid: r.usuario_id, comentario: r.comentario });
                    });
                }
            }
        } catch (e) { console.warn('No se pudieron cargar los compartidos:', e); }
        items.sort(function(a, b) { return new Date(b.fecha) - new Date(a.fecha); });
        return items.slice(desde, desde + tamano);
    },

    renderItemsFeed: async function(items) {
        var html = '';
        var idsVistos = [];
        var idsProductosLote = items.map(function(it) { return it.producto && it.producto.id; }).filter(Boolean);
        var misLikes = await this.obtenerMisLikes(idsProductosLote);
        for (var i = 0; i < items.length; i++) {
            var entry = items[i];
            var autor = await this.obtenerAutor(entry.producto.usuario_id);
            if (entry.producto.id) idsVistos.push(entry.producto.id);
            var yaLike = misLikes.indexOf(entry.producto.id) !== -1;
            if (entry.tipo === 'repost') {
                var resharer = await this.obtenerAutor(entry.resharerUid);
                var nombreResharer = resharer ? ((resharer.nombres || '') + ' ' + (resharer.apellidos || '')).trim() : 'Alguien';
                html += '<div class="feed-repost-wrapper"><div class="feed-repost-header">🔄 <strong>' + this.escHtml(nombreResharer) + '</strong> compartió esto · ' + this.tiempoRelativo(entry.fecha) + (entry.comentario ? '<div style="margin-top:6px;color:var(--texto-principal);font-size:14px;">' + this.escHtml(entry.comentario) + '</div>' : '') + '</div>' + this.renderPost(entry.producto, autor, yaLike) + '</div>';
            } else {
                html += this.renderPost(entry.producto, autor, yaLike);
            }
        }
        if (idsVistos.length) this.registrarVistas(items.map(function(it) { return it.producto; }));
        return html;
    },

    obtenerMisLikes: async function(idsProductos) {
        if (!usuarioActual || !idsProductos.length) return [];
        try {
            var { data } = await supabase.from('likes').select('producto_id').eq('usuario_id', usuarioActual.id).in('producto_id', idsProductos);
            return (data || []).map(function(l) { return l.producto_id; });
        } catch (e) { return []; }
    },

    registrarVistas: function(items) {
        items.forEach(function(item) {
            if (!item.id) return;
            supabase.from('productos').update({ vistas: (item.vistas || 0) + 1 }).eq('id', item.id).then(function() {}, function() {});
        });
    },

    cargarFeed: async function() {
        this.feedPagina = 0;
        this.feedSinMasResultados = false;
        var container = document.getElementById('userFeedContainer');
        container.innerHTML = '<div class="feed-loading"><div class="search-loading-spinner"></div><p>Cargando publicaciones...</p></div>';
        try {
            var combinado = await this.obtenerFeedCombinado(0, this.feedTamanoPagina);
            if (!combinado.length) {
                container.innerHTML = '<div class="feed-empty"><div style="font-size:48px;margin-bottom:12px;">📭</div><h3 style="color:var(--texto-principal);margin-bottom:8px;">No hay publicaciones aún</h3><p>Sé el primero en publicar en tu zona.</p><button class="btn-publicar" style="margin-top:16px;" onclick="PanelUsuario.abrirModalPublicar()">📦 Publicar ahora</button></div>';
                return;
            }
            var html = await this.renderItemsFeed(combinado);
            container.innerHTML = html + '<div id="feedScrollSentinel" style="height:1px;"></div>';
            this.feedPagina = 1;
            this.activarScrollInfinito();
        } catch (e) {
            console.warn('Error cargando feed:', e);
            container.innerHTML = '<div class="feed-empty"><p>No se pudieron cargar las publicaciones.</p><button class="btn-publicar" onclick="PanelUsuario.cargarFeed()">Reintentar</button></div>';
        }
    },

    cargarMasFeed: async function() {
        if (this.feedCargandoMas || this.feedSinMasResultados) return;
        this.feedCargandoMas = true;
        var desde = this.feedPagina * this.feedTamanoPagina;
        try {
            var combinado = await this.obtenerFeedCombinado(desde, this.feedTamanoPagina);
            var sentinel = document.getElementById('feedScrollSentinel');
            if (!combinado.length) {
                this.feedSinMasResultados = true;
                if (sentinel) sentinel.outerHTML = '<div style="text-align:center;padding:20px;color:var(--texto-terciario);font-size:13px;">— No hay más publicaciones —</div>';
                return;
            }
            var html = await this.renderItemsFeed(combinado);
            if (sentinel) sentinel.insertAdjacentHTML('beforebegin', html);
            this.feedPagina++;
        } catch (e) {
            console.warn('Error cargando más publicaciones:', e);
        } finally {
            this.feedCargandoMas = false;
        }
    },

    activarScrollInfinito: function() {
        if (this._scrollObserver) this._scrollObserver.disconnect();
        var sentinel = document.getElementById('feedScrollSentinel');
        if (!sentinel || !('IntersectionObserver' in window)) return;
        var self = this;
        this._scrollObserver = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) self.cargarMasFeed();
        }, { rootMargin: '200px' });
        this._scrollObserver.observe(sentinel);
    },

    // === TENDENCIAS === [FASE 8 - Personalización Inteligente]
    cargarTendencias: async function() {
        var el = document.getElementById('tendenciasContent');
        try {
            var { data, error } = await supabase.from('productos').select('id, titulo, vistas, num_vistas, views, created_at').order('created_at', { ascending: false }).limit(3);
            if (error || !data || !data.length) {
                var res2 = await supabase.from('productos').select('id, titulo, created_at').limit(3);
                data = res2.data || [];
            }
            if (data.length) data.sort(function(a, b) { return (b.vistas || b.num_vistas || b.views || 0) - (a.vistas || a.num_vistas || a.views || 0); });
            if (!data.length) {
                el.innerHTML = '<p style="font-size:13px;color:var(--texto-terciario);">Sin tendencias aún</p>';
                return;
            }
            el.innerHTML = data.map(function(p, i) {
                var v = p.vistas || p.num_vistas || p.views || 0;
                return '<div class="trend-item"><div class="trend-rank">' + (i + 1) + '</div><div class="trend-info"><div class="trend-name">' + PanelUsuario.escHtml(p.titulo) + '</div><div class="trend-views">👁️ ' + v + ' vistas</div></div></div>';
            }).join('');
        } catch (e) {
            el.innerHTML = '<p style="font-size:13px;color:var(--texto-terciario);">Sin tendencias aún</p>';
        }
    },

    // === MENÚ CLICK === [FASE 2.1 - Navegación Menú Lateral]
    menuClick: function(action) {
        document.querySelectorAll('.user-menu-item').forEach(function(el) { el.classList.remove('active'); });
        var btn = document.querySelector('.user-menu-item[data-action="' + action + '"]');
        if (btn) btn.classList.add('active');
        this.cerrarMenuMobile();
        if (action === 'inicio') this.cargarFeed();
        else if (action === 'perfil') this.cargarMiPerfilFB();
        else if (action === 'publicaciones') this.cargarMisPublicaciones();
        else if (action === 'buscarpersonas') this.cargarBuscarPersonas();
        else if (action === 'mensajes') { this.cargarConversaciones(this._convIdParaExpandir); this._convIdParaExpandir = null; }
        else if (action === 'favoritos') this.cargarFavoritos();
        else if (action === 'config') this.abrirModalConfiguracion();
    },

    // === MIS PUBLICACIONES (Publicadas + Borradores) ===
    renderTarjetaAdminPublicacion: function(p, esBorrador) {
        var estadoBadge = { aprobado: '✅ Aprobada', pendiente: '⏳ Pendiente', borrador: '💾 Borrador' };
        var foto = (p.fotos && p.fotos[0]) ? p.fotos[0] : '';
        var alertas = [];
        if (p.nivel_alerta_ocr === 'medio' || p.nivel_alerta_ocr === 'alto') alertas.push((p.nivel_alerta_ocr === 'alto' ? '🔴' : '🟡') + ' Posible contacto externo');
        if (p.nivel_alerta_legal === 'medio' || p.nivel_alerta_legal === 'alto') alertas.push((p.nivel_alerta_legal === 'alto' ? '🔴' : '🟡') + ' Revisar contenido');
        var alertaHtml = alertas.length ? '<div style="font-size:11px;color:#B45309;margin-top:2px;">' + alertas.join(' · ') + '</div>' : '';
        return '<div style="display:flex;gap:12px;align-items:center;padding:12px;border:1px solid var(--borde);border-radius:10px;margin-bottom:10px;">' +
            (foto ? '<img src="' + this.escHtml(foto) + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0;">' : '<div style="width:60px;height:60px;border-radius:8px;background:var(--fondo-terciario);display:flex;align-items:center;justify-content:center;flex-shrink:0;">📷</div>') +
            '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + this.escHtml(p.titulo || 'Sin título') + '</div>' +
            '<div style="font-size:12px;color:var(--texto-secundario);">' + (estadoBadge[p.estado] || p.estado) + (p.precio ? ' · S/ ' + p.precio : '') + '</div>' + alertaHtml + '</div>' +
            '<div style="display:flex;gap:6px;flex-shrink:0;">' +
            (esBorrador ? '<button class="btn-auth" style="width:auto;padding:6px 10px;font-size:12px;" onclick="PanelUsuario.publicarBorrador(\'' + p.id + '\')">📤 Publicar</button>' : '') +
            '<button class="btn-auth" style="width:auto;padding:6px 10px;font-size:12px;" onclick="PanelUsuario.verVistaPreviaPublicacion(\'' + p.id + '\')">👁️ Vista previa</button>' +
            '<button class="btn-auth" style="width:auto;padding:6px 10px;font-size:12px;" onclick="PanelUsuario.editarPublicacion(\'' + p.id + '\')">✏️ Editar</button>' +
            '<button class="btn-cancelar" style="width:auto;padding:6px 10px;font-size:12px;" onclick="PanelUsuario.eliminarPublicacionPropia(\'' + p.id + '\')">🗑️</button>' +
            '</div></div>';
    },
    // Vista previa de solo lectura de una publicación ya existente (o borrador), sin entrar a editarla.
    verVistaPreviaPublicacion: function(id) {
        var p = (this._cacheAdminPublicaciones || {})[id];
        if (!p) { this.mostrarToast('😕 No se pudo cargar la vista previa.'); return; }
        var modal = document.getElementById('modalVistaPreviaExistente');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalVistaPreviaExistente';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }
        var nombreCompleto = ((usuarioActual.nombres || '') + ' ' + (usuarioActual.apellidos || '')).trim() || 'Usuario';
        var fotos = p.fotos || [];
        var imagenHtml = fotos.length ? '<img src="' + this.escHtml(fotos[0]) + '" style="width:100%;max-height:260px;object-fit:cover;border-radius:8px;">' : '<div class="preview-compartir-imagen">📷</div>';
        var precioTexto = p.precio ? 'S/ ' + p.precio : (p.modalidad ? p.modalidad.charAt(0).toUpperCase() + p.modalidad.slice(1) : '');
        modal.innerHTML = '<div class="modal-content" style="max-width:480px;padding:20px;">' +
            '<button class="modal-close-btn" onclick="PanelUsuario.cerrarVistaPreviaPublicacion()">&times;</button>' +
            '<div style="font-size:12px;color:var(--texto-secundario);margin-bottom:10px;">👁️ <strong style="color:var(--texto-principal);">Vista previa</strong> — así la ven los demás usuarios.</div>' +
            '<div class="preview-compartir">' +
                '<div class="preview-compartir-header">' +
                    '<div class="preview-compartir-avatar">' + this.escHtml(nombreCompleto.charAt(0).toUpperCase()) + '</div>' +
                    '<div><div class="preview-compartir-nombre">' + this.escHtml(nombreCompleto) + '</div><div class="preview-compartir-fecha">' + this.escHtml(precioTexto) + '</div></div>' +
                '</div>' +
                '<div class="preview-compartir-body">' +
                    '<div class="preview-compartir-titulo">' + this.escHtml(p.titulo || 'Sin título') + '</div>' +
                    '<div class="preview-compartir-desc">' + this.escHtml(p.descripcion || '') + '</div>' +
                '</div>' +
                imagenHtml +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:16px;">' +
                '<button class="btn-cancelar" style="flex:1;" onclick="PanelUsuario.cerrarVistaPreviaPublicacion()">Cerrar</button>' +
                '<button class="btn-auth btn-auth-primary" style="flex:1;" onclick="PanelUsuario.cerrarVistaPreviaPublicacion();PanelUsuario.editarPublicacion(\'' + p.id + '\')">✏️ Editar</button>' +
            '</div></div>';
        modal.style.display = 'flex';
    },
    cerrarVistaPreviaPublicacion: function() {
        var modal = document.getElementById('modalVistaPreviaExistente');
        if (modal) modal.style.display = 'none';
    },
    renderListaAdminPublicaciones: function(productos) {
        productos = productos || [];
        this._cacheAdminPublicaciones = {};
        var self2 = this;
        productos.forEach(function(p) { self2._cacheAdminPublicaciones[p.id] = p; });
        var borradores = productos.filter(function(p) { return p.estado === 'borrador'; });
        var publicadas = productos.filter(function(p) { return p.estado !== 'borrador'; });
        var self = this;
        var html = '<div style="max-width:600px;margin:0 auto;padding:16px;">';
        html += '<h3 style="margin-bottom:12px;">📦 Publicaciones (' + publicadas.length + ')</h3>';
        html += publicadas.length ? publicadas.map(function(p) { return self.renderTarjetaAdminPublicacion(p, false); }).join('') : '<div style="color:var(--texto-secundario);font-size:13px;margin-bottom:16px;">Aún no tienes publicaciones.</div>';
        if (borradores.length) {
            html += '<h3 style="margin:24px 0 12px;">💾 Borradores (' + borradores.length + ')</h3>';
            html += borradores.map(function(p) { return self.renderTarjetaAdminPublicacion(p, true); }).join('');
        }
        html += '</div>';
        return html;
    },
    cargarMisPublicaciones: async function() {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var container = document.getElementById('userFeedContainer');
        if (this._scrollObserver) this._scrollObserver.disconnect();
        container.innerHTML = '<div class="feed-loading"><div class="search-loading-spinner"></div><p>Cargando tus publicaciones...</p></div>';
        try {
            var { data: productos, error } = await supabase.from('productos').select('*').eq('usuario_id', usuarioActual.id).order('created_at', { ascending: false });
            if (error) throw error;
            container.innerHTML = this.renderListaAdminPublicaciones(productos);
        } catch (e) {
            container.innerHTML = '<div class="feed-empty"><p>No se pudieron cargar tus publicaciones.</p></div>';
        }
    },

    publicarBorrador: async function(productoId) {
        try {
            var { error } = await supabase.from('productos').update({ estado: 'aprobado' }).eq('id', productoId);
            if (error) throw error;
            this.mostrarToast('✅ Publicación activada');
            this.cargarMisPublicaciones();
        } catch (e) {
            this.mostrarToast('Error al publicar: ' + (e.message || 'intenta de nuevo'));
        }
    },

    eliminarPublicacionPropia: async function(productoId) {
        var seguro = confirm('¿Seguro que quieres eliminar esta publicación? No se puede deshacer.');
        if (!seguro) return;
        try {
            var { error } = await supabase.from('productos').delete().eq('id', productoId);
            if (error) throw error;
            this.mostrarToast('🗑️ Publicación eliminada');
            this.cargarMisPublicaciones();
        } catch (e) {
            this.mostrarToast('Error al eliminar: ' + (e.message || 'intenta de nuevo'));
        }
    },

    // === BUSCAR PERSONAS (sección dedicada del Panel de Usuario) ===
    // Usa el mismo motor (buscarUsuariosPorNombre) que Compartir, Nuevo mensaje y el Chat/buscador principal.
    cargarBuscarPersonas: function() {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var container = document.getElementById('userFeedContainer');
        if (this._scrollObserver) this._scrollObserver.disconnect();
        container.innerHTML =
            '<div style="max-width:600px;margin:0 auto;padding:16px;">' +
            '<h3 style="margin-bottom:12px;">🔍 Buscar Personas</h3>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">' +
                '<button type="button" id="filtroZona-local-panelPersonas" data-nivel="local" data-contexto="panelPersonas" class="compartir-filtro-zona" onclick="PanelUsuario.buscarEnPanelPersonas(null,\'local\')">📍 Local</button>' +
                '<button type="button" id="filtroZona-regional-panelPersonas" data-nivel="regional" data-contexto="panelPersonas" class="compartir-filtro-zona" onclick="PanelUsuario.buscarEnPanelPersonas(null,\'regional\')">🗺️ Regional</button>' +
                '<button type="button" id="filtroZona-pais-panelPersonas" data-nivel="pais" data-contexto="panelPersonas" class="compartir-filtro-zona" onclick="PanelUsuario.buscarEnPanelPersonas(null,\'pais\')">🌎 País</button>' +
            '</div>' +
            '<input type="text" id="panelPersonasBuscarInput" class="form-input" placeholder="Nombre, apellido o iniciales (ej: J P)..." autocomplete="off" oninput="PanelUsuario.onBuscarPanelPersonasInput(this.value)">' +
            '<div id="panelPersonasResultados" style="margin-top:16px;"></div>' +
            '</div>';
        document.getElementById('panelPersonasResultados').innerHTML = '<div style="color:var(--texto-secundario);font-size:13px;text-align:center;padding:20px;">💡 Escribe un nombre, iniciales, o elige una zona para empezar a buscar.</div>';
    },
    onBuscarPanelPersonasInput: function(valor) {
        clearTimeout(this._debouncePanelPersonas);
        this._debouncePanelPersonas = setTimeout(function() { PanelUsuario.buscarEnPanelPersonas(valor); }, 350);
    },
    buscarEnPanelPersonas: async function(valorForzado, nivelClickeado) {
        var inputEl = document.getElementById('panelPersonasBuscarInput');
        if (nivelClickeado) {
            var btn = document.getElementById('filtroZona-' + nivelClickeado + '-panelPersonas');
            var yaActivo = btn && btn.classList.contains('activo');
            document.querySelectorAll('.compartir-filtro-zona[data-contexto="panelPersonas"]').forEach(function(b) { b.classList.remove('activo'); });
            if (btn && !yaActivo) btn.classList.add('activo');
        }
        var texto = (valorForzado !== null && valorForzado !== undefined) ? valorForzado : (inputEl ? inputEl.value : '');
        var nivelZona = this._obtenerNivelZonaActivo('panelPersonas');
        var resultadosEl = document.getElementById('panelPersonasResultados');
        if (!resultadosEl) return;
        if (!texto.trim() && !nivelZona) {
            resultadosEl.innerHTML = '<div style="color:var(--texto-secundario);font-size:13px;text-align:center;padding:20px;">💡 Escribe un nombre, iniciales, o elige una zona para empezar a buscar.</div>';
            return;
        }
        resultadosEl.innerHTML = '<div style="text-align:center;padding:20px;"><div class="search-loading-spinner" style="margin:0 auto;"></div></div>';
        var usuarios = await this.buscarUsuariosPorNombre(texto, nivelZona);
        if (usuarios && usuarios.length) {
            this._renderTarjetasPanelPersonas(usuarios, resultadosEl);
            return;
        }
        // Sin coincidencia exacta por nombre: si escribiste algo, le pedimos ayuda a la IA
        // (entiende frases como "alguien de tecnología en mi zona") en vez de solo decir "no encontré nada".
        if (texto.trim()) {
            resultadosEl.innerHTML = '<div class="user-picker-empty">🤖 Pensando...</div>';
            var resultado = await this.consultarAsistenteCompartir(texto, null);
            if (resultado.tipo === 'mensaje') {
                resultadosEl.innerHTML = '<div class="user-picker-empty">🤖 ' + this.escHtml(resultado.valor) + '</div>';
                return;
            }
            var categoriaDetectada = resultado.categoria;
            var nivelZonaIA = resultado.nivel_zona || nivelZona;
            if (nivelZonaIA && !usuarioActual.localidad_id) {
                resultadosEl.innerHTML = '<div class="user-picker-empty">🤖 Todavía no tienes tu localidad definida, así que no puedo comparar zonas. Ve a Configuración para definirla, o busca por nombre/categoría.</div>';
                return;
            }
            var candidatos = await this.buscarUsuariosCompartir(categoriaDetectada, nivelZonaIA);
            var NOMBRES_NIVEL = { local: 'tu misma zona', regional: 'tu misma región', pais: 'tu mismo país' };
            var etiquetaZona = nivelZonaIA ? NOMBRES_NIVEL[nivelZonaIA] : null;
            var etiqueta = categoriaDetectada && etiquetaZona ? 'interesadas en ' + categoriaDetectada + ' de ' + etiquetaZona
                : categoriaDetectada ? 'interesadas en ' + categoriaDetectada
                : etiquetaZona ? 'de ' + etiquetaZona : 'según tu búsqueda';
            if (candidatos && candidatos.length) {
                resultadosEl.innerHTML = '<div style="font-size:12px;color:var(--texto-secundario);margin-bottom:8px;">🤖 No hay nadie con ese nombre exacto, pero encontré personas ' + this.escHtml(etiqueta) + ':</div>';
                this._renderTarjetasPanelPersonas(candidatos, resultadosEl, true);
                return;
            }
            resultadosEl.innerHTML = '<div class="user-picker-empty">🤖 Todavía no encontré personas ' + this.escHtml(etiqueta) + '. Prueba con otro nombre, iniciales, o cambia la zona.</div>';
            return;
        }
        resultadosEl.innerHTML = '<div style="color:var(--texto-secundario);font-size:13px;text-align:center;padding:20px;">😕 No encontramos a nadie en esa zona. Prueba con otro filtro.</div>';
    },
    // Pinta las tarjetas de resultados de la sección "Buscar Personas" (usadas tanto en la búsqueda directa como en la sugerencia de la IA).
    _renderTarjetasPanelPersonas: function(usuarios, resultadosEl, esSugerenciaIA) {
        var self = this;
        resultadosEl.innerHTML += usuarios.map(function(u) {
            var nombre = u.nombre_completo || ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
            var inicial = nombre.charAt(0).toUpperCase() || 'U';
            var fotoHtml = u.foto_perfil
                ? '<img src="' + u.foto_perfil + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">'
                : '<div class="user-picker-avatar" style="width:48px;height:48px;font-size:18px;">' + inicial + '</div>';
            var subtitulo = esSugerenciaIA
                ? '<div style="font-size:12px;color:var(--texto-secundario);">✨ Sugerido por el asistente</div>'
                : (u.correo_electronico ? '<div style="font-size:12px;color:var(--texto-secundario);">✉️ ' + self.escHtml(u.correo_electronico) + '</div>' : '');
            return '<div style="display:flex;gap:12px;align-items:center;padding:12px;border:1px solid var(--borde);border-radius:10px;margin-bottom:10px;">' +
                fotoHtml +
                '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;">' + self.escHtml(nombre) + '</div>' + subtitulo + '</div>' +
                '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                '<button class="btn-auth" style="width:auto;padding:6px 10px;font-size:12px;" onclick="PanelUsuario.abrirVistaPreviaPersona(\'' + u.id + '\')">👁️ Vista previa</button>' +
                '<button class="btn-auth" style="width:auto;padding:6px 10px;font-size:12px;" onclick="PanelUsuario.iniciarConversacionDirecta(\'' + u.id + '\')">💬 Mensaje</button>' +
                '</div></div>';
        }).join('');
    },

    // === FAVORITOS === [FASE 4.2 / FASE 5 - Guardar en Favoritos]
    cargarFavoritos: async function() {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var container = document.getElementById('userFeedContainer');
        if (this._scrollObserver) this._scrollObserver.disconnect();
        container.innerHTML = '<div class="feed-loading"><div class="search-loading-spinner"></div><p>Cargando tus favoritos...</p></div>';
        try {
            var { data: favs, error } = await supabase.from('favoritos').select('producto_id').eq('usuario_id', usuarioActual.id).order('created_at', { ascending: false });
            if (error) throw error;
            if (!favs || !favs.length) {
                container.innerHTML = '<div class="feed-empty"><div style="font-size:48px;margin-bottom:12px;">❤️</div><h3 style="color:var(--texto-principal);margin-bottom:8px;">Aún no tienes favoritos</h3><p>Guarda publicaciones desde el feed con el botón "🔖 Guardar".</p></div>';
                return;
            }
            var ids = favs.map(function(f) { return f.producto_id; });
            var { data: productos } = await supabase.from('productos').select('*').in('id', ids);
            if (!productos || !productos.length) {
                container.innerHTML = '<div class="feed-empty"><p>No se encontraron los productos guardados.</p></div>';
                return;
            }
            var items = productos.map(function(p) { return { tipo: 'original', fecha: p.created_at, producto: p }; });
            var html = await this.renderItemsFeed(items);
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<div class="feed-empty"><p>No se pudieron cargar tus favoritos.</p></div>';
        }
    },

    // Vista previa rápida de un usuario (avatar, nombre, zona, interés) antes de entrar a su perfil completo.
    // Usada desde los resultados de persona del buscador principal y del chat IA.
    abrirVistaPreviaPersona: async function(id) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var modal = document.getElementById('modalVistaPreviaPersona');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalVistaPreviaPersona';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }
        modal.innerHTML = '<div class="modal-content" style="max-width:340px;padding:24px;text-align:center;">' +
            '<button class="modal-close-btn" onclick="PanelUsuario.cerrarVistaPreviaPersona()">&times;</button>' +
            '<div id="previaPersonaCuerpo"><div class="user-picker-empty">Cargando...</div></div>' +
            '</div>';
        modal.style.display = 'flex';
        try {
            var { data: u, error } = await supabase.from('usuarios').select('id, nombres, apellidos, foto_perfil, localidad_id, categoria').eq('id', id).maybeSingle();
            if (error || !u) throw error || new Error('Usuario no encontrado');
            var nombre = ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
            var inicial = nombre.charAt(0).toUpperCase() || 'U';
            var fotoHtml = u.foto_perfil
                ? '<img src="' + u.foto_perfil + '" style="width:84px;height:84px;border-radius:50%;object-fit:cover;margin:0 auto 12px;">'
                : '<div class="user-picker-avatar" style="width:84px;height:84px;font-size:30px;margin:0 auto 12px;">' + inicial + '</div>';
            var localidadTexto = '';
            if (u.localidad_id) {
                var { data: loc } = await supabase.from('localidades').select('nombre, region').eq('id', u.localidad_id).maybeSingle();
                if (loc) localidadTexto = '📍 ' + (loc.nombre || loc.region || '');
            }
            document.getElementById('previaPersonaCuerpo').innerHTML =
                fotoHtml +
                '<div style="font-weight:700;font-size:17px;">' + this.escHtml(nombre) + '</div>' +
                (localidadTexto ? '<div style="color:var(--texto-secundario);font-size:13px;margin-top:4px;">' + this.escHtml(localidadTexto) + '</div>' : '') +
                (u.categoria ? '<div style="color:var(--texto-secundario);font-size:13px;">✨ Interesado en ' + this.escHtml(u.categoria) + '</div>' : '') +
                '<div style="display:flex;gap:8px;margin-top:16px;">' +
                '<button class="btn-auth btn-auth-primary" style="flex:1;" onclick="PanelUsuario.cerrarVistaPreviaPersona();PanelUsuario.cargarPerfilUsuario(\'' + u.id + '\')">Ver perfil</button>' +
                '<button class="btn-auth" style="flex:1;" onclick="PanelUsuario.cerrarVistaPreviaPersona();PanelUsuario.iniciarConversacionDirecta(\'' + u.id + '\')">💬 Mensaje</button>' +
                '</div>';
        } catch (e) {
            console.warn('Error cargando vista previa de persona:', e);
            document.getElementById('previaPersonaCuerpo').innerHTML = '<div class="user-picker-empty">😕 No se pudo cargar la vista previa.</div>';
        }
    },
    cerrarVistaPreviaPersona: function() {
        var modal = document.getElementById('modalVistaPreviaPersona');
        if (modal) modal.style.display = 'none';
    },
};
