> **Estado: PREPARADO, SIN CONFIRMAR. Código escrito y probado SOLO en simulación (18 comprobaciones del servidor + 28 de la página). Nada se desplegó ni se probó contra Groq, YouTube, Serper ni tu Supabase reales. Marcar cada punto cuando se haga.**

# Bitácora — chat-ia y Asistente: tandas A y B

**Fecha:** 09/10/2026
**Continúa:** la versión de `chat-ia/index.ts` del 09/10 (la que quita el modo "traducir artículo", limita el historial a 8 mensajes y devuelve `limite_alcanzado`).
**Base:** el `index.ts` del zip `chat-ia.zip` (confirmado por ti como el desplegado) y el zip `pagina--main.zip`.
**No incluye:** el "portero" (límite por persona), CORS, traducciones de Seguridad, la Fase 1 (tienen sus propias bitácoras / siguen pendientes).

## 1. Qué cambió

### Tanda A — textos honestos, enlaces y aviso de límite

| # | Cambio | Dónde |
|---|---|---|
| A1 | Se quitó la promesa falsa de que "un moderador la revisará". Ahora el asistente dice que la publicación aparece en el muro y que cualquiera puede reportarla con 🚩 Reportar. | `chat-ia/index.ts` (2 frases del `PROMPT_BASE`) |
| A2 | Los enlaces de video se validan de verdad: deben ser `https://` y el **dominio** debe ser el de la plataforma (Instagram, YouTube, TikTok). Antes bastaba con que el texto contuviera `instagram.com`. Instagram además exige ruta de publicación (`/p/`, `/reel/`, `/reels/`, `/tv/`). | `panel-usuario-3.js` |
| A3 | Al **mostrar** un video ya guardado, solo se hace enlace si empieza por `https://` (protege los registros viejos y evita `javascript:`). | `panel-usuario-1.js` |
| A4 | Aviso claro cuando se acaba el cupo de la IA: en vez de "No pude conectarme… ¿Puedes intentar de nuevo?" sale un mensaje en 15 idiomas (quechua y aimara caen al español). Además el envío queda **en pausa 60 segundos** sin volver a llamar al servidor, para que nadie insista y gaste más. Se sigue haciendo la búsqueda local de respaldo. | `ai-service.js`, `event-controller.js`, `i18n.js` (clave `ia_limite`) |

### Tanda B — gastar menos (solo `chat-ia/index.ts`)

| # | Cambio | Detalle |
|---|---|---|
| B1 | Razonamiento bajo | `reasoning_effort: "low"` (el "pensar" también cuenta como gasto). Verificado en la documentación de Groq para `openai/gpt-oss-120b`. |
| B2 | Tope de respuesta | `max_completion_tokens: 2000` (incluye el razonamiento). Si se pone muy bajo, el JSON se corta. |
| B3 | Temperatura | de 0.7 a 0.3 (el formato es fijo; menos creatividad = menos errores de formato). |
| B4 | Red de seguridad | Si Groq rechaza B1 o B2 con error 400, se reintenta UNA vez sin esos parámetros. |
| B5 | Máximo 2 búsquedas por mensaje | Las demás reciben un aviso para la IA ("responde con lo que ya tienes"). |
| B6 | Clave de YouTube fuera de los registros | Los errores de `fetch` pasan por `sinSecretos()` antes de registrarse. (No se cambió cómo viaja la clave: ver pendientes.) |
| B7 | Reglas del administrador con caché | Se guardan 5 min en memoria; si la tabla `reglas_asistente` no existe, no se consulta de nuevo en 10 min (antes, una consulta fallida **por mensaje** con la llave de servicio). |
| B8 | `null` ya no es "JSON válido" | Una respuesta vacía o `null` de la IA ahora dispara la corrección de formato. |

Los valores de B1–B3 y B5 están como constantes al inicio del archivo (`GROQ_TEMPERATURA`, `GROQ_RAZONAMIENTO`, `GROQ_MAX_TOKENS`, `MAX_BUSQUEDAS_POR_MENSAJE`) para ajustarlos sin tocar la lógica.

## 2. Archivos

| Archivo | Cambio |
|---|---|
| `chat-ia/index.ts` | A1 + B1–B8 |
| `js/modules/ai-service.js` | A4 (detección de límite y pausa) |
| `js/modules/event-controller.js` | A4 (no repetir el aviso de "no pude conectarme" si fue por el límite) |
| `js/modules/panel-usuario-3.js` | A2 |
| `js/modules/panel-usuario-1.js` | A3 |
| `js/i18n.js` | A4: clave `ia_limite` en 14 idiomas (es usa el texto por defecto; qu/ay caen al español) |

## 3. Orden para aplicarlo (A y B por separado)

**Tanda A**
1. [ ] Subir a GitHub los 5 archivos de la página (`ai-service.js`, `event-controller.js`, `panel-usuario-1.js`, `panel-usuario-3.js`, `i18n.js`). Esperar a Vercel, Ctrl+F5.
2. [ ] Desplegar `chat-ia/index.ts` **solo con A1** (ver nota abajo) o completo si prefieres probar todo junto.
3. [ ] Probar la sección 4 (A).

**Tanda B**
4. [ ] Desplegar `chat-ia/index.ts` completo en Supabase (Edge Functions → chat-ia).
5. [ ] Probar la sección 4 (B), con mensajes reales.

> Nota: el `index.ts` entregado trae A1 y B juntos. Si quieres aplicar A primero de verdad aislada, despliega el `index.ts` ACTUAL con solo las dos frases del moderador cambiadas, y deja B para después.

## 4. Pruebas (en la página y en Supabase reales)

**A**
- [ ] Preguntar "¿cómo publico un artículo?": la respuesta ya no menciona a un moderador.
- [ ] Publicar con enlace de Instagram `https://sitio-malo.com/?x=instagram.com`: debe rechazarse. Con uno real (`https://www.instagram.com/p/…`): debe aceptarse.
- [ ] Con YouTube y TikTok reales: siguen aceptándose (incluido `youtu.be` y `vm.tiktok.com`).
- [ ] Forzar el límite (por ejemplo, poner una clave de Groq inválida o agotada en la copia, o simularlo): sale el mensaje claro, en el idioma de la página, sin "intentar de nuevo"; un segundo envío antes de 60 s no hace ninguna llamada de red (mirar la pestaña Red del navegador); pasado el minuto vuelve a intentar.
- [ ] Panel de usuario: el aviso también aparece (usa `enviarMensaje`).

**B**
- [ ] 10 mensajes variados (búsqueda de producto, categorías, ubicación, video, música, "quiénes somos", publicar): **el formato de respuesta no empeora** (el chat no cae a "No pude conectarme" ni muestra JSON crudo). Es lo más importante: cambiar temperatura y razonamiento puede alterar el comportamiento.
- [ ] Mirar los registros de la función: sin errores 400 por `reasoning_effort` / `max_completion_tokens` (si salen, el reintento sin ellos debería salvar el mensaje).
- [ ] Mirar el consumo en Groq antes y después, en el mismo tipo de mensajes.
- [ ] Un mensaje que pida buscar en internet y video a la vez: solo 2 búsquedas.
- [ ] Registros: ninguna línea contiene tu clave de YouTube.
- [ ] Si `reglas_asistente` no existe, el registro de "No se pudieron cargar reglas" aparece una vez cada ~10 minutos, no en cada mensaje.

## 5. Qué se probó y qué no

**Probado (simulado, Node):**
- Servidor (18): tope de 2 búsquedas y respuesta a las 3 llamadas; parámetros de costo en la petición; reintento sin ellos ante un 400; 429 → `limite_alcanzado` sin datos internos; `null` dispara la corrección; la clave de YouTube no aparece en los registros; la consulta de reglas se hace una sola vez; el prompt ya no promete moderador.
- Página (28): detección de límite por HTTP 429 y por `limite_alcanzado`; mensaje en inglés y español, y quechua cayendo al español; pausa de 60 s sin llamadas de red; el mensaje no queda en el historial; recuperación tras la pausa; fallo de red normal NO se confunde con límite; 14 idiomas con la clave; validación de enlaces (válidos y 8 casos de engaño); protección al mostrar.
**No probado:** el despliegue real; la respuesta real de Groq con los nuevos parámetros (lo principal); el comportamiento del formato en mensajes reales; YouTube/Serper; los textos nuevos con hablantes nativos.

## 6. Cómo volver atrás

- Página: subir de nuevo los 5 archivos anteriores.
- Función: redesplegar el `index.ts` anterior. Si solo molesta B1–B3, basta con cambiar `GROQ_RAZONAMIENTO`/`GROQ_MAX_TOKENS`/`GROQ_TEMPERATURA` (o, para quitarlos, borrar las dos líneas dentro de `if (conAjustesCosto)`).

## 7. Qué falta (pendiente, por orden de importancia)

1. [ ] **El "portero" (tanda C):** la función sigue sin preguntar quién llama ni cuántas veces; cualquiera puede agotar el cupo. Incluye `busqueda_directa` (gasta Serper y YouTube sin pasar por la IA) y CORS abierto (`*`). Decidir antes: cuántos mensajes por persona, qué hacer con las IP compartidas, aviso en la política de privacidad.
2. [ ] **Aviso de límite en otros 3 puntos** que llaman a la misma función y no pasan por `ai-service.js`: `buscador.js` (línea ~196), `panel-usuario-3.js` (línea ~186, traducción de productos, y ~1495, "quién quiere esto"). Hoy muestran su propio mensaje de error genérico.
3. [ ] **Probar y ajustar B** con mensajes reales (sección 4). Si el razonamiento "low" empeora la calidad, subir a `medium`.
4. [ ] **Decidir qué hace la búsqueda** (comentario ya existente en `index.ts`): hoy el modelo busca por su cuenta (herramientas) **y** puede declarar `accion:"INTERNET"` para que el cliente busque otra vez. Elegir un solo mecanismo para no duplicar gasto.
5. [ ] **Clave de YouTube por cabecera** (`x-goog-api-key`) en vez de dentro de la URL. Aquí solo se evitó que quede en los registros; mover la clave cambia cómo se llama a Google y hay que probarlo.
6. [ ] **Tabla `reglas_asistente`:** decidir si se crea (con acceso solo desde la función) o se quita la consulta hasta que exista el panel de reglas.
7. [ ] **Moderación real de publicaciones:** hoy `estado: 'aprobado'` automático. La frase ya es honesta, pero si quieres revisión previa hay que cambiar el estado inicial a `pendiente` y construir el panel. Relacionado: detección de patrones y bloqueo por niveles (ver conversación del 09/10).
8. [ ] **"Te responderemos pronto"** (mensaje de Comunícate con el Administrador): promete algo que solo es cierto si alguien lee los mensajes. Cambiarlo a "recibimos tu mensaje" si no hay quien responda.
9. [ ] **Validación en el servidor de los enlaces de video:** la de A2 está solo en el navegador (se puede saltar escribiendo directo a la base). Falta una regla en Supabase (restricción o función) que acepte solo `https://` y esos dominios.
10. [ ] **`contenido-info.js`** arma un `<iframe src>` con el `video_url` de los artículos (los carga el administrador, no los visitantes): aplicar la misma comprobación de dominio por si algún día se abre a otros.
11. [ ] **Fase 1 (constancia):** ejecutar y probar (bitácora aparte). Hasta entonces, no traducir frases de Seguridad que dependan de ella ("recibirás una constancia con código").
12. [ ] **Traducir la página de Seguridad** (13 idiomas) solo con frases verificadas hoy; la frase legal del aviso final, con un abogado. Incluye actualizar el texto al cambiar de idioma con la página abierta.
13. [ ] **Revisión nativa** de los 14 textos nuevos de `ia_limite`.

## 8. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 09/10/2026 | Tandas A y B preparadas (chat-ia + 5 archivos de la página) | `node --check` OK; prueba simulada servidor 18/18 y página 28/28; falta despliegue y prueba real |
