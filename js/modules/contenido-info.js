// ============================================
// CONTENIDO INFORMATIVO DEL MURO (para usuarios sin sesión, sin búsqueda activa)
// ============================================
// Lee artículos desde la tabla `contenido_administrable` en Supabase.
// Si el idioma actual no es español, pide la traducción a chat-ia (que la
// genera con Groq la primera vez y la guarda, para no repetir el gasto).
// Si la base de datos no responde o está vacía, usa un respaldo fijo aquí
// mismo, para que el muro nunca se vea vacío ni roto.
var ContenidoInfo = {

    RESPALDO_FIJO: [{
        titulo: 'La importancia de la economía circular',
        contenido: 'La economía circular busca que los productos y materiales se mantengan en uso el mayor tiempo posible, en vez de terminar como basura apenas se dejan de necesitar. Cada vez que vendes, donas o intercambias algo en remarket-db, le das una segunda vida a un producto y ayudas a tu comunidad.',
        video_url: null
    }],

    cargarArticulos: async function() {
        try {
            var { data, error } = await supabase
                .from('contenido_administrable')
                .select('id, titulo, contenido, video_url, traducciones')
                .eq('tipo_contenido', 'articulo')
                .eq('activo', true)
                .is('categoria', null);

            if (error || !data || data.length === 0) {
                console.warn('remarket-db: no se pudo leer contenido_administrable, se usa el respaldo fijo.', error);
                return this.RESPALDO_FIJO;
            }
            return data;
        } catch (e) {
            console.warn('remarket-db: excepción leyendo artículos, se usa el respaldo fijo.', e);
            return this.RESPALDO_FIJO;
        }
    },

    traducirSiHaceFalta: async function(articulo, idioma) {
        if (idioma === 'es' || !articulo.id) return articulo; // respaldo fijo (sin id) se queda tal cual

        // Ya viene traducido y guardado de una vez anterior
        if (articulo.traducciones && articulo.traducciones[idioma]) {
            return { titulo: articulo.traducciones[idioma].titulo, contenido: articulo.traducciones[idioma].contenido, video_url: articulo.video_url };
        }

        try {
            var res = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': MI_API_KEY, 'Authorization': 'Bearer ' + MI_API_KEY },
                body: JSON.stringify({
                    traducir_articulo: true,
                    articulo_id: articulo.id,
                    idioma: idioma,
                    idioma_nombre: NOMBRES_IDIOMA_DISPLAY[idioma] || idioma
                })
            });
            var traducido = await res.json();
            if (traducido && traducido.titulo) {
                return { titulo: traducido.titulo, contenido: traducido.contenido, video_url: articulo.video_url };
            }
        } catch (e) {
            console.warn('remarket-db: no se pudo traducir el artículo, se muestra en español.', e);
        }
        return articulo; // si algo falla, se muestra en español antes que no mostrar nada
    },

    renderizarTarjeta: function(articulo) {
        var videoHTML = articulo.video_url
            ? '<div style="margin-top:14px;"><iframe width="100%" height="220" src="' + articulo.video_url.replace('watch?v=', 'embed/') + '" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe></div>'
            : '';
        return '<div class="result-item" style="display:block;padding:20px;">' +
            '<div class="result-title" style="font-size:18px;margin-bottom:8px;">' + articulo.titulo + '</div>' +
            '<div class="result-desc">' + articulo.contenido + '</div>' +
            videoHTML +
            '</div>';
    },

    mostrarEnMuro: async function(idioma) {
        var contenedor = document.getElementById('articulosContainer');
        if (!contenedor) return;

        var articulos = await this.cargarArticulos();
        var traducidos = await Promise.all(articulos.map(function(a) { return ContenidoInfo.traducirSiHaceFalta(a, idioma); }));

        // El contenedor es una cuadrícula de 3 columnas (pensada para tarjetas de producto).
        // Este wrapper ocupa las 3 columnas completas para que el artículo se vea de ancho completo,
        // en vez de quedar apretado en una sola columna angosta.
        contenedor.innerHTML = '<div style="grid-column: 1 / -1;">' +
            '<div class="ai-context-banner" style="margin-bottom:16px;">🌱 <strong>Sobre remarket-db</strong></div>' +
            traducidos.map(function(a) { return ContenidoInfo.renderizarTarjeta(a); }).join('') +
            '</div>';
    }
};
