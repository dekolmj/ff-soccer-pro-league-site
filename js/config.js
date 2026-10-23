/* ====== CONFIGURAÇÃO ====== */
var CONFIG={
  /* Banco de dados (Supabase). A chave abaixo é a chave pública, feita para ficar no site:
     quem visita só lê times, atletas e jogos; cadastrar e alterar exige login da equipe FF. */
  SUPABASE_URL:'https://xsbmuzaensxrkeqwzfkp.supabase.co',SUPABASE_KEY:'sb_publishable_Z-z0RPst-ZbhE7oZbUSxJQ_i0IcS8Bo',
  /* Lançamento em ondas: 1 = League · 2 = + Campeonato (tabela, atletas, jogos)
     · 3 = + Ao vivo · 4 = + área do atleta. Com ?demo no endereço, o site aparece completo. */
  ONDA:1,
  /* false esconde o botão Entrar do menu e do rodapé (true mostra de novo).
     O endereço #entrar continua abrindo para quem tiver o link. */
  BOTOES_PRE_E_ENTRAR:false,
  /* true = FF Pro League do zero: nenhum jogo disputado, tabela, estatísticas e números dos atletas zerados
     (o 1º jogo fica ao vivo, 0x0). false volta a mostrar os jogos de exemplo com placares. */
  TEMPORADA_ZERADA:true};
