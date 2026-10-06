> **Estado: arreglos preparados y probados en parte en un navegador (Chromium). Falta subirlos a GitHub, desplegar en Vercel y hacer las pruebas manuales de la sección 6.**

# Bitácora — Fallo XSS en el panel de usuario, patrocinadores y mensajes de error

**Fecha:** 05/10/2026
**Continúa:** `BITACORA-XSS-TARJETAS.md` (sección 4, "Pendientes")
**Archivos cambiados** (todos en `js/modules/`):
`panel-usuario-2.js`, `panel-usuario-3.js`, `institucional.js`, `event-controller.js`

---

## 1. Qué se encontró

El mismo patrón de `ui-controller.js`: texto pegado dentro de un `onclick="...('TEXTO')"`. Lo que cambia es **quién controla el texto**.

**Hallazgo nuevo sobre los nombres.** `PanelUsuario.escHtml` sí escapa la comilla simple (`&#39;`), pero justo después el código hacía `.replace(/'/g, "\\'")`, que ya no hacía nada (no quedaba ninguna `'` que reemplazar). Como el navegador convierte `&#39;` otra vez en `'` **antes** de ejecutar el JavaScript del `onclick`, un nombre con comilla rompía el texto y lo que viniera después se ejecutaba como código. Y los nombres y apellidos los elige cada persona para sí misma.

**Efecto que ya se veía sin mala intención.** Un nombre con apóstrofe normal (D'Angelo, O'Brien, d'Arc) dejaba sin funcionar el botón de esa persona en el selector de Compartir y de Nuevo mensaje. La prueba lo confirmó: en el código original, una categoría llamada `Ropa d'Arc` no respondía al clic.

| Sitio (línea en el zip del 05/10) | Texto que entraba al `onclick` | Quién lo controla |
|---|---|---|
| `panel-usuario-3.js:890` (cabecera del chat, 🚩 Reportar usuario) | nombre del otro usuario | **otro usuario** |
| `panel-usuario-2.js:462` y `476`; `panel-usuario-3.js:1369`, `1412`, `1472` (selectores de persona) | nombre y apellidos | **cada usuario, para sí mismo** |
| `panel-usuario-3.js:1889` (categorías en el feed) | nombre de categoría | datos de la base |
| `panel-usuario-3.js:1907` (videos y webs en el feed) | enlace | resultados de búsqueda externa |
| `institucional.js:79` (botón "Visitar" de patrocinadores) | enlace | quien configura el patrocinio |
| `event-controller.js:236` y `251` | `e.message` pegado a HTML sin escapar | el error que devuelva la búsqueda |

---

## 2. Los cambios

**`panel-usuario-2.js` y `panel-usuario-3.js`**
- Los textos (nombre, id, contexto, categoría, enlace) viajan en atributos `data-*` ya escapados, en vez de ir dentro del `onclick`.
- Un solo listener nuevo al final de `panel-usuario-3.js` atiende esos clics y lee los datos con `dataset` (siempre texto puro). Usa el atributo `data-pu-accion`, distinto del `data-ui-accion` de `ui-controller.js`, para que no se pisen.
- Acciones: `picker` (elegir persona), `reportar-usuario`, `busqueda-ia` (categoría) y `abrirlink`.
- `abrirlink` solo abre enlaces que empiezan con `http://` o `https://`, y con `noopener`.
- Se borraron las 5 líneas `var nombreEscapado = ...replace(...)`, que ya no se usan.
- La cantidad de la categoría ahora pasa por `escHtml`.

**`institucional.js`**
- El botón "Visitar" usa `data-ui-accion="abrirlink"`, que atiende el listener ya creado en `ui-controller.js`. **Hay que subir los dos archivos** (el de la bitácora anterior y este).

**`event-controller.js`**
- `e.message` ahora pasa por `escHtml` en los dos mensajes "Ocurrió un error al buscar".

Líneas cambiadas (quitadas + agregadas): `panel-usuario-2.js` 6, `panel-usuario-3.js` 41, `institucional.js` 2, `event-controller.js` 4. No se tocó ningún otro archivo.

---

## 3. Pruebas hechas (Playwright / Chromium)

Se cargaron `panel-usuario-1/2/3.js` originales y corregidos en el mismo entorno, con datos maliciosos y con datos normales.

| Prueba | Original | Corregido |
|---|---|---|
| Categorías del feed con comilla en el nombre | **ejecuta código** | no ejecuta; la búsqueda recibe el nombre exacto |
| Categoría normal `Ropa d'Arc` | el botón no respondía | funciona; la búsqueda recibe `Ropa d'Arc` |
| Videos/webs del feed: enlace con comilla | **ejecuta código** | no ejecuta |
| Videos/webs: enlace `javascript:` | llegaba a `window.open` | no llega |
| Videos/webs: enlace `https://...` válido | abre | abre, con `noopener` |
| Selector de personas (`_renderResultadosPersonaPicker`) con nombre malicioso | **ejecuta código** y recibe el nombre cortado (`Ana`) | no ejecuta; recibe id y nombre completos y exactos |
| Botón 🚩 Reportar usuario (elemento simulado con el mismo atributo) | no aplica | recibe el nombre exacto, con comillas y `<b>` |

- `node --check`: sin errores en los 4 archivos.
- Revisión puntual: los mensajes del chat, los comentarios y las reglas del asistente ya pasaban por `escHtml`.

**Lo que NO se probó de forma directa:** cinco sitios están dentro de funciones que dependen de Supabase y del chat real: la cabecera del chat (línea 890), los dos selectores de `panel-usuario-2.js` y los de `_aplicarFiltrosCompartir` y `buscarPersonaPicker`. Tienen el mismo cambio que los probados y pasan la revisión de sintaxis, pero hay que probarlos a mano (sección 6). Tampoco se probaron `institucional.js` ni `event-controller.js`; son cambios de una sola línea cada uno.

---

## 4. Lo que NO se cambió, a propósito

- **Botones que solo llevan un id** (`toggleLike('ID')`, `abrirConversacion('ID', ...)`, etc.): unos 50 en `panel-usuario-1.js`, `panel-usuario-3.js` y `paginador.js`. Ese id lo genera Supabase (UUID), no lo elige el usuario, así que el riesgo es bajo. Si algún día un id pudiera escribirlo una persona, habría que pasarlo también a `data-*`.
- **Enlace de respaldo `'#'` de los patrocinadores:** antes abría una pestaña en blanco; ahora no hace nada, porque no empieza con `http`. Si tus patrocinadores reales guardan el enlace sin `https://`, tampoco abrirán. Hay que guardarlos con `https://`.

---

## 5. Pendientes

- [ ] Auditar el resto de los unos 160 `innerHTML` (las revisiones puntuales salieron bien, pero no son una auditoría completa).
- [ ] Rotar las claves de `api_keys_config` y revisar que `chat-ia` y `traducir-texto` exijan sesión y tengan límite de uso (ver `BITACORA-SEGURIDAD`).
- [ ] Pasar la consulta de la sección 6 de `BITACORA-XSS-TARJETAS.md` en Supabase, y revisar también nombres y apellidos sospechosos en `usuarios`.
- [ ] Mover las bitácoras a un repositorio privado si el actual es público.

---

## 6. Cómo aplicarlo

- [ ] Subir a GitHub, en `js/modules/`: `ui-controller.js` (de la bitácora anterior), `panel-usuario-2.js`, `panel-usuario-3.js`, `institucional.js` y `event-controller.js`.
- [ ] Esperar el despliegue en Vercel y recargar con Ctrl+F5.
- [ ] Probar en la página real:
  - [ ] Compartir una publicación → buscar o elegir una persona (con una cuenta de prueba cuyo nombre tenga apóstrofe, por ejemplo `D'Angelo`) → debe quedar elegida como destinatario.
  - [ ] Mensajes → Nuevo mensaje → elegir persona → se abre la conversación.
  - [ ] Dentro de un chat: botón 🚩 → se abre "Reportar a NOMBRE" con el nombre completo.
  - [ ] Feed: pedir las categorías y pulsar una; pedir videos o resultados web y abrir uno.
  - [ ] Patrocinadores: pulsar "Visitar" (con un patrocinador cuyo enlace empiece con `https://`).
  - [ ] Forzar un error de búsqueda (por ejemplo, sin internet) y ver que el mensaje sale como texto.
- [ ] **Revertir** si algo falla: volver a subir la versión anterior del archivo afectado (queda en el historial de GitHub). No hay cambios en la base de datos.

---

## 7. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 05/10/2026 | 4 archivos corregidos (sección 2) | Probado en Chromium lo que se pudo (sección 3); falta subir y probar en producción |
