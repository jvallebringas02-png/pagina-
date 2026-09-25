> **Estado: PLANEADO, no implementado todavía.** Esta bitácora deja el diseño completo por escrito antes de tocar código, siguiendo el mismo criterio que `BITACORA-SESION-BOTONES-GUIA.md`.

# Bitácora — Separar la cuota de Groq entre el chat y las traducciones

Este documento retoma y profundiza el punto 3 de `BITACORA-TRADUCCION.md` ("Problema detectado: cuota de Groq compartida entre chat y traducciones"), con el diagnóstico completo de código y el plan de implementación.

**Fecha:** 25/09/2026

---

## 1. Contexto (resumen de lo que ya sabíamos)

`BITACORA-TRADUCCION.md` ya había identificado que el chat del Asistente y las traducciones comparten la misma cuenta de Groq (30 peticiones/minuto en el plan gratuito), y que esto puede agotarse en silencio -- las traducciones fallan sin avisar por qué, o el chat responde "No pude conectarme bien en este momento".

Esta sesión partió de un síntoma concreto: al usar "Ver mi zona" en búlgaro, las publicaciones del muro seguían en español (idioma original de publicación), sin traducir. Al investigar ese síntoma aparte (ver más abajo, no es el mismo bug que este documento resuelve) surgió la necesidad de revisar a fondo cuántos lugares del código llaman a Groq y por qué comparten cuota.

## 2. Diagnóstico -- los 5 lugares que llaman a `CONFIG.GROQ_API_URL`

Se buscó `CONFIG.GROQ_API_URL` en todo el repositorio. Aparece en **5 lugares**, no solo en las traducciones:

| Función | Archivo | ¿Es traducción? |
|---|---|---|
| Chat del Asistente (conversación) | `panel-usuario-3.js` | No -- es el chat en sí |
| `traducirTextoIA` | `panel-usuario-3.js` (línea ~1177) | **Sí** -- traduce productos (vía `TraduccionProductos`) y mensajes de chat entre usuarios |
| `traducirTextoInstitucional` | `institucional.js` (línea ~160) | **Sí** -- traduce Términos, Privacidad y Quiénes Somos |
| Revisor de seguridad al publicar (detecta teléfonos, pagos fuera de la plataforma) | `panel-usuario-3.js` (línea ~186) | No -- es moderación de contenido |
| Asistente del botón "Compartir" (interpreta a quién busca el usuario) | `panel-usuario-3.js` (línea ~1464) | No -- es interpretación de intención (NLU) |
| Búsqueda en internet/YouTube (`buscarEnInternetYVideo`) | `buscador.js` (línea ~196) | No -- y es donde vive el bug de "Tool call validation failed" ya anotado en `BITACORA-SESION-BOTONES-GUIA.md`, sección 7 |

**Conclusión clave:** mover *todo* lo que llama a Groq sería un cambio innecesariamente grande. El problema real (competencia de cuota) lo causan específicamente las traducciones, porque pueden dispararse en volumen (hasta ~96 peticiones de golpe en "Ver mi zona", como se calculó en la conversación de esta sesión) -- moderación, "Compartir" y búsqueda en internet son peticiones puntuales, una por acción del usuario, y no forman parte del problema.

## 3. Opciones consideradas (y por qué se descartaron las otras)

| Opción | Soporta quechua/aimara | Costo | Requiere tarjeta/cuenta nueva | Decisión |
|---|---|---|---|---|
| Google Cloud Translation API | Sí, confirmado (agregado en 2022) | $10 de crédito automático al mes (~500.000 caracteres), $20/millón de caracteres extra | Sí -- cuenta de Google Cloud con facturación activada | Descartada por ahora -- funciona, pero implica dinero real de por medio y una cuenta nueva más pesada de administrar |
| LibreTranslate (autoalojado) | No confirmado -- su motor (Argos Translate) probablemente no cubre lenguas indígenas americanas | Gratis, pero hay que hospedarlo | No, pero sí un servidor propio | Descartada -- no cubre los dos idiomas que más le importan al proyecto |
| Microsoft Azure Translator / Amazon Translate | No verificado en esta sesión | Tienen capa gratuita | Sí, cuenta nueva | Descartada por ahora -- no se confirmó cobertura de qu/ay, no vale la pena migrar sin esa certeza |
| **Segunda cuenta de Groq, API key separada solo para traducciones** | Sí -- mismo motor que ya se usa y ya está traduciendo qu/ay hoy | Gratis (mismo plan gratuito que ya se usa para el chat) | Sí, pero solo un correo nuevo para la cuenta de Groq, sin tarjeta | **Elegida** |

**Por qué se eligió la última:** no cambia el motor de traducción (mismo Groq, misma calidad que ya conocen), no requiere tarjeta ni facturación, y resuelve exactamente el problema (cuota compartida) sin agregar un proveedor nuevo que aprender ni mantener.

## 4. Cómo va a funcionar (flujo completo)

```
Traducción de un producto/documento legal
   │
   │  TraduccionProductos._traducirUno()  o  Institucional.traducirTextoInstitucional()
   │  → PanelUsuario.traducirTextoIA(texto, idioma)
   ▼
fetch(CONFIG.TRADUCCION_API_URL, { texto, idioma })
   ▼
Función Edge NUEVA "traducir-texto" (Supabase)
   │  lee el secreto GROQ_API_KEY_TRADUCCION -- cuenta de Groq #2
   ▼
api.groq.com  ←── cuenta #2, con SU PROPIO límite de 30/min

--- al mismo tiempo, sin interferir ---

Chat del Asistente (sin cambios)
   ▼
fetch(CONFIG.GROQ_API_URL, { messages: [...] })   ← la URL de siempre
   ▼
Función Edge "chat-ia" (la que ya existe, intacta)
   │  lee el secreto GROQ_API_KEY -- cuenta de Groq #1, la de siempre
   ▼
api.groq.com  ←── cuenta #1, con SU PROPIO límite de 30/min, aparte
```

Las dos cuentas son independientes para Groq -- que compartan el mismo sitio web no importa, cada API key tiene su propio contador de 30 peticiones/minuto. Ninguna clave de Groq viaja nunca al navegador; ambas viven como secretos dentro de Supabase, igual que ya vive la actual.

## 5. Plan detallado de implementación (código, antes de escribirlo de verdad)

### 5.1 Función Edge nueva en Supabase: `traducir-texto`

Recibe `{ texto, idioma }`, arma un prompt corto (mucho más corto que el `PROMPT_BASE` del chat -- beneficio extra, menos tokens por petición), llama a Groq con la key de la cuenta #2, y reenvía la respuesta tal cual (mismo formato `choices[0].message.content` que ya espera el cliente, así no hay que tocar el *parseo* de la respuesta en ningún lado).

```ts
// supabase/functions/traducir-texto/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY_TRADUCCION");
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELO = "llama-3.1-8b-instant"; // rápido y barato para textos cortos -- ajustar si la cuenta usa otro modelo

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { texto, idioma } = await req.json();
    if (!texto || !idioma) {
      return new Response(JSON.stringify({ error: "Falta 'texto' o 'idioma'." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          { role: "system", content: `Traduce el siguiente texto al ${idioma}. Responde solo con la traducción, sin explicaciones ni comillas.` },
          { role: "user", content: texto },
        ],
        temperature: 0.2,
      }),
    });

    const data = await groqResponse.json();
    return new Response(JSON.stringify(data), {
      status: groqResponse.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
```

### 5.2 `js/config.js` -- nueva URL

```js
var CONFIG = {
    GROQ_API_URL: "https://kqazkraxlqncfcwbbsps.supabase.co/functions/v1/chat-ia",
    TRADUCCION_API_URL: "https://kqazkraxlqncfcwbbsps.supabase.co/functions/v1/traducir-texto",
    SUPABASE_URL: "https://kqazkraxlqncfcwbbsps.supabase.co",
    SUPABASE_KEY: "sb_publishable_9xuQa7wsNT4LYCKHOGRDPQ_9eccAk-G"
};
```

### 5.3 `js/modules/panel-usuario-3.js` -- `traducirTextoIA` apunta al endpoint nuevo

```js
traducirTextoIA: async function(texto, idiomaDestinoCode) {
    var idiomaNombre = this.NOMBRES_IDIOMAS[idiomaDestinoCode] || 'inglés';
    try {
        var response = await fetch(CONFIG.TRADUCCION_API_URL, {
            method: 'POST',
            headers: { "Content-Type": "application/json", "apikey": MI_API_KEY, "Authorization": "Bearer " + MI_API_KEY },
            body: JSON.stringify({ texto: texto, idioma: idiomaNombre })
        });
        var data = await response.json();
        return data.choices && data.choices[0] ? data.choices[0].message.content.trim() : null;
    } catch (e) { return null; }
},
```

### 5.4 `js/modules/institucional.js` -- `traducirTextoInstitucional` apunta al endpoint nuevo

Mismo cambio de URL (`CONFIG.GROQ_API_URL` → `CONFIG.TRADUCCION_API_URL`); se revisará el cuerpo exacto de la petición al momento de editar, para adaptarlo al formato `{ texto, idioma }` sin romper el resto de la función (caché en Supabase, manejo de `qu`/`ay` sin traducir, etc. -- nada de eso cambia).

### 5.5 Lo que NO se toca

- Chat del Asistente (`panel-usuario-3.js`, la llamada principal) -- sigue en `CONFIG.GROQ_API_URL` / cuenta #1, sin cambios.
- Revisor de seguridad al publicar -- sigue en `CONFIG.GROQ_API_URL`, sin cambios.
- Asistente de "Compartir" -- sigue en `CONFIG.GROQ_API_URL`, sin cambios.
- Búsqueda en internet/YouTube -- sigue en `CONFIG.GROQ_API_URL`, sin cambios (su bug de "Tool call validation failed" es un problema aparte, ya anotado).
- `TAMANO_TANDA: 3` en `TraduccionProductos` -- se mantiene igual; sigue siendo útil aunque ahora tenga su propia cuenta, para no ráfaguear ni siquiera la cuota nueva de golpe.

## 6. Lo que tiene que hacer el usuario (fuera del código, no lo puede hacer Claude)

1. Crear una segunda cuenta gratuita en Groq (con un correo distinto al de la cuenta actual -- Groq no permite dos cuentas gratis con el mismo correo) y generar su API key.
2. En el dashboard de Supabase del proyecto, agregar un secreto nuevo: `GROQ_API_KEY_TRADUCCION`, con el valor de esa key.
3. Desplegar la función Edge `traducir-texto` (con la Supabase CLI, `supabase functions deploy traducir-texto`, o subiéndola desde el dashboard).

## 7. Validación después de implementar

1. `node --check` en los 2 archivos JS tocados (`panel-usuario-3.js`, `institucional.js`).
2. Probar una traducción de producto y una de Términos/Privacidad en un idioma distinto a español, confirmar que sigue funcionando igual que antes (mismo resultado visible, solo cambia por dentro qué cuenta de Groq se usó).
3. Confirmar en el dashboard de Groq que las peticiones de traducción aparecen en la cuenta #2, y las del chat en la cuenta #1 -- separación real, no solo teórica.

---

## 8. Próximo paso

Con el plan ya escrito acá, el siguiente paso es que el usuario cree la cuenta de Groq nueva y el secreto en Supabase (sección 6), y luego Claude escriba y aplique los cambios de código de la sección 5 (puntos 5.1 a 5.4).
