-- FF Soccer Pro League · "Esqueci a senha" do atleta, sem e-mail (06/11/2026, a pedido do Deko).
-- O atleta informa e-mail, data de nascimento e a senha nova; se bater com o cadastro (atleta que já tem conta),
-- a senha é trocada na hora e as sessões abertas dele são encerradas. Mesma conferência do primeiro acesso.
-- Trava: 5 tentativas erradas para o mesmo e-mail em 1 hora bloqueiam novas tentativas por 1 hora.
-- Só vale para conta de atleta; senha da equipe FF continua sendo trocada pelo painel do Supabase.
create table if not exists privado.tentativas_senha (
  id bigserial primary key,
  email text not null,
  quando timestamptz not null default now()
);
create index if not exists tentativas_senha_email on privado.tentativas_senha (email, quando desc);
revoke all on privado.tentativas_senha from public, anon, authenticated;

create or replace function public.redefinir_senha(email text, nascimento text, nova text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(email,''))); v_nasc date; v_user uuid;
begin
  if v_email = '' then return jsonb_build_object('ok',false,'erro','Preencha o e-mail.'); end if;
  if (select count(*) from privado.tentativas_senha t where t.email = v_email and t.quando > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('ok',false,'erro','Muitas tentativas erradas. Espere 1 hora e tente de novo, ou fale com a equipe FF.'); end if;
  if length(coalesce(nova,'')) < 6 then return jsonb_build_object('ok',false,'erro','A senha precisa ter pelo menos 6 caracteres.'); end if;
  begin v_nasc := nascimento::date; exception when others then v_nasc := null; end;
  select a.user_id into v_user
    from public.atletas_privado p join public.atletas a on a.id = p.atleta_id
   where lower(p.email) = v_email and a.user_id is not null and v_nasc is not null and p.nascimento = v_nasc
   limit 1;
  if v_user is null then
    insert into privado.tentativas_senha (email) values (v_email);
    delete from privado.tentativas_senha where quando < now() - interval '1 day';
    return jsonb_build_object('ok',false,'erro','E-mail e data de nascimento não conferem com uma conta de atleta. Se você ainda não criou a sua senha, use "Primeiro acesso".');
  end if;
  update auth.users set encrypted_password = extensions.crypt(nova, extensions.gen_salt('bf', 10)), updated_at = now() where id = v_user;
  delete from auth.refresh_tokens where user_id = v_user::text;
  delete from auth.sessions where user_id = v_user;
  delete from privado.tentativas_senha where privado.tentativas_senha.email = v_email;
  return jsonb_build_object('ok',true);
end; $$;
revoke execute on function public.redefinir_senha(text, text, text) from public;
grant execute on function public.redefinir_senha(text, text, text) to anon, authenticated;
