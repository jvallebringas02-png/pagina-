var BuscadorMotor = {
    catalogo: [],
    JERGA: { 'carro': 'auto', 'carros': 'auto', 'auto': 'auto', 'autos': 'auto', 'vehiculo': 'auto', 'vehiculos': 'auto', 'coche': 'auto', 'coches': 'auto', 'chompa': 'casaca', 'casaca': 'chompa', 'polo': 'camiseta', 'camisa': 'camiseta', 'camiseta': 'camisa', 'blusa': 'camisa', 'playera': 'camiseta', 'remera': 'camiseta', 'zapa': 'zapatilla', 'zapato': 'zapatilla', 'zapatos': 'zapatilla', 'tenis': 'zapatilla', 'celu': 'celular', 'cel': 'celular', 'note': 'laptop', 'lapto': 'laptop', 'compu': 'computadora', 'ordenador': 'computadora', 'tele': 'televisor', 'bici': 'bicicleta', 'carpintero': 'carpinteria', 'chumpi': 'faja', 'aguayo': 'manta', 'poncho': 'poncho', 'chullo': 'gorro', 'lliqlla': 'manta', 'papa': 'papa', 'quinua': 'quinua', 'oca': 'oca', 'alpaca': 'alpaca', 'maskani': 'busco', 'rantini': 'compro', 'rantikuni': 'vendo', 'aljt\'a': 'venta' },
    STOPWORDS: new Set(['de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'es', 'que', 'si', 'sin', 'sobre', 'este', 'entre', 'cuando', 'muy', 'ya', 'todo', 'esa', 'esos', 'esto', 'eso', 'esta', 'ser', 'ha', 'cada', 'mas', 'pero', 'otro', 'le', 'o', 'estar', 'tener', 'hay', 'aqui', 'bueno', 'tan', 'cual', 'donde', 'mi', 'tu', 'yo', 'me', 'te', 'nos', 'lo', 'como', 'quien', 'porque', 'segun', 'hasta', 'desde', 'hacia']),
    normalizar: function(t) { return t ? t.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim() : ''; },
    tokenizar: function(texto) { var n = this.normalizar(texto); if (!n) return []; return n.split(' ').filter(function(t) { return t.length > 2 && !this.STOPWORDS.has(t); }.bind(this)).map(function(t) { return this.JERGA[t] || t; }.bind(this)); },
    construirIndice: function(articulos) { this.catalogo = articulos; },
    calcularPuntaje: function(art, tokens) { var p = 0; var t = this.normalizar(art.titulo || ''), c = this.normalizar(art.categoria || ''), d = this.normalizar(art.descripcion || ''); tokens.forEach(function(token) { if (t.includes(token)) p += 10; else if (c.includes(token)) p += 5; else if (d.includes(token)) p += 2; }); return p; },

    // Busca en internet (Serper) y YouTube a través de chat-ia, SOLO cuando no hay suficientes productos locales.
    // Reemplaza al respaldo anterior que usaba dummyjson.com (datos de prueba ficticios).
    buscarEnInternetYVideo: async function(query) {
        try {
            var res = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'El usuario está buscando algo en un marketplace. Si no es un producto que puedas vender, usa tus herramientas de búsqueda web y/o video para ayudarlo, y responde en 1-2 oraciones muy breves.' },
                        { role: 'user', content: query }
                    ]
                })
            });
            var data = await res.json();
            return {
                resultados_web: data.resultados_web || null,
                resultados_videos: data.resultados_videos || null,
                respuesta_ia: (data.choices && data.choices[0]) ? data.choices[0].message.content : null
            };
        } catch (e) {
            return { resultados_web: null, resultados_videos: null, respuesta_ia: null };
        }
    },

    ejecutarBusquedaHibrida: async function(query) {
        var tokens = this.tokenizar(query);
        var resultadosLocales = this.catalogo.map(function(art) { return { titulo: art.titulo, categoria: art.categoria, descripcion: art.descripcion, precio: art.precio, modalidad: art.modalidad, pais: art.pais, ciudad: art.ciudad, distancia_km: art.distancia_km, icono: art.icono, imagen_url: art.imagen_url, _puntaje: this.calcularPuntaje(art, tokens), _es_expandido: false, _es_externo: false }; }.bind(this)).filter(function(art) { return art._puntaje > 0; });
        resultadosLocales.sort(function(a, b) { return b._puntaje - a._puntaje; });

        if (resultadosLocales.length >= 3) {
            return { resultados: resultadosLocales, total: this.catalogo.length, coincidencias: resultadosLocales.length, query: query, es_expandido: false, es_hibrido: false, resultados_web: null, resultados_videos: null };
        }

        // Pocos o ningún producto local: buscamos en internet/YouTube real (no más datos inventados)
        var externo = await this.buscarEnInternetYVideo(query);
        return {
            resultados: resultadosLocales,
            total: this.catalogo.length,
            coincidencias: resultadosLocales.length,
            query: query,
            es_expandido: resultadosLocales.length === 0,
            es_hibrido: true,
            resultados_web: externo.resultados_web,
            resultados_videos: externo.resultados_videos,
            respuesta_ia: externo.respuesta_ia
        };
    }
};
