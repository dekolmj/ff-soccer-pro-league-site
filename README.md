# Site FF Soccer Pro League

Site oficial da FF Soccer Pro League em fase de **pré-lançamento**.

- Todas as páginas (campeonato, TV FF, área do atleta) usam **dados de exemplo**.
- O **painel da equipe FF** (endereço `#entrar`) é real: cadastro de times e atletas no banco de dados (Supabase).

O site é feito só de arquivos simples (HTML, CSS e JavaScript) e não precisa de servidor nem de mensalidade. Ele é publicado de graça pelo **GitHub Pages**.

## O que tem neste repositório

| Arquivo | Para que serve |
|---|---|
| `index.html` | A estrutura da página: cabeçalho, menu, rodapé e aviso de pré-lançamento |
| `css/site.css` | Todo o visual: cores, fontes, tamanhos |
| `js/config.js` | Endereço do banco, onda de lançamento e outras chaves de configuração |
| `js/dados-exemplo.js` | Times, atletas e jogos de exemplo |
| `js/tv-canvas.js` | Animação dos vídeos da TV FF |
| `js/app.js` | As páginas, o menu e a área do atleta |
| `js/painel.js` e `js/cadastros.js` | O login (Entrar) e o painel da equipe: times, atletas e histórico |
| `assets/` | Escudo, letreiro, ícone da aba do navegador e imagem de pré-visualização para WhatsApp |
| `docs/arquitetura.md` | Explicação técnica de como o site é organizado |
| `.nojekyll` | Arquivo técnico do GitHub Pages. Não apague |

---

## 1. Publicar o site no GitHub Pages

1. Entre no repositório no GitHub.
2. Clique em **Add file → Upload files** e arraste todos os arquivos e pastas deste projeto. Clique em **Commit changes**.
3. Vá em **Settings → Pages**.
4. Em **Build and deployment**, escolha **Source: Deploy from a branch**, depois **Branch: main** e pasta **/(root)**. Clique em **Save**.
5. Espere 1 ou 2 minutos e atualize a página. O endereço do site aparece no topo, no formato `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Para usar um domínio próprio, como `ffsoccerproleague.com.br`: em **Settings → Pages → Custom domain**, digite o domínio e siga as instruções de DNS que o GitHub mostrar.

---

## 2. Pré-inscrição

Apagada do site e do banco em 23/10/2026: as inscrições foram feitas por outro caminho. Os atletas são cadastrados pela equipe no painel (aba **Atletas**).

---

## 3. Cuidados com os dados (LGPD)

- **Acesso aos dados dos atletas:** só quem é da equipe FF (convidado e com login) vê e-mail, celular e nascimento no painel.
- **Pedido de exclusão:** se um atleta pedir, um administrador apaga o cadastro dele na aba Atletas.

---

## 4. Antes do lançamento oficial

- [ ] Trocar os dados de exemplo pelos reais: times, atletas e jogos.
- [ ] Liberar o site no Google. Apague a linha `<meta name="robots" content="noindex">`.
- [ ] Revisar os textos da página **League** com o regulamento oficial.
