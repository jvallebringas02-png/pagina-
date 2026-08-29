import CONFIG from './config.js';

// ==========================================
// 1. DETECTOR DE IP (CORREGIDO - HTTPS)
// ==========================================
async function detectarUbicacion() {
  try {
    // ✅ HTTPS para evitar Mixed Content
    const respuesta = await fetch('https://ip-api.com/json/?fields=country,city,lang');
    const datos = await respuesta.json();
    
    if (datos.status === 'success') {
      console.log("📍 Usuario detectado en:", datos.city, datos.country);
      document.getElementById('texto-ubicacion').innerText = `${datos.city}, ${datos.country}`;
      cargarMuroDinamico(datos.city, datos.country);
      
      if (datos.lang && datos.lang !== 'es') {
        traducirPagina(datos.lang);
      }
    } else {
      throw new Error("API de IP falló");
    }
  } catch (error) {
    console.error("Error detectando IP:", error);
    // ✅ Fallback: ubicación fija
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
    muro.innerHTML = `
      <div class="tarjeta-destacada">
        <h3>🌱 Bienvenido a la Economía Circular en ${ciudad}</h3>
        <p>Aún no hay muchas publicaciones en tu zona. ¡Sé el primero en publicar!</p>
      </div>
    `;
    
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
// 3. ASISTENTE IA (CON MÚLTIPLES MODELOS)
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

  chatHistorial.innerHTML += `<div class="msg-ia" id="ia-escribiendo"> Pensando...</div>`;

  try {
    const respuestaIA = await llamarGroq(texto);
    document.getElementById('ia-escribiendo').remove();
    chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
    actualizarMuroPorIA(texto);
  } catch (error) {
    console.error("❌ Error de IA:", error);
    document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message;
  }
}

// ✅ Lista de modelos que funcionan en Groq (en orden de preferencia)
const MODELOS_GROQ = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
  'deepseek-r1-distill-llama-70b'
];

async function llamarGroq(mensaje) {
  let ultimoError = null;
  
  // ✅ Probar cada modelo hasta que uno funcione
  for (const modelo of MODELOS_GROQ) {
    try {
      console.log(`🔄 Intentando con modelo: ${modelo}`);
      
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
              content: 'Eres el Asistente de remarket-db, un Sistema Operativo de Economía Circular. Responde en español de forma amigable y útil. Ayuda a los usuarios a publicar, vender, truequear o donar artículos.' 
            },
            { role: 'user', content: mensaje }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn(`⚠️ Modelo ${modelo} falló:`, errorData.error?.message);
        ultimoError = errorData;
        continue; // Intentar con el siguiente modelo
      }
      
      const data = await response.json();
      console.log(`✅ Modelo ${modelo} funcionó correctamente`);
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.choices[0].message.content;
      
    } catch (error) {
      ultimoError = error;
      console.warn(`⚠️ Error con ${modelo}:`, error.message);
      continue;
    }
  }
  
  // Si todos los modelos fallaron
  throw new Error(ultimoError?.error?.message || 'Ningún modelo de IA está disponible actualmente');
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
