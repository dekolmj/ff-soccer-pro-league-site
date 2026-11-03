-- FF Soccer Pro League · posição do atleta passa a ser opcional no banco (04/11/2026, a pedido do Deko):
-- permite cadastrar atletas só com nome e número de camisa e completar depois pelo painel (que continua pedindo a 1ª posição ao salvar).
alter table public.atletas alter column posicao drop not null;
