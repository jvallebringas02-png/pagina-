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

    function invalidarCache() { cache = { t: 0, dueno: null, datos: null }; }

    // opciones: { supabase, yo, nivelZona, ficha, canal, Motor, Interprete, forzar, ahora }
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

        var t = ahora(opciones);
        var vigente = cache.datos && cache.dueno === yo.id && (t - cache.t) < TTL_MS && !opciones.forzar;
        var pDatos = vigente ? Promise.resolve({ datos: cache.datos, fallos: [], ocultasDisponible: null, deCache: true })
            : cargar(sb, yo).then(function (c) {
                // solo se guarda si se leyó lo esencial: con fallos no se cachea para reintentar en la próxima
                if (!c.fallos.length) cache = { t: t, dueno: yo.id, datos: c.datos };
                return c;
            });

        return pDatos.then(function (c) {
            if (versiones[canal] !== miVersion) return { descartada: true };
            var datos = c.datos;
            // el perfil propio puede haber cambiado (localidad nueva) aunque la caché sea vieja
            datos.yo = yo;
            var r = Motor.buscar(texto, datos, { nivelZona: opciones.nivelZona || null, ficha: opciones.ficha || null, Interprete: opciones.Interprete });
            if (c.fallos.length && !(r.personas && r.personas.length)) {
                r.avisos = (r.avisos || []).concat(['No pude leer todos los datos (' + c.fallos.join(', ') + '). Intenta de nuevo en un momento.']);
            }
            r.deCache = !!c.deCache;
            return r;
        });
    }

    return { buscar: buscar, invalidarCache: invalidarCache, TTL_MS: TTL_MS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MotorBusquedaPersonasDatos;
