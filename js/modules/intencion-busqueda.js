// Capa 1 de la búsqueda por capas: INTENCIÓN (13/11/2026). Función pura: no usa la IA, no consulta Supabase y no toca la página.
// Todavía NO está conectada a ninguna pantalla (paso 2 de BITACORA-BUSQUEDA-POR-CAPAS-1.md). Pruebas: pruebas/intencion-busqueda.test.js
// Requiere LimpiezaBusqueda (js/modules/limpieza-busqueda.js), que debe cargarse antes en el navegador.
//
// decidir(texto, contexto) devuelve:
//   texto           : { original, limpio, comparable }  (salida de la capa 0)
//   directa         : 'hora' | 'reclamo' | 'contacto_admin' | 'quienes_somos' | 'explorar_localidad' | null
//                     (acciones que no son una búsqueda; se resuelven sin IA, en el mismo orden que hoy)
//   principal       : 'personas' | 'productos' | 'ia' | null
//                     'ia' = ninguna regla reconoció la frase: que decida la IA como hoy (video, música, web, publicar, conversación...).
//                     null cuando hay una acción directa.
//   secundaria      : 'personas' | 'productos' | null   (la otra cosa que también conviene mostrar si la frase es ambigua)
//   ambigua         : true si hay que mostrar ambas cosas (decisión pendiente 9.3 de la bitácora; por defecto se muestran ambas)
//   orden           : 'precio_asc' | 'precio_desc' | null      ubicacionPropia: true si dice "mi ciudad", "cerca de mí"...
//   pistas          : { persona: [...], producto: [...] }      razon: texto corto de por qué se decidió así (para pruebas y depurar)
// contexto (opcional):
//   superficie      : 'principal' | 'asistente' | 'panel' | 'personas'. En 'personas' (Buscar Personas, Compartir, Mensajes) SIEMPRE es personas.
//   esTerminoProducto(palabra) : función opcional; si se pasa (ej. con el catálogo), resuelve palabras sueltas como "Samsung".
//   esNombreConocido(palabra)  : función opcional (14/11/2026); recibe una palabra comparable (minúsculas, sin tildes) y dice si es nombre o apellido de algún perfil.
//                                Con ella, "Juan", "juan perez" o "maria torres" son personas sin ambigüedad (si no hay señal de producto ni es un producto conocido).
// Reglas por idioma: hoy solo español (REGLAS.es). Los otros idiomas se agregan en el paso 7 sin tocar el resto.
// NO decide la matriz de categorías (detectarIntencionMatriz necesita el catálogo): esa se queda donde está por ahora.
var IntencionBusqueda = (function () {
    'use strict';

    var Limp = (typeof LimpiezaBusqueda !== 'undefined') ? LimpiezaBusqueda
        : ((typeof require === 'function') ? require('./limpieza-busqueda.js') : null);

    var PRODUCTOS_COMUNES = ['laptop', 'laptops', 'celular', 'celulares', 'ropa', 'zapatos', 'zapatillas', 'muebles', 'libros',
        'bicicleta', 'bicicletas', 'computadora', 'computadoras', 'tv', 'television', 'televisores', 'repuestos', 'herramientas'];

    var REGLAS = {
        es: {
            // --- acciones directas: mismas expresiones que las funciones sueltas de buscador.js (hay prueba de paridad) ---
            hora: /\b(que hora es|dime la hora|que hora tienes|sabes que hora es|hora es en)\b/,
            reclamo: /\b(quiero (hacer|poner|presentar) un reclamo|tengo una queja|libro de reclamaciones|quiero reclamar|hacer un reclamo|poner una queja)\b/,
            contactoAdmin: /\b(contactar al administrador|comunicarme con el administrador|hablar con el administrador|escribir al administrador|contactar administrador)\b/,
            quienesSomos: /\b(quienes son|quienes somos|que es remarket|que es esta pagina|que es esta plataforma|de que trata|conoce la plataforma|como funciona (la plataforma|esto|remarket))\b/,
            explorarLocalidad: /\b(mi zona|la zona|mi localidad|tu zona|tu localidad|mi ciudad|cerca de mi|cerca mio|por categoria|agrupad|agrupalo)\b/,
            ordenAsc: /\b(mas barato|mas economico|precio mas bajo|de menor a mayor precio|del mas barato|bajo precio primero)\b/,
            ordenDesc: /\b(mas caro|precio mas alto|de mayor a menor precio|del mas caro|alto precio primero)\b/,
            ubicacionPropia: /\b(mi ciudad|mi zona|mi localidad|cerca de mi|cerca mio|donde estoy|junto a mi)\b/,
            // --- señales FUERTES de que busca personas ---
            personaFuerte: [
                ['usuario', /(^|\s)@[a-z0-9_.]{2,30}(\s|$)/],
                ['palabra de persona', /\b(usuarios?|personas?|gente|miembros?|cuentas?|alguien|quien|quienes)\b/],
                ['rol', /\b(vendedor(es)?|emprendedor(es)?|comerciante(s)?|artesano(s)?)\b/],
                ['inicial', /\b(inicial(es)?|empieza(n)? con|comienza(n)? con|apellido|se llama|llamad[oa])\b/],
                ['que + verbo de oferta', /\bque (venda|vende|vendan|ofrezca|ofrece|compre|compra|regale|regala|done|dona|cambie|cambia|trabaje|trabaja)\b/],
                ['contactar', /\b(hablar con|contactar a|contactar con|escribir a|escribirle a|mandar mensaje a|enviar mensaje a|comunicarme con)\b/]
            ],
            // --- señales de que busca PRODUCTOS ---
            productoSenal: [
                ['compra o venta', /\b(comprar|compro|vendo|venta|ventas|precio|precios|barato|baratos|baratas|economico|economicos|oferta|ofertas|usado|usados|usada|usadas|segunda mano|gratis|trueque)\b/],
                ['presupuesto', /\b(menos de|hasta|maximo|por debajo de|bajo)\s+\d+/],
                ['moneda', /\b(soles|dolares|usd|euros)\b/]
            ]
        }
    };

    function unico(arr) { return arr.filter(function (x, i) { return arr.indexOf(x) === i; }); }

    function decidir(texto, contexto) {
        contexto = contexto || {};
        var R = REGLAS[contexto.idioma || 'es'] || REGLAS.es;
        var l = Limp.limpiar(texto);
        var c = l.comparable;
        var salida = {
            texto: { original: l.original, limpio: l.limpio, comparable: l.comparable },
            directa: null, principal: 'ia', secundaria: null, ambigua: false,
            orden: null, ubicacionPropia: R.ubicacionPropia.test(c),
            pistas: { persona: [], producto: [] }, razon: ''
        };
        if (R.ordenAsc.test(c)) salida.orden = 'precio_asc';
        else if (R.ordenDesc.test(c)) salida.orden = 'precio_desc';
        if (l.vacio) { salida.principal = null; salida.razon = 'texto vacío'; return salida; }

        // Pistas de personas y de productos
        R.personaFuerte.forEach(function (p) { if (p[1].test(c)) salida.pistas.persona.push(p[0]); });
        var palabras = c.split(' ').filter(Boolean);
        var productoConocido = palabras.some(function (w) { return PRODUCTOS_COMUNES.indexOf(w) !== -1; });
        if (productoConocido) salida.pistas.producto.push('producto conocido');
        R.productoSenal.forEach(function (p) { if (p[1].test(c)) salida.pistas.producto.push(p[0]); });
        if (salida.orden) salida.pistas.producto.push('orden por precio');
        if (typeof contexto.esTerminoProducto === 'function' && palabras.some(function (w) { try { return contexto.esTerminoProducto(w); } catch (e) { return false; } })) {
            salida.pistas.producto.push('término del catálogo');
        }
        var fuerte = salida.pistas.persona.length > 0;
        var producto = salida.pistas.producto.length > 0;

        // En Buscar Personas / Compartir / Mensajes todo es personas: no hay nada que decidir.
        if (contexto.superficie === 'personas') {
            salida.principal = 'personas'; salida.razon = 'pantalla de personas';
            return salida;
        }

        // Acciones directas, en el orden en que se revisan hoy (hora, reclamo, contacto; luego quiénes somos y por último zona).
        // Diferencia a propósito: si la frase pide personas con claridad ("gente de mi zona"), NO se desvía a la matriz de zona.
        if (R.hora.test(c)) { salida.directa = 'hora'; }
        else if (R.reclamo.test(c)) { salida.directa = 'reclamo'; }
        else if (R.contactoAdmin.test(c)) { salida.directa = 'contacto_admin'; }
        else if (R.quienesSomos.test(c)) { salida.directa = 'quienes_somos'; }
        else if (R.explorarLocalidad.test(c) && !fuerte) { salida.directa = 'explorar_localidad'; }
        if (salida.directa) { salida.principal = null; salida.razon = 'acción directa: ' + salida.directa; return salida; }

        // Señales débiles de personas: nombre propio (mayúsculas en el texto original) o iniciales sueltas ("J P")
        var tokens = l.limpio.split(' ').filter(Boolean);
        var mayus = tokens.filter(function (t) { return /^\p{Lu}[\p{L}'’-]+$/u.test(t); });
        var nombrePropio = mayus.length >= 2;
        var inicialesSueltas = tokens.length >= 2 && tokens.length <= 4 && tokens.every(function (t) { return /^\p{L}$/u.test(t); });
        var palabraSuelta = tokens.length === 1 && mayus.length === 1;
        // Nombres y apellidos reales: 1 a 4 palabras (sin conectores como "de" o "la"), todas conocidas. Sin señal de producto.
        var nombreConocido = false;
        if (typeof contexto.esNombreConocido === 'function' && !producto) {
            var CONECTORES = ['de', 'del', 'la', 'las', 'los', 'y', 'van', 'von'];
            var util = palabras.filter(function (w) { return CONECTORES.indexOf(w) === -1; });
            var conocida = function (w) {
                try { if (contexto.esNombreConocido(w)) return true; } catch (e) { return false; }
                var partes = w.split(/['’-]+/).filter(function (x) { return x.length >= 3; });
                return partes.length > 0 && partes.every(function (x) { try { return contexto.esNombreConocido(x); } catch (e) { return false; } });
            };
            nombreConocido = util.length >= 1 && util.length <= 4 && util.every(conocida);
        }

        if (fuerte) {
            salida.principal = 'personas';
            salida.razon = 'señal clara de personas: ' + unico(salida.pistas.persona).join(', ');
        } else if (nombrePropio || inicialesSueltas) {
            salida.pistas.persona.push(nombrePropio ? 'nombre propio' : 'iniciales');
            if (producto) { salida.principal = 'personas'; salida.secundaria = 'productos'; salida.ambigua = true; salida.razon = 'nombre propio y también señal de producto'; }
            else { salida.principal = 'personas'; salida.razon = 'parece un nombre o iniciales'; }
        } else if (nombreConocido) {
            salida.pistas.persona.push('nombre conocido');
            salida.principal = 'personas'; salida.razon = 'coincide con nombres y apellidos de perfiles';
        } else if (producto) {
            salida.principal = 'productos';
            // "laptops" a secas (una o dos palabras): producto, pero también puede haber quien lo venda (decisión 9.3: mostrar ambas)
            if (productoConocido && palabras.length <= 2 && !salida.pistas.producto.some(function (p) { return p !== 'producto conocido'; })) {
                salida.secundaria = 'personas'; salida.ambigua = true; salida.razon = 'producto a secas: se muestran productos y, aparte, quien lo vende';
            } else { salida.razon = 'señal de producto: ' + unico(salida.pistas.producto).join(', '); }
        } else if (palabraSuelta) {
            salida.pistas.persona.push('palabra con mayúscula');
            salida.principal = 'personas'; salida.secundaria = 'productos'; salida.ambigua = true;
            salida.razon = 'una sola palabra con mayúscula: puede ser nombre o marca';
        } else {
            salida.principal = 'ia'; salida.razon = 'sin señal clara: decide la IA como hoy';
        }
        return salida;
    }

    return { decidir: decidir, REGLAS: REGLAS, PRODUCTOS_COMUNES: PRODUCTOS_COMUNES };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = IntencionBusqueda;
