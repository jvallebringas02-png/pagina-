# Bitácora — Búsqueda avanzada de personas

**Fecha:** 04/10/2026
**Proyecto:** remarket-db (`pueba02.vercel.app`)
**Estado:** propuesta hecha, aún sin código. Falta ver las columnas de `productos` y `localidades`.
**Relacionada con:** `BITACORA-PLAN-PANEL-Y-CORREO.md` (paso 15a).

---

## 1. Cómo funciona hoy

- Función `buscarUsuariosPorNombre` en `js/modules/panel-usuario-3.js`. Lee `perfiles_publicos`.
- Busca solo por nombre y apellido (también por iniciales, ej. "J P"). Ordena por relevancia en el navegador.
- Filtros de zona: Local, Regional y País, con `obtenerLocalidadIdsPorNivel`. Se calculan con la localidad **de quien busca** (`usuarioActual.localidad_id`).
- No existe nivel "mundial", no se busca por categoría escrita, ni por lo que alguien vende u ofrece.
- Hay funciones parecidas para compartir: `buscarUsuariosCompartir` (por categoría y zona).

## 2. Problemas posibles encontrados (04/10)

Reportado por el usuario: "en buscar personas no es tan funcional". Todavía no se sabe qué escribió ni qué pasó. Causas posibles según el código:

1. No busca por `@usuario` (`nombre_usuario` no entra en la búsqueda, aunque la vista lo tiene).
2. Con un filtro de zona no sale nadie si quien busca no tiene localidad guardada (la función devuelve `null` y la búsqueda devuelve lista vacía). Es la sospecha principal.
3. Quien no tenga fila en `usuarios` (cuenta creada antes del trigger `trg_crear_perfil_usuario`) no aparece en la vista.
4. El servidor trae 60 personas sin orden (`limit(60)`) antes de ordenar por relevancia; con muchos usuarios, quien se busca podría quedar fuera.

**Pendiente:** confirmar cuál es, con qué texto y qué se ve (captura o error de la consola).

## 3. Propuesta (no decidida todavía)

Una sola búsqueda que combine cuatro criterios:

| Criterio | Ejemplo | Origen del dato |
|---|---|---|
| Nombre o `@usuario` | "Juan Pérez", "@jvalle" | nombres, apellidos, nombre_usuario |
| Zona | "en mi ciudad", "en Perú", "en Arequipa", "a nivel mundial" | localidad o país de la persona |
| Categoría de la persona | "profesionales", "emprendedores" | `categoria` del usuario |
| Qué ofrece | "quién vende laptops", "quién da clases" | productos o servicios publicados y aprobados |

Frases que debería entender: "usuarios que vendan laptops en Trujillo", "personas que ofrezcan servicios de diseño en todo el mundo", "quién está en Perú y es de la categoría X".

**Cómo funcionaría**
1. Reglas simples en el navegador separan la frase en criterios (detectan "en mi ciudad", "mundial", un país o ciudad, una palabra de producto o servicio). Rápido y sin gastar cuota de IA.
2. Si las reglas no entienden la frase, recién ahí se pasa a la IA para que devuelva los criterios (cuida la cuota de Groq).
3. Para "qué ofrece": se buscan primero los productos o servicios aprobados que coinciden, se toma a sus dueños y se leen sus datos de `perfiles_publicos`.
4. "Mundial" quita el filtro de zona. Un país o ciudad específicos se resuelven con la columna `pais` de la vista, sin depender de la localidad de quien busca. Si pide "mi ciudad" y no la tiene guardada, la página avisa "define tu localidad en Configuración" en vez de mostrar una lista vacía.
5. Cada resultado muestra foto, nombre, ubicación, categoría y hasta 3 cosas que ofrece, con botones Ver perfil y Mensaje.

## 4. Orden de trabajo (método: datos, funciones, visual, textos)

- [ ] 1. **Datos:** ver las columnas de `productos` y `localidades`. Consulta de solo lectura:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('productos', 'localidades')
order by table_name, ordinal_position;
```

- [ ] 2. Decidir cómo distinguir un producto de un servicio (depende de las columnas).
- [ ] 3. **Funciones:** archivo nuevo `js/modules/panel-usuario-4.js` con `Object.assign(PanelUsuario, {...})` y su `<script>` en `index.html`. Lo viejo no se toca hasta el final.
- [ ] 4. **Visual:** tarjetas de resultado.
- [ ] 5. **Textos:** pasarlos al sistema de traducción.
- [ ] 6. Probar con 3 cuentas (sin sesión, la propia y otra distinta), como indica el método.

## 5. Decisiones abiertas

- Cómo distinguir producto de servicio.
- Si la búsqueda por zona usa `pais` (texto) o `localidades` (ids), o ambas.
- Qué se muestra a quien busca sin tener sesión iniciada.
