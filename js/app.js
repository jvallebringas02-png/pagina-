import CONFIG from './config.js';

// ==========================================
// 1. DETECTOR DE IP
// ==========================================
async function detectarUbicacion() {
  try {
    const respuesta = await fetch('https://ip-api.com/json/?fields=country,city,lang');
    const datos = await respuesta.json();
    if (datos.status === 'success') {
      console.log("✅ Usuario detectado en:", datos.city, datos.country);
      document.getElementById('texto-ubicacion').innerText = `${datos.city}, ${datos.country}`;
      cargarMuroDinamico(datos.city, datos.country);
      if (datos.lang && datos.lang !== 'es') {
        traducirPagina(datos.lang);
      }
    } else {
      throw new Error("API de IP falló");
    }
  } catch (error) {
    console.error("❌ Error detectando IP:", error);
    document.getElementById('texto-ubicacion').innerText = "Callao, Perú";
    cargarMuroDinamico("Callao", "Perú");
  }
}

// ==========================================
// 2. EL MURO DINÁMICO
// ==========================================
function cargarMuroDinamico(ciudad, pais) {
  const muro = document.getElementById('muro-publicaciones');
  const patrocinadores = document.getElementById('lista-patrocinadores');
  muro.innerHTML = `<p>🔍 Buscando artículos en <b>${ciudad}</b>...</p>`;
  setTimeout(() => {
    muro.innerHTML = `<div class="tarjeta-destacada"> <h3>🌱 Bienvenido a la Economía Circular en ${ciudad}</h3> <p>Aún no hay muchas publicaciones en tu zona. ¡Sé el primero en publicar!</p> </div>`;
    if (patrocinadores) {
      patrocinadores.innerHTML = `
        <div class="patrocinador-vacio">
          <p>Espacio disponible para negocios de ${ciudad}</p>
        </div>
      `;
    }
  }, 1500);
}

// ==========================================
// 3. ASISTENTE IA (CASCADA INTELIGENTE)
// ==========================================
const chatInput = document.getElementById('chat-input');
const chatBtn = document.getElementById('chat-btn');
const chatHistorial = document.getElementById('chat-historial');

if (chatBtn) {
  chatBtn.addEventListener('click', () => enviarMensajeIA());
}
if (chatInput) {
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarMensajeIA();
  });
}

async function enviarMensajeIA() {
  const texto = chatInput.value.trim();
  if (!texto) return;
  
  chatHistorial.innerHTML += `<div class="msg-usuario">${texto}</div>`;
  chatInput.value = '';
  
  const idUnico = "ia-escribiendo-" + Date.now();
  chatHistorial.innerHTML += `<div class="msg-ia" id="${idUnico}">🤖 Pensando...</div>`;

  try {
    const respuestaIA = await llamarGroqConModeloDisponible(texto);
    const cargando = document.getElementById(idUnico);
    if (cargando) cargando.remove();
    chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
    actualizarMuroPorIA(texto);
  } catch (error) {
    const cargando = document.getElementById(idUnico);
    if (cargando) cargando.innerText = "⚠️ Error: " + error.message;
  }
}

// ✅ CONSULTA QUÉ MODELOS ESTÁN DISPONIBLES EN GROQ
async function obtenerModelosDisponibles() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}` }
    });
    if (!response.ok) throw new Error('No se pudo obtener la lista de modelos');
    
    const data = await response.json();
    const modelos = data.data || [];
    
    const modelosChat = modelos.filter(m => {
      const id = m.id.toLowerCase();
      return id.includes('llama') || id.includes('gemma') || id.includes('mixtral') || id.includes('deepseek') || id.includes('qwen');
    });
    
    return modelosChat.map(m => m.id);
  } catch (error) {
    console.error("❌ Error obteniendo modelos:", error);
    // LISTA DE RESPALDO (Sin el 3.3 que falla)
    return [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ];
  }
}

// ✅ USA EL PRIMER MODELO DISPONIBLE (CASCADA) Y LIMPIA LA RESPUESTA
async function llamarGroqConModeloDisponible(mensaje) {
  const modelos = await obtenerModelosDisponibles();
  if (modelos.length === 0) throw new Error('No hay modelos de IA disponibles');
  
  let ultimoError = null;
  
  for (let i = 0; i < modelos.length; i++) {
    const modelo = modelos[i];
    try {
      console.log(`🔄 [Intento ${i + 1}] Probando: ${modelo}`);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { 
              role: 'system', 
              content: 'Eres el Asistente de remarket-db. REGLAS ESTRICTAS: 1) NUNCA muestres tu proceso de pensamiento, ni frases como "matches the mental", "All rules satisfied" o "Output matches". 2) Solo entrega la respuesta final limpia. 3) Responde en español. 4) Al final promociona remarket-db. 5) No repitas el saludo.' 
            },
            { role: 'user', content: mensaje }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        ultimoError = new Error(errorData.error?.message || `Error ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      let respuestaFinal = data.choices[0].message.content;

      // 🛡️ FILTRO MÁGICO PARA LIMPIAR LA RESPUESTA
      // 1. Eliminar basura técnica exacta que viste en la foto
      respuestaFinal = respuestaFinal.replace(/\(matches the mental formulation\)✅\s*/g, '');
      respuestaFinal = respuestaFinal.replace(/\s*✨ All rules satisfied\.\s*Output matches response\.✅/g, '');
      respuestaFinal = respuestaFinal.replace(/\s*All rules satisfied\./g, '');
      
      // 2. Eliminar asteriscos de formato
      respuestaFinal = respuestaFinal.replace(/\*\*/g, '');
      
      // 3. Evitar que se duplique el mensaje (si dice "¡Hola!" dos veces, cortamos la segunda)
      const primeraAparicion = respuestaFinal.toLowerCase().indexOf('¡hola!');
      const segundaAparicion = respuestaFinal.toLowerCase().indexOf('¡hola!', primeraAparicion + 1);
      if (primeraAparicion !== -1 && segundaAparicion !== -1) {
        respuestaFinal = respuestaFinal.substring(0, segundaAparicion).trim();
      }

      console.log(`✅ ¡ÉXITO con ${modelo}!`);
      return respuestaFinal;
      
    } catch (error) {
      ultimoError = error;
      continue; // Pasa al siguiente modelo
    }
  }
  throw new Error(ultimoError?.message || 'Ningún modelo de IA está disponible');
}

function actualizarMuroPorIA(texto) {
  const muro = document.getElementById('muro-publicaciones');
  if (texto.toLowerCase().includes('noticia') || texto.toLowerCase().includes('nuevo')) {
    muro.innerHTML = `<h3>📰 Últimas Novedades</h3><p>La IA está buscando las noticias más recientes...</p>`;
  } else if (texto.toLowerCase().includes('usuario') || texto.toLowerCase().includes('gente')) {
    muro.innerHTML = `<h3>👥 Usuarios cerca de ti</h3><p>Mostrando perfiles de tu localidad...</p>`;
  }
}

// ==========================================
// 4. TRADUCTOR AUTOMÁTICO
// ==========================================
function traducirPagina(idioma) {
  console.log(`🌍 Traduciendo página a: ${idioma}`);
  if (idioma === 'en') document.querySelector('h1').innerText = 'Circular Economy Catalog';
  if (idioma === 'it') document.querySelector('h1').innerText = 'Catalogo di Economia Circolare';
}

// ==========================================
// INICIAR EL SISTEMA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log(" remarket-db OS Iniciado");
  console.log("🔑 Groq API Key:", CONFIG.GROQ_API_KEY.substring(0, 15) + "...");
  detectarUbicacion();
});
