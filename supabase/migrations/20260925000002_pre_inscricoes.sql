-- FF Soccer Pro League · pré-inscrições
-- O site NÃO grava direto na tabela: ele chama a função enviar_pre_inscricao(),
-- que valida, grava e devolve {ok, protocolo, duplicado}, igual ao Apps Script de hoje.
-- Visitantes não conseguem ler, alterar nem apagar nenhuma inscrição.

create type public.status_inscricao as enum ('em_analise','aprovada','recusada','lista_espera','cancelada');

create sequence public.pre_inscricoes_seq;

create table public.pre_inscricoes (
  id              uuid primary key default gen_random_uuid(),
  protocolo       text not null unique,
  status          public.status_inscricao not null default 'em_analise',
  temporada_id    smallint references public.temporadas(id),
  nome            text not null check (char_length(nome) between 3 and 120),
  email           text not null check (email ~ '^\S+@\S+\.\S+$' and char_length(email) <= 200),
  celular         text not null check (char_length(celular) between 8 and 30),
  nascimento      date not null,
  unidade         text not null check (char_length(unidade) <= 80),
  posicao         text not null check (char_length(posicao) <= 30),
  kit             public.tamanho_kit not null,
  numero          smallint not null check (numero between 1 and 99),
  nome_camisa     text not null check (char_length(nome_camisa) between 1 and 12),
  aceite_lgpd     text not null,          -- texto exato que o atleta aceitou
  aceite_termos   text not null,
  versao_termos   text not null,
  origem          text,
  duplicado       boolean not null default false,   -- e-mail já tinha inscrição
  analisado_por   uuid references auth.users(id),
  analisado_em    timestamptz,
  observacao      text,                              -- anotação interna da FF
  atleta_id       uuid references public.atletas(id),-- preenchido quando aprovado
  recebido_em     timestamptz not null default now()
);
create index on public.pre_inscricoes (lower(email));
create index on public.pre_inscricoes (status, recebido_em desc);
create index on public.pre_inscricoes (temporada_id);
create index on public.pre_inscricoes (analisado_por);
create index on public.pre_inscricoes (atleta_id);

-- Chamada pelo site (sem login). Recebe o mesmo JSON que o formulário já monta.
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
  k        text;
begin
  -- campo invisível para robôs: finge que deu certo e não grava
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

  select exists (select 1 from public.pre_inscricoes where lower(email) = v_email) into v_dup;
  select id into v_temp from public.temporadas where status = 'inscricoes' order by id desc limit 1;
  v_prot := 'FF-2027-' || lpad(nextval('public.pre_inscricoes_seq')::text, 4, '0');

  insert into public.pre_inscricoes
    (protocolo, temporada_id, nome, email, celular, nascimento, unidade, posicao, kit, numero,
     nome_camisa, aceite_lgpd, aceite_termos, versao_termos, origem, duplicado)
  values
    (v_prot, v_temp, left(trim(dados->>'nome'),120), v_email, left(trim(dados->>'celular'),30), v_nasc,
     left(trim(dados->>'unidade'),80), left(trim(dados->>'posicao'),30), (dados->>'kit')::public.tamanho_kit, v_num,
     upper(trim(dados->>'nome_camisa')), left(dados->>'aceite_lgpd',1000), left(dados->>'aceite_termos',1000),
     left(coalesce(dados->>'versao_termos',''),20), left(dados->>'origem',300), v_dup);

  return jsonb_build_object('ok', true, 'protocolo', v_prot, 'duplicado', v_dup);
end;
$$;

revoke all on function public.enviar_pre_inscricao(jsonb) from public;
grant execute on function public.enviar_pre_inscricao(jsonb) to anon, authenticated;
