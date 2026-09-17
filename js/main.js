// ==========================================
// ARCHIVO PRINCIPAL - REMARKET-DB (main.js)
// Conexión Universal del Chat y el Muro
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Iniciando aplicación Remarket-DB...");

    if (window.SupabaseClient) {
        console.log("Supabase conectado correctamente.");
    }

    // Buscamos de forma flexible cualquier input o botón dentro de la sección del asistente
    const inputChat = document.querySelector(".asistente-chat input, #chat-input, input[type='text']");
    const botonEnviar = document.querySelector(".asistente-chat button, #chat-send, button");

    if (inputChat) {
        // Escuchar la tecla Enter
        inputChat.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const texto = inputChat.value.trim();
                if (!texto) return;
                
                inputChat.value = "";
                await procesarMensajeUsuario(texto);
            }
        });
    }

    if (botonEnviar) {
        botonEnviar.addEventListener("click", async () => {
            if (!inputChat) return;
            const texto = inputChat.value.trim();
            if (!texto) return;
            
            inputChat.value = "";
            await procesarMensajeUsuario(texto);
        });
    }

    console.log("Módulos inicializados correctamente.");
});

// Función central que procesa lo que escribes y actualiza el muro
async function procesarMensajeUsuario(textoUsuario) {
    // 1. Pintar lo que escribiste en el chat
    agregarMensajeAlChat("Tú", textoUsuario);

    try {
        // 2. Llamar al cerebro de la IA (JSON Inteligente)
        const respuestaIA = await window.AIService.procesarRespuestaIA(textoUsuario);

        if (respuestaIA.tipo === 'buscar_avanzado') {
            console.log("Filtros aplicados al muro:", respuestaIA.filtros);

            // Obtener tus productos actuales (asegúrate de que esta función exista en tu app)
            let productos = typeof obtenerProductosCatalogo === 'function' ? obtenerProductosCatalogo() : [];

            // Filtrar según lo que pidió la IA (zapatos, ubicación, ofertas, etc.)
            let filtrados = productos.filter(p => {
                let okQuery = true;
                let okUbi = true;
                let okOferta = true;

                if (respuestaIA.filtros.query) {
                    const q = respuestaIA.filtros.query.toLowerCase();
                    const tit = p.titulo ? p.titulo.toLowerCase() : '';
                    const cat = p.categoria ? p.categoria.toLowerCase() : '';
                    okQuery = tit.includes(q) || cat.includes(q);
                }

                if (respuestaIA.filtros.ubicacion && respuestaIA.filtros.ubicacion.toLowerCase() !== 'mundial') {
                    const loc = respuestaIA.filtros.ubicacion.toLowerCase();
                    okUbi = (p.pais && p.pais.toLowerCase().includes(loc)) || 
                            (p.ciudad && p.ciudad.toLowerCase().includes(loc));
                }

                if (respuestaIA.filtros.soloOfertas) {
                    okOferta = p.en_oferta === true || (p.descuento && p.descuento > 0);
                }

                return okQuery && okUbi && okOferta;
            });

            // Pintar los resultados directamente en el Muro
            if (window.BuscadorController && typeof window.BuscadorController.pintarResultados === 'function') {
                window.BuscadorController.pintarResultados(filtrados);
            }

            agregarMensajeAlChat("Asistente", respuestaIA.contenidoChat);
        } else {
            // Respuesta normal de texto
            agregarMensajeAlChat("Asistente", respuestaIA.contenido);
        }

    } catch (error) {
        console.error("Error al procesar mensaje:", error);
        agregarMensajeAlChat("Asistente", "Disculpa, ocurrió un error interno al buscar.");
    }
}

function agregarMensajeAlChat(remitente, texto) {
    // Busca el contenedor de mensajes del chat de forma segura
    const contenedor = document.querySelector(".asistente-chat-mensajes, #chat-mensajes, .chat-box, .asistente-ia");
    if (contenedor) {
        const div = document.createElement("div");
        div.style.margin = "8px 0";
        div.innerHTML = `<strong>${remitente}:</strong> ${texto}`;
        contenedor.appendChild(div);
        contenedor.scrollTop = contenedor.scrollHeight;
    } else {
        console.log(`[${remitente}]: ${texto}`);
    }
}