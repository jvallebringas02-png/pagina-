var AIService = {
    historial: [],

    // Hace la llamada real a la IA y devuelve los datos ya parseados (objeto). Es privado --
    // lo usan las dos funciones públicas de abajo, cada una lo expone de una forma distinta
    // según quién la llame, pero la IA solo se consulta UNA vez por mensaje.
    // Cuando el servidor avisa que se acabó el cupo de la IA ("limite_alcanzado" / HTTP 429), se
    // pausa el envío 60 segundos. Así nadie insiste (cada intento gasta más cupo) y se muestra
    // un mensaje claro en vez de "No pude conectarme... ¿Puedes intentar de nuevo?", que parece
    // un problema de internet de la persona.
    _limiteHasta: 0,

    // Reintento automático ante fallos TÉCNICOS pasajeros (la petición no llegó, la respuesta no era
    // JSON o el servidor dio un 5xx): se repite UNA vez tras una pausa corta, sin que la persona vea
    // el error. NO se reintenta si fue el límite de cuota (429 / "limite_alcanzado") ni con errores
    // fijos (400, 401, 404...), porque repetirlos solo gastaría más cupo o daría lo mismo.
    // Para desactivarlo: REINTENTOS_TECNICOS = 0.
    REINTENTOS_TECNICOS: 1,
    REINTENTO_ESPERA_MS: 1500,

    // DIAGNÓSTICO (fase de pruebas): cuando la IA falla por un motivo técnico, el aviso termina con un
    // código corto, por ejemplo "(código: HTTP 502 servicio_no_disponible groq:401)", y el mismo
    // código sale en la consola (F12) como "[asistente] fallo técnico". Así se ve la causa sin
    // tener que abrir la pestaña Red. Poner en false antes de abrir la página al público.
    MOSTRAR_CODIGO_ERROR: true,
    _respuestaLimite: function() {
        var datos = this._parsearRespuesta(null); // objeto "vacío" estándar (fallo técnico)
        datos.mensaje_chat = textoUI('ia_limite', 'El asistente llegó a su límite de uso por ahora, así que no responderá durante un rato. Mientras tanto puedes buscar por nombre o usar los accesos rápidos de la barra lateral.');
        datos._limite = true;
        datos.resultados_web = null;
        datos.resultados_videos = null;
        return datos;
    },

    // Texto corto con la causa de un fallo, a partir del estado HTTP y del cuerpo que devolvió el servidor.
    // No incluye mensajes largos ni datos internos: solo el estado y palabras clave.
    _describirFallo: function(estado, data) {
        var partes = ['HTTP ' + estado];
        if (data === null || typeof data === 'undefined') {
            partes.push('sin_json');
        } else if (typeof data.error === 'string') {
            partes.push(data.error.slice(0, 40).replace(/[^\w.:-]/g, '_'));
            if (typeof data.groq !== 'undefined') partes.push('groq:' + String(data.groq).slice(0, 6));
        } else if (data.error && typeof data.error === 'object') {
            var c = data.error.code || data.error.type || '';
            if (c) partes.push(String(c).slice(0, 40).replace(/[^\w.:-]/g, '_'));
        } else if (estado < 400) {
            partes.push('respuesta_vacia');
        }
        return partes.join(' ');
    },

    _consultarIA: async function(mensaje) {
        if (this._limiteHasta && Date.now() < this._limiteHasta) return this._respuestaLimite();
        var idiomaInterfaz = obtenerIdiomaPreferido(); // Solo para la interfaz y la búsqueda web; el chat detecta el idioma real del mensaje.
        // 🔒 Ya no se manda un mensaje "system" con PROMPT_BASE aquí: el servidor (función chat-ia)
        // lo descarta de todas formas y usa su propio PROMPT_BASE. Mandarlo solo agregaba peso
        // a la petición sin ningún efecto real -- si en algún momento vuelven a permitir que el
        // cliente defina el prompt, este es el lugar donde había que restaurarlo.
        this.historial.push({ role: "user", content: mensaje });
        var textoBruto = null;
        var resultadosWebServidor = null;
        var resultadosVideosServidor = null;
        var limiteAlcanzado = false;
        var motivoFallo = null; // texto corto con la causa del último fallo técnico (solo diagnóstico)
        var cuerpoPeticion = JSON.stringify({ messages: this.historial, idioma: idiomaInterfaz });
        for (var intento = 0; intento <= this.REINTENTOS_TECNICOS; intento++) {
            // Cada intento parte limpio, para no mezclar datos de un intento fallido con el siguiente.
            textoBruto = null;
            resultadosWebServidor = null;
            resultadosVideosServidor = null;
            limiteAlcanzado = false;
            motivoFallo = null;
            var reintentable = false;
            try {
                var response = await fetch(CONFIG.GROQ_API_URL, { method: 'POST', headers: { "Content-Type": "application/json", "apikey": MI_API_KEY, "Authorization": "Bearer " + MI_API_KEY }, body: cuerpoPeticion });
                var data = null;
                try { data = await response.json(); } catch (eJson) { data = null; }
                if (response.status === 429 || (data && data.error === 'limite_alcanzado')) limiteAlcanzado = true;
                textoBruto = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
                // El servidor (función chat-ia) ya ejecuta la búsqueda real en internet/YouTube
                // cuando la IA decide usar sus herramientas, y la manda en la misma respuesta --
                // se aprovecha esto en vez de pedirle al cliente que busque otra vez lo mismo por
                // su cuenta (antes esto se descartaba acá y buscador.js repetía la búsqueda).
                resultadosWebServidor = (data && data.resultados_web) || null;
                resultadosVideosServidor = (data && data.resultados_videos) || null;
                // Sin contenido y sin ser el límite: ¿fallo pasajero que vale la pena repetir?
                if (textoBruto === null && !limiteAlcanzado) {
                    reintentable = response.status >= 500 || (data === null && response.status < 400);
                    motivoFallo = AIService._describirFallo(response.status, data);
                }
            } catch (e) {
                textoBruto = null;
                reintentable = true; // la petición no llegó (sin red, corte, CORS)
                motivoFallo = 'sin_conexion';
            }
            if (!reintentable || intento >= this.REINTENTOS_TECNICOS) break;
            await new Promise(function(listo) { setTimeout(listo, AIService.REINTENTO_ESPERA_MS); });
        }
        if (limiteAlcanzado) {
            this._limiteHasta = Date.now() + 60000;
            this.historial.pop(); // el mensaje que no se pudo contestar no queda en el historial
            return this._respuestaLimite();
        }
        var datos = this._parsearRespuesta(textoBruto);
        if (datos._fallo_tecnico) {
            var etiqueta = motivoFallo || 'sin_contenido';
            console.warn('[asistente] fallo técnico:', etiqueta);
            datos._motivo = etiqueta;
            if (this.MOSTRAR_CODIGO_ERROR) datos.mensaje_chat = datos.mensaje_chat + ' (código: ' + etiqueta + ')';
            // Ni el mensaje que no se pudo contestar ni el aviso de error quedan en el historial:
            // así la IA no los ve como parte de la conversación en los mensajes siguientes.
            this.historial.pop();
            datos.resultados_web = null;
            datos.resultados_videos = null;
            return datos;
        }
        datos.resultados_web = resultadosWebServidor;
        datos.resultados_videos = resultadosVideosServidor;
        // Se guarda en el historial solo el mensaje conversacional, no el JSON crudo -- así en
        // los siguientes turnos la IA sigue viendo una conversación en lenguaje natural, no un
        // bloque de datos que podría confundirla sobre su propio formato de respuesta.
        this.historial.push({ role: "assistant", content: datos.mensaje_chat });
        return datos;
    },

    // La IA a veces envuelve el JSON en ```json ... ``` a pesar de la instrucción -- se le
    // quita eso antes de intentar parsear. Hay dos formas distintas de que algo salga mal, y se
    // distinguen con dos banderas separadas (las pone SOLO el código, nunca la IA):
    // - "_fallo_tecnico": no hubo respuesta en absoluto (sin conexión, error del servidor). Acá
    //   sí tiene sentido mostrar el aviso de "dilo de otra forma", porque no hay nada real que
    //   mostrar.
    // - "_formato_invalido": SÍ hubo una respuesta de la IA, con contenido real y coherente,
    //   pero no vino en JSON -- el modelo simplemente conversó en texto plano, ignorando el
    //   formato pedido. En este caso la respuesta en sí puede ser perfectamente buena (como
    //   viste con la música de Enya), así que NO se le agrega ningún aviso de "no entendí" --
    //   eso generaba el mensaje contradictorio que reportaste.
    _parsearRespuesta: function(textoBruto) {
        var vacio = { mensaje_chat: 'No pude conectarme bien en este momento. ¿Puedes intentar de nuevo?', entendido: false, _fallo_tecnico: true, _formato_invalido: false, accion: null, producto: null, categoria: null, nombre: null, titulo: null, tema: null, orden: null, ubicacion: null, modalidad: null, nivel_matriz: null };
        if (!textoBruto) return vacio;
        try {
            var limpio = textoBruto.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
            var datos = JSON.parse(limpio);
            if (!datos || typeof datos !== 'object') throw new Error('JSON válido pero no es un objeto');
            if (typeof datos.mensaje_chat !== 'string' || !datos.mensaje_chat.trim()) datos.mensaje_chat = vacio.mensaje_chat;
            datos.accion = datos.accion ? String(datos.accion).trim().toUpperCase() : null;
            // Se guarda tal cual lo que reportó la IA (por si sirve para depurar en consola),
            // pero NO se usa para decidir si se muestra el aviso de "no entendí" -- eso lo
            // decide únicamente _fallo_tecnico, que aquí se pone en false porque el JSON sí
            // se pudo leer bien, sea cual sea el valor de "entendido".
            datos.entendido = (datos.entendido === false) ? false : true;
            datos._fallo_tecnico = false;
            datos._formato_invalido = false;
            // Se completan los campos que la IA no haya incluido, para que el resto del código
            // pueda leer datos.orden, datos.categoria, etc. sin tener que comprobar antes si existen.
            ['producto', 'categoria', 'nombre', 'titulo', 'tema', 'orden', 'ubicacion', 'modalidad', 'nivel_matriz'].forEach(function(campo) {
                if (typeof datos[campo] === 'undefined') datos[campo] = null;
            });
            return datos;
        } catch (e) {
            console.warn('remarket-db: la IA respondió en texto plano en vez de JSON -- se muestra tal cual, sin agregar ningún aviso extra', e);
            // Respaldo: la IA sí contestó algo con sentido (a veces ignora el formato pedido y
            // simplemente conversa en texto plano) -- se muestra tal cual, como una respuesta
            // conversacional normal. NO se marca como fallo técnico -- eso generaba el aviso de
            // "dilo de otra forma" pegado a respuestas que ya estaban completas y correctas.
            return { mensaje_chat: textoBruto, entendido: true, _fallo_tecnico: false, _formato_invalido: true, accion: null, producto: null, categoria: null, nombre: null, titulo: null, tema: null, orden: null, ubicacion: null, modalidad: null, nivel_matriz: null };
        }
    },

    // Uso nuevo (buscador principal, event-controller.js): entrega el objeto de datos
    // completo, ya parseado, con todos los campos (producto, orden, ubicacion, modalidad,
    // nivel_matriz, entendido, etc.) listos para usar sin tener que interpretar ningún texto.
    enviarMensajeEstructurado: async function(mensaje) {
        return await this._consultarIA(mensaje);
    },

    // Uso existente (panel de usuario, y cualquier otro lugar que ya dependa del formato
    // viejo): se mantiene exactamente igual por fuera -- devuelve un string con la etiqueta
    // [ACCION: ...], reconstruida a partir de los datos nuevos. Quien llama a esta función
    // sigue recibiendo lo mismo de siempre; no necesita saber que por dentro cambió el formato.
    enviarMensaje: async function(mensaje) {
        var datos = await this._consultarIA(mensaje);
        return this._reconstruirEtiquetaTexto(datos);
    },

    // Arma el texto "[ACCION: ... | CAMPO: valor]" que el panel de usuario (y el resto del
    // código que todavía no se actualizó) ya sabía leer, a partir del objeto de datos nuevo.
    _reconstruirEtiquetaTexto: function(datos) {
        if (!datos.accion) return datos.mensaje_chat;
        var partes = ['ACCION: ' + datos.accion];
        if (datos.producto) partes.push('PRODUCTO: ' + datos.producto);
        if (datos.categoria) partes.push('CATEGORIA: ' + datos.categoria);
        if (datos.nombre) partes.push('NOMBRE: ' + datos.nombre);
        if (datos.titulo) partes.push('TITULO: ' + datos.titulo);
        if (datos.tema) partes.push('PRODUCTO: ' + datos.tema); // VIDEO/MUSICA/INTERNET leían su tema del campo PRODUCTO:
        if (datos.orden) partes.push('ORDEN: ' + datos.orden);
        if (datos.ubicacion) partes.push('UBICACION: ' + datos.ubicacion);
        if (datos.modalidad) partes.push('MODALIDAD: ' + datos.modalidad);
        return datos.mensaje_chat + ' [' + partes.join(' | ') + ']';
    },

    limpiarHistorial: function() { this.historial = []; }
};
