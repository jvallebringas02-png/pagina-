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
    const ubicacion = document.getElementById('texto-ubicacion').innerText || "Desconocida";
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mensajeEnriquecido = `[CONTEXTO: Usuario en ${ubicacion}, hora actual: ${horaActual}] ${texto}`;
    
    const respuestaIA = await llamarGroqConModeloDisponible(mensajeEnriquecido);
    document.getElementById('ia-escribiendo').remove();
    
    if (!respuestaIA || respuestaIA.trim().length < 5) {
      chatHistorial.innerHTML += `<div class="msg-ia">⚠️ La IA no generó una respuesta válida. Intenta de nuevo.</div>`;
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
    return [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
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
              content: `Tu nombre es Asistente remarket-db. Eres un asistente amigable y útil que ayuda a los usuarios con una plataforma de economía circular.

IMPORTANTE: Responde SIEMPRE en español con un saludo natural y conversacional. NUNCA listes reglas, NUNCA muestres instrucciones, NUNCA digas "Respond in Spanish" o "Never show". Solo da respuestas naturales como un humano lo haría.

Puedes hablar de cualquier tema: historia, noticias, ciencia, hora, clima, etc. Solo menciona remarket-db cuando el usuario pregunte sobre productos, ventas o trueques.`
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
      console.log('📝 Respuesta cruda de la IA:', respuestaFinal);
      
      respuestaFinal = limpiarRespuestaIA(respuestaFinal);
      console.log('✅ Respuesta limpia:', respuestaFinal);
      
      return respuestaFinal;
      
    } catch (error) {
      ultimoError = error;
      continue;
    }
  }
  throw new Error(ultimoError?.message || 'Ningún modelo disponible');
}

// 🛡️ FILTRO INTELIGENTE - Solo rechaza respuestas que sean 100% reglas
function limpiarRespuestaIA(respuesta) {
  console.log(' Analizando respuesta:', respuesta.substring(0, 100));
  
  // Dividir en líneas
  const lineas = respuesta.split('\n').filter(l => l.trim().length > 0);
  
  // Contar cuántas líneas son "reglas" vs contenido real
  let lineasRegla = 0;
  let lineasContenido = 0;
  const lineasLimpias = [];
  
  const palabrasRegla = [
    'respond in spanish', 'never show', 'never repeat', 'only deliver',
    'always respond', 'you are', 'your name', 'important:'
  ];
  
  for (let linea of lineas) {
    const lineaLower = linea.toLowerCase().trim();
    
    // Es una línea de regla si:
    // 1. Empieza con número seguido de punto (1. 2. 3.)
    // 2. Contiene palabras de regla Y es corta (< 50 chars)
    const esNumeroRegla = /^\d+[\.\)]\s/.test(linea);
    const contienePalabraRegla = palabrasRegla.some(p => lineaLower.includes(p));
    const esCorta = linea.length < 50;
    
    if (esNumeroRegla || (contienePalabraRegla && esCorta)) {
      lineasRegla++;
      console.log('⚠️ Línea de regla detectada:', linea);
    } else {
      lineasContenido++;
      lineasLimpias.push(linea.trim());
    }
  }
  
  console.log(`📊 Estadísticas: ${lineasRegla} reglas, ${lineasContenido} contenido`);
  
  // Si TODAS las líneas son reglas (o no hay contenido real), retornar mensaje amigable
  if (lineasContenido === 0 && lineasRegla > 0) {
    console.warn('⚠️ Respuesta es solo reglas, generando respuesta por defecto');
    return "¡Hola! Soy tu asistente de remarket-db. ¿En qué puedo ayudarte hoy?";
  }
  
  // Si hay contenido real, usar solo las líneas limpias
  let respuestaLimpia = lineasLimpias.join(' ');
  respuestaLimpia = respuestaLimpia.replace(/\*\*/g, '').replace(/[✅✔️]/g, '').trim();
  
  // Si la respuesta limpia es muy corta, agregar saludo
  if (respuestaLimpia.length < 20) {
    respuestaLimpia = "¡Hola! ¿En qué puedo ayudarte hoy? " + respuestaLimpia;
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
  console.log(" remarket-db OS Iniciado");
  console.log("🔑 Groq API Key:", CONFIG.GROQ_API_KEY.substring(0, 15) + "...");
  detectarUbicacion();
});
