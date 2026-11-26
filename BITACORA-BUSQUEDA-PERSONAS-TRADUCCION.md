> **Estado (26/11/2026): CÓDIGO HECHO Y PROBADO CON NODE. NO SE PROBÓ EN EL NAVEGADOR NI CONTRA TU SUPABASE REAL.** Las traducciones las escribió una IA y faltan por revisar con hablantes nativos. Todo lo marcado "no probado" hay que comprobarlo en la página publicada.

# Bitácora — Traducción de "Buscar Personas" a los idiomas de la página

**Fecha:** 26/11/2026
**Continúa:** `BITACORA-BUSQUEDA-POR-CAPAS-4.md` y `BITACORA-TRADUCCION.md` (arquitectura de traducción)
**Método:** lectura del zip `pagina--main.zip`, cambios en el código y pruebas en Node (12 suites). No se abrió la página publicada.

## 1. Qué se encontró
- Solo la guía (`js/i18n-guia-busqueda.js`) estaba traducida. La pantalla, las tarjetas y los mensajes del motor estaban en español fijo, y `panel-usuario-1.js` no usaba ninguna traducción.
- **La guía respondía siempre en español**: `Guia.decidir` recibía `contexto.idioma`, pero ninguna pantalla lo pasaba, y sin él usaba español.

## 2. Qué se cambió
- **Nuevo `js/i18n-buscar-personas.js`:** 102 claves × 15 idiomas (`es en fr pt de it nl ru zh ja ko ar hi bg tr`). Quechua y aimara caen al español, como el resto del contenido. Trae `BuscarPersonasI18n.t(clave, vars, idioma)` y los atajos `tBP` (texto) y `eBP` (texto escapado para HTML). Se carga en `index.html` después de `i18n-guia-busqueda.js`.
- **`motor-busqueda-personas.js`:** todos los mensajes, etiquetas de criterios ("Zona: …", "Precio: …"), avisos, alternativas y sugerencias pasan por `tr()`. El idioma sale de `contexto.idioma` o, si falta, del idioma actual de la página. NOMBRE_ZONA, NOMBRE_TIPO, SIN_PUBLICAR y ETIQUETA_SALIDA siguen usándose igual (ahora traducen al leerlos). Los criterios `lugar` y `zona` guardan `valorEt` para no depender del prefijo del texto. La guía ahora recibe el idioma.
- **`panel-usuario-1.js`, `panel-usuario-3.js`, `ui-controller.js`:** pantalla de Buscar Personas, botones de zona, tarjetas, "Entendí", "Pensando…", mensajes sin resultados, Compartir y Nuevo mensaje (selector, botón Enviar y aviso de envío).
- **Pruebas:** `pruebas/i18n-buscar-personas.test.js` (73 comprobaciones: 15 idiomas con las mismas claves y marcas, caída a español, motor en en/ja/fr/de, guía en inglés). `conexion-pantallas.test.js` ahora carga también el diccionario. **12 de 12 suites pasan.**

## 3. Lo que NO se hizo / límites
- **El intérprete sigue entendiendo solo español:** `find Mario near me` se busca como nombre. Es otro trabajo (ver `BITACORA-BUSQUEDA-POR-CAPAS-4.md`).
- **Al cambiar de idioma con resultados en pantalla**, los textos ya dibujados no se vuelven a traducir hasta la siguiente búsqueda (el motor arma los textos al buscar).
- **No se tradujeron** nombres de personas, títulos de publicaciones, ciudades ni categorías que vienen de la base de datos.
- Quedan en español: `Mensaje directo` y los nombres de relleno `Usuario` fuera de los selectores de personas, y el texto "Todavía no tienes tu localidad…" de Compartir usa ahora la misma frase que el panel.
- **Leído en el código, no probado en vivo:** `idiomaDetectado` (global de `i18n.js`) se actualiza en `changeLanguage` y `aplicarIdiomaSilencioso` (líneas 406 y 513), y de ahí lee el idioma el diccionario. Comprobar en la página.
- **Revisión nativa pendiente** de todos los idiomas, sobre todo ar, hi, bg, tr, ko, ja, zh y ru (en `tr`, `nvRegional` repite "aynı bölgenizden").

## 4. Cómo probar
1. `node pruebas/i18n-buscar-personas.test.js` y las demás suites.
2. En la página publicada, cambiar el idioma a inglés, japonés y árabe, abrir "Buscar Personas" y probar: una búsqueda sin resultados, "gente nueva", una zona sin definir y un texto que no se entienda (debe salir la guía en ese idioma).
3. Compartir y Nuevo mensaje: buscar a alguien y ver el botón "Enviar a N personas".
