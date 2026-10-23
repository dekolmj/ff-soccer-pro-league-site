-- FF Soccer Pro League · aba Acessos do painel (só administradores)
-- listar_acessos(): funcionários da FF (contas e convites pendentes) e atletas com a situação do acesso.
-- convidar_equipe(): cria ou atualiza o convite de um funcionário (o envio do convite por e-mail vem depois).
-- alterar_papel(): troca administrador/editor de quem já tem conta (ninguém tira o próprio acesso de administrador).

create or replace function public.listar_acessos()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not privado.eh_admin_ff() then return jsonb_build_object('ok',false,'erro','Só administradores.'); end if;
  return jsonb_build_object('ok',true,
    'equipe', coalesce((select jsonb_agg(x order by x->>'nome') from (
        select jsonb_build_object('user_id',e.user_id,'nome',e.nome,'papel',e.papel,'email',u.email,
                                  'situacao','ativa','ultimo_acesso',u.last_sign_in_at,'eu',e.user_id = auth.uid()) x
          from public.equipe_ff e join auth.users u on u.id = e.user_id
        union all
        select jsonb_build_object('user_id',null,'nome',c.nome,'papel',c.papel,'email',c.email,
                                  'situacao','convite','convidado_em',c.criado_em,'eu',false)
          from privado.convites_equipe c
         where not exists (select 1 from auth.users u join public.equipe_ff e on e.user_id = u.id where lower(u.email) = c.email)
      ) q), '[]'::jsonb),
    'atletas', coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'nome',a.nome,'email',p.email,'exemplo',a.exemplo,
                                  'time',t.nome,'numero',el.numero,'situacao',case when a.user_id is null then 'sem_acesso' else 'ativa' end,
                                  'ultimo_acesso',u.last_sign_in_at) order by a.nome)
          from public.atletas a
          left join public.atletas_privado p on p.atleta_id = a.id
          left join public.elencos el on el.atleta_id = a.id
          left join public.times t on t.id = el.time_id
          left join auth.users u on u.id = a.user_id
         where a.ativo), '[]'::jsonb));
end; $$;
revoke all on function public.listar_acessos() from public, anon;
grant execute on function public.listar_acessos() to authenticated;

create or replace function public.convidar_equipe(email text, nome text, papel text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(convidar_equipe.email,''))); v_nome text := trim(coalesce(convidar_equipe.nome,''));
begin
  if not privado.eh_admin_ff() then return jsonb_build_object('ok',false,'erro','Só administradores.'); end if;
  if v_email !~ '^\S+@\S+\.\S+$' then return jsonb_build_object('ok',false,'erro','E-mail inválido.'); end if;
  if v_nome = '' then return jsonb_build_object('ok',false,'erro','Preencha o nome.'); end if;
  if coalesce(papel,'') not in ('admin','editor') then return jsonb_build_object('ok',false,'erro','Escolha o perfil.'); end if;
  if exists (select 1 from public.atletas_privado p where lower(p.email) = v_email) then
    return jsonb_build_object('ok',false,'erro','Este e-mail é de um atleta. Use outro e-mail para o acesso de funcionário.'); end if;
  insert into privado.convites_equipe (email, nome, papel) values (v_email, left(v_nome,80), papel::public.papel_equipe)
  on conflict (email) do update set nome = excluded.nome, papel = excluded.papel;
  update public.equipe_ff e set nome = left(v_nome,80), papel = convidar_equipe.papel::public.papel_equipe
    from auth.users u where u.id = e.user_id and lower(u.email) = v_email and e.user_id <> auth.uid();
  return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.convidar_equipe(text, text, text) from public, anon;
grant execute on function public.convidar_equipe(text, text, text) to authenticated;

create or replace function public.alterar_papel(usuario uuid, papel text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not privado.eh_admin_ff() then return jsonb_build_object('ok',false,'erro','Só administradores.'); end if;
  if coalesce(papel,'') not in ('admin','editor') then return jsonb_build_object('ok',false,'erro','Perfil inválido.'); end if;
  if usuario = auth.uid() then return jsonb_build_object('ok',false,'erro','Você não pode mudar o seu próprio perfil.'); end if;
  update public.equipe_ff set papel = alterar_papel.papel::public.papel_equipe where user_id = usuario;
  update privado.convites_equipe c set papel = alterar_papel.papel::public.papel_equipe
    from auth.users u where u.id = usuario and lower(u.email) = c.email;
  return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.alterar_papel(uuid, text) from public, anon;
grant execute on function public.alterar_papel(uuid, text) to authenticated;
