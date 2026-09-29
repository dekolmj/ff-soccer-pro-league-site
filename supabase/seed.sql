-- FF Soccer Pro League · dados iniciais
-- Só o que já é real: a temporada aberta para inscrições e as unidades que o formulário oferece hoje.
-- Times, atletas e jogos entram depois, pelo painel ou importação.

insert into public.temporadas (nome, status, desafios_var_por_jogo, minutos_minimos_por_atleta)
values ('Temporada 2027', 'inscricoes', 2, 45)
on conflict (nome) do nothing;

insert into public.unidades (nome) values
  ('Morumbi Town'), ('Guarulhos'), ('Campo Belo'), ('Mooca'), ('Barra Funda'), ('Tucuruvi'), ('Villa Lobos'), ('Vila Mariana')
on conflict (nome) do update set ativa = true;
-- Unidades antigas, usadas só pelos atletas de exemplo, ficam desativadas.
update public.unidades set ativa = false
 where nome not in ('Morumbi Town','Guarulhos','Campo Belo','Mooca','Barra Funda','Tucuruvi','Villa Lobos','Vila Mariana');
