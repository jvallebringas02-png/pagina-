> **Estado: PLAN, SIN CAMBIOS DE CÓDIGO. Esta bitácora se escribió antes de tocar nada. Lo que dice "comprobado en el código" sale de leer los archivos del zip del 11/10/2026; nada se probó en el navegador. Todo lo marcado "no verificado" hay que comprobarlo en la página antes de darlo por cierto.**

# Bitácora — Que el panel de usuario se comporte como la página principal

**Fecha:** 11/10/2026
**Continúa:** `BITACORA-ASISTENTE-PANEL.md` (08/10), `BITACORA-REINTENTO-IA.md`, `BITACORA-SEGUIMIENTO-RECLAMOS.md`, `BITACORA-SESION-REVISION-SUPABASE-Y-LIBRO.md`
**Idea de fondo:** el panel no es otra página. Es la misma página para una persona con sesión iniciada. Por eso debe **heredar** de la página principal lo que sirve igual (pie de página, formularios, asistente, buscador, traducción) y **ajustarse** solo en lo propio del usuario registrado.

---

## 1. Lo que se observa (dicho por ti)

1. El pie de página y sus formularios **no se comportan igual** dentro del panel.
2. El buscador y el asistente de IA **no se comportan igual**.
3. Las traducciones **no se comportan igual**.

Los tres puntos coinciden con lo que se ve en el código (sección 2).

## 2. Qué se comprobó en el código

- Al iniciar sesión, la vista pública (`publicView`) se **oculta** y se muestra el panel (`userPanelView`). El pie de página está fuera de las dos vistas, así que se ve en ambas.
- Cinco pantallas se dibujan con `mostrarFormularioEnMuro`, que escribe dentro de la vista pública (la que se oculta): **Contacto, Libro de Reclamaciones, Seguimiento, Opinión y Seguridad**.
- **Quiénes Somos** ya sabe dibujar dentro del panel (`institucional.js`, línea 201). **Términos y Privacidad** usan una ventana emergente general (`Institucional.abrirModal`, creada en el cuerpo de la página), así que probablemente ya funcionan en el panel (no verificado en el navegador).
- En el chat, los atajos de "matriz mundial", "quiero reclamar" y "contactar al administrador" se revisan **antes** de saber si el panel está activo (`event-controller.js`, líneas 167 a 187). Dibujan en la zona oculta.
- El panel ya usa los mismos datos de la IA que la página principal (`enviarMensajeEstructurado`) y trata las mismas 11 acciones. Pero `procesarAccionEnFeed` (62 líneas) no trata `nivel_matriz`, ni `_fallo_tecnico`, ni `_limite`; la página principal (`procesarAccionIA`, 123 líneas) sí.
- Los tres archivos del panel tienen **cero usos de `textoUI`**. Un conteo aproximado encuentra unas 110 frases escritas en español dentro del código (12, 29 y 68 por archivo; es un mínimo, porque no cuenta las que están dentro de HTML).
- El cambio 1A del panel (asistente y buscador) ya está en el código, pero **ninguna de sus casillas de prueba está marcada**.

## 3. Parte 1 — Pie de página y formularios

**Qué pasa hoy en el panel:** pulsas "Libro de Reclamaciones", "Seguimiento", "Contacto", "Opinión" o "Seguridad" y el formulario se abre, pero en la parte oculta, así que no lo ves. Con sesión iniciada, el Libro y el Seguimiento no se pueden usar.

**Qué cambio hay que hacer, en palabras:**
- Ya existe una ventana emergente general (`Institucional.abrirModal`) que se dibuja encima de todo. Los cinco formularios usarán esa ventana **cuando el panel esté activo**. En la página principal sin sesión siguen exactamente igual (en el centro).
- Para saber si el panel está activo se usa la misma comprobación que ya usa Quiénes Somos.
- La constancia, el botón de PDF, el seguimiento y los avisos funcionan igual: se escriben en el mismo lugar del formulario, solo que ahora dentro de la ventana.
- Los atajos del chat ("quiero reclamar", "contactar al administrador") ya llaman a esas mismas funciones; al cambiar las funciones, el panel queda cubierto sin tocar el chat.
- El atajo de matriz mundial se **salta cuando el panel está activo** (mientras el panel no sepa pintar la matriz). Decisión pendiente en la sección 7.
- Quiénes Somos se queda en el feed, como hoy.

**Archivos:** `institucional.js` (las cinco funciones y una pequeña comprobación) y, si se decide lo de la matriz, `event-controller.js`. **No se tocan los `panel-usuario-*.js`.**
**Tamaño:** mediano. **Riesgo:** bajo para la página principal (la rama del panel solo corre con sesión).

**Qué hay que mirar al probar:**
- Que la ventana se vea bien en el celular con el formulario largo y con la constancia.
- Que "Guardar como PDF" funcione desde dentro de la ventana.
- Que al cambiar de idioma con la ventana abierta no se borre lo escrito (hoy la retraducción depende de `UIController.formularioAbierto`, que la ventana no marca; probablemente el formulario no se retraduzca hasta cerrarlo y volver a abrirlo).

## 4. Parte 2 — Buscador y asistente

**Qué pasa hoy:** el panel ya lee la respuesta de la IA igual que la página principal, pero se comporta distinto en cuatro cosas.

| Situación | Página principal | Panel |
|---|---|---|
| La IA falla | Busca igual en el catálogo y muestra resultados | El buscador de arriba muestra solo un error; el chat, solo la burbuja |
| Límite de cuota | Aviso claro y pausa de 60 segundos | No lo trata de forma especial |
| Matriz mundial o por país | Funciona | No existe |
| Textos de "pensando…" y errores | Traducidos | En español fijo |

**Qué cambio hay que hacer, en palabras:**
- Cuando la IA falle, el panel hará lo mismo que la página principal: **buscar lo que la persona escribió en el catálogo y mostrar los resultados en el feed**, con un solo aviso claro (el de límite o el de conexión), no dos.
- El aviso de límite de cuota y la pausa se aplican igual que en la página principal.
- La matriz: por ahora el panel **no la pinta** (como hoy), pero ya no se queda sin respuesta visible (ver la salida del atajo en la sección 3). Pintarla en el feed queda como decisión.
- Los textos fijos de esta parte ("El Asistente IA está pensando…", avisos de error) pasan a `textoUI` y se traducen (Parte 3).
- Confirmar el cambio 1A con las pruebas de la sección 9.

**Archivos:** `panel-usuario-3.js` (buscador del panel y `procesarAccionEnFeed`) y la rama del panel de `event-controller.js`. **Aquí sí se tocan archivos del panel** (que está en revisión): hace falta tu visto bueno.
**Tamaño:** pequeño a mediano.

## 5. Parte 3 — Traducciones

**Qué pasa hoy:** lo que tiene `id` fijo (menú, pie de página) se traduce con `i18n.js`. Lo que el código del panel arma en el momento (avisos, "pensando…", botones del feed, tarjetas, errores) está escrito en español dentro del código. Resultado: eligiendo italiano, el panel mezcla italiano con avisos en español.

**Qué cambio hay que hacer, en palabras:**
1. **Inventario:** primero se arma una lista de todas las frases en español del panel, con archivo y línea.
2. **Por tandas, no de golpe:**
   - Tanda 1: las frases que tocan las partes 1 y 2 (pensando, errores, límite, botones del feed).
   - Tanda 2: el feed y las tarjetas (likes, comentarios, publicar).
   - Tanda 3: perfil, mensajes, favoritos y el resto, pantalla por pantalla.
3. Cada frase pasa a `textoUI`, y las claves se escriben en **15 idiomas**. Quechua y aimara usan español (regla actual).
4. Las traducciones nuevas las redacta Claude: conviene que alguien que hable cada idioma las revise, sobre todo árabe, hindi, búlgaro y turco. El árabe además necesita ajustar la dirección del texto.

**Archivos:** `panel-usuario-1.js`, `panel-usuario-2.js`, `panel-usuario-3.js` e `i18n.js`.
**Tamaño:** grande, pero repetitivo y seguro si se hace por tandas. Cada tanda se prueba por separado.

## 6. Orden recomendado y por qué

| Paso | Qué | Tamaño | Por qué en este orden |
|---|---|---|---|
| 1 | Parte 1: formularios en ventana emergente dentro del panel | Mediano | Hoy una persona con sesión **no puede usar el Libro ni el Seguimiento**; la bitácora de la revisión legal menciona un enlace visible y permanente (hay que confirmarlo con un abogado) |
| 2 | Parte 2: paridad del asistente y buscador | Pequeño o mediano | Necesita confirmar antes el cambio 1A |
| 3 | Parte 3, tanda 1 | Pequeño | Traduce lo que se acaba de tocar |
| 4 | Parte 3, tandas 2 y 3 | Grande | Pantalla por pantalla |
| 5 | Ajustes propios del panel | Después | Ver sección 8 |

## 7. Decisiones pendientes (marcar al decidirlas)

- [ ] ¿Los formularios del panel van en **ventana emergente** (recomendado) o en el feed?
- [ ] ¿Qué hace el atajo de "matriz mundial" en el panel? Propuesta: **saltarlo** y dejar que decida la IA, hasta que haya matriz en el feed.
- [ ] ¿Se pinta la matriz mundial o por país en el feed del panel, o queda para después? Sugerido: después.
- [ ] ¿Se incluye en el panel el respaldo de novedades y categorías cuando no hay resultados? Sugerido: segunda etapa.
- [ ] ¿Se da el visto bueno para tocar `panel-usuario-*.js` en las partes 2 y 3?
- [ ] ¿Alguien revisará las traducciones nuevas (árabe, hindi, búlgaro, turco)?

## 8. Lo que no se hace en este plan (queda para después)

- **Ajustes propios del panel:** que el reclamo quede ligado a la cuenta (hoy un reclamo enviado desde el panel queda anónimo en la base) y que la persona vea sus reclamos.
- Qué hacer con los "reportes" del panel (tabla `reportes`, sin código ni seguimiento).
- Constancia en el idioma de la persona, y el límite por persona en el servidor.
- Nada se cambia en Supabase.

## 9. Pruebas (marcar al hacerlas)

**Parte 1 (en el panel, con sesión):**
- [ ] Pie de página → Libro de Reclamaciones: se abre la ventana y se puede enviar; sale la constancia y "Guardar como PDF" funciona.
- [ ] Lo mismo con Seguimiento, Contacto, Opinión y Seguridad.
- [ ] Cerrar con la ✕ y con un clic fuera de la ventana.
- [ ] Escribir "quiero hacer un reclamo" en el chat del panel: se abre la ventana.
- [ ] En el celular.
- [ ] **Página principal sin sesión:** los cinco formularios siguen abriéndose en el centro, igual que antes.

**Parte 2 (en el panel):**
- [ ] "bicicleta", "bicicleta lo más barato", "solo trueque de celulares", "bicicletas cerca de mí": resultados en el feed y filtros aplicados.
- [ ] "videos de cocina peruana": un solo pedido de red.
- [ ] "buscar a Juan Pérez" y "quiero publicar una bicicleta": siguen funcionando.
- [ ] Apagar la conexión y buscar desde el buscador de arriba y desde el chat: un solo aviso claro y resultados del catálogo si los hay.
- [ ] Con el asistente sin cupo: aviso de límite, sin pedir "intenta de nuevo".

**Parte 3:**
- [ ] Cambiar a italiano y repetir 2 o 3 búsquedas y los avisos: todo en italiano.

## 10. Cómo volver atrás

Subir de nuevo los archivos anteriores del repositorio. Cada parte se entrega por separado, así que se puede revertir una sin tocar las otras.

## 11. Límites de este plan

- Todo sale de leer el código; no se abrió la página ni se probó en el navegador.
- Se supone que `Institucional.abrirModal` se dibuja encima del panel igual que de la página principal: hay que verificarlo.
- El conteo de frases fijas del panel es un mínimo.
- Qué devuelve el servidor en cada fallo no se pudo ver desde aquí.

## 12. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 11/10/2026 | Comparación del pie, formularios, asistente, buscador y traducción entre la página principal y el panel | Diagnóstico y plan; sin cambios de código |
