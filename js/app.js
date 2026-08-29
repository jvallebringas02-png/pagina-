import CONFIG from './config.js';

// ==========================================
// 1. DETECTOR DE IP (CORREGIDO - HTTPS)
// ==========================================
async function detectarUbicacion() {
  try {
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
    const respuestaIA = await llamarGroqConRespaldo(texto);
    document.getElementById('ia-escribiendo').remove();
    chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
    actualizarMuroPorIA(texto);
  } catch (error) {
    console.error("❌ Error de IA:", error);
    document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message;
  }
}

// ✅ MODELOS DISPONIBLES EN GROQ (2026)
const MODELOS_GROQ = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768'
];

async function llamarGroqConRespaldo(mensaje) {
  let ultimoError = null;
  
  console.log("🔄 Iniciando prueba de modelos de IA...");
  
  // ✅ PROBAR CADA MODELO SECUENCIALMENTE
  for (let i = 0; i < MODELOS_GROQ.length; i++) {
    const modelo = MODELOS_GROQ[i];
    
    try {
      console.log(`🔄 [Intento ${i + 1}/${MODELOS_GROQ.length}] Probando modelo: ${modelo}`);
      
      const respuesta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      
      // Si la respuesta NO es exitosa
      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        console.warn(`⚠️ Modelo ${modelo} falló:`, errorData.error?.message);
        ultimoError = new Error(errorData.error?.message || `Error ${respuesta.status}`);
        continue; // ⏭️ IR AL SIGUIENTE MODELO
      }
      
      // Si la respuesta ES exitosa
      const data = await respuesta.json();
      console.log(`✅ ¡ÉXITO! Modelo ${modelo} funcionó correctamente`);
      
      if (data.error) {
        console.warn(`️ ${modelo} reportó error:`, data.error.message);
        ultimoError = new Error(data.error.message);
        continue; // ️ IR AL SIGUIENTE MODELO
      }
      
      // ✅ RETORNAR LA RESPUESTA EXITOSA
      return data.choices[0].message.content;
      
    } catch (error) {
      console.warn(`⚠️ Error de conexión con ${modelo}:`, error.message);
      ultimoError = error;
      // ️ CONTINUAR CON EL SIGUIENTE MODELO
      continue;
    }
  }
  
  // ❌ SI TODOS LOS MODELOS FALLARON
  console.error("❌ Todos los modelos de IA fallaron");
  throw new Error(ultimoError?.message || 'La IA no está disponible en este momento. Intenta más tarde.');
}

function actualizarMuroPorIA(texto) {
  const muro = document.getElementById('muro-publicaciones');
  if (texto.toLowerCase().includes('noticia') || texto.toLowerCase().includes('nuevo')) {
    muro.innerHTML = `<h3> Últimas Novedades</h3><p>La IA está buscando las noticias más recientes...</p>`;
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
  console.log(" remarket-db OS Iniciado");
  console.log("🔑 Groq API Key:", CONFIG.GROQ_API_KEY.substring(0, 15) + "...");
  console.log("📋 Modelos disponibles:", MODELOS_GROQ.join(", "));
  detectarUbicacion();
});
