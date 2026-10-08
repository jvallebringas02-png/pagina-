> **Estado: PLAN, SIN CAMBIOS DE CÓDIGO TODAVÍA. Esta bitácora se escribió antes de tocar nada. Todo lo marcado "no verificado" hay que comprobarlo en el navegador antes de darlo por cierto.**

# Bitácora — Asistente y buscador del panel de usuario vs. página principal

**Fecha:** 08/10/2026
**Qué se revisó:** `pagina--main.zip` (el proyecto completo del 07/10/2026)
**Método:** lectura del código de `event-controller.js`, `ai-service.js` y `panel-usuario-3.js`. No se abrió la página publicada ni se probó en el navegador.
**Archivos que se piensa tocar:** `js/modules/panel-usuario-3.js` y `js/modules/event-controller.js` (solo 3 líneas, ver sección 4)

---

## 1. La pregunta

¿El buscador y el asistente de la página principal funcionan igual que los del panel de usuario?

**Respuesta: no.** Comparten el motor, pero el panel usa una versión más pobre del flujo.

## 2. Qué comparten

- El mismo asistente (`AIService` → función Edge `chat-ia`).
- El mismo motor de búsqueda (`BuscadorMotor.ejecutarBusquedaHibrida`): sinónimos, ciudad, presupuesto y orden por relevancia.
- Casi las mismas acciones: `BUSCAR`, `CATEGORIA`, `LISTAR_CATEGORIAS`, `RECIENTES`, `VIDEO`, `MUSICA`, `INTERNET`, `PUBLICAR`, `BUSCAR_PERSONA`, `QUIENES_SOMOS`, `EXPLORAR_LOCALIDAD`.

## 3. Qué hace distinto el panel

La causa de fondo es una sola. La página principal llama a `AIService.enviarMensajeEstructurado()`, que devuelve el objeto `datos` ya separado. El panel llama a `AIService.enviarMensaje()`, la forma antigua: convierte todo a un texto `[ACCION: ... | PRODUCTO: ...]` y después lo vuelve a leer con expresiones regulares. El comentario de `event-controller.js` dice que se dejó así "sin tocar su lógica".

| # | Diferencia | Dónde | Efecto |
|---|---|---|---|
| 1 | El panel **ignora** `orden`, `ubicacion` y `modalidad` | `panel-usuario-3.js`, `procesarAccionEnFeed` (BUSCAR y CATEGORIA no pasan `opciones`) | "Lo más barato cerca de mí" o "solo trueque" se buscan sin esos filtros |
| 2 | El panel **no usa** `nivel_matriz` (mundial / por país) | `procesarAccionEnFeed` | La vista de matriz decidida por la IA no existe en el panel |
| 3 | El panel **repite** las búsquedas de videos, música e internet | `procesarAccionEnFeed` llama a `buscarSoloVideo`, `buscarSoloMusica` y `buscarSoloWeb` | El servidor ya manda `resultados_videos` y `resultados_web`; la página principal los usa, el panel los descarta. Más lento y más cuota gastada |
| 4 | **Detección de error rota** | `panel-usuario-3.js:1723` | Compara con `'Error al conectar con la IA.'` y `'Error de conexión.'`, textos que ya no existen en ningún archivo. Si la IA falla, el aviso nunca sale: se muestra "No pude conectarme bien..." como si fuera una respuesta normal y se recarga el feed |
| 5 | **Sin respaldo** cuando no hay resultados | `procesarAccionEnFeed` | La página principal tiene búsqueda silenciosa de respaldo y vistas guía (novedades, categorías, mundial). El panel no |
| 6 | **Lectura frágil** | expresiones como `/PRODUCTO:\s*([^\|\]]+)/` | Si el producto contiene `|` o `]`, se corta mal |

### Un punto que hay que verificar (no verificado)

En `event-controller.js`, tanto el chat (`manejarEnvioMensaje`) como el buscador (`manejarBusquedaPrincipal`) revisan `BuscadorMotor.detectarIntencionMatriz(...)` **antes** de preguntar si el panel está activo. Si la frase calza ("a nivel mundial", "por país"), pintan la matriz con `UIController.mostrarMatrizNiveles`, que escribe en la parte de la página principal. El comentario de `panel-usuario-3.js` dice que esa parte **está oculta mientras estás en el panel**. Entonces es probable que en el panel la matriz se dibuje donde no se ve. Hay que probarlo en el navegador.

> **Corrección:** en la explicación dada antes en el chat se dijo que "la vista de matriz no existe en el panel". Es más preciso así: la ruta por la IA (`nivel_matriz`) no existe en el panel, y la ruta por frase (`detectarIntencionMatriz`) sí corre, pero probablemente dibuja en una zona oculta.

## 4. El cambio planeado

Hacer que el panel use el mismo camino estructurado que la página principal.

**`panel-usuario-3.js`**
1. `ejecutarBusquedaConIA`: reemplazar `AIService.enviarMensaje(query)` por `AIService.enviarMensajeEstructurado(query)`.
2. Error: usar `datos._fallo_tecnico` en lugar de comparar con textos que ya no existen.
3. `procesarAccionEnFeed`: que reciba el objeto `datos` (y el `query`) en vez del texto con `[ACCION: ...]`.
   - `BUSCAR` y `CATEGORIA`: pasar `opciones = { orden, ubicacionPropia, modalidad }`, igual que `event-controller.js`.
   - `VIDEO`, `MUSICA` e `INTERNET`: usar `datos.resultados_videos` / `datos.resultados_web` si vienen, y solo si no vienen llamar a `buscarSoloVideo` / `buscarSoloMusica` / `buscarSoloWeb`.
   - Quitar las expresiones regulares: leer `datos.producto`, `datos.categoria`, `datos.nombre`, `datos.titulo`, `datos.tema`.
4. Mostrar el texto de la IA con `datos.mensaje_chat`.

**`event-controller.js`** (líneas 189 a 193, la rama `panelActivoChat`)
- Cambiar `AIService.enviarMensaje(mensaje)` por `AIService.enviarMensajeEstructurado(mensaje)`, mostrar `datos.mensaje_chat` y llamar a `PanelUsuario.procesarAccionEnFeed(datos, mensaje)`.

**Lo que NO se toca**
- La página principal (`EventController.procesarAccionIA`).
- `ai-service.js`. `enviarMensaje` y `_reconstruirEtiquetaTexto` se quedan por si algo más las usa (no verificado: buscar `enviarMensaje(` en todo el proyecto antes de pensar en borrarlas).
- Supabase: ningún cambio en la base de datos ni en las funciones Edge.

## 5. Decisiones pendientes

- [ ] **¿Dónde se muestra la matriz mundial / por país dentro del panel?** Opciones: pintarla en el feed del panel (parecido a `renderMatrizLocalidadEnFeed`) o dejarla fuera del primer cambio y hacerla después. Hay que decidirlo antes de programar.
- [ ] **¿Se incluye el respaldo cuando no hay resultados** (novedades, categorías)? Sugerido: sí, pero en una segunda etapa, para que el primer cambio sea pequeño y fácil de probar.

## 6. Cómo probarlo cuando esté hecho

Dentro del panel de usuario, con sesión iniciada, en el buscador de arriba y en el chat lateral:

- [ ] "bicicleta" → resultados normales en el feed.
- [ ] "bicicleta lo más barato" → que se ordene por precio (antes se ignoraba).
- [ ] "solo trueque de celulares" → que filtre por modalidad.
- [ ] "bicicletas cerca de mí" → que use tu ciudad.
- [ ] "videos de cocina peruana" → un solo pedido de red, no dos (ver pestaña Red de F12).
- [ ] Apagar la conexión y buscar → que salga el aviso de error, no un feed recargado en silencio.
- [ ] "buscar a Juan Pérez" → que siga encontrando personas.
- [ ] "quiero publicar una bicicleta" → que siga abriendo el flujo de publicar.
- [ ] La página principal sin sesión: repetir 3 o 4 de estas búsquedas para confirmar que no cambió.

## 7. Pendientes

- [ ] Decidir las dos preguntas de la sección 5.
- [ ] Hacer el cambio de la sección 4 en `panel-usuario-3.js` y `event-controller.js`.
- [ ] Comprobar en el navegador el punto de la matriz oculta (sección 3).
- [ ] Subir los dos archivos a GitHub, esperar el despliegue en Vercel, Ctrl+F5 y hacer las pruebas de la sección 6.
- [ ] Actualizar esta bitácora con el resultado de las pruebas.

## 8. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 08/10/2026 | Comparación del asistente y buscador de la página principal con los del panel de usuario | Diagnóstico y plan; sin cambios de código |
