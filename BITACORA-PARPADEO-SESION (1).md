> **Estado (19/10/2026): DOS ARREGLOS APLICADOS EN EL CÓDIGO. El primero (`sesion-auth.js`) ya se subió y quitó el parpadeo notorio. El segundo (`panel-usuario-1.js`) está sin probar en el navegador.**

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

## Segundo arreglo (19/10/2026, tras la prueba): parpadeo que quedaba al entrar o recargar
**Qué se vio:** después del primer arreglo, el parpadeo ya no era notorio, pero quedaba uno en algún momento.
**Causa (leída en el código):** `PanelUsuario.mostrar()` borra el muro y pide el feed cada vez que se llama, y al entrar o recargar se llama **2 o 3 veces seguidas**: `updateUIForUser` → `toggleVistaUsuario(true)`, y después `irAlFeed()` → `toggleVistaUsuario(true)` otra vez (al recargar, además, `cargarSesionUsuario` lo llama antes). Cada llamada ponía "Cargando publicaciones…" y borraba lo que se veía. También limpiaba el buscador cada vez.
**Cambio (`js/modules/panel-usuario-1.js`, 5 líneas al inicio de `mostrar`):** si el panel ya está abierto, solo se refrescan las tarjetas del usuario; no se borra el muro, no se limpia el buscador y no se pide el feed otra vez. Si se cierra sesión y se vuelve a abrir el panel, carga normal.
**Prueba simulada:** 3 llamadas seguidas → 1 sola carga del muro y de tendencias; el buscador no se borra al repetir; tras ocultar el panel vuelve a cargar.
**Qué se pierde:** si la primera carga falló, ya no se reintenta sola: queda el botón de reintento del propio muro.
**Pruebas (marcar):**
- [ ] Recargar la página con sesión: el muro se ve cargar una sola vez.
- [ ] Iniciar sesión: una sola carga.
- [ ] Escribir algo en el buscador y esperar: no se borra solo.
- [ ] Cerrar sesión y entrar de nuevo: carga el muro.
- [ ] Volver a la pestaña: sin parpadeo.
**Si aún parpadea:** decirme en qué momento exacto (al entrar, al recargar, al volver a la pestaña, al buscar o al cambiar de sección). Otros candidatos: el cambio de página del muro y el cambio de idioma.

## Cómo volver atrás
Subir de nuevo el `sesion-auth.js` y el `panel-usuario-1.js` anteriores (cada arreglo se revierte por separado).

## Sigue pendiente
Foto cuadrada del muro (esperando decisión), autores uno por uno en `panel-usuario-1.js` (tanda 2), Reportar visible, traducir el resto del panel.

## Registro
| Fecha | Cambio | Resultado |
|---|---|---|
| 19/10/2026 | Evitar el reproceso de sesión y no esperar `logAccess` | Subido; el parpadeo notorio desapareció |
| 19/10/2026 | `mostrar()` ya no recarga el muro si el panel está abierto | Simulación OK; falta probar en el navegador |
