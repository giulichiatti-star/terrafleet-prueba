-- Prueba de seguridad por fila. Crea dos agencias de mentira, prueba los permisos
-- y al final deshace todo (termina a propósito con un error "RESULTADO: ...").
-- Correr:  supabase db query --linked -f supabase/tests/rls_test.sql
do $$
declare
  a1 uuid := gen_random_uuid(); a2 uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid(); u_tec uuid := gen_random_uuid();
  u_cli uuid := gen_random_uuid();   u_cli2 uuid := gen_random_uuid();
  u_otro uuid := gen_random_uuid();  u_nadie uuid := gen_random_uuid();
  n integer; t text; ok integer := 0; fallos text := '';

  -- helpers inline
  procedure_dummy integer;
begin
  insert into auth.users (id, email) values
    (u_admin,'t-admin@test.invalid'),(u_tec,'t-tec@test.invalid'),(u_cli,'t-cli@test.invalid'),
    (u_cli2,'t-cli2@test.invalid'),(u_otro,'t-otro@test.invalid'),(u_nadie,'t-nadie@test.invalid');

  insert into public.agencies (id,name) values (a1,'Agencia Uno'),(a2,'Agencia Dos');
  insert into public.clients (agency_id,id,name) values (a1,'c1','Cliente 1'),(a1,'c2','Cliente 2'),(a2,'c1','Cliente de Dos');
  insert into public.profiles (user_id,agency_id,role,client_id) values
    (u_admin,a1,'admin',null),(u_tec,a1,'tecnico',null),(u_cli,a1,'cliente','c1'),
    (u_cli2,a1,'cliente','c2'),(u_otro,a2,'admin',null);
  insert into public.machines (agency_id,id,client_id,brand,model,serial,hours,data) values
    (a1,'m1','c1','Lovol','TE254','S1',10,'{"stage":"ok"}'),
    (a1,'m2','c2','Lovol','TE366','S2',20,'{}'),
    (a2,'m1','c1','Lovol','TE254','S9',30,'{}');
  insert into public.work_orders (agency_id,id,machine_id,type,status,data) values
    (a1,'OT-1','m1','Cita preventiva','cita','{"cita":"propuesta","proposedDate":"2026-11-20"}'),
    (a1,'OT-2','m1','Avería','presupuesto','{"presupuesto":{"base":100,"iva":21,"total":121,"approved":null}}'),
    (a1,'OT-3','m2','Avería','taller','{}'),
    (a2,'OT-1','m1','Avería','taller','{}');
  insert into public.parts (agency_id,id,ref,name,stock) values (a1,'p1','F-1','Filtro',5),(a2,'p1','F-1','Filtro',9);
  insert into public.machine_history (agency_id,machine_id,title) values (a1,'m1','Entrega'),(a1,'m2','Entrega');
  insert into public.notifications (agency_id,id,audience,client_id,title) values
    (a1,'n1','client','c1','Para c1'),(a1,'n2','client','c2','Para c2'),(a1,'n3','admin',null,'Para taller');

  -- ═══ ADMIN de la agencia 1 ═══
  perform set_config('request.jwt.claims', json_build_object('sub',u_admin,'role','authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.clients;
  if n = 2 then ok := ok+1; else fallos := fallos || ' [admin ve '||n||' clientes, esperaba 2]'; end if;
  select count(*) into n from public.machines;
  if n = 2 then ok := ok+1; else fallos := fallos || ' [admin ve '||n||' máquinas, esperaba 2]'; end if;
  select count(*) into n from public.agencies;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [admin ve '||n||' agencias, esperaba 1]'; end if;
  select count(*) into n from public.parts;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [admin ve '||n||' repuestos, esperaba 1]'; end if;

  begin
    insert into public.clients (agency_id,id,name) values (a2,'cx','Intruso');
    fallos := fallos || ' [admin pudo crear cliente en otra agencia]';
  exception when insufficient_privilege then ok := ok+1; end;

  update public.work_orders set data = data || '{"x":1}' where agency_id = a2;
  get diagnostics n = row_count;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [admin modificó OT de otra agencia]'; end if;

  delete from public.clients where id = 'c2';
  get diagnostics n = row_count;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [se pudo borrar un cliente]'; end if;

  begin
    update public.machine_history set title = 'x';
    fallos := fallos || ' [se pudo editar el historial]';
  exception when insufficient_privilege then ok := ok+1; end;

  insert into public.work_order_parts (agency_id,work_order_id,part_id,qty) values (a1,'OT-3','p1',2);
  select stock into n from public.parts where id = 'p1';
  if n = 3 then ok := ok+1; else fallos := fallos || ' [stock quedó en '||n||', esperaba 3]'; end if;

  t := public.next_code('OT');
  if t = 'OT-4101' then ok := ok+1; else fallos := fallos || ' [next_code dio '||t||']'; end if;

  select count(*) into n from public.audit_log;
  if n > 0 then ok := ok+1; else fallos := fallos || ' [admin no ve la auditoría]'; end if;

  -- ═══ TÉCNICO de la agencia 1 ═══
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub',u_tec,'role','authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.audit_log;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [técnico ve la auditoría]'; end if;
  update public.agencies set name = 'Hackeada';
  get diagnostics n = row_count;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [técnico editó la agencia]'; end if;
  update public.profiles set role = 'admin' where user_id = u_tec;
  get diagnostics n = row_count;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [técnico se hizo admin]'; end if;
  update public.work_orders set status = 'diagnostico' where id = 'OT-3';
  get diagnostics n = row_count;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [técnico no pudo avanzar una OT]'; end if;

  -- el técnico NO toca presupuestos, costos, facturas ni anula
  begin
    update public.work_orders set data = jsonb_set(data,'{presupuesto,base}','1') where id = 'OT-2';
    fallos := fallos || ' [técnico cambió un presupuesto]';
  exception when others then ok := ok+1; end;
  begin
    update public.work_orders set data = data || '{"costoMateriales":5}' where id = 'OT-3';
    fallos := fallos || ' [técnico cargó costos]';
  exception when others then ok := ok+1; end;
  begin
    update public.work_orders set data = data || '{"invoiceNo":"A-1"}' where id = 'OT-3';
    fallos := fallos || ' [técnico facturó]';
  exception when others then ok := ok+1; end;
  begin
    update public.work_orders set status = 'anulada' where id = 'OT-3';
    fallos := fallos || ' [técnico anuló una OT]';
  exception when others then ok := ok+1; end;
  -- sí: notas y fotos de la orden
  update public.work_orders set data = data || '{"techNotes":[{"t":"cambié filtro"}],"fotos":[]}' where id = 'OT-3';
  get diagnostics n = row_count;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [técnico no pudo dejar notas]'; end if;
  -- no crea órdenes, clientes, máquinas ni repuestos
  begin
    insert into public.work_orders (agency_id,id,machine_id,type,status) values (a1,'OT-9','m1','Avería','recibida');
    fallos := fallos || ' [técnico creó una OT]';
  exception when others then ok := ok+1; end;
  begin
    insert into public.clients (agency_id,id,name) values (a1,'c9','Nuevo');
    fallos := fallos || ' [técnico creó un cliente]';
  exception when others then ok := ok+1; end;
  update public.clients set name = 'Cambiado' where id = 'c1';
  get diagnostics n = row_count;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [técnico editó un cliente]'; end if;
  begin
    insert into public.machines (agency_id,id,client_id,brand) values (a1,'m9','c1','X');
    fallos := fallos || ' [técnico creó una máquina]';
  exception when others then ok := ok+1; end;
  begin
    insert into public.parts (agency_id,id,name,stock) values (a1,'p9','Nuevo',1);
    fallos := fallos || ' [técnico creó un repuesto]';
  exception when others then ok := ok+1; end;
  -- máquinas: solo horas y último service
  update public.machines set hours = 15, data = data || '{"lastServiceHours":15}' where id = 'm1';
  get diagnostics n = row_count;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [técnico no pudo cargar horas]'; end if;
  begin
    update public.machines set brand = 'Otra' where id = 'm1';
    fallos := fallos || ' [técnico cambió la marca de una máquina]';
  exception when others then ok := ok+1; end;
  -- repuestos: solo stock
  update public.parts set stock = 4 where id = 'p1';
  get diagnostics n = row_count;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [técnico no pudo descontar stock]'; end if;
  begin
    update public.parts set name = 'Otro' where id = 'p1';
    fallos := fallos || ' [técnico renombró un repuesto]';
  exception when others then ok := ok+1; end;
  delete from public.parts where id = 'p1';
  get diagnostics n = row_count;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [técnico borró un repuesto]'; end if;
  select count(*) into n from public.clients;
  if n = 2 then ok := ok+1; else fallos := fallos || ' [técnico ve '||n||' clientes, esperaba 2]'; end if;

  -- ═══ CLIENTE c1 de la agencia 1 ═══
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub',u_cli,'role','authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.clients;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [cliente ve '||n||' clientes, esperaba 1]'; end if;
  select count(*) into n from public.machines;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [cliente ve '||n||' máquinas, esperaba 1]'; end if;
  select count(*) into n from public.work_orders;
  if n = 2 then ok := ok+1; else fallos := fallos || ' [cliente ve '||n||' OTs, esperaba 2]'; end if;
  select count(*) into n from public.parts;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [cliente ve repuestos]'; end if;
  select count(*) into n from public.machine_history;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [cliente ve '||n||' historiales, esperaba 1]'; end if;
  select count(*) into n from public.notifications;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [cliente ve '||n||' avisos, esperaba 1]'; end if;
  select count(*) into n from public.profiles;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [cliente ve '||n||' perfiles, esperaba 1]'; end if;

  -- acepta el turno propuesto: permitido
  update public.work_orders set data = jsonb_set(data,'{cita}','"confirmada"') where id = 'OT-1';
  get diagnostics n = row_count;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [cliente no pudo aceptar turno]'; end if;

  -- intenta cambiar el importe del presupuesto: prohibido
  begin
    update public.work_orders set data = jsonb_set(data,'{presupuesto,total}','1') where id = 'OT-2';
    fallos := fallos || ' [cliente cambió el importe del presupuesto]';
  exception when raise_exception then ok := ok+1; end;

  -- intenta cerrar la orden: prohibido
  begin
    update public.work_orders set status = 'terminada' where id = 'OT-2';
    fallos := fallos || ' [cliente cambió el estado]';
  exception when raise_exception then ok := ok+1; end;

  -- intenta cambiar la fecha propuesta: prohibido
  begin
    update public.work_orders set data = jsonb_set(data,'{proposedDate}','"2030-01-01"') where id = 'OT-1';
    fallos := fallos || ' [cliente cambió la fecha del turno]';
  exception when raise_exception then ok := ok+1; end;

  -- aprueba el presupuesto y pasa a taller: permitido
  update public.work_orders set status = 'taller', data = jsonb_set(data,'{presupuesto,approved}','true') where id = 'OT-2';
  get diagnostics n = row_count;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [cliente no pudo aprobar presupuesto]'; end if;

  -- ya respondido: no puede cambiar la respuesta
  begin
    update public.work_orders set data = jsonb_set(data,'{presupuesto,approved}','false') where id = 'OT-2';
    fallos := fallos || ' [cliente cambió una respuesta ya dada]';
  exception when raise_exception then ok := ok+1; end;

  -- OT de otro cliente: invisible
  update public.work_orders set data = data || '{"x":1}' where id = 'OT-3';
  get diagnostics n = row_count;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [cliente tocó OT ajena]'; end if;

  -- horómetro: permitido; número de serie: prohibido
  update public.machines set hours = 15, data = data || '{"lastHoursUpdate":1}' where id = 'm1';
  get diagnostics n = row_count;
  if n = 1 then ok := ok+1; else fallos := fallos || ' [cliente no pudo actualizar horómetro]'; end if;
  begin
    update public.machines set serial = 'ROBADA' where id = 'm1';
    fallos := fallos || ' [cliente cambió el número de serie]';
  exception when raise_exception then ok := ok+1; end;

  -- pide turno para su máquina: permitido; para máquina ajena: prohibido
  insert into public.work_orders (agency_id,id,machine_id,type,status,data)
    values (a1, public.next_code('OT'), 'm1','Cita preventiva','cita','{"cita":"solicitada","origin":"cliente"}');
  ok := ok+1;
  begin
    insert into public.work_orders (agency_id,id,machine_id,type,status) values (a1,'OT-X','m2','Cita preventiva','cita');
    fallos := fallos || ' [cliente creó OT en máquina ajena]';
  exception when insufficient_privilege then ok := ok+1; end;
  begin
    insert into public.work_orders (agency_id,id,machine_id,type,status) values (a1,'OT-Y','m1','Avería','terminada');
    fallos := fallos || ' [cliente creó OT ya terminada]';
  exception when insufficient_privilege then ok := ok+1; end;

  -- avisa al taller: permitido; aviso a otro cliente: prohibido
  insert into public.notifications (agency_id,id,audience,title) values (a1,'n9','admin','Turno confirmado');
  ok := ok+1;
  begin
    insert into public.notifications (agency_id,id,audience,client_id,title) values (a1,'n8','client','c2','spam');
    fallos := fallos || ' [cliente notificó a otro cliente]';
  exception when insufficient_privilege then ok := ok+1; end;

  -- ═══ Usuario con sesión pero sin perfil ═══
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub',u_nadie,'role','authenticated')::text, true);
  set local role authenticated;
  select (select count(*) from public.clients) + (select count(*) from public.machines)
       + (select count(*) from public.work_orders) + (select count(*) from public.agencies) into n;
  if n = 0 then ok := ok+1; else fallos := fallos || ' [usuario sin perfil ve '||n||' filas]'; end if;

  -- ═══ Sin sesión (anon) ═══
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.clients;
    fallos := fallos || ' [anon pudo leer clientes]';
  exception when insufficient_privilege then ok := ok+1; end;
  reset role;

  raise exception 'RESULTADO: % pruebas OK. Fallos:% (todo deshecho)', ok, case when fallos = '' then ' ninguno' else fallos end;
end $$;
