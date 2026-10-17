> **Estado: NOTAS Y PLAN. Solo el punto 1.5 (matriz "a nivel mundial / nacional" en el panel) tiene código preparado, sin probar en el navegador; lo demás sigue sin cambios de código. Se escribió el 17/10/2026 para no perder lo que hay que corregir. Todo lo marcado "no verificado" hay que comprobarlo en el navegador antes de darlo por cierto. Marcar cada punto cuando se haga.**

# Bitácora — Pendientes y correcciones del panel de usuario

**Fecha:** 17/10/2026
**Base revisada:** `pagina--main_1.zip` (el más reciente que subiste; trae la paginación del muro del 16/10)
**Método:** lectura del código y de tus capturas. No se abrió la página publicada ni se probó en el navegador.
**Regla para el próximo cambio:** antes de editar, pedir el zip actual. Varios archivos del panel cambiaron entre entregas y no se debe pisar una versión más nueva con una vieja.

---

## 1. Lo que reportaste y está por corregir

### 1.1 La imagen del muro sale muy grande y no se ve cuadrada
- **Dónde:** `css/estilos.css`, línea 233 (`.feed-post-image`) y línea 221 (las fotos del carrusel de varias imágenes).
- **Qué pasa:** la foto ocupa todo el ancho de la tarjeta (unos 555 px) y su altura sale sola según la foto, con un máximo de 420 px. Cada publicación queda con un tamaño distinto y ninguna cuadrada.
- **Opciones:**
  1. Cuadrado completo (1:1) a todo el ancho: queda igual en todas, pero sigue siendo grande y recorta bordes.
  2. Cuadrado más pequeño y centrado (unos 380 px), recortando los bordes. **Recomendada.**
  3. Formato 4:5 o 4:3: más bajo, pero no cuadrado de verdad.
- **Decisión pendiente:** cuál opción, y si las fotos que no son cuadradas se recortan o se muestran completas con fondo gris.
- El carrusel debe usar el mismo cuadrado para que no cambie de tamaño al pasar de una foto a otra.

### 1.2 Al entrar al panel dice "Cargando" durante segundos
- **Dónde:** `sesion-auth.js` (línea 152) y `panel-usuario-1.js` (`cargarFeed`, `renderItemsFeed`).
- **Qué pasa (leído en el código; los tiempos reales no se midieron):**
  - Al arrancar la sesión, la página lee tu perfil y **espera** a guardar un registro `login_exitoso` antes de mostrar el panel (`await logAccess`, línea 152).
  - Después el muro hace sus pedidos uno tras otro: `feed_muro`, luego los productos completos, luego tus "me gusta", y luego **un pedido por cada autor distinto**, esperando cada uno (`renderItemsFeed`, línea 276, dentro de un `for` con `await`).
  - Al terminar manda **10 actualizaciones de vistas**, una por producto (`registrarVistas`, líneas 299 a 304).
- **No verificado:** cuál de esos pedidos tarda más, y en qué región está el proyecto de Supabase (Project Settings → Infrastructure). Se mide con F12 → pestaña Red → Fetch/XHR.

### 1.3 El muro "parpadea" en otros momentos
- **Dónde:** `main.js`, líneas 83 a 87 (`onAuthStateChange`) y `panel-usuario-1.js`, línea 380 (`cargarFeed`).
- **Qué pasa (causa probable, no comprobada):** `supabase-js 2.45.4` vuelve a emitir `SIGNED_IN` al regresar a la pestaña. `main.js` vuelve a ejecutar todo el arranque de sesión sin comprobar si la persona ya estaba dentro. Eso reabre el panel, `cargarFeed` **borra el muro y pone "Cargando publicaciones…"**, y vuelve a pintarlo. Además puede repetir el saludo del asistente y guardar otro `login_exitoso` falso.
- **Cómo confirmarlo:** abre el panel, cambia a otra pestaña unos 10 segundos y vuelve. Si el muro parpadea o el asistente vuelve a decir "¡Bienvenido…!", queda confirmado. En F12 → Red se vería un nuevo pedido a `usuarios` y otro a `logs_acceso`.

### 1.4 El botón Reportar está muy escondido
- **Dónde:** `panel-usuario-1.js`, línea 164; el cuadro es `abrirModalReportar` en `panel-usuario-2.js`, y guarda en la tabla `reportes`.
- **Qué hay hoy (confirmado con tu captura del 17/10):** "🚩 Reportar publicación" está en el menú ⋯ de la publicación, y **solo aparece en publicaciones de otras personas** (no en las tuyas).
- **Qué falta:** un botón visible en la fila de abajo (Me gusta, Comentar, Compartir, Guardar).
- **Decisión pendiente:** (a) solo mostrar el botón abajo, o (b) además darle constancia con código como el Libro de Reclamaciones, lo que depende de confirmar antes la Fase 1 en Supabase.

### 1.5 En el panel, "a nivel mundial" / "a nivel nacional" muestra YouTube e internet
- **Qué se vio (capturas del 17/10):** "muéstrame qué hay en mi zona" funciona; "muéstrame producto a nivel nacional" hace que el asistente diga "Aquí tienes los productos disponibles a nivel nacional" pero el muro muestra resultados de internet y "Videos de YouTube".
- **Dónde:** `panel-usuario-3.js`, `procesarAccionEnFeed` (línea 1793) frente a `event-controller.js`, líneas 19 a 40.
- **Causa (leída en el código):** la página principal revisa primero la señal `nivel_matriz` ("mundial" o "pais") que manda la IA y arma la matriz de categorías por país. El panel **no tiene esa rama** y tampoco un dibujo de esa matriz dentro del muro (solo existe el de "qué hay en mi zona": `renderMatrizLocalidadEnFeed`). Entonces ejecuta una búsqueda normal de la palabra "producto"; como el catálogo no tiene nada así, la búsqueda híbrida muestra de respaldo internet y YouTube.
- **No verificado:** qué devolvió exactamente la IA. Se mira en F12 → Red → pedido `chat-ia` → Respuesta: ¿trae `"nivel_matriz"`? Si para "nivel nacional" no lo trae, también hay que ajustar las instrucciones de la función del servidor (`index.ts`), que no viene en el zip actual.
- **Arreglo (código preparado el 17/10/2026, solo `panel-usuario-3.js`, sin probar en el navegador):** (1) en el panel, si la IA marca `nivel_matriz`, dibujar la matriz dentro del muro, con los mismos textos traducidos y la misma columna de países que ya se arregló; (2) que pulsar una celda busque esa categoría y país dentro del panel; (3) "Volver" dentro del panel.
  - Si la IA marca `nivel_matriz`, o la frase dice "a nivel mundial / nacional / en todo el mundo / por país" y la IA no pidió otra cosa (video, música, internet, publicar…), el panel dibuja la matriz **dentro del muro**. "Mundial" o "nacional" sueltos (el Mundial de fútbol, producto nacional) no activan nada.
  - Sin país conocido (la detección por IP dejó "Mundo"), "a nivel nacional" muestra la matriz mundial.
  - Pulsar un número de un país abre la matriz de sus ciudades; pulsar un número de una ciudad busca esa categoría ahí. "Volver" y "Volver al inicio" dentro del panel. Los clics usan `data-pu-accion` (sin datos dentro de `onclick`).
  - Si la categoría que dice la persona no tiene publicaciones, se muestran todas las categorías en vez de una tabla vacía. La página principal hoy muestra la tabla vacía en ese caso; no se cambió.
  - Prueba simulada: 28 comprobaciones sin fallos. Falta probar en la página (ver pruebas abajo).
- **Relacionado:** `BITACORA-ASISTENTE-PANEL.md` (decisión pendiente sobre dónde mostrar la matriz en el panel).
- **Aparte, por diseño:** cuando una búsqueda normal no encuentra nada en el catálogo, la búsqueda híbrida muestra internet y YouTube. No es un fallo, pero se puede cambiar para preguntar antes. Decisión pendiente.

---

## 2. Plan en tandas

### Tanda 1 — pequeña, se nota enseguida
- [ ] Imagen cuadrada del muro (1.1) — `estilos.css`.
- [ ] Ignorar el `SIGNED_IN` repetido cuando la misma persona ya está cargada (1.3) — `main.js`.
- [ ] No esperar el registro de acceso antes de mostrar el panel (1.2) — `sesion-auth.js`.
- [ ] Opcional: que `mostrar()` no recargue el muro si el panel ya estaba abierto y tiene publicaciones.

### Tanda 2 — velocidad del muro, solo `panel-usuario-1.js`
- [ ] Traer todos los autores de una vez (`.in('id', ids)`) en vez de uno por publicación.
- [ ] Pedir en paralelo lo que no depende de lo demás (productos, "me gusta", autores).
- [ ] No borrar el muro mientras recarga: dejar lo que ya se ve y reemplazarlo cuando llegue lo nuevo.
- Probar con calma: cambiar de página del muro, dar "me gusta", ver autores y compartidos.

### Tanda 3 — opcional, toca Supabase (SQL lo ejecutas tú)
- [ ] Que `feed_muro` devuelva también el nombre y la foto del autor junto a cada publicación.
- [ ] Sumar las vistas con una sola llamada (o al ver la tarjeta) en vez de 10 `update` por página.
- Solo si después de la tanda 2 el muro sigue lento.

### Aparte
- [ ] Botón Reportar visible abajo (1.4).

---

## 3. Otros pendientes que vienen de antes

| Tema | Estado | Dónde está el detalle |
|---|---|---|
| Buscar personas: "búscame nuevo usuario" no responde. Falta el criterio "nuevo", la zona y la categoría, y el respaldo cuando no hay resultados | Sin código | `BITACORA-BUSQUEDA-PERSONAS.md` y lo hablado el 08/10 |
| Asistente y buscador del panel con el mismo camino que la página principal (`enviarMensajeEstructurado`), con los filtros de orden, ubicación y modalidad y el aviso de error | Plan sin código; no verificado si la entrega del 16/10 ya tocó parte | `BITACORA-ASISTENTE-PANEL.md` |
| Libro de Reclamaciones y "conversar con el administrador" dentro del panel | El 16/10 hiciste una entrega de formularios en ventana; no verificado | `BITACORA-PANEL-IGUAL-QUE-PAGINA-PRINCIPAL.md` |
| Seguimiento de reclamos y de lo conversado con el administrador | Propuesto, sin código. Depende de confirmar la Fase 1 y de tener `es_admin` | `BITACORA-SEGUIMIENTO-RECLAMOS.md`, `BITACORA-FASE1-CONSTANCIA.md` |
| Matriz mundial / por país dentro del panel | Confirmado con captura del 17/10: el panel la ignora (ver 1.5). Falta construirla dentro del muro | `BITACORA-ASISTENTE-PANEL.md` |
| Seguridad del código: botones de las tarjetas con datos dentro de `onclick`, usuario completo en `sessionStorage`, chat de IA sin límite de uso | Hay bitácoras `XSS-TARJETAS` y `XSS-PANELES`; no verificado cuánto se aplicó | Análisis del 05/10 y esas bitácoras |
| SQL de países ("Peru" → "Perú" en `productos` y `usuarios`) | Opcional; la matriz ya agrupa bien aunque haya datos sucios | `BITACORA-TRADUCCION-SEGURIDAD-Y-MATRIZ.md`, sección 11 |
| Pruebas de traducción: Seguridad en francés y árabe, matriz en inglés; revisión de las traducciones por hablantes; decidir `seg_h3` | Pendiente | `BITACORA-TRADUCCION-SEGURIDAD-Y-MATRIZ.md` |

## 4. Ya confirmado

- Paginación del muro con números (SQL `feed_muro` y `panel-usuario-1.js`): salió bien el 16/10.
- Matriz mundial con una sola columna "Perú" (confirmado por ti).
- El menú ⋯ con "Reportar publicación" funciona en publicaciones de otras personas (captura del 17/10).

## 5. Decisiones que me faltan de ti

- [ ] Imagen: ¿opción 1, 2 o 3? ¿Se recorta o se muestra completa?
- [ ] Reportar: ¿solo botón visible (a) o con constancia (b)?
- [ ] ¿Empiezo por la tanda 1?
- [ ] ¿Ejecutas el SQL de países?

## 6. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 17/10/2026 | Se anotaron los pendientes del panel y el plan en tandas | Solo documento. Sin código ni pruebas |

## 7. Pruebas pendientes del punto 1.5 (en el panel, con sesión iniciada)

- [ ] Escribir "muéstrame producto a nivel nacional": debe salir una tabla de categorías por ciudad de tu país, no YouTube.
- [ ] Escribir "a nivel mundial": tabla de categorías por país, con una sola columna "Perú".
- [ ] Pulsar un número de un país: abre sus ciudades, con "Volver". Pulsar un número de una ciudad: muestra esas publicaciones, con "Volver".
- [ ] Cambiar a inglés y repetirlo: títulos y países traducidos, con el español pequeño o al pasar el cursor.
- [ ] "videos de cocina a nivel mundial": debe seguir mostrando videos (no la matriz).
- [ ] "muéstrame qué hay en mi zona": debe seguir funcionando como antes.
- [ ] Lo mismo escrito en el chat del Asistente (no solo en el buscador de arriba).
- [ ] En la página principal sin sesión: "a nivel mundial" sigue igual.

**Registro (17/10/2026):** código de la matriz "a nivel mundial / nacional" dentro del panel (`panel-usuario-3.js`). `node --check` y 28 comprobaciones simuladas sin fallos. Sin probar en el navegador.
