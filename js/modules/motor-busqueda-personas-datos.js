// Capa de datos del motor de búsqueda de personas (etapa 3).
// Lee de Supabase lo que el motor necesita, llama a MotorBusquedaPersonas.buscar y devuelve el resultado.
// - Caché corta (60 s) de perfiles, publicaciones y localidades: escribir letra a letra no repite las lecturas.
// - Respuestas tardías: cada llamada con el mismo `canal` invalida a la anterior; la vieja devuelve { descartada: true }.
// - Bloqueo: oculta a quienes bloqueaste. Si existe la función SQL personas_ocultas() la usa también (ambos sentidos).
// - Nunca pide correo ni teléfono: solo perfiles_publicos y publicaciones aprobadas.
var MotorBusquedaPersonasDatos = (function () {
    'use strict';

    var TTL_MS = 60000;
    var MAX_PERFILES = 500;
    var MAX_PRODUCTOS = 1000;
    var cache = { t: 0, dueno: null, datos: null };
    var versiones = {};
    // Nombres y apellidos de los perfiles públicos (sin tildes, en minúsculas), para que la capa de intención reconozca un nombre suelto ("Juan").
    var NOMBRES_TTL_MS = 600000;
    var nombresCache = { t: 0, dueno: null, set: null };

    function ahora(o) { return (o && o.ahora) ? o.ahora() : Date.now(); }

    function leer(promesa) {
        return Promise.resolve(promesa).then(function (r) {
            if (!r) return [];
            if (r.error) throw r.error;
            return r.data || [];
        });
    }

    // Trae todo lo que el motor necesita. Cada lectura es independiente: si una falla, se avisa y se sigue con lo demás.
    function cargar(sb, yo) {
        var fallos = [];
        function seguro(nombre, p, vacio) { return p.then(function (d) { return d; }, function (e) { fallos.push(nombre); return vacio; }); }
        var pPerfiles = seguro('perfiles', leer(sb.from('perfiles_publicos').select('*').limit(MAX_PERFILES)), []);
        var pProductos = seguro('productos', leer(sb.from('productos').select('*').eq('estado', 'aprobado').order('created_at', { ascending: false }).limit(MAX_PRODUCTOS)), []);
        var pLocalidades = seguro('localidades', leer(sb.from('localidades').select('id, pais_id, nombre, region')), []);
        var pBloq = seguro('bloqueados', leer(sb.from('bloqueados').select('bloqueado_id').eq('bloqueador_id', yo.id)), []);
        var pOcultas = (typeof sb.rpc === 'function')
            ? Promise.resolve(sb.rpc('personas_ocultas')).then(function (r) { return (r && !r.error && Array.isArray(r.data)) ? { ok: true, ids: r.data } : { ok: false, ids: [] }; }, function () { return { ok: false, ids: [] }; })
            : Promise.resolve({ ok: false, ids: [] });
        return Promise.all([pPerfiles, pProductos, pLocalidades, pBloq, pOcultas]).then(function (r) {
            var bloqueados = r[3].map(function (b) { return b.bloqueado_id; });
            // la función devuelve ids sueltos (uuid) o filas con un solo campo, según el cliente
            var ocultas = r[4].ids.map(function (x) { return (x && typeof x === 'object') ? (x.personas_ocultas || x.id || Object.keys(x).map(function (k) { return x[k]; })[0]) : x; });
            return {
                datos: { yo: yo, perfiles: r[0], productos: r[1], localidades: r[2], bloqueados: bloqueados, bloqueadores: ocultas },
                fallos: fallos, ocultasDisponible: r[4].ok
            };
        });
    }

    function invalidarCache() { cache = { t: 0, dueno: null, datos: null }; nombresCache = { t: 0, dueno: null, set: null }; }

    function normalizarPalabra(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

    // Guarda las palabras de nombres y apellidos de los demás perfiles (no el mío). Solo palabras de 3 letras o más, solo letras.
    function guardarNombres(datos, yo, t) {
        var set = new Set();
        (datos.perfiles || []).forEach(function (p) {
            if (!p || p.id === yo.id) return;
            [p.nombres, p.apellidos].forEach(function (campo) {
                normalizarPalabra(campo).split(/[\s'’-]+/).forEach(function (w) { if (w.length >= 3 && /^[a-z]+$/.test(w)) set.add(w); });
            });
        });
        nombresCache = { t: t, dueno: yo.id, set: set };
    }

    // Set de palabras de nombres/apellidos conocidos, o null si aún no se leyeron los perfiles (o pasaron 10 minutos) o es otro usuario.
    function nombresConocidos(yo, opciones) {
        yo = yo || (typeof usuarioActual !== 'undefined' ? usuarioActual : null);
        if (!yo || !yo.id || !nombresCache.set || nombresCache.dueno !== yo.id) return null;
        if ((ahora(opciones) - nombresCache.t) > NOMBRES_TTL_MS) return null;
        return nombresCache.set;
    }

    // Sinónimos del buscador principal (zapato = zapatilla = tenis...), si esa pieza está cargada en la página.
    function sinonimosPagina() {
        if (typeof BuscadorMotor === 'undefined' || !BuscadorMotor || typeof BuscadorMotor.obtenerGrupoSinonimos !== 'function') return null;
        return function (palabra) { return BuscadorMotor.obtenerGrupoSinonimos(palabra); };
    }

    // Lee (o reutiliza de la caché) lo que el motor necesita.
    function datosVigentes(sb, yo, opciones) {
        var t = ahora(opciones);
        var vigente = cache.datos && cache.dueno === yo.id && (t - cache.t) < TTL_MS && !opciones.forzar;
        return vigente ? Promise.resolve({ datos: cache.datos, fallos: [], ocultasDisponible: null, deCache: true })
            : cargar(sb, yo).then(function (c) {
                // solo se guarda si se leyó lo esencial: con fallos no se cachea para reintentar en la próxima
                if (!c.fallos.length) { cache = { t: t, dueno: yo.id, datos: c.datos }; guardarNombres(c.datos, yo, t); }
                return c;
            });
    }

    // Lee los perfiles en segundo plano para que nombresConocidos() tenga con qué responder. Nunca rechaza la promesa.
    // opciones: { supabase, yo, forzar, ahora }
    function precargar(opciones) {
        opciones = opciones || {};
        var sb = opciones.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        var yo = opciones.yo || (typeof usuarioActual !== 'undefined' ? usuarioActual : null);
        if (!sb || !yo || !yo.id) return Promise.resolve(false);
        try { return datosVigentes(sb, yo, opciones).then(function () { return true; }, function () { return false; }); }
        catch (e) { return Promise.resolve(false); }
    }

    // Búsquedas sugeridas para tocar, con cuántas personas da cada una. Devuelve [] si no hay sesión o no hay datos.
    // opciones: { supabase, yo, Motor, Interprete, max, forzar, ahora }
    function sugerencias(opciones) {
        opciones = opciones || {};
        var sb = opciones.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        var yo = opciones.yo || (typeof usuarioActual !== 'undefined' ? usuarioActual : null);
        var Motor = opciones.Motor || (typeof MotorBusquedaPersonas !== 'undefined' ? MotorBusquedaPersonas : null);
        if (!sb || !Motor || typeof Motor.sugerencias !== 'function' || !yo || !yo.id) return Promise.resolve([]);
        return datosVigentes(sb, yo, opciones).then(function (c) {
            c.datos.yo = yo;
            return Motor.sugerencias(c.datos, { Interprete: opciones.Interprete, sinonimos: sinonimosPagina(), max: opciones.max });
        });
    }

    // opciones: { supabase, yo, nivelZona, ficha, canal, Motor, Interprete, forzar, ahora, permitirApellidos }  (permitirApellidos: solo Buscar Personas; deja buscar "Carlos Armas" como nombre)
    function buscar(texto, opciones) {
        opciones = opciones || {};
        var sb = opciones.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        var yo = opciones.yo || (typeof usuarioActual !== 'undefined' ? usuarioActual : null);
        var Motor = opciones.Motor || (typeof MotorBusquedaPersonas !== 'undefined' ? MotorBusquedaPersonas : null);
        if (!sb || !Motor) return Promise.reject(new Error('Falta Supabase o motor-busqueda-personas.js'));
        if (!yo || !yo.id) return Promise.resolve({ personas: [], total: 0, mensaje: 'Inicia sesión para buscar personas.', avisos: [], requiere: 'sesion', plan: null });

        var canal = opciones.canal || 'general';
        var miVersion = (versiones[canal] || 0) + 1;
        versiones[canal] = miVersion;

        var pDatos = datosVigentes(sb, yo, opciones);

        return pDatos.then(function (c) {
            if (versiones[canal] !== miVersion) return { descartada: true };
            var datos = c.datos;
            // el perfil propio puede haber cambiado (localidad nueva) aunque la caché sea vieja
            datos.yo = yo;
            // Interruptores de BITACORA-BUSQUEDA-POR-CAPAS-5.md (BusquedaPorCapas.interruptores). La guía (botones) solo en Buscar Personas.
            var cap = (typeof BusquedaPorCapas !== 'undefined' && BusquedaPorCapas.interruptores) ? BusquedaPorCapas.interruptores : {};
            var flag = function (k) { return opciones[k] !== undefined ? opciones[k] === true : cap[k] === true; };
            var r = Motor.buscar(texto, datos, { nivelZona: opciones.nivelZona || null, ficha: opciones.ficha || null, Interprete: opciones.Interprete, sinonimos: opciones.sinonimos || sinonimosPagina(), permitirApellidos: opciones.permitirApellidos === true,
                ampliar: flag('ampliar'), red: flag('red'), guia: flag('guia') && canal === 'panelPersonas', idioma: opciones.idioma || (typeof idiomaDetectado !== 'undefined' ? idiomaDetectado : 'es'), Guia: opciones.Guia });
            if (c.fallos.length && !(r.personas && r.personas.length)) {
                r.avisos = (r.avisos || []).concat(['No pude leer todos los datos (' + c.fallos.join(', ') + '). Intenta de nuevo en un momento.']);
            }
            r.deCache = !!c.deCache;
            return r;
        });
    }

    return { buscar: buscar, sugerencias: sugerencias, precargar: precargar, nombresConocidos: nombresConocidos, invalidarCache: invalidarCache, TTL_MS: TTL_MS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MotorBusquedaPersonasDatos;
