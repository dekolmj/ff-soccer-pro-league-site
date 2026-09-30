/* ====== CONFIGURAÇÃO ====== */
var CONFIG={VERSAO_TERMOS:'2026-09',
  /* Banco de dados (Supabase). A chave abaixo é a chave pública, feita para ficar no site:
     quem visita só lê times, atletas e jogos e envia a pré-inscrição (pela função enviar_pre_inscricao);
     ver e alterar inscrições exige login da equipe FF. Sem estas duas linhas, o formulário avisa que as inscrições abrem em breve. */
  SUPABASE_URL:'https://xsbmuzaensxrkeqwzfkp.supabase.co',SUPABASE_KEY:'sb_publishable_Z-z0RPst-ZbhE7oZbUSxJQ_i0IcS8Bo',
  /* Lançamento em ondas: 1 = League e Pré-inscrição · 2 = + Campeonato (tabela, times, atletas, jogos, início)
     · 3 = + Ao vivo · 4 = + Hall da fama e área do atleta. Com ?demo no endereço, o site aparece completo. */
  ONDA:1,
  /* Unidades que aparecem no campo "Unidade FF" da pré-inscrição, em ordem alfabética. */
  UNIDADES:['Barra Funda','Campo Belo','Guarulhos','Mooca','Morumbi Town','Tucuruvi','Vila Mariana','Villa Lobos']};
