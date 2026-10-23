-- FF Soccer Pro League · súmula e atleta em mais de uma competição (etapa 2a, parte 2)
-- salvar_atleta(): agora aceita "elencos" (um time por competição); o formato antigo (time_id solto) continua valendo.
-- salvar_sumula(): grava de uma vez placar, quem jogou, gols (com assistência), cartões, VAR e MVP.
--   "fechar" = súmula conferida: o jogo vira encerrado e entra na tabela e nas estatísticas.
--   Súmula fechada só o administrador altera ou reabre.

create or replace function public.salvar_atleta(dados jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id    uuid := nullif(dados->>'id','')::uuid;
  v_email text := lower(trim(coalesce(dados->>'email','')));
  v_nasc  date;
  v_outro uuid;
  v_els   jsonb;
  e       jsonb;
  v_temp  smallint;
  v_temps smallint[] := '{}';
  v_num   int;
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

  v_els := coalesce(dados->'elencos', case when nullif(trim(coalesce(dados->>'time_id','')),'') is null then '[]'::jsonb
             else jsonb_build_array(jsonb_build_object('time_id',dados->>'time_id','numero',dados->>'numero','nome_camisa',dados->>'nome_camisa','kit',dados->>'kit')) end);
  for e in select * from jsonb_array_elements(v_els) loop
    select temporada_id into v_temp from public.times where id = e->>'time_id';
    if not found then return jsonb_build_object('ok',false,'erro','Time não encontrado.'); end if;
    if v_temp = any(v_temps) then return jsonb_build_object('ok',false,'erro','O atleta só pode ter um time em cada competição.'); end if;
    begin v_num := (e->>'numero')::int; exception when others then v_num := null; end;
    if v_num is null or v_num < 1 or v_num > 99 then return jsonb_build_object('ok',false,'erro','Número da camisa de 1 a 99.'); end if;
    if coalesce(trim(e->>'nome_camisa'),'') = '' or char_length(trim(e->>'nome_camisa')) > 12 then
      return jsonb_build_object('ok',false,'erro','Nome na camisa com 1 a 12 letras.'); end if;
    if coalesce(e->>'kit','') not in ('P','M','G','GG','XG') then return jsonb_build_object('ok',false,'erro','Escolha o tamanho do kit.'); end if;
    if exists (select 1 from public.elencos where time_id = e->>'time_id' and numero = v_num and atleta_id is distinct from v_id) then
      return jsonb_build_object('ok',false,'erro','O número '||v_num||' já é de outro atleta do time.'); end if;
    v_temps := v_temps || v_temp;
  end loop;

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

  delete from public.elencos where atleta_id = v_id and not (temporada_id = any(v_temps));
  for e in select * from jsonb_array_elements(v_els) loop
    insert into public.elencos (temporada_id, time_id, atleta_id, numero, nome_camisa, kit)
    values ((select temporada_id from public.times where id = e->>'time_id'), e->>'time_id', v_id, (e->>'numero')::int,
            upper(trim(e->>'nome_camisa')), (e->>'kit')::public.tamanho_kit)
    on conflict (temporada_id, atleta_id) do update set time_id = excluded.time_id, numero = excluded.numero,
       nome_camisa = excluded.nome_camisa, kit = excluded.kit;
  end loop;
  return jsonb_build_object('ok',true,'id',v_id);
end; $$;
revoke all on function public.salvar_atleta(jsonb) from public, anon;
grant execute on function public.salvar_atleta(jsonb) to authenticated;

-- dados: {gols_casa, gols_fora, mvp, fechar, escalacao:[{atleta_id,time_id}],
--         eventos:[{tipo,minuto,time_id,atleta_id,atleta2_id}], var:[{time_id,minuto,motivo,resultado}]}
create or replace function public.salvar_sumula(jogo uuid, dados jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  j       record;
  v_lim   smallint;
  v_fechar boolean := coalesce((dados->>'fechar')::boolean, false);
  v_gc    int; v_gf int; c_gc int := 0; c_gf int := 0;
  v_mvp   uuid := nullif(dados->>'mvp','')::uuid;
  x       jsonb;
  v_esc   jsonb := coalesce(dados->'escalacao','[]'::jsonb);
  v_tipo  text; v_min int;
begin
  if not privado.eh_equipe_ff() then return jsonb_build_object('ok',false,'erro','Sem permissão.'); end if;
  select * into j from public.jogos where id = jogo;
  if not found then return jsonb_build_object('ok',false,'erro','Jogo não encontrado.'); end if;
  if j.sumula_fechada and not privado.eh_admin_ff() then
    return jsonb_build_object('ok',false,'erro','Esta súmula está fechada. Só um administrador altera ou reabre.'); end if;
  select desafios_var_por_jogo into v_lim from public.temporadas where id = j.temporada_id;
  begin v_gc := nullif(dados->>'gols_casa','')::int; v_gf := nullif(dados->>'gols_fora','')::int;
  exception when others then return jsonb_build_object('ok',false,'erro','Placar inválido.'); end;
  if (v_gc is not null and (v_gc < 0 or v_gc > 99)) or (v_gf is not null and (v_gf < 0 or v_gf > 99)) then
    return jsonb_build_object('ok',false,'erro','Placar inválido.'); end if;

  -- quem jogou: atleta do elenco do time, na competição do jogo
  for x in select * from jsonb_array_elements(v_esc) loop
    if x->>'time_id' not in (j.time_casa, j.time_fora) then return jsonb_build_object('ok',false,'erro','Escalação com time que não é deste jogo.'); end if;
    if not exists (select 1 from public.elencos where atleta_id = (x->>'atleta_id')::uuid and time_id = x->>'time_id' and temporada_id = j.temporada_id) then
      return jsonb_build_object('ok',false,'erro','Escalação com atleta que não é do elenco do time.'); end if;
  end loop;

  -- eventos: só de quem jogou; gol contra conta para o outro time
  for x in select * from jsonb_array_elements(coalesce(dados->'eventos','[]'::jsonb)) loop
    v_tipo := x->>'tipo';
    if v_tipo not in ('gol','gol_contra','cartao_amarelo','cartao_vermelho') then return jsonb_build_object('ok',false,'erro','Tipo de lance inválido.'); end if;
    begin v_min := (x->>'minuto')::int; exception when others then v_min := null; end;
    if v_min is null or v_min < 0 or v_min > 130 then return jsonb_build_object('ok',false,'erro','Minuto do lance de 0 a 130.'); end if;
    if not exists (select 1 from jsonb_array_elements(v_esc) s where s->>'atleta_id' = x->>'atleta_id' and s->>'time_id' = x->>'time_id') then
      return jsonb_build_object('ok',false,'erro','Todo lance precisa de um atleta que jogou pelo time escolhido.'); end if;
    if v_tipo = 'gol' and nullif(x->>'atleta2_id','') is not null then
      if x->>'atleta2_id' = x->>'atleta_id' or not exists (select 1 from jsonb_array_elements(v_esc) s where s->>'atleta_id' = x->>'atleta2_id' and s->>'time_id' = x->>'time_id') then
        return jsonb_build_object('ok',false,'erro','A assistência precisa ser de outro atleta que jogou pelo mesmo time.'); end if;
    end if;
    if (v_tipo = 'gol' and x->>'time_id' = j.time_casa) or (v_tipo = 'gol_contra' and x->>'time_id' = j.time_fora) then c_gc := c_gc + 1; end if;
    if (v_tipo = 'gol' and x->>'time_id' = j.time_fora) or (v_tipo = 'gol_contra' and x->>'time_id' = j.time_casa) then c_gf := c_gf + 1; end if;
  end loop;

  if v_mvp is not null and not exists (select 1 from jsonb_array_elements(v_esc) s where (s->>'atleta_id')::uuid = v_mvp) then
    return jsonb_build_object('ok',false,'erro','O MVP precisa ser um atleta que jogou.'); end if;

  for x in select * from jsonb_array_elements(coalesce(dados->'var','[]'::jsonb)) loop
    if x->>'time_id' not in (j.time_casa, j.time_fora) then return jsonb_build_object('ok',false,'erro','VAR com time que não é deste jogo.'); end if;
    if coalesce(trim(x->>'motivo'),'') = '' then return jsonb_build_object('ok',false,'erro','Escreva o motivo de cada pedido de VAR.'); end if;
    if coalesce(x->>'resultado','') not in ('pendente','mantida','revertida') then return jsonb_build_object('ok',false,'erro','Resultado do VAR inválido.'); end if;
  end loop;
  if (select count(*) from jsonb_array_elements(coalesce(dados->'var','[]'::jsonb)) y where y->>'time_id' = j.time_casa) > v_lim
     or (select count(*) from jsonb_array_elements(coalesce(dados->'var','[]'::jsonb)) y where y->>'time_id' = j.time_fora) > v_lim then
    return jsonb_build_object('ok',false,'erro','Cada time tem no máximo '||v_lim||' pedidos de VAR.'); end if;

  if v_fechar then
    if v_gc is null or v_gf is null then return jsonb_build_object('ok',false,'erro','Preencha o placar para fechar a súmula.'); end if;
    if not exists (select 1 from jsonb_array_elements(v_esc) s where s->>'time_id' = j.time_casa)
       or not exists (select 1 from jsonb_array_elements(v_esc) s where s->>'time_id' = j.time_fora) then
      return jsonb_build_object('ok',false,'erro','Marque quem jogou nos dois times para fechar a súmula.'); end if;
    if c_gc <> v_gc or c_gf <> v_gf then
      return jsonb_build_object('ok',false,'erro','O placar ('||v_gc||' x '||v_gf||') não bate com os gols lançados ('||c_gc||' x '||c_gf||').'); end if;
  end if;

  delete from public.desafios_var where jogo_id = jogo;
  delete from public.eventos_jogo where jogo_id = jogo;
  delete from public.escalacoes where jogo_id = jogo;
  insert into public.escalacoes (jogo_id, atleta_id, time_id)
  select jogo, (s->>'atleta_id')::uuid, s->>'time_id' from jsonb_array_elements(v_esc) s;
  insert into public.eventos_jogo (jogo_id, minuto, tipo, time_id, atleta_id, atleta2_id)
  select jogo, (y->>'minuto')::int, (y->>'tipo')::public.tipo_evento, y->>'time_id', (y->>'atleta_id')::uuid, nullif(y->>'atleta2_id','')::uuid
    from jsonb_array_elements(coalesce(dados->'eventos','[]'::jsonb)) y;
  insert into public.desafios_var (jogo_id, time_id, minuto, motivo, resultado)
  select jogo, y->>'time_id', coalesce(nullif(y->>'minuto','')::int,0), left(trim(y->>'motivo'),200), (y->>'resultado')::public.resultado_var
    from jsonb_array_elements(coalesce(dados->'var','[]'::jsonb)) y;
  update public.jogos set gols_casa = v_gc, gols_fora = v_gf, mvp_atleta_id = v_mvp, sumula_fechada = v_fechar,
         status = case when v_fechar then 'encerrado'::public.status_jogo
                       when status = 'encerrado' then 'agendado'::public.status_jogo else status end
   where id = jogo;
  return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.salvar_sumula(uuid, jsonb) from public, anon;
grant execute on function public.salvar_sumula(uuid, jsonb) to authenticated;
