// Verificación directa por palabra clave, aparte de lo que clasifique la IA -- el modelo no
// siempre reconoce esta intención de forma confiable a pesar de la regla en el PROMPT_BASE,
// así que esto sirve de respaldo/corrección para no depender solo de él en este caso puntual.
function detectarIntencionExplorarLocalidad(texto) {
    var t = (texto || '').toLowerCase();
    return /\b(mi zona|la zona|mi localidad|tu zona|tu localidad|mi ciudad|cerca de mi|cerca mio|por categoria|agrupad|agrupalo)\b/.test(
        t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t
    );
}

// Mismo respaldo, para "quiénes somos" / "qué es remarket-db".
function detectarIntencionQuienesSomos(texto) {
    var t = (texto || '').toLowerCase();
    var tNorm = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return /\b(quienes son|quienes somos|que es remarket|que es esta pagina|que es esta plataforma|de que trata|conoce la plataforma|como funciona (la plataforma|esto|remarket))\b/.test(tNorm);
}

// Inicia el flujo guiado del Libro de Reclamaciones -- se intercepta ANTES de llamarla IA
// (no depende de que el modelo lo reconozca bien, aprendiendo de los casos anteriores).
function detectarIntencionReclamo(texto) {
    var t = (texto || '').toLowerCase();
    var tNorm = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return /\b(quiero (hacer|poner|presentar) un reclamo|tengo una queja|libro de reclamaciones|quiero reclamar|hacer un reclamo|poner una queja)\b/.test(tNorm);
}

// Inicia el flujo guiado de contacto con el administrador.
function detectarIntencionContactoAdmin(texto) {
    var t = (texto || '').toLowerCase();
    var tNorm = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return /\b(contactar al administrador|comunicarme con el administrador|hablar con el administrador|escribir al administrador|contactar administrador)\b/.test(tNorm);
}

// Respaldo de ORDEN: si el usuario pide explícitamente ordenar por precio y la IA no lo puso
// en la etiqueta, esto lo detecta igual en JS -- misma idea que detectarIntencionExplorarLocalidad.
function detectarIntencionOrden(texto) {
    var t = (texto || '').toLowerCase();
    var tNorm = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    if (/\b(mas barato|mas economico|precio mas bajo|de menor a mayor precio|del mas barato|bajo precio primero)\b/.test(tNorm)) return 'precio_asc';
    if (/\b(mas caro|precio mas alto|de mayor a menor precio|del mas caro|alto precio primero)\b/.test(tNorm)) return 'precio_desc';
    return null;
}

// Respaldo de UBICACION propia: "mi ciudad", "cerca de mí", etc. -- distinto de extraerLugar(),
// que solo reconoce nombres reales de ciudad/país escritos en el texto.
function detectarIntencionUbicacionPropia(texto) {
    var t = (texto || '').toLowerCase();
    var tNorm = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return /\b(mi ciudad|mi zona|mi localidad|cerca de mi|cerca mio|donde estoy|junto a mi)\b/.test(tNorm);
}

// La hora se responde directo en JS (no se le manda a la IA) -- es un cálculo simple que el
// navegador puede hacer perfecto por sí solo, con la zona horaria que ya detecta config.js.
function detectarPreguntaHora(texto) {
    var t = (texto || '').toLowerCase();
    var tNorm = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return /\b(que hora es|dime la hora|que hora tienes|sabes que hora es|hora es en)\b/.test(tNorm);
}
function responderHoraLocal() {
    try {
        var zona = (typeof UbicacionUsuario !== 'undefined' && UbicacionUsuario.zonaHoraria) || Intl.DateTimeFormat().resolvedOptions().timeZone;
        var ahora = new Date();
        var horaTexto = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: zona });
        var lugar = (typeof UbicacionUsuario !== 'undefined' && UbicacionUsuario.ciudad) ? (UbicacionUsuario.ciudad + ', ' + UbicacionUsuario.pais) : zona;
        return 'Son las ' + horaTexto + ' en ' + lugar + '.';
    } catch (e) {
        return 'No pude calcular la hora en este momento.';
    }
}

var BuscadorMotor = {
    catalogo: [],
    JERGA: { 'carro': 'auto', 'carros': 'auto', 'auto': 'auto', 'autos': 'auto', 'vehiculo': 'auto', 'vehiculos': 'auto', 'coche': 'auto', 'coches': 'auto', 'chompa': 'casaca', 'casaca': 'chompa', 'polo': 'camiseta', 'camisa': 'camiseta', 'camiseta': 'camisa', 'blusa': 'camisa', 'playera': 'camiseta', 'remera': 'camiseta', 'zapa': 'zapatilla', 'zapato': 'zapatilla', 'zapatos': 'zapatilla', 'tenis': 'zapatilla', 'celu': 'celular', 'cel': 'celular', 'note': 'laptop', 'lapto': 'laptop', 'compu': 'computadora', 'ordenador': 'computadora', 'tele': 'televisor', 'bici': 'bicicleta', 'carpintero': 'carpinteria', 'chumpi': 'faja', 'aguayo': 'manta', 'poncho': 'poncho', 'chullo': 'gorro', 'lliqlla': 'manta', 'papa': 'papa', 'quinua': 'quinua', 'oca': 'oca', 'alpaca': 'alpaca', 'maskani': 'busco', 'rantini': 'compro', 'rantikuni': 'vendo', 'aljt\'a': 'venta' },
    STOPWORDS: new Set(['de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'es', 'que', 'si', 'sin', 'sobre', 'este', 'entre', 'cuando', 'muy', 'ya', 'todo', 'esa', 'esos', 'esto', 'eso', 'esta', 'ser', 'ha', 'cada', 'mas', 'pero', 'otro', 'le', 'o', 'estar', 'tener', 'hay', 'aqui', 'bueno', 'tan', 'cual', 'donde', 'mi', 'tu', 'yo', 'me', 'te', 'nos', 'lo', 'como', 'quien', 'porque', 'segun', 'hasta', 'desde', 'hacia']),
    normalizar: function(t) { return t ? t.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim() : ''; },
    tokenizar: function(texto) { var n = this.normalizar(texto); if (!n) return []; return n.split(' ').filter(function(t) { return t.length > 2 && !this.STOPWORDS.has(t); }.bind(this)).map(function(t) { return this.JERGA[t] || t; }.bind(this)); },
    construirIndice: function(articulos) { this.catalogo = articulos; },
    // Sinónimos completos de un token: antes solo se traducía la palabra de búsqueda a UNA forma
    // fija (ej: "zapatos" -> "zapatilla"), y como el producto seguía diciendo "zapatos" en su
    // título, nunca coincidían. Ahora se arma el grupo completo de sinónimos y se compara contra
    // todos, así "zapatos" encuentra productos que digan "zapatos", "zapatilla" o "tenis".
    obtenerGrupoSinonimos: function(token) {
        var grupo = new Set([token]);
        var canonico = this.JERGA[token];
        if (canonico) grupo.add(canonico);
        var self = this;
        Object.keys(this.JERGA).forEach(function(clave) {
            if (self.JERGA[clave] === token || (canonico && self.JERGA[clave] === canonico)) grupo.add(clave);
        });
        if (canonico) grupo.add(canonico);
        return Array.from(grupo);
    },

    calcularPuntaje: function(art, tokens) {
        var p = 0;
        var t = this.normalizar(art.titulo || ''), c = this.normalizar(art.categoria || ''), d = this.normalizar(art.descripcion || '');
        var self = this;
        tokens.forEach(function(token) {
            var variantes = self.obtenerGrupoSinonimos(token);
            var conPlural = [];
            variantes.forEach(function(v) { conPlural.push(v); if (v.length > 4 && v.endsWith('s')) conPlural.push(v.slice(0, -1)); });
            var coincide = function(campo) { return conPlural.some(function(v) { return campo.includes(v); }); };
            if (coincide(t)) p += 10;
            else if (coincide(c)) p += 5;
            else if (coincide(d)) p += 2;
        });
        return p;
    },

    // Detecta un país o ciudad mencionado en la consulta, comparando contra los que REALMENTE
    // existen en el catálogo (no una lista fija en el código) -- así funciona sin importar qué
    // países o ciudades tengan tus productos. Devuelve el valor tal cual está guardado en la
    // base de datos (para poder comparar después con === sin líos de tildes/mayúsculas), o
    // null si la consulta no menciona ninguno.
    extraerLugar: function(query) {
        var textoNorm = ' ' + this.normalizar(query) + ' ';
        var candidatos = {};
        this.catalogo.forEach(function(art) {
            if (art.pais) candidatos[art.pais] = true;
            if (art.ciudad) candidatos[art.ciudad] = true;
        });
        var self = this, encontrado = null, masLargo = 0;
        Object.keys(candidatos).forEach(function(lugar) {
            var lugarNorm = self.normalizar(lugar);
            // length > masLargo: si el nombre de una ciudad está contenido en el de un país
            // (raro, pero posible), se prefiere la coincidencia más específica (más larga).
            if (lugarNorm.length > 2 && textoNorm.indexOf(' ' + lugarNorm + ' ') !== -1 && lugarNorm.length > masLargo) {
                encontrado = lugar; masLargo = lugarNorm.length;
            }
        });
        return encontrado;
    },

    // Bono de cercanía: solo se aplica como desempate entre productos que YA coincidieron por texto
    // (se suma después, no reemplaza el puntaje de texto). Baja de forma lineal hasta 0 a los 300km.
    bonusCercania: function(art) {
        if (typeof art.distancia_km !== 'number' || isNaN(art.distancia_km)) return 0;
        return Math.max(0, 3 - (art.distancia_km / 100));
    },

    // Detecta un presupuesto explícito en la consulta ("menos de 100", "hasta 50 soles", "máximo 200").
    // Si no encuentra ninguno, retorna null y no se filtra por precio.
    extraerPresupuesto: function(query) {
        var m = this.normalizar(query).match(/(?:menos de|hasta|maximo|por debajo de|bajo)\s*(\d+)/);
        return m ? parseFloat(m[1]) : null;
    },

    // Busca en internet (Serper) y YouTube directamente a través de chat-ia (modo "busqueda_directa").
    // No depende de que la IA "decida" buscar: si el buscador llega hasta aquí es porque ya
    // hacen falta resultados externos. Reemplaza al respaldo anterior que usaba dummyjson.com
    // (catálogo de pruebas ficticio con datos inventados al azar).
    buscarEnInternetYVideo: async function(query) {
        try {
            var res = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': MI_API_KEY, 'Authorization': 'Bearer ' + MI_API_KEY },
                body: JSON.stringify({ busqueda_directa: true, query: query, idioma: obtenerIdiomaPreferido() })
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

    // Como buscarEnInternetYVideo, pero para cuando el usuario pidió el video directamente
    // (no como respaldo de una búsqueda de producto sin resultados)
    buscarSoloVideo: async function(query) {
        var externo = await this.buscarEnInternetYVideo(query === 'general' ? 'economía circular' : query);
        return externo.resultados_videos || [];
    },

    // Solo resultados web, para cuando el usuario pide explícitamente "buscar en internet"
    buscarSoloWeb: async function(query) {
        var externo = await this.buscarEnInternetYVideo(query === 'general' ? 'economía circular' : query);
        return externo.resultados_web || [];
    },

    // Música: reutiliza la búsqueda de video, agregando "música" a la consulta
    // para que YouTube devuelva canciones/videos musicales en vez de tutoriales u otros videos
    buscarSoloMusica: async function(query) {
        var consulta = (query === 'general' ? 'música' : query + ' música');
        var externo = await this.buscarEnInternetYVideo(consulta);
        return externo.resultados_videos || [];
    },

    // Lista de categorías realmente presentes en el catálogo, con cuántos productos tiene cada una.
    // Matriz para "explorar mi localidad": agrupa el catálogo por categoría, filtrando primero
    // por tu ciudad; si no hay nada ahí, expande a tu país completo (avisando del cambio de nivel).
    obtenerMatrizPorLocalidad: function() {
        var ciudad = (typeof UbicacionUsuario !== 'undefined') ? UbicacionUsuario.ciudad : null;
        var pais = (typeof UbicacionUsuario !== 'undefined') ? UbicacionUsuario.pais : null;
        var base = ciudad ? this.catalogo.filter(function(a) { return a.ciudad === ciudad; }) : [];
        var nivel = 'ciudad', lugar = ciudad;
        if (!base.length && pais) {
            base = this.catalogo.filter(function(a) { return a.pais === pais; });
            nivel = 'pais';
            lugar = pais;
        }
        var porCategoria = {};
        base.forEach(function(art) {
            var cat = (art.categoria || 'Otros').trim();
            if (!porCategoria[cat]) porCategoria[cat] = [];
            porCategoria[cat].push(art);
        });
        var categorias = Object.keys(porCategoria)
            .sort(function(a, b) { return porCategoria[b].length - porCategoria[a].length; })
            .map(function(cat) { return { nombre: cat, productos: porCategoria[cat].slice(0, 6) }; });
        return { categorias: categorias, nivel: nivel, lugar: lugar };
    },

    // Los patrocinados van primero, pero solo DENTRO del nivel geográfico que ya se filtró --
    // nunca saltan por encima de un resultado más cercano de otro nivel, y como máximo 2 por
    // lista, para que no se sienta como que la plataforma se llenó de anuncios.
    ordenarConPatrocinados: function(lista) {
        var patrocinados = lista.filter(function(x) { return x.es_patrocinado; }).sort(function(a, b) { return b._puntaje - a._puntaje; });
        var resto = lista.filter(function(x) { return !x.es_patrocinado; });
        var restoConExtra = resto.concat(patrocinados.slice(2)).sort(function(a, b) { return b._puntaje - a._puntaje; });
        return patrocinados.slice(0, 2).concat(restoConExtra);
    },

    // ---------- Matriz por niveles: categoría × país (mundial) o categoría × ciudad (dentro de un país) ----------
    // Detecta la combinación de categoría + nivel de ubicación que ya viene en la frase, para
    // saltar directo al punto correspondiente en vez de obligar a navegar nivel por nivel.
    detectarIntencionMatriz: function(texto) {
        var self = this;
        var categoriasDisponibles = this.obtenerCategoriasDisponibles().map(function(c) { return c.nombre; });
        var textoNorm = this.normalizar(texto);
        var categoriasEncontradas = categoriasDisponibles.filter(function(cat) { return textoNorm.indexOf(self.normalizar(cat)) !== -1; });
        var mencionaMatriz = /\b(matriz|comparar|cruzad[oa]|categorias? por pais|categorias? por ciudad)\b/.test(textoNorm);
        var lugar = this.extraerLugar(texto);

        var nivelLugar = null;
        if (lugar) {
            var esPais = this.catalogo.some(function(a) { return a.pais === lugar; });
            var esCiudad = this.catalogo.some(function(a) { return a.ciudad === lugar; });
            nivelLugar = esCiudad ? 'ciudad' : (esPais ? 'pais' : null);
        }

        if (!categoriasEncontradas.length && !mencionaMatriz) return null;

        if (categoriasEncontradas.length && nivelLugar === 'ciudad') {
            return { tipo: 'directo', categorias: categoriasEncontradas, lugar: lugar };
        }
        if (categoriasEncontradas.length && nivelLugar === 'pais') {
            return { tipo: 'matriz', categorias: categoriasEncontradas, nivel: 'pais', lugar: lugar };
        }
        if (categoriasEncontradas.length) {
            return { tipo: 'matriz', categorias: categoriasEncontradas, nivel: 'mundial', lugar: null };
        }
        return { tipo: 'matriz', categorias: null, nivel: (nivelLugar === 'pais' ? 'pais' : 'mundial'), lugar: (nivelLugar === 'pais' ? lugar : null) };
    },
    // Arma la tabla: filas = categorías, columnas = países (nivel mundial) o ciudades de un país
    // (nivel país). Cada celda es la cantidad de publicaciones reales en ese cruce.
    obtenerMatrizNiveles: function(categoriasFiltro, nivel, lugar) {
        var base = this.catalogo.filter(function(a) { return nivel === 'pais' ? a.pais === lugar : true; });
        var columnaKey = nivel === 'pais' ? 'ciudad' : 'pais';
        var matriz = {};
        base.forEach(function(art) {
            var cat = (art.categoria || 'Otros').trim();
            if (categoriasFiltro && categoriasFiltro.indexOf(cat) === -1) return;
            var col = art[columnaKey];
            if (!col) return;
            if (!matriz[cat]) matriz[cat] = {};
            matriz[cat][col] = (matriz[cat][col] || 0) + 1;
        });
        var columnasSet = {};
        Object.keys(matriz).forEach(function(cat) { Object.keys(matriz[cat]).forEach(function(c) { columnasSet[c] = true; }); });
        return { filas: Object.keys(matriz).sort(), columnas: Object.keys(columnasSet).sort(), datos: matriz, nivel: nivel, lugar: lugar, columnaTipo: columnaKey };
    },

    obtenerCategoriasDisponibles: function() {
        var conteo = {};
        this.catalogo.forEach(function(art) {
            var cat = (art.categoria || '').trim();
            if (!cat) return;
            conteo[cat] = (conteo[cat] || 0) + 1;
        });
        return Object.keys(conteo).sort(function(a, b) { return conteo[b] - conteo[a]; }).map(function(cat) { return { nombre: cat, cantidad: conteo[cat] }; });
    },

    // "Novedades": los productos ya vienen ordenados del más nuevo al más viejo desde Supabase
    // (order by created_at desc en database.js), así que basta con tomar los primeros.
    obtenerRecientes: function(limite) {
        limite = limite || 12;
        return this.catalogo.slice(0, limite).map(function(art) {
            return { usuario_id: art.usuario_id, titulo: art.titulo, categoria: art.categoria, descripcion: art.descripcion, precio: art.precio, modalidad: art.modalidad, pais: art.pais, ciudad: art.ciudad, distancia_km: art.distancia_km, icono: art.icono, imagen_url: art.imagen_url, es_patrocinado: !!art.es_patrocinado, _es_expandido: false, _es_externo: false };
        });
    },

    // Aplica el orden final a una lista de resultados ya filtrada. Si el usuario pidió un orden
    // explícito (precio_asc / precio_desc), se respeta tal cual -- no se fuerzan patrocinados
    // arriba, porque el usuario mandó a decir cómo lo quiere ver. Si no pidió orden, se usa el
    // comportamiento de siempre (relevancia + patrocinados intercalados).
    ordenarResultados: function(lista, orden) {
        if (orden === 'precio_asc' || orden === 'precio_desc') {
            var signo = orden === 'precio_asc' ? 1 : -1;
            return lista.slice().sort(function(a, b) {
                var pa = (typeof a.precio === 'number') ? a.precio : Infinity;
                var pb = (typeof b.precio === 'number') ? b.precio : Infinity;
                return signo * (pa - pb);
            });
        }
        return this.ordenarConPatrocinados(lista);
    },

    // opciones = { orden: 'precio_asc'|'precio_desc', ubicacionPropia: true, modalidad: 'venta'|'trueque'|'donacion' }
    // Todas son opcionales -- si no vienen, el comportamiento es idéntico al de antes.
    ejecutarBusquedaHibrida: async function(query, opciones) {
        opciones = opciones || {};
        var self = this;
        var lugar = this.extraerLugar(query);
        var lugarEsPropio = false;
        // Si no mencionó un lugar real por nombre pero pidió su propia ubicación ("mi ciudad",
        // "cerca de mí"), se usa la ciudad/país ya detectado -- esto es un criterio distinto a
        // escribir el nombre de un lugar, así que no se mezcla con la lógica de extraerLugar().
        if (!lugar && opciones.ubicacionPropia && typeof UbicacionUsuario !== 'undefined') {
            lugar = UbicacionUsuario.ciudad || UbicacionUsuario.pais || null;
            lugarEsPropio = !!lugar;
        }
        // El nombre del lugar se saca de la frase para el puntaje de texto -- son dos criterios
        // distintos (qué buscas / dónde), no se debe mezclar "peru" como si fuera parte del producto.
        var queryProducto = (lugar && !lugarEsPropio) ? query.replace(new RegExp(lugar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ') : query;
        var tokens = this.tokenizar(queryProducto);
        var presupuesto = this.extraerPresupuesto(query);

        var mapear = function(art, puntaje) {
            return { usuario_id: art.usuario_id, titulo: art.titulo, categoria: art.categoria, descripcion: art.descripcion, precio: art.precio, modalidad: art.modalidad, pais: art.pais, ciudad: art.ciudad, distancia_km: art.distancia_km, icono: art.icono, imagen_url: art.imagen_url, es_patrocinado: !!art.es_patrocinado, _puntaje: puntaje, _es_expandido: false, _es_externo: false };
        };
        var coincideLugar = function(art) { return !lugar || art.pais === lugar || art.ciudad === lugar; };
        var coincideModalidad = function(art) { return !opciones.modalidad || art.modalidad === opciones.modalidad; };

        var conPuntaje = this.catalogo.map(function(art) {
            // Si solo pidió un lugar sin producto (ej: "muéstrame lo de Perú"), todo cuenta por
            // igual (puntaje 1) y el filtro real lo hace coincideLugar más abajo.
            var puntajeTexto = tokens.length ? self.calcularPuntaje(art, tokens) : 1;
            var puntaje = puntajeTexto > 0 ? puntajeTexto + self.bonusCercania(art) : puntajeTexto;
            return { art: art, puntaje: puntaje };
        }).filter(function(x) {
            if (x.puntaje <= 0) return false;
            if (presupuesto !== null && typeof x.art.precio === 'number' && x.art.precio > presupuesto) return false;
            if (!coincideModalidad(x.art)) return false;
            return true;
        });

        // Criterio real: si pidió un lugar, es obligatorio (AND) -- ya no son puntos extra que
        // un producto de otra categoría podía ganar solo por coincidir en país.
        var resultadosLocales = conPuntaje.filter(function(x) { return coincideLugar(x.art); }).map(function(x) { return mapear(x.art, x.puntaje); });
        resultadosLocales = this.ordenarResultados(resultadosLocales, opciones.orden);

        // Si pidió un lugar específico y ahí no hay nada, pero SÍ hay del producto en otras
        // zonas, se lo decimos con transparencia en vez de saltar directo a internet.
        if (lugar && resultadosLocales.length === 0 && conPuntaje.length > 0) {
            var otrasZonas = conPuntaje.map(function(x) { return mapear(x.art, x.puntaje); });
            otrasZonas = this.ordenarResultados(otrasZonas, opciones.orden);
            return { resultados: otrasZonas, total: this.catalogo.length, coincidencias: otrasZonas.length, query: query, es_expandido: false, es_hibrido: false, resultados_web: null, resultados_videos: null, lugar_sin_resultados: lugar, orden_aplicado: opciones.orden || null };
        }

        // Si el lugar sí filtró algo, esos resultados se muestran tal cual, aunque sean pocos --
        // no tiene sentido mezclarlos con internet solo por ser menos de 3.
        if (resultadosLocales.length >= 3 || (lugar && resultadosLocales.length > 0)) {
            return { resultados: resultadosLocales, total: this.catalogo.length, coincidencias: resultadosLocales.length, query: query, es_expandido: false, es_hibrido: false, resultados_web: null, resultados_videos: null, lugar_aplicado: lugar, lugar_es_propio: lugarEsPropio, orden_aplicado: opciones.orden || null };
        }

        // Con orden u modalidad explícitos, no tiene sentido "completar" con resultados externos
        // de internet -- esos no tienen precio ni modalidad reales para respetar lo que pidió.
        if (opciones.orden || opciones.modalidad) {
            return { resultados: resultadosLocales, total: this.catalogo.length, coincidencias: resultadosLocales.length, query: query, es_expandido: false, es_hibrido: false, resultados_web: null, resultados_videos: null, lugar_aplicado: lugar, lugar_es_propio: lugarEsPropio, orden_aplicado: opciones.orden || null };
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
            resultados_videos: externo.resultados_videos,
            lugar_aplicado: lugar
        };
    }
};
