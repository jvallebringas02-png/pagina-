> **Estado (12/11/2026): DISEÑO Y REVISIÓN, SIN CÓDIGO NUEVO.** En esta sesión solo se leyó el zip del 10/11/2026, se corrieron las pruebas existentes en Node y se probó el intérprete con frases de ejemplo. **No se cambió ningún archivo de la página. Nada se probó en un navegador real ni contra tu Supabase.**

# Bitácora — Búsqueda por capas (limpieza, intención, interpretación, búsqueda, resultado)

**Fecha:** 12/11/2026
**Continúa:** `BITACORA-MOTOR-BUSQUEDA-PERSONAS-CONEXION-PANTALLAS-1.md` y `BITACORA-AYUDA-BUSQUEDA-PERSONAS.md`
**Idea (tuya):** que el buscador principal, el asistente y "Buscar Personas" usen **el mismo algoritmo**, organizado por capas: primero se limpia el texto, luego se entiende qué quiere la persona, luego se busca y al final se muestra.

---

## 1. Las capas

| Capa | Pregunta que responde | Quién la hace | Estado hoy |
|---|---|---|---|
| **0. Limpieza** | ¿El texto es seguro y uniforme? | Una sola función compartida | **No existe como capa.** Está repartida (`sanear()`, `BuscadorMotor.normalizar`, limpieza dentro de `buscarUsuariosPorNombre`) |
| **1. Intención** | ¿Quiere buscar personas, productos, video, música, localidad u otra cosa? | Reglas; la IA solo si hay duda | **Dispersa:** cuatro funciones y la IA, en sitios y órdenes distintos |
| **2. Interpretación** | ¿Qué datos trae: nombre, @usuario, iniciales, lugar, oferta, orden? | Intérprete (la ficha) | Hecha para personas (v3.1). Productos tiene la suya (`tokenizar`, `extraerLugar`) |
| **3. Búsqueda** | ¿Quién o qué coincide en la base? | Motor y capa de datos | Hecha para personas y para productos |
| **4. Resultado** | ¿Cómo se muestra y qué se dice si no hay nadie? | Tarjetas, avisos, sugerencias | Hecha; cada pantalla dibuja a su manera |

Cada capa recibe la salida de la anterior y no necesita saber cómo se hizo. La IA **no escribe la consulta**: solo puede ayudar a llenar la ficha, y la ficha pasa por `sanear()` antes de buscar.

## 2. Qué hace la capa 0 (limpieza)

- Quitar espacios de sobra y cortar frases muy largas (tope sugerido: 150 a 200 caracteres).
- Quitar o neutralizar `, ( ) % _` y comillas (hoy pueden romper el filtro `.or()` de Supabase).
- Quitar caracteres invisibles o raros y letras repetidas exageradas ("holaaaaa").
- Minúsculas y sin tildes **solo para comparar** ("Pérez" = "perez").

**Dos cuidados:**
1. **No borrar información.** Se guarda el texto original para mostrarlo ("Busqué: Juan Pérez") y la versión limpia solo se usa para buscar. Las palabras de relleno ("quien", "personas") **no se quitan aquí**: son las pistas de la capa 1 ("quien vende laptops" = personas; "laptops" = productos). Se descartan recién al interpretar.
2. **La lista de riesgo revisa el texto limpio**, para atrapar trucos como "co-caina" o "armas" con tildes y símbolos (pendiente conocido del intérprete).

## 3. Qué hace la capa 1 (intención)

Una sola puerta de entrada que reúne lo que hoy está suelto: `detectarIntencionExplorarLocalidad`, `detectarIntencionQuienesSomos`, `detectarIntencionMatriz` y la clasificación de la IA (`BUSCAR_PERSONA`, productos, etc.).

Señales para decidir **personas**: `@usuario`, palabras como "quien", "persona", "usuarios", "gente", iniciales, un nombre propio. Si no hay señal clara, se muestran ambas cosas o se pregunta una vez; no se adivina.

Intenciones que el usuario puede expresar (la lista es cerrada aunque las frases no lo sean): vende producto, da servicio, regala o dona, cambia o trueque, compra o busca algo, persona concreta, lugar, gente nueva.

## 4. Qué hay hoy en la página (revisado en el zip del 10/11/2026)

**Lugares de búsqueda**

| Lugar | Qué busca | Cómo entiende la frase |
|---|---|---|
| Caja principal (`dynamicSearch`) | Productos, video, música, web | La IA clasifica la acción, más `BuscadorMotor` |
| Asistente de la página y chat del panel | Lo mismo, más personas | La IA más funciones sueltas |
| Buscar Personas, Compartir, Nuevo mensaje | Personas | Intérprete y motor de personas |
| Explorar localidad y matriz de categorías | Zonas y categorías | `detectarIntencionExplorarLocalidad` y `detectarIntencionMatriz` |

**Lo repetido**
- `BuscadorMotor.normalizar` y la limpieza del intérprete hacen casi lo mismo por separado.
- Hay al menos cuatro funciones que deciden la intención.
- El lugar se detecta dos veces: `BuscadorMotor.extraerLugar` y el campo `lugar` del intérprete, con reglas distintas. Por eso "Callao" puede entenderse distinto según la pantalla.

**Diferencia real entre pantallas (antes del motor, no en el motor)**
- En **Buscar Personas** todo va directo al motor.
- En el **buscador principal y el asistente**, la IA debe clasificar primero la frase como `BUSCAR_PERSONA` (`event-controller.js`, `panel-usuario-3.js`). Si la clasifica de otra forma, el motor no se ejecuta. Consecuencias: la misma frase puede dar resultados distintos según el día, se gasta cuota de IA y, si la IA falla, la búsqueda de personas deja de funcionar desde la página principal.
- El asistente reintenta con el nombre que sacó la IA; Buscar Personas no.
- Los botones de ejemplo y de salida solo existen en Buscar Personas.

## 5. Datos reales (consulta de solo lectura del 12/11/2026)

- `perfiles_publicos`: 9 personas, todas con categoría "General" (no sirve para buscar por segmento). Trae `nombres`, `apellidos`, `nombre_usuario`, `pais`, `localidad_id`, `categoria`, `created_at`, `foto_perfil`, `foto_portada`.
- `localidades`: `nombre`, `region`, `pais_id` (número; no se vio la tabla de países).
- `productos`: 42 en total. `estado`: 41 aprobado, 1 borrador. `modalidad`: 42 de 42 "venta". `alcance`: 36 local, 4 mundial, 2 regional.
- **Consecuencia:** "quien compre", "regala", "dona", "cambia" y "da clases" no tienen datos. La página debe entenderlos y responder con honestidad ("Todavía no hay servicios publicados"). Hoy el intérprete ya los marca como `hace_no_soportado`.
- La vista no trae estado de cuenta ni `privacidad_mensajes`: ocultar suspendidos y mostrar "Mensaje" solo a quien acepta mensajes requiere leer otra tabla o una función SQL.

## 6. Verificado en esta sesión

**Pruebas (copia del zip, con Node):** intérprete 175/175, motor 89/89, datos 17/17, ayuda 40/40.

**Frases probadas con el intérprete**

| Frase | Resultado |
|---|---|
| `busca usuarios de Callao` | lugar: Callao |
| `usuarios de Perú` | lugar: Perú |
| `busca quien venda laptops` | oferta: laptops, hace: vende |
| `quien compre libros en Arequipa` | lugar: Arequipa, oferta: libros, **compra marcado como no soportado** |
| `Ana de Callao que venda ropa` | nombre: Ana, lugar: Callao, oferta: ropa |
| `J P` | iniciales: j, p |
| `@jvalle` | usuario: jvalle |
| `gente nueva` | orden: recientes |
| `emprendedores en Trujillo` | rol: emprendedores (devolverá nadie: todos son "General") |
| **`usuarios con inicial J`** | **Fallo:** se lee como nombre "inicial J" en vez de filtrar por la letra J |

## 7. Hallazgos para corregir

1. **`usuarios con inicial J` / `nombre empieza con M`** se interpretan como nombre. Debe ser un filtro por inicial.
2. **Dos archivos de prueba en la carpeta equivocada:** `motor-busqueda-personas-datos.test.js` y `motor-busqueda-personas-ayuda.test.js` están en `js/modules/` con rutas pensadas para `pruebas/`. Desde ahí no corren (error "Cannot find module"); desde `pruebas/` pasan. Moverlos para no subir pruebas a producción.
3. **No hay capa de intención única** (ver sección 4).

## 8. Decisiones tomadas (por ti, en esta sesión)

- El buscador principal, el asistente y Buscar Personas deben usar **el mismo algoritmo**.
- El algoritmo va **por capas**: limpiar, interpretar, buscar, mostrar.
- El mismo método se aplica a **todos los lugares de búsqueda** de la página, no solo a personas.

## 9. Decisiones pendientes

- [ ] ¿Se empieza por la capa de limpieza (cambio más chico y seguro)?
- [ ] Reunir las funciones de intención en una sola puerta, ¿en qué orden se llaman?
- [ ] Cuando la frase es ambigua ("laptops" frente a "quien vende laptops"): ¿mostrar ambas cosas o preguntar una vez?
- [ ] Idiomas: ¿reglas por idioma (español, inglés, portugués primero) y la IA solo como respaldo que llena la misma ficha? Hoy el intérprete solo entiende español.
- [ ] Apellido "Armas": ¿se permite buscarlo? (`permitirApellidos` existe pero ninguna pantalla lo activa).
- [ ] ¿Se muestra el correo en resultados? (hoy se revisa que no salga).

## 10. Pasos propuestos (cada uno reversible)

- [ ] 1. **Capa de limpieza:** archivo nuevo con su prueba, sin tocar nada existente.
- [ ] 2. **Capa de intención:** función pequeña que decide personas, productos u otra cosa, con pruebas.
- [ ] 3. **Función de entrada única** que encadena limpieza, intención, interpretación y búsqueda y devuelve siempre lo mismo (personas, ficha entendida, avisos).
- [ ] 4. Arreglar la inicial (hallazgo 1) y mover las dos pruebas de carpeta (hallazgo 2).
- [ ] 5. **Conectar una pantalla a la vez**, empezando por el buscador principal y el asistente. El código viejo queda como respaldo hasta probar en la página publicada.
- [ ] 6. Probar con 3 cuentas (sin sesión, la propia y otra), en computadora y celular.
- [ ] 7. Idiomas y textos en 15 idiomas (después de lo anterior).

**Cuidado:** la búsqueda de productos funciona y tiene muchas reglas (sinónimos, jerga, presupuesto, patrocinados). No se reescribe: solo se le pone delante la limpieza y la intención compartidas.

## 11. Cómo volver atrás

Cada capa vive en un archivo nuevo y el código viejo no se borra. Se desconecta quitando el `<script>` del archivo nuevo en `index.html` y las llamadas nuevas. No hay cambios en Supabase.

## 12. Opinión sobre el uso real

Con 9 personas y 42 publicaciones de venta, el cuello de botella hoy no es el algoritmo sino la cantidad de datos: una búsqueda bien entendida que dice "no hay nadie" se siente igual de rota. Por eso conviene, antes de sumar más, **probar lo que ya existe en la página publicada con personas reales y en celular**, y cuidar los mensajes cuando no hay resultados. Idiomas, tolerancia a errores de escritura, servicios, donaciones y la función SQL con bloqueo en ambos sentidos quedan para después.

## 13. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 12/11/2026 | Revisión del zip del 10/11/2026, pruebas en Node y frases de ejemplo | Documento; sin cambios de código. Se halló el fallo de la inicial y las dos pruebas fuera de lugar |
| 12/11/2026 | Diseño de la búsqueda por capas | Documento; decisiones de la sección 8 |
