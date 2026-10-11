# Bitácora: revisión de Supabase, Libro de Reclamaciones y marco legal (11/10/2026)

> Esta bitácora resume la sesión. No es asesoría legal: lo legal debe confirmarlo un abogado.

## 1. Qué se revisó
- Se ejecutó en Supabase `revisar-supabase-v2.sql` (solo lectura) y se leyó el resultado (CSV) y el texto de `fn_generar_codigo` y `fn_codigo_contacto`.
- Se revisó el código del repo (`institucional.js`, `index.html`, `i18n*.js`) para ver cómo se llama a la base de datos.

## 2. Lo que está bien (confirmado en la base real)
- Hay un índice UNIQUE sobre `codigo_reclamo` (hay tres iguales) y sobre el código de contacto.
- RLS activo en `libro_reclamaciones`, `mensajes_contacto` y `seguimiento_intentos`. `seguimiento_intentos` solo da permisos a `postgres` y `service_role`.
- `registrar_reclamo`, `registrar_contacto`, `registrar_opinion` y `obtener_seguimiento` son `security definer` con `search_path=public`. Solo existe la versión de 2 argumentos de `obtener_seguimiento` (la vieja de 1 argumento ya no está).
- La pantalla de Seguimiento devuelve solo campos seguros y responde igual si falla el código o la clave.
- `estado_tramite` tiene valor por defecto `'PENDIENTE'` y acepta nulo: el INSERT de `registrar_reclamo` no necesita llenarlo (se resolvió la duda abierta de bitácoras anteriores).
- La página usa solo `rpc(...)`; nunca inserta directo en las tablas.

## 3. Hallazgos y qué se hizo
| Hallazgo | Estado |
|---|---|
| Políticas INSERT públicas (`check=true`) permitían saltarse las funciones (sin validación de largo, respuesta de administrador falsa, código inventado) | **Resuelto**: ya no hay políticas en las dos tablas (verificado: `pg_policies` devuelve 0 filas) |
| `fn_generar_codigo` era ejecutable por anónimos (podían "quemar" números de la secuencia) | **Resuelto**: `revoke execute ... from public, anon, authenticated`. Las funciones `registrar_*` siguen pudiendo usarla |
| Sufijo al azar de 4 caracteres (~1 millón de combinaciones) con `random()` | **Resuelto**: 6 caracteres (~1.000 millones) con `gen_random_uuid()`. Los códigos viejos siguen valiendo |
| Límite de intentos cuenta por código completo escrito: probar sufijos distintos no queda frenado; el límite por IP depende de `x-forwarded-for`, que podría falsificarse (no verificado) | **Pendiente** (ver sección 6) |
| La segunda clave del reclamo es el número de documento: dato poco secreto | Pendiente de decisión (idea: clave de seguimiento al azar) |
| MD5 de la IP en `seguimiento_intentos` es reversible con facilidad | Pendiente: mencionar en la política de privacidad; considerar sal |
| `registrar_reclamo` guarda `tipo_documento` siempre como `'No indicado'` | Pendiente |
| Sin límite de frecuencia en `registrar_reclamo`, `registrar_contacto`, `registrar_opinion`; correo validado solo con `position('@') < 2` en reclamos | Pendiente |
| Restos de la versión anterior: columna `codigo_contacto` y trigger `trg_codigo_contacto` (códigos `CA-...`), tres índices iguales | Pendiente (limpieza) |
| Primer reclamo con formato viejo `LR-2026-000001` y el siguiente también con 000001 y sufijo (secuencia nueva) | Sin problema: el sufijo los distingue |

## 4. Cambios ejecutados en Supabase
1. Se quitaron las políticas INSERT (la primera orden dio "no existe" porque ya estaba borrada; la consulta posterior mostró 0 políticas).
2. Se reemplazó `fn_generar_codigo` (6 caracteres, `gen_random_uuid`) y se le quitó el permiso a público/anon/authenticated.

**Volver atrás de la función** (si falla algún formulario):
```sql
create or replace function public.fn_generar_codigo(p_prefijo text, p_secuencia regclass)
returns text language plpgsql as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  sufijo text := '';
  i int;
begin
  for i in 1..4 loop
    sufijo := sufijo || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
  end loop;
  return p_prefijo || '-' || to_char(now(), 'YYYY') || '-'
         || lpad(nextval(p_secuencia)::text, 6, '0') || '-' || sufijo;
end
$$;
grant execute on function public.fn_generar_codigo(text, regclass) to anon, authenticated;
```
Para volver a abrir las políticas: `create policy "Cualquiera puede registrar un reclamo" on public.libro_reclamaciones for insert to public with check (true);` y lo mismo con `"Cualquiera puede enviar un mensaje"` en `mensajes_contacto`.

**Por confirmar:** probar de nuevo los tres formularios después del cambio de función (reclamo con código de 6 caracteres, mensaje `MC-...` y Seguimiento, también con un código viejo).

## 5. Cambios en la página (subidos y probados por la persona)
- Se quitó "Reportar" del pie de página (llamaba a la IA con `iaResponde('reportar')`).
- Etiqueta del pie y título de la pantalla: "Seguimiento de mi reclamo o de mi mensaje al administrador" (15 idiomas en el pie; título solo es/en).
- Aviso bajo el campo de documento, aviso al enviar y frase en la constancia/PDF sobre cómo consultar el estado. Detalle en `BITACORA-AVISO-DOCUMENTO-Y-PIE.md`.
- Quechua y aimara usan español en los textos nuevos. Las traducciones nuevas las redactó Claude: pedir revisión (árabe, hindi, búlgaro, turco sobre todo).

## 6. Decisiones y pendientes de la página
- **Decidido:** constancia en el idioma de la persona más español (opción 3). Quechua y aimara: solo español. Árabe requiere ajustar la dirección del texto (hoy fijo de izquierda a derecha). **Aún no construido.**
- **Pendiente:** cambiar `obtener_seguimiento` para contar fallos por número de reclamo (código sin sufijo) y no por código completo. Compensación: un tercero podría bloquear la consulta de un número por una hora.
- **Pendiente:** limpiar `codigo_contacto`/trigger/índices repetidos; decidir `tipo_documento`; límite de frecuencia y validación de correo; formato del documento (solo letras y números, 6 a 20 caracteres, propuesta).
- **Pendiente:** panel o forma de que el administrador responda reclamos (hoy se escribe directo en Supabase).
- **Pendiente:** que el reporte público identifique la publicación por su identificador, no solo por el título.
- **Pendiente:** decidir si los "reportes" de publicaciones siguen yendo al Libro de Reclamaciones o a un sistema aparte; el "Reportar" dentro de la cuenta (tabla `reportes`) promete revisión sin código ni panel.
- Idea: enviar el código también por correo, porque hoy no se puede recuperar si se pierde.
- Buscador: "zapatos" sigue llevando a la matriz mundial (no tocado en esta sesión).

## 7. Marco legal (investigado en la web; hay que confirmarlo con un abogado)
- **Ley 32495** (publicada el 11/11/2025) modificó los artículos 150 y 151 del Código de Protección y Defensa del Consumidor: las plataformas digitales de comercio electrónico deben tener libro de reclamaciones (físico o virtual) y mostrar de forma permanente un enlace visible. La ley no define "plataforma digital de comercio electrónico".
- **Proyecto de Decreto Supremo** (R.M. 244-2026-PCM, publicada el 18/07/2026; comentarios hasta el 02/08/2026) que modifica el Reglamento (D.S. 011-2011-PCM). **Es un borrador; no encontré confirmación de que ya esté aprobado.** Lo que propone:
  - Plataformas digitales: sitios web, apps, programas, redes sociales y otros canales que ofrecen, comercializan o facilitan la contratación.
  - Libro accesible por enlace visible y permanente, sin exigir autenticación, registro ni validar una compra.
  - **Plataformas de intermediación:** libro único y centralizado; el administrador recibe, gestiona y responde; el proveedor afiliado mantiene su responsabilidad por el contenido del reclamo.
  - **Redes sociales** con ofertas, pedidos o pagos: enlace en perfil/biografía/contacto hacia el formulario de cada proveedor.
  - Formulario mínimo: identidad y RUC del proveedor, producto o servicio, confirmación de la voluntad de reclamar, numeración correlativa, pedido concreto, datos del consumidor (nombre, documento, teléfono, correo), fecha y hora, adjuntar archivos (PDF, PNG, JPG), uso en celular/tableta/PC y aviso de datos faltantes.
- Según un análisis jurídico (memo de un estudio), INDECOPI ha señalado por jurisprudencia que incluso páginas que solo informan sobre productos o servicios deben tener libro virtual (Resolución 1989-2024/SPC-INDECOPI).
- **Lectura provisional (no jurídica):** remarket-db se parecería a una plataforma de intermediación: el canal del libro sería suyo y el vendedor respondería por el fondo.

**Formulario de hoy frente al borrador:** falta identidad y RUC del vendedor (hoy solo el título de la publicación), teléfono obligatorio (hoy opcional), adjuntar archivos; falta revisar el uso en pantallas chicas. Ya cumple: numeración correlativa, pedido concreto, fecha y hora, acceso sin cuenta, enlace visible en el pie.

**Fuentes consultadas:** El Peruano (R.M. 244-2026-PCM y nota del 18/07/2026), memo de Payet, Rey, Cauvi, Pérez Abogados (proyecto de D.S.), nota de Cuatrecasas del 23/07/2026, LP Derecho (texto de la Ley 32495) y memo de PRCP sobre la Ley 32495.

## 8. Preguntas para el abogado
1. ¿remarket-db es una "plataforma digital de comercio electrónico" según la norma final?
2. ¿Debe responder los reclamos y en qué plazo?
3. ¿En qué idioma debe estar la constancia?
4. ¿Los "reportes" de publicaciones van al Libro o aparte?
5. ¿Es suficiente el texto de la constancia sobre "no es parte de la operación"?

## 9. Archivos entregados en la sesión
`revisar-supabase-v2.sql`, `index.html`, `js/i18n.js`, `js/i18n-institucional.js`, `js/modules/institucional.js`, `BITACORA-AVISO-DOCUMENTO-Y-PIE.md` y esta bitácora.

## 10. Cómo seguir
1. Probar los tres formularios tras el cambio de función.
2. Preparar la constancia por idioma.
3. Cambiar el conteo de intentos en `obtener_seguimiento`.
4. Llevar las preguntas al abogado y decidir panel, identificación de la publicación y destino de los reportes.
