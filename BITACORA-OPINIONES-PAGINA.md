> **Estado: PREPARADO, SIN CONFIRMAR. El código pasa `node --check` y una prueba simulada en un navegador de laboratorio (40 comprobaciones). El SQL pasó el analizador de sintaxis de PostgreSQL, pero NO se ejecutó en Supabase, y nada se probó en la página real. Marcar cada punto cuando se haga.**

# Bitácora — Opinión sobre la página: nota del 1 al 10 y comentario, en un buzón privado

**Fecha:** 07/10/2026
**Continúa:** `BITACORA-MODERACION-FORMULARIOS.md` (sección 3.4, "Comentario sobre la página"), `BITACORA-FASE1-CONSTANCIA.md`
**Base del código:** el `institucional.js`, `i18n-institucional.js` e `index.html` del zip del 07/10 (los que ya tienen la constancia de la Fase 1). **No usar versiones anteriores de esos archivos**: borrarían la constancia.
**Alcance:** solo la página principal. No se toca ningún `panel-usuario-*.js` ni la función `chat-ia`.

---

## 1. Qué es y qué decidimos

Un formulario corto en el pie de la página, "Danos tu opinión":

| Decisión | Resultado |
|---|---|
| Qué pide | Un número del **1 al 10** (obligatorio) y un **comentario** (opcional, de 5 a 500 caracteres) |
| Qué NO pide | Nombre, correo, documento ni teléfono |
| Quién las lee | **Solo el administrador**, desde Supabase. Nada se publica |
| Si hay sesión iniciada | El servidor anota quién fue, con la sesión real (no se manda desde el navegador). Si es un visitante, queda vacío |
| Por qué números y no estrellas | En el celular, 10 estrellas quedan apretadas; 10 botones en 2 filas de 5 se tocan bien y funcionan igual en idiomas de derecha a izquierda |
| Escala | **1 a 10, y no se cambia después**: un 8 de 10 no equivale a un 4 de 5, y el historial dejaría de poder compararse |
| Publicación futura | Preparada pero apagada: la columna `permiso_publicar` existe y vale `false`; hoy el formulario no la usa |

## 2. Cómo funciona por dentro

- La persona abre el formulario desde el enlace del pie y elige un número. Aparece marcado en violeta.
- Al enviar, el navegador llama a la función **`registrar_opinion`** de Supabase (no inserta directo en la tabla), con tres datos: nota, comentario (o vacío) e idioma de la página.
- La función valida la nota y el largo del comentario, anota `auth.uid()` si hay sesión, y guarda.
- La tabla **`opiniones_pagina`** tiene la protección activada y **ninguna política**, y se le quitaron los permisos a `anon` y `authenticated`: ni visitantes ni usuarios con cuenta pueden leerla, escribirla ni borrarla desde la página. El administrador la lee en el panel de Supabase.
- Al enviar sin elegir número, el formulario avisa "Elige un número del 1 al 10" y no llama al servidor.
- El botón se desactiva mientras envía (un doble clic no manda dos opiniones). Si falla, se reactiva y la nota elegida se conserva para reintentar.
- Si la persona cambia de idioma con el formulario abierto, los textos se traducen **sin borrar** lo que ya escribió ni la nota elegida.

## 3. Archivos

| Archivo | Cambio |
|---|---|
| `opiniones-pagina.sql` (nuevo) | Tabla `opiniones_pagina`, reglas, protección y función `registrar_opinion`. Incluye consultas para leer las opiniones y el bloque "volver atrás" |
| `js/modules/institucional.js` | Funciones nuevas: `mostrarOpinion`, `elegirNota`, `enviarOpinion`, `retraducirPieOpinion`; rama nueva en `retraducirFormularioAbierto`. **0 líneas existentes quitadas**, 92 añadidas |
| `js/i18n-institucional.js` | 9 claves nuevas en 15 idiomas: `titulo_opinion`, `op_pregunta`, `op_min`, `op_max`, `ph_opinion`, `btn_enviar_opinion`, `exito_opinion`, `error_opinion`, `op_elige_nota`. Quechua y aimara **caen al español** (como en el resto de la página) |
| `index.html` | **Una línea**: el enlace `<li><a ... id="footerOpinion">Danos tu opinión</a></li>` en la columna "Empresa", después de "Comunícate con el Administrador". Si prefieres no reemplazar el archivo, se puede pegar a mano esa línea |

El texto del enlace del pie se traduce desde `institucional.js` (no se tocó `i18n.js`); antes de que cargue el idioma se ve "Danos tu opinión" en español.

## 4. Orden para aplicarlo

1. [ ] En Supabase, ejecutar el **PASO 1** de `opiniones-pagina.sql` y mirar que diga "Success". Después, en consulta nueva, el **PASO 2**.
2. [ ] Comprobar (consultas "COMPROBACIONES" al final del SQL): la tabla existe con RLS activado; no tiene políticas; la función solo la ejecutan `anon` y `authenticated`.
3. [ ] Subir a GitHub `js/modules/institucional.js`, `js/i18n-institucional.js` e `index.html`. Esperar a Vercel, Ctrl+F5.
4. [ ] Probar (sección 5).
5. [ ] Anotar en `BITACORA-SEGURIDAD.md` la tabla nueva y su protección.

## 5. Pruebas en la página real

- [ ] El enlace "Danos tu opinión" aparece en el pie y abre el formulario.
- [ ] Sin elegir número: aparece el aviso y no se envía nada.
- [ ] Elegir un 8 y enviar **sin comentario**: sale "Gracias por tu opinión." En Supabase hay una fila con `nota = 8`, `comentario` vacío, `idioma` correcto y `usuario_id` vacío.
- [ ] Elegir un 3 y escribir un comentario: la fila lleva el comentario sin espacios sobrantes.
- [ ] Un comentario de 3 letras: el navegador avisa que es muy corto (mínimo 5).
- [ ] **Con sesión iniciada** (si el formulario se ve; ver límite 6.1): la fila lleva el `usuario_id` de esa cuenta.
- [ ] Cambiar de idioma con el formulario abierto y texto escrito: se traduce sin borrar el comentario ni la nota.
- [ ] Idioma de derecha a izquierda (árabe): los números siguen yendo del 1 al 10 de izquierda a derecha y las etiquetas no rompen el diseño. En alemán, que las etiquetas largas no se corten.
- [ ] Error: apagar la red y enviar. Debe avisar y dejar reintentar.
- [ ] Desde la consola, sin la función: `supabase.from('opiniones_pagina').select()` debe devolver error o lista vacía, y un `insert` directo debe fallar.
- [ ] Los otros dos formularios (reclamo y contacto) siguen mostrando su constancia.

## 6. Límites y cosas que no hace

1. **Dónde se ve el formulario con sesión.** Como el Libro de Reclamaciones y el de contacto, se dibuja en la vista pública, y esa vista se oculta cuando alguien tiene la sesión iniciada. Es probable (no comprobado) que con sesión el formulario no se vea. Es el mismo punto pendiente de los otros dos formularios; conviene resolverlo para los tres a la vez cuando se revise el panel.
2. **Sin freno de envíos.** Cualquiera puede mandar muchas opiniones: no hay captcha, ni límite por persona ni por conexión. Como nada se publica ni alimenta ninguna cifra pública, el daño máximo es ensuciar el buzón (se limpia con una consulta). El captcha y el límite siguen pendientes para los tres formularios.
3. **Sin filtro de palabras.** El comentario no pasa por el filtro compartido que describe `BITACORA-MODERACION-FORMULARIOS.md` (todavía no existe). Se guarda como texto; cuando se muestre en un panel, **siempre con `escHtml`**.
4. **El comentario no se traduce.** Se lee en el idioma en que se escribió. El campo `idioma` guarda el idioma **de la página** en ese momento, no necesariamente el del comentario.
5. **No se publica nada.** `permiso_publicar` queda en `false` y no hay casilla. Una opinión recogida ahora **no** se podrá publicar después (no hubo permiso). Si algún día se decide publicar, se agrega la casilla y solo valen las opiniones nuevas.
6. **No hay panel de administrador.** Se leen desde Supabase (consultas al final del SQL).
7. **Privacidad.** Si la persona tiene sesión se guarda su `usuario_id`; no se guarda IP, correo ni nombre. La política de privacidad debería mencionar este buzón. Falta definir cuánto tiempo se conservan (propuesta: archivar a los 90 días, borrar a los 12 meses).
8. **Traducciones sin revisión nativa**, como el resto de la página. Quechua y aimara en español.
9. **No hay detección de intención en el asistente**: si alguien le escribe "quiero dar mi opinión", no abre el formulario (sí lo hace con reclamos y con contacto).

## 7. Cómo volver atrás

- **Código:** volver a subir los tres archivos anteriores del repo (los de la Fase 1). El pie queda sin el enlace.
- **Base de datos:** bloque "VOLVER ATRÁS" al final de `opiniones-pagina.sql` (**borra** las opiniones guardadas; si ya hay opiniones que quieras conservar, exportarlas antes desde Supabase).
- La página no depende de esta tabla: si se borra, solo falla el formulario de opinión.

## 8. Decisiones abiertas

- [ ] **Cuánto tiempo se conservan** las opiniones y quién las revisa (y cada cuánto).
- [ ] **Captcha y límite de envíos** en los tres formularios (opinión, contacto, reclamos).
- [ ] **Filtro de palabras** compartido (ver bitácora de moderación): ¿se aplica también aquí?
- [ ] **¿Se publicarán algún día?** Si sí: casilla de permiso, nombre para mostrar, vista pública solo con las aprobadas, traducción de cada opinión y criterio de aprobación por calidad (no solo las positivas; conviene confirmarlo con un abogado).
- [ ] **Una opinión por cuenta**: hoy no hay límite; se puede agregar un índice único si se quiere.
- [ ] **Sugerir "¿Qué podemos mejorar?"** cuando la nota sea baja (4 o menos): no incluido por ahora para mantener el formulario simple.

## 9. Qué se probó y qué no

**Probado (navegador simulado, 40 comprobaciones):** 10 botones en orden; sin campos personales; comentario opcional de 5 a 500; aviso al enviar sin nota; marcado de un solo número; valores inválidos ignorados; envío con y sin comentario con los argumentos exactos (`p_nota`, `p_comentario`, `p_idioma`); mensaje de gracias; error y reintento (botón y nota conservados); doble clic; cambio de idioma sin perder lo escrito (italiano, alemán, árabe, quechua); traducción del pie con y sin formulario abierto; la escala va de izquierda a derecha en árabe; los formularios de contacto y reclamos siguen generando su constancia.
**Probado solo en sintaxis:** el SQL (analizador de PostgreSQL: 11 sentencias y la función, sin errores). **No se ejecutó.**
**No probado:** el SQL contra Supabase real; la función con `auth.uid()` en una sesión real; el aspecto en celular; la revisión nativa de los textos; el comportamiento con sesión iniciada.

## 10. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 07/10/2026 | Diseño: nota 1-10 + comentario opcional, buzón privado, sin publicar | Aprobado en la conversación |
| 07/10/2026 | SQL, código y 9 textos en 15 idiomas escritos | `node --check` OK; prueba simulada 40/40; SQL con sintaxis válida; falta ejecutar y subir |
