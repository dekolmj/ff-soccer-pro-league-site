-- FF Soccer Pro League · endereço de cada unidade FF (aparece ao passar o mouse no selo da unidade dos jogos; clicar abre o mapa)
alter table public.unidades add column if not exists endereco text check (endereco is null or char_length(endereco) <= 200);
update public.unidades set endereco = 'Rua Clemente Bonifácio, 263 - Mooca, São Paulo - SP' where nome = 'Mooca';
