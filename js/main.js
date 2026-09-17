// ==========================================
// ARCHIVO PRINCIPAL - REMARKET-DB (main.js)
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Iniciando aplicación Remarket-DB...");

    // 1. Inicializar Supabase y componentes globales de la interfaz
    if (window.SupabaseClient) {
        console.log("Supabase conectado correctamente.");
    }

    // 2. Referencias a elementos del DOM del Asistente IA y el Muro
    const inputChat = document.querySelector("#Asistente IA input, .asistente-chat input, input[placeholder*='Escribe'], input[placeholder*='duda']");
    const botonEnviarChat = document.querySelector("#Asistente IA button, .asistente-chat button, button");
    const contenedorChat = document.querySelector(".asistente-chat, #asistente-ia-container");

    // 3. Configurar evento de envío en el chat del asistente
    if (inputChat) {
        inputChat.addEventListener("keypress", async (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const textoUsuario = inputChat.value.trim();
                if (!textoUsuario) return;

                // Mostrar mensaje del usuario en el chat
                agregarMensajeAlChat("Tú", textoUsuario);
                inputChat.value = "";

                // Procesar con la IA inteligente (AIService)
                await manejarInteraccionIA(textoUsuario);
            }
        });
    }

    console.log("Módulos inicializados correctamente.");
});

// ==========================================
// CONTROLADOR DE LA INTERACCIÓN CON LA IA Y EL MURO
// ==========================================
async function manejarInteraccionIA(textoUsuario) {
    try {
        // Llamamos al servicio de IA que procesa la intención en formato JSON
        const respuestaIA = await window.AIService.procesarRespuestaIA(textoUsuario);

        // Si la IA detecta una búsqueda avanzada (categorías, ubicación, precios, ofertas)
        if (respuestaIA.tipo === 'buscar_avanzado') {
            console.log("Filtros extraídos por la IA:", respuestaIA.filtros);

            // Obtenemos los productos actuales del catálogo (asegúrate de que tu función devuelva el array de productos)
            let productosDisponibles = typeof obtenerProductosCatalogo === 'function' ? obtenerProductosCatalogo() : [];

            // Aplicamos los filtros en cadena de forma limpia y segura
            let resultadosFiltrados = productosDisponibles.filter(p => {
                let coincideQuery = true;
                let coincideUbicacion = true;
                let coincideOferta = true;

                // 1. Filtro por texto o categoría (ej: zapatos, ropa)
                if (respuestaIA.filtros.query) {
                    const q = respuestaIA.filtros.query.toLowerCase();
                    const titulo = p.titulo ? p.titulo.toLowerCase() : '';
                    const cat = p.categoria ? p.categoria.toLowerCase() : '';
                    const desc = p.descripcion ? p.descripcion.toLowerCase() : '';
                    coincideQuery = titulo.includes(q) || cat.includes(q) || desc.includes(q);
                }

                // 2. Filtro por ubicación (si no es mundial)
                if (respuestaIA.filtros.ubicacion && respuestaIA.filtros.ubicacion.toLowerCase() !== 'mundial') {
                    const loc = respuestaIA.filtros.ubicacion.toLowerCase();
                    const pais = p.pais ? p.pais.toLowerCase() : '';
                    const ciudad = p.ciudad ? p.ciudad.toLowerCase() : '';
                    coincideUbicacion = pais.includes(loc) || ciudad.includes(loc);
                }

                // 3. Filtro por ofertas o promociones
                if (respuestaIA.filtros.soloOfertas) {
                    coincideOferta = p.en_oferta === true || (p.descuento && p.descuento > 0);
                }

                return coincideQuery && coincideUbicacion && coincideOferta;
            });

            // Ordenamiento por precio más bajo si el usuario lo pidió
            if (respuestaIA.filtros.ordenarPor === 'precio_bajo') {
                resultadosFiltrados.sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0));
            }

            // ¡Pintamos los resultados directamente en el Muro usando BuscadorController!
            if (window.BuscadorController && typeof window.BuscadorController.pintarResultados === 'function') {
                window.BuscadorController.pintarResultados(resultadosFiltrados);
            } else {
                console.warn("BuscadorController no encontrado, mostrando en consola:", resultadosFiltrados);
            }

            // Respondemos amablemente en el chat
            agregarMensajeAlChat("Asistente", respuestaIA.contenidoChat);
        } 
        else if (respuestaIA.tipo === 'matriz') {
            // Si el usuario pidió una matriz o resumen global
            agregarMensajeAlChat("Asistente", `📊 Generando vista de matriz para: ${respuestaIA.categoria} (Alcance: ${respuestaIA.alcance})`);
            // Aquí puedes activar tu lógica de matrices si la tienes en otro módulo
        } 
        else {
            // Respuesta de texto plano o conversacional normal
            agregarMensajeAlChat("Asistente", respuestaIA.contenido);
        }

    } catch (error) {
        console.error("Error al manejar la interacción con la IA:", error);
        agregarMensajeAlChat("Asistente", "🤔 Hubo un pequeño problema al procesar tu solicitud en el muro.");
    }
}

// Función auxiliar para pintar mensajes en el chat visualmente
function agregarMensajeAlChat(remitente, texto) {
    const cajaChat = document.querySelector(".asistente-chat-mensajes, #chat-mensajes, .chat-box");
    if (cajaChat) {
        const elemento = document.createElement("div");
        elemento.className = remitente === "Tú" ? "mensaje-usuario" : "mensaje-asistente";
        elemento.innerHTML = `<strong>${remitente}:</strong> ${texto}`;
        cajaChat.appendChild(elemento);
        cajaChat.scrollTop = cajaChat.scrollHeight;
    } else {
        console.log(`[${remitente}]: ${texto}`);
    }
}