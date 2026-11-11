-- Rol "técnico": solo trabajo de taller.
-- Puede: ver todo lo de la agencia, mover y cerrar órdenes, proponer turnos, dejar notas,
-- subir fotos, usar repuestos (descuenta stock), cargar el horómetro y avisar al cliente.
-- No puede: crear/editar clientes, máquinas, repuestos ni catálogo; crear órdenes; anular;
-- tocar presupuestos, costos ni facturas; ver usuarios ni auditoría (eso ya era solo admin).

-- Altas y cambios de clientes, máquinas, catálogo: solo administrador.
drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert to authenticated
  with check (private.can_admin(agency_id));
drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update to authenticated
  using (private.can_admin(agency_id)) with check (private.can_admin(agency_id));

drop policy if exists machines_insert on public.machines;
create policy machines_insert on public.machines for insert to authenticated
  with check (private.can_admin(agency_id));
-- (machines_update sigue igual: el técnico actualiza horas; lo limita el trigger de abajo)

drop policy if exists catalog_insert on public.catalog_models;
create policy catalog_insert on public.catalog_models for insert to authenticated
  with check (private.can_admin(agency_id));
drop policy if exists catalog_update on public.catalog_models;
create policy catalog_update on public.catalog_models for update to authenticated
  using (private.can_admin(agency_id)) with check (private.can_admin(agency_id));
drop policy if exists catalog_delete on public.catalog_models;
create policy catalog_delete on public.catalog_models for delete to authenticated
  using (private.can_admin(agency_id));

-- Órdenes: las crea el administrador (o el cliente al pedir turno/soporte).
drop policy if exists work_orders_insert on public.work_orders;
create policy work_orders_insert on public.work_orders for insert to authenticated
  with check (private.can_admin(agency_id)
              or (private.owns_machine(agency_id, machine_id)
                  and status in ('cita','recibida')
                  and responsable_id is null and closed_at is null));

-- Repuestos: el técnico los ve y descuenta stock; alta y baja solo administrador.
drop policy if exists parts_all on public.parts;
create policy parts_select on public.parts for select to authenticated
  using (private.can_staff(agency_id));
create policy parts_insert on public.parts for insert to authenticated
  with check (private.can_admin(agency_id));
create policy parts_update on public.parts for update to authenticated
  using (private.can_staff(agency_id)) with check (private.can_staff(agency_id));
create policy parts_delete on public.parts for delete to authenticated
  using (private.can_admin(agency_id));

-- Lo que un TÉCNICO no puede cambiar de una orden: presupuesto, costos, facturas, anulación.
create function private.guard_work_order_tecnico() returns trigger
language plpgsql security definer set search_path = '' as $$
declare k text;
begin
  if coalesce(private.role(), '') <> 'tecnico' then return new; end if;
  if (new.agency_id, new.id, new.machine_id) is distinct from (old.agency_id, old.id, old.machine_id)
     or new.type is distinct from old.type
     or new.created_at is distinct from old.created_at then
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
create trigger guard_tecnico before update on public.work_orders
  for each row execute function private.guard_work_order_tecnico();

-- Lo que un TÉCNICO puede cambiar de una máquina: horómetro y último service.
create function private.guard_machine_tecnico() returns trigger
language plpgsql security definer set search_path = '' as $$
declare permitidas text[] := array['lastHoursUpdate','stage','lastServiceHours','lastServiceDate'];
begin
  if coalesce(private.role(), '') <> 'tecnico' then return new; end if;
  if (new.agency_id, new.id, new.client_id) is distinct from (old.agency_id, old.id, old.client_id)
     or new.brand is distinct from old.brand
     or new.model is distinct from old.model
     or new.serial is distinct from old.serial
     or new.created_at is distinct from old.created_at
     or (new.data - permitidas) is distinct from (old.data - permitidas) then
    raise exception 'El técnico solo puede actualizar horas y último service';
  end if;
  return new;
end $$;
create trigger guard_tecnico before update on public.machines
  for each row execute function private.guard_machine_tecnico();

-- Lo que un TÉCNICO puede cambiar de un repuesto: solo el stock.
create function private.guard_part_tecnico() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(private.role(), '') <> 'tecnico' then return new; end if;
  if (new.agency_id, new.id) is distinct from (old.agency_id, old.id)
     or new.ref is distinct from old.ref
     or new.name is distinct from old.name
     or new.min_stock is distinct from old.min_stock
     or new.unit_cost is distinct from old.unit_cost
     or new.data is distinct from old.data then
    raise exception 'El técnico solo puede descontar stock';
  end if;
  return new;
end $$;
create trigger guard_tecnico before update on public.parts
  for each row execute function private.guard_part_tecnico();

revoke all on function private.guard_work_order_tecnico() from public, anon, authenticated;
revoke all on function private.guard_machine_tecnico() from public, anon, authenticated;
revoke all on function private.guard_part_tecnico() from public, anon, authenticated;
