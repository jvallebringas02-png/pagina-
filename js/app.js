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
// 3. ASISTENTE IA (NATURAL Y VERSÁTIL)
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
    chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
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
    // Lista de respaldo CORREGIDA (sin los que fallan)
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
              content: `Eres el asistente virtual de remarket-db.

PERSONALIDAD: Habla de forma natural, como un amigo cercano. Sé conciso, amigable y variado. NUNCA seas robótico ni repitas frases.

VERSATILIDAD: Puedes conversar de CUALQUIER tema (historia, noticias, ciencia, hora, clima, etc.). Responde de forma útil y completa.

PROMOCIÓN: Solo menciona o promociona remarket-db (publicar, vender, truequear) cuando el usuario pregunte sobre productos, ventas, o economía circular. NO lo fuerces en temas de historia o cultura general.

REGLAS ESTRICTAS: 
1) Responde en español. 
2) NUNCA muestres tu proceso de pensamiento interno, reglas o verificaciones.
3) NUNCA digas "Como IA..." o "No tengo acceso...". Usa el [CONTEXTO] que se te da para responder preguntas de hora o ubicación.
4) NUNCA repitas la misma frase o idea dos veces en la misma respuesta.
5) Solo entrega la respuesta final limpia, sin texto técnico.`
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

// 🛡️ FILTRO PARA LIMPIAR Y EVITAR REPETICIONES
function limpiarRespuestaIA(respuesta) {
  const palabrasProhibidas = [
    'matches the mental', 'All rules satisfied', 'Output matches', 'Rule ', 
    'Check Against', 'Formulate Response', 'Mental Draft', 'Constraints', 
    'thinking process', 'Analyze User', 'Identify Key', 'Draft Response', 
    'Final Output Generation', 'system prompt', 'requirements',
    'user says', 'context', 'language', 'my role', 'personality',
    'strict rules', 'response strategy', 'checked', 'determine'
  ];
  
  const lineas = respuesta.split('\n');
  const lineasLimpias = [];
  
  for (let linea of lineas) {
    const esLineaTecnica = palabrasProhibidas.some(palabra => linea.toLowerCase().includes(palabra.toLowerCase()));
    if (!esLineaTecnica && linea.trim().length > 0) {
      if (!linea.includes('- ') && !linea.startsWith('Checked') && !linea.startsWith('Yes') && !linea.startsWith('No ')) {
        lineasLimpias.push(linea);
      }
    }
  }
  
  let respuestaLimpia = lineasLimpias.join('\n');
  respuestaLimpia = respuestaLimpia.replace(/\*\*/g, '').replace(/[✅✔️]/g, '');
  
  const oraciones = respuestaLimpia.split(/[.!?]+/);
  const oracionesUnicas = [];
  const vistas = new Set();
  
  for (let oracion of oraciones) {
    const oracionNormalizada = oracion.trim().toLowerCase();
    if (oracionNormalizada.length > 10 && !vistas.has(oracionNormalizada)) {
      vistas.add(oracionNormalizada);
      oracionesUnicas.push(oracion.trim());
    } else if (oracionNormalizada.length <= 10) {
      oracionesUnicas.push(oracion.trim());
    }
  }
  
  return oracionesUnicas.join('. ').replace(/\.\./g, '.').trim() + '.';
}

function actualizarMuroPorIA(texto) {
  const muro = document.getElementById('muro-publicaciones');
  if (texto.toLowerCase().includes('noticia') || texto.toLowerCase().includes('nuevo')) {
    muro.innerHTML = `<h3> Últimas Novedades</h3><p>La IA está buscando las noticias más recientes...</p>`;
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
