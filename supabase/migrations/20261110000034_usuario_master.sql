-- FF Soccer Pro League · nível Master (10/11/2026, a pedido do Deko).
-- Um administrador marcado como master tem tudo do administrador e mais o que for só dele (hoje: a Visão do atleta no painel).
-- A marca não muda pelo painel nem pelo site: só por aqui, no SQL Editor do Supabase (quem está logado no site não consegue ligar nem desligar).
alter table public.equipe_ff add column if not exists master boolean not null default false;

create or replace function privado.travar_master()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.master := case when tg_op = 'UPDATE' then old.master else false end;
  end if;
  return new;
end; $$;
revoke execute on function privado.travar_master() from public, anon, authenticated;
drop trigger if exists travar_master on public.equipe_ff;
create trigger travar_master before insert or update on public.equipe_ff for each row execute function privado.travar_master();

-- meu_perfil() e listar_acessos() passam a informar quem é master
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.meu_perfil()'::regprocedure);
  d := replace(d, 'select nome, papel into e from public.equipe_ff', 'select nome, papel, master into e from public.equipe_ff');
  d := replace(d, '''papel'',e.papel)', '''papel'',e.papel,''master'',e.master)');
  execute d;
  d := pg_get_functiondef('public.listar_acessos()'::regprocedure);
  d := replace(d, '''papel'',e.papel,''email'',u.email', '''papel'',e.papel,''master'',e.master,''email'',u.email');
  execute d;
end $do$;

-- Para marcar alguém como master (feito em 10/11/2026 para o usuário de teste do Deko; o e-mail fica só no banco):
--   update public.equipe_ff e set master = true from auth.users u where u.id = e.user_id and lower(u.email) = '<e-mail>';
