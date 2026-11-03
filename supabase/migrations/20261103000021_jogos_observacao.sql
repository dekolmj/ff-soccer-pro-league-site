-- FF Soccer Pro League · observação de cada jogo (aviso sobre aulas na unidade, reposição etc.)
-- Aparece no site abaixo do jogo: tipo 'aviso' (⚠️, borda amarela) ou 'ok' (✅, borda verde).
-- salvar_jogo() passa a gravar a observação quando ela vem nos dados.

alter table public.jogos add column if not exists observacao text check (observacao is null or char_length(observacao) <= 300);
alter table public.jogos add column if not exists observacao_tipo text not null default 'aviso' check (observacao_tipo in ('aviso','ok'));

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
  if char_length(coalesce(dados->>'observacao','')) > 300 then return jsonb_build_object('ok',false,'erro','A observação pode ter até 300 letras.'); end if;
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
  if dados ? 'observacao' then
    update public.jogos set observacao = nullif(trim(dados->>'observacao'),''),
           observacao_tipo = case when dados->>'observacao_tipo' = 'ok' then 'ok' else 'aviso' end
     where id = v_id;
  end if;
  return jsonb_build_object('ok',true,'id',v_id);
exception when unique_violation then
  return jsonb_build_object('ok',false,'erro','Já existe um jogo nessa posição da rodada. Tente de novo.');
end; $$;
