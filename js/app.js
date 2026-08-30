async function enviarMensajeIA() {
  const texto = chatInput.value.trim();
  if (!texto) return;
  
  chatHistorial.innerHTML += `<div class="msg-usuario">${texto}</div>`;
  chatInput.value = '';
  chatHistorial.innerHTML += `<div class="msg-ia" id="ia-escribiendo">🤖 Pensando...</div>`;
  
  try {
    const tipo = detectarTipoDeBusqueda(texto);
    const ubicacion = document.getElementById('texto-ubicacion').innerText || "Callao, Perú";
    const ciudad = ubicacion.split(',')[0].trim();
    
    //  DETECTOR DE PREGUNTAS SOBRE REMARKET-DB (NUEVO)
    const preguntasSobrePlataforma = [
      'que ofrece', 'qué ofrece', 'que es remarket', 'qué es remarket',
      'sobre la pagina', 'sobre la página', 'sobre remarket',
      'de que trata', 'de qué trata', 'para que sirve', 'para qué sirve',
      'como funciona', 'cómo funciona', 'que hace', 'qué hace',
      'que venden', 'qué venden', 'que puedo hacer', 'qué puedo hacer'
    ];
    
    const esSobrePlataforma = preguntasSobrePlataforma.some(p => 
      texto.toLowerCase().includes(p)
    );
    
    // Si pregunta sobre remarket-db → Responder directo (NO buscar en Wikipedia)
    if (esSobrePlataforma) {
      document.getElementById('ia-escribiendo').remove();
      chatHistorial.innerHTML += `<div class="msg-ia">
        remarket-db es una plataforma peruana de economía circular  donde puedes:<br><br>
        ✅ <b>Publicar</b> artículos de segunda mano<br>
        ✅ <b>Vender</b> o <b>comprar</b> productos usados<br>
        ✅ <b>Truequear</b> objetos sin usar dinero<br>
        ✅ <b>Donar</b> lo que ya no necesitas<br><br>
        Todo esto ayuda a reutilizar en lugar de botar a la basura. ♻️<br><br>
        ¿Quieres publicar algo o buscar algún artículo?
      </div>`;
      return; // Terminamos aquí, no buscamos en Wikipedia
    }
    
    // Si es búsqueda de productos → Supabase
    if (tipo === 'PRODUCTOS') {
      document.getElementById('ia-escribiendo').innerText = "🔍 Buscando productos...";
      const productos = await buscarEnSupabase(texto, ciudad);
      
      if (productos.length > 0) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += `<div class="msg-ia">¡Encontré ${productos.length} productos de "${texto}" en ${ciudad}! 🛍️ Los puedes ver en el panel central.</div>`;
        mostrarProductosEnMuro(productos, texto);
        return;
      } else {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += `<div class="msg-ia">Aún no hay "${texto}" en ${ciudad}, pero puedes ser el primero en publicar uno. 📸</div>`;
        return;
      }
    }
    
    // Si es búsqueda web → Wikipedia + YouTube
    if (tipo === 'WEB') {
      document.getElementById('ia-escribiendo').innerText = "🌐 Buscando en la web...";
      const resultados = await buscarEnLaWebConMultimedia(texto);
      if (resultados && (resultados.articulos.length > 0 || resultados.videos.length > 0)) {
        document.getElementById('ia-escribiendo').remove();
        chatHistorial.innerHTML += `<div class="msg-ia">¡Encontré información sobre "${texto}"! 🎯 Te dejé artículos y videos en el panel central. 👇</div>`;
        mostrarResultadosMultimediaEnMuro(resultados, texto);
        return;
      }
    }
    
    // Si es conversación → IA
    const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mensajeEnriquecido = `[CONTEXTO: Usuario en ${ubicacion}, hora: ${horaActual}] ${texto}`;
    
    const respuestaIA = await llamarGroqConModeloDisponible(mensajeEnriquecido);
    document.getElementById('ia-escribiendo').remove();
    
    if (!respuestaIA || respuestaIA.trim().length < 5) {
      chatHistorial.innerHTML += `<div class="msg-ia">⚠️ No pude generar una respuesta. Intenta de nuevo.</div>`;
    } else {
      chatHistorial.innerHTML += `<div class="msg-ia">${respuestaIA}</div>`;
    }
  } catch (error) {
    console.error("❌ Error:", error);
    document.getElementById('ia-escribiendo').innerText = "⚠️ Error: " + error.message;
  }
}
