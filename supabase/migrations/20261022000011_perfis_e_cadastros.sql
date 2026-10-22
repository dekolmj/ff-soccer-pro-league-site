-- FF Soccer Pro League · perfis no login, primeiro acesso do atleta e cadastros do painel
--
-- 1) meu_perfil(): depois do login, diz se a pessoa é da equipe FF (admin ou editor), atleta ou nenhum dos dois.
-- 2) Primeiro acesso do atleta: só cria senha quem tem o e-mail cadastrado pela equipe (atletas_privado).
--    A conta só fica ligada ao atleta depois de o e-mail ser confirmado (ninguém se passa por outro).
-- 3) salvar_atleta() / excluir_atleta(): cadastro completo do atleta (dados públicos, privados e elenco) de uma vez.
-- 4) Histórico: quem mudou o quê e quando, em times, atletas e elencos.

-- ============ 1) Perfil de quem está logado ============
create or replace function public.meu_perfil()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare e record; a record;
begin
  if auth.uid() is null then return jsonb_build_object('tipo', null); end if;
  select nome, papel into e from public.equipe_ff where user_id = auth.uid();
  if found then return jsonb_build_object('tipo','equipe','nome',e.nome,'papel',e.papel); end if;
  select at.id, at.nome, el.time_id, el.numero, t.nome as time_nome into a
    from public.atletas at
    left join public.elencos el on el.atleta_id = at.id
    left join public.times t on t.id = el.time_id
   where at.user_id = auth.uid()
   order by el.temporada_id desc nulls last limit 1;
  if found then
    return jsonb_build_object('tipo','atleta','atleta_id',a.id,'nome',a.nome,'time_id',a.time_id,'time',a.time_nome,'numero',a.numero);
  end if;
  return jsonb_build_object('tipo', null);
end; $$;
revoke all on function public.meu_perfil() from public, anon;
grant execute on function public.meu_perfil() to authenticated;

-- ============ 2) Primeiro acesso do atleta ============
-- true se o e-mail é de um atleta cadastrado que ainda não tem conta (a tela "Primeiro acesso" só segue nesse caso).
create or replace function public.primeiro_acesso_liberado(email text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.atletas_privado p join public.atletas a on a.id = p.atleta_id
                  where lower(p.email) = lower(trim(primeiro_acesso_liberado.email)) and a.user_id is null);
$$;
revoke all on function public.primeiro_acesso_liberado(text) from public;
grant execute on function public.primeiro_acesso_liberado(text) to anon, authenticated;

-- Conta confirmada com o e-mail de um atleta: liga a conta ao atleta.
create or replace function privado.ligar_atleta()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is null then return new; end if;
  if exists (select 1 from public.equipe_ff where user_id = new.id) then return new; end if;
  update public.atletas a set user_id = new.id
    from public.atletas_privado p
   where p.atleta_id = a.id and lower(p.email) = lower(new.email) and a.user_id is null
     and not exists (select 1 from public.atletas x where x.user_id = new.id);
  return new;
end; $$;
revoke execute on function privado.ligar_atleta() from public, anon, authenticated;
create trigger ligar_atleta after insert or update of email_confirmed_at on auth.users
  for each row execute function privado.ligar_atleta();

-- Atleta cadastrado depois de já ter conta confirmada (ou e-mail corrigido): liga na hora.
create or replace function privado.ligar_atleta_por_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.atletas a set user_id = u.id
    from auth.users u
   where a.id = new.atleta_id and a.user_id is null and u.email_confirmed_at is not null
     and lower(u.email) = lower(new.email)
     and not exists (select 1 from public.equipe_ff e where e.user_id = u.id)
     and not exists (select 1 from public.atletas x where x.user_id = u.id);
  return new;
end; $$;
revoke execute on function privado.ligar_atleta_por_email() from public, anon, authenticated;
create trigger ligar_atleta_por_email after insert or update of email on public.atletas_privado
  for each row execute function privado.ligar_atleta_por_email();

-- ============ 3) Cadastro de atleta pelo painel ============
-- dados: {id?, nome, apelido?, posicao, unidade_id?, foto_url?, email, celular, nascimento,
--         time_id?, numero?, nome_camisa?, kit?}
-- Sem time_id, o atleta fica cadastrado sem time (sai do elenco, se estava em algum).
create or replace function public.salvar_atleta(dados jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id    uuid := nullif(dados->>'id','')::uuid;
  v_temp  smallint;
  v_time  text := nullif(trim(coalesce(dados->>'time_id','')),'');
  v_email text := lower(trim(coalesce(dados->>'email','')));
  v_nasc  date;
  v_num   int;
  v_outro uuid;
begin
  if not privado.eh_equipe_ff() then return jsonb_build_object('ok',false,'erro','Sem permissão.'); end if;
  if coalesce(trim(dados->>'nome'),'') = '' then return jsonb_build_object('ok',false,'erro','Preencha o nome.'); end if;
  if coalesce(dados->>'posicao','') not in ('GOL','LAT','ZAG','VOL','MEI','ATA') then return jsonb_build_object('ok',false,'erro','Escolha a posição.'); end if;
  if v_email !~ '^\S+@\S+\.\S+$' then return jsonb_build_object('ok',false,'erro','E-mail inválido.'); end if;
  if coalesce(trim(dados->>'celular'),'') = '' then return jsonb_build_object('ok',false,'erro','Preencha o celular.'); end if;
  begin v_nasc := (dados->>'nascimento')::date; exception when others then v_nasc := null; end;
  if v_nasc is null or v_nasc > current_date or v_nasc < date '1930-01-01' then return jsonb_build_object('ok',false,'erro','Data de nascimento inválida.'); end if;

  select atleta_id into v_outro from public.atletas_privado where lower(email) = v_email and atleta_id is distinct from v_id;
  if found then return jsonb_build_object('ok',false,'erro','Já existe um atleta com este e-mail.'); end if;

  if v_time is not null then
    select temporada_id into v_temp from public.times where id = v_time;
    if not found then return jsonb_build_object('ok',false,'erro','Time não encontrado.'); end if;
    begin v_num := (dados->>'numero')::int; exception when others then v_num := null; end;
    if v_num is null or v_num < 1 or v_num > 99 then return jsonb_build_object('ok',false,'erro','Número da camisa de 1 a 99.'); end if;
    if coalesce(trim(dados->>'nome_camisa'),'') = '' or char_length(trim(dados->>'nome_camisa')) > 12 then
      return jsonb_build_object('ok',false,'erro','Nome na camisa com 1 a 12 letras.'); end if;
    if coalesce(dados->>'kit','') not in ('P','M','G','GG','XG') then return jsonb_build_object('ok',false,'erro','Escolha o tamanho do kit.'); end if;
    if exists (select 1 from public.elencos where time_id = v_time and numero = v_num and atleta_id is distinct from v_id) then
      return jsonb_build_object('ok',false,'erro','Este número já é de outro atleta do time.'); end if;
  end if;

  if v_id is null then
    insert into public.atletas (nome, apelido, posicao, unidade_id, foto_url)
    values (left(trim(dados->>'nome'),120), nullif(trim(coalesce(dados->>'apelido','')),''), (dados->>'posicao')::public.posicao,
            nullif(dados->>'unidade_id','')::smallint, nullif(dados->>'foto_url',''))
    returning id into v_id;
    insert into public.atletas_privado (atleta_id, email, celular, nascimento)
    values (v_id, v_email, left(trim(dados->>'celular'),30), v_nasc);
  else
    update public.atletas set nome = left(trim(dados->>'nome'),120), apelido = nullif(trim(coalesce(dados->>'apelido','')),''),
           posicao = (dados->>'posicao')::public.posicao, unidade_id = nullif(dados->>'unidade_id','')::smallint,
           foto_url = nullif(dados->>'foto_url','')
     where id = v_id;
    if not found then return jsonb_build_object('ok',false,'erro','Atleta não encontrado.'); end if;
    insert into public.atletas_privado (atleta_id, email, celular, nascimento)
    values (v_id, v_email, left(trim(dados->>'celular'),30), v_nasc)
    on conflict (atleta_id) do update set email = excluded.email, celular = excluded.celular, nascimento = excluded.nascimento;
  end if;

  if v_time is null then
    delete from public.elencos where atleta_id = v_id;
  else
    delete from public.elencos where atleta_id = v_id and temporada_id <> v_temp;
    insert into public.elencos (temporada_id, time_id, atleta_id, numero, nome_camisa, kit)
    values (v_temp, v_time, v_id, v_num, upper(trim(dados->>'nome_camisa')), (dados->>'kit')::public.tamanho_kit)
    on conflict (temporada_id, atleta_id) do update set time_id = excluded.time_id, numero = excluded.numero,
       nome_camisa = excluded.nome_camisa, kit = excluded.kit;
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
end; $$;
revoke all on function public.salvar_atleta(jsonb) from public, anon;
grant execute on function public.salvar_atleta(jsonb) to authenticated;

-- Apaga o atleta. Se ele já aparece em jogos (súmula ou escalação), não apaga: fica inativo e sai do time.
create or replace function public.excluir_atleta(atleta uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not privado.eh_equipe_ff() then return jsonb_build_object('ok',false,'erro','Sem permissão.'); end if;
  if exists (select 1 from public.eventos_jogo where atleta_id = atleta or atleta2_id = atleta)
     or exists (select 1 from public.escalacoes where atleta_id = atleta)
     or exists (select 1 from public.jogos where mvp_atleta_id = atleta) then
    delete from public.elencos where atleta_id = atleta;
    update public.atletas set ativo = false where id = atleta;
    return jsonb_build_object('ok',true,'inativado',true);
  end if;
  delete from public.atletas where id = atleta;
  return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.excluir_atleta(uuid) from public, anon;
grant execute on function public.excluir_atleta(uuid) to authenticated;

-- ============ 4) Histórico de alterações ============
create table public.historico (
  id        bigint generated always as identity primary key,
  quando    timestamptz not null default now(),
  user_id   uuid references auth.users(id) on delete set null,
  quem      text,
  tabela    text not null,
  acao      text not null,            -- criou | alterou | apagou
  registro  text,                     -- id do registro
  resumo    text                      -- nome do time/atleta (sem dados pessoais)
);
create index on public.historico (quando desc);
create index on public.historico (user_id);
alter table public.historico enable row level security;
create policy "equipe le historico" on public.historico for select to authenticated
  using ((select privado.eh_equipe_ff()));
revoke all on public.historico from anon;
revoke insert, update, delete on public.historico from authenticated;

create or replace function privado.registrar_historico()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r jsonb := to_jsonb(coalesce(new, old)); v_quem text; v_res text;
begin
  select nome into v_quem from public.equipe_ff where user_id = auth.uid();
  if v_quem is null and auth.uid() is null then return null; end if;   -- mudanças feitas direto no banco não entram
  v_res := case tg_table_name
    when 'times'    then r->>'nome'
    when 'atletas'  then r->>'nome'
    when 'elencos'  then (select a.nome from public.atletas a where a.id = (r->>'atleta_id')::uuid) || ' · ' || coalesce(r->>'time_id','') || ' nº ' || coalesce(r->>'numero','')
  end;
  insert into public.historico (user_id, quem, tabela, acao, registro, resumo)
  values (auth.uid(), v_quem, tg_table_name,
          case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'alterou' else 'apagou' end,
          coalesce(r->>'id', r->>'atleta_id'), v_res);
  return null;
end; $$;
revoke execute on function privado.registrar_historico() from public, anon, authenticated;

create trigger historico_times   after insert or update or delete on public.times   for each row execute function privado.registrar_historico();
create trigger historico_atletas after insert or update or delete on public.atletas for each row execute function privado.registrar_historico();
create trigger historico_elencos after insert or update or delete on public.elencos for each row execute function privado.registrar_historico();
