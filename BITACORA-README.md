> **Estado: el `README.md` corregido ya está preparado. Falta subirlo a GitHub.**

# Bitácora — Corrección del número de idiomas en el README

**Fecha:** 30/09/2026

---

## 1. Qué se encontró

- El `README.md` (línea 12) decía **16 idiomas**.
- El selector de idioma de `index.html` tiene **17**: `es en pt fr de it ru bg qu ay zh ja ko ar hi nl tr`.
- Lo más probable es que falte el ruso (`ru`) en la cuenta: se agregó después y el README no se actualizó.
- No afecta el funcionamiento de la página. Es solo un error de documentación.

## 2. El cambio

**Archivo:** `README.md`, línea 12.

```diff
-  **16 Idiomas**: Incluye Quechua y Aymara para inclusión cultural.
+  **17 Idiomas**: Incluye Quechua y Aymara para inclusión cultural (en textos legales y de login se muestran en español).
```

No se tocó ningún archivo de código.

## 3. Por qué quechua y aimara quedan en español en algunos textos

Es una decisión a propósito: Groq no traduce bien esos idiomas, así que se prefiere mostrar español antes que traducciones inventadas.

- Documentos legales: `IDIOMAS_LEGAL_SOLO_ES` en `institucional.js`.
- Artículos del muro: `IDIOMAS_SOLO_ES` en `contenido-info.js`.
- Login y registro: `i18n-auth.js` tiene 15 idiomas, sin `qu` ni `ay`.

## 4. Pendientes

- [ ] Reemplazar el `README.md` de la raíz del repositorio y subirlo a GitHub.
- [ ] Decidir si se completa la sección "Estructura del Proyecto" del README, que hoy termina en el título, sin contenido debajo.
