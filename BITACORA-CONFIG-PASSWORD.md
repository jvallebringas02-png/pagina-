# Bitácora — Configuración: contraseña "no se guardaba" y botones confusos

**Fecha:** 05/10/2026
**Estado:** cambios preparados en copias descargables. Falta subirlos a GitHub y desplegar en Vercel.

---

## 1. Qué se reportó

- En Configuración del panel de usuario "no se puede guardar la contraseña".
- Después: "en lo visual confunde Guardar y Cambiar".

## 2. Qué se encontró

**El código de la contraseña estaba bien.** `cambiarPasswordCuenta()` (`panel-usuario-2.js`) valida mínimo 8 caracteres y llama a `supabase.auth.updateUser({ password })`. No había ningún error de lógica.

**La causa era visual y de nombres:**

- El botón morado de arriba (`guardarConfiguracion`) guarda intereses, ciudad, país, notificaciones y privacidad. **No lee el campo de contraseña.**
- La contraseña se guarda solo con el botón de la sección "Cuenta", que decía **"Cambiar"**.
- Los dos botones "Cambiar" (contraseña y correo) usaban la clase `btn-auth`, que **no tiene color de fondo** (solo `btn-auth-primary` lo trae). Se veían como texto suelto, no como botones.
- Los dos decían lo mismo, "Cambiar", sin indicar qué cambiaban.

**El error que apareció en la prueba:**

> No se pudo cambiar: New password should be different from the old password.

Significa que la contraseña escrita ya era la contraseña actual (Supabase rechaza repetirla). No es un fallo: probablemente ya se había guardado antes. Cómo comprobarlo: cerrar sesión y entrar con esa contraseña.

## 3. Los cambios

**`index.html`**

- Botón de arriba: `Guardar` → `Guardar preferencias`.
- Títulos nuevos encima de cada campo: `🔑 Contraseña` y `✉️ Correo electrónico`.
- Botón de contraseña: `Cambiar` → `Guardar contraseña`, con clase `btn-auth btn-auth-primary` (morado).
- Botón de correo: `Cambiar` → `Cambiar correo`, con clase `btn-auth btn-auth-primary` (morado).
- Aviso amarillo del enlace de "Olvidé mi contraseña": ahora dice "pulsa Guardar contraseña" (antes decía "pulsa Cambiar").

**`js/modules/panel-usuario-2.js`**

- Solo en `cambiarPasswordCuenta()`: los errores de Supabase se muestran en español.
  - "different from the old" → "Esa ya es tu contraseña actual. Escribe una diferente."
  - "session missing" → "Tu sesión venció. Cierra sesión, vuelve a entrar e inténtalo de nuevo."
  - "at least / weak / short" → "La contraseña es muy débil o corta. Usa más caracteres, con letras y números."
- No cambió la lógica de guardado.
- `cambiarCorreoCuenta()` **no se tocó**: su mensaje de error sigue saliendo en inglés cuando viene de Supabase.

No se modificó ningún otro archivo.

## 4. Qué falta para que quede aplicado

- [ ] Reemplazar `index.html` (raíz) y `js/modules/panel-usuario-2.js` en el repositorio y hacer push.
- [ ] Esperar el despliegue en Vercel y revisar cómo queda el modal, sobre todo en móvil (los botones más largos podrían quedar apretados).
- [ ] Probar: escribir una contraseña distinta, pulsar `Guardar contraseña`, cerrar sesión y entrar con la nueva.

## 5. Posibles errores de Supabase al cambiar contraseña (por si vuelve a pasar)

| Mensaje | Qué significa |
|---|---|
| New password should be different from the old one | Es la misma contraseña que ya tenía |
| Auth session missing | La sesión de Supabase no está activa (la página puede mostrar al usuario desde `sessionStorage` aunque Supabase ya no tenga sesión): cerrar sesión y entrar de nuevo |
| Password should be at least N characters / weak password | La política de contraseñas de Supabase exige más que los 8 caracteres de la página |
| Reauthentication needed | Está activado "Secure password change" y la sesión no es reciente |

## 6. Hallazgos del análisis de código (NO aplicados, pendientes de decidir)

Revisión hecha el mismo día sobre el zip `pagina--main`. Los tres `panel-usuario-*.js` solo se revisaron con búsquedas, no línea por línea.

1. **XSS en botones de tarjetas** (`ui-controller.js`, líneas 66-68): los títulos se meten dentro de `onclick="...'titulo'..."`. `escHtml` no escapa `'` ni `\`, y un título como `\'-alert(1)-\'` rompe el reemplazo `'` → `\'`. Arreglo: usar `data-*` + `addEventListener` y hacer que `escHtml` escape también `'`. **Es lo más urgente.**
2. **Endpoint `chat-ia` público:** cualquiera con la clave publishable puede llamarlo y gastar la cuota de Groq. La función no viene en el zip; verificar que exija sesión y tenga límite de uso.
3. **`sessionStorage` guarda el usuario completo** (correo, celular, IP, GPS) y se restaura sin consultar de nuevo. Mejor guardar solo el `id`.
4. **Sin CSP ni SRI** en los 3 scripts de jsDelivr. Tailwind se carga con `cdn.tailwindcss.com` (modo desarrollo): compilarlo para producción.
5. **Datos falsos mezclados con los reales** (`main.js`, `database.js`): 100 productos de dummyjson con país y modalidad aleatorios más 6 artículos de prueba, junto con los de Supabase.
6. **Rendimiento:** `ipapi.co` se llama dos veces (`GeoService` y `UbicacionUsuario`); `i18n.js` (107 KB) carga los 17 idiomas siempre; `panel-usuario-3.js` pesa 136 KB; Tesseract y jsQR cargan aunque no se usen.
7. **Mantenibilidad:** 21 scripts globales con `var` que dependen del orden de carga, y HTML armado con strings concatenados.
8. **Menores:** `e.message` sin escapar en `event-controller.js` (líneas 236 y 251); sección "Estructura del Proyecto" del README vacía; las bitácoras (SQL de políticas, nombres de tablas y columnas) no deberían quedar en un repositorio público.
