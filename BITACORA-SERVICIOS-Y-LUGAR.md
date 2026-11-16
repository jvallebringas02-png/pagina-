> **Estado (14/11/2026): LISTO Y PROBADO EN NODE; FALTA PROBARLO EN LA PÁGINA DE PRUEBA.**

# Bitácora — "Personas que vendan servicios / donen en mi ciudad o país"

**Continúa:** `BITACORA-NOMBRES-SUELTOS-Y-ENCENDIDO.md`
**Archivo cambiado:** `js/modules/interprete-busqueda-personas.js` (3 arreglos). Archivo nuevo: `pruebas/servicios-y-lugar.test.js` (37 pruebas).

## 1. Qué se corrigió

| Problema | Antes | Ahora |
|---|---|---|
| "que **vendan servicios**" se leía como "venta **o** servicio" y traía también a quien vende una laptop | `hace: [vende, servicios]` | `hace: [servicios]` |
| "ofrezca servicios **en** mi localidad" mostraba el criterio sobrante **"Ofrece: en"** | `oferta: "en"` | `oferta: null` |

Se mantienen como estaban: `vende o da servicios` (venta o servicio), `vendan servicios o productos`, `venda servicios y ropa` (sigue buscando venta), `vendan y donen`, `da clases de inglés`, `quien vende laptops`.

### Arreglo 3 (16/11/2026) — captura de la página de prueba
El usuario escribió en Buscar Personas **"buscame usuario de mi localidad o cuidad"** y la página respondió *"No encontré a nadie con Nombre: o cuidad"*: entendió la zona, pero tomó "o cuidad" como un nombre.

| Problema | Antes | Ahora |
|---|---|---|
| "mi localidad **o ciudad**" (o "o país", "y país") | el segundo lugar quedaba como **nombre** | se reconoce como zona; si hay dos, gana la **más amplia** (ciudad < región < país) |
| "cuidad", "siudad", "ciudá", "localida" mal escritas | no se reconocían como zona | se reconocen |

Esa frase ahora trae a los usuarios de la ciudad del que busca. Solo actúa si ya se detectó una zona, así que `Juan o ciudad` no se toca.

## 2. Qué entiende la página (datos de ejemplo, usuario de Callao, Perú)

| Frase | Sale |
|---|---|
| búscame personas que vendan servicios en mi ciudad | Juan y Rosa (Callao). No Tomás (vende laptop), ni Ana (Lima), ni Diego (Chile). |
| personas que donen en mi país | Pedro y Lucía |
| personas que vendan servicios y donen en mi ciudad | Juan, Pedro y Rosa (una cosa **o** la otra) |
| personas que vendan servicios en mi país | Juan, Ana y Rosa |

## 3. Límites que siguen

- El usuario necesita **su localidad definida**; si no, la página le pide definirla.
- Con datos reales, hoy casi no hay servicios ni donaciones (la revisión del 24/10 decía 42 de 42 "venta"): responderá "Todavía no hay servicios publicados".
- "vendan servicios **y** donen" es una cosa **o** la otra, no ambas a la vez.
- `que **dé** servicios` (con tilde, subjuntivo de "dar") no se reconoce; `den`/`da`/`dan` sí.

## 4. Pruebas
10 suites anteriores en verde (53, 191, 44, 37, 187, 95, 17, 40, 50 y la simulación 36) + **37 nuevas**.

## 5. Subir
`js/modules/interprete-busqueda-personas.js` (reemplaza) y `pruebas/servicios-y-lugar.test.js` (nuevo), primero a la página de prueba. Volver atrás: restaurar el `interprete-busqueda-personas.js` anterior.
