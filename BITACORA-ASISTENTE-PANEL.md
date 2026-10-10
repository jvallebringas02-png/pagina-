> **Estado: APLICADO EN EL CÓDIGO, SIN CONFIRMAR EN EL NAVEGADOR. El cambio de la sección 4 ya está escrito en los dos archivos y pasa `node --check` sin errores. No se probó contra Groq real ni en la página publicada. Todo lo marcado "no verificado" hay que comprobarlo en el navegador antes de darlo por cierto.**

# Bitácora — Asistente y buscador del panel de usuario vs. página principal

**Fecha:** 08/10/2026 (diseño) — aplicado el 10/10/2026
**Qué se revisó:** `pagina--main.zip` (el proyecto completo del 07/10/2026)
**Método:** lectura del código de `event-controller.js`, `ai-service.js` y `panel-usuario-3.js`. No se abrió la página publicada ni se probó en el navegador.
**Archivos tocados:** `js/modules/panel-usuario-3.js` y `js/modules/event-controller.js` (sección 4)

---

## 1. La pregunta

¿El buscador y el asistente de la página principal funcionan igual que los del panel de usuario?

**Respuesta (antes del cambio): no.** Compartían el motor, pero el panel usaba una versión más pobre del flujo.

## 2. Qué comparten

- El mismo asistente (`AIService` → función Edge `chat-ia`).
- El mismo motor de búsqueda (`BuscadorMotor.ejecutarBusquedaHibrida`): sinónimos, ciudad, presupuesto y orden por relevancia.
- Casi las mismas acciones: `BUSCAR`, `CATEGORIA`, `LISTAR_CATEGORIAS`, `RECIENTES`, `VIDEO`, `MUSICA`, `INTERNET`, `PUBLICAR`, `BUSCAR_PERSONA`, `QUIENES_SOMOS`, `EXPLORAR_LOCALIDAD`.

## 3. Qué hacía distinto el panel (antes del cambio)

| # | Diferencia | Dónde | Efecto |
|---|---|---|---|
| 1 | El panel **ignoraba** `orden`, `ubicacion` y `modalidad` | `panel-usuario-3.js`, `procesarAccionEnFeed` | "Lo más barato cerca de mí" o "solo trueque" se buscaban sin esos filtros |
| 2 | El panel **no usaba** `nivel_matriz` (mundial / por país) | `procesarAccionEnFeed` | La vista de matriz decidida por la IA no existía en el panel |
| 3 | El panel **repetía** las búsquedas de videos, música e internet | `procesarAccionEnFeed` | El servidor ya manda `resultados_videos` y `resultados_web`; la página principal los usaba, el panel los descartaba |
| 4 | **Detección de error rota** | `panel-usuario-3.js:1739` | Comparaba con textos que ya no existían en ningún archivo. El aviso nunca salía |
| 5 | **Sin respaldo** cuando no hay resultados | `procesarAccionEnFeed` | La página principal tiene búsqueda silenciosa de respaldo y vistas guía; el panel no |
| 6 | **Lectura frágil** | expresiones como `/PRODUCTO:\s*([^\|\]]+)/` | Si el producto contenía `|` o `]`, se cortaba mal |

### Punto 2 (matriz mundial / por país) — sigue sin verificar

En `event-controller.js`, el chat y el buscador revisan `BuscadorMotor.detectarIntencionMatriz(...)` antes de preguntar si el panel está activo. Si la frase calza, pintan la matriz en una parte de la página que `panel-usuario-3.js` dice que queda oculta mientras estás en el panel. **No se tocó en este cambio** (ver sección 5). Hay que probarlo en el navegador.

## 4. El cambio — APLICADO

Se hizo que el panel use el mismo camino estructurado que la página principal.

**`panel-usuario-3.js`**
1. ✅ `ejecutarBusquedaConIA`: ahora llama a `AIService.enviarMensajeEstructurado(query)` en vez de `enviarMensaje(query)`.
2. ✅ Error: usa `datos._fallo_tecnico` en vez de comparar con textos que ya no existían.
3. ✅ `procesarAccionEnFeed`: recibe el objeto `datos` (y `query`) en vez del texto con `[ACCION: ...]`.
   - `BUSCAR` y `CATEGORIA`: ahora pasan `opciones = { orden, ubicacionPropia, modalidad }`, igual que `event-controller.js`.
   - `VIDEO`, `MUSICA` e `INTERNET`: usan `datos.resultados_videos` / `datos.resultados_web` cuando vienen, y solo si no vienen llaman a `buscarSoloVideo` / `buscarSoloMusica` / `buscarSoloWeb`.
   - Se quitaron las expresiones regulares: ahora lee `datos.producto`, `datos.categoria`, `datos.nombre`, `datos.titulo`, `datos.tema`.
4. ✅ El texto de la IA se muestra con `datos.mensaje_chat`.

**`event-controller.js`** (la rama `panelActivoChat`)
- ✅ Se cambió `AIService.enviarMensaje(mensaje)` por `AIService.enviarMensajeEstructurado(mensaje)`, se muestra `datos.mensaje_chat` y se llama a `PanelUsuario.procesarAccionEnFeed(datos, mensaje)`.

**Lo que NO se tocó (tal como estaba planeado)**
- La página principal (`EventController.procesarAccionIA`).
- `ai-service.js`. `enviarMensaje` y `_reconstruirEtiquetaTexto` se quedaron (todavía los usa `buscador.js` y otros puntos, no se buscó a fondo si queda algo más que los use).
- Supabase: ningún cambio en la base de datos ni en las funciones Edge.
- Los textos fijos de los títulos de resultado dentro de `procesarAccionEnFeed` ("Videos de YouTube", "No encontramos...") siguen en español, igual que antes — no estaban en el alcance de este cambio.

## 5. Decisiones pendientes (sin resolver, quedan para después)

- [ ] **¿Dónde se muestra la matriz mundial / por país dentro del panel?** Opciones: pintarla en el feed del panel (parecido a `renderMatrizLocalidadEnFeed`) o dejarla fuera un poco más. Sigue sin decidirse.
- [ ] **¿Se incluye el respaldo cuando no hay resultados** (novedades, categorías)? Sigue sin decidirse. Sugerido: sí, pero en una segunda etapa.
- [ ] Traducir los textos fijos de `procesarAccionEnFeed` (títulos de video/música/internet) a los 17 idiomas, para que el panel quede igual de traducido que la página principal.

## 6. Cómo probarlo (pendiente de hacer)

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

- [x] Hacer el cambio de la sección 4 en `panel-usuario-3.js` y `event-controller.js`.
- [ ] Decidir las dos preguntas de la sección 5.
- [ ] Comprobar en el navegador el punto de la matriz oculta (sección 3).
- [ ] Subir los dos archivos a GitHub, esperar el despliegue en Vercel, Ctrl+F5 y hacer las pruebas de la sección 6.
- [ ] Actualizar esta bitácora con el resultado de las pruebas reales.

## 8. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 08/10/2026 | Comparación del asistente y buscador de la página principal con los del panel de usuario | Diagnóstico y plan; sin cambios de código |
| 10/10/2026 | Aplicado el cambio de la sección 4 en `panel-usuario-3.js` y `event-controller.js` | `node --check` OK en los 13 archivos de `js/modules/`; falta subir a GitHub y probar en el navegador real |
