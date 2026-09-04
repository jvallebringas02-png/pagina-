var BuscadorMotor = {
    catalogo: [],
    JERGA: { 'carro': 'auto', 'carros': 'auto', 'auto': 'auto', 'autos': 'auto', 'vehiculo': 'auto', 'vehiculos': 'auto', 'coche': 'auto', 'coches': 'auto', 'chompa': 'casaca', 'casaca': 'chompa', 'polo': 'camiseta', 'camisa': 'camiseta', 'camiseta': 'camisa', 'blusa': 'camisa', 'playera': 'camiseta', 'remera': 'camiseta', 'zapa': 'zapatilla', 'zapato': 'zapatilla', 'zapatos': 'zapatilla', 'tenis': 'zapatilla', 'celu': 'celular', 'cel': 'celular', 'note': 'laptop', 'lapto': 'laptop', 'compu': 'computadora', 'ordenador': 'computadora', 'tele': 'televisor', 'bici': 'bicicleta', 'carpintero': 'carpinteria', 'chumpi': 'faja', 'aguayo': 'manta', 'poncho': 'poncho', 'chullo': 'gorro', 'lliqlla': 'manta', 'papa': 'papa', 'quinua': 'quinua', 'oca': 'oca', 'alpaca': 'alpaca', 'maskani': 'busco', 'rantini': 'compro', 'rantikuni': 'vendo', 'aljt\'a': 'venta' },
    STOPWORDS: new Set(['de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'es', 'que', 'si', 'sin', 'sobre', 'este', 'entre', 'cuando', 'muy', 'ya', 'todo', 'esa', 'esos', 'esto', 'eso', 'esta', 'ser', 'ha', 'cada', 'mas', 'pero', 'otro', 'le', 'o', 'estar', 'tener', 'hay', 'aqui', 'bueno', 'tan', 'cual', 'donde', 'mi', 'tu', 'yo', 'me', 'te', 'nos', 'lo', 'como', 'quien', 'porque', 'segun', 'hasta', 'desde', 'hacia']),
    normalizar: function(t) { return t ? t.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim() : ''; },
    tokenizar: function(texto) { var n = this.normalizar(texto); if (!n) return []; return n.split(' ').filter(function(t) { return t.length > 2 && !this.STOPWORDS.has(t); }.bind(this)).map(function(t) { return this.JERGA[t] || t; }.bind(this)); },
    construirIndice: function(articulos) { this.catalogo = articulos; },
    calcularPuntaje: function(art, tokens) { var p = 0; var t = this.normalizar(art.titulo || ''), c = this.normalizar(art.categoria || ''), d = this.normalizar(art.descripcion || ''); tokens.forEach(function(token) { var variantes = [token]; if (token.length > 4 && token.endsWith('s')) variantes.push(token.slice(0, -1)); var coincide = function(campo) { return variantes.some(function(v) { return campo.includes(v); }); }; if (coincide(t)) p += 10; else if (coincide(c)) p += 5; else if (coincide(d)) p += 2; }); return p; },

    // Busca en internet (Serper) y YouTube directamente a través de chat-ia (modo "busqueda_directa").
    // No depende de que la IA "decida" buscar: si el buscador llega hasta aquí es porque ya
    // hacen falta resultados externos. Reemplaza al respaldo anterior que usaba dummyjson.com
    // (catálogo de pruebas ficticio con datos inventados al azar).
    buscarEnInternetYVideo: async function(query) {
        try {
            var res = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ busqueda_directa: true, query: query })
            });
            var data = await res.json();
            if (data.sin_cuota_web || data.sin_cuota_videos) {
                console.warn('remarket-db: se agotó la cuota gratuita de búsqueda externa (Serper/YouTube). Revisa Supabase > chat-ia > Logs.');
            }
            return {
                resultados_web: data.resultados_web || null,
                resultados_videos: data.resultados_videos || null
            };
        } catch (e) {
            return { resultados_web: null, resultados_videos: null };
        }
    },

    ejecutarBusquedaHibrida: async function(query) {
        var tokens = this.tokenizar(query);
        var resultadosLocales = this.catalogo.map(function(art) { return { titulo: art.titulo, categoria: art.categoria, descripcion: art.descripcion, precio: art.precio, modalidad: art.modalidad, pais: art.pais, ciudad: art.ciudad, distancia_km: art.distancia_km, icono: art.icono, imagen_url: art.imagen_url, _puntaje: this.calcularPuntaje(art, tokens), _es_expandido: false, _es_externo: false }; }.bind(this)).filter(function(art) { return art._puntaje > 0; });
        resultadosLocales.sort(function(a, b) { return b._puntaje - a._puntaje; });

        if (resultadosLocales.length >= 3) {
            return { resultados: resultadosLocales, total: this.catalogo.length, coincidencias: resultadosLocales.length, query: query, es_expandido: false, es_hibrido: false, resultados_web: null, resultados_videos: null };
        }

        var externo = await this.buscarEnInternetYVideo(query);
        return {
            resultados: resultadosLocales,
            total: this.catalogo.length,
            coincidencias: resultadosLocales.length,
            query: query,
            es_expandido: resultadosLocales.length === 0,
            es_hibrido: true,
            resultados_web: externo.resultados_web,
            resultados_videos: externo.resultados_videos
        };
    }
};
