// Intérprete de la búsqueda de personas (versión 2, 24/10/2026) -- NO está conectado a ninguna pantalla todavía.
// Función pura: recibe lo que la persona escribió y devuelve una "ficha" con lo que se entendió. No usa la IA,
// no consulta Supabase y no toca la página. Pruebas: pruebas/interprete-busqueda-personas.test.js
//
// Ficha: { texto, nombre, zona, lugar, oferta, rol, orden, riesgo:{nivel,motivo}, bloqueada, intencion }
//   zona: 'local' | 'regional' | 'pais' | 'mundial' | null      lugar: texto de un lugar nombrado ("Trujillo") o null
//   oferta: lo que la persona vende u ofrece ("ropa") o null     rol: 'emprendedores', 'vendedores'... o null
//   orden: 'recientes' ("nuevo usuario") o null                  intencion: 'nuevos' | 'nombre' | 'filtro' | 'vacia'
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

    function interpretar(texto, contexto) {
        contexto = contexto || {};
        var original = String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim().slice(0, MAX_LARGO);
        var ficha = { texto: original, nombre: null, zona: null, lugar: null, oferta: null, rol: null, orden: null,
            riesgo: evaluarRiesgo(original), bloqueada: false, intencion: 'vacia' };
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

        // 1) zona
        if (tomar(/\b(a nivel mundial|en todo el mundo|todo el mundo|mundial(es)?|del mundo)\b/)) ficha.zona = 'mundial';
        else if (tomar(/\b(a nivel nacional|nacional(es)?|en mi pais|de mi pais|mi pais)\b/)) ficha.zona = 'pais';
        else if (tomar(/\b(en mi region|de mi region|mi region|regional(es)?)\b/)) ficha.zona = 'regional';
        else if (tomar(/\b(a nivel local|de mi ciudad|en mi ciudad|mi ciudad|de mi zona|en mi zona|mi zona|mi localidad|cerca de mi)\b/)) ficha.zona = 'local';

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
        tomar(/\b(?:que\s+(?:vend\w*|ofrec\w*|da|dan|hace|hacen|tiene|tienen)|vend(?:e|en|iendo)|ofrec(?:e|en))\s+(?:de\s+)?(.+)$/, function (m) {
            var ini = m.index + m[0].indexOf(m[1]);
            ficha.oferta = limpiarNombre(tramoVivo(ini, ini + m[1].length)) || null;
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
        tomar(/^\s*(?:por favor\s+)?(?:(?:quiero|necesito|puedes|podrias|podria)\s+)?(?:busca(?:r|me)?|encuentra(?:me)?|encontrar|muestrame|mostrar|dame|ver)\s+(?:a\s+)?/);
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
        tomar(/\b(usuarios?|personas?|gente|alguien)\b/);

        // 6) lo que queda es el nombre. Solo se quitan palabras de relleno que sobran en los bordes ("a", "de", "que"),
        //    así "Dan Smith", "Rosa Mas" o "Al Pacino" no pierden ninguna palabra.
        var rest = '';
        for (var j = 0; j < original.length; j++) if (mascara[j]) rest += alineado ? original[j] : nb[j];
        rest = limpiarNombre(rest).replace(/^(?:(?:a|que|de|y|con|para)\s+)+/i, '').replace(/(?:\s+(?:a|que|de|y|con|para))+$/i, '').trim();
        if (/^(?:a|que|de|y|con|para)$/i.test(rest)) rest = '';

        // 7) "laptops en Trujillo": si lo que queda son solo nombres de productos, es lo que vende, no un nombre
        var vocab = PRODUCTOS_COMUNES.concat((contexto.palabrasProducto || []).map(normalizar));
        var palabras = rest ? normalizar(rest).split(' ') : [];
        if (palabras.length && palabras.every(function (p) { return vocab.indexOf(p) !== -1; })) {
            if (!ficha.oferta) ficha.oferta = rest; rest = '';
        }
        ficha.nombre = rest || null;

        // 8) si el lugar es el país de quien busca, es la zona "país"
        if (ficha.lugar && contexto.pais && normalizar(ficha.lugar) === normalizar(contexto.pais)) { ficha.zona = ficha.zona || 'pais'; ficha.lugar = null; }

        ficha.intencion = ficha.nombre ? 'nombre' : ((ficha.oferta || ficha.rol || ficha.zona || ficha.lugar) ? 'filtro' : 'vacia');
        // Decisión del dueño: si la palabra de riesgo está solo en lo que parece un NOMBRE (ej. el apellido "Armas"),
        // el que usa el intérprete puede dejarla pasar: buscar un nombre no ayuda a conseguir nada prohibido. Por defecto
        // sigue bloqueada (modo estricto); con riesgo.soloNombre === true se puede relajar sin tocar este archivo.
        if (ficha.riesgo.nivel) ficha.riesgo.soloNombre = (ficha.intencion === 'nombre' && !ficha.oferta && !ficha.rol);
        return ficha;
    }

    // Texto corto para mostrar lo entendido: "Busqué: Juan · tu localidad · vende ropa"
    function describir(ficha) {
        if (!ficha) return '';
        var partes = [];
        if (ficha.intencion === 'nuevos') partes.push('personas nuevas');
        if (ficha.nombre) partes.push(ficha.nombre);
        if (ficha.rol) partes.push(ficha.rol);
        if (ficha.zona) partes.push({ local: 'tu localidad', regional: 'tu región', pais: 'tu país', mundial: 'todo el mundo' }[ficha.zona]);
        if (ficha.lugar) partes.push('en ' + ficha.lugar);
        if (ficha.oferta) partes.push('ofrece ' + ficha.oferta);
        return partes.length ? 'Busqué: ' + partes.join(' · ') : '';
    }

    return { interpretar: interpretar, describir: describir, evaluarRiesgo: evaluarRiesgo, _textoParaRiesgo: textoParaRiesgo };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = InterpreteBusquedaPersonas;
