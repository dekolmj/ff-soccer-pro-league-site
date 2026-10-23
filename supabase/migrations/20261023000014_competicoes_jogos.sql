-- FF Soccer Pro League · competições, cadastro de jogos e histórico dos jogos (etapa 2a, parte 1)
-- Cada competição é uma temporada: FF Pro League (campo, 11 x 11) e Libertadores FF (Fut7, com grupos).
-- Times e jogos pertencem a uma temporada; um atleta pode estar num time de cada competição.

alter table public.temporadas add column if not exists competicao text not null default 'pro_league'
  check (competicao in ('pro_league','libertadores'));
alter table public.times add column if not exists grupo text check (grupo ~ '^[A-H]$');
alter table public.jogos add column if not exists grupo text check (grupo ~ '^[A-H]$');

insert into public.temporadas (nome, status, competicao, desafios_var_por_jogo)
select 'Libertadores FF 2026', 'em_andamento', 'libertadores', 2
where not exists (select 1 from public.temporadas where competicao = 'libertadores');

-- Os dois times de um jogo precisam ser da mesma competição (temporada) do jogo.
create or replace function privado.conferir_times_do_jogo()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.times where id = new.time_casa and temporada_id = new.temporada_id)
     or not exists (select 1 from public.times where id = new.time_fora and temporada_id = new.temporada_id) then
    raise exception 'Os dois times precisam ser da mesma competição do jogo.';
  end if;
  return new;
end; $$;
revoke execute on function privado.conferir_times_do_jogo() from public, anon, authenticated;
create trigger conferir_times_do_jogo before insert or update of temporada_id, time_casa, time_fora on public.jogos
  for each row execute function privado.conferir_times_do_jogo();

-- Cria ou altera um jogo (a ordem dentro da rodada é calculada aqui).
create or replace function public.salvar_jogo(dados jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id    uuid := nullif(dados->>'id','')::uuid;
  v_temp  smallint := nullif(dados->>'temporada_id','')::smallint;
  v_rod   int;
  v_ordem smallint;
  v_dh    timestamptz;
  v_st    text := coalesce(nullif(dados->>'status',''),'agendado');
begin
  if not privado.eh_equipe_ff() then return jsonb_build_object('ok',false,'erro','Sem permissão.'); end if;
  if not exists (select 1 from public.temporadas where id = v_temp) then return jsonb_build_object('ok',false,'erro','Escolha a competição.'); end if;
  begin v_rod := (dados->>'rodada')::int; exception when others then v_rod := null; end;
  if v_rod is null or v_rod < 1 or v_rod > 99 then return jsonb_build_object('ok',false,'erro','Rodada de 1 a 99.'); end if;
  if coalesce(dados->>'time_casa','') = '' or coalesce(dados->>'time_fora','') = '' then return jsonb_build_object('ok',false,'erro','Escolha os dois times.'); end if;
  if dados->>'time_casa' = dados->>'time_fora' then return jsonb_build_object('ok',false,'erro','Escolha dois times diferentes.'); end if;
  if v_st not in ('agendado','adiado','cancelado') then v_st := 'agendado'; end if;
  begin v_dh := nullif(dados->>'data_hora','')::timestamptz; exception when others then return jsonb_build_object('ok',false,'erro','Data ou horário inválido.'); end;
  if v_id is null then
    select coalesce(max(ordem),0) + 1 into v_ordem from public.jogos where temporada_id = v_temp and rodada = v_rod;
    insert into public.jogos (temporada_id, rodada, ordem, grupo, data_hora, local, time_casa, time_fora, status)
    values (v_temp, v_rod, v_ordem, nullif(dados->>'grupo',''), v_dh, nullif(trim(coalesce(dados->>'local','')),''),
            dados->>'time_casa', dados->>'time_fora', v_st::public.status_jogo)
    returning id into v_id;
  else
    if exists (select 1 from public.jogos where id = v_id and sumula_fechada) and
       (select time_casa <> dados->>'time_casa' or time_fora <> dados->>'time_fora' from public.jogos where id = v_id) then
      return jsonb_build_object('ok',false,'erro','A súmula deste jogo está fechada: reabra a súmula para trocar os times.'); end if;
    update public.jogos set rodada = v_rod, grupo = nullif(dados->>'grupo',''), data_hora = v_dh,
           local = nullif(trim(coalesce(dados->>'local','')),''), time_casa = dados->>'time_casa', time_fora = dados->>'time_fora',
           status = case when status in ('encerrado','ao_vivo') then status else v_st::public.status_jogo end,
           ordem = case when rodada = v_rod then ordem
                        else (select coalesce(max(ordem),0) + 1 from public.jogos where temporada_id = v_temp and rodada = v_rod) end
     where id = v_id and temporada_id = v_temp;
    if not found then return jsonb_build_object('ok',false,'erro','Jogo não encontrado.'); end if;
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
exception when unique_violation then
  return jsonb_build_object('ok',false,'erro','Já existe um jogo nessa posição da rodada. Tente de novo.');
end; $$;
revoke all on function public.salvar_jogo(jsonb) from public, anon;
grant execute on function public.salvar_jogo(jsonb) to authenticated;

-- Histórico também registra jogos.
create or replace function privado.registrar_historico()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r jsonb := to_jsonb(coalesce(new, old)); v_quem text; v_res text;
begin
  select nome into v_quem from public.equipe_ff where user_id = auth.uid();
  if v_quem is null and auth.uid() is null then return null; end if;
  v_res := case tg_table_name
    when 'times'    then r->>'nome'
    when 'atletas'  then r->>'nome'
    when 'elencos'  then (select a.nome from public.atletas a where a.id = (r->>'atleta_id')::uuid) || ' · ' || coalesce(r->>'time_id','') || ' nº ' || coalesce(r->>'numero','')
    when 'jogos'    then (select t.nome from public.temporadas t where t.id = (r->>'temporada_id')::smallint) || ' · rodada ' || coalesce(r->>'rodada','')
                         || ' · ' || coalesce(r->>'time_casa','') || ' x ' || coalesce(r->>'time_fora','')
                         || case when (r->>'sumula_fechada')::boolean then ' · súmula fechada' else '' end
  end;
  insert into public.historico (user_id, quem, tabela, acao, registro, resumo)
  values (auth.uid(), v_quem, tg_table_name,
          case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'alterou' else 'apagou' end,
          coalesce(r->>'id', r->>'atleta_id'), v_res);
  return null;
end; $$;
revoke execute on function privado.registrar_historico() from public, anon, authenticated;
create trigger historico_jogos after insert or update or delete on public.jogos for each row execute function privado.registrar_historico();
