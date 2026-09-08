// ============================================
// PAGINADOR — sistema reutilizable de paginación clásica (números de página)
// Se usa igual en el catálogo, en los resultados de búsqueda, y (a futuro) en el muro.
// ============================================
var Paginador = {
    estado: {},

    // contenedorId: dónde van los items de la página actual
    // controlesId: dónde van los botones de página (Anterior / 1 2 3 / Siguiente)
    // items: el arreglo completo (ya filtrado/ordenado)
    // porPagina: cuántos items por página
    // renderFn: función que recibe un item y devuelve su HTML como texto
    inicializar: function(contenedorId, controlesId, items, porPagina, renderFn) {
        this.estado[contenedorId] = { items: items, porPagina: porPagina, renderFn: renderFn, controlesId: controlesId, pagina: 1 };
        this.renderizarPagina(contenedorId);
    },

    renderizarPagina: function(contenedorId) {
        var e = this.estado[contenedorId];
        if (!e) return;
        var totalPaginas = Math.max(1, Math.ceil(e.items.length / e.porPagina));
        if (e.pagina > totalPaginas) e.pagina = totalPaginas;
        var inicio = (e.pagina - 1) * e.porPagina;
        var itemsPagina = e.items.slice(inicio, inicio + e.porPagina);
        var contenedor = document.getElementById(contenedorId);
        if (contenedor) contenedor.innerHTML = itemsPagina.map(e.renderFn).join('');
        this.renderizarControles(contenedorId);
    },

    renderizarControles: function(contenedorId) {
        var e = this.estado[contenedorId];
        var controles = document.getElementById(e.controlesId);
        if (!controles) return;
        var totalPaginas = Math.max(1, Math.ceil(e.items.length / e.porPagina));
        if (totalPaginas <= 1) { controles.innerHTML = ''; return; }

        var html = '<div class="paginacion" style="display:flex;justify-content:center;align-items:center;gap:6px;margin:20px 0;flex-wrap:wrap;">';
        html += '<button ' + (e.pagina === 1 ? 'disabled style="opacity:0.4;"' : '') + ' onclick="Paginador.irAPagina(\'' + contenedorId + '\',' + (e.pagina - 1) + ')" style="padding:8px 12px;border-radius:8px;border:1px solid #E5E7EB;background:white;cursor:pointer;">← Anterior</button>';
        for (var i = 1; i <= totalPaginas; i++) {
            var esActiva = i === e.pagina;
            html += '<button onclick="Paginador.irAPagina(\'' + contenedorId + '\',' + i + ')" style="padding:8px 12px;border-radius:8px;border:1px solid ' + (esActiva ? '#7C3AED' : '#E5E7EB') + ';background:' + (esActiva ? '#7C3AED' : 'white') + ';color:' + (esActiva ? 'white' : '#111827') + ';font-weight:' + (esActiva ? '700' : '400') + ';cursor:pointer;">' + i + '</button>';
        }
        html += '<button ' + (e.pagina === totalPaginas ? 'disabled style="opacity:0.4;"' : '') + ' onclick="Paginador.irAPagina(\'' + contenedorId + '\',' + (e.pagina + 1) + ')" style="padding:8px 12px;border-radius:8px;border:1px solid #E5E7EB;background:white;cursor:pointer;">Siguiente →</button>';
        html += '</div>';
        controles.innerHTML = html;
    },

    irAPagina: function(contenedorId, pagina) {
        var e = this.estado[contenedorId];
        if (!e) return;
        e.pagina = pagina;
        this.renderizarPagina(contenedorId);
        var contenedor = document.getElementById(contenedorId);
        if (contenedor) contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
