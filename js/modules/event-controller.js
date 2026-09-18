var EventController = {
    // Manejador central: interpreta la etiqueta [ACCION: ...] de la IA y decide qué mostrar.
    // Lo usan tanto el Asistente lateral como el buscador de la barra principal, para que
    // las dos entradas se comporten siempre igual (antes cada una tenía su propia versión, a medias).
    procesarAccionIA: async function(respuestaIA, queryOriginal) {
        var accionMatch = respuestaIA.match(/\[ACCION:\s*([^\]\|]+)/i);
        var accion = accionMatch ? accionMatch[1].trim().toUpperCase() : '';
        // Respaldo: si el mensaje claramente pide explorar la zona/categorías y la IA no lo
        // reconoció así, se corrige aquí en vez de dejar que caiga en RECIENTES o una búsqueda rara.
        if (typeof detectarIntencionExplorarLocalidad === 'function' && detectarIntencionExplorarLocalidad(queryOriginal)) {
            accion = 'EXPLORAR_LOCALIDAD';
        }
        if (typeof detectarIntencionQuienesSomos === 'function' && detectarIntencionQuienesSomos(queryOriginal)) {
            accion = 'QUIENES_SOMOS';
        }

        if (accion === 'BUSCAR') {
            var prodMatch = respuestaIA.match(/PRODUCTO:\s*([^\|\]]+)/i);
            var producto = prodMatch ? prodMatch[1].trim() : queryOriginal;
            var resultado = await BuscadorMotor.ejecutarBusquedaHibrida(producto, this.leerOpcionesExtra(respuestaIA, queryOriginal));
            UIController.mostrarResultadosBusqueda(resultado);
        } else if (accion === 'LISTAR_CATEGORIAS') {
            var categorias = BuscadorMotor.obtenerCategoriasDisponibles();
            UIController.mostrarListaCategorias(categorias);
        } else if (accion === 'QUIENES_SOMOS') {
            var textoQuienesSomos = await Institucional.obtenerTextoQuienesSomos();
            UIController.mostrarQuienesSomosEnMuro(textoQuienesSomos);
        } else if (accion === 'EXPLORAR_LOCALIDAD') {
            var matriz = BuscadorMotor.obtenerMatrizPorLocalidad();
            UIController.mostrarMatrizLocalidad(matriz);
        } else if (accion === 'CATEGORIA') {
            var catMatch = respuestaIA.match(/CATEGORIA:\s*([^\|\]]+)/i);
            var categoria = catMatch ? catMatch[1].trim() : queryOriginal;
            var resultadoCat = await BuscadorMotor.ejecutarBusquedaHibrida(categoria, this.leerOpcionesExtra(respuestaIA, queryOriginal));
            UIController.mostrarResultadosBusqueda(resultadoCat);
        } else if (accion === 'RECIENTES') {
            var recientes = BuscadorMotor.obtenerRecientes(12);
            UIController.mostrarResultadosBusqueda({ resultados: recientes, total: BuscadorMotor.catalogo.length, coincidencias: recientes.length, query: 'Novedades', es_expandido: false, es_hibrido: false, resultados_web: null, resultados_videos: null });
        } else if (accion === 'VIDEO') {
            var videoMatch = respuestaIA.match(/PRODUCTO:\s*([^\|\]]+)/i);
            var temaVideo = videoMatch ? videoMatch[1].trim() : queryOriginal;
            var videos = await BuscadorMotor.buscarSoloVideo(temaVideo);
            UIController.mostrarResultadosVideo(temaVideo, videos);
        } else if (accion === 'MUSICA') {
            var musicaMatch = respuestaIA.match(/PRODUCTO:\s*([^\|\]]+)/i);
            var temaMusica = musicaMatch ? musicaMatch[1].trim() : queryOriginal;
            var canciones = await BuscadorMotor.buscarSoloMusica(temaMusica);
            UIController.mostrarResultadosVideo(temaMusica, canciones, { icono: '🎵', titulo: 'Música', vacio: 'No encontramos música sobre eso. Intenta con otras palabras.' });
        } else if (accion === 'INTERNET') {
            var webMatch = respuestaIA.match(/PRODUCTO:\s*([^\|\]]+)/i);
            var temaWeb = webMatch ? webMatch[1].trim() : queryOriginal;
            var web = await BuscadorMotor.buscarSoloWeb(temaWeb);
            UIController.mostrarResultadosWeb(temaWeb, web);
        } else if (accion === 'PUBLICAR') {
            var tituloMatch = respuestaIA.match(/TITULO:\s*([^\|\]]+)/i);
            var tituloSugerido = tituloMatch ? tituloMatch[1].trim() : queryOriginal;
            PanelUsuario.iniciarPublicacionDesdeAsistente(tituloSugerido);
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

    // Lee ORDEN / UBICACION / MODALIDAD de la etiqueta que puso la IA, y si alguno faltó,
    // lo intenta detectar igual con las palabras clave del mensaje original (respaldo, misma
    // idea que ya se usa para EXPLORAR_LOCALIDAD y QUIENES_SOMOS). Así, aunque el modelo se
    // olvide de poner un parámetro, no se pierde si el usuario lo pidió de forma explícita.
    leerOpcionesExtra: function(respuestaIA, queryOriginal) {
        var opciones = {};
        var ordenMatch = respuestaIA.match(/ORDEN:\s*(precio_asc|precio_desc)/i);
        opciones.orden = ordenMatch ? ordenMatch[1].toLowerCase() : (typeof detectarIntencionOrden === 'function' ? detectarIntencionOrden(queryOriginal) : null);

        var ubicacionMatch = /UBICACION:\s*propia/i.test(respuestaIA);
        opciones.ubicacionPropia = ubicacionMatch || (typeof detectarIntencionUbicacionPropia === 'function' && detectarIntencionUbicacionPropia(queryOriginal));

        var modalidadMatch = respuestaIA.match(/MODALIDAD:\s*(venta|trueque|donacion)/i);
        opciones.modalidad = modalidadMatch ? modalidadMatch[1].toLowerCase() : null;

        return opciones;
    },

    manejarEnvioMensaje: async function(event) { event.preventDefault(); var input = document.getElementById('assistantInput'); var mensaje = input.value.trim(); if (!mensaje) return; UIController.mostrarRespuestaIA(mensaje, 'user'); input.value = ''; if (typeof Institucional !== 'undefined' && Institucional.reclamoEnCurso) { Institucional.procesarRespuestaReclamo(mensaje); return; } if (typeof Institucional !== 'undefined' && Institucional.contactoEnCurso) { Institucional.procesarRespuestaContacto(mensaje); return; } if (typeof detectarPreguntaHora === 'function' && detectarPreguntaHora(mensaje)) { UIController.mostrarRespuestaIA(responderHoraLocal()); return; } if (typeof BuscadorMotor !== 'undefined' && BuscadorMotor.detectarIntencionMatriz) { var intentoMatrizChat = BuscadorMotor.detectarIntencionMatriz(mensaje); if (intentoMatrizChat) { if (intentoMatrizChat.tipo === 'matriz') { UIController._matrizPila = []; var matrizChat = BuscadorMotor.obtenerMatrizNiveles(intentoMatrizChat.categorias, intentoMatrizChat.nivel, intentoMatrizChat.lugar); UIController.mostrarMatrizNiveles(matrizChat); } else { var resultadoDirectoChat = await BuscadorMotor.ejecutarBusquedaHibrida(intentoMatrizChat.categorias[0] + ' ' + intentoMatrizChat.lugar); UIController.mostrarResultadosBusqueda(resultadoDirectoChat); } return; } } var codigoIdioma = detectarCambioIdiomaEnMensaje(mensaje); if (codigoIdioma) { aplicarCambioIdiomaDesdeChat(codigoIdioma); UIController.mostrarRespuestaIA('✅ Listo, cambié el idioma a ' + (NOMBRES_IDIOMA_DISPLAY[codigoIdioma] || codigoIdioma) + '.'); return; } if (typeof detectarIdiomaEscritoEnMensaje === 'function') { var idiomaEscrito = detectarIdiomaEscritoEnMensaje(mensaje); if (idiomaEscrito) aplicarIdiomaSilencioso(idiomaEscrito); } if (typeof detectarIntencionReclamo === 'function' && detectarIntencionReclamo(mensaje)) { Institucional.iniciarReclamoGuiado(true); return; } if (typeof detectarIntencionContactoAdmin === 'function' && detectarIntencionContactoAdmin(mensaje)) { Institucional.iniciarContactoGuiado(true); return; } UIController.mostrarEstadoCarga(); var respuestaIA = await AIService.enviarMensaje(mensaje); UIController.quitarEstadoCarga(); UIController.mostrarRespuestaIA(respuestaIA); var panelActivoChat = document.getElementById('userPanelView').classList.contains('active'); try { if (panelActivoChat) { await PanelUsuario.procesarAccionEnFeed(respuestaIA, mensaje); } else { await EventController.procesarAccionIA(respuestaIA, mensaje); } } catch (e) { console.error('remarket-db: error al procesar la acción del Asistente', e); UIController.mostrarRespuestaIA('(No pude mostrar el resultado en pantalla: ' + (e.message || 'error desconocido') + ')'); } },
    manejarBusquedaPrincipal: async function(event) { event.preventDefault(); var input = document.getElementById('dynamicSearch'); var query = input.value.trim(); if (!query) return; var codigoIdioma = detectarCambioIdiomaEnMensaje(query); if (codigoIdioma) { aplicarCambioIdiomaDesdeChat(codigoIdioma); input.value = ''; return; } if (typeof detectarIdiomaEscritoEnMensaje === 'function') { var idiomaEscrito = detectarIdiomaEscritoEnMensaje(query); if (idiomaEscrito) aplicarIdiomaSilencioso(idiomaEscrito); } if (typeof detectarPreguntaHora === 'function' && detectarPreguntaHora(query)) { UIController.mostrarRespuestaIA(responderHoraLocal()); return; } if (typeof BuscadorMotor !== 'undefined' && BuscadorMotor.detectarIntencionMatriz) { var intentoMatriz = BuscadorMotor.detectarIntencionMatriz(query); if (intentoMatriz) { if (intentoMatriz.tipo === 'matriz') { UIController._matrizPila = []; var matriz = BuscadorMotor.obtenerMatrizNiveles(intentoMatriz.categorias, intentoMatriz.nivel, intentoMatriz.lugar); UIController.mostrarMatrizNiveles(matriz); } else { var resultadoDirecto = await BuscadorMotor.ejecutarBusquedaHibrida(intentoMatriz.categorias[0] + ' ' + intentoMatriz.lugar); UIController.mostrarResultadosBusqueda(resultadoDirecto); } return; } } var panelActivo = document.getElementById('userPanelView').classList.contains('active'); if (panelActivo) { try { await PanelUsuario.ejecutarBusquedaConIA(query); } catch (e) { console.error('remarket-db: error en ejecutarBusquedaConIA', e); var cont = document.getElementById('userFeedContainer'); if (cont) cont.innerHTML = '<div class="feed-empty"><p>Ocurrió un error al buscar: ' + (e.message || 'motivo desconocido') + '</p><button class="btn-publicar" onclick="PanelUsuario.cargarFeed()">Volver al inicio</button></div>'; } return; } var container = UIController.elementos.searchResultsContainer; var content = UIController.elementos.searchResultsContent; container.style.display = 'block'; UIController.elementos.catalogContainer.style.display = 'none'; content.innerHTML = '<div class="search-loading"><div class="search-loading-spinner"></div><p> El Asistente IA está buscando en tu zona y en el mundo...</p></div>'; try { var respuestaIA = await AIService.enviarMensaje(query); UIController.mostrarRespuestaIA(respuestaIA); await EventController.procesarAccionIA(respuestaIA, query); } catch (e) { console.error('remarket-db: error en manejarBusquedaPrincipal', e); content.innerHTML = '<div style="text-align:center;padding:40px;"><p>Ocurrió un error al buscar: ' + (e.message || 'motivo desconocido') + '</p></div>'; } },
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

