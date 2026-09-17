// ==========================================
// MÓDULO DE CONTROL DE INTERFAZ (UI-CONTROLLER)
// Remarket-DB - Versión Blindada contra errores de DOM
// ==========================================

const UIController = {

    // 1. Mostrar respuesta de la IA en el chat de forma segura
    mostrarRespuestaIA(texto) {
        try {
            // Buscamos de manera flexible cualquier caja o contenedor de mensajes en el chat
            const cajaMensajes = document.querySelector(
                ".asistente-chat-mensajes, #chat-mensajes, .chat-box, .asistente-ia, div[class*='chat'], div[id*='chat']"
            );

            if (!cajaMensajes) {
                console.warn("Contenedor de chat no encontrado en el DOM. Mensaje recibido:", texto);
                return;
            }

            // Crear el elemento visual del mensaje
            const nuevoMensaje = document.createElement("div");
            nuevoMensaje.className = "mensaje-ia-item";
            nuevoMensaje.style.margin = "8px 0";
            nuevoMensaje.style.padding = "8px 12px";
            nuevoMensaje.style.borderRadius = "8px";
            nuevoMensaje.style.backgroundColor = "#f3f4f6";
            nuevoMensaje.style.color = "#1f2937";
            nuevoMensaje.innerHTML = `<strong>Asistente:</strong> ${texto}`;

            cajaMensajes.appendChild(nuevoMensaje);
            cajaMensajes.scrollTop = cajaMensajes.scrollHeight;

        } catch (error) {
            console.error("Error al pintar mensaje en UIController.mostrarRespuestaIA:", error);
        }
    },

    // 2. Mostrar mensaje enviado por el usuario
    mostrarMensajeUsuario(texto) {
        try {
            const cajaMensajes = document.querySelector(
                ".asistente-chat-mensajes, #chat-mensajes, .chat-box, .asistente-ia, div[class*='chat'], div[id*='chat']"
            );

            if (!cajaMensajes) return;

            const nuevoMensaje = document.createElement("div");
            nuevoMensaje.className = "mensaje-usuario-item";
            nuevoMensaje.style.margin = "8px 0";
            nuevoMensaje.style.padding = "8px 12px";
            nuevoMensaje.style.borderRadius = "8px";
            nuevoMensaje.style.backgroundColor = "#dbeafe";
            nuevoMensaje.style.color = "#1e40af";
            nuevoMensaje.style.textAlign = "right";
            nuevoMensaje.innerHTML = `<strong>Tú:</strong> ${texto}`;

            cajaMensajes.appendChild(nuevoMensaje);
            cajaMensajes.scrollTop = cajaMensajes.scrollHeight;

        } catch (error) {
            console.error("Error al pintar mensaje del usuario:", error);
        }
    },

    // 3. Pintar productos filtrados en el Muro de la plataforma
    pintarResultados(productos) {
        try {
            const contenedorMuro = document.querySelector(".muro-productos, #catalogo-productos, .productos-grid, main");
            
            if (!contenedorMuro) {
                console.warn("No se encontró el contenedor del muro para pintar los productos.");
                return;
            }

            // Limpiar resultados anteriores
            contenedorMuro.innerHTML = "";

            if (!productos || productos.length === 0) {
                contenedorMuro.innerHTML = `<p style="text-align: center; padding: 20px; color: #6b7280;">No se encontraron artículos que coincidan con tu búsqueda.</p>`;
                return;
            }

            // Renderizar cada tarjeta de producto de forma dinámica
            productos.forEach(p => {
                const tarjeta = document.createElement("div");
                tarjeta.className = "producto-card";
                tarjeta.style.border = "1px solid #e5e7eb";
                tarjeta.style.borderRadius = "8px";
                tarjeta.style.padding = "16px";
                tarjeta.style.backgroundColor = "#fff";
                tarjeta.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";

                tarjeta.innerHTML = `
                    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${p.titulo || 'Artículo sin título'}</h3>
                    <p style="color: #4b5563; font-size: 14px; margin-bottom: 8px;">${p.descripcion || ''}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                        <span style="font-weight: bold; color: #059669;">${p.precio ? '$' + p.precio : 'A consultar'}</span>
                        <span style="font-size: 12px; background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px;">${p.ubicacion || 'Local'}</span>
                    </div>
                `;
                contenedorMuro.appendChild(tarjeta);
            });

            console.log(`Se pintaron ${productos.length} resultados en el muro.`);

        } catch (error) {
            console.error("Error al pintar los resultados en el muro:", error);
        }
    },

    // 4. Funciones secundarias solicitadas por tus botones (Quiénes somos, etc.)
    mostrarQuienesSomosEnMuro() {
        try {
            const contenedorMuro = document.querySelector(".muro-productos, #catalogo-productos, .productos-grid, main");
            if (!contenedorMuro) return;

            contenedorMuro.innerHTML = `
                <div style="padding: 24px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #1f2937;">Quiénes Somos - Remarket-DB</h2>
                    <p style="color: #4b5563; line-height: 1.5;">Somos una plataforma descentralizada y automatizada de economía circular global, conectando comercios, municipios y vecinos de forma inteligente.</p>
                </div>
            `;
        } catch (error) {
            console.error("Error en mostrarQuienesSomosEnMuro:", error);
        }
    }
};

// Exportar globalmente para que main.js y otros módulos puedan usarlo
window.UIController = UIController;