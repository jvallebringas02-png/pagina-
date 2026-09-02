var AIService = {
    historial: [], idiomaActual: null,
    enviarMensaje: async function(mensaje) {
        var idiomaMensaje = obtenerIdiomaPreferido(); // Respeta el idioma elegido en el panel; si no hay ninguno guardado, usa el del navegador
        if (this.idiomaActual !== idiomaMensaje) { this.idiomaActual = idiomaMensaje; this.historial = []; var promptSistema = SYSTEM_PROMPTS[idiomaMensaje] || SYSTEM_PROMPTS.es; this.historial.push({ role: "system", content: promptSistema }); }
        this.historial.push({ role: "user", content: mensaje });
        try {
            var response = await fetch(CONFIG.GROQ_API_URL, { method: 'POST', headers: { "Content-Type": "application/json", "apikey": MI_API_KEY, "Authorization": "Bearer " + MI_API_KEY }, body: JSON.stringify({ messages: this.historial }) });
            var data = await response.json();
            var respuesta = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "Error al conectar con la IA.";
            this.historial.push({ role: "assistant", content: respuesta }); return respuesta;
        } catch (e) { return "Error de conexión."; }
    },
    limpiarHistorial: function() { this.historial = []; this.idiomaActual = null; }
};

