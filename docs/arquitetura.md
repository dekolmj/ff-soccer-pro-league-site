# Arquitetura do site FF Soccer Pro League

Como o site é organizado hoje e como ele vai crescer. Escrito para quem vai mexer no código; o passo a passo para o Lucas fica no `README.md`.

## Hoje: site estático no GitHub Pages

```
Navegador ──► GitHub Pages (arquivos da branch main)
    │
    └── pré-inscrição ──► Google Apps Script (/exec) ──► Planilha do Google da FF
```

- Não há servidor próprio nem etapa de build. O GitHub Pages entrega os arquivos como estão.
- Tudo o que aparece no site, menos a pré-inscrição, é **dado de exemplo** gerado no navegador.

### Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Estrutura fixa: tarja de pré-lançamento, ticker, cabeçalho, menu, gaveta do celular, toast, pop-up de vídeo, `<main id="app">` e rodapé. Carrega o CSS e os scripts. |
| `css/site.css` | Todo o visual. Tema escuro único, cores e fontes descritas no `CLAUDE.md`. |
| `js/config.js` | `CONFIG.FORM_ENDPOINT` (URL do Apps Script), `CONFIG.VERSAO_TERMOS`, `CONFIG.SUPABASE_URL` e `CONFIG.SUPABASE_KEY` (chave pública de leitura). |
| `js/dados-exemplo.js` | Gerador com semente fixa `rng(2027)`: `TEAMS`/`TM`, `PLAYERS`/`PM`, `GAMES`, `LIVE`, `ST` (tabela), `SCORERS`, `MVPS`, `craqueOf()`. |
| `js/banco.js` | `carregarBanco(pronto)`: lê times, atletas, elencos, jogos, escalações, súmula e VAR do Supabase e remonta as mesmas variáveis de `dados-exemplo.js`. Se o banco falhar, demorar mais de 4 s ou não tiver jogo ao vivo, o site segue com os dados gerados. `BANCO_OK` diz qual valeu. |
| `js/painel.js` | `P.painel` (`#painel`): baixa o `supabase-js` por CDN, faz login com e-mail e senha, confere se a pessoa está em `equipe_ff` e lista as pré-inscrições, com aprovação e atualização em tempo real (canal `postgres_changes` em `pre_inscricoes`). |
| `js/tv-canvas.js` | Animação da TV FF. Isolada numa função; expõe só `Scene(canvas)` e `initCanvases()`. |
| `js/app.js` | Helpers de HTML, páginas (`P[...]`), área logada de demonstração, pop-up de vídeo, roteador (`route`/`bind`), ticker e pré-inscrição. Termina chamando `carregarBanco(...)`, que desenha a primeira página. |
| `assets/escudo.webp`, `assets/letreiro.webp` | Marca usada no cabeçalho, rodapé e cartões (antes ficavam embutidas no HTML). |
| `apps-script/Code.gs` | Recebe o POST da pré-inscrição, valida e grava na planilha. |

### Ordem dos scripts

Os scripts são `<script>` comuns, no fim do `<body>`, e dividem variáveis globais:

1. `config.js` — sem dependências.
2. `dados-exemplo.js` — roda na hora e monta os dados.
3. `banco.js` — só define funções; `app.js` chama `carregarBanco()` no fim.
4. `tv-canvas.js` — só define funções; usa os dados quando uma animação começa.
5. `app.js` — usa tudo acima e desenha a página atual.
6. `painel.js` — acrescenta a página `P.painel`; precisa vir depois do `app.js`.

Mudar essa ordem quebra o site.

### Como uma página aparece

1. O endereço muda (ex.: `#campeonato-times`).
2. `route()` descobre a página e o argumento, preenche `#app` com `P[pagina](arg)`.
3. `bind(pagina)` liga os cliques daquela página e `initCanvases()` começa as animações.

### Decisões

- **JavaScript puro, sem framework nem build:** o Lucas publica com um push, e o site continua funcionando só com arquivos.
- **Envio da pré-inscrição sem `Content-Type`:** o navegador manda como `text/plain`, e o Apps Script aceita sem a verificação extra (preflight) que ele não suporta.
- **Imagens em arquivo, não embutidas:** o `index.html` caiu de ~387 KB para ~5 KB, e o navegador guarda escudo e letreiro em cache entre visitas.
- **localStorage só para conforto** (`ffl_user`, `ffl_pl`), sempre em `try/catch`.

## Depois: Supabase

```
Navegador ──► GitHub Pages (site)
    │
    ├── leitura pública ──► Supabase (Postgres): times, atletas, jogos, súmulas
    ├── login do atleta ──► Supabase Auth
    ├── fotos ──► Supabase Storage
    └── pré-inscrição ──► tabela inscricoes (RLS: só inserir)
```

Pastas novas neste repositório:

```
supabase/
├─ migrations/     criação das tabelas (inscrições, times, atletas, jogos…)
└─ policies.sql    quem pode ler e gravar cada coisa (RLS)
```

Etapas, uma de cada vez:

1. **Pré-inscrição no banco.** Criar a tabela `inscricoes` com política que só permite inserir; trocar o destino em `js/config.js`; importar o CSV da planilha. A chave pública (anon) do Supabase pode ficar no site; a chave `service_role` **nunca** entra no repositório.
2. **Dados reais.** ~~Ler do banco mantendo os mesmos formatos (`TEAMS`, `PLAYERS`, `GAMES`…)~~ (feito em `js/banco.js`). Os dados de exemplo estão no banco com `exemplo = true` (gerados por `supabase/exemplo/gerar.js`); no lançamento, apague-os com os comandos do topo de `supabase/migrations/20260925000007_dados_exemplo.sql` e tire o `dados-exemplo.js`.
3. **Login de verdade.** Trocar o login de demonstração por Supabase Auth.
4. **Painel da FF.** Aprovar inscrições, montar escalação e minutagem, lançar súmula, subir fotos e publicar avisos.
5. **App nas lojas** (Expo/React Native), usando o mesmo banco.
