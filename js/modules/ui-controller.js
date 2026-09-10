// Función global (no un método) a propósito: Paginador llama a renderizarTarjetaArticulo y a
// renderizarItemResultado con itemsPagina.map(e.renderFn), lo cual las desconecta de UIController
// -- "this" adentro de esas funciones ya NO es UIController en ese caso. Si escHtml fuera
// this.escHtml, esa llamada rompía con "this.escHtml is not a function" y no se pintaba nada
// (justo el bug que pasó: aparecía el banner y el conteo, pero ninguna tarjeta).
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

var UIController = {
    elementos: {},
    init: function() { this.elementos = { assistantResponse: document.getElementById('assistantResponse'), searchResultsContainer: document.getElementById('searchResultsContainer'), searchResultsContent: document.getElementById('searchResultsContent'), articulosContainer: document.getElementById('articulosContainer'), catalogContainer: document.getElementById('catalogContainer'), contentTitle: document.getElementById('contentTitle'), searchBreadcrumb: document.getElementById('searchBreadcrumb'), searchQuery: document.getElementById('searchQuery'), resultCount: document.getElementById('resultCount'), modal: document.getElementById('articuloModal'), qrModal: document.getElementById('qrModal') }; },
    mostrarRespuestaIA: function(texto, tipo) { tipo = tipo || 'assistant'; var limpio = texto.replace(/\[ACCION:[^\]]+\]/g, '').trim(); var div = document.createElement('div'); div.className = 'chat-message ' + tipo; div.textContent = limpio; this.elementos.assistantResponse.appendChild(div); this.elementos.assistantResponse.scrollTop = this.elementos.assistantResponse.scrollHeight; },
    mostrarEstadoCarga: function() { var div = document.createElement('div'); div.className = 'chat-message assistant'; div.id = 'typing'; div.textContent = '⏳ Pensando...'; this.elementos.assistantResponse.appendChild(div); },
    quitarEstadoCarga: function() { var t = document.getElementById('typing'); if (t) t.remove(); },
    // Alias del escHtml global de arriba, por si algo llama a UIController.escHtml directamente.
    escHtml: escHtml,
    renderizarTarjetaArticulo: function(art) {
        var tituloSeguro = escHtml(art.titulo), descSeguro = escHtml(art.descripcion), imgSeguro = escHtml(art.imagen_url);
        var imagenHTML = art.imagen_url ? '<img src="' + imgSeguro + '" class="card-img-real" alt="' + tituloSeguro + '">' : '<div class="card-img-top">' + (art.icono || '') + '</div>';
        return '<div class="card">' + imagenHTML + '<h3 class="card-title">' + tituloSeguro + '</h3>' +
            '<p class="card-text">' + descSeguro + '</p>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">' +
            '<span style="font-size:20px;font-weight:bold;color:var(--verde-esmeralda);">S/ ' + art.precio + '</span>' +
            '<span class="badge badge-disponible">🟢 ' + escHtml(art.modalidad) + '</span></div>' +
            '<button class="btn-read-more" onclick="UIController.abrirModal(\'' + tituloSeguro.replace(/'/g, "\\'") + '\',\'' + descSeguro.replace(/'/g, "\\'") + '\',\'' + imgSeguro.replace(/'/g, "\\'") + '\',\'' + (art.icono || '📦') + '\')">Ver detalles</button>' +
            '<button class="btn-contactar" style="margin-top:8px;width:100%;" onclick="event.stopPropagation(); UIController.contactarProducto(' + (art.usuario_id ? "'" + art.usuario_id + "'" : 'null') + ', \'' + tituloSeguro.replace(/'/g, "\\'") + '\')">📞 Contactar</button></div>';
    },
    renderizarArticulos: function(lista) { Paginador.inicializar('articulosContainer', 'paginacionCatalogo', lista, 9, this.renderizarTarjetaArticulo); },
    renderizarItemResultado: function(art) { var icono = art.icono || ''; var tituloSeguro = escHtml(art.titulo), descSeguro = escHtml(art.descripcion), imgSeguro = escHtml(art.imagen_url), catSeguro = escHtml(art.categoria), paisSeguro = escHtml(art.pais), modSeguro = escHtml(art.modalidad); var imagenHTML = art.imagen_url ? '<img src="' + imgSeguro + '" class="result-img" alt="' + tituloSeguro + '">' : '<div class="result-icon-fallback">' + icono + '</div>'; var exp = art._es_externo ? '<span class="badge badge-externo">🌐 Referencia Global</span>' : (art._es_expandido ? '<span class="badge badge-expandido">🌍 Zona lejana</span>' : ''); var pais = art.pais ? '<span class="badge badge-pais">📍 ' + paisSeguro + '</span>' : ''; var modal = art.modalidad ? '<span class="badge badge-modalidad">' + modSeguro + '</span>' : ''; return '<div class="result-item" onclick="UIController.abrirModal(\'' + tituloSeguro.replace(/'/g, "\\'") + '\',\'' + descSeguro.replace(/'/g, "\\'") + '\',\'' + imgSeguro.replace(/'/g, "\\'") + '\',\'' + icono + '\')">' + imagenHTML + '<div class="result-info"><div class="result-title">' + tituloSeguro + '</div><div class="result-category">' + catSeguro + '</div><div class="result-desc">' + descSeguro.substring(0, 100) + '...</div>' + '<div class="result-badges"><span class="badge badge-disponible">🟢 Disponible</span><span class="badge badge-distancia"> ' + art.distancia_km + ' km</span>' + pais + modal + exp + '</div></div>' + '<div class="result-actions"><div class="result-price">S/ ' + art.precio + '</div><button class="btn-contactar" onclick="event.stopPropagation(); UIController.contactarProducto(' + (art.usuario_id ? "'" + art.usuario_id + "'" : 'null') + ', \'' + tituloSeguro.replace(/'/g, "\\'") + '\')">📞 Contactar</button></div></div>'; },
    mostrarResultadosBusqueda: function(resultado) { this.elementos.searchBreadcrumb.style.display = 'flex'; this.elementos.searchQuery.textContent = resultado.query || ''; this.elementos.resultCount.textContent = resultado.coincidencias + ' resultados'; this.elementos.catalogContainer.style.display = 'none'; this.elementos.searchResultsContainer.style.display = 'block'; this.elementos.contentTitle.textContent = ' Resultados de Búsqueda'; var html = ''; if (resultado.lugar_sin_resultados) { html += '<div class="ai-context-banner expandido">📍 No encontramos esto en <strong>' + escHtml(resultado.lugar_sin_resultados) + '</strong>, pero sí en estas otras zonas:</div>'; } else if (resultado.lugar_aplicado) { html += '<div class="ai-context-banner">📍 Filtrado por: <strong>' + escHtml(resultado.lugar_aplicado) + '</strong></div>'; } else if (resultado.es_hibrido) { html += '<div class="ai-context-banner hibrido">🌐 <strong>Búsqueda Híbrida:</strong> Combinamos resultados locales con referencias globales.</div>'; } else if (resultado.es_expandido) { html += '<div class="ai-context-banner expandido"> <strong>Búsqueda global:</strong> No encontramos resultados cerca, pero te mostramos opciones internacionales.</div>'; } else { html += '<div class="ai-context-banner">📍 Mostrando resultados de ' + UbicacionUsuario.ciudad + ', ' + UbicacionUsuario.pais + '</div>'; } var hayExterno = (resultado.resultados_web && resultado.resultados_web.length) || (resultado.resultados_videos && resultado.resultados_videos.length);
if (resultado.coincidencias === 0 && hayExterno) { html += '<div style="text-align:center;padding:20px;"><p>No tienes productos publicados para esto, pero encontramos lo siguiente:</p></div>'; } else if (resultado.coincidencias === 0) { html += '<div style="text-align:center;padding:40px;"><p>No encontramos artículos. Intenta con sinónimos (ej: "camisa" o "polo").</p></div>'; } else { html += '<div id="resultadosProductosLista"></div>'; } var self = this; if (resultado.resultados_web && resultado.resultados_web.length) { html += '<div class="ai-context-banner" style="margin-top:20px;">🌐 <strong>Resultados de internet</strong></div>'; html += resultado.resultados_web.map(function(w) { return '<div class="result-item" onclick="window.open(\'' + escHtml(w.link) + '\', \'_blank\')"><div class="result-icon-fallback">🌐</div><div class="result-info"><div class="result-title">' + escHtml(w.titulo) + '</div><div class="result-desc">' + escHtml(w.resumen || '') + '</div></div></div>'; }).join(''); } if (resultado.resultados_videos && resultado.resultados_videos.length) { html += '<div class="ai-context-banner" style="margin-top:20px;">🎬 <strong>Videos de YouTube</strong></div>'; html += resultado.resultados_videos.map(function(v) { var miniatura = v.miniatura ? '<img src="' + escHtml(v.miniatura) + '" class="result-img" alt="' + escHtml(v.titulo) + '">' : '<div class="result-icon-fallback">🎬</div>'; return '<div class="result-item" onclick="window.open(\'' + escHtml(v.link) + '\', \'_blank\')">' + miniatura + '<div class="result-info"><div class="result-title">' + escHtml(v.titulo) + '</div><div class="result-category">' + escHtml(v.canal) + '</div></div></div>'; }).join(''); } this.elementos.searchResultsContent.innerHTML = html; if (resultado.coincidencias > 0) { Paginador.inicializar('resultadosProductosLista', 'paginacionBusqueda', resultado.resultados, 9, this.renderizarItemResultado); } else { var pc = document.getElementById('paginacionBusqueda'); if (pc) pc.innerHTML = ''; } },
    // etiqueta permite reusar esta misma vista para Música, cambiando solo el ícono/texto del banner
    mostrarResultadosVideo: function(tema, videos, etiqueta) {
        etiqueta = etiqueta || { icono: '🎬', titulo: 'Videos de YouTube', vacio: 'No encontramos videos sobre eso. Intenta con otras palabras.' };
        this.elementos.searchBreadcrumb.style.display = 'flex';
        this.elementos.searchQuery.textContent = tema || '';
        this.elementos.resultCount.textContent = videos.length + (videos.length === 1 ? ' video' : ' videos');
        this.elementos.catalogContainer.style.display = 'none';
        this.elementos.searchResultsContainer.style.display = 'block';
        this.elementos.contentTitle.textContent = ' Resultados de Búsqueda';
        var html = '<div class="ai-context-banner hibrido">' + etiqueta.icono + ' <strong>' + etiqueta.titulo + '</strong></div>';
        if (!videos.length) {
            html += '<div style="text-align:center;padding:40px;"><p>' + etiqueta.vacio + '</p></div>';
        } else {
            var self = this;
            html += videos.map(function(v) {
                var miniatura = v.miniatura ? '<img src="' + escHtml(v.miniatura) + '" class="result-img" alt="' + escHtml(v.titulo) + '">' : '<div class="result-icon-fallback">' + etiqueta.icono + '</div>';
                return '<div class="result-item" onclick="window.open(\'' + escHtml(v.link) + '\', \'_blank\')">' + miniatura + '<div class="result-info"><div class="result-title">' + escHtml(v.titulo) + '</div><div class="result-category">' + escHtml(v.canal) + '</div></div></div>';
            }).join('');
        }
        this.elementos.searchResultsContent.innerHTML = html;
    },
    mostrarResultadosWeb: function(tema, resultadosWeb) {
        this.elementos.searchBreadcrumb.style.display = 'flex';
        this.elementos.searchQuery.textContent = tema || '';
        this.elementos.resultCount.textContent = resultadosWeb.length + (resultadosWeb.length === 1 ? ' resultado' : ' resultados');
        this.elementos.catalogContainer.style.display = 'none';
        this.elementos.searchResultsContainer.style.display = 'block';
        this.elementos.contentTitle.textContent = ' Resultados de Búsqueda';
        var html = '<div class="ai-context-banner hibrido">🌐 <strong>Resultados de internet</strong></div>';
        if (!resultadosWeb.length) {
            html += '<div style="text-align:center;padding:40px;"><p>No encontramos nada en internet sobre eso. Intenta con otras palabras.</p></div>';
        } else {
            var self = this;
            html += resultadosWeb.map(function(w) {
                return '<div class="result-item" onclick="window.open(\'' + escHtml(w.link) + '\', \'_blank\')"><div class="result-icon-fallback">🌐</div><div class="result-info"><div class="result-title">' + escHtml(w.titulo) + '</div><div class="result-desc">' + escHtml(w.resumen || '') + '</div></div></div>';
            }).join('');
        }
        this.elementos.searchResultsContent.innerHTML = html;
    },
    mostrarListaCategorias: function(categorias) {
        this.elementos.searchBreadcrumb.style.display = 'flex';
        this.elementos.searchQuery.textContent = 'Categorías';
        this.elementos.resultCount.textContent = categorias.length + (categorias.length === 1 ? ' categoría' : ' categorías');
        this.elementos.catalogContainer.style.display = 'none';
        this.elementos.searchResultsContainer.style.display = 'block';
        this.elementos.contentTitle.textContent = ' Resultados de Búsqueda';
        var html = '<div class="ai-context-banner hibrido">📂 <strong>Categorías disponibles</strong></div>';
        if (!categorias.length) {
            html += '<div style="text-align:center;padding:40px;"><p>Todavía no hay categorías con productos publicados.</p></div>';
        } else {
            var self = this;
            html += '<div style="display:flex;flex-wrap:wrap;gap:10px;padding:16px 0;">' + categorias.map(function(c) {
                var nombreSeguro = escHtml(c.nombre);
                return '<button class="badge badge-modalidad" style="cursor:pointer;font-size:14px;padding:10px 16px;" onclick="UIController.buscarPorCategoriaClic(\'' + nombreSeguro.replace(/'/g, "\\'") + '\')">' + nombreSeguro + ' (' + c.cantidad + ')</button>';
            }).join('') + '</div>';
        }
        this.elementos.searchResultsContent.innerHTML = html;
    },
    buscarPorCategoriaClic: async function(nombreCategoria) {
        var resultado = await BuscadorMotor.ejecutarBusquedaHibrida(nombreCategoria);
        this.mostrarResultadosBusqueda(resultado);
    },
    contactarProducto: function(usuarioId, tituloProducto) {
        if (usuarioId) {
            if (typeof PanelUsuario !== 'undefined' && PanelUsuario.iniciarConversacionDirecta) {
                PanelUsuario.iniciarConversacionDirecta(usuarioId);
            }
        } else {
            // Productos de ejemplo/demo: no tienen un vendedor real detrás, así que en vez de
            // fingir un chat que nunca respondería, se invita a publicar algo real y parecido.
            if (confirm('Esta es una publicación de ejemplo y todavía no tiene un vendedor real. ¿Quieres publicar tú algo como "' + tituloProducto + '"?')) {
                if (typeof PanelUsuario !== 'undefined' && PanelUsuario.iniciarPublicacionDesdeAsistente) {
                    PanelUsuario.iniciarPublicacionDesdeAsistente(tituloProducto);
                }
            }
        }
    },
    mostrarResultadosPersonas: function(nombreBuscado, usuarios, nivelZona) {
        this._ultimaBusquedaPersonaNombre = nombreBuscado || '';
        this.elementos.searchBreadcrumb.style.display = 'flex';
        this.elementos.searchQuery.textContent = nombreBuscado || '';
        this.elementos.resultCount.textContent = usuarios.length + (usuarios.length === 1 ? ' persona' : ' personas');
        this.elementos.catalogContainer.style.display = 'none';
        this.elementos.searchResultsContainer.style.display = 'block';
        this.elementos.contentTitle.textContent = ' Resultados de Búsqueda';
        var activo = function(n) { return nivelZona === n ? 'activo' : ''; };
        var html = '<div class="ai-context-banner">👤 <strong>Búsqueda de personas:</strong> resultados por nombre, iniciales o zona en remarket-db</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 16px;">' +
            '<button type="button" id="filtroZona-local-resultados" class="compartir-filtro-zona ' + activo('local') + '" onclick="UIController.filtrarResultadosPersonasPorZona(\'local\')">📍 Local</button>' +
            '<button type="button" id="filtroZona-regional-resultados" class="compartir-filtro-zona ' + activo('regional') + '" onclick="UIController.filtrarResultadosPersonasPorZona(\'regional\')">🗺️ Regional</button>' +
            '<button type="button" id="filtroZona-pais-resultados" class="compartir-filtro-zona ' + activo('pais') + '" onclick="UIController.filtrarResultadosPersonasPorZona(\'pais\')">🌎 País</button>' +
            '</div>';
        if (!usuarios.length) {
            html += '<div style="text-align:center;padding:40px;"><p>No encontramos a nadie con ese nombre o zona. Prueba con otro nombre, iniciales, o quita el filtro.</p></div>';
        } else {
            var self = this;
            html += usuarios.map(function(u) {
                var nombreSeguro = escHtml(u.nombre_completo);
                var iniciales = (u.nombre_completo || 'U').trim().charAt(0).toUpperCase();
                var avatar = u.foto_perfil ? '<img src="' + escHtml(u.foto_perfil) + '" class="result-img" alt="' + nombreSeguro + '">' : '<div class="result-icon-fallback">' + iniciales + '</div>';
                return '<div class="result-item" onclick="PanelUsuario.abrirVistaPreviaPersona(\'' + u.id + '\')">' + avatar +
                    '<div class="result-info"><div class="result-title">' + nombreSeguro + '</div><div class="result-category">Usuario de remarket-db</div></div>' +
                    '<div class="result-actions">' +
                    '<button class="btn-contactar" onclick="event.stopPropagation(); PanelUsuario.abrirVistaPreviaPersona(\'' + u.id + '\')">👁️ Vista previa</button>' +
                    '<button class="btn-contactar" onclick="event.stopPropagation(); PanelUsuario.iniciarConversacionDirecta(\'' + u.id + '\')">💬 Mensaje</button>' +
                    '</div></div>';
            }).join('');
        }
        this.elementos.searchResultsContent.innerHTML = html;
    },
    // Vuelve a buscar personas combinando el último nombre escrito con la zona elegida (o la quita si ya estaba activa)
    filtrarResultadosPersonasPorZona: async function(nivel) {
        var btn = document.getElementById('filtroZona-' + nivel + '-resultados');
        var yaActivo = btn && btn.classList.contains('activo');
        var nuevoNivel = yaActivo ? null : nivel;
        var nombre = this._ultimaBusquedaPersonaNombre || '';
        var usuarios = await PanelUsuario.buscarUsuariosPorNombre(nombre, nuevoNivel);
        this.mostrarResultadosPersonas(nombre, usuarios, nuevoNivel);
    },
    cerrarResultados: function() { this.elementos.searchResultsContainer.style.display = 'none'; this.elementos.searchBreadcrumb.style.display = 'none'; this.elementos.catalogContainer.style.display = 'block'; this.elementos.contentTitle.textContent = ' Catálogo de Economía Circular'; },
    abrirModal: function(titulo, desc, imgUrl, icono) { document.getElementById('modalTitle').innerText = titulo; document.getElementById('modalDesc').innerText = desc; var imgContainer = document.getElementById('modalImgContainer'); if (imgUrl) { imgContainer.innerHTML = '<img src="' + escHtml(imgUrl) + '" class="modal-img-real" alt="' + escHtml(titulo) + '">'; } else { imgContainer.innerHTML = '<div style="font-size:80px;">' + icono + '</div>'; } var btnQR = document.getElementById('btnVerQR'); btnQR.onclick = function() { var urlProducto = window.location.origin + '?producto=' + encodeURIComponent(titulo); var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(urlProducto) + '&bgcolor=ffffff&color=8B5CF6'; document.getElementById('qrImageContainer').innerHTML = '<img src="' + qrUrl + '" alt="QR del producto">'; document.getElementById('qrModal').style.display = 'flex'; }; this.elementos.modal.style.display = 'flex'; },
    cerrarModal: function() { this.elementos.modal.style.display = 'none'; },
    cerrarQRModal: function() { document.getElementById('qrModal').style.display = 'none'; }
};
