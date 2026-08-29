import CONFIG from './config.js';

// ==========================================
// 1. DETECTOR DE IP (CORREGIDO - HTTPS)
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
  
  // ID único para evitar conflictos si se hace clic múltiples veces
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

// ✅ CONEXIÓN DIRECTA CON GROQ (SIN BUCLE)
async function llamarGroqConModeloDisponible(mensaje) {
  // Usamos directamente el modelo más rápido y estable
  const modelo = 'llama-3.3-70b-versatile';

  try {
    console.log(`🔄 Conectando directo con: ${modelo}`);
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
            content: 'Eres el Asistente de remarket-db. REGLAS OBLIGATORIAS: 1) NUNCA muestres tu proceso de pensamiento interno, razonamiento, ni pasos de análisis al usuario. Solo entrega la respuesta final limpia y directa. 2) Responde siempre en español, de forma amigable y útil. 3) Al final de cada respuesta, promociona sutilmente remarket-db con un mensaje corto (ej: "Recuerda que en remarket-db puedes publicar, vender o hacer trueque de forma gratis y segura"). 4) Ayuda a los usuarios a publicar, vender, truequear o donar artículos. 5) Si te preguntan algo fuera del tema (hora, clima, historia, noticias), responde amablemente y luego conecta la respuesta con los beneficios de remarket-db.' 
          },
          { role: 'user', content: mensaje }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ ¡ÉXITO con ${modelo}!`);
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    let respuestaFinal = data.choices[0].message.content;

    // 🛡️ FILTRO DE SEGURIDAD: Limpiar respuesta de procesos de pensamiento
    if (respuestaFinal.includes('thinking process') || 
        respuestaFinal.includes('**Final Output Generation:**') ||
        respuestaFinal.includes('**Analyze User Input:**') ||
        respuestaFinal.includes('**Identify Key Requirements:**') ||
        respuestaFinal.includes('**Draft Response:**') ||
        respuestaFinal.includes('**Check Against Requirements:**')) {
      
      const marcadores = [
        '**Final Output Generation:**',
        '**Final Response:**',
        '**Respuesta Final:**'
      ];
      
      for (const marcador of marcadores) {
        if (respuestaFinal.includes(marcador)) {
          const partes = respuestaFinal.split(marcador);
          respuestaFinal = partes[partes.length - 1].trim();
          break;
        }
      }
      
      if (respuestaFinal.includes('Here\'s a thinking process')) {
        const lineas = respuestaFinal.split('\n');
        const lineasLimpias = lineas.filter(l => 
          !l.includes('**') && 
          !l.includes('thinking process') && 
          !l.includes('Check Against') &&
          !l.includes('Identify Key') &&
          !l.includes('Draft Response') &&
          !l.includes('Analyze User')
        );
        respuestaFinal = lineasLimpias.join('\n').trim();
      }
    }
    
    // Limpiar asteriscos de formato Markdown
    respuestaFinal = respuestaFinal.replace(/\*\*/g, '').trim();
    
    return respuestaFinal;

  } catch (error) {
    throw new Error(error.message || 'No se pudo conectar con la IA');
  }
}

function actualizarMuroPorIA(texto) {
  const muro = document.getElementById('muro-publicaciones');
  if (texto.toLowerCase().includes('noticia') || texto.toLowerCase().includes('nuevo')) {
    muro.innerHTML = `<h3>📰 Últimas Novedades</h3><p>La IA está buscando las noticias más recientes...</p>`;
  } else if (texto.toLowerCase().includes('usuario') || texto.toLowerCase().includes('gente')) {
    muro.innerHTML = `<h3> Usuarios cerca de ti</h3><p>Mostrando perfiles de tu localidad...</p>`;
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
