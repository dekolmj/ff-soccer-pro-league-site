/* Regulamento oficial da Copa FF Libertadores 2026 (aba Regulamento da página #libertadores; 03/11/2026, texto enviado pelo Deko).
   Em cima, cartões com os destaques; no meio, as etapas da disputa (libFormatoHTML, no app.js); embaixo, o texto completo
   em capítulos que abrem e fecham. Para mudar o texto, edite REG_CAP abaixo (HTML simples: p, h4, ul, ol). */

var REG_DESTAQUES=[
  ['🛡️','10 equipes','2 grupos de 5 times, com 10 a 12 jogadores por equipe.'],
  ['⚽','4 jogos garantidos','Cada equipe faz 4 partidas na fase de grupos, de 16/11 a 08/12.'],
  ['⏱️','6 contra 6 (preferencial)','2 tempos de 25 minutos. Em quadra menor, 5x5 ou 4x4.'],
  ['🙋','Todo mundo joga','Cada atleta relacionado atua no mínimo 3 minutos por tempo (6 por jogo).'],
  ['🟥','Vermelho suspende','Suspensão automática no jogo seguinte, sem perdão por mudança de fase.'],
  ['⏰','15 minutos de tolerância','Atraso maior que 15 minutos pode resultar em W.O.'],
  ['🏆','Final Ouro e Final Prata','Vencedores e perdedores das semifinais. Empate na final: pênaltis.']
];

var REG_CAP=[
['Formato geral',
 '<p>A Copa FF Libertadores 2026 tem como objetivo promover integração, competitividade, espírito esportivo e experiências memoráveis entre os alunos da FF Soccer Academy.</p>'+
 '<ul><li>As equipes terão, em média, entre 10 e 12 jogadores.</li><li>A competição contará com 10 equipes divididas em 2 grupos de 5 times.</li><li>Cada equipe disputará 4 partidas na fase classificatória.</li><li>Os jogos acontecerão preferencialmente no período noturno, conforme calendário divulgado pela organização.</li></ul>'+
 '<div class="reggr"><div><h4>Grupo A</h4><ul><li>LDU — Mooca</li><li>Atlético Nacional — Mooca</li><li>Boca Juniors — Guarulhos</li><li>Cerro Porteño — Barra Funda</li><li>Peñarol — Guarulhos</li></ul></div>'+
 '<div><h4>Grupo B</h4><ul><li>Estudiantes — Vila-Lobos</li><li>Libertad — Vila Mariana</li><li>Vélez Sarsfield — Morumbi</li><li>River Plate — Campo Belo</li><li>Racing Club — Campo Belo</li></ul></div></div>'],
['Calendário da competição',
 '<p>A fase de grupos será realizada entre 16 de novembro e 8 de dezembro de 2026, conforme as tabelas oficiais divulgadas pela organização.</p>'+
 '<p>As datas das semifinais e finais serão divulgadas posteriormente.</p>'+
 '<p>Qualquer alteração de data, horário ou local será comunicada previamente aos capitães pelos canais oficiais da competição.</p>'+
 '<h4>Diferencial da competição</h4><p>A Copa FF Libertadores 2026 garante 4 jogos para cada equipe participante durante a fase de grupos, proporcionando maior tempo de participação, integração entre unidades e uma experiência competitiva completa.</p>'],
['Mandos de campo e locais',
 '<p>Cada equipe deverá disputar no mínimo 2 partidas como mandante durante a fase de grupos.</p>'+
 '<p>Por questões de logística, disponibilidade das quadras e organização do calendário, algumas equipes poderão realizar até 3 partidas como mandantes.</p>'+
 '<p>A organização buscará equilibrar os deslocamentos e proporcionar condições adequadas para todas as equipes.</p>'+
 '<p>Por questões logísticas, algumas equipes poderão realizar partidas como mandantes em unidades diferentes de sua unidade de origem.</p>'+
 '<h4>Regras específicas</h4>'+
 '<p><b>Mooca — LDU e Atlético Nacional.</b> Todos os jogos oficiais das equipes da Mooca, quando forem mandantes, serão realizados na Rua Clemente Bonifácio, 263, em uma das três quadras disponíveis. A quadra da Padre Raposo não receberá partidas oficiais da competição.</p>'+
 '<p><b>Guarulhos — Boca Juniors e Peñarol.</b> As equipes Boca Juniors e Peñarol representam a unidade Guarulhos e poderão realizar seus mandos de campo nas unidades Guarulhos ou Tucuruvi. Essa decisão considera a estrutura coberta da quadra do Tucuruvi, a proximidade entre as unidades e as necessidades operacionais da competição.</p>'+
 '<p><b>Vila Mariana — Libertad.</b> A equipe Libertad terá seus jogos como mandante distribuídos entre Campo Belo e Vila-Lobos, uma vez que a quadra de Vila Mariana não apresenta as condições de segurança ideais para partidas de competição.</p>'+
 '<h4>Validade dos mandos alternativos</h4>'+
 '<p>Para fins de regulamento, as partidas realizadas em locais alternativos serão consideradas jogos em casa da equipe originalmente mandante, independentemente da unidade utilizada.</p>'+
 '<p>Essas adaptações não representam qualquer vantagem esportiva e têm como finalidade garantir segurança, equilíbrio competitivo e qualidade operacional.</p>'],
['Jogos, arbitragem e regras',
 '<p>Todas as partidas contarão com arbitragem oficial. Sempre que possível, os jogos serão conduzidos por dois árbitros.</p>'+
 '<h4>Participação obrigatória</h4><ul>'+
 '<li>Todos os atletas presentes e relacionados deverão atuar obrigatoriamente por, no mínimo, 3 minutos em cada tempo de jogo, totalizando pelo menos 6 minutos por partida.</li>'+
 '<li>A obrigatoriedade será excepcionalmente dispensada caso o atleta, em algum momento da partida, não apresente condições físicas adequadas para participar, seja por lesão, mal-estar, limitação física ou outra situação que comprometa sua segurança.</li>'+
 '<li>Os capitães serão responsáveis por auxiliar no cumprimento dessa determinação.</li>'+
 '<li>Caso um atleta presente e em condições físicas de jogo não participe pelo tempo mínimo estabelecido, a organização poderá aplicar sanções esportivas, incluindo a perda dos pontos da partida.</li></ul>'+
 '<h4>Regras de jogo</h4><ul><li>Formato preferencial: 6 contra 6.</li><li>Em quadras com espaço reduzido, poderão ser utilizados os formatos 5x5 ou 4x4.</li><li>Tempo de jogo: 2 períodos de 25 minutos.</li><li>Cada equipe terá direito a 1 pedido de tempo técnico por partida.</li><li>Após a quinta falta coletiva, será aplicado o shootout, conforme orientação da arbitragem.</li></ul>'+
 '<h4>Uniformes e utilização de coletes</h4>'+
 '<p>Caso duas equipes se apresentem para uma partida com uniformes de cores semelhantes, que possam dificultar a identificação dos atletas, será obrigatória a utilização de coletes por uma das equipes.</p>'+
 '<p>Critérios para definição:</p><ul><li><b>Fase de grupos:</b> a equipe que utilizará os coletes será definida por sorteio de cara ou coroa, realizado antes do início da partida.</li><li><b>Semifinais e finais:</b> a equipe com a melhor campanha na fase de grupos terá o direito de manter seu uniforme original. A equipe adversária deverá utilizar os coletes.</li></ul>'+
 '<p>A utilização dos coletes será obrigatória sempre que determinada pela organização ou arbitragem, visando garantir a identificação dos atletas e o bom andamento da partida.</p>'+
 '<h4>Cartões e suspensões</h4><ul>'+
 '<li><b>Cartão amarelo:</b> não gera suspensão automática.</li>'+
 '<li><b>Cartão vermelho:</b> suspensão automática da partida seguinte.</li>'+
 '<li><b>Cumprimento obrigatório da suspensão:</b> todo atleta expulso deverá cumprir integralmente sua punição, independentemente da fase da competição.</li>'+
 '<li>Não haverá, em hipótese alguma, anulação, zeragem ou perdão de suspensão por mudança de fase, seja da fase de grupos para as semifinais ou das semifinais para as finais.</li>'+
 '<li>Caso o atleta seja expulso na semifinal, estará automaticamente suspenso da Final Ouro ou da Final Prata, conforme a classificação de sua equipe.</li>'+
 '<li>Em caso de expulsão, a equipe permanecerá com um atleta a menos durante 2 minutos, podendo posteriormente recompor o número de jogadores.</li></ul>'+
 '<p>A suspensão por expulsão é obrigatória e intransferível, não podendo ser anulada por classificação, mudança de fase ou importância da partida.</p>'+
 '<p>A organização poderá aplicar punições adicionais em situações de indisciplina grave.</p>'],
['Responsabilidade dos capitães',
 '<p>O capitão será o representante oficial da equipe perante a organização.</p><p>São suas responsabilidades:</p>'+
 '<ul><li>Receber e transmitir todas as informações oficiais aos atletas.</li><li>Conferir datas, horários, locais e alterações da tabela.</li><li>Organizar os atletas e garantir a pontualidade.</li><li>Auxiliar no cumprimento das regras de participação.</li><li>Representar a equipe nos alinhamentos com a organização.</li><li>Garantir que todos tenham conhecimento do regulamento.</li></ul>'+
 '<p>O desconhecimento de informações previamente comunicadas ao capitão não será aceito como justificativa para descumprimento das regras.</p>'],
['Classificação e fases finais',
 '<p>Cada equipe realizará quatro partidas na fase classificatória.</p><p>Os dois primeiros colocados de cada grupo avançarão às semifinais.</p>'+
 '<h4>Critérios de classificação e desempate</h4>'+
 '<p>A classificação será definida pela pontuação obtida pelas equipes. Em caso de igualdade, serão aplicados os seguintes critérios, rigorosamente nesta ordem:</p>'+
 '<ol><li>Maior pontuação.</li><li>Maior número de vitórias.</li><li>Melhor saldo de gols.</li><li>Maior número de gols marcados.</li><li>Confronto direto, quando aplicável.</li><li>Sorteio realizado pela organização.</li></ol>'+
 '<h4>Semifinais</h4><ul><li><b>Semifinal 1:</b> 1º colocado do Grupo A × 2º colocado do Grupo B.</li><li><b>Semifinal 2:</b> 1º colocado do Grupo B × 2º colocado do Grupo A.</li></ul>'+
 '<p>Locais previstos para as semifinais: as semifinais deverão acontecer, preferencialmente, em uma das seguintes unidades da FF Soccer Academy:</p>'+
 '<ul><li>📍 Vila-Lobos</li><li>📍 Barra Funda</li><li>📍 Tucuruvi</li></ul>'+
 '<p>A escolha definitiva dos locais será realizada pela organização, considerando a disponibilidade das quadras, as condições estruturais, a logística e a segurança dos participantes.</p>'+
 '<p>As datas, os horários e os locais oficiais serão comunicados previamente aos capitães das equipes classificadas.</p>'+
 '<h4>Finais</h4><ul><li><b>Final Ouro:</b> vencedores das semifinais.</li><li><b>Final Prata:</b> perdedores das semifinais.</li></ul>'+
 '<p>Em caso de empate nas finais, a decisão ocorrerá através de cobranças de pênaltis, com 3 cobranças alternadas por equipe.</p>'+
 '<p>Persistindo o empate, serão realizadas cobranças alternadas até que haja um vencedor.</p>'+
 '<p>Os horários e locais das finais serão definidos pela organização.</p>'],
['Aulas durante a competição',
 '<p>As aulas regulares da FF Soccer Academy continuarão acontecendo durante novembro e dezembro de 2026, respeitando as adaptações necessárias para realização das partidas.</p>'+
 '<p>Algumas unidades poderão ter aulas noturnas suspensas ou horários ajustados nos dias de competição.</p>'+
 '<p>As sugestões de reposição serão informadas conforme a programação de cada unidade.</p>'+
 '<p>As reposições estarão sujeitas à disponibilidade de vagas e ao alinhamento com a equipe administrativa.</p>'+
 '<p><b>Contato administrativo:</b> <a href="tel:+5511994787068">(11) 99478-7068</a></p>'],
['Conduta e disciplina',
 '<p>A Copa FF Libertadores 2026 tem como princípio o respeito entre atletas, árbitros, professores e organizadores.</p><p>É expressamente proibido:</p>'+
 '<ul><li>Desrespeitar árbitros, adversários, organizadores ou participantes.</li><li>Praticar agressões físicas ou verbais.</li><li>Utilizar atletas não inscritos ou não autorizados.</li><li>Adotar comportamentos antidesportivos que comprometam o andamento da competição.</li></ul>'+
 '<p>Agressões físicas ou verbais poderão resultar em suspensão ou eliminação da competição, além de outras medidas disciplinares cabíveis.</p>'+
 '<h4>Atletas não inscritos</h4><p>A utilização de atletas não inscritos é proibida.</p>'+
 '<p>Caso seja constatada alguma irregularidade, a equipe poderá sofrer sanções esportivas, incluindo eliminação da competição.</p>'+
 '<p>Reclamações realizadas de forma ofensiva ou desrespeitosa não serão consideradas pela organização.</p>'],
['Atrasos, W.O. e situações extraordinárias',
 '<p>Atrasos superiores a 15 minutos poderão resultar em W.O.</p>'+
 '<p>A equipe adversária poderá concordar com a realização da partida em tempo reduzido, mediante autorização da organização.</p>'+
 '<h4>Situações extraordinárias</h4>'+
 '<p>Em casos de força maior, incluindo atrasos da arbitragem, trânsito, problemas operacionais, condições climáticas ou fatores externos, prevalecerão o bom senso e a razoabilidade.</p>'+
 '<p>Nessas situações, a partida poderá:</p><ul><li>Iniciar com apenas um árbitro.</li><li>Ter seu tempo reduzido.</li><li>Sofrer alterações de horário ou local.</li><li>Ser remarcada pela organização.</li></ul>'+
 '<p>As decisões buscarão preservar a segurança dos participantes e a integridade esportiva da competição.</p>'],
['Premiações e experiência do evento',
 '<p>A Copa FF Libertadores 2026 busca proporcionar uma experiência especial aos participantes, valorizando o desempenho coletivo e individual.</p>'+
 '<div class="reggr"><div><h4>Premiações coletivas</h4><ul><li>🏆 Campeão da Final Ouro.</li><li>🥈 Vice-campeão da Final Ouro.</li><li>🏆 Campeão da Final Prata.</li></ul></div>'+
 '<div><h4>Premiações individuais</h4><ul><li>⚽ Artilheiro da competição.</li><li>⭐ Craque da Copa.</li><li>🌟 Revelação da Copa.</li><li>🏅 Destaque da competição.</li><li>🏆 Seleção da Copa FF Libertadores.</li></ul></div></div>'+
 '<p>A organização poderá incluir outras premiações especiais ao longo da competição.</p>'+
 '<h4>Cobertura fotográfica</h4>'+
 '<p>A organização trabalhará para oferecer cobertura fotográfica dos jogos.</p>'+
 '<p>Sempre que houver fotógrafo oficial presente em uma partida, todas as fotografias disponibilizadas aos atletas serão gratuitas, sem qualquer custo adicional.</p>'+
 '<p>As imagens poderão ser disponibilizadas através dos canais oficiais da FF Soccer Academy ou de plataforma especializada indicada pela organização.</p>'+
 '<p>A presença de fotógrafo em todas as partidas não é garantida e dependerá da programação e disponibilidade da equipe de cobertura.</p>'+
 '<p>Outras ativações e experiências poderão ser anunciadas ao longo da competição.</p>'],
['Disposições finais',
 '<p>A participação na Copa FF Libertadores 2026 implica na aceitação integral deste regulamento.</p>'+
 '<p>A organização poderá realizar ajustes de tabela, horários, datas, locais e ordem das partidas sempre que necessário para garantir o bom andamento da competição.</p>'+
 '<p>Toda alteração será comunicada previamente aos capitães pelos canais oficiais.</p>'+
 '<p>As decisões da organização terão como princípios:</p><ul><li>Segurança dos participantes.</li><li>Equilíbrio competitivo.</li><li>Respeito às equipes.</li><li>Viabilidade operacional e logística.</li><li>Qualidade da experiência dos atletas.</li></ul>'+
 '<p>O regulamento poderá receber atualizações e complementações caso surjam situações não previstas inicialmente.</p>'+
 '<p>Eventuais alterações passarão a ter validade a partir da divulgação oficial.</p>'+
 '<p>Os casos omissos serão analisados e decididos pela organização, visando sempre a justiça esportiva, a boa convivência e o sucesso do evento.</p>'+
 '<p>Nosso objetivo é proporcionar uma competição organizada, competitiva, divertida e respeitosa para todos os participantes.</p>']
];

function libRegulamentoHTML(){
  return '<div class="regdest">'+REG_DESTAQUES.map(function(d){return '<div class="card"><span class="regic" aria-hidden="true">'+d[0]+'</span><b>'+d[1]+'</b><p>'+d[2]+'</p></div>';}).join('')+'</div>'+
    '<h3 class="regtit">Como funciona a disputa</h3>'+libFormatoHTML()+
    '<div class="reghead"><div><div class="eyebrow">FF Soccer Academy · Edição Libertadores</div><h3 class="regtit" style="margin:6px 0 0">🏆 Regulamento oficial · Copa FF Libertadores 2026</h3></div>'+
    '<div class="regbts"><a class="btn primary sm" href="assets/regulamento-copa-ff-libertadores-2026.pdf" download="Regulamento Copa FF Libertadores 2026.pdf"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3v10M5.5 8.5L10 13l4.5-4.5M4 17h12"/></svg>Baixar regulamento (PDF)</a>'+
    '<button type="button" class="btn sm" id="regTudo">Abrir tudo</button></div></div>'+
    '<div class="regcaps">'+REG_CAP.map(function(c,i){return '<details class="card regcap"><summary><span class="regn">'+(i+1)+'</span>'+c[0]+'</summary><div class="regtxt">'+c[1]+'</div></details>';}).join('')+'</div>'+
    '<p class="regfim"><b>🏆 Copa FF Libertadores 2026</b><br>FF Soccer Academy · Mais do que futebol. Uma experiência de competição.</p>';
}
// botão "Abrir tudo / Fechar tudo" do regulamento (o conteúdo é desenhado pelo route(); o clique é pego aqui)
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#regTudo');if(!b)return;
  var ds=document.querySelectorAll('.regcap'),abrir=b.textContent==='Abrir tudo';ds.forEach(function(d){d.open=abrir;});b.textContent=abrir?'Fechar tudo':'Abrir tudo';});
