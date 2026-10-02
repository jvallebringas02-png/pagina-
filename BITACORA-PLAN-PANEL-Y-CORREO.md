# Bitácora — Correo de Supabase, avisos del registro y plan del panel de usuario

**Fecha:** 02/10/2026
**Proyecto:** remarket-db (`pueba02.vercel.app`)
**Para retomar en cualquier conversación:** traer este archivo junto con `BITACORA-SEGURIDAD.md` y seguir desde la sección 4.

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

---

## 2. Qué se encontró del panel de usuario (revisión parcial)

Revisión por lista de funciones y lectura detallada de configuración, subida de foto y publicaciones. No fue línea por línea.

**Bien**
- Escapa el texto de usuarios con `escHtml` de forma consistente.
- Cambiar contraseña y correo usa las funciones oficiales de Supabase.
- El buscador de arriba es un solo elemento; si el panel está activo, la búsqueda se pinta en el feed del panel (`PanelUsuario.ejecutarBusquedaConIA`).
- El Asistente IA es un solo bloque (`assistantBox`) que `moverWidgetsAlPanel` / `moverWidgetsAPublico` cambian de lugar; conserva historial y servicio.

**Por corregir**
- Seguridad de `usuarios` (ver `BITACORA-SEGURIDAD.md`): lectura y edición abiertas. El panel lee esa tabla, por eso el orden de los pasos importa.
- Contraseña mínima: 8 en el registro, **6** en Configuración (`cambiarPasswordCuenta`).
- Textos fijos en español en Configuración (no pasan por el sistema de traducción).
- `subirFotoPerfil` / `subirPortada`: sin validar tipo ni tamaño; el nombre siempre termina en `.jpg`.
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
- [ ] 1. Confirmar que `auth-modales.js` e `i18n-auth.js` de hoy están subidos a GitHub y desplegados.
- [ ] 2. Ejecutar en el SQL Editor: `select policyname, cmd from pg_policies where tablename='usuarios';` para saber qué del plan de seguridad ya está aplicado (solo consta el paso 1 aplicado el 29/09).
- [ ] 3. Guardar copia de las políticas actuales en un archivo.

### Fase 1 — Seguridad de `usuarios`
- [ ] 4. Crear la vista de perfiles públicos (id, nombre, foto, país, categoría) y cambiar feed, buscar personas y perfiles para que lean esa vista (Paso 2 de `BITACORA-SEGURIDAD.md`).
- [ ] 5. Probar con las 3 cuentas.
- [ ] 6. Cerrar `usuarios`: cada persona ve y edita solo su fila, con trigger que protege rol y estado (Paso 3). **Siempre después del punto 4.**

### Fase 2 — Seguridad de productos y registro
- [ ] 7. Impedir que el dueño se apruebe productos o active patrocinio (Paso 4).
- [ ] 8. Crear la ficha del usuario con un trigger sobre `auth.users`, para que no queden cuentas a medias (Paso 5).
- [ ] 9. Política de `comentarios_likes` y límites a las inserciones anónimas (Paso 6).

### Fase 3 — Arreglos del panel
- [ ] 10. Contraseña mínima de 8 también en Configuración.
- [ ] 11. Validar tipo y tamaño en fotos de perfil y portada; revisar reglas del bucket `avatars`.
- [ ] 12. Pasar los textos fijos de Configuración al sistema de traducción.

### Fase 4 — Funciones pendientes
- [ ] 13. Botón "Reportar" en cada tarjeta que abra el Libro de Reclamaciones con los datos de la publicación.
- [ ] 14. Panel de administrador: crear/corregir `es_admin`.
- [ ] 15. Decidir si los 7 botones del asistente van también en el panel.

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
