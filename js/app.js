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
chatHistorial.innerHTML += `<div class="msg-ia" id="ia-escribiendo"> Pensando...</div>`;
try {
const respuestaIA = await llamarGroqConModeloDisponible(texto);
document.getElementById('ia-escribiendo').remove();
chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
actualizarMuroPorIA(texto);
} catch (error) {
console.error("❌ Error de IA:", error);
document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message;
}
}
// ✅ PRIMERO CONSULTA QUÉ MODELOS ESTÁN DISPONIBLES EN GROQ (CASCADA PASO 1)
async function obtenerModelosDisponibles() {
try {
const response = await fetch('https://api.groq.com/openai/v1/models', {
headers: {
'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
}
});
if (!response.ok) {
   throw new Error('No se pudo obtener la lista de modelos');
 }
 const data = await response.json();
 const modelos = data.data || [];
 console.log(`📋 Groq tiene ${modelos.length} modelos disponibles`);
 // Filtrar modelos de chat (los que sirven para conversación)
 const modelosChat = modelos.filter(m => {
   const id = m.id.toLowerCase();
   return (
     id.includes('llama') || 
     id.includes('gemma') || 
     id.includes('mixtral') ||
     id.includes('deepseek') ||
     id.includes('qwen')
   );
 });
 console.log(`🤖 Modelos de chat disponibles: ${modelosChat.length}`);
 modelosChat.forEach(m => console.log(`  - ${m.id}`));
 return modelosChat.map(m => m.id);
} catch (error) {
console.error("❌ Error obteniendo modelos:", error);
// 🔄 CASCADA PASO 2: Si falla Groq, usar lista de respaldo CORREGIDA
return [
'llama-3.1-70b-versatile',  // ✅ CORREGIDO: era 3.3 (no existe), ahora 3.1
'llama-3.1-8b-instant',     // ✅ Este está bien
'mixtral-8x7b-32768',       // ✅ Este está bien
'gemma2-9b-it'              // ✅ Este está bien
];
}
}
// ✅ USA EL PRIMER MODELO DISPONIBLE QUE FUNCIONE (CASCADA)
async function llamarGroqConModeloDisponible(mensaje) {
const modelos = await obtenerModelosDisponibles();
if (modelos.length === 0) {
throw new Error('No hay modelos de IA disponibles en Groq');
}
let ultimoError = null;
for (let i = 0; i < modelos.length; i++) {
const modelo = modelos[i];
try {
   console.log(` [Intento ${i + 1}/${modelos.length}] Probando: ${modelo}`);
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
           content: 'Eres el Asistente de remarket-db. Responde SOLO con la respuesta final limpia en español. NUNCA muestres procesos de pensamiento, reglas, verificaciones o borradores. Al final, promociona remarket-db brevemente.' 
         },
         { role: 'user', content: mensaje }
       ],
       temperature: 0.7,
       max_tokens: 500
     })
   });
   if (!response.ok) {
     const errorData = await response.json();
     console.warn(`⚠️ ${modelo} falló:`, errorData.error?.message);
     ultimoError = new Error(errorData.error?.message || `Error ${response.status}`);
     continue;
   }
   const data = await response.json();
   console.log(`✅ ¡ÉXITO con ${modelo}!`);
   if (data.error) {
     throw new Error(data.error.message);
   }
   // 🛡️ FILTRO: Limpiar respuesta de la IA
   let respuestaFinal = data.choices[0].message.content;
   respuestaFinal = limpiarRespuestaIA(respuestaFinal);
   return respuestaFinal;
 } catch (error) {
   ultimoError = error;
   console.warn(`⚠️ Error con ${modelo}:`, error.message);
   continue;
 }
}
throw new Error(ultimoError?.message || 'Ningún modelo de IA está disponible');
}
// ️ FUNCIÓN PARA LIMPIAR LA RESPUESTA DE LA IA
function limpiarRespuestaIA(respuesta) {
const lineas = respuesta.split('\n');
const lineasLimpias = [];
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
'Final Output Generation'
];
for (let linea of lineas) {
const esLineaTecnica = palabrasProhibidas.some(palabra => 
  linea.toLowerCase().includes(palabra.toLowerCase())
);
if (!esLineaTecnica && linea.trim().length > 0) {
  lineasLimpias.push(linea);
}
}
let respuestaLimpia = lineasLimpias.join('\n');
respuestaLimpia = respuestaLimpia.replace(/\*\*/g, '');
respuestaLimpia = respuestaLimpia.replace(/[✅✔️]/g, '');
return respuestaLimpia.trim();
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
console.log(` Traduciendo página a: ${idioma}`);
if (idioma === 'en') document.querySelector('h1').innerText = 'Circular Economy Catalog';
if (idioma === 'it') document.querySelector('h1').innerText = 'Catalogo di Economia Circolare';
}
// ==========================================
// INICIAR EL SISTEMA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
console.log("🚀 remarket-db OS Iniciado");
console.log(" Groq API Key:", CONFIG.GROQ_API_KEY.substring(0, 15) + "...");
detectarUbicacion();
});
