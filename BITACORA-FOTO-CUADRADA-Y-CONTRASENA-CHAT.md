> **Estado (21/10/2026): APLICADO EN EL CÓDIGO. La foto cuadrada se midió en un navegador simulado; el aviso de contraseñas NO se pudo reproducir aquí (sale en Brave) y hay que probarlo en tu navegador.**

# Bitácora — Foto cuadrada del muro y aviso de "contraseñas" en el chat

**Fecha:** 21/10/2026 · **Continúa:** `BITACORA-PENDIENTES-PANEL.md` (1.1) · Base: el zip del 21/10/2026

## 1. Foto cuadrada del muro (opción 2 de la bitácora del 17/10)
**Qué se veía:** cada foto salía de un tamaño distinto (ancho completo y alto según la foto, hasta 420 px).
**Cambio (`css/estilos.css`, solo CSS):**
- `.feed-post-image`: cuadrada (`aspect-ratio: 1/1`), máximo 380 px, centrada, recortada con `object-fit: cover`.
- Carrusel: el contenedor mide 380 px máximo, centrado; todas las fotos del carrusel son cuadradas, así no cambia de tamaño al pasar de una a otra.
- La ventana "ver publicación" (`#vpImagen`) **no cambia**: se le quitó el cuadrado para que siga igual que antes.
**Medido (Chromium sin interfaz, con el CSS real):** foto ancha 380×380, foto alta 380×380, carrusel 380×380, celular de 340 px de ancho → 338×338, ventana de la publicación sin cuadrar.
**Qué se pierde:** las fotos que no son cuadradas se recortan en el muro (se ven completas en "ver publicación").
**Pendiente:** poder ampliar la foto al tocarla (idea del 17/10), no hecho.

## 2. Por qué sale "guardar contraseña" / lista de cuentas en el chat
**Qué se vio (captura del 21/10, Brave):** al hacer clic en "Escribe un mensaje…" de Mensajes, el navegador mostró una lista con 3 correos y "Administrar contraseñas…".
**Causa (probable, no reproducida):** el cuadro del mensaje ya tenía `autocomplete="off"`, pero no estaba dentro de ningún `<form>`, y la página tiene campos de contraseña (el de Configuración en `index.html`, y los de iniciar sesión/registrarse). Sin formularios que los separen, el navegador toma el campo de texto más cercano como "usuario" y ofrece las cuentas guardadas. Brave y Chrome ignoran `autocomplete="off"` en esos casos.
**Cambios:**
- `panel-usuario-3.js`: la fila del mensaje pasa de `<div>` a `<form class="chat-input-row" autocomplete="off" onsubmit="return false;">`; el botón 👍 lleva `type="button"`; el buscador dentro de la conversación lleva `autocomplete="off"` y un `name` propio.
- `index.html`: el campo de contraseña nueva de Configuración lleva `autocomplete="new-password"` (lo declara como contraseña nueva, no de inicio de sesión).
**No cambia:** enviar con Enter, con el botón, el 👍, la foto y la traducción siguen igual.
**No verificado:** si Brave deja de mostrar la lista. Si aún aparece, el siguiente paso es declarar con `autocomplete` los campos de inicio de sesión y registro (`auth-modales.js`), o crear esos campos solo cuando se abre el cuadro de entrar.

## 3. Pruebas (marcar)
- [ ] Muro: fotos cuadradas y centradas; el carrusel pasa de una a otra sin cambiar de tamaño.
- [ ] Muro en el celular.
- [ ] "Ver publicación": la foto se ve como antes.
- [ ] Mensajes: hacer clic en "Escribe un mensaje…" ya no muestra cuentas ni "Administrar contraseñas".
- [ ] Enviar un mensaje con Enter y con el botón; enviar 👍; enviar una foto.
- [ ] Configuración → Contraseña: sigue funcionando "Guardar".

## 4. Cómo volver atrás
Subir de nuevo `css/estilos.css`, `js/modules/panel-usuario-3.js` e `index.html` anteriores (cada cambio es independiente).

## 5. Registro
| Fecha | Cambio | Resultado |
|---|---|---|
| 21/10/2026 | Fotos cuadradas del muro (CSS) | Medido en Chromium simulado; falta ver en tu navegador |
| 21/10/2026 | Formulario propio en el chat y `new-password` en Configuración | `node --check` OK; falta probar en Brave |
