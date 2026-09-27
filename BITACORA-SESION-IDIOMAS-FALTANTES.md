> **Estado: IMPLEMENTADO Y PROBADO (en navegador simulado, con Playwright/Chromium). Falta desplegar y confirmar en producción.**

# Bitácora — 4 idiomas caían en inglés por error + condición de carrera en el muro

**Fecha:** 27/09/2026

---

## 1. Cómo se encontró

El usuario reportó, probando a mano: "veo que el inglés se traduce en el muro bien pero otros idiomas no". Al investigar a fondo (no solo leer el código, sino ejecutar `traducirTextoIA` de verdad en un navegador simulado, capturando qué idioma se le pide realmente a la función de traducción) aparecieron **dos bugs distintos**, ambos con el mismo síntoma visible: el muro (artículo informativo para usuarios sin sesión) se ve mal en algunos idiomas.

## 2. Bug #1 (el más importante) — `NOMBRES_IDIOMAS` sin 4 idiomas

**Archivo:** `js/modules/panel-usuario-3.js`, línea 1085.

El mapa que traduce un código de idioma (`ru`, `qu`, etc.) a su nombre en español (necesario para armar el prompt que se le manda a Groq) tenía **13 de los 17 idiomas**. Faltaban: `ru` (ruso), `bg` (búlgaro), `qu` (quechua), `ay` (aimara).

```js
// ANTES (línea 1085):
NOMBRES_IDIOMAS: { 'en': 'inglés', 'pt': 'portugués', 'fr': 'francés', 'de': 'alemán', 'it': 'italiano', 'zh': 'chino', 'ja': 'japonés', 'ko': 'coreano', 'ar': 'árabe', 'hi': 'hindi', 'nl': 'holandés', 'tr': 'turco', 'es': 'español' },
```

`traducirTextoIA` usa `this.NOMBRES_IDIOMAS[idiomaDestinoCode] || 'inglés'`. Para los 4 idiomas que faltaban, el `||` se activaba y **le pedía a Groq que tradujera al inglés**, no al idioma real. Esto no da ningún error -- el texto sale, solo que en el idioma equivocado, lo cual es más engañoso que un error visible.

**Afecta a todo lo que pasa por `traducirTextoIA`:** el artículo del muro (`contenido-info.js`), los productos (`buscador.js` → `TraduccionProductos`), y los documentos legales (`institucional.js`).

**Consecuencia extra, ya señalada como riesgo:** ese texto en inglés se guarda después en Supabase bajo la clave del idioma real (`traducciones['ru']`, por ejemplo). Si alguien ya visitó la página en esos 4 idiomas antes de este arreglo, es probable que haya quedado una traducción en inglés cacheada -- este cambio de código no la corrige sola, ver sección 5.

**Confirmado con prueba real** (se interceptó la llamada de red y se registró qué idioma se pedía de verdad):
```
ANTES:  de→alemán ✓  ru→inglés ✗  ar→árabe ✓  qu→inglés ✗  ay→inglés ✗
AHORA:  de→alemán ✓  ru→ruso ✓   ar→árabe ✓  qu→quechua ✓  ay→aimara ✓
```

### Arreglo aplicado
```js
// AHORA (línea 1085):
NOMBRES_IDIOMAS: { 'en': 'inglés', 'pt': 'portugués', 'fr': 'francés', 'de': 'alemán', 'it': 'italiano', 'zh': 'chino', 'ja': 'japonés', 'ko': 'coreano', 'ar': 'árabe', 'hi': 'hindi', 'nl': 'holandés', 'tr': 'turco', 'es': 'español', 'ru': 'ruso', 'bg': 'búlgaro', 'qu': 'quechua', 'ay': 'aimara' },
```

## 3. Bug #2 — condición de carrera en `mostrarEnMuro`

**Archivo:** `js/modules/contenido-info.js`, función `mostrarEnMuro`.

Si alguien cambia de idioma varias veces seguidas (por ejemplo, prueba varios idiomas rápido para revisar cómo se ven), y un idioma anterior tarda más en responder que uno elegido después, la respuesta lenta puede **llegar tarde y pisar** el muro ya pintado con el idioma más nuevo. No depende de ningún idioma en particular -- depende de cuál tarde más en el momento, así que puede parecer al azar cuál "no funciona".

**Reproducido:** clic en alemán (con una demora simulada) y, 150ms después, clic en francés (rápido). Sin el arreglo, el muro terminaba mostrando alemán en vez de francés -- el idioma que el usuario realmente había elegido al final.

### Arreglo aplicado
Se agregó un número de turno (mismo patrón que ya usa `TraduccionProductos` en `buscador.js` para sus tandas): cada llamada a `mostrarEnMuro` incrementa un contador; si al terminar de traducir el contador ya avanzó (porque se pidió otro idioma mientras tanto), esa respuesta se descarta en vez de pintarse.

```js
mostrarEnMuro: async function(idioma) {
    ...
    this._turnoMuro = (this._turnoMuro || 0) + 1;
    var miTurno = this._turnoMuro;

    var articulos = await this.cargarArticulos();
    var traducidos = await Promise.all(articulos.map(function(a) { return ContenidoInfo.traducirSiHaceFalta(a, idioma); }));
    if (miTurno !== this._turnoMuro) return; // llegó tarde -- ya se pidió otro idioma mientras tanto

    contenedor.innerHTML = ...
}
```

## 4. Validación hecha

- `node --check` en los 2 archivos tocados -- sin errores de sintaxis.
- Prueba con Playwright/Chromium, navegador real, red interceptada y simulada:
  - Se confirmó que `de/ru/ar/qu/ay` ahora piden el idioma correcto a la función de traducción (antes, `ru/qu/ay` pedían inglés).
  - Se confirmó que un cambio rápido de idioma (alemán lento → francés rápido) ya no deja el muro pisado con el idioma anterior.

## 5. Lo que este arreglo NO resuelve (pendiente aparte)

- **Traducciones ya guardadas mal en Supabase:** si `ru`/`bg`/`qu`/`ay` ya se visitaron antes de este arreglo, es probable que `contenido_administrable.traducciones` y/o `productos.traducciones` tengan texto en inglés guardado bajo esas 4 claves. Este cambio de código no las corrige solas -- la próxima vez que se pida ese idioma, el sistema va a encontrar "ya hay traducción guardada" y mostrar el inglés viejo sin volver a intentar. **Falta:** revisar con una consulta SQL si existen esas entradas y, si existen, borrarlas para que se regeneren bien la próxima vez que alguien las pida.
- **Detector de idioma por escritura** ("casa o departamento en alquiler" detecta portugués por error) -- sin tocar.
- **"Cambiar" como disparador de cambio de idioma** en medio de una frase de trueque -- sin tocar.
- **`<html lang>` y RTL para árabe** -- sin tocar.
- **"¿Otro idioma? Traduce aquí"** fijo en español -- sin tocar.
- **Nombres de idioma con "(Chino)", "(Japonés)", etc.** fijos en español en `index.html` -- sin tocar.
- **Feed de usuarios logueados** (`panel-usuario-1.js`) sin traducción -- sin tocar.
- Bug de "Tool call validation failed" en búsqueda de internet/YouTube -- vive en `chat-ia`, fuera de este repositorio.

## 6. Próximo paso

1. Subir `js/modules/panel-usuario-3.js` y `js/modules/contenido-info.js` a GitHub (los únicos 2 archivos que cambiaron) y esperar el deploy de Vercel.
2. Probar en producción: cambiar a ruso, búlgaro, quechua y aimara, y confirmar que el muro sale en el idioma correcto (no en inglés).
3. Si sigue saliendo en inglés para alguno de esos 4 idiomas, es la sección 5 (caché vieja en Supabase) -- revisar con SQL antes de sospechar del código.
4. Después, decidir cuál de los pendientes de la sección 5 se ataca a continuación.
