-- FF Soccer Pro League · acesso da equipe ao painel e pré-inscrição também no banco
--
-- 1) Convites: a equipe FF entra no painel com e-mail e senha. Só vira equipe quem estiver
--    convidado aqui E tiver o e-mail confirmado (ninguém se passa por outro criando conta com o e-mail dele).
--    Para convidar: insert into privado.convites_equipe (email, nome, papel) values ('x@y.com','Nome','editor');
-- 2) enviar_pre_inscricao aceita o protocolo que a planilha já gerou, para os dois registros terem o mesmo número.
-- 3) Tempo real: o painel recebe na hora cada pré-inscrição nova ou alterada.

create table privado.convites_equipe (
  email      text primary key check (email = lower(email)),
  nome       text not null,
  papel      public.papel_equipe not null default 'editor',
  criado_em  timestamptz not null default now()
);
revoke all on privado.convites_equipe from public, anon, authenticated;

create or replace function privado.liberar_equipe()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  if new.email_confirmed_at is null then return new; end if;
  select * into c from privado.convites_equipe where email = lower(new.email);
  if found then
    insert into public.equipe_ff (user_id, nome, papel) values (new.id, c.nome, c.papel)
    on conflict (user_id) do nothing;
  end if;
  return new;
end; $$;
revoke execute on function privado.liberar_equipe() from public, anon, authenticated;

create trigger liberar_equipe after insert or update of email_confirmed_at on auth.users
  for each row execute function privado.liberar_equipe();

-- Convite feito depois de a pessoa já ter conta confirmada: libera na hora.
create or replace function privado.liberar_convite()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.equipe_ff (user_id, nome, papel)
  select u.id, new.nome, new.papel from auth.users u
   where lower(u.email) = new.email and u.email_confirmed_at is not null
  on conflict (user_id) do nothing;
  return new;
end; $$;
revoke execute on function privado.liberar_convite() from public, anon, authenticated;
create trigger liberar_convite after insert on privado.convites_equipe
  for each row execute function privado.liberar_convite();

-- Protocolo vindo da planilha (FF-2027-0001…): usa o mesmo número se ainda não existir no banco.
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
  v_prot   text := coalesce(dados->>'protocolo','');
  v_temp   smallint;
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

  select exists (select 1 from public.pre_inscricoes where lower(email) = v_email) into v_dup;
  select id into v_temp from public.temporadas where status = 'inscricoes' order by id desc limit 1;
  if v_prot !~ '^FF-\d{4}-\d{4,6}$' or exists (select 1 from public.pre_inscricoes where protocolo = v_prot) then
    v_prot := 'FF-2027-' || lpad(nextval('public.pre_inscricoes_seq')::text, 4, '0');
    while exists (select 1 from public.pre_inscricoes where protocolo = v_prot) loop
      v_prot := 'FF-2027-' || lpad(nextval('public.pre_inscricoes_seq')::text, 4, '0');
    end loop;
  end if;

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

alter publication supabase_realtime add table public.pre_inscricoes;
