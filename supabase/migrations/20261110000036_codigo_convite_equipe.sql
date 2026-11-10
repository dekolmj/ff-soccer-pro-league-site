-- FF Soccer Pro League · código de convite para o primeiro acesso da equipe FF (10/11/2026, a pedido do Deko).
-- Sem e-mail de confirmação, o funcionário convidado prova que é ele com um código de 6 letras/números que o administrador
-- gera no painel (Usuários → Gerar código) e manda pelo WhatsApp. O código vale uma vez só e vence em 7 dias.
-- Também fecha uma brecha: antes, qualquer criação de conta com e-mail de convite era aceita sem conferência.
alter table privado.convites_equipe add column if not exists codigo_hash text;
alter table privado.convites_equipe add column if not exists codigo_expira timestamptz;
create table if not exists privado.tentativas_convite (email text not null, quando timestamptz not null default now());
create index if not exists tentativas_convite_email on privado.tentativas_convite (email, quando desc);
revoke all on privado.tentativas_convite from public, anon, authenticated;

-- Administrador gera (ou troca) o código de um convite ainda sem conta. O código só aparece nesta resposta; o banco guarda o resumo (bcrypt).
create or replace function public.gerar_codigo_convite(email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(email,''))); v_cod text := ''; v_b bytea; i int;
        v_abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if not privado.eh_admin_ff() then return jsonb_build_object('ok',false,'erro','Só administradores geram código de convite.'); end if;
  if not exists (select 1 from privado.convites_equipe c where c.email = v_email) then return jsonb_build_object('ok',false,'erro','Convite não encontrado.'); end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email) then return jsonb_build_object('ok',false,'erro','Esta pessoa já criou a senha.'); end if;
  v_b := extensions.gen_random_bytes(6);
  for i in 0..5 loop v_cod := v_cod || substr(v_abc, (get_byte(v_b, i) % 32) + 1, 1); end loop;
  update privado.convites_equipe c set codigo_hash = extensions.crypt(v_cod, extensions.gen_salt('bf', 8)), codigo_expira = now() + interval '7 days' where c.email = v_email;
  delete from privado.tentativas_convite t where t.email = v_email;
  return jsonb_build_object('ok',true,'codigo',v_cod,'expira',now() + interval '7 days');
end; $$;
revoke execute on function public.gerar_codigo_convite(text) from public, anon;
grant execute on function public.gerar_codigo_convite(text) to authenticated;

-- Tela "Primeiro acesso" (equipe): confere e-mail + código antes de criar a conta. 5 erros em 1 hora bloqueiam por 1 hora.
create or replace function public.convite_valido(email text, codigo text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(email,''))); v_cod text := upper(regexp_replace(coalesce(codigo,''),'\s','','g')); c record;
begin
  if (select count(*) from privado.tentativas_convite t where t.email = v_email and t.quando > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('ok',false,'erro','Muitas tentativas erradas. Espere 1 hora ou peça um código novo à FF.'); end if;
  select * into c from privado.convites_equipe x where x.email = v_email;
  if c.codigo_hash is null or c.codigo_expira < now() or extensions.crypt(v_cod, c.codigo_hash) <> c.codigo_hash
     or exists (select 1 from auth.users u where lower(u.email) = v_email) then
    insert into privado.tentativas_convite (email) values (v_email);
    delete from privado.tentativas_convite where quando < now() - interval '1 day';
    return jsonb_build_object('ok',false,'erro','E-mail ou código de convite não confere, ou o código venceu. Peça um código novo à FF.');
  end if;
  return jsonb_build_object('ok',true);
end; $$;
revoke execute on function public.convite_valido(text, text) from public;
grant execute on function public.convite_valido(text, text) to anon, authenticated;

-- Trava antes de criar a conta: e-mail de convite só passa com o código certo (que é gasto); atleta continua pela data de nascimento.
create or replace function privado.conferir_primeiro_acesso()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_nasc date; v_atleta boolean; c record; v_cod text;
begin
  select * into c from privado.convites_equipe x where lower(x.email) = lower(new.email);
  if found then
    v_cod := upper(regexp_replace(coalesce(new.raw_user_meta_data->>'convite',''),'\s','','g'));
    if c.codigo_hash is null or c.codigo_expira < now() or extensions.crypt(v_cod, c.codigo_hash) <> c.codigo_hash then
      raise exception 'primeiro_acesso: convite não confere'; end if;
    update privado.convites_equipe x set codigo_hash = null, codigo_expira = null where x.email = c.email;
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data,'{}'::jsonb) - 'convite';
    return new;
  end if;
  select true, p.nascimento into v_atleta, v_nasc
    from public.atletas_privado p join public.atletas a on a.id = p.atleta_id
   where lower(p.email) = lower(new.email) and a.user_id is null limit 1;
  if v_atleta is null then raise exception 'primeiro_acesso: e-mail não cadastrado'; end if;
  if v_nasc is null or coalesce(new.raw_user_meta_data->>'nascimento','') <> to_char(v_nasc,'YYYY-MM-DD') then
    raise exception 'primeiro_acesso: nascimento não confere'; end if;
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data,'{}'::jsonb) - 'nascimento';
  return new;
end; $$;
revoke execute on function privado.conferir_primeiro_acesso() from public, anon, authenticated;

-- A lista de Usuários do painel passa a dizer se o convite já tem código e até quando vale.
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.listar_acessos()'::regprocedure);
  d := replace(d, '''situacao'',''convite'',''convidado_em'',c.criado_em,', '''situacao'',''convite'',''convidado_em'',c.criado_em,''codigo_expira'',c.codigo_expira,');
  if position('codigo_expira' in d) = 0 then raise exception 'listar_acessos: trecho não encontrado'; end if;
  execute d;
end $do$;
