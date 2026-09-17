// Ejemplo de cómo aplicar los filtros que entrega la IA en tu archivo principal o buscador.js:
function aplicarFiltrosAvanzadosEnMuro(filtros, todosLosProductos) {
    let resultados = [...todosLosProductos];

    // 1. Filtrar por texto / categoría (ej: "zapatos", "ropa")
    if (filtros.query && filtros.query.trim() !== "") {
        const q = filtros.query.toLowerCase();
        resultados = resultados.filter(p => 
            (p.titulo && p.titulo.toLowerCase().includes(q)) || 
            (p.categoria && p.categoria.toLowerCase().includes(q)) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(q))
        );
    }

    // 2. Filtrar por ubicación (si no es mundial)
    if (filtros.ubicacion && filtros.ubicacion.toLowerCase() !== "mundial" && filtros.ubicacion.toLowerCase() !== "global") {
        const loc = filtros.ubicacion.toLowerCase();
        resultados = resultados.filter(p => 
            (p.ciudad && p.ciudad.toLowerCase().includes(loc)) || 
            (p.pais && p.pais.toLowerCase().includes(loc))
        );
    }

    // 3. Filtrar por ofertas/promociones
    if (filtros.soloOfertas === true) {
        resultados = resultados.filter(p => p.en_oferta === true || (p.descuento && p.descuento > 0));
    }

    // 4. Ordenar por precio más bajo
    if (filtros.ordenarPor === "precio_bajo") {
        resultados.sort((a, b) => Number(a.precio) - Number(b.precio));
    }

    return resultados;
}