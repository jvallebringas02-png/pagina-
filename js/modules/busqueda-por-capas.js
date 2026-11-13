// Entrada única de la búsqueda por capas (paso 3, 13/11/2026). Encadena: 0 limpieza -> 1 intención -> 2 interpretación -> 3 búsqueda,
// y devuelve SIEMPRE la misma forma de respuesta para que cada pantalla solo decida cómo dibujarla. Pruebas: pruebas/busqueda-por-capas.test.js
// Todavía NO está conectada a ninguna pantalla (eso es el paso 5). No usa la IA y no cambia ningún archivo existente.
// Requiere (en el navegador, cargados antes): limpieza-busqueda.js, intencion-busqueda.js y, para buscar personas,
// interprete-busqueda-personas.js, motor-busqueda-personas.js y motor-busqueda-personas-datos.js.
//
// BusquedaPorCapas.procesar(frase, contexto) -> Promise de:
//   { version, texto:{original,limpio,comparable}, intencion:{...salida de IntencionBusqueda.decidir...},
//     accion:   'directa' | 'personas' | 'productos' | 'ia' | 'vacia' | 'descartada'   <- lo que la pantalla debe hacer ahora
//     directa:  'hora' | 'reclamo' | 'contacto_admin' | 'quienes_somos' | 'explorar_localidad' | null
//     personas: null | { lista, total, ficha, plan, mensaje, avisos, requiere, alternativas, motor }   (solo si se buscó en personas)
//     respaldo: true si la pantalla debe usar el código de siempre (capa apagada o con error);  error: texto o null }
//   - accion 'personas'  : ya vienen las personas en `personas`.
//   - accion 'productos' / 'ia': la pantalla sigue con su buscador de productos o con la IA, como hoy. Si `intencion.ambigua`, y
//                          `personas` no es null, conviene mostrar además esas personas (decisión 9.3: mostrar ambas cosas).
//   - accion 'directa'   : la pantalla abre lo que dice `directa` (hora, reclamo...), sin buscar.
//   - 'descartada'       : llegó una búsqueda más nueva en el mismo canal; no hay que dibujar esta.
// BusquedaPorCapas.buscarPersonas(frase, contexto): igual, pero siempre en personas (Buscar Personas, Compartir, Mensajes).
// contexto: { superficie:'principal'|'asistente'|'panel'|'personas', canal, nivelZona, yo, supabase, forzar, esTerminoProducto,
//             Datos, Motor, Interprete (para pruebas; por defecto los de la página) }
// INTERRUPTORES: se apagan por capa desde la consola o desde un <script> sin tocar el resto:
//   BusquedaPorCapas.interruptores.entrada = false   -> todo vuelve al código de siempre (respaldo:true)
//   BusquedaPorCapas.interruptores.intencion = false -> no decide: personas solo en la pantalla de personas, lo demás a la IA
//   BusquedaPorCapas.interruptores.limpieza = false  -> no limpia el texto (solo recorta espacios)
var BusquedaPorCapas = (function () {
    'use strict';

    var interruptores = { entrada: true, limpieza: true, intencion: true };
    var VERSION = 1;

    function dep(nombre, requerido) {
        if (typeof require === 'function') { try { return require(requerido); } catch (e) { return null; } }
        return null;
    }
    function global_(nombre) { return (typeof window !== 'undefined' && window[nombre]) ? window[nombre] : (typeof globalThis !== 'undefined' ? globalThis[nombre] : undefined); }
    function Limp() { return global_('LimpiezaBusqueda') || dep('LimpiezaBusqueda', './limpieza-busqueda.js'); }
    function Inten() { return global_('IntencionBusqueda') || dep('IntencionBusqueda', './intencion-busqueda.js'); }

    function respuestaBase(frase) {
        return { version: VERSION, texto: { original: typeof frase === 'string' ? frase : '', limpio: '', comparable: '' }, intencion: null,
            accion: 'ia', directa: null, personas: null, respaldo: false, error: null };
    }
    function enRespaldo(r, motivo) { r.respaldo = true; r.error = motivo; return r; }

    // Texto que se le da al motor de personas
    function textoParaMotor(l, intencion, Interprete) {
        // Lista de riesgo: si con guiones y puntos quitados ("co-caina" -> "cocaina") la frase es de riesgo alto, se le da ESA versión al motor,
        // que la bloquea por su camino normal. El texto que se muestra sigue siendo el original.
        var riesgoLimpio = Interprete && Interprete.evaluarRiesgo ? Interprete.evaluarRiesgo(l.comparable) : { nivel: null };
        var riesgoTrucos = Interprete && Interprete.evaluarRiesgo ? Interprete.evaluarRiesgo(l.paraRiesgo) : { nivel: null };
        if (riesgoTrucos.nivel === 'alto' && riesgoLimpio.nivel !== 'alto') return { texto: l.paraRiesgo, riesgoPorLimpieza: true };
        // "laptops" a secas (producto con personas como segunda pantalla): se busca a quien lo vende
        if (intencion && intencion.principal === 'productos' && intencion.secundaria === 'personas') return { texto: 'quien vende ' + l.limpio, riesgoPorLimpieza: false };
        return { texto: l.limpio, riesgoPorLimpieza: false };
    }

    function normalizarPersonas(r) {
        var lista = (r.personas || []).map(function (p) {
            p.nombre_completo = ((p.nombres || '') + ' ' + (p.apellidos || '')).trim() || 'Usuario';
            return p;
        });
        return { lista: lista, total: typeof r.total === 'number' ? r.total : lista.length, ficha: r.ficha || null, plan: r.plan || null,
            mensaje: r.mensaje || '', avisos: r.avisos || [], requiere: r.requiere || null, alternativas: r.alternativas || [], motor: r };
    }

    async function procesar(frase, contexto) {
        contexto = contexto || {};
        var r = respuestaBase(frase);
        if (!interruptores.entrada) return enRespaldo(r, 'entrada apagada');
        try {
            // Capa 0: limpieza
            var L = Limp();
            if (interruptores.limpieza) {
                if (!L) return enRespaldo(r, 'falta limpieza-busqueda.js');
                var l = L.limpiar(frase);
            } else {
                var crudo = (typeof frase === 'string') ? frase.trim() : '';
                l = { original: r.texto.original, limpio: crudo, comparable: crudo.toLowerCase(), paraRiesgo: crudo.toLowerCase(), vacio: !crudo };
            }
            r.texto = { original: l.original, limpio: l.limpio, comparable: l.comparable };

            // Capa 1: intención
            var surf = contexto.superficie || 'principal';
            var I = Inten();
            var intencion;
            if (interruptores.intencion) {
                if (!I) return enRespaldo(r, 'falta intencion-busqueda.js');
                intencion = I.decidir(l.original, { superficie: surf, esTerminoProducto: contexto.esTerminoProducto });
            } else {
                intencion = { texto: r.texto, directa: null, principal: surf === 'personas' ? 'personas' : 'ia', secundaria: null, ambigua: false,
                    orden: null, ubicacionPropia: false, pistas: { persona: [], producto: [] }, razon: 'intención apagada' };
            }
            r.intencion = intencion;
            if (l.vacio) { r.accion = 'vacia'; return r; }
            if (intencion.directa) { r.accion = 'directa'; r.directa = intencion.directa; return r; }
            r.accion = intencion.principal || 'ia';

            // Capas 2 y 3: interpretación y búsqueda (solo si hay que buscar personas, como resultado principal o como segunda pantalla)
            var buscaPersonas = intencion.principal === 'personas' || intencion.secundaria === 'personas';
            if (buscaPersonas) {
                var Datos = contexto.Datos || global_('MotorBusquedaPersonasDatos') || dep('', './motor-busqueda-personas-datos.js');
                var Interprete = contexto.Interprete || global_('InterpreteBusquedaPersonas') || dep('', './interprete-busqueda-personas.js');
                if (!Datos || !Interprete) return enRespaldo(r, 'falta el motor de personas');
                var tm = textoParaMotor(l, intencion, Interprete);
                if (tm.riesgoPorLimpieza) intencion.riesgoPorLimpieza = true;
                var opciones = { nivelZona: contexto.nivelZona || null, canal: contexto.canal || 'general', forzar: !!contexto.forzar };
                if (contexto.supabase) opciones.supabase = contexto.supabase;
                if ('yo' in contexto) opciones.yo = contexto.yo;
                var Motor = contexto.Motor || global_('MotorBusquedaPersonas') || dep('', './motor-busqueda-personas.js');
                if (Motor) opciones.Motor = Motor;
                opciones.Interprete = Interprete;
                var res = await Datos.buscar(tm.texto, opciones);
                if (res && res.descartada) { r.accion = 'descartada'; return r; }
                r.personas = normalizarPersonas(res || {});
            }
            return r;
        } catch (e) {
            return enRespaldo(r, (e && e.message) ? e.message : 'error desconocido');
        }
    }

    function buscarPersonas(frase, contexto) {
        var c = {};
        Object.keys(contexto || {}).forEach(function (k) { c[k] = contexto[k]; });
        c.superficie = 'personas';
        return procesar(frase, c);
    }

    return { procesar: procesar, buscarPersonas: buscarPersonas, interruptores: interruptores, VERSION: VERSION };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BusquedaPorCapas;
