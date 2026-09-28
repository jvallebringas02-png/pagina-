> **Estado: CÓDIGO LISTO Y PROBADO EN SIMULACIÓN. Falta (1) pegar la función nueva en Supabase, (2) subir 2 archivos a GitHub y (3) probar en vivo con Groq real.**

# Bitácora — Error 429 (límite de Groq) que dejaba productos sin traducir

**Fecha:** 28/09/2026

---

## 1. Síntoma
Con la página en aimara o búlgaro, las tarjetas de productos salían con las etiquetas traducidas ("Utji", "Aruskipaña") pero **títulos y descripciones en español**, y solo algunos productos sí se traducían.

## 2. Causa (confirmada con la consola del navegador)
Decenas de avisos: `traducir-texto respondió con error 429 ... Rate limit reached for model openai/gpt-oss-20b ... tokens per minute (TPM): Limit 8000, Used ~7200, Requested ~1650-2150`.

- El plan gratis de Groq da **8,000 tokens por minuto por modelo** (por organización, no por key: crear más keys no ayuda).
- Cada producto hace 2 llamadas (título y descripción) y se procesaban 3 productos a la vez = 6 llamadas simultáneas, cada una pidiendo ~2,000 tokens. El minuto se agotaba con la primera tanda; el resto fallaba y quedaba en español.
- **No era un bug de lógica:** un test con traducción simulada traduce título y descripción a la vez. Tampoco era de despliegue: la consola prueba que el sitio ya llama a `traducir-texto`, que la función responde y que el secreto y el modelo son válidos.
- Hipótesis NO confirmada: que cada llamada "pida" ~2,000 tokens porque `gpt-oss` es un modelo de razonamiento y Groq reserva espacio de respuesta. El tope de tokens debería bajarlo; se verifica al probar en vivo (ver sección 5).

## 3. Descubrimiento importante: modelos de Groq dados de baja
Según `console.groq.com/docs/deprecations` (consultado 28/09/2026):

| Modelo | Baja |
|---|---|
| `llama-3.1-8b-instant` | 16/08/2026 |
| `llama-3.3-70b-versatile` | 16/08/2026 |
| `qwen/qwen3-32b` | 17/07/2026 |
| `meta-llama/llama-4-scout-17b-16e-instruct` | 17/07/2026 |

Vigentes (plan gratis, 8,000 TPM y 1,000 pedidos/día cada uno): `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `openai/gpt-oss-safeguard-20b`, `qwen/qwen3.8-27b`. Ojo: una página de deprecaciones más antigua menciona `qwen/qwen3.6-27b`; el ID exacto de Qwen es incierto (3.6 vs 3.8), por eso el código lo trata como plan B opcional y se salta solo si no existe.
**Al conversar se sugirió por error `llama-3.3-70b-versatile` y `llama-4-scout` como plan B; ya no existen y no se usan.**

## 4. Cambios hechos (4)

**Supabase — `supabase/functions/traducir-texto/index.ts` (reemplazar TODO el código de la función y desplegar):**
1. **Tope de tokens y razonamiento bajo.** `max_completion_tokens = min(6000, 300 + 1.2 × largo del texto)` (un título ≈ 316) y `reasoning_effort: "low"` solo para modelos `openai/gpt-oss*` (otros modelos darían 400).
2. **Plan B entre modelos.** Orden: `openai/gpt-oss-20b` → `openai/gpt-oss-120b` → `qwen/qwen3.8-27b`. Si uno da 429, no existe o falla, se prueba el siguiente (cada modelo tiene su propio límite, así que se suman). Si la respuesta sale vacía o cortada (`finish_reason: length`), reintenta el mismo modelo con el doble de tope. Quita bloques `<think>…</think>`. Si ningún modelo puede, devuelve 429 con `Retry-After`. La respuesta mantiene el formato `{choices:[{message:{content}}]}` (+ campo `modelo`), así que la página no cambia.
   - **Modelos configurables sin tocar código:** secreto opcional `MODELOS_TRADUCCION` en Supabase (Edge Functions → Secrets), IDs separados por coma. Útil porque Groq retira modelos seguido.

**GitHub (subir 2 archivos):**
3. **`js/modules/buscador.js`** — `TraduccionProductos.TAMANO_TANDA` de 3 a **1** (las llamadas van de a una).
4. **`js/modules/panel-usuario-3.js`** — `traducirTextoIA` reintenta si recibe 429 o 503, esperando 4 s y luego 10 s (`PanelUsuario.ESPERAS_REINTENTO_MS`); tras 3 intentos se rinde y el texto queda en español. Otros errores (p. ej. 400) no se reintentan. Beneficia también al artículo del muro, los documentos legales y los mensajes de chat, que usan la misma función.

## 5. Pruebas hechas
- Función Edge, con Groq simulado (Node): 15/15. Caso normal, tope chico para un título (316) y mayor para textos largos, 429 → pasa al siguiente modelo, modelo dado de baja (404) → se salta, todos con 429 → responde 429 + `Retry-After`, respuesta cortada → reintento con doble tope, limpieza de `<think>`, validación 400 y CORS.
- Página, Chromium con respuestas simuladas: 6/6. 429 dos veces y luego éxito → traduce; 429 siempre → se rinde a los 3 intentos sin bucle; error 400 → no reintenta; con 4 productos nunca hay más de 1 llamada simultánea.
- Regresión: sintaxis de todos los `.js` correcta; siguen bien los idiomas `ru/qu/ay` y la traducción de título+descripción de una tarjeta.
- **NO probado:** la función real contra Groq real. Lo simulado prueba la lógica, no que Groq acepte `reasoning_effort` / `max_completion_tokens` para cada modelo, ni el ID `qwen/qwen3.8-27b`, ni que el tope realmente reduzca los tokens que Groq cuenta.

## 6. Cómo comprobar en vivo (después de desplegar)
1. Pegar la función nueva en Supabase (Edge Functions → `traducir-texto` → editar → Deploy) y subir los 2 archivos a GitHub.
2. Página en aimara o búlgaro → tocar "Ver mi zona" → esperar ~30 s (ahora va de a una llamada, tarda más pero completa).
3. Consola del navegador (F12): deberían desaparecer casi todos los 429. Si aún salen con `Requested` cercano a 2,000, la hipótesis del tope de tokens era incorrecta.
4. Supabase → Edge Functions → `traducir-texto` → Logs, para ver errores de modelo (p. ej. un ID inexistente o un parámetro rechazado).
5. Si sigue insuficiente: plan Developer de Groq (pago por uso; `gpt-oss-20b` ≈ $0.075 por millón de tokens de entrada, centavos para este uso) o, más adelante, traducir los productos al publicarlos en vez de al visitarlos.

## 7. Pendientes (sin cambios)
- Traducciones ya guardadas mal en Supabase para `ru`/`bg`/`qu`/`ay` (de antes del arreglo de `NOMBRES_IDIOMAS`), sin revisar.
- Repintar resultados ya dibujados al cambiar de idioma; detector de idioma por escritura ("casa o departamento…" → pt) y "cambiar" como disparador; `<html lang>` y RTL; "¿Otro idioma? Traduce aquí"; nombres de idioma con "(Chino)"…; feed de usuarios logueados; patrocinadores (son datos de prueba, sin definir); "Tool call validation failed" en `chat-ia`.
