-- Supabase da por defecto todos los permisos a "authenticated" sobre tablas nuevas.
-- RLS ya impedía tocar estas filas; acá se quita además el permiso de tabla,
-- para que el intento falle con error en vez de "0 filas".
revoke all on public.machine_history, public.audit_log, public.platform_admins from authenticated;
grant select, insert on public.machine_history to authenticated;
grant select on public.audit_log, public.platform_admins to authenticated;

-- Tablas futuras: sin permisos automáticos para anon; cada migración los da explícitos.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from anon, public;
