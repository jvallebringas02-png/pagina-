> **Estado (24/10/2026): DATOS COMPROBADOS Y DECISIONES PROPUESTAS, SIN CÓDIGO DEL MOTOR. Esta bitácora se escribió antes de construir nada. Los datos salen de consultas de solo lectura que ejecutaste en Supabase (conteos y nombres de columnas; ningún dato de personas). Lo marcado "por confirmar" hay que decidirlo o comprobarlo antes de construir.**

# Bitácora — Motor de búsqueda de personas: datos reales y decisiones

**Fecha:** 24/10/2026
**Continúa:** `BITACORA-MOTOR-BUSQUEDA-PERSONAS.md` (diseño del motor), `BITACORA-BUSQUEDA-PERSONAS-ESTRUCTURA-UNICA.md`
**Alcance:** solo el motor de búsqueda de personas. Las bitácoras se borrarán cuando termine el panel de usuario; no se tocan aquí.
**Idea:** el motor recibe la ficha del intérprete v3, busca en Supabase y devuelve personas. Ya se conocen los datos reales, y con ellos cambian algunas reglas del diseño.

---

## 1. Dónde está el trabajo

| Pieza | Estado |
|---|---|
| Intérprete v3 (`interprete-busqueda-personas.js`) | Hecho. 121 de 121 pruebas pasan. **Sin conectar** a ninguna pantalla ni cargado en `index.html` |
| Motor (busca en Supabase y devuelve personas) | **Falta construirlo** |
| Presentación (tarjetas y "Busqué: …") | Falta |
| Conectar las 5 pantallas | Falta |

**Pendientes pequeños del intérprete** (comprobados): `sanear({iniciales:['j']})` no exige segunda pista (el camino de la IA se salta la regla que sí aplica `interpretar`); "todas las personas" deja el nombre `todas las`; "Ng" y "Ly" se leen como iniciales; `co-caina` pasa. Lo de "heroína" y "pasta base" bloqueando es una decisión pendiente. El archivo de pruebas debe ir en `pruebas/` (su ruta interna `../js/modules/` solo funciona desde ahí).

## 2. Datos comprobados en Supabase

**Publicaciones (`productos`, 42 filas)**

| Dato | Resultado |
|---|---|
| Categoría | Ropa 26, Hogar 13, Tecnología 2, Otros 1. **No hay "Servicios"** |
| Estado | `aprobado` 41, `borrador` 1 |
| Modalidad | `venta` 42. **No hay trueque ni donación** |
| Alcance | local 36, mundial 4, regional 2 |
| Moneda y precio | Las 42 en PEN y con precio |
| `nivel_alerta_legal` | 39 vacías, 3 "bajo" |
| `nivel_alerta_ocr` | 39 vacías, 2 "bajo", 1 "medio" |
| `ia_scan_status` | Las 42 en "pendiente" (el estado no se actualiza, aunque haya algún nivel de alerta) |
| `reportes_count` | 0 en las 42 (según otra sesión, no se actualiza aunque haya un reporte) |
| Ciudad (texto libre) | Lima 13, San Jeronimo 10, Pacora 6, Urpipata 2, "🌍 Global" 2 (país "Mundo"), y 1 cada una: Trujillo, Cajamarca, callao, Colquemarca, Sacsamarca, La Esperanza, Chafana, Viru, más 1 fila con "null" |

**Personas (`perfiles_publicos`, 9 filas)**

- Columnas: id, nombres, apellidos, `localidad_id`, categoria, pais, nombre_usuario, `created_at`, foto_perfil, foto_portada. **No trae correo, celular ni ciudad.**
- **7 de 9 no tienen `localidad_id` ni país.** Solo 2 los tienen (Callao, Perú).
- Trae `created_at`: "los más nuevos" es posible.
- Es una vista sin filtro de cuentas suspendidas (dato de otra sesión). No se toca.

**Localidades (`localidades`, 7 filas)**: Callao, Lima, Trujillo (La Libertad) y Arequipa, de Perú (`pais_id` 1); Sofia con `pais_id` 13 y otra con 2, y Plovdiv (`pais_id` 2). Columnas: id, pais_id, nombre, region, id_estatus, latitud, longitud, radio_cobertura_km, fecha_activacion. **Ciudades como San Jeronimo, Pacora o Urpipata no están en `localidades`.** Los dos "Sofia" con países distintos parecen dato de prueba; no se tocan.

**Otras tablas y extensiones**

- `bloqueados` (bloqueador_id, bloqueado_id): la página solo oculta a quien **yo** bloqueé.
- `reportes` (estado, producto_id, usuario_reporta_id, usuario_reportado_id): permite distinguir reportes pendientes. **Por confirmar:** valores de `reportes.estado`.
- `busquedas_log` y `patrones_busqueda` guardan `usuario_id` y el texto buscado; **la página no los usa**. No se reutilizan para personas (la regla es registrar sin identificar).
- `usuarios` tiene `estado`, `id_estatus` y `privacidad_mensajes`; no hay preferencia de "aparecer en búsquedas".
- Extensiones: `postgis`, `pgcrypto`, `uuid-ossp`, `http`, `supabase_vault`, `pg_stat_statements`. **No están** `pg_trgm`, `unaccent` ni `pgvector`. Se podrían activar desde el panel de Supabase (no se verificó en tu plan).

## 3. Qué cambia en el diseño por los datos

1. **"Aprobada"** es `estado = 'aprobado'`. El borrador no cuenta.
2. **La ubicación de una persona casi no existe en el perfil** (7 de 9 sin localidad). Si solo se usara el perfil, "personas de mi localidad" encontraría como máximo 2.
3. **Las ciudades de las publicaciones no coinciden con `localidades`.** Comparar por ahí perdería casi todo. Para "vende X en Y" se usa el texto de `productos.ciudad` y `productos.pais`.
4. **La ciudad es texto libre y desordenado** ("callao" en minúscula, "Viru" y "San Jeronimo" sin tilde, "🌍 Global" con país "Mundo", un "null"). Se compara sin tildes ni mayúsculas, y "Global" o "Mundo" cuentan como mundial.
5. **Dos campos de alerta:** `nivel_alerta_legal` y `nivel_alerta_ocr`. Con la regla estricta ("solo 'bajo'"), 39 de 42 publicaciones quedarían fuera.
6. **Servicios, trueque y donación:** no existen hoy. El motor responde con honestidad en vez de devolver una lista vacía.

## 4. Decisiones propuestas (por confirmar)

| # | Decisión | Propuesta |
|---|---|---|
| 1 | Alertas | **Opción A:** una publicación entra si sus dos alertas están vacías o son "bajo". Con "medio" o "alto" en cualquiera, queda fuera (hoy: 1 de 42). Pasar a la estricta cuando el análisis de la IA funcione |
| 2 | Ubicación de la persona | La localidad del perfil; **si falta, la ciudad más frecuente de sus publicaciones aprobadas** |
| 3 | "Vende X en Y" | Comparar con la ciudad y el país **de la publicación** |
| 4 | "Personas de Y" (sin oferta) | Comparar con la ubicación de la persona (decisión 2) |
| 5 | Correo | No se muestra en resultados (la vista ya no lo trae) |
| 6 | Bloqueados | Solo los que yo bloqueé. En los dos sentidos exige una función en la base (etapa posterior) |
| 7 | Máximo de resultados | 20 |
| 8 | Reportes | **No se aplican en la v1**: `reportes_count` no es confiable y faltan los valores de `reportes.estado` |
| 9 | Lista de riesgo | "Heroína" y "pasta base" siguen bloqueando; "escort" salvo auto; armas con excepciones (agua, silicona, juguete) |

## 5. Lógica del motor (v1)

El motor es una pieza aparte del intérprete y recibe la ficha.

- **Paso 0 — Riesgo.** Nivel "alto": no busca y muestra el aviso de normas, sin repetir la palabra. "Medio": busca sin decir nada especial.
- **Paso 1 — Tipo de búsqueda.** `nuevos` (ordenar por `created_at`), `nombre`, `usuario`, `filtro` (zona, lugar, oferta o rol) o `vacia` (pedir que escriba algo; no consulta).
- **Paso 2 — Por nombre o `@usuario`.** Comparación sin tildes y palabra por palabra, en ambos lados. Orden: nombre completo exacto, empieza con el texto, contiene, iniciales. Excluye a quien busca y a los bloqueados. Una sola letra no lista a nadie.
- **Paso 3 — Por lo que vende.** Publicaciones con `estado = 'aprobado'` y alertas permitidas, cuyo título, descripción o categoría coincidan. Se toman los `usuario_id` sin repetir y se leen esas personas. La palabra de oferta se traduce a categoría con una tabla corta (laptop, celular → Tecnología; ropa, zapatos → Ropa; mueble → Hogar…); si no hay categoría clara, solo texto.
- **Paso 4 — Por lugar.** Con oferta: ciudad y país de la publicación. Sin oferta: ubicación de la persona (perfil, o ciudad de sus publicaciones). Para "mi localidad / región / país": la del que busca; **si no la tiene (7 de 9 usuarios), se muestra "Define tu localidad en Configuración" en vez de una lista vacía**.
- **Paso 5 — Combinar.** Todo con "y". Si la combinación no da nadie, dice qué criterio no encontró nada y ofrece quitarlo ("Hay personas que venden ropa, pero ninguna en Trujillo").
- **Paso 6 — Resultado.** Máximo 20. Cada tarjeta: foto, nombre, ubicación, hasta 3 ofertas, Ver perfil y Mensaje. Arriba, `describir(ficha)`.

**Honestidad con los datos de hoy:** "da servicios" → "Todavía no hay servicios publicados"; "regala" o "cambia" → "Todavía no hay publicaciones de trueque o donación"; "compra" → se avisa que no se guarda lo que alguien quiere comprar; precio y rol: la pantalla indica **qué filtros aplicó y cuáles no**.

## 6. Cómo se construiría

- **Archivo nuevo:** `js/modules/motor-busqueda-personas.js` (no `panel-usuario-4.js`, porque también lo usa el chat de la página principal).
- **Dos capas:** un núcleo puro (`buscar(ficha, datos)` sobre listas de personas y publicaciones) y otra capa que carga los datos de Supabase. Así se prueba con datos de ejemplo, sin red.
- **Escala:** con 9 personas y 42 publicaciones se filtra en el navegador. Cuando crezcan, se pasa a una función SQL con límites (etapa posterior).
- **No se borra el código viejo** hasta probar el nuevo.

**Dónde se conecta (de a uno, en este orden):**
1. "Buscar personas" del panel (`panel-usuario-1.js`, `buscarEnPanelPersonas`).
2. Selector de Compartir y Nuevo mensaje (`panel-usuario-3.js`, `buscarPersonaPicker`).
3. Chat del panel (`panel-usuario-3.js`, acción `BUSCAR_PERSONA`).
4. Chat de la página principal (`event-controller.js`, acción `BUSCAR_PERSONA`).
5. Cambio de zona sobre los resultados (`ui-controller.js`).

## 7. Pasos (marcar al hacerlos)

- [x] 1. Consultas de solo lectura de datos (hechas el 24/10/2026).
- [ ] 2. **Confirmar las decisiones de la sección 4**, en especial la 2.
- [ ] 3. Pequeños arreglos del intérprete (sección 1), con sus pruebas.
- [ ] 4. Construir el núcleo del motor y sus pruebas con datos de ejemplo (sin red, sin conectar).
- [ ] 5. Capa de Supabase y presentación (tarjeta única y "Busqué: …").
- [ ] 6. Textos al sistema de traducción (15 idiomas; quechua y aimara en español).
- [ ] 7. Conectar las 5 pantallas, una por una.
- [ ] 8. Probar cada una con 3 cuentas (sin sesión, la propia y otra), en computadora y celular.

## 8. Pruebas previstas del motor (con datos de ejemplo)

- [ ] "ropa en Lima": personas con publicaciones aprobadas de ropa en Lima.
- [ ] "ropa en trujillo" y "ropa en Trujillo": mismo resultado (sin tildes ni mayúsculas); "callao" encuentra "Callao".
- [ ] "ropa en Trujillo" cuando nadie vende ropa allí: dice qué criterio falló.
- [ ] "personas de mi localidad" con quien busca sin localidad: aviso de configuración, no lista vacía.
- [ ] Una publicación en borrador o con alerta "medio" u "alto" no cuenta; una con alerta vacía sí (opción A).
- [ ] "quien da servicios", "que regale o cambie": mensajes de honestidad.
- [ ] "Juan Regalado", "Ana de la Cruz", "Muñoz": búsqueda por nombre correcta.
- [ ] Una sola letra: pide una segunda pista. Por la ruta de la IA también (arreglo del intérprete).
- [ ] Frase bloqueada: aviso sin repetir la palabra y sin consultar nada.
- [ ] No aparece quien busca ni quien bloqueé. Nunca se muestra el correo.
- [ ] Máximo 20 resultados.

## 9. Límites y riesgos

- **No es una barrera de seguridad:** la lista de riesgo es un freno; la protección real va al publicar y en los reportes.
- **Listado masivo:** el navegador no puede impedir que alguien con sesión lea toda la vista. Con 9 personas no importa; es el motivo real de la función SQL (etapa posterior).
- **No se verificó qué filas permiten leer las reglas de la base** (RLS) de `perfiles_publicos` y `productos`.
- **Bloqueo en los dos sentidos:** hoy solo se oculta a quien yo bloqueé.
- **La ubicación por publicaciones es un respaldo:** una persona que vende en San Jeronimo y vive en Lima aparecería en San Jeronimo.
- **El intérprete solo entiende español.**
- **Todo probado con Node y con datos de ejemplo, no en el navegador.**

## 10. Cómo volver atrás

El motor vive en un archivo nuevo y el código viejo no se borra. Se desconecta quitando el `<script>` de `motor-busqueda-personas.js` de `index.html` y las llamadas nuevas en cada pantalla. Cada pantalla se conecta por separado, así que se revierte una sin tocar las demás.

## 11. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 24/10/2026 | Consultas de solo lectura en Supabase (conteos, columnas, extensiones, estados, localidades) | Datos comprobados; reglas del motor ajustadas (secciones 3 y 4) |
| 24/10/2026 | Esta bitácora | Decisiones propuestas; sin código del motor |
