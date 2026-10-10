> **Estado: CONSTRUIDO COMO BORRADOR, SIN CONFIRMAR. El código de la página y el SQL están escritos; el código pasa `node --check` y una prueba simulada (29 comprobaciones). El SQL NO se ejecutó (no hay Postgres disponible) y nada se probó en la página real ni en Supabase. Ver la sección 12. Marcar cada punto cuando se haga.**

# Bitácora — Seguimiento del reclamo y de la atención con el administrador

**Fecha:** 10/10/2026
**Continúa:** `BITACORA-FASE1-CONSTANCIA.md` (código + constancia, que es la base de esto),
`BITACORA-LIBRO-RECLAMACIONES.md`, `BITACORA-MODERACION-FORMULARIOS.md`
**Archivos que se tocarían:** `js/modules/institucional.js` (pantalla nueva), `js/i18n-institucional.js`
(textos), `index.html` (enlace en el pie de página), una función nueva en Supabase (SQL).
**Método:** lectura del zip de la página del 09/10. Se buscó en todo `js/` e `index.html` cualquier
rastro de consulta o seguimiento (`seguimiento`, `estado_tramite`, `respuesta_administrador`,
`consultar`): **no hay ninguno**. No se ejecutó nada contra Supabase.

---

## 1. Punto de partida: qué hay hoy

Al enviar un reclamo o un mensaje al administrador, la persona recibe un **código** y una
**constancia imprimible** (`mostrarConstancia`, `imprimirConstancia` en `institucional.js`). Ahí
termina el recorrido:

| | Reclamo | Contacto con el administrador |
|---|---|---|
| Documento que recibe | "Constancia de reclamo" | "Ticket de atención" |
| Datos que lleva | tipo, nombre, documento, correo, teléfono, producto, monto, detalle, solución pedida | nombre, correo, mensaje |
| ¿Puede consultar cómo va? | **No** | **No** |
| ¿Puede recuperar el código si lo pierde? | **No** | **No** |

La constancia solo prueba que el envío ocurrió. No prueba que alguien lo haya leído.

**Una promesa sin respaldo:** el mensaje de éxito del contacto dice *"Te responderemos a tu correo
pronto"*. Hoy no hay panel de administrador, lista de pendientes ni aviso de mensajes nuevos. Ya
estaba anotada en `BITACORA-CHAT-IA-Y-ASISTENTE.md` (pendiente 8).

**Dependencia crítica:** todo esto se apoya en la Fase 1, y la Fase 1 sigue **sin confirmar**: su
SQL no se ejecutó, y el archivo `fase1-constancia.sql` **no viene en el zip** del 09/10.

---

## 2. Qué se quiere (la pantalla)

Un enlace **"Seguimiento de mi reclamo"** en el pie de página (bajo Transparencia). La persona
escribe su código y una segunda clave, y ve:

```
Seguimiento de tu reclamo
Código:      LR-2026-000007-K7Q2
Registrado:  08 oct 2026, 23:41
Tipo:        Reclamo
Estado:      Respondido

Respuesta del administrador (09 oct 2026, 10:15)
"..."
```

Si nadie respondió todavía: **"Pendiente. Aún no hay respuesta."**

El asistente también la abre si alguien escribe "¿cómo va mi reclamo?", igual que ya abre los
formularios.

---

## 3. Datos

La tabla `libro_reclamaciones` ya tiene las columnas `estado_tramite`, `respuesta_administrador` y
`fecha_respuesta` (según `BITACORA-LIBRO-RECLAMACIONES.md`). La fecha y hora del envío también
existe: la constancia ya la devuelve (`res.fecha`).

**Se muestra:** código, fecha y hora del envío, tipo, estado, respuesta y fecha de la respuesta.

**Nunca se muestra:** documento, correo, teléfono, domicilio ni el detalle del reclamo. Esos datos
ya están en el PDF que la persona guardó, y la respuesta del administrador podría citarlos.

**Pendiente de comprobar en la base real:** si `estado_tramite` es obligatorio o tiene valores
permitidos fijos. El Paso 0 de `fase1-constancia.sql` (solo lectura) lo revisa; hay que ejecutarlo
antes de definir los estados de la sección 5.

---

## 3.1 ¿Y el contacto con el administrador?

Se ve igual, pero la tabla de mensajes (`mensajes_contacto`) puede **no tener** columnas de estado
ni de respuesta. Hay que revisarlo en Supabase antes de prometer seguimiento ahí.

---

## 4. Cómo entra la persona (las dos llaves)

La respuesta del administrador puede contener datos personales. Si bastara el código, cualquiera
que lo vea (por ejemplo, en una foto del PDF) leería la respuesta. Por eso se pide una segunda clave:

| Caso | Segunda clave propuesta | Por qué |
|---|---|---|
| Reclamo | Número de documento | Ya se pide en el formulario |
| Contacto con el administrador | Correo | No se pide documento, y no conviene empezar a pedirlo |

**El código de hoy es débil para esto.** Termina en 4 caracteres al azar (por ejemplo
`LR-2026-000007-K7Q2`); la parte numérica es una secuencia que cualquiera puede intuir. La
Fase 1 ya lo advierte: *"si se agrega consulta por código, hace falta un token más largo"*.

Reglas para que no se pueda adivinar:
- La respuesta ante un error es **la misma** si el código no existe o si la segunda clave no
  coincide ("No encontramos un registro con esos datos"). Así nadie descubre qué códigos existen.
- Límite de intentos fallidos por código y por persona.
- La consulta se hace por una **función de Supabase** que devuelve solo los campos de la sección 3.
  La tabla sigue sin poder leerse desde la página (así quedó después del arreglo del
  `07/10`: no se debe volver a abrir esa lectura).

---

## 5. Cómo responde el administrador (mientras no haya panel)

1. Entra a Supabase → Table Editor → `libro_reclamaciones`.
2. Abre la fila del reclamo (busca por `codigo_reclamo`).
3. Escribe `respuesta_administrador`, pone `fecha_respuesta` y cambia `estado_tramite`.

Estados propuestos (a confirmar tras el Paso 0): **Pendiente → En revisión → Respondido → Cerrado**.

El texto que escribe el administrador pasa por `escHtml` al mostrarse, igual que todo lo demás
(ver `BITACORA-XSS-TARJETAS.md`): aunque lo escriba una persona de confianza, no se pega sin
escapar.

---

## 6. Piezas técnicas (sin código todavía)

1. [ ] Función de Supabase `consultar_seguimiento(codigo, clave)`: devuelve solo los campos de la
       sección 3; mensaje de error idéntico para "no existe" y "clave incorrecta"; límite de intentos.
2. [ ] Pantalla en `institucional.js` (misma forma que las otras: `mostrarFormularioEnMuro`) con
       el formulario de consulta y la tarjeta de resultado. Escapar todo con `escHtml`.
3. [ ] Enlace "Seguimiento de mi reclamo" en `index.html` (pie, columna Transparencia) y en el
       diccionario del pie.
4. [ ] Textos en `i18n-institucional.js`, con la regla de siempre: quechua y aimara caen a español
       hasta que los revise un hablante nativo.
5. [ ] Que el asistente abra la pantalla con "¿cómo va mi reclamo?".
6. [ ] Si se acuerda un token más largo: cambiar la generación del código en la función
       `registrar_reclamo`. Los códigos ya entregados (de 4 caracteres) seguirían existiendo y solo
       podrían consultarse con documento, no solo por código.

---

## 7. Orden (nada de esto va antes de lo anterior)

1. [ ] **Ejecutar y probar la Fase 1** en Supabase real (reclamo y contacto devuelven código y
       constancia). Conseguir el archivo `fase1-constancia.sql`, que no está en el zip.
2. [ ] Ejecutar el Paso 0 (solo lectura) y anotar cómo es `estado_tramite` y qué columnas tiene
       `mensajes_contacto`.
3. [ ] Decidir la sección 8.
4. [ ] Recién entonces, construir las piezas de la sección 6.

---

## 8. Decisiones abiertas

- [ ] **¿Quién va a leer y responder?** Si hoy nadie, la frase *"Te responderemos pronto"* hay que
      cambiarla por *"Recibimos tu mensaje"*, y el seguimiento mostraría siempre "Pendiente".
- [ ] **Alcance:** ¿seguimiento solo para reclamos, o también para el contacto con el administrador?
- [ ] **Estados** que se muestran (sección 5).
- [ ] **Plazo de respuesta:** ¿se muestra? La bitácora de la Fase 1 cita 15 días hábiles
      (Ley 31435) pero la marca como dato de fuentes secundarias. **No ponerlo hasta confirmarlo con
      INDECOPI o un abogado.**
- [ ] **Segunda clave** (sección 4) y **largo del código** nuevo.
- [ ] **Idioma de la respuesta:** el administrador escribe en un idioma; la persona puede estar
      usando la página en otro. ¿Se traduce con IA (gasta cuota) o se muestra tal cual?
- [ ] **Política de privacidad:** debe decir que se guardan documento, correo y teléfono, y que la
      respuesta se consulta con código y clave.
- [ ] **Conservación:** la norma que encontró la Fase 1 indica 2 años desde el registro. Ninguna
      limpieza de Supabase debe tocar `libro_reclamaciones`.
- [ ] **Copia por correo:** sigue fuera de esta fase (necesita un servicio de envío).

---

## 9. Cómo se probaría, una vez construido

1. Enviar un reclamo real y consultar con código + documento: debe mostrar "Pendiente".
2. Responder desde Supabase y volver a consultar: debe mostrar la respuesta, su fecha y el estado.
3. Consultar con el código correcto y un documento equivocado: debe salir el **mismo** mensaje que
   con un código inexistente.
4. Equivocarse varias veces seguidas: debe bloquear los intentos por un rato.
5. Revisar en F12 → Red que la respuesta de la función **no incluya** documento, correo, teléfono ni
   detalle.
6. Escribir en la respuesta del administrador `<b>prueba</b>`: debe verse como texto, sin negrita.
7. Con una cuenta normal, ejecutar `await supabase.from('libro_reclamaciones').select('*')`:
   debe seguir devolviendo vacío o error (la tabla no se debe volver a abrir).
8. Escribir "¿cómo va mi reclamo?" al asistente: debe abrir la pantalla.

## 10. Cómo volver atrás

Quitar el enlace del pie (`index.html`), subir los archivos anteriores del repo, y en Supabase: `drop function if exists obtener_seguimiento(text, text);` y `drop table if exists seguimiento_intentos;`. Las columnas añadidas a `mensajes_contacto` y la Fase 1 no se tocan.

## 11. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 10/10/2026 | Diseño del seguimiento y lista de decisiones | Solo documento. Sin código, sin SQL, sin pruebas |
| 10/10/2026 | Construido como borrador: `seguimiento.sql`, pantalla en `institucional.js`, enlaces en formularios, constancia y pie, textos | `node --check` OK; prueba simulada 29/29 (y 30/30 de la constancia sin cambios); falta SQL, subida y prueba real |

---

## 12. Qué se construyó (borrador del 10/10/2026)

### 12.1 Archivos

| Archivo | Cambio |
|---|---|
| `seguimiento.sql` | Cierra la función vieja `obtener_seguimiento(text)`; añade `estado_tramite`, `respuesta_administrador` y `fecha_respuesta` a `mensajes_contacto`; tabla `seguimiento_intentos` (cerrada); nueva `obtener_seguimiento(p_codigo, p_clave)`. |
| `js/modules/institucional.js` | Pantalla `mostrarSeguimiento` / `consultarSeguimiento` / `htmlSeguimiento`; `iniciarSeguimiento`; enlace dentro de los dos formularios y dentro de la constancia; retraducción al cambiar de idioma. |
| `js/i18n-institucional.js` | 24 claves nuevas en **español e inglés**. Los demás idiomas (incluido quechua y aimara) caen al **español** hasta que se traduzcan. |
| `js/i18n.js` | Texto del enlace del pie (`footer_seguimiento`) en 15 idiomas. |
| `index.html` | Enlace "Seguimiento de mi reclamo o mensaje" en el pie, columna Transparencia. |

### 12.2 Dónde aparece el seguimiento
1. Arriba del formulario del **Libro de Reclamaciones** ("¿Ya enviaste uno? Consulta cómo va").
2. Arriba del formulario de **Comunícate con el Administrador**.
3. Dentro de la **constancia**, justo después de enviar (con el código ya escrito).
4. En el **pie de página**.

### 12.3 Cómo se decidió (según las decisiones de la sección 8; confirmar cada una)
- **Alcance:** reclamos **y** mensajes al administrador.
- **Segunda clave:** número de documento (reclamo) o correo (mensaje).
- **Estados que reconoce:** PENDIENTE, EN_REVISION, RESPONDIDO, CERRADO (otro valor se muestra tal cual, escapado).
- **Límite de intentos:** 5 fallos por código y 20 por persona (IP) cada hora; 0,4 s de espera tras cada fallo.
- **Qué devuelve la función:** resultado, código, tipo, subtipo, estado, fecha de registro, fecha de respuesta y respuesta. **Nunca** nombre, documento, correo, teléfono ni lo que escribió la persona (se eliminó el "resumen" de la versión anterior).
- **Largo del código:** no se cambió (4 caracteres al azar). Con segunda clave y límite de intentos, ya no es el secreto.

### 12.4 Qué se probó y qué no
**Probado (simulado en Node, 29 comprobaciones):** enlaces en los dos formularios, la constancia y el pie; código prellenado y escapado; llamada con `p_codigo`/`p_clave` normalizados (mayúsculas, sin espacios); estado traducido (es/en); respuesta del administrador escapada (XSS); no se muestran datos personales aunque el servidor los enviara; sin respuesta → "Pendiente. Aún no hay respuesta."; no encontrado, demasiados intentos, error y respuesta vacía; botón reactivado; retraducción de la pantalla abierta.
**No probado:** el SQL (nunca se ejecutó); la función contra Supabase real (nombres de columnas, `to_jsonb`, lectura de `request.headers`, `pg_sleep`); el límite de intentos; la pantalla en navegadores reales; los textos nuevos con hablantes nativos.

### 12.5 Límites y riesgos conocidos
- **Bloqueo por terceros:** quien conozca un código puede agotar sus 5 intentos y bloquear la consulta de esa persona por una hora (es el precio de frenar la fuerza bruta).
- **Huella de IP:** se guarda un resumen (md5) de la IP en `seguimiento_intentos` durante 2 días. Hay que decirlo en la política de privacidad. Las IP compartidas (oficinas, redes móviles) pueden consumir el límite de otros.
- **Quien tenga documento y código** (por ejemplo, alguien que vio el PDF) puede ver la respuesta del administrador.
- **Respuesta en un solo idioma:** se muestra tal cual la escribió el administrador.
- **Promesa del mensaje de contacto** ("Te responderemos a tu correo pronto"): sigue pendiente decidir quién responde; si nadie, cambiarla.
- Si la columna de la fecha de registro de `libro_reclamaciones` no se llama `created_at`, `creado_en`, `fecha_registro` ni `fecha_reclamo`, la fecha saldrá vacía.

### 12.6 Orden para aplicarlo
1. [ ] Si ya ejecutaste la versión anterior de `seguimiento.sql`: `drop function if exists obtener_seguimiento(text);` **primero** (es la que se podía consultar solo con el código).
2. [ ] Comprobar que la Fase 1 funciona (un reclamo de prueba devuelve código y constancia).
3. [ ] Ejecutar el Paso 1 de `seguimiento.sql` (solo lectura) y revisar columnas y restricciones.
4. [ ] Ejecutar los Pasos 2 a 4 **en una copia** del proyecto; probar con el Paso 5.
5. [ ] Ejecutarlos en el proyecto real.
6. [ ] Subir los 4 archivos de la página a GitHub; esperar a Vercel; Ctrl+F5.
7. [ ] Probar la sección 9, más: el seguimiento desde el formulario, desde la constancia y desde el pie.
8. [ ] Con una cuenta normal, comprobar que `supabase.from('libro_reclamaciones').select('*')` siga devolviendo vacío o error.

### 12.7 Pendientes
- [ ] Que el asistente abra la pantalla con "¿cómo va mi reclamo?" (no hecho).
- [ ] Traducir los 24 textos a los otros 13 idiomas cuando el texto esté definitivo.
- [ ] Decidir quién lee y responde los mensajes, y el plazo de respuesta (no ponerlo sin confirmar).
- [ ] Panel de administrador para responder (hoy se responde desde Supabase, sección 5).
- [ ] Actualizar la política de privacidad (documento, correo, huella de IP).

### 12.8 Resultado de la consulta de columnas (10/10/2026)

Lo que mostró el CSV de `information_schema.columns` y lo que se hizo:

| Hallazgo | Consecuencia |
|---|---|
| `mensajes_contacto.codigo` existe (`varchar(40)`) | La Fase 1 sí se ejecutó. |
| `mensajes_contacto` ya tiene `estado_tramite`, `respuesta_administrador` y `fecha_respuesta` | Se ejecutó la Parte 1-A de la **versión anterior** de `seguimiento.sql`; por tanto la función vieja `obtener_seguimiento(text)` pudo haberse creado. Hay que **borrarla** y comprobar con `pg_proc`. |
| `mensajes_contacto.codigo_contacto` (`varchar(30)`) | Sobra: la primera versión del archivo la inventó. Comprobar que está vacía y que ningún disparador arma códigos `CA-` antes de borrarla. |
| `numero_documento` y `telefono` miden `varchar(20)`, `correo_electronico` `varchar(100)` | La función `registrar_reclamo` aceptaba hasta 40, 40 y 200: con textos largos fallaba el INSERT. **Corregido** en `fase1-ajuste-largos.sql` y con `maxlength` en los campos de la página. |
| `fecha_registro` y `fecha_respuesta` de `libro_reclamaciones` son `timestamp without time zone` | La página las interpretaba como hora local. **Corregido** en `_fechaPantalla` (se leen como UTC). Supone que Supabase guarda en UTC; confirmar con un reclamo de prueba. |
| `codigo_reclamo` mide `varchar(30)` | Sobra espacio para los 19 caracteres del código. |
| El CSV no trae `is_nullable` ni `column_default` | Falta saber si `estado_tramite` de `libro_reclamaciones` es obligatorio sin valor por defecto (el INSERT de `registrar_reclamo` no lo llena). |

