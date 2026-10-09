> **Estado: PREPARADO, SIN CONFIRMAR. El código pasa `node --check` y una prueba simulada (21 comprobaciones). No se probó en tu página real ni contra `chat-ia`/Groq. Marcar cada punto cuando se haga.**

# Bitácora — Reintento automático del asistente ante fallos pasajeros

**Fecha:** 09/10/2026
**Continúa:** `BITACORA-CHAT-IA-Y-ASISTENTE.md` (tanda A4: aviso de límite y pausa de 60 s) y `BITACORA-FUNCIONES-EDGE-CUOTA-IA.md`
**Base:** el `ai-service.js` del zip de la página del 09/10 (ya incluye la tanda A4).
**Alcance:** solo `ai-service.js`. No toca el servidor, ni otros archivos, ni la base de datos.

## 1. Para qué

Al abrir la página, el primer mensaje al asistente a veces falla ("No pude conectarme bien…") y los siguientes funcionan; el buscador "parece responder" porque, si la IA falla, busca en el catálogo igual. Es una **hipótesis**, no un diagnóstico: el código del primer intento no se pudo ver. Este cambio repite UNA vez la llamada cuando el fallo es técnico y pasajero, para que la persona no vea el error.

## 2. Qué hace

En `_consultarIA`, tras una llamada fallida **espera 1,5 s y la repite una sola vez**.

| Situación | Resultado |
|---|---|
| La petición no llega (sin red, corte, CORS) | **Reintenta** |
| El servidor responde 500, 502, 503 o 504 | **Reintenta** |
| La respuesta no es JSON (con estado menor a 400) | **Reintenta** |
| Límite de cuota (429 o `limite_alcanzado`) | **No reintenta**: aviso claro y pausa de 60 s, como ya estaba |
| Errores fijos (400, 401, 404, etc.) | **No reintenta** |
| Respuesta correcta | Sin cambios: una sola llamada, sin espera |
| Falla también el reintento | Sale el aviso de siempre. Nunca hay un tercer intento |

Detalles:
- Cada intento parte limpio: los resultados de búsqueda del intento fallido se descartan.
- El cuerpo enviado es el mismo en los dos intentos; el mensaje del usuario entra **una sola vez** al historial.
- Ajustes al inicio del objeto: `REINTENTOS_TECNICOS: 1` y `REINTENTO_ESPERA_MS: 1500`. Con `REINTENTOS_TECNICOS: 0` se comporta exactamente como antes.
- Sirve también para el panel de usuario, que usa `enviarMensaje` (pasa por el mismo `_consultarIA`).

## 3. Archivo

| Archivo | Cambio |
|---|---|
| `js/modules/ai-service.js` | Dos constantes nuevas y un bucle de reintento dentro de `_consultarIA`. El resto, igual |

## 4. Orden para aplicarlo

1. [ ] Subir `js/modules/ai-service.js` a GitHub. Esperar a Vercel, Ctrl+F5.
2. [ ] Probar (sección 5).
3. [ ] Si al abrir la página el asistente sigue fallando, seguir con la sección 7.

## 5. Pruebas

- [ ] Abrir la página en una pestaña nueva y escribir "hola" al asistente: responde, sin aviso de error (varias veces, también tras un rato sin usarla).
- [ ] Conversación normal de 4 o 5 mensajes (producto, pregunta general, "videos de cocina"): responde igual que antes y sin demora extra. Espera ~30 s entre mensajes con búsqueda.
- [ ] Forzar un fallo: en F12 → Red, activar "Sin conexión" y enviar un mensaje; al volver la conexión, enviar otro. Debe salir el aviso de siempre (tarda ~1,5 s más) y, al reconectar, volver a responder.
- [ ] Límite de cuota: sigue saliendo el aviso claro y no se reintenta (una sola fila `chat-ia` en la pestaña Red).
- [ ] Panel de usuario (con sesión): buscar algo en el buscador de arriba y en el chat lateral.
- [ ] En F12 → Red, cuando falle un primer intento, ver si aparecen **dos** filas `chat-ia` seguidas y si la segunda sale bien. Anotar el estado de la primera.

## 6. Qué se probó y qué no

**Probado (simulado en Node, 21 comprobaciones):** respuesta a la primera sin espera; falla de red y éxito en el 2.º intento; 503 y 502 seguidos de éxito; 500 doble (solo 2 llamadas); 429 y `limite_alcanzado` sin reintento y sin llamadas durante la pausa; 400, 401 y 404 sin reintento; respuesta no JSON (200 sí, 404 no); `enviarMensaje` del panel; descarte de resultados del intento fallido; cuerpo idéntico e historial sin duplicados; `REINTENTOS_TECNICOS = 0`.
**No probado:** la página real, `chat-ia`/Groq, ni que la causa del fallo inicial sea pasajera.

## 7. Límites y costos

- **No arregla fallos fijos** (clave mal puesta, modelo inexistente, CORS, un 400) ni el límite de cuota.
- **Más espera al fallar de verdad:** ~1,5 s más antes de ver el aviso.
- **Más carga si Groq está sobrecargado:** cada fallo genera 2 llamadas en lugar de 1.
- **Búsquedas repetidas:** si el primer intento ya había buscado en Serper/YouTube y falló después, el reintento las repite y gasta cupo de esas APIs. Poco frecuente.
- **No se escriben datos en la base:** `chat-ia` no guarda nada, así que repetir la llamada es seguro.
- **No quita los dos avisos seguidos** cuando la IA falla de verdad (#1 de `ai-service.js` y #2 de `event-controller.js`); es otro cambio.
- **Los otros puntos que llaman a la IA** (`buscador.js`, `panel-usuario-3.js` líneas ~202 y ~1511) tienen su propio `fetch` y **no** reciben este reintento.
- Si tras aplicarlo el primer intento sigue fallando, falta la causa: el código del primer intento (F12 → Red) y la línea de error de los registros de `chat-ia` (`Groq respondió con error…` o `Error interno…`).

## 8. Cómo volver atrás

- Subir de nuevo el `ai-service.js` anterior, o poner `REINTENTOS_TECNICOS: 0`.

## 9. Pendientes relacionados

- [ ] Un solo aviso cuando la IA falla (ahora son dos).
- [ ] Que el mensaje de error técnico **no se guarde en el historial** (hoy viaja al modelo en los mensajes siguientes; el del límite sí se borra).
- [ ] Mismo reintento y aviso de límite en `buscador.js` y en los dos puntos de `panel-usuario-3.js`.
- [ ] Corregir el aviso del buscador del panel (`panel-usuario-3.js:1741`, compara con textos que ya no existen).
- [ ] Servidor (`chat-ia`): cadena de modelos, rotación de claves, `res.json()` protegido, límite por persona.
- [ ] Una llamada ligera al abrir la página que "despierte" la función (necesita un cambio pequeño en `chat-ia`).

## 10. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 09/10/2026 | Reintento automático (1 vez, 1,5 s) ante fallos técnicos en `ai-service.js` | `node --check` OK; prueba simulada 21/21; falta subir y probar en la página real |
