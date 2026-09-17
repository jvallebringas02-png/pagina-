// ==========================================
// MÓDULO DE INTELIGENCIA ARTIFICIAL (REMARKET-DB)
// ==========================================

const AI_CONFIG = {
    apiKey: "gsk_vU2E3cM4n5P6q7R8s9T0u1V2w3X4y5Z6a7B8c9D0e1F2g3H4", 
    apiUrl: "https://api.groq.com/openai/v1/chat/completions"
};

const PROMPT_BASE = `Eres el motor de búsqueda inteligente y asistente virtual de Remarket-DB.
Analiza la petición del usuario y devuelve EXCLUSIVAMENTE un objeto en formato JSON plano (sin bloques de código markdown, solo el texto del JSON puro) con la siguiente estructura exacta:
{
  "intencion": "buscar" | "matriz" | "saludo" | "otro",
  "texto_busqueda": "término principal o categoría extraída (ej: zapatos, ropa, etc. o vacío si no aplica)",
  "ubicacion": "localidad, país o 'mundial'/'global' (o null si no especifica)",
  "solo_ofertas": true o false (si pide ofertas, promociones, descuentos),
  "ordenar_por": "precio_bajo" | "relevancia" (si pide más barato, económico, menor precio),
  "mensaje": "Mensaje amable para responderle al usuario en el chat del asistente"
}`;

function detectarIntencionMatriz(texto) {
    if (!texto) return false;
    const t = texto.toLowerCase().trim();
    const palabrasClave = [
        "matriz", "cruzado", "cruzar", "estadísticas", "estadisticas", 
        "resumen", "a nivel mundial", "global", "por país", "por pais", 
        "por región", "por region", "comparativa", "tabla de datos"
    ];
    return palabrasClave.some(keyword => t.includes(keyword));
}

async function procesarRespuestaIA(promptUsuario) {
    try {
        if (!promptUsuario || promptUsuario.trim() === "") {
            return { tipo: 'texto', contenido: "Por favor, escribe algo para que pueda ayudarte." };
        }

        const response = await fetch(AI_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [
                    { role: "system", content: PROMPT_BASE },
                    { role: "user", content: promptUsuario }
                ],
                temperature: 0.2,
                max_tokens: 400
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        let respuestaTexto = data.choices[0]?.message?.content?.trim() || "";

        let datosFiltro = null;
        try {
            const inicioJson = respuestaTexto.indexOf('{');
            const finJson = respuestaTexto.lastIndexOf('}');
            if (inicioJson !== -1 && finJson !== -1) {
                const jsonString = respuestaTexto.substring(inicioJson, finJson + 1);
                datosFiltro = JSON.parse(jsonString);
            }
        } catch (e) {
            console.warn("Respuesta tratada como texto plano.");
        }

        if (datosFiltro) {
            if (datosFiltro.intencion === "matriz" || detectarIntencionMatriz(promptUsuario)) {
                return {
                    tipo: 'matriz',
                    categoria: datosFiltro.texto_busqueda || 'general',
                    alcance: datosFiltro.ubicacion || 'mundial'
                };
            }

            if (datosFiltro.intencion === "buscar" || datosFiltro.texto_busqueda) {
                return {
                    tipo: 'buscar_avanzado',
                    filtros: {
                        query: datosFiltro.texto_busqueda || "",
                        ubicacion: datosFiltro.ubicacion || null,
                        soloOfertas: datosFiltro.solo_ofertas || false,
                        ordenarPor: datosFiltro.ordenar_por || "relevancia"
                    },
                    contenidoChat: datosFiltro.mensaje || "¡Listo! Resultados aplicados en el muro."
                };
            }

            return { tipo: 'texto', contenido: datosFiltro.mensaje || "¡Hola!" };
        }

        return { tipo: 'texto', contenido: respuestaTexto };

    } catch (error) {
        console.error("Error en procesarRespuestaIA:", error);
        return { 
            tipo: 'texto', 
            contenido: "🤔 Ocurrió un pequeño inconveniente al conectar con el asistente. ¿Podrías intentar de nuevo?" 
        };
    }
}

window.AIService = {
    detectarIntencionMatriz,
    procesarRespuestaIA
};