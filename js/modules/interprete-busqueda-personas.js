// Intérprete de la búsqueda de personas (versión 3, 24/10/2026: une la versión 2 con las piezas del intérprete de la otra sesión) -- NO está conectado a ninguna pantalla todavía.
// Función pura: recibe lo que la persona escribió y devuelve una "ficha" con lo que se entendió. No usa la IA,
// no consulta Supabase y no toca la página. Pruebas: pruebas/interprete-busqueda-personas.test.js
//
// Ficha: { texto, nombre, usuario, iniciales, zona, lugar, oferta, hace, hace_no_soportado, precio, rol, orden, riesgo:{nivel,motivo}, bloqueada,
//         necesita_segunda_pista, intencion }
//   usuario: "jvalle" (de @jvalle) o null     iniciales: ['j','p'] o null     hace: 'vende' | 'servicios' | 'regala' | 'cambia' (lista)
//   hace_no_soportado: ['compra'] (se detecta y se avisa; hoy la página no guarda lo que alguien quiere comprar)
//   precio: { min, max, orden:'asc'|'desc'|null, moneda:'PEN'|'USD'|'EUR'|null, ambiguo } o null
//   zona: 'local' | 'regional' | 'pais' | 'mundial' | null      lugar: texto de un lugar nombrado ("Trujillo") o null
//   oferta: lo que la persona vende u ofrece ("ropa") o null     rol: 'emprendedores', 'vendedores'... o null
//   orden: 'recientes' ("nuevo usuario") o null                  intencion: 'nuevos' | 'nombre' | 'usuario' | 'filtro' | 'vacia'
//   riesgo.nivel: 'alto' (se bloquea) | 'medio' (se avisa, no se bloquea) | null
// La lista de riesgo es un FRENO, no una pared: la protección real va al publicar y en los reportes.
var InterpreteBusquedaPersonas = (function () {
    'use strict';

    var MAX_LARGO = 120;
    var LUGARES_CONOCIDOS = ['amazonas', 'ancash', 'apurimac', 'arequipa', 'ayacucho', 'cajamarca', 'callao', 'cusco', 'cuzco',
        'huancavelica', 'huanuco', 'ica', 'junin', 'la libertad', 'lambayeque', 'lima', 'loreto', 'madre de dios', 'moquegua',
        'pasco', 'piura', 'puno', 'san martin', 'tacna', 'tumbes', 'ucayali', 'trujillo', 'chiclayo', 'huancayo', 'iquitos',
        'peru', 'chile', 'argentina', 'bolivia', 'colombia', 'ecuador', 'mexico', 'espana', 'brasil', 'venezuela', 'uruguay',
        'paraguay', 'estados unidos', 'canada', 'francia', 'italia', 'alemania', 'japon', 'china'];
    var PRODUCTOS_COMUNES = ['laptop', 'laptops', 'celular', 'celulares', 'ropa', 'zapatos', 'zapatillas', 'muebles', 'libros',
        'bicicleta', 'bicicletas', 'computadora', 'computadoras', 'tv', 'television', 'televisores', 'repuestos', 'herramientas'];
    var ROLES = /\b(emprendedor(es)?|vendedor(es)?|comerciante(s)?|profesional(es)?|trabajador(es)?|artesano(s)?)\b/;
    var PALABRAS_PERSONA = /\b(usuario(s)?|persona(s)?|gente|miembro(s)?|cuenta(s)?|alguien)\b/g;

    // ---------- utilidades de texto ----------
    function sinTildes(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function normalizar(s) { return sinTildes(s).toLowerCase(); }
    // Quita letras repetidas SOLO en palabras largas (cocainaa -> cocaina); "weed" o "amo" no se tocan.
    function colapsarLargas(s) {
        return s.split(' ').map(function (w) { return w.length >= 6 ? w.replace(/([a-z])\1+/g, '$1') : w; }).join(' ');
    }
    var LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };
    function textoParaRiesgo(texto) {
        var t = normalizar(texto);
        // "c o c a i n a" -> "cocaina" (4 o más letras sueltas seguidas)
        t = t.replace(/\b(?:[a-z0-9][\s.\-_*]+){3,}[a-z0-9]\b/g, function (m) { return m.replace(/[\s.\-_*]+/g, ''); });
        t = t.replace(/[^a-z0-9@$ ]+/g, ' ');
        t = t.split(/\s+/).map(function (w) {
            // "c0caina": solo se cambian números en palabras que mezclan letras y números
            if (/[a-z]/.test(w) && /[0-9@$]/.test(w)) return w.replace(/[0-9@$]/g, function (c) { return LEET[c]; });
            return w;
        }).join(' ').trim();
        return colapsarLargas(t);
    }
    function palabrasAlrededor(t, ini, fin, n) {
        var antes = t.slice(0, ini).trim().split(' ').filter(Boolean).slice(-n);
        var despues = t.slice(fin).trim().split(' ').filter(Boolean).slice(0, n);
        return { antes: antes, despues: despues, todas: antes.concat(despues) };
    }
    function contieneAlguna(lista, palabras) {
        return palabras.some(function (p) { return lista.indexOf(p) !== -1; });
    }

    // ---------- riesgo ----------
    // Cada regla va sobre el texto ya normalizado (sin tildes, sin dobles en palabras largas).
    var REGLAS_RIESGO = [
        { motivo: 'drogas', nivel: 'alto', re: /\b(marihuana|mariguana|marijuana|cocaina|cocaine|heroina|heroin|pasta base|extasis|ecstasy|metanfetamina|methamphetamine|fentanilo|fentanyl|sicario|sicarios|cannabis)\b/g },
        { motivo: 'drogas', nivel: 'medio', re: /\b(perico|weed|droga|drogas)\b/g },
        // "droga(s)" suelta solo avisa (hay usos legítimos); pedida u ofrecida ("vende drogas", "busco drogas") se bloquea
        { motivo: 'drogas', nivel: 'alto', re: /\b(droga|drogas)\b/g, validar: function (t, m) {
            return /\b(vend\w*|venta|compr\w*|consegu\w*|busc\w*|quier\w*|necesit\w*|dame|hay|ofrec\w*)\b/.test(t.slice(0, m.index));
        } },
        { motivo: 'armas', nivel: 'alto', re: /\b(armas?|pistolas?|rifles?|escopetas?|municion(es)?|amunition|shotguns?|firearms?|handguns?)\b/g,
          exceptoSiCerca: { despues: ['juguete', 'agua', 'silicona', 'goma', 'espuma', 'fogueo', 'calor', 'pintura', 'pegamento', 'clavos'] } },
        // "revolver" también es un verbo: solo se bloquea si es el arma (no "revolver la pintura", "revolver cemento")
        { motivo: 'armas', nivel: 'alto', re: /\b(revolver(es)?)\b/g, validar: function (t, m) {
            var c = palabrasAlrededor(t, m.index, m.index + m[0].length, 2);
            var sig = c.despues[0] || '';
            var verbo = ['la', 'el', 'los', 'las', 'con', 'cemento', 'pintura', 'mezcla', 'concreto', 'sopa', 'salsa', 'cafe', 'azucar', 'bien', 'todo'];
            if (verbo.indexOf(sig) !== -1) return false;
            return true;
        } },
        { motivo: 'sexual', nivel: 'alto', re: /\b(prostitutas?|prostitutes?|prostitucion|escorts?|servicios sexuales)\b/g,
          exceptoSiCerca: { todas: ['ford', 'auto', 'carro', 'coche', 'vehiculo', 'repuesto', 'repuestos', 'motor', 'modelo', 'mk1', 'mk2'] } },
        { motivo: 'sexual', nivel: 'medio', re: /\b(acompanantes?|sexo)\b/g }
    ];
    function evaluarRiesgo(texto) {
        var t = textoParaRiesgo(texto);
        var mejor = { nivel: null, motivo: null };
        REGLAS_RIESGO.forEach(function (r) {
            r.re.lastIndex = 0;
            var m;
            while ((m = r.re.exec(t)) !== null) {
                var c = palabrasAlrededor(t, m.index, m.index + m[0].length, 2);
                if (r.exceptoSiCerca) {
                    var e = r.exceptoSiCerca;
                    if (e.despues && contieneAlguna(c.despues, e.despues)) continue;
                    if (e.todas && contieneAlguna(c.todas, e.todas)) continue;
                }
                if (r.validar && !r.validar(t, m)) continue;
                if (r.nivel === 'alto' || mejor.nivel === null) { mejor = { nivel: r.nivel, motivo: r.motivo }; }
                if (mejor.nivel === 'alto') return mejor;
            }
        });
        return mejor;
    }

    // ---------- entendimiento de la frase ----------
    function limpiarNombre(s) {
        return String(s || '').replace(/[^\p{L}\p{N}\-'’ ]/gu, ' ').replace(/\s+/g, ' ').trim();
    }

    function fichaNueva(texto) {
        return { texto: texto, nombre: null, usuario: null, iniciales: null, zona: null, lugar: null, oferta: null, condicion: null,
            hace: [], hace_no_soportado: [], precio: null, rol: null, orden: null,
            riesgo: { nivel: null, motivo: null }, bloqueada: false, necesita_segunda_pista: false, intencion: 'vacia' };
    }
    function numero(s) {
        s = String(s).replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
        var n = parseFloat(s);
        return isNaN(n) ? null : n;
    }
    function monedaDe(trozo) {
        if (/s\/|soles|\bsol\b/.test(trozo)) return 'PEN';
        if (/\$|dolar|usd/.test(trozo)) return 'USD';
        if (/euro|eur/.test(trozo)) return 'EUR';
        return null;
    }
    // "qué hace": lo que dice una palabra suelta (vende, servicios, regala, cambia, compra)
    var VERBOS_HACE = [
        { tipo: 'vende', re: /^(vend\w*|venta|ventas)$/ },
        { tipo: 'compra', re: /^(compr\w*|adquir\w*)$/ },
        { tipo: 'servicios', re: /^(servicio|servicios)$/ },
        { tipo: 'regala', re: /^(regal\w*|dona\w*|done\w*|donacion\w*|donaciones)$/ },
        { tipo: 'cambia', re: /^(cambi\w*|trueque\w*|intercambi\w*|permut\w*)$/ }
    ];
    var HACE_NO_SOPORTADO = ['compra'];
    var RELLENO_BORDE = /^(?:o|y|e|u|de|que|da|dan|con|para|por|a|un|una|unos|unas|el|la|los|las)$/;
    function anotarHace(ficha, tipo) {
        var lista = HACE_NO_SOPORTADO.indexOf(tipo) !== -1 ? ficha.hace_no_soportado : ficha.hace;
        if (lista.indexOf(tipo) === -1) lista.push(tipo);
    }
    // Del texto que sigue a "que vende ..." saca los verbos ("o compre o de servicios") y deja solo lo que se ofrece.
    function separarHace(ficha, textoOferta) {
        var palabras = String(textoOferta || '').split(' ').filter(Boolean), dejar = [];
        palabras.forEach(function (w) {
            var nw = normalizar(w), tipo = null;
            if (/^(?:da|dan|den|hace\w*|hagan|tien\w*|tengan|ofrec\w*|ofrezcan|brind\w*|prest\w*)$/.test(nw)) return; // verbo de relleno, no es lo que se ofrece
            for (var v = 0; v < VERBOS_HACE.length; v++) { if (VERBOS_HACE[v].re.test(nw)) { tipo = VERBOS_HACE[v].tipo; break; } }
            if (tipo) anotarHace(ficha, tipo); else dejar.push(w);
        });
        while (dejar.length && RELLENO_BORDE.test(normalizar(dejar[0]))) dejar.shift();
        while (dejar.length && RELLENO_BORDE.test(normalizar(dejar[dejar.length - 1]))) dejar.pop();
        return dejar.join(' ') || null;
    }
    var PEDIDOS = /^(compr\w*|vend\w*|venta|busc\w*|quier\w*|necesit\w*|hay|tien\w*|ofrec\w*|regal\w*|cambi\w*|dame|consegu\w*|fabric\w*|arm\w*|tienda|se)$/;
    var N_PRECIO = '(\\d+(?:[.,]\\d+)*)';
    var M_PRECIO = '(?:\\s*(?:s\\/\\.?|\\$|soles|sol|dolares|dolar|usd|euros|eur))?';
    var P_PRECIO = '(?:(?:s\\/\\.?|\\$)\\s*)?';
    var RE_ENTRE = new RegExp('\\bentre\\s+' + P_PRECIO + N_PRECIO + M_PRECIO + '\\s+(?:y|a)\\s+' + P_PRECIO + N_PRECIO + M_PRECIO);
    var RE_MAX = new RegExp('\\b(?:menos de|menor a|menos que|hasta|maximo|max|no mas de|por debajo de|a menos de|bajo)\\s+' + P_PRECIO + N_PRECIO + M_PRECIO);
    var RE_MIN = new RegExp('\\b(?:mas de|mayor a|desde|minimo|min|por encima de|a partir de)\\s+' + P_PRECIO + N_PRECIO + M_PRECIO);

    function interpretar(texto, contexto) {
        contexto = contexto || {};
        var original = String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim().slice(0, MAX_LARGO);
        var ficha = fichaNueva(original);
        ficha.riesgo = evaluarRiesgo(original);
        ficha.bloqueada = ficha.riesgo.nivel === 'alto';
        if (!original) return ficha;

        var nb = normalizar(original);
        var alineado = (nb.length === original.length); // si no, se pierde la mayúscula original pero no se rompe nada
        var mascara = []; for (var i = 0; i < original.length; i++) mascara.push(true); // true = se conserva
        function quitar(ini, fin) { for (var k = ini; k < fin; k++) mascara[k] = false; }
        // texto original de un tramo, sin lo que ya se quitó (así "ropa en Lima" no arrastra el lugar ya sacado)
        function tramoVivo(ini, fin) {
            var r = '';
            for (var k = ini; k < fin; k++) if (mascara[k]) r += alineado ? original[k] : nb[k];
            return r;
        }
        // texto normalizado con lo ya quitado reemplazado por espacios (así las posiciones no se mueven)
        function vivo() { return nb.split('').map(function (ch, k) { return mascara[k] ? ch : ' '; }).join(''); }
        function tomar(re, fn) {
            var v = vivo(); re.lastIndex = 0; var m = re.exec(v);
            if (!m) return false;
            if (fn) fn(m, v); // primero se lee el tramo, después se marca como quitado
            quitar(m.index, m.index + m[0].length);
            return true;
        }

        // 0) @usuario
        tomar(/(?:^|\s)@([a-z0-9_.]{2,30})(?=\s|$)/, function (m) { ficha.usuario = m[1]; });

        // 0b) "con nombre Juan", "llamado Juan Pérez": el nombre se dice de forma explícita y no se mezcla con lo que se vende
        tomar(/\b(?:con nombre|de nombre|llamad[oa]s?|que se llama[n]?)\s+(?:de\s+)?([a-z]+(?: [a-z]+){0,3})(?=\s+(?:en|que|quien|vend\w*|ofrec\w*|por|con)\b|\s*$)/, function (m) {
            var ini = m.index + m[0].indexOf(m[1]);
            var n = limpiarNombre(tramoVivo(ini, ini + m[1].length));
            ficha.nombre = n || null;
        });

        // 1) zona
        if (tomar(/\b(a nivel mundial|en todo el mundo|todo el mundo|mundial(es)?|del mundo)\b/)) ficha.zona = 'mundial';
        else if (tomar(/\b(a nivel nacional|nacional(es)?|en mi pais|de mi pais|mi pais)\b/)) ficha.zona = 'pais';
        else if (tomar(/\b(en mi region|de mi region|mi region|regional(es)?)\b/)) ficha.zona = 'regional';
        else if (tomar(/\b(a nivel local|de mi ciudad|en mi ciudad|mi ciudad|en la ciudad|de la ciudad|de mi zona|en mi zona|mi zona|mi localidad|cerca de mi)\b/)) ficha.zona = 'local';

        // 1b) precio. Va antes que "lugar" y "qué vende" para que "menos de 500 soles" no se pegue a lo que se vende.
        //     "caro" suelto NO cuenta (es un nombre: "Caro Pérez"); solo "más caro", "caros", "caras".
        var precio = { min: null, max: null, orden: null, moneda: null, ambiguo: false }, hayPrecio = false;
        tomar(RE_ENTRE, function (m) { precio.min = numero(m[1]); precio.max = numero(m[2]); precio.moneda = monedaDe(m[0]); hayPrecio = true; });
        tomar(RE_MAX, function (m) { precio.max = numero(m[1]); precio.moneda = precio.moneda || monedaDe(m[0]); hayPrecio = true; });
        tomar(RE_MIN, function (m) { precio.min = numero(m[1]); precio.moneda = precio.moneda || monedaDe(m[0]); hayPrecio = true; });
        if (tomar(/\b(mas baratos?|mas baratas?|mas economic[oa]s?|menor precio|baratos?|baratas?|economic[oa]s?)\b/, function () { precio.orden = 'asc'; hayPrecio = true; })) { /* listo */ }
        else tomar(/\b(mas car[oa]s?|mayor precio|car[oa]s)\b/, function () { precio.orden = 'desc'; hayPrecio = true; });
        // "por precio" suelto es ambiguo (¿ordenar? ¿con precio publicado? ¿un rango?). Se ordena del más barato y se marca.
        tomar(/\b(?:por\s+)?precios?\b/, function () { if (!hayPrecio) { precio.orden = 'asc'; precio.ambiguo = true; hayPrecio = true; } });
        if (hayPrecio) ficha.precio = precio;

        // 1c) segunda mano: la página no tiene un campo de condición, así que solo se anota que se pidió (se busca por texto)
        tomar(/\b(?:de\s+)?(?:segunda mano|usad[oa]s?|seminuev[oa]s?)\b/, function () { ficha.condicion = 'usado'; });

        // 2) lugar nombrado, qué vende y otra vez lugar (el orden de la frase puede variar)
        function sacarLugar() {
            var v = vivo();
            var conocidos = LUGARES_CONOCIDOS.slice().sort(function (a, b) { return b.length - a.length; }).join('|');
            var re = new RegExp('\\b(?:en|de)\\s+(' + conocidos + ')\\s*$');
            var m = re.exec(v);
            var esEn = false;
            if (!m) { // "en X" con cualquier X (solo "en", porque "de X" puede ser un apellido: "María de la Cruz")
                m = /\ben\s+(?!mi\b|el\b|la\b|los\b|las\b)([a-z]+(?: [a-z]+){0,2})\s*$/.exec(v);
                esEn = !!m;
            }
            if (!m) return false;
            var ini = m.index, fin = m.index + m[0].length;
            var lugarOriginal = alineado ? original.slice(ini + m[0].indexOf(m[1]), ini + m[0].indexOf(m[1]) + m[1].length) : m[1];
            quitar(ini, fin);
            ficha.lugar = limpiarNombre(lugarOriginal) || m[1];
            return true;
        }
        sacarLugar();
        // "da", "dan", "hace", "tiene" solo cuentan después de "que" ("que da clases"): sin eso, "Dan Smith" sería un verbo
        // Además de vender, se reconocen regalar, cambiar, comprar y servicios; lo de después puede traer más verbos ("o compre o de servicios")
        tomar(/\b(?:(?:lo\s+)?(?:que|quien(?:es)?)\s+(?:vend\w*|ofrec\w*|da|dan|den|hagan|tengan|dicta\w*|imparte\w*|hace|hacen|tiene|tienen|regal\w*|dona\w*|cambi\w*|trueque\w*|intercambi\w*|compr\w*|brind\w*|prest\w*)|vend(?:e|en|iendo)|ofrec(?:e|en))(?:\s+(?:de\s+)?(.+))?$/, function (m) {
            var cola = m[1] || '';
            var prefijo = m[0].slice(0, m[0].length - cola.length);
            prefijo.split(/\s+/).forEach(function (w) {
                for (var v = 0; v < VERBOS_HACE.length; v++) { if (VERBOS_HACE[v].re.test(w)) { anotarHace(ficha, VERBOS_HACE[v].tipo); break; } }
            });
            if (cola) {
                var ini = m.index + m[0].length - cola.length;
                ficha.oferta = separarHace(ficha, limpiarNombre(tramoVivo(ini, ini + cola.length)));
                // "da clases de piano", "hace reparación de laptops": es un servicio y lo que se ofrece es lo que sigue
                if (ficha.oferta) {
                    var sv = /^(?:clases?|talleres?|asesorias?|reparacion(?:es)?|instalacion(?:es)?|mantenimiento|asistencia tecnica)(?:\s+(?:de|en|para)\s+(.+))?$/.exec(normalizar(ficha.oferta));
                    if (sv) {
                        anotarHace(ficha, 'servicios');
                        var pal = ficha.oferta.split(' ').filter(Boolean);
                        ficha.oferta = sv[1] ? (limpiarNombre(pal.slice(pal.length - sv[1].split(' ').length).join(' ')) || null) : null;
                    }
                }
            }
        });
        tomar(/\bvendedor(?:es)?\s+de\s+(.+)$/, function (m) {
            var ini = m.index + m[0].indexOf(m[1]);
            ficha.oferta = limpiarNombre(tramoVivo(ini, ini + m[1].length)) || null;
        });
        if (!ficha.lugar) sacarLugar();
        if (ficha.oferta && !ficha.lugar) { // "ropa en Lima": el lugar quedó pegado a lo que vende
            var mo = /^(.*?)\s+en\s+([a-z]+(?: [a-z]+){0,2})$/.exec(normalizar(ficha.oferta));
            if (mo) { ficha.lugar = limpiarNombre(ficha.oferta.slice(mo[1].length + 4)); ficha.oferta = limpiarNombre(ficha.oferta.slice(0, mo[1].length)) || null; }
        }

        // 3) frases de arranque ("búscame a", "quiero encontrar a", "persona llamada")
        tomar(/^\s*(?:por favor\s+)?(?:(?:quiero|necesito|deseo|puedes|podrias|podria|me gustaria|estoy|ando)\s+)?(?:busca(?:r|me|ndo)?|busco|encuentra(?:me)?|encontrar|encuentro|muestrame|mostrar|dame|ver|comprar|conseguir|consigo)\s+(?:(?:a|al|un|una|unos|unas)\s+)?/);
        // "quiero zapatos", "necesito un plomero", "donde consigo zapatos", "tienen zapatos": solo expresan la intención, no son parte del nombre
        tomar(/^\s*(?:por favor\s+)?(?:quiero|necesito|deseo|me gustaria|me interesa)\s+(?:(?:a|al|un|una|unos|unas)\s+)?/);
        tomar(/^\s*(?:donde\s+(?:consigo|encuentro|compro|venden|hay)|tienen|tiene|hay)\s+(?:(?:un|una|unos|unas)\s+)?/);
        tomar(/\b(?:usuarios?|personas?|gente|alguien)\s+(?:llamad[oa]s?|de nombre|que se llama[n]?)\b/);

        // 4) "nuevo usuario" / "usuarios recientes": se piden los últimos registrados, no a alguien llamado "Nuevo"
        var vNuevos = vivo();
        if (/\b(nuev[oa]s?|recientes?|recien (llegad[oa]s?|registrad[oa]s?)|ultim[oa]s?)\b/.test(vNuevos)) {
            var resto = vNuevos.replace(/\b(nuev[oa]s?|recientes?|recien (llegad[oa]s?|registrad[oa]s?)|ultim[oa]s?)\b/g, ' ').replace(PALABRAS_PERSONA, ' ').replace(/\b(a|de|los|las|el|la|un|una)\b/g, ' ').trim();
            var tienePersona = (new RegExp(PALABRAS_PERSONA.source)).test(vNuevos);
            if (tienePersona && !resto) {
                ficha.orden = 'recientes'; ficha.intencion = 'nuevos'; return ficha;
            }
        }

        // 5) rol ("emprendedores", "vendedores") y palabras genéricas sueltas
        tomar(ROLES, function (m) { ficha.rol = m[0]; });
        tomar(/\b(?:todas?|todos)\s+(?:las|los)\b/); // "todas las personas": no es un nombre (y no lista a nadie)
        tomar(/\b(usuarios?|personas?|gente|alguien)\b/);
        tomar(/\b(quien(?:es)?|cual(?:es)?)\b/); // "quién vende laptops": "quién" no es un nombre

        // 6) lo que queda es el nombre. Solo se quitan palabras de relleno que sobran en los bordes ("a", "de", "que"),
        //    así "Dan Smith", "Rosa Mas" o "Al Pacino" no pierden ninguna palabra.
        var rest = '';
        for (var j = 0; j < original.length; j++) if (mascara[j]) rest += alineado ? original[j] : nb[j];
        var restBruto = limpiarNombre(rest);
        var tokIni = normalizar(restBruto).split(' ').filter(Boolean);
        if (tokIni.length >= 3) tokIni = tokIni.filter(function (t, i) { return !(i > 0 && i < tokIni.length - 1 && 'yoeu'.indexOf(t) !== -1 && t.length === 1); }); // "j y p"
        if (tokIni.length === 1 && tokIni[0].length === 2 && !/[aeiou]/.test(tokIni[0])) tokIni = tokIni[0].split(''); // "jp"
        if (tokIni.length >= 1 && tokIni.length <= 4 && tokIni.every(function (t) { return t.length === 1 && /[a-z]/.test(t); })) {
            ficha.iniciales = tokIni; rest = '';
        }
        rest = limpiarNombre(rest).replace(/^(?:(?:a|que|de|y|con|para|por)\s+)+/i, '').replace(/(?:\s+(?:a|que|de|y|con|para|por))+$/i, '').trim();
        if (/^(?:a|que|de|y|con|para|por)$/i.test(rest)) rest = '';

        // 7) "laptops en Trujillo": si lo que queda son solo nombres de productos, es lo que vende, no un nombre
        function sing(p) { return p.replace(/(?:es|s)$/, ''); } // zapato = zapatos
        var vocab = PRODUCTOS_COMUNES.concat((contexto.palabrasProducto || []).map(normalizar)).map(sing);
        var palabras = rest ? normalizar(rest).split(' ') : [];
        if (palabras.length && palabras.every(function (p) { return vocab.indexOf(sing(p)) !== -1; })) {
            if (!ficha.oferta) ficha.oferta = rest; rest = '';
        }
        ficha.nombre = rest || ficha.nombre || null;

        // 8) si el lugar es el país de quien busca, es la zona "país"
        if (ficha.lugar && contexto.pais && normalizar(ficha.lugar) === normalizar(contexto.pais)) { ficha.zona = ficha.zona || 'pais'; ficha.lugar = null; }

        ficha.intencion = (ficha.nombre || ficha.iniciales) ? 'nombre'
            : (ficha.usuario ? 'usuario'
            : ((ficha.oferta || ficha.rol || ficha.zona || ficha.lugar || ficha.hace.length || ficha.precio || ficha.condicion) ? 'filtro' : 'vacia'));
        // Una sola letra sola obliga a dar una segunda pista (evita listar a todos los usuarios)
        if (ficha.iniciales && ficha.iniciales.length === 1 && !ficha.zona && !ficha.lugar && !ficha.oferta && !ficha.rol &&
            !ficha.hace.length && !ficha.precio && !ficha.usuario) ficha.necesita_segunda_pista = true;
        // Un @usuario también pasa por la lista de riesgo (la '@' se confunde con una letra en el texto general)
        if (ficha.usuario) {
            var ru = evaluarRiesgo(ficha.usuario.replace(/[._]+/g, ' '));
            if (ru.nivel && ficha.riesgo.nivel !== 'alto') ficha.riesgo = ru;
            ficha.bloqueada = ficha.riesgo.nivel === 'alto';
        }
        // Decisión del dueño: si la palabra de riesgo está solo en lo que parece un NOMBRE (ej. el apellido "Armas"),
        // el que usa el intérprete puede dejarla pasar: buscar un nombre no ayuda a conseguir nada prohibido. Por defecto
        // sigue bloqueada (modo estricto); con riesgo.soloNombre === true se puede relajar sin tocar este archivo.
        if (ficha.riesgo.nivel) ficha.riesgo.soloNombre = (ficha.intencion === 'nombre' && !ficha.oferta && !ficha.rol);
        // Opt-in (contexto.permitirApellidos === true): un apellido "Armas" después de un nombre ("Carlos Armas") se busca como PERSONA.
        // No es un permiso para buscar armas: solo con intencion 'nombre', sin oferta, sin verbos de pedido ("compro", "busco", "venta")
        // y sin otra palabra de riesgo antes. Quien use esto debe buscar SOLO por nombre y nunca por oferta. Por defecto sigue estricto.
        if (contexto.permitirApellidos === true && ficha.bloqueada && ficha.riesgo.motivo === 'armas' && ficha.riesgo.soloNombre &&
            ficha.nombre && !ficha.hace.length && !ficha.precio) {
            var tk = normalizar(ficha.nombre).split(' ').filter(Boolean), ult = tk[tk.length - 1], antes = tk.slice(0, -1);
            if (tk.length >= 2 && /^armas?$/.test(ult) && evaluarRiesgo(antes.join(' ')).nivel === null &&
                !antes.some(function (t) { return PEDIDOS.test(t); })) {
                ficha.bloqueada = false; ficha.riesgo.permitidoComoApellido = true;
            }
        }
        return ficha;
    }

    // Texto corto para mostrar lo entendido: "Busqué: Juan · tu localidad · vende ropa"
    function describir(ficha) {
        if (!ficha || ficha.bloqueada) return ''; // una búsqueda bloqueada no se repite en pantalla
        var partes = [];
        if (ficha.intencion === 'nuevos') partes.push('personas nuevas');
        if (ficha.usuario) partes.push('@' + ficha.usuario);
        if (ficha.nombre) partes.push(ficha.nombre);
        if (ficha.iniciales) partes.push('iniciales ' + ficha.iniciales.join(' ').toUpperCase());
        if (ficha.rol) partes.push(ficha.rol);
        if (ficha.zona) partes.push({ local: 'tu localidad', regional: 'tu región', pais: 'tu país', mundial: 'todo el mundo' }[ficha.zona]);
        if (ficha.lugar) partes.push('en ' + ficha.lugar);
        var HACE = { vende: 'vende', servicios: 'da servicios', regala: 'regala', cambia: 'cambia' };
        // "vende" solo ya se entiende con "ofrece ropa"; no se repite
        if (ficha.hace && ficha.hace.length && !(ficha.oferta && ficha.hace.length === 1 && ficha.hace[0] === 'vende')) {
            partes.push(ficha.hace.map(function (h) { return HACE[h] || h; }).join(' o '));
        }
        if (ficha.oferta) partes.push('ofrece ' + ficha.oferta);
        if (ficha.condicion) partes.push('de segunda mano');
        if (ficha.precio) {
            var p = ficha.precio, txt = [];
            if (p.min !== null) txt.push('desde ' + p.min);
            if (p.max !== null) txt.push('hasta ' + p.max);
            if (p.orden === 'asc') txt.push('del más barato al más caro');
            if (p.orden === 'desc') txt.push('del más caro al más barato');
            if (txt.length) partes.push('precio: ' + txt.join(', '));
        }
        return partes.length ? 'Busqué: ' + partes.join(' · ') : '';
    }

    // Validación de una ficha que viene de afuera (por ejemplo, de la IA). La IA nunca escribe consultas: solo llena campos.
    // Aquí pasan únicamente los campos conocidos, con valores permitidos y textos cortos y limpios. Lo demás se descarta,
    // y la lista de riesgo se vuelve a aplicar sobre lo que quedó.
    function sanear(externa) {
        var f = fichaNueva('');
        if (!externa || typeof externa !== 'object') return f;
        var txt = function (v, max) { return typeof v === 'string' ? (limpiarNombre(v).slice(0, max) || null) : null; };
        f.nombre = txt(externa.nombre, 60);
        f.lugar = txt(externa.lugar, 40);
        f.oferta = txt(externa.oferta, 60);
        if (typeof externa.usuario === 'string') { var u = normalizar(externa.usuario).replace(/^@/, ''); f.usuario = /^[a-z0-9_.]{2,30}$/.test(u) ? u : null; }
        if (Array.isArray(externa.iniciales)) {
            var ini = externa.iniciales.map(function (x) { return typeof x === 'string' ? normalizar(x) : ''; })
                .filter(function (x) { return /^[a-z]$/.test(x); }).slice(0, 4);
            f.iniciales = ini.length ? ini : null;
        }
        if (['local', 'regional', 'pais', 'mundial'].indexOf(externa.zona) !== -1) f.zona = externa.zona;
        if (typeof externa.rol === 'string' && ROLES.test(normalizar(externa.rol))) f.rol = normalizar(externa.rol).match(ROLES)[0];
        if (externa.orden === 'recientes') f.orden = 'recientes';
        if (externa.condicion === 'usado') f.condicion = 'usado';
        if (Array.isArray(externa.hace)) {
            externa.hace.forEach(function (h) { if (['vende', 'servicios', 'regala', 'cambia'].indexOf(h) !== -1 && f.hace.indexOf(h) === -1) f.hace.push(h); });
        }
        if (externa.precio && typeof externa.precio === 'object') {
            var num = function (n) { return (typeof n === 'number' && isFinite(n) && n >= 0 && n < 1e9) ? n : null; };
            var pr = { min: num(externa.precio.min), max: num(externa.precio.max), orden: null, moneda: null, ambiguo: false };
            if (externa.precio.orden === 'asc' || externa.precio.orden === 'desc') pr.orden = externa.precio.orden;
            if (['PEN', 'USD', 'EUR'].indexOf(externa.precio.moneda) !== -1) pr.moneda = externa.precio.moneda;
            if (pr.min !== null || pr.max !== null || pr.orden) f.precio = pr;
        }
        f.texto = [f.nombre, f.usuario, f.lugar, f.oferta].filter(Boolean).join(' ');
        f.riesgo = evaluarRiesgo(f.texto);
        if (f.usuario) { var ru = evaluarRiesgo(f.usuario.replace(/[._]+/g, ' ')); if (ru.nivel && f.riesgo.nivel !== 'alto') f.riesgo = ru; }
        f.bloqueada = f.riesgo.nivel === 'alto';
        f.intencion = (f.nombre || f.iniciales) ? 'nombre' : (f.usuario ? 'usuario'
            : ((f.oferta || f.rol || f.zona || f.lugar || f.hace.length || f.precio || f.condicion) ? 'filtro' : (f.orden === 'recientes' ? 'nuevos' : 'vacia')));
        if (f.orden === 'recientes' && f.intencion === 'vacia') f.intencion = 'nuevos';
        // una sola inicial sola no lista a nadie (también por el camino de la IA)
        if (f.iniciales && f.iniciales.length === 1 && !f.zona && !f.lugar && !f.oferta && !f.rol && !f.hace.length && !f.precio && !f.usuario && !f.condicion) f.necesita_segunda_pista = true;
        return f;
    }

    return { interpretar: interpretar, describir: describir, evaluarRiesgo: evaluarRiesgo, sanear: sanear, _textoParaRiesgo: textoParaRiesgo };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = InterpreteBusquedaPersonas;
