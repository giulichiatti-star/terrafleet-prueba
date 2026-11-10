-- TerraFleet — esquema inicial multi-agencia
-- Cada agencia es un "tenant". Toda fila lleva agency_id y la base (no la pantalla)
-- decide quién ve qué (row-level security).
-- Roles: admin y tecnico (personal de la agencia), cliente (dueño de máquinas),
-- y platform_admins (la consultora, ve todas las agencias).
-- Los ids de clientes/máquinas/OTs son los mismos textos que usa la app
-- (c…, m…, OT-4101, SAT-81) para que la migración desde el navegador sea directa.
-- Los campos que la app usa pero no relacionan nada viven en la columna "data" (jsonb).

create schema if not exists private;

-- ───────────────────────── Tablas ─────────────────────────

create table public.agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  cuit        text,
  phone       text,
  city        text,
  ot_seq      integer not null default 4100,
  sat_seq     integer not null default 80,
  inv_seq     integer not null default 0,
  settings    jsonb   not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.platform_admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.clients (
  agency_id   uuid not null references public.agencies(id) on delete restrict,
  id          text not null,
  name        text not null,
  contact     text,
  phone       text,
  email       text,
  cuit        text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (agency_id, id)
);

create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  agency_id   uuid not null references public.agencies(id) on delete restrict,
  role        text not null check (role in ('admin','tecnico','cliente')),
  client_id   text,
  full_name   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (agency_id, client_id) references public.clients(agency_id, id) on delete restrict,
  constraint cliente_tiene_client_id check ((role = 'cliente') = (client_id is not null))
);
create index profiles_agency_idx on public.profiles (agency_id);

create table public.machines (
  agency_id   uuid not null references public.agencies(id) on delete restrict,
  id          text not null,
  client_id   text not null,
  brand       text,
  model       text,
  serial      text,
  hours       numeric not null default 0 check (hours >= 0),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (agency_id, id),
  foreign key (agency_id, client_id) references public.clients(agency_id, id) on delete restrict
);
create index machines_client_idx on public.machines (agency_id, client_id);

-- Historial de la máquina: solo se agrega, nunca se edita ni se borra.
create table public.machine_history (
  id          bigint generated always as identity primary key,
  agency_id   uuid not null,
  machine_id  text not null,
  ts          timestamptz not null default now(),
  title       text not null,
  detail      text,
  data        jsonb not null default '{}'::jsonb,
  created_by  uuid default auth.uid(),
  foreign key (agency_id, machine_id) references public.machines(agency_id, id) on delete restrict,
  unique (agency_id, machine_id, ts, title)
);

create table public.work_orders (
  agency_id      uuid not null references public.agencies(id) on delete restrict,
  id             text not null,
  machine_id     text not null,
  type           text,
  status         text not null default 'recibida'
                 check (status in ('cita','recibida','diagnostico','presupuesto','bloqueada','taller','terminada','anulada')),
  responsable_id uuid references public.profiles(user_id) on delete set null,
  data           jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  closed_at      timestamptz,
  updated_at     timestamptz not null default now(),
  primary key (agency_id, id),
  foreign key (agency_id, machine_id) references public.machines(agency_id, id) on delete restrict
);
create index work_orders_machine_idx on public.work_orders (agency_id, machine_id);
create index work_orders_status_idx  on public.work_orders (agency_id, status);

create table public.parts (
  agency_id   uuid not null references public.agencies(id) on delete restrict,
  id          text not null,
  ref         text,
  name        text not null,
  stock       numeric not null default 0,
  min_stock   numeric not null default 0,
  unit_cost   numeric,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (agency_id, id)
);

-- Repuestos usados en una OT: descuenta stock solo (ver trigger).
create table public.work_order_parts (
  id            bigint generated always as identity primary key,
  agency_id     uuid not null,
  work_order_id text not null,
  part_id       text not null,
  qty           numeric not null check (qty > 0),
  unit_cost     numeric,
  created_at    timestamptz not null default now(),
  foreign key (agency_id, work_order_id) references public.work_orders(agency_id, id) on delete restrict,
  foreign key (agency_id, part_id)       references public.parts(agency_id, id)       on delete restrict
);
create index work_order_parts_ot_idx on public.work_order_parts (agency_id, work_order_id);

create table public.notifications (
  agency_id   uuid not null references public.agencies(id) on delete restrict,
  id          text not null,
  audience    text not null check (audience in ('admin','client')),
  client_id   text,
  icon        text,
  title       text not null,
  detail      text,
  ts          timestamptz not null default now(),
  read        boolean not null default false,
  data        jsonb not null default '{}'::jsonb,
  primary key (agency_id, id),
  foreign key (agency_id, client_id) references public.clients(agency_id, id) on delete restrict
);
create index notifications_ts_idx on public.notifications (agency_id, ts desc);

-- Registro de auditoría: guarda el antes y el después de cada cambio. Red de seguridad.
create table public.audit_log (
  id          bigint generated always as identity primary key,
  agency_id   uuid,
  table_name  text not null,
  row_id      text,
  op          text not null,
  old_row     jsonb,
  new_row     jsonb,
  user_id     uuid,
  at          timestamptz not null default now()
);
create index audit_log_agency_idx on public.audit_log (agency_id, at desc);

-- ───────────────────── Funciones de identidad ─────────────────────
-- security definer: leen profiles sin pasar por RLS (evita recursión).

create function private.agency_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.agency_id from public.profiles p where p.user_id = auth.uid() and p.active
$$;

create function private.role() returns text
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.user_id = auth.uid() and p.active
$$;

create function private.client_id() returns text
language sql stable security definer set search_path = '' as $$
  select p.client_id from public.profiles p where p.user_id = auth.uid() and p.active
$$;

create function private.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid())
$$;

create function private.can_staff(aid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_platform_admin()
      or (aid = private.agency_id() and private.role() in ('admin','tecnico'))
$$;

create function private.can_admin(aid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_platform_admin()
      or (aid = private.agency_id() and private.role() = 'admin')
$$;

create function private.is_client(aid uuid, cid text) returns boolean
language sql stable security definer set search_path = '' as $$
  select aid = private.agency_id() and private.role() = 'cliente' and cid = private.client_id()
$$;

create function private.owns_machine(aid uuid, mid text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.role() = 'cliente' and exists (
    select 1 from public.machines m
    where m.agency_id = aid and m.id = mid
      and m.agency_id = private.agency_id() and m.client_id = private.client_id())
$$;

-- ───────────────────────── Triggers ─────────────────────────

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger touch before update on public.agencies    for each row execute function private.touch_updated_at();
create trigger touch before update on public.clients     for each row execute function private.touch_updated_at();
create trigger touch before update on public.profiles    for each row execute function private.touch_updated_at();
create trigger touch before update on public.machines    for each row execute function private.touch_updated_at();
create trigger touch before update on public.work_orders for each row execute function private.touch_updated_at();
create trigger touch before update on public.parts       for each row execute function private.touch_updated_at();

-- Lo que un CLIENTE puede cambiar de una OT: responder el turno, aprobar o
-- rechazar el presupuesto y firmar el informe. Nada más.
create function private.guard_work_order_cliente() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  permitidas text[] := array['cita','signature','clientSignedAt','presupuesto','bloqueo'];
  aprobo boolean;
begin
  if coalesce(private.role(), '') <> 'cliente' then return new; end if;

  if (new.agency_id, new.id, new.machine_id) is distinct from (old.agency_id, old.id, old.machine_id)
     or new.type is distinct from old.type
     or new.responsable_id is distinct from old.responsable_id
     or new.created_at is distinct from old.created_at
     or new.closed_at is distinct from old.closed_at then
    raise exception 'El cliente no puede modificar esos datos de la orden';
  end if;

  if (new.data - permitidas) is distinct from (old.data - permitidas) then
    raise exception 'El cliente no puede modificar esos datos de la orden';
  end if;

  -- Presupuesto: solo puede pasar "approved" de sin responder a sí/no.
  if (new.data->'presupuesto') is distinct from (old.data->'presupuesto') then
    if old.data->'presupuesto' is null
       or ((new.data->'presupuesto') - 'approved') is distinct from ((old.data->'presupuesto') - 'approved')
       or coalesce(old.data->'presupuesto'->'approved', 'null'::jsonb) <> 'null'::jsonb then
      raise exception 'El presupuesto ya fue respondido o no se puede modificar';
    end if;
  end if;
  aprobo := (new.data->'presupuesto'->'approved') = 'true'::jsonb
            and coalesce(old.data->'presupuesto'->'approved', 'null'::jsonb) = 'null'::jsonb;

  -- Turno: solo puede aceptar o rechazar uno propuesto.
  if (new.data->'cita') is distinct from (old.data->'cita') then
    if (old.data->>'cita') is distinct from 'propuesta'
       or (new.data->>'cita') not in ('confirmada','rechazada') then
      raise exception 'Solo se puede aceptar o rechazar un turno propuesto';
    end if;
  end if;

  -- Estado: solo cambia a "taller" al aprobar el presupuesto.
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
create trigger guard_cliente before update on public.work_orders
  for each row execute function private.guard_work_order_cliente();

-- Lo que un CLIENTE puede cambiar de su máquina: solo el horómetro.
create function private.guard_machine_cliente() returns trigger
language plpgsql security definer set search_path = '' as $$
declare permitidas text[] := array['lastHoursUpdate','stage'];
begin
  if coalesce(private.role(), '') <> 'cliente' then return new; end if;
  if (new.agency_id, new.id, new.client_id) is distinct from (old.agency_id, old.id, old.client_id)
     or new.brand is distinct from old.brand
     or new.model is distinct from old.model
     or new.serial is distinct from old.serial
     or new.created_at is distinct from old.created_at
     or (new.data - permitidas) is distinct from (old.data - permitidas) then
    raise exception 'El cliente solo puede actualizar el horómetro';
  end if;
  return new;
end $$;
create trigger guard_cliente before update on public.machines
  for each row execute function private.guard_machine_cliente();

-- Stock: usar un repuesto en una OT lo descuenta; quitarlo lo devuelve.
create function private.apply_part_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('DELETE','UPDATE') then
    update public.parts set stock = stock + old.qty
     where agency_id = old.agency_id and id = old.part_id;
  end if;
  if tg_op in ('INSERT','UPDATE') then
    update public.parts set stock = stock - new.qty
     where agency_id = new.agency_id and id = new.part_id;
    return new;
  end if;
  return old;
end $$;
create trigger apply_stock after insert or update or delete on public.work_order_parts
  for each row execute function private.apply_part_stock();

-- Auditoría de todo cambio en los datos del negocio.
create function private.audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (agency_id, table_name, row_id, op, old_row, new_row, user_id)
  values (coalesce((r->>'agency_id')::uuid, case when tg_table_name = 'agencies' then (r->>'id')::uuid end),
          tg_table_name, coalesce(r->>'id', r->>'user_id'), tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end,
          auth.uid());
  return coalesce(new, old);
end $$;

create trigger audit after insert or update or delete on public.agencies         for each row execute function private.audit();
create trigger audit after insert or update or delete on public.profiles         for each row execute function private.audit();
create trigger audit after insert or update or delete on public.clients          for each row execute function private.audit();
create trigger audit after insert or update or delete on public.machines         for each row execute function private.audit();
create trigger audit after insert or update or delete on public.work_orders      for each row execute function private.audit();
create trigger audit after insert or update or delete on public.parts            for each row execute function private.audit();
create trigger audit after insert or update or delete on public.work_order_parts for each row execute function private.audit();

-- Numeración de órdenes: la da la base, así dos personas a la vez no repiten número.
create function public.next_code(kind text) returns text
language plpgsql security definer set search_path = '' as $$
declare aid uuid := private.agency_id(); n integer;
begin
  if aid is null then raise exception 'Sin agencia'; end if;
  if kind = 'OT' then
    update public.agencies set ot_seq = ot_seq + 1 where id = aid returning ot_seq into n;
    return 'OT-' || n;
  elsif kind = 'SAT' then
    update public.agencies set sat_seq = sat_seq + 1 where id = aid returning sat_seq into n;
    return 'SAT-' || n;
  elsif kind = 'INV' then
    if private.role() not in ('admin','tecnico') then raise exception 'No autorizado'; end if;
    update public.agencies set inv_seq = inv_seq + 1 where id = aid returning inv_seq into n;
    return n::text;
  end if;
  raise exception 'Tipo de numeración desconocido: %', kind;
end $$;

-- ─────────────────── Seguridad por fila (RLS) ───────────────────

alter table public.agencies         enable row level security;
alter table public.platform_admins  enable row level security;
alter table public.profiles         enable row level security;
alter table public.clients          enable row level security;
alter table public.machines         enable row level security;
alter table public.machine_history  enable row level security;
alter table public.work_orders      enable row level security;
alter table public.parts            enable row level security;
alter table public.work_order_parts enable row level security;
alter table public.notifications    enable row level security;
alter table public.audit_log        enable row level security;

-- Agencias: sus miembros la ven; solo su admin la edita; crear/borrar, solo la consultora.
create policy agencies_select on public.agencies for select to authenticated
  using (id = (select private.agency_id()) or (select private.is_platform_admin()));
create policy agencies_update on public.agencies for update to authenticated
  using (private.can_admin(id)) with check (private.can_admin(id));
create policy agencies_insert on public.agencies for insert to authenticated
  with check ((select private.is_platform_admin()));
create policy agencies_delete on public.agencies for delete to authenticated
  using ((select private.is_platform_admin()));

create policy platform_admins_select on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_platform_admin()));

-- Perfiles: cada uno ve el suyo; el admin gestiona los de su agencia.
create policy profiles_select on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.can_admin(agency_id));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (private.can_admin(agency_id));
create policy profiles_update on public.profiles for update to authenticated
  using (private.can_admin(agency_id)) with check (private.can_admin(agency_id));
create policy profiles_delete on public.profiles for delete to authenticated
  using (private.can_admin(agency_id));

-- Clientes: el personal ve y edita todos; el cliente solo se ve a sí mismo. No se borran.
create policy clients_select on public.clients for select to authenticated
  using (private.can_staff(agency_id) or private.is_client(agency_id, id));
create policy clients_insert on public.clients for insert to authenticated
  with check (private.can_staff(agency_id));
create policy clients_update on public.clients for update to authenticated
  using (private.can_staff(agency_id)) with check (private.can_staff(agency_id));

-- Máquinas: el cliente ve las suyas y actualiza el horómetro (trigger). No se borran.
create policy machines_select on public.machines for select to authenticated
  using (private.can_staff(agency_id) or private.is_client(agency_id, client_id));
create policy machines_insert on public.machines for insert to authenticated
  with check (private.can_staff(agency_id));
create policy machines_update on public.machines for update to authenticated
  using (private.can_staff(agency_id) or private.is_client(agency_id, client_id))
  with check (private.can_staff(agency_id) or private.is_client(agency_id, client_id));

-- Historial: solo lectura y alta. Sin políticas de update/delete = nadie lo toca.
create policy machine_history_select on public.machine_history for select to authenticated
  using (private.can_staff(agency_id) or private.owns_machine(agency_id, machine_id));
create policy machine_history_insert on public.machine_history for insert to authenticated
  with check (private.can_staff(agency_id) or private.owns_machine(agency_id, machine_id));

-- Órdenes: el cliente ve las de sus máquinas, puede pedir turno o soporte,
-- y responder (trigger). No se borran: se anulan.
create policy work_orders_select on public.work_orders for select to authenticated
  using (private.can_staff(agency_id) or private.owns_machine(agency_id, machine_id));
create policy work_orders_insert on public.work_orders for insert to authenticated
  with check (private.can_staff(agency_id)
              or (private.owns_machine(agency_id, machine_id)
                  and status in ('cita','recibida')
                  and responsable_id is null and closed_at is null));
create policy work_orders_update on public.work_orders for update to authenticated
  using (private.can_staff(agency_id) or private.owns_machine(agency_id, machine_id))
  with check (private.can_staff(agency_id) or private.owns_machine(agency_id, machine_id));

-- Repuestos y su uso: solo personal.
create policy parts_all on public.parts for all to authenticated
  using (private.can_staff(agency_id)) with check (private.can_staff(agency_id));
create policy work_order_parts_all on public.work_order_parts for all to authenticated
  using (private.can_staff(agency_id)) with check (private.can_staff(agency_id));

-- Notificaciones: el personal maneja todas; el cliente lee las suyas y puede avisar al taller.
create policy notifications_select on public.notifications for select to authenticated
  using (private.can_staff(agency_id)
         or (audience = 'client' and private.is_client(agency_id, client_id)));
create policy notifications_insert on public.notifications for insert to authenticated
  with check (private.can_staff(agency_id)
              or (agency_id = (select private.agency_id()) and (select private.role()) = 'cliente'
                  and (audience = 'admin' or client_id = (select private.client_id()))));
create policy notifications_update on public.notifications for update to authenticated
  using (private.can_staff(agency_id)
         or (audience = 'client' and private.is_client(agency_id, client_id)))
  with check (private.can_staff(agency_id)
         or (audience = 'client' and private.is_client(agency_id, client_id)));
create policy notifications_delete on public.notifications for delete to authenticated
  using (private.can_staff(agency_id)
         or (audience = 'client' and private.is_client(agency_id, client_id)));

-- Auditoría: solo la lee el admin de la agencia. Nadie escribe por la API.
create policy audit_log_select on public.audit_log for select to authenticated
  using (private.can_admin(agency_id));

-- ───────────────────────── Permisos ─────────────────────────
-- Sin sesión (anon) no se accede a nada.

revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon, public;
revoke all on all functions in schema private from anon, public;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;
grant execute on function public.next_code(text) to authenticated;

grant select, insert, update, delete on
  public.agencies, public.profiles, public.clients, public.machines,
  public.work_orders, public.parts, public.work_order_parts, public.notifications
  to authenticated;
grant select, insert on public.machine_history to authenticated;
grant select on public.platform_admins, public.audit_log to authenticated;
revoke truncate, references, trigger on all tables in schema public from authenticated;
