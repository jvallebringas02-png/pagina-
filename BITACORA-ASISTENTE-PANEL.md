> **Estado: PLAN, SIN CAMBIOS DE CÓDIGO TODAVÍA. Esta bitácora se escribió antes de tocar nada. Todo lo marcado "no verificado" hay que comprobarlo en el navegador antes de darlo por cierto.**

# Bitácora — El panel de usuario hereda de la página principal (asistente, buscador, pie de página, traducción)

**Fecha:** 08/10/2026
**Qué se revisó:** `pagina--main.zip` (el proyecto completo del 07/10/2026)
**Método:** lectura del código de `event-controller.js`, `ai-service.js`, `panel-usuario-1.js`, `panel-usuario-3.js`, `institucional.js`, `ui-controller.js`, `i18n.js`, `index.html` y `estilos.css`. No se abrió la página publicada ni se probó en el navegador.

---

## 1. La idea (decidida)

El panel de usuario **no es una copia** de la página principal. Es la misma página para una persona con sesión iniciada, así que:

- **Hereda** de la página principal la lógica: cómo se interpreta la respuesta de la IA, filtros, videos del servidor, detección de errores, pie de página y traducción.
- **Se ajusta** solo en lo propio del usuario registrado: tarjetas completas con likes y comentarios, dibujar dentro de su feed, usar la ciudad de su perfil, publicar directo, buscar personas registradas.

Esto se hace por pasos. Este es el **paso 1**. Después vendrán otros cambios (sección 8).

## 2. Qué comparten hoy

- El mismo asistente (`AIService` → función Edge `chat-ia`).
- El mismo motor de búsqueda (`BuscadorMotor.ejecutarBusquedaHibrida`): sinónimos, ciudad, presupuesto y orden por relevancia.
- Casi las mismas acciones: `BUSCAR`, `CATEGORIA`, `LISTAR_CATEGORIAS`, `RECIENTES`, `VIDEO`, `MUSICA`, `INTERNET`, `PUBLICAR`, `BUSCAR_PERSONA`, `QUIENES_SOMOS`, `EXPLORAR_LOCALIDAD`.
- La traducción de textos fijos (`i18n.js` es global): ya cubre el menú del panel (`menuTextInicio`, `panelTextAlcance`...) y el pie de página (`footerDesc`...).

## 3. Qué hace distinto el asistente del panel

La causa de fondo es una sola. La página principal llama a `AIService.enviarMensajeEstructurado()`, que devuelve el objeto `datos` ya separado. El panel llama a `AIService.enviarMensaje()`, la forma antigua: convierte todo a un texto `[ACCION: ... | PRODUCTO: ...]` y después lo vuelve a leer con expresiones regulares. Los únicos dos usos de `enviarMensaje(` en todo el proyecto son los del panel (`panel-usuario-3.js:1722` y `event-controller.js:190`).

| # | Diferencia | Dónde | Efecto |
|---|---|---|---|
| 1 | El panel **ignora** `orden`, `ubicacion` y `modalidad` | `procesarAccionEnFeed` (BUSCAR y CATEGORIA no pasan `opciones`) | "Lo más barato cerca de mí" o "solo trueque" se buscan sin esos filtros |
| 2 | El panel **no usa** `nivel_matriz` (mundial / por país) | `procesarAccionEnFeed` | La vista de matriz decidida por la IA no existe en el panel (no es una regresión: hoy tampoco funciona) |
| 3 | El panel **repite** las búsquedas de videos, música e internet | `procesarAccionEnFeed` llama siempre a `buscarSoloVideo`, `buscarSoloMusica` y `buscarSoloWeb` | El servidor ya manda `resultados_videos` y `resultados_web`; la página principal los usa, el panel los descarta. Más lento y más cuota gastada |
| 4 | **Detección de error rota** | `panel-usuario-3.js:1723` | Compara con `'Error al conectar con la IA.'` y `'Error de conexión.'`, textos que ya no existen en ningún archivo. Si la IA falla, el aviso nunca sale: se muestra "No pude conectarme bien..." como si fuera una respuesta normal y se recarga el feed |
| 5 | **Sin respaldo** cuando no hay resultados | `procesarAccionEnFeed` | La página principal tiene búsqueda silenciosa de respaldo y vistas guía. El panel no |
| 6 | **Lectura frágil** | expresiones como `/PRODUCTO:\s*([^\|\]]+)/` | Si el producto contiene `\|` o `]`, se corta mal |

## 4. El problema de la "zona oculta" (verificado en el código, falta el navegador)

La página tiene dos pantallas. `#searchResultsContainer` (index.html línea 129) está **dentro de** `#publicView`. Al abrir el panel, `PanelUsuario.mostrar()` le pone la clase `hidden` a `#publicView`, y el CSS dice `.public-view.hidden { display: none !important; }` (estilos.css línea 195).

Consecuencia: todo lo que `UIController` dibuje en `searchResultsContainer` **no se ve mientras estás en el panel**.

### 4.1 Atajo `detectarIntencionMatriz` (asistente)

En `event-controller.js`, el chat (`manejarEnvioMensaje`) y el buscador (`manejarBusquedaPrincipal`) revisan `BuscadorMotor.detectarIntencionMatriz(...)` **antes** de preguntar si el panel está activo. Ese atajo tiene dos ramas y las dos dibujan con `UIController`:

- `tipo === 'matriz'` → `UIController.mostrarMatrizNiveles`.
- si no → `ejecutarBusquedaHibrida(categoria + ' ' + lugar)` y luego `UIController.mostrarResultadosBusqueda`.

Entonces, en el panel, una frase como "a nivel mundial", "por país" o "bicicletas en Lima" puede disparar el atajo y dejar solo el texto del chat, sin resultado visible. **No verificado en el navegador.** Hay que revisar también con qué frases calza `detectarIntencionMatriz`, para saber qué tan frecuente es.

> **Corrección a la explicación dada antes en el chat:** se dijo que "la vista de matriz no existe en el panel". Lo preciso: la ruta por la IA (`nivel_matriz`) no existe en el panel, y la ruta por frase (`detectarIntencionMatriz`) sí corre, pero dibuja en una zona oculta.

### 4.2 Enlaces del pie de página

El pie de página (`<footer>`, index.html línea 218) está fuera de `#publicView` y fuera de `#userPanelView`, y no encontré ninguna regla en CSS ni JS que lo oculte. Se vería en ambos. **No verificado en el navegador.**

Pero sus enlaces llaman a `Institucional`, y solo uno distingue si el panel está activo:

| Enlace del pie | Función | ¿Distingue el panel? | Dónde dibuja |
|---|---|---|---|
| Quiénes Somos | `mostrarQuienesSomos` | **Sí** (`institucional.js:201`) | Feed del panel (`userFeedContainer`) |
| Danos tu opinión | `mostrarOpinion` | No | `UIController.mostrarFormularioEnMuro` → `searchResultsContainer` (zona oculta; verificado) |
| Comunícate con el Administrador | `iniciarContactoGuiado` → `mostrarContactoAdmin` | No | Probablemente igual (no verificado qué usa por dentro) |
| Libro de Reclamaciones | `iniciarReclamoGuiado` → `mostrarLibroReclamaciones` | No | Probablemente igual (no verificado) |
| Términos y condiciones / Privacidad | `mostrarDocumentoLegal` | No | Escribe en un contenedor `c` (no verificado cuál) |

También afecta al chat: "quiero hacer un reclamo" llama a `iniciarReclamoGuiado` **antes** de revisar si el panel está activo (`event-controller.js`, `manejarEnvioMensaje`).

Si se confirma, un usuario con sesión que pulse "Libro de Reclamaciones" en el panel vería el mensaje del asistente pero no el formulario. Esto importa porque el Libro de Reclamaciones es un requisito formal (ver `libro-reclamaciones`).

### 4.3 Traducción

- Textos fijos del panel y del pie: ya cubiertos por `i18n.js` (verificado en el código; falta ver el resultado en pantalla).
- No verificado: que lo que el panel dibuje de nuevo en el feed (resultados, avisos, "Volver al inicio") respete el idioma elegido. Los textos del panel que se arman en JS están escritos en español dentro del código.

## 5. Plan del paso 1

Se divide en dos partes para poder probar cada una por separado.

### Paso 1A — Asistente y buscador del panel

**`panel-usuario-3.js`**
1. `ejecutarBusquedaConIA`: reemplazar `AIService.enviarMensaje(query)` por `AIService.enviarMensajeEstructurado(query)`.
2. Error: usar `datos._fallo_tecnico` en lugar de comparar con textos que ya no existen.
3. `procesarAccionEnFeed`: que reciba el objeto `datos` (y el `query`) en vez del texto con `[ACCION: ...]`.
   - `BUSCAR` y `CATEGORIA`: pasar `opciones = { orden, ubicacionPropia, modalidad }`, igual que `event-controller.js`.
   - `VIDEO`, `MUSICA` e `INTERNET`: usar `datos.resultados_videos` / `datos.resultados_web` si vienen y no están vacíos; solo si no, llamar a `buscarSoloVideo` / `buscarSoloMusica` / `buscarSoloWeb`. (La forma de los datos es la misma: `buscarSoloVideo` devuelve `externo.resultados_videos`, y `renderExternoEnFeed` funciona con ambos.)
   - Quitar las expresiones regulares: leer `datos.producto`, `datos.categoria`, `datos.nombre`, `datos.titulo`, `datos.tema`.
4. Mostrar el texto de la IA con `datos.mensaje_chat`.
5. `nivel_matriz`: en este paso se ignora (igual que hoy). Si llega junto con `BUSCAR`, el panel hace una búsqueda normal.

**`event-controller.js`** (rama `panelActivoChat`, líneas 189 a 193)
- Cambiar `AIService.enviarMensaje(mensaje)` por `AIService.enviarMensajeEstructurado(mensaje)`, mostrar `datos.mensaje_chat` y llamar a `PanelUsuario.procesarAccionEnFeed(datos, mensaje)`.

### Paso 1B — Pie de página y atajos que dibujan en la zona oculta

- Que cada enlace del pie, estando en el panel, muestre su contenido dentro del feed (como ya hace `mostrarQuienesSomos`).
- Que el atajo `detectarIntencionMatriz` (y el disparo de reclamo/contacto desde el chat) respete el panel: o se salta cuando el panel está activo y deja decidir a la IA, o pinta en el feed.
- Archivos probables: `institucional.js`, `ui-controller.js` y `event-controller.js`. **Hay que leer primero** `mostrarContactoAdmin`, `mostrarLibroReclamaciones` y `mostrarDocumentoLegal` para saber dónde dibujan.

### Paso 1C — Traducción

- Solo comprobar (y corregir si hace falta) que lo que el panel dibuje con el paso 1A y 1B respete el idioma elegido.

### Orden recomendado

1A primero y probarlo. Después 1B. Así, si algo falla en el pie de página, se sabe que no fue por el buscador.

### Lo que NO se toca en el paso 1

- `EventController.procesarAccionIA` (la lógica de la página principal).
- `ai-service.js`. `enviarMensaje` y `_reconstruirEtiquetaTexto` quedan sin uso tras el cambio; se pueden borrar más adelante, pero no en este paso.
- Supabase: ningún cambio en la base de datos ni en las funciones Edge.

## 6. Qué hereda y qué se ajusta al panel (referencia para los pasos siguientes)

| Acción | Página principal | Panel (usuario registrado) |
|---|---|---|
| Mostrar productos | Tarjeta simple | Tarjeta completa con likes, comentarios y carrusel (`renderPost`) |
| Dónde se dibuja | Zona de resultados públicos | Feed del panel (`userFeedContainer`) |
| "Cerca de mí" | Ubicación detectada | Ciudad de su perfil |
| Publicar | `PanelUsuario.iniciarPublicacionDesdeAsistente` | Igual |
| Buscar personas | `PanelUsuario.buscarUsuariosPorNombre` | Igual, dibujado en el feed |
| Matriz mundial / por país | Zona pública | Dentro del feed (pendiente, sección 7) |
| Formularios del pie | Zona pública (`mostrarFormularioEnMuro`) | Dentro del feed (paso 1B) |

## 7. Decisiones pendientes

- [ ] **¿Dónde se muestra la matriz mundial / por país dentro del panel?** Opciones: pintarla en el feed del panel (parecido a `renderMatrizLocalidadEnFeed`, aunque `obtenerMatrizNiveles` devuelve otra estructura) o dejarla para después. Sugerido: después.
- [ ] **¿Se incluye el respaldo cuando no hay resultados** (novedades, categorías)? Sugerido: segunda etapa.
- [ ] **¿Qué hace el atajo `detectarIntencionMatriz` en el panel?** Saltarlo o pintar en el feed. Decidir antes del paso 1B.
- [ ] **¿Los formularios del pie se muestran en el feed, o en una ventana (modal)?** Decidir antes del paso 1B.

## 8. Pasos siguientes (después del paso 1)

- Unificar la lógica: sacar la decisión de `procesarAccionIA` a un solo lugar, con "un pintor" por lado (página principal y panel). **Se toca la página principal**, así que antes hay que buscar todos los usos de `procesarAccionIA` y `UIController`, y probar antes y después.
- Matriz mundial / por país dentro del panel.
- Respaldo cuando no hay resultados (novedades, categorías, vistas guía).
- Borrar `enviarMensaje` y `_reconstruirEtiquetaTexto` si ya nada las usa.

## 9. Cómo probarlo cuando esté hecho

### Paso 1A (dentro del panel, con sesión iniciada, en el buscador de arriba y en el chat lateral)

- [ ] "bicicleta" → resultados normales en el feed.
- [ ] "bicicleta lo más barato" → que se ordene por precio (antes se ignoraba).
- [ ] "solo trueque de celulares" → que filtre por modalidad.
- [ ] "bicicletas cerca de mí" → que use tu ciudad (requiere tener ciudad en el perfil).
- [ ] "videos de cocina peruana" → un solo pedido de red cuando el servidor trae videos (pestaña Red de F12). Si el servidor no trae videos, el segundo pedido es esperado.
- [ ] Apagar la conexión y buscar desde el buscador de arriba → que salga el aviso de error, no un feed recargado en silencio.
- [ ] Apagar la conexión y escribir desde el chat lateral → que el chat muestre el aviso y el feed no se rompa.
- [ ] "buscar a Juan Pérez" → que siga encontrando personas.
- [ ] "quiero publicar una bicicleta" → que siga abriendo el flujo de publicar.
- [ ] "a nivel mundial" y "bicicletas en Lima" en el panel → anotar qué pasa (sirve para decidir el paso 1B).

### Paso 1B

- [ ] En el panel, pulsar cada enlace del pie: Quiénes Somos, Comunícate con el Administrador, Danos tu opinión, Libro de Reclamaciones, Términos, Privacidad → que cada uno se vea.
- [ ] En el chat del panel: "quiero hacer un reclamo" → que se vea el formulario.
- [ ] Enviar un reclamo de prueba desde el panel y confirmar que llega la constancia en PDF (flujo de `libro-reclamaciones`).

### Paso 1C

- [ ] Cambiar el idioma y repetir 2 o 3 búsquedas y 2 enlaces del pie dentro del panel.

### Página principal (sin sesión)

- [ ] Repetir 3 o 4 búsquedas y los enlaces del pie para confirmar que nada cambió.

## 10. Pendientes

- [ ] Decidir las preguntas de la sección 7.
- [ ] Hacer el paso 1A en `panel-usuario-3.js` y `event-controller.js`.
- [ ] Comprobar en el navegador la zona oculta (secciones 4.1 y 4.2).
- [ ] Leer `mostrarContactoAdmin`, `mostrarLibroReclamaciones` y `mostrarDocumentoLegal` (dónde dibujan).
- [ ] Hacer el paso 1B y 1C.
- [ ] Subir los archivos a GitHub, esperar el despliegue en Vercel, Ctrl+F5 y hacer las pruebas de la sección 9.
- [ ] Actualizar esta bitácora con el resultado de las pruebas.

## 11. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 08/10/2026 | Comparación del asistente y buscador de la página principal con los del panel de usuario | Diagnóstico y plan; sin cambios de código |
| 08/10/2026 | Revisión de la zona oculta, el pie de página y la traducción; el alcance del paso 1 pasa de "asistente y buscador" a 1A, 1B y 1C | Plan ampliado; sin cambios de código |
