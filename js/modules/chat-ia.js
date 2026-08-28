/* ==========================================
   remarket-db - Módulo del Asistente IA
   Chat con Groq (Llama 3.3)
   ========================================== */

import { CONFIG } from '../config.js';

// Historial de conversación
let chatHistory = [];

/**
 * Inicializa el chat flotante en la interfaz
 */
export function inicializarChatIA() {
  crearContenedorChat();
  renderizarChat();
  console.log('🤖 Asistente IA inicializado');
}

/**
 * Crea el contenedor HTML del chat flotante
 */
function crearContenedorChat() {
  const container = document.getElementById('chat-ia-container');
  if (!container) return;

  container.innerHTML = `
    <div class="chat-ventana" id="chat-ventana">
      <div class="chat-header">
        <h3>🤖 Asistente IA</h3>
        <div class="chat-header-botones">
          <button class="btn-chat-minimizar" onclick="minimizarChat()">➖</button>
          <button class="btn-chat-cerrar" onclick="cerrarChat()"></button>
        </div>
      </div>
      <div class="chat-mensajes" id="chat-mensajes"></div>
      <div class="chat-botones-rapidos" id="chat-botones-rapidos">
        <button class="btn-rapido" onclick="enviarMensajeRapido('¿Cómo publico?')">📦 ¿Cómo publico?</button>
        <button class="btn-rapido" onclick="enviarMensajeRapido('¿Cómo vendo?')">💰 ¿Cómo vendo?</button>
        <button class="btn-rapido" onclick="enviarMensajeRapido('Seguridad')">🛡️ Seguridad</button>
        <button class="btn-rapido" onclick="enviarMensajeRapido('Reportar')">⚠️ Reportar</button>
      </div>
      <div class="chat-escribiendo" id="chat-escribiendo">Escribiendo...</div>
      <div class="chat-input-container">
        <input 
          type="text" 
          class="chat-input" 
          id="chat-input" 
          placeholder="Escribe tu mensaje..."
          onkeypress="if(event.key==='Enter') enviarMensaje()"
        >
        <button class="btn-enviar" id="btn-enviar" onclick="enviarMensaje()">➤</button>
      </div>
    </div>
    <button class="btn-chat-flotante" id="btn-chat-flotante" onclick="toggleChat()">🤖</button>
  `;

  // Mensaje de bienvenida
  chatHistory = [
    {
      sender: 'assistant',
      text: '¡Hola! Soy tu asistente de economía circular global. ¿Qué necesitas hoy?'
    }
  ];
}

/**
 * Muestra/oculta el chat
 */
window.toggleChat = function() {
  const ventana = document.getElementById('chat-ventana');
  if (ventana) {
    ventana.classList.toggle('activa');
  }
};

/**
 * Minimiza el chat
 */
window.minimizarChat = function() {
  const ventana = document.getElementById('chat-ventana');
  if (ventana) {
    ventana.classList.remove('activa');
  }
};

/**
 * Cierra el chat y limpia el historial
 */
window.cerrarChat = function() {
  const ventana = document.getElementById('chat-ventana');
  if (ventana) {
    ventana.classList.remove('activa');
    chatHistory = [];
    renderizarChat();
  }
};

/**
 * Envía un mensaje rápido desde los botones
 */
window.enviarMensajeRapido = function(texto) {
  procesarMensaje(texto);
};

/**
 * Envía el mensaje del input
 */
window.enviarMensaje = function() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  
  const texto = input.value.trim();
  if (texto) {
    input.value = '';
    procesarMensaje(texto);
  }
};

/**
 * Procesa el mensaje: lo envía a la IA y muestra la respuesta
 */
async function procesarMensaje(texto) {
  // 1. Agregar mensaje del usuario al historial
  chatHistory.push({ sender: 'user', text: texto });
  renderizarChat();

  // 2. Mostrar indicador de "escribiendo"
  mostrarEscribiendo(true);
  deshabilitarInput(true);

  try {
    // 3. Preparar mensajes para la IA (últimos 5)
    const mensajesParaIA = chatHistory.slice(-5).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // 4. Obtener contexto del usuario (si está logueado)
    const contextoUsuario = obtenerContextoUsuario();

    // 5. Llamar a la Edge Function de Supabase
    const respuesta = await llamarIA(mensajesParaIA, contextoUsuario);

    // 6. Agregar respuesta al historial
    chatHistory.push({ sender: 'assistant', text: respuesta.respuesta_usuario });
    renderizarChat();

    // 7. Si hay criterios de búsqueda, activar el muro
    if (respuesta.criterios_busqueda?.accion === 'mostrar_resultados') {
      console.log(' Criterios de búsqueda:', respuesta.criterios_busqueda);
      // Aquí se conectaría con el módulo del muro
      // import('./muro.js').then(m => m.cargarPublicacionesEnMuro(respuesta.criterios_busqueda));
    }

  } catch (error) {
    console.error('❌ Error en el chat IA:', error);
    chatHistory.push({
      sender: 'assistant',
      text: '⚠️ Hubo un error al procesar tu mensaje. Intenta de nuevo en un momento.'
    });
    renderizarChat();
  } finally {
    mostrarEscribiendo(false);
    deshabilitarInput(false);
  }
}

/**
 * Llama a la Edge Function de Supabase
 */
async function llamarIA(mensajes, contextoUsuario) {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/${CONFIG.EDGE_FUNCTION_CHAT}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      messages: mensajes,
      contexto_usuario: contextoUsuario
    })
  });

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Obtiene el contexto del usuario actual
 */
function obtenerContextoUsuario() {
  // Por ahora, datos de ejemplo. Después se conectará con Supabase Auth
  return {
    nombre: 'Usuario',
    localidad: 'Trujillo',
    idioma: 'Español',
    intereses: ['General'],
    privacidad_mensajes: 'Cualquier persona',
    alcance_preferido: 'Local'
  };
}

/**
 * Renderiza los mensajes en el chat
 */
function renderizarChat() {
  const contenedor = document.getElementById('chat-mensajes');
  if (!contenedor) return;

  contenedor.innerHTML = chatHistory.map(msg => `
    <div class="mensaje mensaje-${msg.sender}">
      <div class="mensaje-burbuja">${msg.text}</div>
    </div>
  `).join('');

  // Scroll al final
  contenedor.scrollTop = contenedor.scrollHeight;
}

/**
 * Muestra/oculta el indicador de "escribiendo"
 */
function mostrarEscribiendo(mostrar) {
  const indicador = document.getElementById('chat-escribiendo');
  if (indicador) {
    indicador.classList.toggle('activo', mostrar);
  }
}

/**
 * Habilita/deshabilita el input
 */
function deshabilitarInput(deshabilitar) {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('btn-enviar');
  if (input) input.disabled = deshabilitar;
  if (btn) btn.disabled = deshabilitar;
}

/**
 * Limpia el historial del chat
 */
export function limpiarChat() {
  chatHistory = [
    {
      sender: 'assistant',
      text: '¡Hola! Soy tu asistente de economía circular global. ¿Qué necesitas hoy?'
    }
  ];
  renderizarChat();
  console.log('🗑️ Chat limpiado');
}