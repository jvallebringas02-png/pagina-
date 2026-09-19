var AIService = {
    historial: [],

    // Hace la llamada real a la IA y devuelve los datos ya parseados (objeto). Es privado --
    // lo usan las dos funciones públicas de abajo, cada una lo expone de una forma distinta
    // según quién la llame, pero la IA solo se consulta UNA vez por mensaje.
    _consultarIA: async function(mensaje) {
        var idiomaInterfaz = obtenerIdiomaPreferido(); // Solo para la interfaz y la búsqueda web; el chat detecta el idioma real del mensaje.
        if (this.historial.length === 0) { this.historial.push({ role: "system", content: PROMPT_BASE }); }
        this.historial.push({ role: "user", content: mensaje });
        var textoBruto = null;
        try {
            var response = await fetch(CONFIG.GROQ_API_URL, { method: 'POST', headers: { "Content-Type": "application/json", "apikey": MI_API_KEY, "Authorization": "Bearer " + MI_API_KEY }, body: JSON.stringify({ messages: this.historial, idioma: idiomaInterfaz }) });
            var data = await response.json();
            textoBruto = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
        } catch (e) {
            textoBruto = null;
        }
        var datos = this._parsearRespuesta(textoBruto);
        // Se guarda en el historial solo el mensaje conversacional, no el JSON crudo -- así en
        // los siguientes turnos la IA sigue viendo una conversación en lenguaje natural, no un
        // bloque de datos que podría confundirla sobre su propio formato de respuesta.
        this.historial.push({ role: "assistant", content: datos.mensaje_chat });
        return datos;
    },

    // La IA a veces envuelve el JSON en ```json ... ``` a pesar de la instrucción -- se le
    // quita eso antes de intentar parsear. Si algo falla (JSON inválido, o no hubo respuesta
    // por un error de conexión), se devuelve un objeto de respaldo. Se marca "_fallo_tecnico:
    // true" -- esta bandera la pone SOLO el código, nunca la IA, y es la única señal confiable
    // de que algo salió mal de verdad (sin respuesta, o JSON ilegible). El campo "entendido"
    // que reporta la propia IA no se usa para decidir nada crítico: en la práctica el modelo lo
    // marca en false incluso cuando respondió bien pero no disparó ninguna acción concreta
    // (ej. una pregunta sobre la plataforma), así que confiar en él generaba avisos de "no
    // entendí" pegados a respuestas que en realidad estaban completas y correctas.
    _parsearRespuesta: function(textoBruto) {
        var vacio = { mensaje_chat: 'No pude conectarme bien en este momento. ¿Puedes intentar de nuevo?', entendido: false, _fallo_tecnico: true, accion: null, producto: null, categoria: null, nombre: null, titulo: null, tema: null, orden: null, ubicacion: null, modalidad: null, nivel_matriz: null };
        if (!textoBruto) return vacio;
        try {
            var limpio = textoBruto.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
            var datos = JSON.parse(limpio);
            if (!datos || typeof datos !== 'object') return vacio;
            if (typeof datos.mensaje_chat !== 'string' || !datos.mensaje_chat.trim()) datos.mensaje_chat = vacio.mensaje_chat;
            datos.accion = datos.accion ? String(datos.accion).trim().toUpperCase() : null;
            // Se guarda tal cual lo que reportó la IA (por si sirve para depurar en consola),
            // pero NO se usa para decidir si se muestra el aviso de "no entendí" -- eso lo
            // decide únicamente _fallo_tecnico, que aquí se pone en false porque el JSON sí
            // se pudo leer bien, sea cual sea el valor de "entendido".
            datos.entendido = (datos.entendido === false) ? false : true;
            datos._fallo_tecnico = false;
            // Se completan los campos que la IA no haya incluido, para que el resto del código
            // pueda leer datos.orden, datos.categoria, etc. sin tener que comprobar antes si existen.
            ['producto', 'categoria', 'nombre', 'titulo', 'tema', 'orden', 'ubicacion', 'modalidad', 'nivel_matriz'].forEach(function(campo) {
                if (typeof datos[campo] === 'undefined') datos[campo] = null;
            });
            return datos;
        } catch (e) {
            console.warn('remarket-db: la IA no devolvió JSON válido, se muestra como texto plano', e);
            // Respaldo: si ni siquiera vino en JSON, se muestra el texto tal cual como mensaje de
            // chat (mejor mostrar algo que quedarse en blanco), pero sin ninguna acción, y
            // marcado como no entendido para que se ofrezcan ejemplos de qué sí funciona.
            var copia = JSON.parse(JSON.stringify(vacio));
            copia.mensaje_chat = textoBruto;
            return copia;
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
