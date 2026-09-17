// ==========================================
// ARCHIVO PRINCIPAL - REMARKET-DB (main.js)
// Conexión unificada: Barra de búsqueda superior + Asistente IA
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("Remarket-DB inicializado correctamente.");

    // 1. CONEXIÓN DE LA BARRA DE BÚSQUEDA SUPERIOR (La barra con la lupa verde)
    const inputBuscadorSuperior = document.querySelector("input[placeholder*='Qué estás buscando'], input[type='search'], .buscador-input");
    const botonBuscadorSuperior = document.querySelector("button img, button svg, .buscador-btn, header button");

    if (inputBuscadorSuperior) {
        // Escuchar cuando escriben o presionan Enter en la barra superior
        inputBuscadorSuperior.addEventListener("input", (e) => {
            const textoBusqueda = e.target.value.trim();
            ejecutarBusquedaEnMuro(textoBusqueda);
        });

        inputBuscadorSuperior.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const textoBusqueda = inputBuscadorSuperior.value.trim();
                ejecutarBusquedaEnMuro(textoBusqueda);
            }
        });
    }

    if (botonBuscadorSuperior && inputBuscadorSuperior) {
        botonBuscadorSuperior.addEventListener("click", (e) => {
            e.preventDefault();
            const textoBusqueda = inputBuscadorSuperior.value.trim();
            ejecutarBusquedaEnMuro(textoBusqueda);
        });
    }

    // 2. CONEXIÓN DEL CHAT DEL ASISTENTE IA (La cajita morada)
    const inputChat = document.querySelector(".asistente-chat input, input[placeholder*='Escribe tu duda'], #chat-input");
    const botonEnviarChat = document.querySelector(".asistente-chat button, button");

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
// FUNCIONES DE FILTRADO Y ACTUALIZACIÓN DEL MURO
// ==========================================

// Función para la barra superior
function ejecutarBusquedaEnMuro(texto) {
    console.log("Buscando en el muro:", texto);
    
    // Si tienes un controlador de buscador global, lo usamos
    if (window.BuscadorController && typeof window.BuscadorController.filtrar === 'function') {
        window.BuscadorController.filtrar(texto);
    } else {
        // Búsqueda genérica de respaldo si el controlador no está cargado
        const tarjetas = document.querySelectorAll(".producto-card, .articulo-item, .card");
        const query = texto.toLowerCase();

        tarjetas.forEach(tarjeta => {
            const contenido = tarjeta.textContent.toLowerCase();
            if (contenido.includes(query) || query === "") {
                tarjeta.style.display = "block";
            } else {
                tarjeta.style.display = "none";
            }
        });
    }
}

// Función para procesar los mensajes del chat IA
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
                
                // Si la IA extrajo un término de búsqueda, lo aplicamos al muro automáticamente
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

// Inyectar burbujas de texto en el chat visual
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