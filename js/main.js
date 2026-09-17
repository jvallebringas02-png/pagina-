// ==========================================
// ARCHIVO PRINCIPAL - REMARKET-DB (main.js)
// Búsqueda Universal y Conexión de IA Definitiva
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("Remarket-DB inicializado correctamente.");

    // 1. CONEXIÓN DE LA BARRA DE BÚSQUEDA SUPERIOR
    const inputBuscadorSuperior = document.querySelector("input[placeholder*='Qué estás buscando'], input[type='search'], header input");
    const botonBuscadorSuperior = document.querySelector("header button, .buscador-btn");

    if (inputBuscadorSuperior) {
        inputBuscadorSuperior.addEventListener("input", (e) => {
            ejecutarBusquedaEnMuro(e.target.value.trim());
        });

        inputBuscadorSuperior.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                ejecutarBusquedaEnMuro(inputBuscadorSuperior.value.trim());
            }
        });
    }

    if (botonBuscadorSuperior && inputBuscadorSuperior) {
        botonBuscadorSuperior.addEventListener("click", (e) => {
            e.preventDefault();
            ejecutarBusquedaEnMuro(inputBuscadorSuperior.value.trim());
        });
    }

    // 2. CONEXIÓN DEL CHAT DEL ASISTENTE IA
    const inputChat = document.querySelector(".asistente-chat input, input[placeholder*='Escribe tu duda'], #chat-input");
    const botonEnviarChat = document.querySelector(".asistente-chat button, .asistente-chat button img");

    if (inputChat) {
        inputChat.addEventListener("keypress", async (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                await manejarEnvioChat(inputChat);
            }
        });
    }

    if (botonEnviarChat && inputChat) {
        botonEnviarChat.addEventListener("click", async (e) => {
            e.preventDefault();
            await manejarEnvioChat(inputChat);
        });
    }
});

// ==========================================
// MOTOR DE BÚSQUEDA Y FILTRADO VISUAL
// ==========================================
function ejecutarBusquedaEnMuro(texto) {
    const query = texto.toLowerCase();
    
    // Si tienes un controlador oficial, lo usamos
    if (window.BuscadorController && typeof window.BuscadorController.filtrar === 'function') {
        window.BuscadorController.filtrar(query);
        return;
    }

    // Búsqueda universal inteligente: Busca en CUALQUIER caja, tarjeta o artículo del muro
    const elementosMuro = document.querySelectorAll(
        ".producto-card, .articulo-item, .card, div[class*='card'], div[class*='producto'], div[class*='item'], article"
    );

    if (elementosMuro.length === 0) {
        console.warn("No se encontraron tarjetas de productos en el DOM para filtrar.");
        return;
    }

    elementosMuro.forEach(elemento => {
        // Evitamos filtrar la estructura general del chat o del menú
        if (elemento.closest(".asistente-chat") || elemento.closest("header") || elemento.closest("footer")) {
            return;
        }

        const textoElemento = elemento.textContent.toLowerCase();
        if (query === "" || textoElemento.includes(query)) {
            elemento.style.display = ""; // Muestra el elemento
        } else {
            elemento.style.display = "none"; // Oculta el elemento que no coincide
        }
    });
}

// Procesar mensajes del Asistente IA
async function manejarEnvioChat(inputElement) {
    if (!inputElement) return;
    const textoUsuario = inputElement.value.trim();
    if (!textoUsuario) return;

    inputElement.value = "";
    pintarMensajeEnInterfaz("Tú", textoUsuario);

    try {
        if (window.AIService && typeof window.AIService.procesarRespuestaIA === 'function') {
            const respuestaIA = await window.AIService.procesarRespuestaIA(textoUsuario);

            if (respuestaIA.tipo === 'buscar_avanzado') {
                pintarMensajeEnInterfaz("Asistente", respuestaIA.contenidoChat);
                if (respuestaIA.filtros && respuestaIA.filtros.query) {
                    ejecutarBusquedaEnMuro(respuestaIA.filtros.query);
                }
            } else {
                pintarMensajeEnInterfaz("Asistente", respuestaIA.contenido);
            }
        } else {
            pintarMensajeEnInterfaz("Asistente", "El servicio de IA no está disponible.");
        }
    } catch (error) {
        console.error("Error en chat IA:", error);
        pintarMensajeEnInterfaz("Asistente", "Ups, ocurrió un error al procesar tu solicitud.");
    }
}

// Pintar burbujas de texto en el chat visual
function pintarMensajeEnInterfaz(remitente, texto) {
    const chatContainer = document.querySelector(".asistente-chat, div[style*='border-radius']");
    
    if (chatContainer) {
        const msgDiv = document.createElement("div");
        msgDiv.style.marginTop = "8px";
        msgDiv.style.padding = "6px 10px";
        msgDiv.style.borderRadius = "6px";
        msgDiv.style.fontSize = "13px";
        
        if (remitente === "Tú") {
            msgDiv.style.backgroundColor = "#e0f2fe";
            msgDiv.style.color = "#0369a1";
            msgDiv.style.textAlign = "right";
        } else {
            msgDiv.style.backgroundColor = "#f3f4f6";
            msgDiv.style.color = "#1f2937";
        }

        msgDiv.innerHTML = `<strong>${remitente}:</strong> ${texto}`;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
        console.log(`[${remitente}]: ${texto}`);
    }
}