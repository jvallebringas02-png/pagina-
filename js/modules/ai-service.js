// ============================================
// AI SERVICE - Asistente Inteligente remarket-db
// ============================================

const PROMPT_BASE = `Eres el asistente experto de remarket-db, un portal de economía circular.
Tu trabajo es extraer la intención del usuario y devolverla en un formato estricto de etiquetas al final de tu respuesta.

REGLAS ESTRICTAS DE FORMATO:
1. Si el usuario pide ver la "matriz", "cuadro comparativo", "a nivel mundial", "por país" o "por región" Y MENCIONA una categoría (ej: "matriz de tecnología a nivel mundial"), responde: [ACCION: MATRIZ | CATEGORIA: tecnologia | ALCANCE: mundial]
2. ⚠️ IMPORTANTE: Si el usuario pide ver datos "a nivel mundial", "por país" o "global" PERO NO menciona ninguna categoría de producto específica, responde ÚNICAMENTE: [ACCION: MATRIZ_GENERAL | ALCANCE: mundial]
3. NUNCA inventes nombres de categorías. Si el usuario dice "mundial", no es una categoría, es un alcance. Las categorías reales son: Tecnología, Ropa, Hogar, Vehículos, Servicios, Agro, Deportes, Libros, Otros.
4. Si el usuario busca un producto, responde: [ACCION: BUSCAR | PRODUCTO: (producto) | UBICACION: (ubicacion si la hay) | MODALIDAD: (venta/trueque/donacion si la hay)]
5. Si el usuario solo saluda o pregunta algo general, responde amablemente en 1-2 oraciones sin etiquetas.

Ejemplos correctos:
- Usuario: "quiero ver la matriz de ropa por país" -> [ACCION: MATRIZ | CATEGORIA: ropa | ALCANCE: pais]
- Usuario: "muéstrame el resumen a nivel mundial" -> [ACCION: MATRIZ_GENERAL | ALCANCE: mundial]
- Usuario: "busca laptops en trujillo" -> [ACCION: BUSCAR | PRODUCTO: laptops | UBICACION: trujillo]`;

// ============================================
// DETECTAR INTENCIÓN DE MATRIZ (Lenguaje Natural)
// ============================================
function detectarIntencionMatriz(texto) {
    if (!texto) return false;
    
    // Normalizamos el texto: minúsculas y sin tildes
    const textoLower = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Lista ampliada de palabras clave
    const palabrasClaveMatriz = [
        'matriz', 'comparar', 'cruzado', 'cruzada', 
        'categorias por pais', 'categorias por ciudad',
        'a nivel mundial', 'a nivel pais', 'a nivel region', 'a nivel local',
        'por pais', 'por region', 'por ciudad',
        'global', 'todo el pais', 'todas las ciudades', 'resumen general',
        'cuadro comparativo', 'estadisticas por'
    ];
    
    return palabrasClaveMatriz.some(palabra => textoLower.includes(palabra));
}

// ============================================
// PROCESAR RESPUESTA DE LA IA
// ============================================
function procesarRespuestaIA(respuestaIA) {
    // Extraer la etiqueta secreta al final
    const match = respuestaIA.match(/\[ACCION:\s*([^\]]+)\]/);
    
    // ARREGLO DEL SILENCIO: Si no hay etiqueta, avisamos al usuario
    if (!match) {
        const mensajeAmigable = "🤔 No pude interpretar exactamente qué buscas. ¿Podrías intentar ser un poco más específico? Por ejemplo: 'muéstrame la matriz de Tecnología a nivel mundial' o 'busca laptops en Trujillo'.";
        if (typeof UIController !== 'undefined' && UIController.agregarMensajeChat) {
            UIController.agregarMensajeChat('assistant', mensajeAmigable);
        } else {
            alert(mensajeAmigable);
        }
        return;
    }

    const etiqueta = match[1].trim();
    const partes = etiqueta.split('|').map(p => p.trim());
    const accion = partes[0].replace('ACCION:', '').trim().toUpperCase();

    // Procesar según la acción detectada
    if (accion === 'BUSCAR') {
        const producto = extraerValor(partes, 'PRODUCTO');
        const ubicacion = extraerValor(partes, 'UBICACION');
        const modalidad = extraerValor(partes, 'MODALIDAD');
        ejecutarBusquedaHibrida(producto, { ubicacion, modalidad });

    } else if (accion === 'MATRIZ') {
        const categoria = extraerValor(partes, 'CATEGORIA');
        const alcance = extraerValor(partes, 'ALCANCE') || 'mundial';
        if (typeof UIController !== 'undefined' && UIController.mostrarMatriz) {
            UIController.mostrarMatriz(categoria, alcance);
        }

    } else if (accion === 'MATRIZ_GENERAL') {
        const alcance = extraerValor(partes, 'ALCANCE') || 'mundial';
        if (typeof UIController !== 'undefined' && UIController.mostrarMatrizGeneral) {
            UIController.mostrarMatrizGeneral(alcance);
        }

    } else if (accion === 'CATEGORIA') {
        const categoria = extraerValor(partes, 'CATEGORIA');
        ejecutarBusquedaHibrida('', { categoria });

    } else {
        // Fallback seguro
        const mensajeAmigable = "🤔 No pude interpretar exactamente qué buscas. ¿Podrías intentar ser un poco más específico?";
        if (typeof UIController !== 'undefined' && UIController.agregarMensajeChat) {
            UIController.agregarMensajeChat('assistant', mensajeAmigable);
        }
    }
}

// ============================================
// FUNCIÓN AUXILIAR: Extraer valores de la etiqueta
// ============================================
function extraerValor(partes, clave) {
    const parte = partes.find(p => p.startsWith(clave + ':'));
    return parte ? parte.replace(clave + ':', '').trim().toLowerCase() : null;
}

// ============================================
// ENVIAR PREGUNTA A LA IA (Groq API)
// ============================================
async function enviarPreguntaAIA(preguntaUsuario) {
    try {
        // Aquí va tu llamada a Groq API
        // Ejemplo:
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    { role: 'system', content: PROMPT_BASE },
                    { role: 'user', content: preguntaUsuario }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();
        const respuestaIA = data.choices[0].message.content;
        
        // Procesar la respuesta
        procesarRespuestaIA(respuestaIA);
        
        return respuestaIA;
        
    } catch (error) {
        console.error('Error al llamar a la IA:', error);
        const mensajeError = "⚠️ Hubo un problema al procesar tu pregunta. Por favor, intenta de nuevo en unos segundos.";
        if (typeof UIController !== 'undefined' && UIController.agregarMensajeChat) {
            UIController.agregarMensajeChat('assistant', mensajeError);
        }
    }
}

// Exportar funciones si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        detectarIntencionMatriz,
        procesarRespuestaIA,
        enviarPreguntaAIA
    };
}