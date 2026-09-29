/* ====== CONFIGURAÇÃO ======
   FORM_ENDPOINT: cole aqui a URL do App da Web do Google Apps Script (veja o README).
   Enquanto estiver vazio, o formulário avisa que as inscrições abrem em breve. */
var CONFIG={FORM_ENDPOINT:'https://script.google.com/macros/s/AKfycbzSpmJKnhkJnojwvU-08sCw-bZXTyrxtepItNKc3qRcrVYsbAGMqHEOPUz77Pp5CTU/exec',VERSAO_TERMOS:'2026-09',
  /* Banco de dados (Supabase). A chave abaixo é a chave pública de leitura, feita para ficar no site:
     quem visita só consegue ler times, atletas e jogos; gravar exige login da equipe FF. */
  /* Lançamento em ondas: 1 = League e Pré-inscrição · 2 = + Campeonato (tabela, times, atletas, jogos, início)
     · 3 = + Ao vivo · 4 = + Hall da fama e área do atleta. Com ?demo no endereço, o site aparece completo. */
  ONDA:1,
  /* Unidades que aparecem no campo "Unidade FF" da pré-inscrição, nesta ordem. */
  UNIDADES:['Morumbi Town','Guarulhos','Campo Belo','Mooca','Barra Funda','Tucuruvi','Villa Lobos','Vila Mariana'],
  SUPABASE_URL:'https://xsbmuzaensxrkeqwzfkp.supabase.co',SUPABASE_KEY:'sb_publishable_Z-z0RPst-ZbhE7oZbUSxJQ_i0IcS8Bo'};
