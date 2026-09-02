var EventController = {
    // Manejador central: interpreta la etiqueta [ACCION: ...] de la IA y decide qué mostrar.
    // Lo usan tanto el Asistente lateral como el buscador de la barra principal, para que
    // las dos entradas se comporten siempre igual (antes cada una tenía su propia versión, a medias).
    procesarAccionIA: async function(respuestaIA, queryOriginal) {
        var accionMatch = respuestaIA.match(/\[ACCION:\s*([^\]\|]+)/i);
        var accion = accionMatch ? accionMatch[1].trim().toUpperCase() : '';

        if (accion === 'BUSCAR') {
            var prodMatch = respuestaIA.match(/PRODUCTO:\s*([^\|\]]+)/i);
            var producto = prodMatch ? prodMatch[1].trim() : queryOriginal;
            var resultado = await BuscadorMotor.ejecutarBusquedaHibrida(producto);
            UIController.mostrarResultadosBusqueda(resultado);
        } else if (accion === 'CATEGORIA') {
            var catMatch = respuestaIA.match(/CATEGORIA:\s*([^\|\]]+)/i);
            var categoria = catMatch ? catMatch[1].trim() : queryOriginal;
            var resultadoCat = await BuscadorMotor.ejecutarBusquedaHibrida(categoria);
            UIController.mostrarResultadosBusqueda(resultadoCat);
        } else if (accion === 'RECIENTES') {
            // "Lo más reciente" = mostrar el catálogo normal, sin filtro alguno
            UIController.cerrarResultados();
        } else if (accion === 'BUSCAR_PERSONA') {
            var nombreMatch = respuestaIA.match(/NOMBRE:\s*([^\|\]]+)/i);
            var nombre = nombreMatch ? nombreMatch[1].trim() : queryOriginal;
            var usuarios = await PanelUsuario.buscarUsuariosPorNombre(nombre);
            if ((!usuarios || !usuarios.length) && usuarioActual) {
                // Sin coincidencia por nombre: probamos la misma expansión por zona/categoría que usa Compartir
                var resultadoIA = await PanelUsuario.consultarAsistenteCompartir(nombre, null);
                if (resultadoIA.tipo === 'busqueda') usuarios = await PanelUsuario.buscarUsuariosCompartir(resultadoIA.categoria, resultadoIA.nivel_zona);
            }
            UIController.mostrarResultadosPersonas(nombre, usuarios || []);
        } else {
            UIController.cerrarResultados();
        }
    },

    manejarEnvioMensaje: async function(event) { event.preventDefault(); var input = document.getElementById('assistantInput'); var mensaje = input.value.trim(); if (!mensaje) return; UIController.mostrarRespuestaIA(mensaje, 'user'); input.value = ''; var codigoIdioma = detectarCambioIdiomaEnMensaje(mensaje); if (codigoIdioma) { aplicarCambioIdiomaDesdeChat(codigoIdioma); UIController.mostrarRespuestaIA('✅ Listo, cambié el idioma a ' + (NOMBRES_IDIOMA_DISPLAY[codigoIdioma] || codigoIdioma) + '.'); return; } UIController.mostrarEstadoCarga(); var respuestaIA = await AIService.enviarMensaje(mensaje); UIController.quitarEstadoCarga(); UIController.mostrarRespuestaIA(respuestaIA); await EventController.procesarAccionIA(respuestaIA, mensaje); },
    manejarBusquedaPrincipal: async function(event) { event.preventDefault(); var input = document.getElementById('dynamicSearch'); var query = input.value.trim(); if (!query) return; var codigoIdioma = detectarCambioIdiomaEnMensaje(query); if (codigoIdioma) { aplicarCambioIdiomaDesdeChat(codigoIdioma); input.value = ''; return; } var panelActivo = document.getElementById('userPanelView').classList.contains('active'); if (panelActivo) { PanelUsuario.ejecutarBusquedaConIA(query); return; } var container = UIController.elementos.searchResultsContainer; var content = UIController.elementos.searchResultsContent; container.style.display = 'block'; UIController.elementos.catalogContainer.style.display = 'none'; content.innerHTML = '<div class="search-loading"><div class="search-loading-spinner"></div><p> El Asistente IA está buscando en tu zona y en el mundo...</p></div>'; var respuestaIA = await AIService.enviarMensaje(query); UIController.mostrarRespuestaIA(respuestaIA); await EventController.procesarAccionIA(respuestaIA, query); },
    manejarLimpiarChat: function() {
        if (confirm("¿Borrar conversación?")) {
            AIService.limpiarHistorial();
            document.getElementById('assistantResponse').innerHTML = '<div class="chat-message assistant">💬 Conversación reiniciada. ¿En qué puedo ayudarte?</div>';
            var buscador = document.getElementById('dynamicSearch');
            if (buscador) buscador.value = ''; // limpiar el chat también limpia lo que quedó escrito en el buscador
            if (typeof UIController !== 'undefined' && UIController.cerrarResultados) UIController.cerrarResultados(); // y cierra el panel de resultados que haya quedado abierto
        }
    }
};

