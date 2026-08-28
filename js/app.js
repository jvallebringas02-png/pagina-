import CONFIG from './config.js';

// ==========================================
// 1. DETECTOR DE IP (El Ojo)
// ==========================================
async function detectarUbicacion() {
  try {
        const respuesta = await fetch("https://ip-api.com/json/?fields=country,city,lang");
        const datos = await respuesta.json();
    console.log("📍 Usuario detectado en:", datos.city, datos.country);
    
    document.getElementById('texto-ubicacion').innerText = `${datos.city}, ${datos.country}`;
    cargarMuroDinamico(datos.city, datos.country);
    
    if (datos.lang && datos.lang !== 'es') {
      traducirPagina(datos.lang);
    }
  } catch (error) {
    console.error("Error detectando IP:", error);
    document.getElementById('texto-ubicacion').innerText = "Ubicación global";
    cargarMuroDinamico("Global", "Mundial");
  }
}

// ==========================================
// 2. EL MURO DINÁMICO (El Escenario)
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
    
    patrocinadores.innerHTML = `
      <div class="patrocinador-vacio">
        <p>Espacio disponible para negocios de ${ciudad}</p>
      </div>
    `;
  }, 1500);
}

// ==========================================
// 3. ASISTENTE IA (El Sistema Operativo)
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
    const respuestaIA = await llamarGroq(texto);
    document.getElementById('ia-escribiendo').remove();
    chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
    actualizarMuroPorIA(texto);
  } catch (error) {
    document.getElementById('ia-escribiendo').innerText = "️ Error de conexión con la IA.";
  }
}

async function llamarGroq(mensaje) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Eres el Asistente de remarket-db, un Sistema Operativo de Economía Circular. Responde en el idioma del usuario.' },
        { role: 'user', content: mensaje }
      ],
      temperature: 0.7
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
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
// 4. TRADUCTOR AUTOMÁTICO (La Voz)
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
  detectarUbicacion();
});
