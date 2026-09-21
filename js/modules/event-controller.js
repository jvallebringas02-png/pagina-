var EventController = {
    // Manejador central: recibe el objeto de datos que ya devolvió la IA estructurada (ver
    // AIService.enviarMensajeEstructurado) y decide qué mostrar. Ya no hace falta "leer"
    // ninguna etiqueta de texto con expresiones regulares -- los datos ya vienen separados y
    // listos para usar, sea cual sea la forma en que el usuario haya escrito su pedido.
    procesarAccionIA: async function(datos, queryOriginal) {
        var accion = datos.accion;
        // Respaldo: si el mensaje claramente pide explorar la zona/categorías y la IA no lo
        // reconoció así, se corrige aquí en vez de dejar que caiga en RECIENTES o una búsqueda rara.
        if (typeof detectarIntencionExplorarLocalidad === 'function' && detectarIntencionExplorarLocalidad(queryOriginal)) {
            accion = 'EXPLORAR_LOCALIDAD';
        }
        if (typeof detectarIntencionQuienesSomos === 'function' && detectarIntencionQuienesSomos(queryOriginal)) {
            accion = 'QUIENES_SOMOS';
        }

        var opciones = { orden: datos.orden || null, ubicacionPropia: datos.ubicacion === 'propia', modalidad: datos.modalidad || null };

        // "nivel_matriz" manda por encima de cualquier otra acción -- si la IA entendió que el
        // usuario quiere la vista de matriz (mundial o por país), sin importar cómo lo haya
        // escrito ("a nivel mundial", "en todo el mundo", "por región"...), se arma acá
        // directamente. Antes esto dependía de que una frase exacta calzara con una expresión
        // regular en JS (por eso "a nivel mundial" se rompía); ahora es la IA quien interpreta
        // la frase, y este código solo lee el resultado ya decidido.
        if (datos.nivel_matriz === 'mundial' || datos.nivel_matriz === 'pais') {
            var textoCategoria = datos.categoria || datos.producto || null;
            var categoriaResuelta = (textoCategoria && typeof BuscadorMotor.resolverCategoriaDesdeTexto === 'function')
                ? (BuscadorMotor.resolverCategoriaDesdeTexto(textoCategoria) || textoCategoria)
                : textoCategoria;
            var categoriasFiltroMatriz = categoriaResuelta ? [categoriaResuelta] : null;
            var lugarMatriz = null;
            if (datos.nivel_matriz === 'pais' && typeof UbicacionUsuario !== 'undefined') {
                lugarMatriz = UbicacionUsuario.pais || null;
            }
            UIController._matrizPila = [];
            var matrizIA = BuscadorMotor.obtenerMatrizNiveles(categoriasFiltroMatriz, datos.nivel_matriz, lugarMatriz);
            UIController.mostrarMatrizNiveles(matrizIA);
            return;
        }

        if (accion === 'BUSCAR') {
            var producto = datos.producto || queryOriginal;
            var resultado = await BuscadorMotor.ejecutarBusquedaHibrida(producto, opciones);
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
            var categoria = datos.categoria || queryOriginal;
            var resultadoCat = await BuscadorMotor.ejecutarBusquedaHibrida(categoria, opciones);
            UIController.mostrarResultadosBusqueda(resultadoCat);
        } else if (accion === 'RECIENTES') {
            var recientes = BuscadorMotor.obtenerRecientes(12);
            UIController.mostrarResultadosBusqueda({ resultados: recientes, total: BuscadorMotor.catalogo.length, coincidencias: recientes.length, query: 'Novedades', es_expandido: false, es_hibrido: false, resultados_web: null, resultados_videos: null });
        } else if (accion === 'VIDEO') {
            var temaVideo = datos.tema || queryOriginal;
            // El servidor (función chat-ia) ya buscó en YouTube en la misma llamada cuando la
            // IA decidió usar su herramienta -- se usa eso directo en vez de pedirle al cliente
            // que busque otra vez lo mismo (antes se disparaban las dos búsquedas por separado).
            var videos = (datos.resultados_videos && datos.resultados_videos.length) ? datos.resultados_videos : await BuscadorMotor.buscarSoloVideo(temaVideo);
            UIController.mostrarResultadosVideo(temaVideo, videos);
        } else if (accion === 'MUSICA') {
            var temaMusica = datos.tema || queryOriginal;
            var canciones = (datos.resultados_videos && datos.resultados_videos.length) ? datos.resultados_videos : await BuscadorMotor.buscarSoloMusica(temaMusica);
            UIController.mostrarResultadosVideo(temaMusica, canciones, { icono: '🎵', titulo: 'Música', vacio: 'No encontramos música sobre eso. Intenta con otras palabras.' });
        } else if (accion === 'INTERNET') {
            var temaWeb = datos.tema || queryOriginal;
            var web = (datos.resultados_web && datos.resultados_web.length) ? datos.resultados_web : await BuscadorMotor.buscarSoloWeb(temaWeb);
            UIController.mostrarResultadosWeb(temaWeb, web);
        } else if (accion === 'PUBLICAR') {
            var tituloSugerido = datos.titulo || queryOriginal;
            PanelUsuario.iniciarPublicacionDesdeAsistente(tituloSugerido);
        } else if (accion === 'BUSCAR_PERSONA') {
            var nombre = datos.nombre || queryOriginal;
            var usuarios = await PanelUsuario.buscarUsuariosPorNombre(nombre);
            if ((!usuarios || !usuarios.length) && usuarioActual) {
                // Sin coincidencia por nombre: probamos la misma expansión por zona/categoría que usa Compartir
                var resultadoIA = await PanelUsuario.consultarAsistenteCompartir(nombre, null);
                if (resultadoIA.tipo === 'busqueda') usuarios = await PanelUsuario.buscarUsuariosCompartir(resultadoIA.categoria, resultadoIA.nivel_zona);
            }
            UIController.mostrarResultadosPersonas(nombre, usuarios || []);
        } else if (datos._fallo_tecnico) {
            // Falla técnica real y comprobable por el código: no hubo respuesta de la IA en
            // absoluto (sin conexión, error del servidor). Acá sí tiene sentido el aviso de
            // guía si tampoco hay nada que mostrar -- no hay ninguna respuesta real detrás.
            var resultadoRespaldo = await BuscadorMotor.ejecutarBusquedaHibrida(queryOriginal);
            if (resultadoRespaldo.resultados && resultadoRespaldo.resultados.length) {
                UIController.mostrarResultadosBusqueda(resultadoRespaldo);
            } else {
                if (!UIController.formularioAbierto) { UIController.cerrarResultados(); }
                UIController.mostrarRespuestaIA('No pude conectarme bien en este momento, pero tienes los accesos rápidos en la barra lateral para seguir igual.');
            }
        } else if (datos._formato_invalido) {
            // La IA SÍ respondió con contenido real (ya se mostró en el chat aparte, tal como
            // vino) -- solo que no vino en el formato de datos, así que no hay ningún campo
            // confiable para decidir una acción. Se prueba en silencio una búsqueda literal por
            // si de casualidad era un producto del catálogo, pero NUNCA se agrega el aviso de
            // "dilo de otra forma" -- la respuesta de la IA ya era una respuesta completa y
            // válida (ej. una recomendación de música), agregarle ese aviso encima es lo que
            // generaba el mensaje contradictorio.
            var resultadoSilencioso = await BuscadorMotor.ejecutarBusquedaHibrida(queryOriginal);
            if (resultadoSilencioso.resultados && resultadoSilencioso.resultados.length) {
                UIController.mostrarResultadosBusqueda(resultadoSilencioso);
            } else if (!UIController.formularioAbierto) {
                UIController.cerrarResultados();
            }
        } else {
            // accion en null y sin fallo técnico -- fue una respuesta puramente conversacional
            // (saludo, pregunta de cultura general, consejo, tema delicado ya resuelto en el
            // chat, pregunta sobre la plataforma, etc.).
            // Si hay un formulario real abierto en el muro (contacto, reclamos), NO se cierra --
            // antes esto borraba el formulario (y lo que el usuario ya había escrito) con
            // cualquier pregunta de aclaración, como "¿cómo se llena esto?".
            if (!UIController.formularioAbierto) {
                UIController.cerrarResultados();
            }
        }
    },

    // Ejecuta de una vez las acciones más comunes SIN pasar por la IA -- para los botones de
    // guía que se muestran al saludar o cuando no se entendió el mensaje. Así el usuario tiene
    // algo que tocar de inmediato, sin depender de que escriba (ni de que la IA lo entienda).
    ejecutarAccionGuia: async function(tipo) {
        if (tipo === 'zona') {
            UIController.mostrarRespuestaIA('Aquí tienes todo lo publicado cerca de ti, organizado por categoría -- Ropa, Tecnología, Hogar, etc. Toca cualquier categoría en la tabla para ver esos productos uno por uno. Si ya sabes qué buscas puntualmente, mejor escríbelo arriba y te lo encuentro directo.');
            var matrizGuia = BuscadorMotor.obtenerMatrizPorLocalidad();
            UIController.mostrarMatrizLocalidad(matrizGuia);
        } else if (tipo === 'recientes') {
            UIController.mostrarRespuestaIA('Estas son las publicaciones más recientes de toda la plataforma, sin importar la categoría. Si quieres ver solo lo nuevo de un tipo en particular (por ejemplo, solo ropa reciente), escríbelo arriba, ej: "lo último en ropa".');
            var recientesGuia = BuscadorMotor.obtenerRecientes(12);
            UIController.mostrarResultadosBusqueda({ resultados: recientesGuia, total: BuscadorMotor.catalogo.length, coincidencias: recientesGuia.length, query: 'Novedades', es_expandido: false, es_hibrido: false, resultados_web: null, resultados_videos: null });
        } else if (tipo === 'publicar') {
            PanelUsuario.iniciarPublicacionDesdeAsistente('');
        } else if (tipo === 'buscar') {
            UIController.mostrarRespuestaIA('Escribe abajo qué necesitas, con tus propias palabras:\n🛒 Comprar algo → "busco una bicicleta" → te muestro lo publicado.\n📦 Vender, donar o regalar algo tuyo → "vendo mi laptop" → te abro el formulario.\n🛠️ Un servicio → "doy clases de inglés" o "busco clases de inglés" → publico o busco, según el caso.\n🔄 Un trueque → "cambio mi bici por una laptop" → publico o busco, según el caso.');
            // No sabemos qué quiere buscar todavía -- solo le damos el foco a la barra de
            // búsqueda principal para que escriba ahí, en vez de intentar adivinar.
            var buscadorPrincipal = document.getElementById('dynamicSearch');
            if (buscadorPrincipal) buscadorPrincipal.focus();
        } else if (tipo === 'categorias') {
            var categoriasGuia = BuscadorMotor.obtenerCategoriasDisponibles();
            UIController.mostrarListaCategorias(categoriasGuia);
        } else if (tipo === 'mundial') {
            UIController._matrizPila = [];
            var matrizMundialGuia = BuscadorMotor.obtenerMatrizNiveles(null, 'mundial', null);
            UIController.mostrarMatrizNiveles(matrizMundialGuia);
        }
    },

    manejarEnvioMensaje: async function(event) {
        event.preventDefault();
        var input = document.getElementById('assistantInput');
        var mensaje = input.value.trim();
        if (!mensaje) return;
        UIController.mostrarRespuestaIA(mensaje, 'user');
        input.value = '';
        if (typeof Institucional !== 'undefined' && Institucional.reclamoEnCurso) { Institucional.procesarRespuestaReclamo(mensaje); return; }
        if (typeof Institucional !== 'undefined' && Institucional.contactoEnCurso) { Institucional.procesarRespuestaContacto(mensaje); return; }
        if (typeof detectarPreguntaHora === 'function' && detectarPreguntaHora(mensaje)) { UIController.mostrarRespuestaIA(responderHoraLocal()); return; }
        if (typeof BuscadorMotor !== 'undefined' && BuscadorMotor.detectarIntencionMatriz) {
            var intentoMatrizChat = BuscadorMotor.detectarIntencionMatriz(mensaje);
            if (intentoMatrizChat) {
                if (intentoMatrizChat.tipo === 'matriz') {
                    UIController._matrizPila = [];
                    var matrizChat = BuscadorMotor.obtenerMatrizNiveles(intentoMatrizChat.categorias, intentoMatrizChat.nivel, intentoMatrizChat.lugar);
                    UIController.mostrarMatrizNiveles(matrizChat);
                } else {
                    var resultadoDirectoChat = await BuscadorMotor.ejecutarBusquedaHibrida(intentoMatrizChat.categorias[0] + ' ' + intentoMatrizChat.lugar);
                    UIController.mostrarResultadosBusqueda(resultadoDirectoChat);
                }
                return;
            }
        }
        var codigoIdioma = detectarCambioIdiomaEnMensaje(mensaje);
        if (codigoIdioma) { aplicarCambioIdiomaDesdeChat(codigoIdioma); UIController.mostrarRespuestaIA('✅ Listo, cambié el idioma a ' + (NOMBRES_IDIOMA_DISPLAY[codigoIdioma] || codigoIdioma) + '.'); return; }
        if (typeof detectarIdiomaEscritoEnMensaje === 'function') { var idiomaEscrito = detectarIdiomaEscritoEnMensaje(mensaje); if (idiomaEscrito) aplicarIdiomaSilencioso(idiomaEscrito); }
        if (typeof detectarIntencionReclamo === 'function' && detectarIntencionReclamo(mensaje)) { Institucional.iniciarReclamoGuiado(); return; }
        if (typeof detectarIntencionContactoAdmin === 'function' && detectarIntencionContactoAdmin(mensaje)) { Institucional.iniciarContactoGuiado(); return; }
        UIController.mostrarEstadoCarga();
        var panelActivoChat = document.getElementById('userPanelView').classList.contains('active');
        try {
            if (panelActivoChat) {
                // El panel de usuario todavía interpreta el formato de texto viejo -- se le
                // sigue hablando con AIService.enviarMensaje() tal cual, sin tocar su lógica.
                var respuestaTextoPanel = await AIService.enviarMensaje(mensaje);
                UIController.quitarEstadoCarga();
                UIController.mostrarRespuestaIA(respuestaTextoPanel);
                await PanelUsuario.procesarAccionEnFeed(respuestaTextoPanel, mensaje);
            } else {
                var datos = await AIService.enviarMensajeEstructurado(mensaje);
                UIController.quitarEstadoCarga();
                UIController.mostrarRespuestaIA(datos.mensaje_chat);
                await EventController.procesarAccionIA(datos, mensaje);
            }
        } catch (e) {
            UIController.quitarEstadoCarga();
            console.error('remarket-db: error al procesar la acción del Asistente', e);
            UIController.mostrarRespuestaIA('(No pude mostrar el resultado en pantalla: ' + (e.message || 'error desconocido') + ')');
        }
    },

    manejarBusquedaPrincipal: async function(event) {
        event.preventDefault();
        var input = document.getElementById('dynamicSearch');
        var query = input.value.trim();
        if (!query) return;
        var codigoIdioma = detectarCambioIdiomaEnMensaje(query);
        if (codigoIdioma) { aplicarCambioIdiomaDesdeChat(codigoIdioma); input.value = ''; return; }
        if (typeof detectarIdiomaEscritoEnMensaje === 'function') { var idiomaEscrito = detectarIdiomaEscritoEnMensaje(query); if (idiomaEscrito) aplicarIdiomaSilencioso(idiomaEscrito); }
        if (typeof detectarPreguntaHora === 'function' && detectarPreguntaHora(query)) { UIController.mostrarRespuestaIA(responderHoraLocal()); return; }
        if (typeof BuscadorMotor !== 'undefined' && BuscadorMotor.detectarIntencionMatriz) {
            var intentoMatriz = BuscadorMotor.detectarIntencionMatriz(query);
            if (intentoMatriz) {
                if (intentoMatriz.tipo === 'matriz') {
                    UIController._matrizPila = [];
                    var matriz = BuscadorMotor.obtenerMatrizNiveles(intentoMatriz.categorias, intentoMatriz.nivel, intentoMatriz.lugar);
                    UIController.mostrarMatrizNiveles(matriz);
                } else {
                    var resultadoDirecto = await BuscadorMotor.ejecutarBusquedaHibrida(intentoMatriz.categorias[0] + ' ' + intentoMatriz.lugar);
                    UIController.mostrarResultadosBusqueda(resultadoDirecto);
                }
                return;
            }
        }
        var panelActivo = document.getElementById('userPanelView').classList.contains('active');
        if (panelActivo) {
            try { await PanelUsuario.ejecutarBusquedaConIA(query); }
            catch (e) {
                console.error('remarket-db: error en ejecutarBusquedaConIA', e);
                var cont = document.getElementById('userFeedContainer');
                if (cont) cont.innerHTML = '<div class="feed-empty"><p>Ocurrió un error al buscar: ' + (e.message || 'motivo desconocido') + '</p><button class="btn-publicar" onclick="PanelUsuario.cargarFeed()">Volver al inicio</button></div>';
            }
            return;
        }
        var container = UIController.elementos.searchResultsContainer;
        var content = UIController.elementos.searchResultsContent;
        container.style.display = 'block';
        UIController.elementos.catalogContainer.style.display = 'none';
        content.innerHTML = '<div class="search-loading"><div class="search-loading-spinner"></div><p> El Asistente IA está buscando en tu zona y en el mundo...</p></div>';
        try {
            var datos = await AIService.enviarMensajeEstructurado(query);
            UIController.mostrarRespuestaIA(datos.mensaje_chat);
            await EventController.procesarAccionIA(datos, query);
        } catch (e) {
            console.error('remarket-db: error en manejarBusquedaPrincipal', e);
            content.innerHTML = '<div style="text-align:center;padding:40px;"><p>Ocurrió un error al buscar: ' + (e.message || 'motivo desconocido') + '</p></div>';
        }
    },

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
