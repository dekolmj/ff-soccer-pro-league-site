-- FF Soccer Pro League · aba Usuários do painel (atletas e funcionários juntos)
-- Funcionário ganha telefone e cargo (ficam no convite, junto com nome e perfil).
-- listar_acessos() passa a valer para toda a equipe (editor vê a lista; só administrador cria ou muda funcionário).
-- salvar_funcionario(): cria ou atualiza um funcionário (o envio do convite por e-mail vem depois).

alter table privado.convites_equipe add column if not exists telefone text, add column if not exists cargo text;

create or replace function public.listar_acessos()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not privado.eh_equipe_ff() then return jsonb_build_object('ok',false,'erro','Sem permissão.'); end if;
  return jsonb_build_object('ok',true,
    'equipe', coalesce((select jsonb_agg(x order by x->>'nome') from (
        select jsonb_build_object('user_id',e.user_id,'nome',e.nome,'papel',e.papel,'email',u.email,'telefone',c.telefone,'cargo',c.cargo,
                                  'situacao','ativa','ultimo_acesso',u.last_sign_in_at,'eu',e.user_id = auth.uid()) x
          from public.equipe_ff e join auth.users u on u.id = e.user_id
          left join privado.convites_equipe c on c.email = lower(u.email)
        union all
        select jsonb_build_object('user_id',null,'nome',c.nome,'papel',c.papel,'email',c.email,'telefone',c.telefone,'cargo',c.cargo,
                                  'situacao','convite','convidado_em',c.criado_em,'eu',false)
          from privado.convites_equipe c
         where not exists (select 1 from auth.users u join public.equipe_ff e on e.user_id = u.id where lower(u.email) = c.email)
      ) q), '[]'::jsonb),
    'atletas', coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'situacao',case when a.user_id is null then 'sem_acesso' else 'ativa' end,
                                  'ultimo_acesso',u.last_sign_in_at))
          from public.atletas a left join auth.users u on u.id = a.user_id), '[]'::jsonb));
end; $$;
revoke all on function public.listar_acessos() from public, anon;
grant execute on function public.listar_acessos() to authenticated;

create or replace function public.salvar_funcionario(dados jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(dados->>'email','')));
  v_nome  text := trim(coalesce(dados->>'nome',''));
  v_papel text := coalesce(dados->>'papel','');
  v_eu    boolean;
begin
  if not privado.eh_admin_ff() then return jsonb_build_object('ok',false,'erro','Só administradores criam e alteram funcionários.'); end if;
  if v_nome = '' then return jsonb_build_object('ok',false,'erro','Preencha o nome.'); end if;
  if v_email !~ '^\S+@\S+\.\S+$' then return jsonb_build_object('ok',false,'erro','E-mail inválido.'); end if;
  if v_papel not in ('admin','editor') then return jsonb_build_object('ok',false,'erro','Escolha o perfil de acesso.'); end if;
  if exists (select 1 from public.atletas_privado p where lower(p.email) = v_email) then
    return jsonb_build_object('ok',false,'erro','Este e-mail é de um atleta. Use outro e-mail para o funcionário.'); end if;
  select exists (select 1 from auth.users u where u.id = auth.uid() and lower(u.email) = v_email) into v_eu;
  if v_eu and v_papel <> 'admin' then return jsonb_build_object('ok',false,'erro','Você não pode tirar o seu próprio acesso de administrador.'); end if;
  insert into privado.convites_equipe (email, nome, papel, telefone, cargo)
  values (v_email, left(v_nome,80), v_papel::public.papel_equipe, nullif(left(trim(coalesce(dados->>'telefone','')),30),''), nullif(left(trim(coalesce(dados->>'cargo','')),60),''))
  on conflict (email) do update set nome = excluded.nome, papel = excluded.papel, telefone = excluded.telefone, cargo = excluded.cargo;
  update public.equipe_ff e set nome = left(v_nome,80), papel = v_papel::public.papel_equipe
    from auth.users u where u.id = e.user_id and lower(u.email) = v_email;
  return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.salvar_funcionario(jsonb) from public, anon;
grant execute on function public.salvar_funcionario(jsonb) to authenticated;
