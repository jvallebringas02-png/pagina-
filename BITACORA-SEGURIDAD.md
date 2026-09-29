# Bitácora de seguridad — remarket-db

**Fecha de la revisión:** 29/09/2026
**Estado general:** propuesto, todavía no aplicado. Marcar cada punto como hecho cuando se ejecute.

Para retomar el trabajo en cualquier conversación: traer este archivo junto con `BITACORA-TRADUCCION.md` y seguir desde la sección 3.

---

## 1. Qué se revisó

- El código de la página (zip `pagina--main`): estructura, configuración, autenticación, servicio de IA y base de datos local. Los tres archivos `panel-usuario-*.js` solo se revisaron por búsquedas, no línea por línea.
- Las políticas de seguridad (RLS) de Supabase, con tres consultas: las 80 políticas, las columnas de `usuarios` y qué tablas tienen RLS activado.

## 2. Qué se encontró

**Bien**
- RLS está activado en todas las tablas (excepto `spatial_ref_sys`, tabla interna de PostGIS).
- El chat nuevo (`mensajes`, `conversaciones`), los likes, favoritos, bloqueos y seguidores están bien protegidos.

**Grave**
- **`usuarios`:** cualquier persona, incluso sin cuenta, puede leer todos los usuarios (correo, celular, edad, IP, GPS) y modificar a cualquiera, incluido su rol.
- **Tablas internas:** `api_keys_config`, `roles_sistema`, `config_roles_hibridos` y `bitacora_proyecto` son legibles y editables por cualquier usuario con sesión.
- **Mensajes y datos privados:** 23 tablas tienen una política que deja a cualquier usuario con sesión leer y escribir todo. Entre ellas: `mensajes_chat`, `mensajes_mini_correo`, `conversaciones_ia`, `historial_busquedas_usuario`, `libro_reclamaciones`.

**Medio**
- **`productos`:** los productos pendientes y en borrador los ve todo el mundo, y el dueño puede ponerse `aprobado` o activarse el patrocinio por su cuenta.
- **Inserciones anónimas:** `logs_acceso`, `usuarios_geolocalizacion`, `mensajes_contacto` y `libro_reclamaciones` aceptan escrituras sin cuenta. Sirven para formularios públicos, pero permiten spam.

**Roto hoy**
- `comentarios_likes` tiene RLS sin ninguna política, así que esos likes fallan.
- `reglas_asistente` y `publicaciones` no aparecen en la base.
- La columna `es_admin` no existe en `usuarios`, así que el panel de administrador no funciona todavía.

## 3. Qué se propone hacer, en orden

- [ ] **Paso 1. Cerrar las tablas que la página no usa** (quitar 15 políticas abiertas). No afecta nada visible, porque el código no consulta esas tablas. Es el paso más seguro y urgente.
- [ ] **Paso 2. Crear una vista de perfiles públicos** con solo id, nombre, foto, país y categoría, y cambiar el feed, el buscador de personas y los perfiles para que lean esa vista.
- [ ] **Paso 3. Cerrar `usuarios`:** cada persona solo ve y edita su propia fila, y un trigger impide cambiar rol, estado y estatus desde el navegador.
- [ ] **Paso 4. Ajustar `productos`:** quitar la lectura abierta y agregar un trigger que impida cambiar `estado` y patrocinio al editar.
- [ ] **Paso 5. Arreglar el registro:** crear la ficha del usuario con un trigger sobre `auth.users`, para que funcione aunque se active la confirmación por correo.
- [ ] **Paso 6. Pendientes:** política de `comentarios_likes`, crear o corregir `reglas_asistente` y `publicaciones`, y limitar las inserciones anónimas.

### SQL del paso 1

```sql
begin;
drop policy enable_all_auth_api_keys on api_keys_config;
drop policy enable_all_auth_bitacora on bitacora_proyecto;
drop policy enable_all_auth_config_roles on config_roles_hibridos;
drop policy enable_all_auth_roles on roles_sistema;
drop policy enable_all_auth_mensajes_chat on mensajes_chat;
drop policy enable_all_auth_mensajes_correo on mensajes_mini_correo;
drop policy enable_all_auth_conversaciones_ia on conversaciones_ia;
drop policy enable_all_auth_historial on historial_busquedas_usuario;
drop policy enable_all_auth_denuncias on denuncias_anuncio;
drop policy enable_all_auth_comportamiento on comportamiento_usuarios;
drop policy enable_all_auth_perfil on perfil_comportamiento_usuario;
drop policy enable_all_auth_segmentos on segmentos_usuarios;
drop policy enable_all_auth_patrones on patrones_busqueda;
drop policy enable_all_auth_interacciones_u on interacciones_usuario;
drop policy enable_all_auth_ofertas on ofertas_personalizadas;
commit;  -- si algo falla, ejecutar rollback en lugar de commit
```

### SQL de los pasos 3 y 4 (probar primero en una copia)

```sql
begin;

-- usuarios
drop policy "Permitir actualización propia" on usuarios;
drop policy "Permitir lectura pública" on usuarios;
drop policy "Permitir registro público" on usuarios;
drop policy enable_all_auth_usuarios on usuarios;

create policy "ver propio" on usuarios for select to authenticated
  using (id = auth.uid());
create policy "crear propio" on usuarios for insert to authenticated
  with check (id = auth.uid() and rol_id = 2);
create policy "editar propio" on usuarios for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function proteger_campos_usuario() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and (
     new.rol_id is distinct from old.rol_id or
     new.estado is distinct from old.estado or
     new.id_estatus is distinct from old.id_estatus) then
    raise exception 'Campo protegido';
  end if;
  return new;
end $$;
create trigger trg_proteger_usuario before update on usuarios
  for each row execute function proteger_campos_usuario();

-- productos
drop policy "Cualquiera puede ver productos" on productos;

create or replace function proteger_campos_producto() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and (
     new.estado is distinct from old.estado or
     new.es_patrocinado is distinct from old.es_patrocinado or
     new.patrocinado_hasta is distinct from old.patrocinado_hasta) then
    raise exception 'Campo protegido';
  end if;
  return new;
end $$;
create trigger trg_proteger_producto before update on productos
  for each row execute function proteger_campos_producto();

commit;
```

> **Antes del paso 3:** el código lee `usuarios` en unos 14 sitios (feed, buscador de personas, perfiles, chat). Hay que cambiar esas consultas para que usen la vista de perfiles públicos del paso 2, o esas pantallas saldrán vacías.

## 4. Riesgos y cómo volver atrás

- No se pierden datos: las políticas y los triggers solo controlan accesos.
- Si algo se rompe, se ve como listas vacías o errores 403 (`new row violates row-level security policy`) en la consola del navegador.
- Cada bloque va dentro de una transacción (`begin` / `commit`, con `rollback` si falla).
- Las políticas actuales quedan respaldadas en los tres CSV exportados de Supabase. Guardarlos.
- Qué se ve si falla:

| Falla | Qué se ve |
|---|---|
| Error de SQL | Supabase lo muestra en rojo y no cambia nada de esa línea |
| Se bloquea algo que sí se usaba | Feed sin autores, buscador de personas vacío, "no se pudo guardar" |
| El trigger bloquea una edición legítima | Error "Campo protegido" al guardar |
| Falla el registro | Usuario creado en Auth sin ficha en `usuarios` |

**Revertir `usuarios`** (deja todo tan inseguro como antes, pero la página vuelve a funcionar):

```sql
create policy "Permitir lectura pública" on usuarios for select to public using (true);
create policy "Permitir actualización propia" on usuarios for update to public using (true);
create policy "Permitir registro público" on usuarios for insert to public with check (true);
create policy enable_all_auth_usuarios on usuarios for all to authenticated using (true) with check (true);
drop trigger if exists trg_proteger_usuario on usuarios;
drop trigger if exists trg_proteger_producto on productos;
```

**Revertir una tabla del paso 1** (ejemplo):

```sql
create policy enable_all_auth_api_keys on api_keys_config
  for all to authenticated using (true) with check (true);
```

El nombre y las condiciones de cada política original están en el CSV de políticas.

**Lo que no se puede deshacer:** si alguien ya leyó datos mientras las tablas estaban abiertas, cerrarlas después no lo revierte.

## 5. Tareas de seguimiento

- [ ] Rotar las claves guardadas en `api_keys_config` (Groq y otras), por si fueron leídas.
- [ ] Probar todo primero en una copia del proyecto de Supabase.
- [ ] Cambiar el código que fuerza `estado: 'aprobado'` (`panel-usuario-3.js:633`) cuando exista el panel de moderación.
- [ ] Corregir el `edad: 18` fijo del registro con proveedor externo (`sesion-auth.js`).
- [ ] Auditar los cerca de 160 `innerHTML` del código.
- [ ] Declarar en la política de privacidad que se guarda la IP.
- [ ] Crear la política de `comentarios_likes` y crear o corregir `reglas_asistente` y `publicaciones`.
- [ ] Al crear la columna `es_admin`, protegerla desde el inicio con el mismo trigger que `rol_id`.

---

## 6. Registro de cambios aplicados

| Fecha | Paso | Resultado | Notas |
|---|---|---|---|
| | | | |
