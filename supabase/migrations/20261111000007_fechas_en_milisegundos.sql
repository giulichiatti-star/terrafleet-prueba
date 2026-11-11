-- La app maneja las fechas en milisegundos; Postgres las guarda en microsegundos.
-- Una orden o máquina creada por otra vía (SQL, importación) tiene microsegundos y, al volver
-- de la app, "cambiaba" su fecha de creación: los permisos de técnico y cliente la rechazaban.
-- Se compara al milisegundo.

create or replace function private.guard_work_order_tecnico() returns trigger
language plpgsql security definer set search_path = '' as $$
declare k text;
begin
  if coalesce(private.role(), '') <> 'tecnico' then return new; end if;
  if (new.agency_id, new.id, new.machine_id) is distinct from (old.agency_id, old.id, old.machine_id)
     or new.type is distinct from old.type
     or date_trunc('milliseconds', new.created_at) is distinct from date_trunc('milliseconds', old.created_at) then
    raise exception 'El técnico no puede modificar esos datos de la orden';
  end if;
  if new.status = 'anulada' and old.status <> 'anulada' then
    raise exception 'Solo el administrador puede anular una orden';
  end if;
  for k in select jsonb_object_keys(coalesce(new.data, '{}'::jsonb) || coalesce(old.data, '{}'::jsonb)) loop
    if (k in ('presupuesto', 'costoMateriales', 'anuladaMotivo', 'anuladaAt') or k like 'invoice%')
       and (new.data->k) is distinct from (old.data->k) then
      raise exception 'El técnico no puede modificar presupuestos, costos ni facturas';
    end if;
  end loop;
  return new;
end $$;

create or replace function private.guard_machine_tecnico() returns trigger
language plpgsql security definer set search_path = '' as $$
declare permitidas text[] := array['lastHoursUpdate','stage','lastServiceHours','lastServiceDate'];
begin
  if coalesce(private.role(), '') <> 'tecnico' then return new; end if;
  if (new.agency_id, new.id, new.client_id) is distinct from (old.agency_id, old.id, old.client_id)
     or new.brand is distinct from old.brand
     or new.model is distinct from old.model
     or new.serial is distinct from old.serial
     or date_trunc('milliseconds', new.created_at) is distinct from date_trunc('milliseconds', old.created_at)
     or (new.data - permitidas) is distinct from (old.data - permitidas) then
    raise exception 'El técnico solo puede actualizar horas y último service';
  end if;
  return new;
end $$;

create or replace function private.guard_machine_cliente() returns trigger
language plpgsql security definer set search_path = '' as $$
declare permitidas text[] := array['lastHoursUpdate','stage'];
begin
  if coalesce(private.role(), '') <> 'cliente' then return new; end if;
  if (new.agency_id, new.id, new.client_id) is distinct from (old.agency_id, old.id, old.client_id)
     or new.brand is distinct from old.brand
     or new.model is distinct from old.model
     or new.serial is distinct from old.serial
     or date_trunc('milliseconds', new.created_at) is distinct from date_trunc('milliseconds', old.created_at)
     or (new.data - permitidas) is distinct from (old.data - permitidas) then
    raise exception 'El cliente solo puede actualizar el horómetro';
  end if;
  return new;
end $$;

create or replace function private.guard_work_order_cliente() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  permitidas text[] := array['cita','signature','clientSignedAt','presupuesto','bloqueo'];
  aprobo boolean;
begin
  if coalesce(private.role(), '') <> 'cliente' then return new; end if;

  if (new.agency_id, new.id, new.machine_id) is distinct from (old.agency_id, old.id, old.machine_id)
     or new.type is distinct from old.type
     or new.responsable_id is distinct from old.responsable_id
     or date_trunc('milliseconds', new.created_at) is distinct from date_trunc('milliseconds', old.created_at)
     or date_trunc('milliseconds', new.closed_at) is distinct from date_trunc('milliseconds', old.closed_at) then
    raise exception 'El cliente no puede modificar esos datos de la orden';
  end if;

  if (new.data - permitidas) is distinct from (old.data - permitidas) then
    raise exception 'El cliente no puede modificar esos datos de la orden';
  end if;

  if (new.data->'presupuesto') is distinct from (old.data->'presupuesto') then
    if old.data->'presupuesto' is null
       or ((new.data->'presupuesto') - 'approved') is distinct from ((old.data->'presupuesto') - 'approved')
       or coalesce(old.data->'presupuesto'->'approved', 'null'::jsonb) <> 'null'::jsonb then
      raise exception 'El presupuesto ya fue respondido o no se puede modificar';
    end if;
  end if;
  aprobo := (new.data->'presupuesto'->'approved') = 'true'::jsonb
            and coalesce(old.data->'presupuesto'->'approved', 'null'::jsonb) = 'null'::jsonb;

  if (new.data->'cita') is distinct from (old.data->'cita') then
    if (old.data->>'cita') is distinct from 'propuesta'
       or (new.data->>'cita') not in ('confirmada','rechazada') then
      raise exception 'Solo se puede aceptar o rechazar un turno propuesto';
    end if;
  end if;

  if new.status is distinct from old.status then
    if not (aprobo and new.status = 'taller' and old.status in ('presupuesto','bloqueada')) then
      raise exception 'El cliente no puede cambiar el estado de la orden';
    end if;
  end if;
  if (new.data->'bloqueo') is distinct from (old.data->'bloqueo') and not aprobo then
    raise exception 'El cliente no puede modificar el bloqueo de la orden';
  end if;

  return new;
end $$;
