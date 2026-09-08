var AIService = {
    historial: [],
    enviarMensaje: async function(mensaje) {
        var idiomaInterfaz = obtenerIdiomaPreferido(); // Solo para la interfaz y la búsqueda web; el chat detecta el idioma real del mensaje.
        if (this.historial.length === 0) { this.historial.push({ role: "system", content: PROMPT_BASE }); }
        this.historial.push({ role: "user", content: mensaje });
        try {
            var response = await fetch(CONFIG.GROQ_API_URL, { method: 'POST', headers: { "Content-Type": "application/json", "apikey": MI_API_KEY, "Authorization": "Bearer " + MI_API_KEY }, body: JSON.stringify({ messages: this.historial, idioma: idiomaInterfaz }) });
            var data = await response.json();
            var respuesta = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "Error al conectar con la IA.";
            this.historial.push({ role: "assistant", content: respuesta }); return respuesta;
        } catch (e) { return "Error de conexión."; }
    },
    limpiarHistorial: function() { this.historial = []; }
};
