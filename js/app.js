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

// ✅ CONSULTA MODELOS DISPONIBLES
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
      return id.includes('llama') || id.includes('gemma') || id.includes('mixtral');
    });
    
    return modelosChat.map(m => m.id);
  } catch (error) {
    console.error("❌ Error obteniendo modelos:", error);
    // Lista de respaldo ACTUALIZADA
    return [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ];
  }
}

// ✅ LLAMAR A LA IA CON FILTRO DE LIMPIEZA
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
              content: 'Eres el Asistente de remarket-db. Responde SOLO con la respuesta final limpia en español. NUNCA muestres procesos de pensamiento, reglas, verificaciones o borradores. Al final, menciona brevemente que en remarket-db pueden publicar, vender o hacer trueque gratis.' 
            },
            { role: 'user', content: mensaje }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        ultimoError = new Error(errorData.error?.message);
        continue;
      }
      
      const data = await response.json();
      let respuesta = data.choices[0].message.content;
      
      // 🛡️ FILTRO DE LIMPIEZA - Eliminar todo texto técnico
      respuesta = limpiarRespuestaIA(respuesta);
      
      console.log(`✅ ¡ÉXITO con ${modelo}!`);
      return respuesta;
      
    } catch (error) {
      ultimoError = error;
      continue;
    }
  }
  
  throw new Error(ultimoError?.message || 'Ningún modelo disponible');
}

// 🛡️ FUNCIÓN PARA LIMPIAR LA RESPUESTA DE LA IA
function limpiarRespuestaIA(respuesta) {
  // Dividir en líneas
  const lineas = respuesta.split('\n');
  const lineasLimpias = [];
  
  // Palabras clave que indican texto técnico (NO deben mostrarse)
  const palabrasProhibidas = [
    'matches the mental',
    'All rules satisfied',
    'Output matches',
    'Rule ',
    'Check Against',
    'Formulate Response',
    'Mental Draft',
    'Constraints',
    'thinking process',
    'Analyze User',
    'Identify Key',
    'Draft Response',
    'Final Output Generation',
    'system prompt',
    'requirements'
  ];
  
  for (let linea of lineas) {
    // Verificar si la línea contiene palabras prohibidas
    const esLineaTecnica = palabrasProhibidas.some(palabra => 
      linea.toLowerCase().includes(palabra.toLowerCase())
    );
    
    // Solo agregar si NO es técnica y tiene contenido
    if (!esLineaTecnica && linea.trim().length > 0) {
      lineasLimpias.push(linea);
    }
  }
  
  // Unir las líneas limpias
  let respuestaLimpia = lineasLimpias.join('\n');
  
  // Eliminar asteriscos de formato Markdown
  respuestaLimpia = respuestaLimpia.replace(/\*\*/g, '');
  respuestaLimpia = respuestaLimpia.replace(/\*/g, '');
  
  // Eliminar emojis de verificación
  respuestaLimpia = respuestaLimpia.replace(/[✅✔️]/g, '');
  
  // Si hay texto repetido (duplicado), tomar solo la primera parte
  const partes = respuestaLimpia.split('¡Hola');
  if (partes.length > 2) {
    respuestaLimpia = '¡Hola' + partes[1];
  }
  
  return respuestaLimpia.trim();
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
