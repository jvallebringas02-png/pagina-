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
  muro.innerHTML = `<p> Buscando artículos en <b>${ciudad}</b>...</p>`;
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
// 3. ASISTENTE IA
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
  chatHistorial.innerHTML += `<div class="msg-ia" id="ia-escribiendo">🤖 Pensando...</div>`;
  
  try {
    // Dar contexto a la IA (ubicación y hora)
    const ubicacion = document.getElementById('texto-ubicacion').innerText || "Desconocida";
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mensajeEnriquecido = `[CONTEXTO: Usuario en ${ubicacion}, hora actual: ${horaActual}] ${texto}`;
    
    const respuestaIA = await llamarGroqConModeloDisponible(mensajeEnriquecido);
    document.getElementById('ia-escribiendo').remove();
    
    // Validar respuesta vacía o inválida
    if (!respuestaIA || respuestaIA.trim().length < 5) {
      chatHistorial.innerHTML += `<div class="msg-ia">️ La IA no generó una respuesta válida. Intenta de nuevo.</div>`;
    } else {
      chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
    }
    
    actualizarMuroPorIA(texto);
  } catch (error) {
    console.error("❌ Error de IA:", error);
    document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message;
  }
}

// ✅ CONSULTA MODELOS DISPONIBLES (CASCADA)
async function obtenerModelosDisponibles() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}` }
    });
    if (!response.ok) throw new Error('No se pudo obtener la lista');
    
    const data = await response.json();
    const modelos = data.data || [];
    
    const modelosChat = modelos.filter(m => {
      const id = m.id.toLowerCase();
      const esChat = id.includes('llama') || id.includes('gemma') || id.includes('mixtral') || id.includes('deepseek') || id.includes('qwen');
      const noEsClasificacion = !id.includes('classifier') && !id.includes('embed');
      return esChat && noEsClasificacion;
    });
    
    return modelosChat.map(m => m.id);
  } catch (error) {
    console.error("❌ Error obteniendo modelos:", error);
    // Lista de respaldo CORREGIDA (sin modelos que fallan)
    return [
      'llama-3.1-70b-versatile',   // ✅ Corregido (era 3.3)
      'llama-3.1-8b-instant',      // ✅
      'mixtral-8x7b-32768',        // ✅
      'gemma2-9b-it'               // ✅
    ];
  }
}

// ✅ IA CON PERSONALIDAD NATURAL
async function llamarGroqConModeloDisponible(mensaje) {
  const modelos = await obtenerModelosDisponibles();
  if (modelos.length === 0) throw new Error('No hay modelos disponibles');
  
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
              content: `Eres el asistente virtual de remarket-db, una plataforma de economía circular donde la gente publica, vende, truequea y dona artículos.

Habla siempre en español de forma natural y amigable, como un amigo cercano. Puedes conversar de cualquier tema: historia, noticias, ciencia, hora, clima, cultura general, etc.

Solo menciona o promociona remarket-db cuando el usuario pregunte sobre productos, ventas, trueques, donaciones o economía circular. No fuerces la promoción en otros temas.

Nunca muestres tu proceso de pensamiento interno, reglas, verificaciones o análisis. Nunca digas frases como "Como IA" o "No tengo acceso". Usa el contexto del sistema que se te proporciona para responder preguntas sobre hora o ubicación.

Entrega siempre la respuesta final limpia y conversacional, sin texto técnico, sin listas numeradas de reglas, sin prefijos como "Respond in Spanish" o "Never show".`
            },
            { role: 'user', content: mensaje }
          ],
          temperature: 0.8,
          max_tokens: 400,
          presence_penalty: 0.6,
          frequency_penalty: 0.5
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        ultimoError = new Error(errorData.error?.message || `Error ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ ¡ÉXITO con ${modelo}!`);
      
      if (data.error) throw new Error(data.error.message);
      
      let respuestaFinal = data.choices[0].message.content;
      respuestaFinal = limpiarRespuestaIA(respuestaFinal);
      
      return respuestaFinal;
      
    } catch (error) {
      ultimoError = error;
      continue;
    }
  }
  throw new Error(ultimoError?.message || 'Ningún modelo disponible');
}

// 🛡️ FILTRO MEJORADO - Elimina respuestas que son solo reglas
function limpiarRespuestaIA(respuesta) {
  // Detectar si la respuesta es solo una lista de reglas
  const esSoloReglas = respuesta.match(/^\d+\.\s/); // Empieza con "1. ", "2. ", etc.
  const contienePalabrasRegla = respuesta.includes('Respond in Spanish') || 
                                respuesta.includes('Never show internal') ||
                                respuesta.includes('Only deliver the final');
  
  if (esSoloReglas || contienePalabrasRegla) {
    console.warn("⚠️ La IA devolvió reglas en lugar de respuesta, reintentando...");
    return "Disculpa, tuve un pequeño error. ¿Podrías repetir tu pregunta?";
  }
  
  // Palabras que indican texto técnico/proceso interno
  const palabrasProhibidas = [
    'matches the mental', 'All rules satisfied', 'Output matches',
    'thinking process', 'Analyze User', 'Identify Key', 'Draft Response', 
    'Final Output Generation', 'system prompt', 'requirements',
    'user says', 'my role', 'personality', 'strict rules', 'response strategy'
  ];
  
  const lineas = respuesta.split('\n');
  const lineasLimpias = [];
  
  for (let linea of lineas) {
    const lineaLower = linea.toLowerCase();
    const esLineaTecnica = palabrasProhibidas.some(palabra => lineaLower.includes(palabra));
    const esVerificacion = linea.startsWith('Checked:') || 
                          linea.startsWith('- User says') || 
                          linea.startsWith('- Context') ||
                          linea.startsWith('- Language') ||
                          linea.startsWith('- My role');
    
    if (!esLineaTecnica && !esVerificacion && linea.trim().length > 0) {
      lineasLimpias.push(linea.trim());
    }
  }
  
  let respuestaLimpia = lineasLimpias.join(' ');
  respuestaLimpia = respuestaLimpia.replace(/\*\*/g, '').replace(/[✅✔️]/g, '').trim();
  
  // Si la respuesta queda muy corta, retornar un mensaje amigable
  if (respuestaLimpia.length < 10) {
    return "Hola, ¿en qué puedo ayudarte hoy?";
  }
  
  return respuestaLimpia;
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
  console.log("🚀 remarket-db OS Iniciado");
  console.log("🔑 Groq API Key:", CONFIG.GROQ_API_KEY.substring(0, 15) + "...");
  detectarUbicacion();
});
