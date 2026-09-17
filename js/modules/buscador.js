// ============================================
// BUSCADOR - remarket-db
// ============================================

// ============================================
// CONSTRUIR DATOS PARA LA MATRIZ (Arreglado)
// ============================================
function construirDatosMatriz(productos, alcance = 'mundial') {
    const datos = {};
    
    productos.forEach(prod => {
        // 🛡️ ARREGLO DEL BUG SILENCIOSO: 
        // Si el producto no tiene ciudad o país, lo asignamos a "Sin ubicación"
        const pais = (prod.pais || 'Sin ubicación').toLowerCase().trim();
        const ciudad = (prod.ciudad || 'Sin ubicación').toLowerCase().trim();
        const categoria = (prod.categoria || 'Otros').toLowerCase().trim();

        if (alcance === 'mundial') {
            if (!datos[categoria]) {
                datos[categoria] = { total: 0, paises: {} };
            }
            datos[categoria].total += 1;
            
            if (!datos[categoria].paises[pais]) {
                datos[categoria].paises[pais] = 0;
            }
            datos[categoria].paises[pais] += 1;
            
        } else if (alcance === 'pais') {
            if (!datos[categoria]) {
                datos[categoria] = { total: 0, ciudades: {} };
            }
            datos[categoria].total += 1;
            
            if (!datos[categoria].ciudades[ciudad]) {
                datos[categoria].ciudades[ciudad] = 0;
            }
            datos[categoria].ciudades[ciudad] += 1;
        }
    });
    
    return datos;
}

// ============================================
// EJECUTAR BÚSQUEDA HÍBRIDA
// ============================================
function ejecutarBusquedaHibrida(producto, opciones = {}) {
    const { ubicacion, modalidad, categoria } = opciones;
    
    // Aquí va tu lógica de búsqueda existente
    // Ejemplo:
    const productosFiltrados = filtrarProductos(producto, { ubicacion, modalidad, categoria });
    
    if (productosFiltrados.length > 0) {
        mostrarResultados(productosFiltrados);
    } else {
        // Búsqueda externa como fallback
        buscarExterno(producto);
    }
}

// ============================================
// FILTRAR PRODUCTOS
// ============================================
function filtrarProductos(textoBusqueda, opciones = {}) {
    const { ubicacion, modalidad, categoria } = opciones;
    
    // Aquí va tu lógica de filtrado existente
    // Ejemplo simplificado:
    return window.catalogoProductos.filter(prod => {
        const coincideTexto = !textoBusqueda || 
            prod.titulo.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
            prod.descripcion.toLowerCase().includes(textoBusqueda.toLowerCase());
        
        const coincideUbicacion = !ubicacion || 
            (prod.ciudad && prod.ciudad.toLowerCase().includes(ubicacion.toLowerCase()));
        
        const coincideModalidad = !modalidad || prod.modalidad === modalidad;
        const coincideCategoria = !categoria || prod.categoria.toLowerCase() === categoria.toLowerCase();
        
        return coincideTexto && coincideUbicacion && coincideModalidad && coincideCategoria;
    });
}

// ============================================
// MOSTRAR RESULTADOS
// ============================================
function mostrarResultados(productos) {
    if (typeof UIController !== 'undefined' && UIController.mostrarResultadosBusqueda) {
        UIController.mostrarResultadosBusqueda(productos);
    }
}

// ============================================
// BÚSQUEDA EXTERNA (Fallback)
// ============================================
function buscarExterno(texto) {
    // Aquí va tu lógica de búsqueda externa existente
    console.log('Buscando externamente:', texto);
}

// ============================================
// TOKENIZAR TEXTO (Para búsqueda inteligente)
// ============================================
function tokenizar(texto) {
    return texto.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)
        .filter(palabra => palabra.length > 2);
}

// ============================================
// CALCULAR PUNTUACIÓN DE COINCIDENCIA
// ============================================
function calcularPuntaje(producto, tokensBusqueda) {
    let puntaje = 0;
    
    tokensBusqueda.forEach(token => {
        if (producto.titulo.toLowerCase().includes(token)) puntaje += 3;
        if (producto.categoria.toLowerCase().includes(token)) puntaje += 2;
        if (producto.descripcion.toLowerCase().includes(token)) puntaje += 1;
    });
    
    return puntaje;
}

// Exportar funciones si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        construirDatosMatriz,
        ejecutarBusquedaHibrida,
        filtrarProductos,
        tokenizar,
        calcularPuntaje
    };
}