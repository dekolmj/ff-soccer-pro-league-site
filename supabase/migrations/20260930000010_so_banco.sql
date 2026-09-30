-- FF Soccer Pro League · pré-inscrição só no banco (a planilha do Google foi desligada)
-- O protocolo passa a ser sempre gerado aqui, em sequência. A sequência continua depois do
-- maior protocolo já usado (a planilha chegou ao FF-2027-0007).

select setval('public.pre_inscricoes_seq',
  greatest(7, coalesce((select max(substring(protocolo from '\d+$')::int) from public.pre_inscricoes), 0)), true);

create or replace function public.enviar_pre_inscricao(dados jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email  text := lower(trim(coalesce(dados->>'email','')));
  v_num    int;
  v_nasc   date;
  v_dup    boolean;
  v_prot   text;
  v_temp   smallint;
  v_pos    text[];
  v_nums   smallint[];
  v_n      int;
  k        text;
begin
  if coalesce(dados->>'hp','') <> '' then
    return jsonb_build_object('ok', true, 'protocolo', '-');
  end if;

  foreach k in array array['nome','email','celular','nascimento','unidade','posicao','kit','numero','nome_camisa'] loop
    if coalesce(trim(dados->>k),'') = '' then
      return jsonb_build_object('ok', false, 'erro', 'Campo obrigatório ausente: ' || k);
    end if;
  end loop;
  if v_email !~ '^\S+@\S+\.\S+$' then
    return jsonb_build_object('ok', false, 'erro', 'E-mail inválido');
  end if;
  begin v_num := (dados->>'numero')::int; exception when others then v_num := null; end;
  if v_num is null or v_num < 1 or v_num > 99 then
    return jsonb_build_object('ok', false, 'erro', 'Número da camisa fora de 1 a 99');
  end if;
  if char_length(trim(dados->>'nome_camisa')) > 12 then
    return jsonb_build_object('ok', false, 'erro', 'Nome na camisa com mais de 12 letras');
  end if;
  if coalesce(dados->>'aceite_lgpd','') = '' or coalesce(dados->>'aceite_termos','') = '' then
    return jsonb_build_object('ok', false, 'erro', 'Aceites obrigatórios ausentes');
  end if;
  begin v_nasc := (dados->>'nascimento')::date; exception when others then v_nasc := null; end;
  if v_nasc is null or v_nasc > current_date or v_nasc < date '1930-01-01' then
    return jsonb_build_object('ok', false, 'erro', 'Data de nascimento inválida');
  end if;
  if (dados->>'kit') not in ('P','M','G','GG','XG') then
    return jsonb_build_object('ok', false, 'erro', 'Tamanho do kit inválido');
  end if;
  -- 3 posições e 3 números de preferência (opcionais para quem usa o formulário antigo)
  if jsonb_typeof(dados->'posicoes') = 'array' then
    select array_agg(left(trim(x),30) order by o) into v_pos
      from jsonb_array_elements_text(dados->'posicoes') with ordinality t(x,o) where o <= 3;
  end if;
  if jsonb_typeof(dados->'numeros') = 'array' then
    for v_n in select (x)::int from jsonb_array_elements_text(dados->'numeros') with ordinality t(x,o) where o <= 3 loop
      if v_n is null or v_n < 1 or v_n > 99 then
        return jsonb_build_object('ok', false, 'erro', 'Número da camisa fora de 1 a 99');
      end if;
      v_nums := v_nums || v_n::smallint;
    end loop;
  end if;

  select exists (select 1 from public.pre_inscricoes where lower(email) = v_email) into v_dup;
  select id into v_temp from public.temporadas where status = 'inscricoes' order by id desc limit 1;
  v_prot := 'FF-2027-' || lpad(nextval('public.pre_inscricoes_seq')::text, 4, '0');
  while exists (select 1 from public.pre_inscricoes where protocolo = v_prot) loop
    v_prot := 'FF-2027-' || lpad(nextval('public.pre_inscricoes_seq')::text, 4, '0');
  end loop;

  insert into public.pre_inscricoes
    (protocolo, temporada_id, nome, email, celular, nascimento, unidade, posicao, posicoes, kit, numero, numeros,
     nome_camisa, aceite_lgpd, aceite_termos, versao_termos, origem, duplicado)
  values
    (v_prot, v_temp, left(trim(dados->>'nome'),120), v_email, left(trim(dados->>'celular'),30), v_nasc,
     left(trim(dados->>'unidade'),80), coalesce(v_pos[1], left(trim(dados->>'posicao'),30)), v_pos, (dados->>'kit')::public.tamanho_kit, v_num, v_nums,
     upper(trim(dados->>'nome_camisa')), left(dados->>'aceite_lgpd',1000), left(dados->>'aceite_termos',1000),
     left(coalesce(dados->>'versao_termos',''),20), left(dados->>'origem',300), v_dup);

  return jsonb_build_object('ok', true, 'protocolo', v_prot, 'duplicado', v_dup);
end;
$$;
revoke all on function public.enviar_pre_inscricao(jsonb) from public;
grant execute on function public.enviar_pre_inscricao(jsonb) to anon, authenticated;

