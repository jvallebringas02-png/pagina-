# Bitácora — Correo de Supabase, avisos del registro y plan del panel de usuario

**Fecha:** 02/10/2026 (actualizada el 04/10/2026)
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

**Pendiente de verificar:**
- Feed y chat obtienen al autor con otra consulta (`usuarios!productos_usuario_id_fkey(nombres, apellidos)`). Como `usuarios` ahora solo deja ver la fila propia, revisar que ese caso no dependa de leer a otras personas y que las fotos aparezcan ahí.
- Reglas del bucket `avatars` (quién puede subir y dónde).

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
  - [ ] 11f. (Opcional) Que el nombre del archivo use la extensión real en vez de `.jpg` siempre.
  - [ ] 11g. Verificar que feed y chat muestren las fotos (consulta con `usuarios!productos_usuario_id_fkey`). Prueba con dos cuentas explicada el 04/10 (feed, buscar personas, perfil ajeno, mensajes, comentarios); **resultado aún sin confirmar**. Lo único reportado: "buscar personas no es tan funcional" (ver `BITACORA-BUSQUEDA-PERSONAS.md`).
- [ ] 12. Pasar los textos fijos de Configuración al sistema de traducción.

### Fase 4 — Funciones pendientes
- [ ] 13. Botón "Reportar" en cada tarjeta que abra el Libro de Reclamaciones con los datos de la publicación.
- [ ] 14. Panel de administrador: crear/corregir `es_admin`.
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

- En Postgres, `create or replace view` solo permite agregar columnas **al final**. Para cambiar el orden o el nombre de una columna hay que borrar y recrear la vista (cuidando los permisos) o usar `alter view ... rename column`.
- Si el código "sube pero no se ve", revisar primero que la columna exista en la tabla: un `update` a una columna inexistente falla y, si no se revisa el error, parece que todo salió bien.

---

## 7. Ideas pendientes por corregir (sin ordenar)

Lista abierta. Cuando llegue el turno de una idea, se convierte en un paso numerado con su prueba.

- Búsqueda de personas: ver `BITACORA-BUSQUEDA-PERSONAS.md` (ya tiene paso 15a).
- Otras correcciones puntuales y visuales: **por completar**. Se trabajan después de cerrar las bitácoras.
- `publicaciones` (almacenamiento): reglas de subida sin carpeta propia ni límite de tamaño; revisar primero cómo se arma el nombre del archivo en `panel-usuario-3.js`.
