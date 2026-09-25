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
| `js/config.js` | `CONFIG.FORM_ENDPOINT` (URL do Apps Script) e `CONFIG.VERSAO_TERMOS`. |
| `js/dados-exemplo.js` | Gerador com semente fixa `rng(2027)`: `TEAMS`/`TM`, `PLAYERS`/`PM`, `GAMES`, `LIVE`, `ST` (tabela), `SCORERS`, `MVPS`, `craqueOf()`. |
| `js/tv-canvas.js` | Animação da TV FF. Isolada numa função; expõe só `Scene(canvas)` e `initCanvases()`. |
| `js/app.js` | Helpers de HTML, páginas (`P[...]`), área logada de demonstração, pop-up de vídeo, roteador (`route`/`bind`), ticker e pré-inscrição. Termina chamando `route()`. |
| `assets/escudo.webp`, `assets/letreiro.webp` | Marca usada no cabeçalho, rodapé e cartões (antes ficavam embutidas no HTML). |
| `apps-script/Code.gs` | Recebe o POST da pré-inscrição, valida e grava na planilha. |

### Ordem dos scripts

Os scripts são `<script>` comuns, no fim do `<body>`, e dividem variáveis globais:

1. `config.js` — sem dependências.
2. `dados-exemplo.js` — roda na hora e monta os dados.
3. `tv-canvas.js` — só define funções; usa os dados quando uma animação começa.
4. `app.js` — usa tudo acima e desenha a página atual.

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
2. **Dados reais.** Substituir `js/dados-exemplo.js` por leitura do banco, mantendo os mesmos formatos (`TEAMS`, `PLAYERS`, `GAMES`…) para as páginas não precisarem mudar.
3. **Login de verdade.** Trocar o login de demonstração por Supabase Auth.
4. **Painel da FF.** Aprovar inscrições, montar escalação e minutagem, lançar súmula, subir fotos e publicar avisos.
5. **App nas lojas** (Expo/React Native), usando o mesmo banco.
