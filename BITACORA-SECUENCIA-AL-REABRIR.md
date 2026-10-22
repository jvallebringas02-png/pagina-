> **Estado (22/10/2026): ARREGLO APLICADO EN EL CÓDIGO, SIN PROBAR EN EL NAVEGADOR DESPUÉS DEL CAMBIO. Se cambiaron `index.html` y `js/main.js`.**

# Bitácora — Secuencia rara al cerrar la página y volver a entrar (sesión sigue activa)

**Fecha:** 22/10/2026 · **Continúa:** `BITACORA-PARPADEO-SESION.md` (19/10) y `BITACORA-SESION-COLISION-SESIONES.md`

## Qué se vio
Se cierra la pestaña (pero no se cierra la sesión) y al volver a entrar aparece esta secuencia:
1. La página de **invitado** (botón "Mi Cuenta", "Artículos Destacados" vacío). El navegador sigue mostrando que la página carga.
2. El **panel** de usuario con "Cargando publicaciones…".
3. Por fin el muro con las publicaciones.

Lo correcto: no pasar por la página de invitado si ya hay una sesión guardada.

## Causa
1. **La sesión se preguntaba tarde.** En `main.js`, antes de preguntar si había sesión, se esperaban una tras otra tres cargas lentas: `UbicacionUsuario.detectarPorIP()` (ipapi.co), `cargarProductosSupabase()` y `cargarProductosAPI()` (dummyjson, 100 productos). Mientras tanto el HTML ya mostraba la vista de invitado, porque es la que viene visible por defecto.
2. **Cerrar la pestaña borra la sesión rápida.** `cargarSesionUsuario()` lee `sessionStorage`, que se borra al cerrar la pestaña. En una simple recarga sobrevive y casi no se nota. Al cerrar y volver, solo queda la sesión de Supabase (en `localStorage`), que se consultaba recién después de las tres esperas.
3. El "Cargando publicaciones…" del panel (paso 2) es la carga normal del muro. No se cambió.

## Qué se cambió

### `index.html`
- En el `<head>`, después de `estilos.css`, se agregó un script pequeño que busca en `localStorage` una clave `sb-…-auth-token` (el token de Supabase). Si existe, pone la clase `con-sesion` en `<html>`.
- Con esa clase, un `<style>` oculta `#publicView` (la página de invitado) y muestra "Cargando tu cuenta…". Cuando el panel se activa, el aviso desaparece.
- Red de seguridad: si a los 10 segundos el panel no apareció, se quita la clase y se muestra la página normal.

### `js/main.js`
- La consulta de sesión ahora va **justo después de `UIController.init()`**, antes de lo lento.
- La carga lenta (IP, productos de Supabase, productos de la API, índice del buscador) pasa a una función que corre en paralelo (`cargaPesada`) y **ya no bloquea** la sesión.
- Si **no hay sesión**: se quita la clase `con-sesion` (por si el token guardado ya había vencido) y se espera `cargaPesada` antes de pintar el catálogo de invitado, que sí necesita los productos.
- Si **hay sesión**: no se espera la carga lenta; el panel aparece sin pasar por el invitado.
- Cuando termina la detección por IP se vuelve a llamar a `aplicarLocalidadGuardada(window.usuarioActual)`, para que la ciudad guardada en Configuración siga teniendo prioridad sobre la detectada por IP.

No se tocaron `sesion-auth.js`, `auth-modales.js` ni `panel-usuario-*.js`.

## Qué se pierde / riesgos
- Si el token guardado en el navegador ya venció, se verá "Cargando tu cuenta…" un instante antes de volver a la página de invitado.
- El botón del encabezado sigue diciendo "Mi Cuenta" un instante antes de mostrar el nombre (no se cambió).
- El índice del buscador (`BuscadorMotor`) ahora se construye un poco después de entrar al panel. Si se busca en los primeros segundos, podría no haber resultados todavía.

## Pruebas en el navegador (marcar)
- [ ] Entrar con la cuenta, **cerrar la pestaña completa** y volver a abrir: se ve "Cargando tu cuenta…" y luego el panel, sin pasar por la página de invitado.
- [ ] Recargar con F5 estando dentro: mismo resultado.
- [ ] Sin sesión (navegador sin entrar): el catálogo de invitado sale igual que antes, con productos.
- [ ] Cerrar sesión: la página se recarga y muestra el invitado.
- [ ] Entrar con otra cuenta: carga la otra cuenta.
- [ ] La ciudad guardada en Configuración se mantiene (no la pisa la IP).
- [ ] Buscar algo en el panel unos segundos después de entrar: da resultados.
- [ ] Probar en el celular.

## Cómo volver atrás
Subir de nuevo el `index.html` y el `js/main.js` anteriores.

## Sigue pendiente
- Mostrar el nombre del usuario en el botón del encabezado desde el primer instante (guardarlo en `localStorage`).
- Lo que ya estaba pendiente en `BITACORA-PARPADEO-SESION.md`.

## Registro
| Fecha | Cambio | Resultado |
|---|---|---|
| 22/10/2026 | Consultar la sesión antes de las cargas lentas y ocultar la página de invitado si hay token guardado | Sintaxis de `main.js` revisada; falta probar en el navegador |
