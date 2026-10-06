> **Estado: SOLO PLAN. No se escribió ni se cambió código. Falta ver el código real de las funciones `chat-ia` y `traducir-texto` (no están en el repositorio) y decidir los puntos de la sección 5.**

# Bitácora — Límite de uso y sesión en `chat-ia` y `traducir-texto`

**Fecha:** 06/10/2026
**Continúa:** `BITACORA-SEGURIDAD.md` (pendiente "revisar que `chat-ia` y `traducir-texto` exijan sesión y tengan límite de uso") y `BITACORA-XSS-PANELES.md` (sección 5, "Pendientes")
**Archivos de la página que llaman a estas funciones** (solo lectura, no se tocan en este plan): `js/config.js`, `js/modules/ai-service.js`, `js/modules/buscador.js`, `js/modules/contenido-info.js`, `js/modules/institucional.js`, `js/modules/panel-usuario-3.js`

---

## 1. Qué se encontró

**Cómo se traduce la página principal** (aclarado el 06/10):

| Qué | Cómo se traduce | ¿Usa IA? |
|---|---|---|
| Menús, botones, saludo del asistente, pie de página | Diccionarios dentro del código (`i18n.js`, `i18n-institucional.js`, `i18n-auth.js`) | No |
| Muro informativo, Términos y Privacidad, productos de usuarios, mensajes del chat | Funciones de Supabase (`chat-ia` y `traducir-texto`) con Groq; el resultado se guarda en la columna `traducciones` y las visitas siguientes lo leen de ahí | Sí |
| Quechua y aimara | Solo diccionario; la IA no se usa a propósito (Groq los traduce mal) | No |

**El problema.** El asistente y la traducción de contenido dependen de la misma cuenta gratuita de Groq:

- Si se agota la cuota, **fallan los dos a la vez**. Lo ya guardado en caché sigue viéndose; lo nuevo no se traduce.
- La cuota gratuita de Groq es de 8000 tokens por minuto. Con 2 o 3 mensajes seguidos ya se agota.
- `chat-ia` y `traducir-texto` **no exigen sesión ni tienen límite de uso** (según `BITACORA-SEGURIDAD.md`). Cualquiera que abra la página tiene la clave pública (anon) de Supabase, así que podría gastar la cuota a propósito y dejar sin asistente ni traducción a todos.
- La página principal es pública y el invitado puede usar el asistente. Por eso **no se puede exigir sesión a todo**.

**Por qué se agota tan rápido** (revisión previa del `index.ts` de `chat-ia`, modelo `openai/gpt-oss-120b` vía Groq):

- El `PROMPT_BASE` pesa unos 3400-3500 tokens y se reenvía completo en cada llamada a Groq.
- Un solo turno puede hacer hasta 3 llamadas: decidir la herramienta, redactar la respuesta con el resultado, y un reintento si el JSON sale inválido. Eso suma unos 10500 tokens de prompt en un turno.

**Bug relacionado.** El error 400 "Tool call validation failed" en `buscar_en_internet` y `buscar_videos_youtube`. Parece venir de Groq rechazando la llamada cuando el modelo arma mal los argumentos (por ejemplo, sin el campo `consulta`, que es `required`). Hoy el código solo reenvía el error de Groq tal cual.

---

## 2. El plan (de lo más urgente a lo menos)

### Paso 1 — Rotar las claves y revisar `api_keys_config`
- Rotar las claves guardadas en `api_keys_config` (Groq y otras).
- Comprobar que esa tabla **no se pueda leer con la clave pública** (revisar sus políticas RLS). Si hoy se pudiera leer, es lo más grave de este plan.
- Tener una segunda clave o proveedor de respaldo para cuando Groq responda 429.

### Paso 2 — Límite de uso
- Tabla nueva en Supabase que cuente las llamadas por persona y por hora: con sesión, por su id; invitado, por su IP.
- Antes de llamar a Groq, la función consulta el contador. Si se pasó, responde un mensaje claro ("llegaste al límite, intenta más tarde") **sin gastar cuota**.
- Límite bajo para invitados y más alto para quien tiene sesión (números por decidir, sección 5).

### Paso 3 — Gastar menos cuota por mensaje
- Acortar el `PROMPT_BASE`.
- Poner tope al largo del mensaje y del historial que se envía.
- Quitar o limitar el reintento de formato cuando el JSON sale inválido.
- Para el error 400: dar a la IA un schema más claro y, si aun así falla, mostrar un mensaje amable en vez del error de Groq.

### Paso 4 — Sesión donde corresponde
- `chat-ia`: sigue abierta a invitados, con el límite del paso 2, y verificando la sesión de verdad en el servidor (leer el token del usuario, no solo la clave anon).
- `traducir-texto`: exigir sesión. El invitado no la necesita porque lo ya traducido se lee del caché.
- Lo que hoy traduce un invitado la primera vez (muro, Términos y Privacidad) pasa a una tarea que lanza el administrador una vez por idioma; el invitado solo lee lo guardado.

**Orden recomendado:** paso 1, luego 2 y 3 juntos (son en `chat-ia`), y al final el 4.

---

## 3. Lo que NO se sabe todavía

- **El código de las funciones.** `chat-ia` y `traducir-texto` no están en el repositorio (pendiente de `BITACORA-TRADUCCION.md`: "guardar las funciones Edge en el repo"). Este plan es un diseño; hay que verlo contra el `index.ts` real antes de cambiar nada.
- **Quién hace qué.** Hay comentarios que se contradicen: `contenido-info.js` (línea 5) dice que pide la traducción a `chat-ia`, y otro comentario (línea 79) dice que ahora usa el endpoint liviano dedicado. Hay que confirmar en el `index.ts` qué función traduce cada cosa.
- **Las políticas RLS de `api_keys_config`.** No se revisaron.
- **Cuántas cuentas y qué volumen reales hay.** Sin eso, los números del límite son una suposición.

---

## 4. Lo que NO se cambia en este plan

- Ningún archivo de la página (`js/`, `index.html`). El cambio es en Supabase y en las dos funciones.
- Los diccionarios de traducción ni el comportamiento de quechua y aimara.
- La lógica del caché de traducciones (columna `traducciones`).

---

## 5. Decisiones pendientes

- [ ] ¿Cuántos mensajes por hora para invitados y para usuarios con sesión?
- [ ] ¿La IP se guarda tal cual o con hash? (Si se guarda, hay que declararlo en la política de privacidad; ya está como pendiente en `BITACORA-SEGURIDAD.md`.)
- [ ] ¿Hay proveedor de respaldo a Groq, o solo una segunda clave?
- [ ] ¿La traducción masiva por idioma la lanza un botón del panel de administrador (depende de que exista `es_admin`) o un script manual?

---

## 6. Pendientes

- [ ] Subir los dos `index.ts` (`chat-ia` y `traducir-texto`) y guardarlos en el repo (`supabase/functions/...`).
- [ ] Paso 1: rotar claves y revisar RLS de `api_keys_config`.
- [ ] Paso 2: tabla de contador y chequeo antes de llamar a Groq.
- [ ] Paso 3: acortar `PROMPT_BASE`, topes de largo, manejo del error 400.
- [ ] Paso 4: sesión verificada en el servidor, `traducir-texto` con sesión, traducción masiva por administrador.
- [ ] Probar con 3 cuentas: sin sesión, la propia y otra distinta; y forzar el límite para ver el mensaje.

---

## 7. Cómo aplicarlo (cuando se escriba el código)

- Probar primero en una **copia del proyecto de Supabase**, como pide `BITACORA-SEGURIDAD.md`.
- Desplegar una función a la vez y revisar Supabase > Funciones > Logs después de cada una.
- **Revertir** si algo falla: volver a desplegar la versión anterior del `index.ts` (por eso conviene tenerlos en el repo). Las claves rotadas hay que actualizarlas también donde se usen.

---

## 8. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 06/10/2026 | Se aclaró cómo se traduce la página y se armó este plan | Solo diseño; sin código ni cambios en Supabase |
