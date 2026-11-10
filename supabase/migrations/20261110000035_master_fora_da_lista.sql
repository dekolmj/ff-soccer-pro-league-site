-- FF Soccer Pro League · usuário Master fora da lista de Usuários do painel (10/11/2026, a pedido do Deko).
-- listar_acessos() deixa de devolver quem é master: ninguém o vê na lista (nem ele mesmo). A conta continua funcionando normalmente.
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.listar_acessos()'::regprocedure);
  d := replace(d, 'left join privado.convites_equipe c on c.email = lower(u.email)
        union all', 'left join privado.convites_equipe c on c.email = lower(u.email)
         where not e.master
        union all');
  if position('where not e.master' in d) = 0 then raise exception 'listar_acessos: trecho não encontrado'; end if;
  execute d;
end $do$;
