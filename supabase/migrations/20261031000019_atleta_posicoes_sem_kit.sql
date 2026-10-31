-- FF Soccer Pro League · cadastro do atleta sem kit e com até 3 posições (31/10/2026, a pedido do Deko)
-- elencos.kit passa a ser opcional; atletas.posicoes guarda até 3 posições em ordem (a 1ª continua em atletas.posicao).

alter table public.elencos alter column kit drop not null;
alter table public.atletas add column if not exists posicoes public.posicao[];
update public.atletas set posicoes = array[posicao] where posicoes is null;

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
  v_pos   public.posicao[];
begin
  if not privado.eh_equipe_ff() then return jsonb_build_object('ok',false,'erro','Sem permissão.'); end if;
  if coalesce(trim(dados->>'nome'),'') = '' then return jsonb_build_object('ok',false,'erro','Preencha o nome.'); end if;
  -- até 3 posições, em ordem de preferência (a 1ª fica também em "posicao"); o formato antigo, só "posicao", continua valendo
  if jsonb_typeof(dados->'posicoes') = 'array' then
    if exists (select 1 from jsonb_array_elements_text(dados->'posicoes') p where p not in ('GOL','LAT','ZAG','VOL','MEI','ATA')) then
      return jsonb_build_object('ok',false,'erro','Posição inválida.'); end if;
    select array_agg(p::public.posicao order by o) into v_pos from jsonb_array_elements_text(dados->'posicoes') with ordinality as y(p, o);
  elsif coalesce(dados->>'posicao','') in ('GOL','LAT','ZAG','VOL','MEI','ATA') then
    v_pos := array[(dados->>'posicao')::public.posicao];
  end if;
  if v_pos is null or cardinality(v_pos) < 1 then return jsonb_build_object('ok',false,'erro','Escolha a posição.'); end if;
  if cardinality(v_pos) > 3 then return jsonb_build_object('ok',false,'erro','Escolha até 3 posições.'); end if;
  if (select count(distinct p) from unnest(v_pos) p) < cardinality(v_pos) then return jsonb_build_object('ok',false,'erro','Escolha posições diferentes.'); end if;
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
    if coalesce(e->>'kit','') not in ('','P','M','G','GG','XG') then return jsonb_build_object('ok',false,'erro','Tamanho do kit inválido.'); end if;
    if exists (select 1 from public.elencos where time_id = e->>'time_id' and numero = v_num and atleta_id is distinct from v_id) then
      return jsonb_build_object('ok',false,'erro','O número '||v_num||' já é de outro atleta do time.'); end if;
    v_temps := v_temps || v_temp;
  end loop;

  if v_id is null then
    insert into public.atletas (nome, apelido, posicao, posicoes, unidade_id, foto_url)
    values (left(trim(dados->>'nome'),120), nullif(trim(coalesce(dados->>'apelido','')),''), v_pos[1], v_pos,
            nullif(dados->>'unidade_id','')::smallint, nullif(dados->>'foto_url',''))
    returning id into v_id;
    insert into public.atletas_privado (atleta_id, email, celular, nascimento)
    values (v_id, v_email, left(trim(dados->>'celular'),30), v_nasc);
  else
    update public.atletas set nome = left(trim(dados->>'nome'),120), apelido = nullif(trim(coalesce(dados->>'apelido','')),''),
           posicao = v_pos[1], posicoes = v_pos, unidade_id = nullif(dados->>'unidade_id','')::smallint,
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
            upper(trim(e->>'nome_camisa')), nullif(e->>'kit','')::public.tamanho_kit)
    on conflict (temporada_id, atleta_id) do update set time_id = excluded.time_id, numero = excluded.numero,
       nome_camisa = excluded.nome_camisa, kit = excluded.kit;
  end loop;
  return jsonb_build_object('ok',true,'id',v_id);
end; $$;
revoke all on function public.salvar_atleta(jsonb) from public, anon;
grant execute on function public.salvar_atleta(jsonb) to authenticated;
