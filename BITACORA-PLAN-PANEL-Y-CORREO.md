# Bitácora — Correo de Supabase, avisos del registro y plan del panel de usuario

**Fecha:** 02/10/2026 (actualizada el 04/10/2026, versión 2)
**Proyecto:** remarket-db (`pueba02.vercel.app`)
**Para retomar en cualquier conversación:** traer este archivo junto con `BITACORA-SEGURIDAD.md` y, si se trabaja la búsqueda de personas, `BITACORA-BUSQUEDA-PERSONAS.md`. Seguir desde la sección 4.

---

## 1. Qué se resolvió hoy

### 1.1 Los correos no llegaban (link mágico, confirmación)
- **Causa real:** el proyecto tenía un SMTP personalizado activado apuntando a `sandbox.smtp.mailtrap.io` con credenciales inválidas (error `535 5.7.0 Invalid credentials` en los logs). Además, el sandbox de Mailtrap nunca entrega a bandejas reales.
- **No era** el límite de Supabase ni un error del código (`signInWithOtp` está bien usado).
- **Arreglo:** Supabase → Authentication → Emails → SMTP Settings → se apagó "Enable custom SMTP". Ahora se usa el correo integrado de Supabase.
- **Resultado probado:** el link mágico llegó a Outlook en segundos y al abrirlo la página reconoció la sesión.
- **Efectos de apagarlo:** límite de **2 correos por hora**, plantillas en inglés, y no se pueden editar plantillas hasta tener un SMTP real.

### 1.2 Registro de pruebas
- Con "Confirm email" desactivado, una cuenta nueva entra directo y no se manda correo. Sirve para pruebas; **no dejarlo así al publicar** (cualquiera puede registrar un correo ajeno).
- Una cuenta de prueba anterior quedó creada y confirmada en Supabase, pero el login fallaba por contraseña distinta; no era un problema de confirmación.

### 1.3 Aviso del registro que no se veía
- **Causa:** el recuadro `authAlert` está arriba del modal, el formulario de registro es largo y el modal tiene scroll interno, así que el aviso quedaba fuera de vista y se ocultaba a los 5 s.
- **Archivo:** `js/modules/auth-modales.js`, función `showAuthAlert`.
- **Cambio:** hace `scrollIntoView` hasta el aviso, los errores duran 8 s, y un temporizador nuevo cancela el anterior.

### 1.4 Mensaje "correo ya registrado" traducido
- **Archivos:** `js/modules/auth-modales.js` (en el `catch` de `registerUser`) y `js/i18n-auth.js`.
- **Cambio:** si Supabase responde "already registered", se muestra la clave nueva `auth_err_correo_existe` en lugar de "Error al registrar: User already registered".
- **Idiomas:** es, en, pt, fr, de, it, ru, zh, ja, ko, ar, hi, nl, tr, bg. Quechua y aimara **sin clave a propósito** (decisión del 29/09: no inventar textos sin revisión de un hablante nativo); caen al español.
- **Probado en la página:** español y francés. Pendiente probar árabe, chino y ruso.
- Las traducciones fuera del español son de la IA; conviene que un hablante las revise.

### 1.5 Avances del 04/10/2026 (fotos de perfil)

**Problema:** las fotos de perfil y portada no se guardaban ni se veían. Las columnas `foto_perfil` y `foto_portada` **nunca existieron** en la tabla `usuarios`; el código subía el archivo al almacenamiento, pero fallaba en silencio al guardar la dirección en el perfil.

**Datos (Supabase) -- ejecutado y confirmado "Success":**
- Se agregaron las columnas `foto_perfil` y `foto_portada` (texto) a `usuarios`.
- Se recreó la vista `perfiles_publicos` con las dos columnas nuevas, para que la foto se vea también en el perfil de otra persona.
- **Error que apareció al principio (`42P16: cannot change name of view column "localidad_id" to "foto_perfil"`):** con `create or replace view` las columnas nuevas solo se pueden agregar **al final** de la lista; no se pueden poner en medio. Orden final de la vista: `id, nombres, apellidos, localidad_id, categoria, pais, nombre_usuario, created_at, foto_perfil, foto_portada`.
- Archivo del SQL: `fotos-perfil-columnas.sql` (versión corregida con las columnas al final, dentro de `begin; ... commit;`).

**Funciones (código) -- subido a GitHub y probado el 04/10 (funcionó):**
- `js/modules/panel-usuario-2.js`:
  - Nueva `_validarImagen`: acepta solo JPG, PNG, WEBP o GIF y máximo 5 MB; si no cumple, muestra aviso y no sube.
  - `subirFotoPerfil` y `subirPortada` ahora revisan el error al guardar la URL. Antes lo ignoraban y igual decían "actualizada".
  - Consultas a `perfiles_publicos` en la lista de compartir y en comentarios ahora piden `foto_perfil`.
- `js/modules/panel-usuario-1.js`: la vista previa de una persona pide `foto_perfil`.
- `js/modules/panel-usuario-3.js`: buscar personas y compartir piden `foto_perfil`.
- Total: son cambios de una línea en cada consulta (se agregó `, foto_perfil` al final de la lista de columnas); no se tocó nada más. El perfil de otra persona usa `select('*')` sobre la vista, así que recibe la foto sin cambios.

**Pruebas hechas tras subir los 3 archivos (todas bien):**
1. Subir foto de perfil propia; recargar y comprobar que sigue.
2. Entrar con otra cuenta, abrir ese perfil y ver la foto.
3. Buscar a la persona y ver su foto en los resultados.
4. Comentar en una publicación y ver la foto junto al comentario.
5. Subir un archivo que no sea imagen (por ejemplo un PDF): debe salir el aviso.

### 1.6 Reglas del almacenamiento (Storage), 04/10/2026

**Lo que se encontró** (consulta a `pg_policies` de `storage.objects` y a `storage.buckets`):
- `avatars` es público (correcto) pero sin límite de tamaño ni de tipo de archivo; los 5 MB y el filtro de imagen solo existían en la página.
- Las reglas de subir a `avatars`, `portadas` y `publicaciones` solo comprobaban el nombre del bucket: no exigían sesión iniciada ni carpeta propia (las del chat y de productos sí exigían sesión).
- Bien: ver archivos es público, solo el dueño puede borrar (`owner = auth.uid()`), y no hay regla de reemplazar archivos en esos buckets, así que nadie puede pisar el de otra persona.

**Cambio aplicado (dentro de `begin; ... commit;`, "Success"):**
- `avatars` y `portadas`: límite de 5 MB (`5242880`) y solo `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Reglas de subir a `avatars` y `portadas` recreadas `to authenticated`, con `(storage.foldername(name))[2] = auth.uid()::text`. Coincide con las rutas del código: `perfiles/<id>/...` y `portadas/<id>/...`.
- **Volver atrás:** poner `file_size_limit` y `allowed_mime_types` en `null` y recrear las dos reglas con solo `with check (bucket_id = '...'::text)`.
- Copia de las reglas anteriores: archivo CSV exportado el 04/10 (guardarlo).

**Probado:** después del cambio se subieron foto de perfil y portada desde la página, y funcionaron.

**Pendiente:** `publicaciones` no se tocó (sus rutas son distintas; revisar primero cómo se arma el nombre antes de exigir carpeta propia).

### 1.7 Recorrido del código de feed y chat (11g), 04/10/2026

No se puede simular la página (no hay acceso a Supabase ni a Vercel), pero se siguió el código para ver de dónde salen nombre y foto de otras personas. Se encontraron **dos errores reales**:

1. **`obtenerAutor`** (`panel-usuario-1.js`) pedía solo `nombres, apellidos` a `perfiles_publicos`. Esa función alimenta el feed, la lista de mensajes y el chat, y el código del feed usa `autor.foto_perfil`, así que nunca llegaba la foto de otras personas. Corregido: ahora pide `nombres, apellidos, foto_perfil`. (Se había omitido en el cambio de 1.5.)
2. **`cargarVistaPreviaCompartir`** (`panel-usuario-2.js`) leía al autor con un join directo a `usuarios` (`usuarios!productos_usuario_id_fkey`). Desde que `usuarios` solo deja ver la fila propia, el join devuelve vacío para publicaciones de otras personas y salía "Usuario". Corregido: lee el producto con `select('*')` y al autor con `obtenerAutor`.

**Estado:** código listo y con sintaxis revisada; **sin probar en la página**.

### 1.8 Otros cambios del 04/10/2026

- **11f, extensión real del archivo** (`panel-usuario-2.js`): nueva función `_extensionImagen`. Foto de perfil y portada se guardan como `.jpg`, `.png`, `.webp` o `.gif` según el tipo, en vez de siempre `.jpg`. Código listo; sin probar.
- **Correo actual en Configuración** (`index.html` y `panel-usuario-2.js`): en Configuración → Cuenta no se veía con qué correo se estaba entrando (solo había campos para escribir uno nuevo). Se agregó la línea "Correo actual: …", que se llena al abrir Configuración (del perfil o, si falta, de la sesión de Supabase). El texto "Correo actual" quedó fijo en español; pasarlo al sistema de traducción en el paso 12. **Probado el 04/10: en Configuración → Cuenta se ve "Correo actual: jdvallebringas@proton.me".**

### 1.9 Hallazgos sobre "olvidé mi contraseña" y el link mágico (04/10/2026)

- **El botón "¿Olvidé mi contraseña?" no recupera la contraseña.** En `auth-modales.js` abre el formulario del link mágico y llama a `signInWithOtp` (línea ~335). El correo que llega es "Your sign-in link" (iniciar sesión), idéntico al del login. Al abrirlo, la persona entra de frente a la página principal y nunca se le pide una contraseña nueva. No existe `resetPasswordForEmail` ni pantalla para escribir una contraseña nueva.
- **Solución provisional:** entrar con el link mágico y cambiar la contraseña en Configuración → Cuenta (mínimo 8).
- **Error `otp_expired`** ("Email link is invalid or has expired") al abrir un link: los links son de un solo uso, solo vale el último que se pidió (cada correo nuevo anula el anterior; se vieron dos correos, 18:38 y 18:40), y ciertos correos abren los enlaces por su cuenta antes que la persona. La página no muestra mensaje claro: el error queda en la dirección (`#error=...`) y solo se reabre el cuadro de inicio de sesión.
- **Cuentas de prueba:** el correo `jdvallebringas@proton.me` corresponde a una cuenta creada el 30/09/2026 con nombre "america" y apellido "amerrica" (con doble r; corregible en Editar perfil) y `nombre_usuario` vacío (NULL). Es distinta de la del `@jvallebringas06` que aparece en el perfil con foto y portada ("Miembro desde julio de 2026"): hay al menos dos cuentas de prueba.
- Con el correo integrado de Supabase siguen los límites del punto 1.1 (2 correos por hora, textos en inglés).

- **Dónde se ve el correo y el teléfono (04/10):** el correo solo aparece en Mi Perfil → pestaña "Acerca de" (únicamente en el perfil propio) y, desde 1.8, en Configuración → Cuenta. El teléfono se guarda como `celular` al registrarse, pero **ninguna pantalla lo muestra**; idea: mostrarlo solo al propio usuario en Configuración, no a terceros (el chat ya bloquea compartir teléfonos).
- **Prueba del link mágico (04/10):** el correo llegó, pero en el segundo o tercer intento el ingreso no ocurría o tardaba. Causas probables: límite de 2 correos por hora del correo integrado, abrir un link viejo (cada correo nuevo anula al anterior) o demora del correo. Para confirmar: Supabase → Authentication → Logs (buscar `over_email_send_rate_limit`) y ver si la página mostró un mensaje rojo. Solución de fondo: pasos 14a y 16.

### 1.11 Contraseña nueva tras el link mágico (05/10/2026)

**Decisión del usuario:** en vez de una pantalla aparte, que al entrar con el link la persona vea Configuración y cambie la contraseña sin salir de su panel. Configuración **no muestra** la contraseña actual: se guarda cifrada y nadie puede verla (ni la página, ni Supabase); solo se puede escribir una nueva.

**Cómo funciona (código listo, sin probar):**
1. `auth-modales.js`: el enlace "Olvidé mi contraseña" abre el formulario del link con `showMagicLinkForm('olvido')`. `sendMagicLink` pide el link con `emailRedirectTo = <origen>/?nueva-clave=1` y guarda en el navegador la marca `remarket_nueva_clave` (hora). El otro acceso al link (desde el registro) no marca nada. Al iniciar sesión con contraseña se borra la marca.
2. `sesion-auth.js`: nueva `consumirSenalNuevaClave()`. Detecta la señal A (`?nueva-clave=1` en la dirección, funciona aunque se abra en otro dispositivo) o la B (marca del navegador, vale 1 hora), la usa una sola vez y limpia la dirección. Al final de `procesarSesionSupabaseAuth`, si hay señal, abre Configuración con `PanelUsuario.abrirModalConfiguracion('clave')`.
3. `panel-usuario-2.js`: `abrirModalConfiguracion(modo)`; con `'clave'` muestra el aviso `configAvisoClave`, baja hasta "Nueva contraseña" y pone el cursor ahí. El aviso se oculta al cambiar la contraseña.
4. `index.html`: aviso amarillo "Entraste con un enlace. Crea aquí tu contraseña nueva (mínimo 8 caracteres) y pulsa Cambiar." sobre el campo de contraseña.
5. **Link vencido o ya usado:** `avisarEnlaceVencido()` (en `sesion-auth.js`, llamada desde `main.js`). Si la dirección trae `otp_expired` y no hay sesión, abre el cuadro de acceso con el formulario del link y el mensaje nuevo `auth_err_link_vencido`; limpia el `#error=...` de la dirección.
6. `i18n-auth.js`: clave `auth_err_link_vencido` solo en español e inglés; los otros idiomas muestran el español hasta que se traduzca (paso 12, con revisión de hablante nativo). El aviso de Configuración también queda fijo en español (paso 12).

**Prueba de la lógica con un navegador simulado (solo la lógica, no la página real):** señal A, marca de 10 min, marca de 3 h (no vale), link normal sin marca (no abre nada) y el aviso de link vencido con y sin sesión: todo respondió como se esperaba.

**Pendiente en Supabase:** Authentication → URL Configuration. La captura del 05/10 muestra Site URL `https://pueba02.vercel.app` y 4 Redirect URLs (`remarket-db-6.vercel.app`, `remarket-db2.vercel.app`, `remarket-db2.vercel.app/auth/callback`, `pueba02.vercel.app`). Agregar **`https://pueba02.vercel.app/**`** para que acepte `/?nueva-clave=1`. Si no se agrega, Supabase manda a la Site URL sin la señal y solo funciona la marca del navegador (mismo navegador donde se pidió el link).

**Resultado de la prueba (05/10/2026):** tras subir los archivos, al entrar con el link se abrió Configuración con el aviso amarillo y el cursor en "Nueva contraseña" (visto en captura). **Falta confirmar:** guardar la contraseña nueva, cerrar sesión y entrar con ella; el mensaje de link vencido; y que entrar con contraseña no abra Configuración sola.

**Probar tras subir:**
1. Sin sesión, "Olvidé mi contraseña" → escribir el correo → abrir el correo y pulsar "Sign in" **enseguida, una sola vez** (solo vale el último correo; vencen en cerca de 1 hora).
2. Debe entrar al panel y abrirse Configuración con el aviso amarillo, bajando hasta "Nueva contraseña".
3. Escribir 8 o más caracteres y Cambiar. Cerrar sesión y entrar con correo y contraseña nueva.
4. Abrir un link viejo: debe salir el cuadro de acceso con el mensaje de enlace vencido.
5. Entrar con contraseña (sin link) no debe abrir Configuración sola.

### 1.12 Error al guardar Configuración: falta la columna `ciudad` (05/10/2026)

- **Síntoma:** en Configuración, el botón morado **Guardar** muestra "Error al guardar: Could not find the 'ciudad' column of 'usuarios' in the schema cache".
- **Causa:** `guardarConfiguracion` (`panel-usuario-2.js`) hace un solo `update` a `usuarios` con `categoria, ciudad, pais, notif_mensajes, notif_comentarios, notif_likes, privacidad_mensajes`. Según las columnas reales confirmadas en `BITACORA-SEGURIDAD.md` (sección 3-bis), todas existen **menos `ciudad`** (ya se había anotado que no existía). Como es un solo `update`, al faltar una columna no se guarda ninguno de los cambios (intereses, notificaciones, privacidad).
- **Efecto secundario:** la ciudad escrita (por ejemplo "Lima") solo vive en la sesión del navegador; por eso "Tu Alcance" sigue diciendo "Define tu localidad en Configuración".
- **Arreglo propuesto (SQL):** `alter table usuarios add column if not exists ciudad text;` y `notify pgrst, 'reload schema';`. Sin cambios de código. Probar: Guardar en Configuración debe mostrar "Configuración guardada".
- **Pendiente aparte:** `biografia` tampoco existe en `usuarios` y el perfil la lee (`usuario.biografia`); no hay código que la escriba. Decidir si se crea con la función de editar perfil.
- **Pendiente aparte:** Configuración guarda `ciudad` como texto; los filtros de zona de buscar personas usan `localidad_id`. Ver `BITACORA-BUSQUEDA-PERSONAS.md`.

### 1.10 Resumen de archivos tocados el 04/10/2026

| Archivo | Qué cambió | Estado |
|---|---|---|
| `js/modules/panel-usuario-1.js` | `foto_perfil` en la vista previa de persona y en `obtenerAutor` | listo; confirmar que está subido y probar |
| `js/modules/panel-usuario-2.js` | validación de imagen, error al guardar foto, `foto_perfil` en consultas, extensión real, vista previa de compartir, correo actual en Configuración | listo; confirmar que está subido y probar |
| `js/modules/panel-usuario-3.js` | `foto_perfil` en buscar personas y compartir | subido y probado en la prueba de fotos |
| `index.html` | línea "Correo actual" en Configuración (probada el 04/10); aviso `configAvisoClave` (05/10, sin probar) | subir de nuevo |
| `js/modules/auth-modales.js`, `js/sesion-auth.js`, `js/main.js`, `js/i18n-auth.js` | contraseña nueva tras el link mágico y aviso de link vencido (1.11) | listo; subir, agregar URL en Supabase y probar |
| Supabase (SQL) | columnas `foto_perfil`/`foto_portada`; vista `perfiles_publicos`; límites y reglas de `avatars` y `portadas` | ejecutado y probado |
| `BITACORA-PLAN-PANEL-Y-CORREO.md`, `BITACORA-BUSQUEDA-PERSONAS.md` | bitácoras | subir esta versión |

---

## 2. Qué se encontró del panel de usuario (revisión parcial)

Revisión por lista de funciones y lectura detallada de configuración, subida de foto y publicaciones. No fue línea por línea.

**Bien**
- Escapa el texto de usuarios con `escHtml` de forma consistente.
- Cambiar contraseña y correo usa las funciones oficiales de Supabase.
- El buscador de arriba es un solo elemento; si el panel está activo, la búsqueda se pinta en el feed del panel (`PanelUsuario.ejecutarBusquedaConIA`).
- El Asistente IA es un solo bloque (`assistantBox`) que `moverWidgetsAlPanel` / `moverWidgetsAPublico` cambian de lugar; conserva historial y servicio.

**Por corregir** (estado al 02/10; ver sección 1.5 para lo avanzado el 04/10)
- Seguridad de `usuarios` (ver `BITACORA-SEGURIDAD.md`): lectura y edición abiertas. El panel lee esa tabla, por eso el orden de los pasos importa.
- Contraseña mínima: 8 en el registro, **6** en Configuración (`cambiarPasswordCuenta`).
- Textos fijos en español en Configuración (no pasan por el sistema de traducción).
- `subirFotoPerfil` / `subirPortada`: sin validar tipo ni tamaño; el nombre siempre termina en `.jpg`. *(Validación hecha el 04/10; el nombre `.jpg` sigue igual.)*
- Los 7 botones de acceso rápido del asistente están solo en la página pública, no en el panel.
- Panel de administrador no funciona (falta la columna `es_admin`).
- "Cambiar correo" depende de correos; con 2 por hora puede fallar al probarlo.
- `panel-usuario-3.js` (~2,000 líneas) mezcla publicar, chat, búsqueda con IA, compartir y administrador.

---

## 3. Cómo trabajar los cambios (método)

**Capas**

| Capa | Dónde vive | Qué se cambia |
|---|---|---|
| Visual | `css/estilos.css`, HTML de `index.html` | colores, diseño |
| Funciones | `js/modules/panel-*.js`, otros módulos | lo que hace la página |
| Datos | Supabase (tablas, políticas) | qué se guarda y quién lo ve |
| Textos | `i18n.js`, `i18n-auth.js`, `i18n-institucional.js` | traducciones |

Orden habitual de un cambio que toca varias capas: **datos → funciones → visual → textos**.

**Reglas**
1. Antes de cambiar la base, guardar las políticas actuales (`select * from pg_policies where schemaname='public'`) en un archivo. En el plan gratis no hay copias automáticas.
2. Cambios de código en una rama de GitHub; probar en la dirección de prueba de Vercel antes de pasar a `main`.
3. Cambios de base de datos dentro de `begin; ... commit;` para poder hacer `rollback`.
4. Probar siempre con 3 cuentas: sin sesión (incógnito), la propia y otra distinta.
5. Un cambio a la vez; al terminar, subir a GitHub y anotar en la bitácora con fecha y resultado.
6. Una sola sesión de trabajo por archivo a la vez (antecedente: `BITACORA-SESION-COLISION-SESIONES.md`).
7. **Lo nuevo va en archivos nuevos** con `Object.assign(PanelUsuario, {...})` y su `<script>` en `index.html`. Lo viejo se divide al final.
8. Si hay que cambiar una función que ya existe, se edita donde está; **no se copia a otro archivo** (si hay dos con el mismo nombre gana la última que carga, sin avisar).
9. Antes de un cambio grande, escribir en 3 o 4 líneas qué debe pasar y cómo se sabrá que funciona.

**Probar tras cada cambio del panel:** entrar al panel, cargar el feed, buscar personas, abrir un perfil ajeno, editar el propio, publicar, comentar y mandar un mensaje.

---

## 4. Plan en orden

### Antes de empezar
- [x] 1. Confirmado: `auth-modales.js` e `i18n-auth.js` subidos a GitHub y desplegados.
- [x] 2. Confirmado con `select policyname, cmd from pg_policies where tablename='usuarios';` (04/10): ya mostraba "ver propio" / "crear propio" / "editar propio" -- la Fase 1 y 2 ya estaban aplicadas de una sesión anterior.
- [x] 3. Copia de las políticas actuales guardada en archivo (04/10).

### Fase 1 — Seguridad de `usuarios`
- [x] 4. Vista de perfiles públicos creada (`perfiles_publicos`: id, nombres, apellidos, localidad_id, categoria, pais, nombre_usuario, created_at; el 04/10 se le agregaron `foto_perfil` y `foto_portada` al final, ver 11a). Feed, buscar personas y perfiles ajenos ya la usan; perfil propio sigue leyendo la tabla completa.
- [x] 5. Probado con cuentas reales.
- [x] 6. `usuarios` cerrada: cada persona ve y edita solo su fila, con trigger que protege rol y estado.

### Fase 2 — Seguridad de productos y registro
- [x] 7. `productos`: regla redundante quitada, trigger que impide auto-aprobarse o auto-patrocinarse.
- [x] 8. Trigger `trg_crear_perfil_usuario` sobre `auth.users`: crea la ficha del usuario automáticamente al registrarse, sin depender del navegador.
- [x] 9. `comentarios_likes`: estaba cerrada sin ninguna política (por eso el "me gusta" en comentarios no funcionaba); agregadas las 3 reglas (ver todos, dar/quitar like propio).

**Detalle de las Fases 1 y 2:** todo esto está documentado paso a paso, con el SQL exacto usado y cada prueba, en `BITACORA-SEGURIDAD.md` (los 6 pasos de esa bitácora quedaron completos el 03/10/2026).

### Fase 3 — Arreglos del panel
- [x] 10. Contraseña mínima de 8 también en Configuración (`panel-usuario-2.js`, función `cambiarPasswordCuenta`). Aplicado el 04/10/2026.
- [ ] 11. Validar tipo y tamaño en fotos de perfil y portada; revisar reglas del bucket `avatars`. **En curso (04/10); siguiente: 11e.**
  - [x] 11a. Columnas `foto_perfil` y `foto_portada` creadas en `usuarios` y en la vista `perfiles_publicos` (ejecutado en Supabase).
  - [x] 11b. Validación de tipo y tamaño (5 MB) y aviso de error al guardar, en `panel-usuario-2.js` (código listo).
  - [x] 11c. `foto_perfil` agregada a las consultas de `perfiles_publicos` en `panel-usuario-1.js`, `-2.js` y `-3.js` (código listo).
  - [x] 11d. Los 3 archivos subidos a GitHub y probados el 04/10 con la lista de la sección 1.5: funcionó.
  - [x] 11e. Reglas de almacenamiento de `avatars` y `portadas` revisadas y ajustadas el 04/10 (ver sección 1.6). Probado: foto de perfil y portada suben bien.
  - [ ] 11f. Extensión real del archivo en vez de `.jpg` siempre: código listo (ver 1.8); falta subir y probar con un PNG.
  - [ ] 11g. Feed y chat muestran nombre y foto de otras personas: se corrigieron dos errores en el código (ver 1.7); falta subir y probar con dos cuentas (feed, buscar personas, perfil ajeno, mensajes, comentarios, vista previa al compartir). Único reporte hasta ahora: "buscar personas no es tan funcional" (ver `BITACORA-BUSQUEDA-PERSONAS.md`).
- [ ] 12. Pasar los textos fijos de Configuración al sistema de traducción.

### Fase 4 — Funciones pendientes
- [ ] 13. Botón "Reportar" en cada tarjeta que abra el Libro de Reclamaciones con los datos de la publicación.
- [ ] 14. Panel de administrador: crear/corregir `es_admin`.
- [ ] 14a. Recuperación de contraseña **sin salir del panel** (decisión del usuario, 05/10): "Olvidé mi contraseña" envía el link mágico, la persona entra directo y la página abre sola Configuración → Cuenta con un aviso y el cursor en "Nueva contraseña" (mínimo 8). Además, mensaje claro si el link venció o ya se usó. Código listo el 05/10 (ver 1.11); subido el 05/10 y la primera parte probada (se abre Configuración con el aviso); **falta confirmar que la contraseña nueva se guarda y entra, y agregar `https://pueba02.vercel.app/**` en Supabase si no se hizo**.
- [ ] 14b. Teléfono en Configuración → Cuenta: visible y editable solo para la propia persona (hoy se guarda como `celular` al registrarse pero ninguna pantalla lo muestra). Un cambio a la vez: va después de probar 14a.
- [ ] 15. Decidir si los 7 botones del asistente van también en el panel.
- [ ] 15a. Búsqueda avanzada de personas (nombre o @usuario, zona incluida "mundial", categoría y lo que ofrece). Diseño y estado en `BITACORA-BUSQUEDA-PERSONAS.md`. Propuesta hecha el 04/10; falta ver las columnas de `productos` y `localidades`.

### Antes de publicar
- [ ] 16. SMTP real y volver a activar "Confirm email" (ver sección 5).
- [ ] 17. Dividir el código viejo de `panel-usuario-3.js` por temas (administrador, configuración, búsqueda con IA, publicar, chat, perfil y feed), moviendo un bloque a la vez sin cambiar su código por dentro.

---

## 5. SMTP real (pendiente para publicar)

- Decisión del 02/10: se deja para más adelante, cuando todo lo demás funcione.
- Resend ya se intentó antes y la confirmación no llegaba. Causa probable: sin dominio verificado, Resend solo entrega al correo de la propia cuenta de Resend. Para comprobarlo, mirar Resend → Emails/Logs.
- Datos para Resend en Supabase: host `smtp.resend.com`, usuario `resend`, contraseña = API key (`re_...`), remitente de un dominio verificado.
- Alternativas si no hay dominio propio: Brevo (permite verificar solo un correo remitente) o Gmail con contraseña de aplicación (para pruebas). Lo más sólido: comprar un dominio y verificarlo.
- Al activar el SMTP real: subir el límite por hora en Supabase, traducir las plantillas al español y reactivar "Confirm email".

---

## 6. Lecciones

- **Nombres de archivos descargados:** al bajar un archivo que ya existe, el navegador le agrega un número o un espacio (`panel-usuario-2 .js`, `index (29).html`). Esas copias no se cargan en la página y los cambios no se ven. Antes de subir a GitHub, renombrar el archivo al nombre exacto, y después de subir comprobar que no queden copias con espacios o números. (Pasó el 04/10: el repo tenía las versiones nuevas con nombre equivocado, y `panel-usuario-3.js` e `index.html` seguían viejos.)
- Al cerrar una tabla con reglas (RLS), buscar también los **joins** (`tabla!llave(...)`) y las consultas que ya no pueden leer a otras personas, no solo los `select` directos. Aquí aparecieron dos: `obtenerAutor` y la vista previa de compartir.
- No afirmar cómo se ve una pantalla sin comprobarlo: se dijo que Configuración mostraba el correo y no era así.

- En Postgres, `create or replace view` solo permite agregar columnas **al final**. Para cambiar el orden o el nombre de una columna hay que borrar y recrear la vista (cuidando los permisos) o usar `alter view ... rename column`.
- Si el código "sube pero no se ve", revisar primero que la columna exista en la tabla: un `update` a una columna inexistente falla y, si no se revisa el error, parece que todo salió bien.

---

## 7. Ideas pendientes por corregir (sin ordenar)

Lista abierta. Cuando llegue el turno de una idea, se convierte en un paso numerado con su prueba.

- Búsqueda de personas: ver `BITACORA-BUSQUEDA-PERSONAS.md` (ya tiene paso 15a).
- `nombre_usuario` vacío en cuentas como la de `jdvallebringas@proton.me`: decidir cómo se asigna (hoy el `@` cae al inicio del correo).
- Apellido con error de escritura en una cuenta de prueba ("amerrica"): corregir desde Editar perfil.
- **Cambiar correo no sincroniza el perfil (hallado el 05/10):** `cambiarCorreoCuenta` solo llama a `supabase.auth.updateUser({ email })`; no actualiza `usuarios.correo_electronico`. Tras confirmar el cambio, el correo de acceso es el nuevo, pero la tabla `usuarios` conserva el viejo (se ve en Mi Perfil → Acerca de y en la línea "Correo actual" de Configuración, que lee primero el perfil). Arreglo propuesto: que "Correo actual" lea primero el correo de la sesión y que, al iniciar sesión, si `authUser.email` difiere del perfil, se actualice `usuarios.correo_electronico`. Aún sin hacer; confirmar con una cuenta de prueba cuando se haga. Recordar el límite de 2 correos por hora al probarlo.
- Otras correcciones puntuales y visuales: **por completar**. Se trabajan después de cerrar las bitácoras.
- `publicaciones` (almacenamiento): reglas de subida sin carpeta propia ni límite de tamaño; revisar primero cómo se arma el nombre del archivo en `panel-usuario-3.js`.
