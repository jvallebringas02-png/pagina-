// Ejemplo de cómo debe recibir main.js la respuesta de la IA:
async function manejarMensajeChat(textoUsuario) {
    // 1. Llamamos a la IA que acabamos de actualizar
    const respuestaIA = await AIService.procesarRespuestaIA(textoUsuario);

    // 2. Si la IA devuelve una búsqueda avanzada con filtros complejos
    if (respuestaIA.tipo === 'buscar_avanzado') {
        // Obtenemos los productos actuales de tu base de datos / plataforma
        let productos = obtenerTodosLosProductos(); // (o como se llame tu array de productos)

        // Aplicamos los filtros que la IA extrajo del prompt del usuario
        let filtrados = productos.filter(p => {
            let coincideQuery = true;
            let coincideUbicacion = true;
            let coincideOferta = true;

            // Filtro por texto/categoría (ej: zapatos)
            if (respuestaIA.filtros.query) {
                const q = respuestaIA.filtros.query.toLowerCase();
                const titulo = p.titulo ? p.titulo.toLowerCase() : '';
                const cat = p.categoria ? p.categoria.toLowerCase() : '';
                coincideQuery = titulo.includes(q) || cat.includes(q);
            }

            // Filtro por ubicación (si no es mundial)
            if (respuestaIA.filtros.ubicacion && respuestaIA.filtros.ubicacion.toLowerCase() !== 'mundial') {
                const loc = respuestaIA.filtros.ubicacion.toLowerCase();
                const pais = p.pais ? p.pais.toLowerCase() : '';
                const ciudad = p.ciudad ? p.ciudad.toLowerCase() : '';
                coincideUbicacion = pais.includes(loc) || ciudad.includes(loc);
            }

            // Filtro por ofertas
            if (respuestaIA.filtros.soloOfertas) {
                coincideOferta = p.en_oferta === true || p.descuento > 0;
            }

            return coincideQuery && coincideUbicacion && coincideOferta;
        });

        // 3. ¡Pintamos el resultado directamente en el Muro!
        UIController.pintarProductosEnElMuro(filtrados);

        // 4. Mostramos el mensaje amigable en el chat
        UIController.agregarMensajeChat("Asistente", respuestaIA.contenidoChat);
    } 
    else {
        // Si es texto normal, saludo o matriz, lo maneja como ya lo tenías
        UIController.agregarMensajeChat("Asistente", respuestaIA.contenido);
    }
}