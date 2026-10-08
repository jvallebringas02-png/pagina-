> **Estado: REVISIÓN TERMINADA (5 de 6 funciones), SIN CAMBIOS. No se cambió, desplegó ni borró nada. Todo lo de abajo sale de leer el código que se pegó y la captura del panel de Supabase; nada se probó contra Groq ni contra tu base. Lo marcado "no verificado" hay que comprobarlo antes de darlo por cierto.**

# Bitácora — Funciones Edge de Supabase y cuota de IA (asistente y traducción)

**Fecha:** 08/10/2026
**Continúa:** `BITACORA-LIMITE-USO-IA.md` (06/10, solo plan), `BITACORA-TRADUCCION.md`, `BITACORA-SEGURIDAD (4).md`
**Qué se revisó:** la captura de Edge Functions de Supabase (6 funciones), el código pegado de `chat-ia`, `asistente-ia`, `traducir-mensaje`, `traducir-texto` y `buscar-articulos`, y el zip `pagina--main.zip` (para saber qué funciones usa la página).
**No se vio:** `swift-action`, los nombres de los secretos de Supabase, ni la función SQL `buscar_anuncios_ranking`.

---

## 1. Corrección a lo dicho antes

`BITACORA-LIMITE-USO-IA.md` (sección 1) dice que el asistente y la traducción dependen de la **misma** cuenta de Groq y que si se agota fallan los dos. **Es incorrecto.** El código confirma dos cuentas separadas:

| Cuenta | Función | Secreto |
|---|---|---|
| #1 (chat) | `chat-ia` | `GROQ_API_KEY` |
| #2 (traducción) | `traducir-texto` | `GROQ_API_KEY_TRADUCCION` |

Si se agota la #1 falla el asistente, la búsqueda externa y las alertas del panel; la traducción de productos sigue. Si se agota la #2, el asistente sigue. Falta corregir esa sección en la bitácora del límite.

## 2. Las seis funciones

| Función | Actualizada | ¿La usa la página? | ¿Groq? | Veredicto |
|---|---|---|---|---|
| `chat-ia` | hace 17 días | **Sí** (7 archivos) | Sí, #1 | En uso. Pendiente de mejoras (sección 3) |
| `traducir-texto` | hace 11 días | **Sí** (2 archivos) | Sí, #2 | En uso. Bien diseñada; faltan límites (sección 4) |
| `asistente-ia` | hace 3 meses | No | Sí, #1 | Antigua, sin uso. Retirar |
| `traducir-mensaje` | hace 3 meses | No | Sí, #1 | Antigua, sin uso, **la más peligrosa**. Retirar primero |
| `buscar-articulos` | hace 3 meses | No | No | Sin uso. Revisar su función SQL |
| `swift-action` | hace 3 meses | No | ? | **No vista.** Nombre típico de función de prueba (suposición) |

**La rotación de claves que se recordaba no existe en ninguna de las cinco funciones vistas.** Las dos cosas que se le parecen: las **dos cuentas** y la **cadena de modelos** de `traducir-texto` (rota modelos, no claves).

## 3. `chat-ia` (cuenta #1)

**Cómo funciona:** modelo `openai/gpt-oss-120b`; `PROMPT_BASE` en el servidor (~3.400 a 3.500 tokens según la bitácora del límite, no medido); herramientas de búsqueda web y YouTube; tres modos: chat, `busqueda_directa` (la usa `buscador.js:199`) y `traducir_articulo` (**la página no lo usa**).

**Cuánto gasta (estimación, no medida):**

| Escenario | Llamadas a Groq | Tokens aprox. |
|---|---|---|
| Respuesta directa con JSON válido | 1 | 4 a 5 mil |
| Con búsqueda web o video | 2 | 9 a 10 mil |
| Con búsqueda y reintento de formato | 3 | 13 mil o más |

El límite gratis citado en tus bitácoras es 8.000 tokens por minuto por modelo y por organización (no verificado). Un solo mensaje con búsqueda ya puede pasarse.

**Problemas encontrados:**

| # | Problema | Gravedad |
|---|---|---|
| A | El modo `traducir_articulo` está abierto a cualquiera y nadie lo usa. Gasta la cuenta #1; `idioma_nombre` entra al prompt sin validar y el resultado se **guarda en `contenido_administrable`** (se muestra a todos) con claves de idioma arbitrarias | Alta |
| B | `busqueda_directa` abierto: cualquiera gasta Serper y YouTube sin pasar por la IA | Media |
| C | Sin límite por persona ni verificación de sesión. La página manda siempre la clave pública como credencial (no hay `access_token` en ningún archivo), así que el servidor no distingue invitados de usuarios | Alta |
| D | Sin `max_tokens` ni `reasoning_effort` (a diferencia de `traducir-texto`); el historial admite 30 mensajes de hasta 4.000 caracteres | Media |
| E | Un solo modelo, sin respaldo. Una sola clave, sin rotación | Media |
| F | El error 429 de Groq se reenvía crudo con su estado; el `catch` devuelve `e.message`. Si Groq rechaza la llamada con herramientas (el 400 de la bitácora del límite), la persona se queda sin respuesta; `JSON.parse(toolCall.function.arguments)` sin proteger | Media |
| G | El reintento de formato gasta una llamada completa y la página ya acepta texto plano | Baja |
| H | Consulta `reglas_asistente` en cada mensaje | Baja |
| I | Duplicación anotada en el propio código: la IA puede buscar sola con herramientas y además declarar `accion: INTERNET/VIDEO`, y entonces la página busca otra vez | Media |

**Qué ve la persona cuando se agota:** la página (`ai-service.js`, `_consultarIA`) no mira el estado de la respuesta; sin `choices` lo trata como "sin conexión". En la página principal hace una búsqueda de respaldo y, si no hay resultados, escribe "No pude conectarme bien en este momento…". En el panel la detección de error está rota (compara con textos que ya no existen) y el feed se recarga sin avisar. El mensaje es engañoso (parece culpa de la conexión) y está solo en español. El cuerpo crudo del error de Groq sí viaja al navegador (visible en F12).

## 4. `traducir-texto` (cuenta #2)

- Cadena de modelos: `gpt-oss-20b`, luego `gpt-oss-120b`, luego `qwen/qwen3.8-27b`; editable con el secreto `MODELOS_TRADUCCION`. Si un modelo da 429 o no existe, pasa al siguiente.
- `max_completion_tokens` según el largo del texto y `reasoning_effort: low`. Devuelve el 429 con `Retry-After` si todos fallan.
- **Es el patrón a copiar en `chat-ia`.**
- Pendientes: sin límite por persona; `texto` sin largo máximo (solo se limita la respuesta); `idioma` va al prompt sin validar; `qwen/qwen3.8-27b` probablemente no existe (costo bajo); `String(e)` crudo.

## 5. Funciones antiguas (sin uso en la página)

**`traducir-mensaje`** — traduce un mensaje y lo **inserta en `mensajes` con la clave de servicio**, tomando `conversacion_id`, `emisor_id` y `texto` del cuerpo de la petición, sin verificar quién llama. Permite escribir en cualquier conversación haciéndose pasar por cualquier usuario y se salta las reglas del chat. Usa `llama-3.1-8b-instant` (retirado según la bitácora de traducción), pero si el idioma del emisor coincide con `idioma_destino` **no llama a Groq e inserta igual**. "Verificar JWT" no la protege: la clave pública de la página es un JWT válido. Inferencia mía, no probada.

**`asistente-ia`** — asistente de ayuda para entrar y registrarse. Modelo `llama-3.1-8b-instant` (retirado, probablemente falla). Toma `usuario_id` del cuerpo y escribe en `historial_asistente` con la clave de servicio; `contexto` va directo al prompt. Sin CORS.

**`buscar-articulos`** — no usa Groq. Usa la clave pública con el token de quien llama (bien) y llama a la función SQL `buscar_anuncios_ranking`. `usuario_id` viene del cuerpo; `limite` y `radio_km` sin tope. Lo que filtra depende de la función SQL, **no vista**.

## 6. Qué sigue funcionando si se agota la cuota de la #1

- **Sigue:** la búsqueda de productos (motor propio), la búsqueda de respaldo, los accesos rápidos, la traducción de productos (cuenta #2, según el código).
- **Se pierde por ese minuto:** la conversación con el asistente, la búsqueda web y de videos, y las alertas al publicar o chatear en el panel.

## 7. Decisiones tomadas en esta conversación

- Lo de `chat-ia` (modelos, topes, límites, rotación) **queda como pendiente**.
- Preferencia: "que siga igual". Se preguntó si se pueden agregar más cuentas de Groq: **sí, pero exige un cambio en `chat-ia`** (hoy lee una sola clave); no se decidió.

## 8. Plan propuesto (nada hecho)

| Paso | Cambio | Dónde | Tamaño |
|---|---|---|---|
| 1 | Quitar el modo `traducir_articulo`; validar `idioma`; errores sin datos internos; 429 con formato claro | `chat-ia` | Pequeño |
| 2 | **Copiar el patrón de `traducir-texto`:** cadena de modelos, `max_tokens` y razonamiento bajo | `chat-ia` | Mediano |
| 3 | Rotación de claves (`GROQ_API_KEY`, `_2`, `_3`…); reintentar sin herramientas si hay 400; proteger el `JSON.parse` | `chat-ia` | Mediano |
| 4 | Menos historial (por ejemplo 8 turnos de 1.000 caracteres) | `chat-ia` | Pequeño |
| 5 | Mensaje claro cuando no hay cupo, en los 17 idiomas, sin pedir "intenta de nuevo" enseguida | `ai-service.js` e `i18n` | Pequeño |
| 6 | Límite por persona e IP: la página manda el token de sesión; el servidor lo verifica; tabla contador | Página + `chat-ia` + SQL | Mediano |

Medidas **mientras tanto**, sin tocar código:
1. Revisar y cerrar `api_keys_config` y rotar las claves (tu bitácora de seguridad dice que es legible por cualquier usuario con sesión; no sé qué guarda).
2. Vigilar el uso (consola de Groq y registros de `chat-ia`).
3. Si la demanda lo justifica, valorar un plan de pago de Groq para la #1 (límites y precio: revisarlos en tu consola; no los conozco).

## 9. Condiciones de varias cuentas de Groq

- Deben ser **organizaciones distintas**; otra clave de la misma organización no suma (límite por organización).
- **Revisar los términos de Groq** sobre varias cuentas gratuitas; podrían prohibirlo.
- Las claves van como secretos de Supabase, nunca en el código ni en la página.
- No protege del abuso (solo sube el techo) y puede haber límites diarios además del de por minuto (no revisado).
- Alternativa **sin cuenta nueva:** la cadena de modelos (paso 2), porque el límite también es por modelo (no verificado para `chat-ia`).

## 10. Pendientes (marcar al hacerlos)

- [ ] **Guardar una copia del código de cada función** en `supabase/functions/<nombre>/index.ts` del repositorio (la bitácora de traducción ya lo pedía).
- [ ] Ver los **registros de invocaciones** de `asistente-ia`, `traducir-mensaje`, `buscar-articulos` y `swift-action`: si reciben llamadas, algo las usa o las están probando.
- [ ] Pasar los **nombres** (no los valores) de los secretos de Supabase.
- [ ] Pegar `swift-action`, tapando cualquier clave escrita.
- [ ] **Retirar `traducir-mensaje`**, luego `asistente-ia`, **después** de guardar la copia y de comprobar que nada las usa.
- [ ] Revisar `mensajes` (mensajes recientes de emisores que no pertenezcan a la conversación) e `historial_asistente`.
- [ ] Ejecutar `select proname, prosecdef from pg_proc where proname = 'buscar_anuncios_ranking';` y revisar qué devuelve esa función.
- [ ] Revisar y cerrar `api_keys_config`; rotar las claves guardadas ahí.
- [ ] Corregir la sección 1 de `BITACORA-LIMITE-USO-IA.md` (cuentas separadas).
- [ ] Decidir los números del límite por persona (invitado y con sesión) y si se abren más cuentas.
- [ ] Cuando se toque `chat-ia`: desplegar con una sola clave primero y comprobar que todo sigue igual.

## 11. Cómo se probaría el cambio de `chat-ia` (cuando se haga)

1. Un mensaje normal: responde igual que antes.
2. "videos de cocina peruana": una sola búsqueda, sin duplicados.
3. Forzar el 429 (por ejemplo, con un secreto de modelos inválido en una copia) y comprobar que pasa al modelo siguiente.
4. Con todos los modelos sin cupo: la página muestra el mensaje claro en el idioma elegido, no "No pude conectarme".
5. La traducción de productos sigue funcionando (otra cuenta).
6. Sin sesión y con sesión: el límite aplica distinto.

## 12. Límites de esta revisión

- Todo sale de leer código y una captura. No se llamó a Groq ni a Supabase.
- Las cifras de tokens son estimaciones; el prompt no se midió.
- Los límites de Groq (8.000 por minuto, por modelo y organización) vienen de tus bitácoras, no de la documentación de Groq.
- Qué devuelve `buscar_anuncios_ranking` y qué guarda `api_keys_config` es desconocido.
- La explotabilidad de las funciones antiguas es una inferencia por lectura, no probada.

## 13. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 08/10/2026 | Revisión de `chat-ia`, `asistente-ia`, `traducir-mensaje`, `traducir-texto`, `buscar-articulos` y de la lista de funciones | Diagnóstico; sin cambios de código. Quedan `swift-action` y los secretos por ver |
