// ==========================================
// MÓDULO DE INTELIGENCIA ARTIFICIAL (REMARKET-DB)
// Versión con JSON Inteligente para peticiones complejas
// ==========================================

const AI_CONFIG = {
    apiKey: "gsk_vU2E3cM4n5P6q7R8s9T0u1V2w3X4y5Z6a7B8c9D0e1F2g3H4", // (Asegúrate de mantener tu clave real de Groq)
    apiUrl: "https://api.groq.com/openai/v1/chat/completions"
};

// 1. PROMPT BASE ESTRICTO BASADO EN JSON (Para entender combinaciones libres)
const PROMPT_BASE = `Eres el motor de búsqueda inteligente y asistente virtual de Remarket-DB.
Analiza la petición del usuario (que puede incluir categorías, localidad, alcance mundial, ofertas, precios bajos, etc.) y devuelve EXCLUSIVAMENTE un objeto en formato JSON plano (sin bloques de código markdown como \`\`\`json, solo el texto del JSON puro) con la siguiente estructura exacta:
{
  "intencion": "buscar" | "matriz" | "saludo" | "otro",
  "texto_busqueda": "término principal o categoría extraída (ej: zapatos, ropa, etc. o vacío si no aplica)",
  "ubicacion": "localidad, país o 'mundial'/'global' (o null si no especifica)",
  "solo_ofertas": true o false (si pide ofertas, promociones, descuentos),
  "ordenar_por": "precio_bajo" | "relevancia" (si pide más barato, económico, menor precio),
  "mensaje": "Mensaje amable para responderle al usuario en el chat del asistente"
}`;

// 2. DETECTOR DE INTENCIÓN DE MATRIZ MEJORADO (LENGUAJE NATURAL)
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

// 3. PROCESADOR PRINCIPAL DE LA IA (Devuelve un JSON estructurado y seguro)
async function procesarRespuestaIA(promptUsuario) {
    try {
        if (!promptUsuario || promptUsuario.trim() === "") {
            return { 
                tipo: 'texto', 
                contenido: "Por favor, escribe algo para que pueda ayudarte." 
            };
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
                temperature: 0.2, // Temperatura baja para que la IA sea precisa devolviendo el JSON
                max_tokens: 400
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API de IA: ${response.status}`);
        }

        const data = await response.json();
        let respuestaTexto = data.choices[0]?.message?.content?.trim() || "";

        // Limpieza por si la IA a veces incluye etiquetas markdown de código por error
        respuestaTexto = respuestaTexto.replace(/```json/g, '').replace(/```/g, '').trim();

        // Intentar parsear la respuesta como JSON
        let datosFiltro;
        try {
            datosFiltro = JSON.parse(respuestaTexto);
        } catch (e) {
            // Si la IA respondió con texto normal (ej. saludos o explicaciones largas)
            return { 
                tipo: 'texto', 
                contenido: respuestaTexto || "Hola, ¿en qué puedo ayudarte hoy?" 
            };
        }

        // Si la intención detectada es una matriz o resumen global
        if (datosFiltro.intencion === "matriz" || detectarIntencionMatriz(promptUsuario)) {
            return {
                tipo: 'matriz',
                categoria: datosFiltro.texto_busqueda || 'general',
                alcance: datosFiltro.ubicacion || 'mundial'
            };
        }

        // Si la intención es buscar productos (con cualquier combinación de filtros)
        if (datosFiltro.intencion === "buscar" || datosFiltro.texto_busqueda) {
            return {
                tipo: 'buscar_avanzado',
                filtros: {
                    query: datosFiltro.texto_busqueda || "",
                    ubicacion: datosFiltro.ubicacion || null,
                    soloOfertas: datosFiltro.solo_ofertas || false,
                    ordenarPor: datosFiltro.ordenar_por || "relevancia"
                },
                contenidoChat: datosFiltro.mensaje || "¡Listo! Aquí tienes los resultados aplicados en el muro."
            };
        }

        // Respuesta conversacional por defecto
        return { 
            tipo: 'texto', 
            contenido: datosFiltro.mensaje || respuestaTexto 
        };

    } catch (error) {
        console.error("Error al procesar con IA:", error);
        // Antídoto contra el "silencio incómodo": Mensaje amigable si ocurre un fallo de red o API
        return { 
            tipo: 'texto', 
            contenido: "🤔 Ocurrió un pequeño inconveniente al conectar con el asistente. ¿Podrías intentar reformular tu pregunta?" 
        };
    }
}

// Exportar funciones globalmente o para módulos
window.AIService = {
    detectarIntencionMatriz,
    procesarRespuestaIA
};