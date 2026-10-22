> **Estado (22/10/2026): DISEÑO EN PALABRAS. NO HAY CÓDIGO NUEVO TODAVÍA.** Este documento explica cómo debería comportarse la búsqueda de personas, para decidir antes de programar.

# Bitácora — Cómo debería ser la búsqueda de personas

**Fecha:** 22/10/2026 · **Continúa:** `BITACORA-BUSQUEDA-PERSONAS.md` (04/10, propuesta sin código)

## 1. Para qué sirve
Que una persona con sesión pueda **encontrar a otra persona del portal** para ver su perfil o escribirle un mensaje, sin tener que adivinar el nombre exacto.

## 2. Qué hace hoy (verificado en el código el 22/10)
- Busca por **nombre, apellido o iniciales** (ej. "J P").
- Tiene tres botones de zona: **Local, Regional, País**, calculados con la localidad de quien busca.
- Si no hay coincidencia por nombre, le pregunta a la IA.
- Trae como máximo **60 personas sin orden** y luego las ordena en el navegador.
- Muestra a las personas con foto y nombre.

## 3. Qué falta (lo que el usuario espera que haga)
No existe todavía: buscar por `@usuario`, por categoría, por lo que la persona vende u ofrece, ni una búsqueda sin límite de zona clara. Tampoco hay aviso claro cuando falta la localidad.

## 4. Cómo debería ser, en palabras

### 4.1 Una sola caja de búsqueda
La persona escribe lo que tenga en la cabeza y la página lo entiende. Ejemplos:

| Escribe | Debería encontrar |
|---|---|
| `Juan` o `Juan Pérez` | Personas con ese nombre o apellido |
| `J P` | Personas con esas iniciales |
| `@jvalle` | La persona con ese nombre de usuario |
| `emprendedores` | Personas de esa categoría |
| `laptops` o `quién vende laptops` | Personas que tienen publicaciones aprobadas de laptops |
| `diseño en Trujillo` | Personas que ofrecen diseño y viven en Trujillo |

### 4.2 Los botones de zona son filtros opcionales
- **Ningún botón activo = busca en todo el mundo.** (Así no hace falta un botón "Mundial" aparte.)
- **Local**: la misma zona de quien busca. **Regional**: la misma región. **País**: el mismo país.
- Si la persona también escribe una ciudad o país ("en Arequipa", "en Perú"), esa palabra manda sobre el botón.
- Si pide "mi zona" pero **no tiene localidad guardada**, no se muestra una lista vacía: se muestra el aviso *"Define tu localidad en Configuración"* con un botón para ir allí.

### 4.3 Qué se ve en cada resultado
- Foto (o inicial), **nombre**, `@usuario` si existe.
- Ciudad y país, y su categoría.
- Hasta **3 cosas que ofrece** (títulos de publicaciones aprobadas).
- Dos botones: **Ver perfil** y **Mensaje**.

### 4.4 Orden de los resultados
1. Nombre completo exacto.
2. Nombre o apellido que **empieza** con lo escrito.
3. Lo escrito está **dentro** del nombre.
4. Coincidencia por iniciales, `@usuario`, categoría u oferta.
5. A igualdad de puntaje, primero la gente **de la misma zona** de quien busca.

### 4.5 Quién nunca debe aparecer
- Quien busca (a sí mismo).
- Personas que **bloqueó**.
- Cuentas suspendidas o inactivas.

### 4.6 Qué datos se muestran
Solo los **públicos** (`perfiles_publicos`): nombre, foto, `@usuario`, ciudad/país, categoría y publicaciones aprobadas. **Nunca** correo, teléfono ni fecha de nacimiento.

### 4.7 Cuando no hay resultados
Mensaje amable con una sugerencia ("Prueba con otro nombre o quita el filtro de zona"). No dejar la pantalla en blanco.

### 4.8 Velocidad y límites
- Espera 350 ms después de la última tecla antes de buscar (ya existe).
- Si llega tarde la respuesta de una búsqueda anterior, **no debe pisar** la actual.
- Trae **20 resultados** y un botón **"Ver más"**, en vez del tope de 60 sin orden. El orden se hace en el servidor, no en el navegador.

### 4.9 Cuándo usar la IA
Primero reglas simples en el navegador (rápidas y sin gasto). **Solo si no entienden la frase**, se consulta a la IA, para cuidar la cuota de Groq. Mostrar "Pensando…" mientras tanto.

### 4.10 Sin sesión
La búsqueda de personas es **solo para quien tiene sesión** (como hoy). Sin sesión se muestra el aviso para iniciar sesión.

### 4.11 Idiomas
Todos los textos nuevos pasan por el sistema de traducción del proyecto (`i18n`), no se escriben solo en español.

## 5. Decisiones que hay que tomar antes de programar
1. ¿Cómo se distingue un **producto** de un **servicio**? (depende de las columnas de `productos`)
2. ¿La zona se compara por el **texto del país** o por los **ids de localidades**, o ambos?
3. ¿Se permite buscar por **categoría** aunque la persona no tenga publicaciones?
4. ¿Se muestra la **cantidad de publicaciones** de cada persona?

## 6. Orden de trabajo (método: datos, funciones, visual, textos)
- [ ] 1. **Datos:** ver las columnas de `productos`, `localidades` y `perfiles_publicos`. Consulta de solo lectura:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('productos', 'localidades', 'perfiles_publicos')
order by table_name, ordinal_position;
```

- [ ] 2. Confirmar que `perfiles_publicos` trae `nombre_usuario`, `categoria`, `pais`, `localidad_id` y que **no** trae datos privados.
- [ ] 3. **Servidor:** una función SQL (`buscar_personas`) que reciba el texto y la zona, ordene por relevancia y devuelva 20 por página.
- [ ] 4. **Funciones:** archivo nuevo `js/modules/panel-usuario-4.js`, con su `<script>` en `index.html`. Lo viejo no se toca hasta el final.
- [ ] 5. **Visual:** tarjetas de resultado y aviso de localidad.
- [ ] 6. **Textos:** pasarlos al sistema de traducción.
- [ ] 7. **Pruebas** con 3 cuentas (sin sesión, la propia y otra distinta).

## 7. Pruebas que debería pasar al terminar
- [ ] Escribir solo el nombre: sale la persona.
- [ ] Escribir las iniciales ("J P"): sale la persona.
- [ ] Escribir `@usuario`: sale la persona.
- [ ] Escribir un producto: salen las personas que lo venden.
- [ ] Botón Local con localidad guardada: solo gente de la misma zona.
- [ ] Botón Local **sin** localidad guardada: sale el aviso, no una lista vacía.
- [ ] Una persona bloqueada **no** aparece.
- [ ] No aparece la propia cuenta.
- [ ] Con más de 20 resultados, "Ver más" trae los siguientes.
- [ ] Cambiar de idioma: los textos cambian.
- [ ] Desde el celular se ve bien.

## 8. Riesgos
- Buscar por lo que ofrece depende de que las publicaciones estén bien categorizadas.
- Una función SQL nueva en Supabase hay que revisarla bien: debe leer solo datos públicos.
- Si hay pocos usuarios, muchas búsquedas darán "sin resultados" aunque el código esté bien.

## Registro
| Fecha | Cambio | Resultado |
|---|---|---|
| 22/10/2026 | Se describió en palabras cómo debería ser la búsqueda de personas | Solo documento; sin código |
