> **Estado (19/10/2026): ARREGLO APLICADO EN EL CÓDIGO, SIN PROBAR EN EL NAVEGADOR DESPUÉS DEL CAMBIO. Solo se cambió `js/sesion-auth.js`.**

# Bitácora — Parpadeo del muro al volver a la pestaña

**Fecha:** 19/10/2026 · **Continúa:** `BITACORA-REVISION-17-10-PANEL.md` (sección 4) y `BITACORA-PENDIENTES-PANEL.md` (1.2 y 1.3)

## Qué se vio
Probando el panel con sesión iniciada (19/10) hubo parpadeo del muro. Coincide con la causa descrita el 17/10: cada aviso `SIGNED_IN` de Supabase volvía a ejecutar todo el arranque de sesión (leer perfil, saludar, guardar `login_exitoso`, recargar el muro).

## Qué se cambió (`js/sesion-auth.js`)
1. `_uidSesionProcesada`: se recuerda el id de la persona ya procesada. Si llega el mismo id, `procesarSesionSupabaseAuth` no hace nada. Se marca **al empezar**.
2. Si el proceso falla (`catch`), se olvida el id para poder reintentar.
3. `logAccess('login_exitoso')` ya **no se espera** antes de mostrar el panel (un error ahí tampoco rompe la entrada).
- Otra cuenta sí se procesa. Al cerrar sesión la página se recarga (`logout` → `window.location.reload()`), así que todo se reinicia.
- `main.js` y `auth-modales.js` no cambian.

## Prueba hecha (simulada, con funciones de prueba)
- La primera llamada termina aunque el registro de acceso nunca responda.
- La misma persona 3 veces: un solo saludo, una sola carga del muro, un solo pedido de perfil.
- Otra persona: se procesa.
- Tras un fallo: se puede reintentar.

## Qué se pierde
Al volver a la pestaña ya no se refresca el perfil; un cambio hecho desde otro dispositivo se ve al recargar.

## Pruebas en el navegador (marcar)
- [ ] Abrir el panel, cambiar de pestaña 10 segundos y volver: el muro no parpadea y el asistente no saluda otra vez.
- [ ] Iniciar sesión con contraseña: un solo saludo y una sola carga del muro.
- [ ] Registrarse con cuenta nueva: entra bien.
- [ ] Cerrar sesión y entrar con otra cuenta: carga la otra cuenta.
- [ ] El panel aparece más rápido al entrar (compara antes y después).

## Cómo volver atrás
Subir de nuevo el `sesion-auth.js` anterior.

## Sigue pendiente
Foto cuadrada del muro (esperando decisión), autores uno por uno en `panel-usuario-1.js` (tanda 2), Reportar visible, traducir el resto del panel.

## Registro
| Fecha | Cambio | Resultado |
|---|---|---|
| 19/10/2026 | Evitar el reproceso de sesión y no esperar `logAccess` | Simulación OK; falta probar en el navegador |
