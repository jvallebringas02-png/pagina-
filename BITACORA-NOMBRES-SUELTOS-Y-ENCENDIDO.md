> **Estado (14/11/2026): LISTO Y PROBADO EN NODE; FALTA PROBARLO EN LA PÁGINA DE PRUEBA.** Con este parche **los 8 interruptores quedan PRENDIDOS** y la página reconoce nombres sueltos como `Juan`. Nada se probó en un navegador real ni contra tu Supabase real.

# Bitácora — Nombres sueltos y encendido de la búsqueda por capas

**Fecha:** 14/11/2026
**Continúa:** `BITACORA-BUSQUEDA-POR-CAPAS-3.md` y `BITACORA-PARCHE-CORREO-Y-LIMPIEZA.md`
**Base:** el zip `pagina--main.zip` ya con el parche anterior (error de la línea 83 y correo fuera de las tarjetas).

---

## 1. Qué se hizo

| Pieza | Cambio |
|---|---|
| `js/modules/intencion-busqueda.js` | Acepta `contexto.esNombreConocido(palabra)`. Con ella, `Juan`, `juan perez`, `maria torres` o `Juan de la Cruz` son **personas sin ambigüedad**. Sin la función, todo se comporta como antes. |
| `js/modules/motor-busqueda-personas-datos.js` | Nuevas `nombresConocidos(yo)` y `precargar(opciones)`. Guarda las palabras de nombres y apellidos de `perfiles_publicos` (sin tildes, minúsculas, 3 letras o más, sin los míos) durante 10 minutos. `invalidarCache()` también las borra. |
| `js/modules/panel-usuario-3.js` | La puerta (`_fraseEsDePersonasPorCapas`) pasa esos nombres a la intención. Si todavía no se leyeron, los lee en segundo plano. |
| `index.html` | Los 8 interruptores de `window.BUSQUEDA_CAPAS` pasan a `true`. |
| `pruebas/` | Prueba nueva `nombres-conocidos.test.js` (50). `conexion-pantallas.test.js` ya no exige que los interruptores vengan apagados. `simulacion-paso6.js` actualizado (reemplaza al anterior). |

## 2. Cómo decide ahora

Un nombre suelto es persona solo si **todas** sus palabras (sin conectores `de`, `la`, `los`...) son nombres o apellidos de perfiles reales, hay de 1 a 4 palabras, y **no** hay señal de producto.

| Frase | Antes | Ahora |
|---|---|---|
| `Juan`, `María`, `juan perez` | ambigua / IA | personas, **sin IA** |
| `Juan de la Cruz` | IA | personas, sin IA |
| `laptops`, `Pedro vende laptops`, `juan laptop` | productos | igual |
| `rosa` si también es producto del catálogo | ambigua | gana el producto |
| `Fernando` (nombre que nadie tiene en tu base) | IA | IA |
| `hola`, `videos de gatos` | IA | IA |

## 3. Límites que conviene saber

- **La primera búsqueda de un nombre suelto tras abrir la página puede ir a la IA.** Los nombres se leen al primer intento (o cuando abres Buscar Personas, Compartir, etc.) y desde ahí valen 10 minutos. Pasado ese tiempo se vuelven a leer en segundo plano.
- Una persona nueva, o un nombre que nadie tiene en tu base, sigue yendo a la IA.
- **Choques entre nombre y producto** (`Rosa`, `Flores`, `Vega`): si el catálogo conoce la palabra como producto, o es un producto común, gana el producto. Si solo es nombre en tu base, gana persona.
- `armas` como apellido suelto ahora cae en personas y el motor lo **bloquea** (solo Buscar Personas permite "Carlos Armas").
- Tope de 500 perfiles del motor: pasado eso, los nombres de más no se reconocen.

## 4. Pruebas (Node)

| Suite | Resultado |
|---|---|
| `limpieza-busqueda.test.js` | 53 de 53 |
| `intencion-busqueda.test.js` | 191 de 191 |
| `busqueda-por-capas.test.js` | 44 de 44 |
| `conexion-pantallas.test.js` | 37 de 37 |
| `interprete-busqueda-personas.test.js` | 187 de 187 |
| `motor-busqueda-personas.test.js` | 95 de 95 |
| `motor-busqueda-personas-datos.test.js` | 17 de 17 |
| `motor-busqueda-personas-ayuda.test.js` | 40 de 40 |
| **`nombres-conocidos.test.js` (nueva)** | **50 de 50** |
| `simulacion-paso6.js` | 36 de 36 |

## 5. Cómo subirlo

Reemplazar en el repositorio (mismas rutas):
- `index.html`
- `js/modules/intencion-busqueda.js`
- `js/modules/motor-busqueda-personas-datos.js`
- `js/modules/panel-usuario-3.js`
- `pruebas/conexion-pantallas.test.js`, y agregar `pruebas/nombres-conocidos.test.js` y `pruebas/simulacion-paso6.js`.

**Súbelos a la página de PRUEBA primero.** Después de publicar: Ctrl+F5, F12 y mirar la consola sin errores en rojo.

## 6. Qué probar en la página de prueba (con sesión iniciada, en computadora y celular)

- [ ] Buscar Personas: `Juan`, `@usuario`, un apellido, una letra inicial. Sin correo en las tarjetas.
- [ ] Compartir y Nuevo mensaje: buscar a alguien.
- [ ] Filtro de zona de la página.
- [ ] Caja principal: `@usuario`, un nombre, `laptops` (debe seguir como antes), `hola`. Que no quede el "buscando…" colgado.
- [ ] Asistente: `busca quien venda laptops`, una conversación normal.
- [ ] Panel: chat y buscador de arriba.
- [ ] Con **otra cuenta** y **sin sesión** (sin sesión todo debe ir a la IA como antes).
- [ ] La cuota de la IA debería bajar en las frases de personas.

## 7. Cómo apagarlo

- **Una pantalla:** en `index.html`, poner ese interruptor en `false` y publicar. Sin publicar, desde la consola: `BUSQUEDA_CAPAS.principal = false`.
- **Todo de golpe:** `BusquedaPorCapas.interruptores.entrada = false` (consola), o los 8 en `false`.
- **Solo los nombres sueltos:** `BusquedaPorCapas.interruptores.intencion = false` apaga también la puerta.
- **Quitar el parche:** restaurar los 4 archivos del zip anterior. Sin cambios en Supabase.

## 8. Qué NO está probado

Navegador real, celular, Vercel, tu Supabase real (RLS, vista `perfiles_publicos`), la IA real y la cuota real. Con los 8 interruptores prendidos **a la vez**, si algo falla no sabrás cuál pantalla lo causó: por eso conviene mirar cada pantalla de la lista de arriba y, si una falla, apagar solo esa.

## 9. Pendientes

- [ ] Paso 6: confirmar la lista de la sección 6 con 3 cuentas.
- [ ] Los borrados de archivos duplicados (ver `BITACORA-PARCHE-CORREO-Y-LIMPIEZA.md`).
- [ ] `quien vende laptops` también devuelve a quien vende un celular (misma categoría): revisar con datos reales.
- [ ] Letras repetidas: `Juaaaan` se reduce a `juaan` y no encuentra a `juan`.
- [ ] Paso 7: idiomas y revisar `BuscadorMotor.normalizar`.
- [ ] Tope de 500 perfiles y 1000 productos del motor.

## 10. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 14/11/2026 | Nombres sueltos conocidos + interruptores prendidos | 4 archivos modificados, 1 prueba nueva; 10 suites en verde; **falta probar en la página de prueba** |
