-- FF Soccer Pro League · primeiro acesso do atleta sem e-mail de confirmação (06/11/2026, a pedido do Deko).
-- O serviço de e-mail grátis do Supabase manda poucos e-mails por hora, o que travaria o primeiro acesso dos ~120 atletas.
-- Com a confirmação de e-mail desligada no Supabase (Authentication → Sign In / Providers → Email → Confirm email),
-- quem prova que é o atleta é a data de nascimento: o site manda a data junto da criação da conta (user_metadata.nascimento)
-- e esta trava, antes de a conta ser criada, só deixa passar:
--   · e-mail de atleta cadastrado, ainda sem conta, com a data de nascimento igual à do cadastro;
--   · e-mail convidado para a equipe FF (privado.convites_equipe; as contas da equipe são criadas pelo painel do Supabase).
-- Qualquer outro e-mail é recusado. A data não fica guardada na conta.
create or replace function privado.conferir_primeiro_acesso()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_nasc date; v_atleta boolean;
begin
  if exists (select 1 from privado.convites_equipe c where lower(c.email) = lower(new.email)) then return new; end if;
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
drop trigger if exists conferir_primeiro_acesso on auth.users;
create trigger conferir_primeiro_acesso before insert on auth.users for each row execute function privado.conferir_primeiro_acesso();
