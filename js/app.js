/* Páginas, menu, área logada (demonstração), pop-up de vídeo, roteador e pré-inscrição. */
var LOGO='assets/escudo.webp';
/* ================= ONDAS DE LANÇAMENTO =================
   CONFIG.ONDA diz o que já está no ar; o resto some do menu e das rotas. ?demo mostra tudo (apresentações). */
var DEMO=/[?&]demo(=|&|$)/.test(location.search),ONDA=DEMO?99:(CONFIG.ONDA||99);
function ondaDaPagina(pg){return ({libertadores:2,'a-league':1,'pre-inscricao':1,entrar:1,painel:1,'ao-vivo':3})[pg]||(/^minha-area/.test(pg)?4:2);}
// CONFIG.BOTOES_PRE_E_ENTRAR = false esconde os botões Pré-inscrição e Entrar (as rotas continuam abrindo pelo endereço).
function semBotoes(){return !DEMO&&CONFIG.BOTOES_PRE_E_ENTRAR===false;}
// CONFIG.PRE_INSCRICAO = false esconde tudo da pré-inscrição (botões, links, página, pergunta frequente), inclusive com ?demo. Nada é apagado.
function preOn(){return CONFIG.PRE_INSCRICAO!==false;}
function aplicarOnda(){
  document.querySelectorAll('[data-onda]').forEach(function(el){if(+el.dataset.onda>ONDA)el.hidden=true;});
  if(!DEMO)document.querySelectorAll('[data-demo]').forEach(function(el){el.hidden=true;});
  if(semBotoes()||!preOn())document.querySelectorAll('[data-pre]').forEach(function(el){el.hidden=true;});
}
/* ================= HELPERS ================= */
function badge(tid,cls){var t=TM[tid]||{n:'?',c:'#555'};
  if(t.e)return '<span class="badge esc '+(cls||'')+'"><img src="'+esc(t.e)+'" alt="" loading="lazy"></span>';
  return '<span class="badge '+(cls||'')+'" style="background:'+esc(t.c)+'">'+esc(t.n[0])+'</span>';}
function tn(tid){return TM[tid]?esc(TM[tid].n):'';}
function posn(p){return POSN[p.pos]||'';}
function avBg(id){return FOTOS[id]?'background:url('+FOTOS[id]+') center 18%/cover;':'';}function esc(s){return String(s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
// quando é o jogo: "Qua 04/11 · 19h30" (ou "Data a definir")
function quando(g){return g.date?fmtD(g.date)+(g.time?' · '+g.time:''):'Data a definir';}
function jogou(g){return g.st==='encerrado'||g.st==='ao vivo';}
function statusChip(g){if(g.st==='ao vivo')return '<span class="live">Ao vivo'+(g.min!=null?' · '+g.min+"'":'')+'</span>';if(g.st==='encerrado')return '<span class="lbl">Encerrado</span>';
  if(g.st==='adiado')return '<span class="lbl">Adiado</span>';if(g.st==='cancelado')return '<span class="lbl">Cancelado</span>';return '<span class="lbl">'+quando(g)+'</span>';}
function gameCard(g){
  var done=jogou(g),hl=done&&g.gh<g.ga,al=done&&g.ga<g.gh;
  return '<a class="game'+(g.st==='ao vivo'?' is-live':'')+'" href="#'+g.id+'"><div class="between">'+statusChip(g)+'<span class="lbl">'+esc(g.field)+'</span></div>'+
  '<div class="line'+(hl?' lose':'')+'">'+badge(g.h,'sm')+tn(g.h)+'<b>'+(done?g.gh:'–')+'</b></div>'+
  '<div class="line'+(al?' lose':'')+'">'+badge(g.a,'sm')+tn(g.a)+'<b>'+(done?g.ga:'–')+'</b></div>'+
  '<div class="foot"><span>Rodada '+g.r+(g.grupo?' · Grupo '+esc(g.grupo):'')+'</span><span>'+(g.st==='ao vivo'?'Acompanhar ▸':g.st==='encerrado'?'Ver lances ▸':'')+'</span></div></a>';
}
function tableHTML(rows,full){
  var h='<div class="tblw"><table class="tbl"><thead><tr><th class="l">#</th><th class="l">Time</th><th>Pts</th><th>J</th><th>V</th>'+(full?'<th>E</th><th>D</th><th>GP</th><th>GC</th>':'')+'<th>SG</th>'+(full?'<th class="l">Últimos</th>':'')+'</tr></thead><tbody>';
  rows.forEach(function(x,i){h+='<tr><td class="pos l'+(i<4?' q':'')+'">'+(i+1)+'</td><td class="l"><a class="row" style="gap:8px" href="#time-'+x.t.id+'">'+badge(x.t.id,'sm')+x.t.n+'</a></td><td class="pts">'+x.pts+'</td><td>'+x.j+'</td><td>'+x.v+'</td>'+(full?'<td>'+x.e+'</td><td>'+x.d+'</td><td>'+x.gp+'</td><td>'+x.gc+'</td>':'')+'<td>'+(x.sg>0?'+':'')+x.sg+'</td>'+(full?'<td class="l"><span class="form">'+x.f.slice(-5).map(function(f){return '<i class="'+f+'">'+f+'</i>';}).join('')+'</span></td>':'')+'</tr>';});
  return h+'</tbody></table></div>';
}
function scorersHTML(list,n,key){key=key||'g';if(!list.length)return '<p class="muted" style="margin:10px 0 0">Nenhum registro ainda.</p>';return '<div class="list">'+list.slice(0,n).map(function(p,i){return '<a class="it" href="#atleta-'+p.id+'"><span class="p">'+(i+1)+'</span><span class="row" style="gap:10px">'+badge(p.team,'sm')+'<span>'+esc(p.n)+'<small>'+tn(p.team)+(posn(p)?' · '+posn(p):'')+'</small></span></span><b class="v">'+p[key]+'</b></a>';}).join('')+'</div>';}
function playerBox(opts){
  return '<div class="player"'+(opts.id?' id="'+opts.id+'"':'')+'><canvas class="bc" data-seed="'+(opts.seed||11)+'"'+(opts.st?' data-static="1"':'')+'></canvas>'+(opts.bug||'')+(opts.live?'<span class="live">Ao vivo</span>':'')+(opts.tag?'<span class="tag">'+opts.tag+'</span>':'')+(opts.bar?'<div class="ytbar"><div class="prog"></div><div class="ctl"><span>● Ao vivo</span><span>'+opts.bar+'</span><span class="sp">HD · ⛶</span></div></div>':'')+(opts.dur?'<span class="dur">'+opts.dur+'</span>':'')+(opts.play?'<span class="play"><i><svg width="16" height="16" viewBox="0 0 16 16"><path d="M5 3l8 5-8 5z" fill="#fff"/></svg></i></span>':'')+'</div>';
}
function liveBug(){return '<div class="bug"><span>'+tn(LIVE.h).slice(0,3).toUpperCase()+' '+LIVE.gh+'</span><span>'+LIVE.ga+' '+tn(LIVE.a).slice(0,3).toUpperCase()+'</span><span class="m" data-livemin>'+LIVE.min+"'</span></div>";}

/* ================= PAGES ================= */
var P={};
P.jogos=function(q){
  var r=+(q||CUR);if(RLIST.indexOf(r)<0)r=CUR;
  var gs=GAMES.filter(function(g){return g.r===r;}),dias=[];
  gs.forEach(function(g){var k=g.date?fmtD(g.date):'Data a definir';if(dias.indexOf(k)<0)dias.push(k);});
  return '<div class="wrap"><div class="phead"><div class="eyebrow">'+esc(PRO_NOME||'FF Pro League')+'</div><h1>Jogos</h1><p class="lead">Quartas e sextas à noite.</p></div>'+
  (RLIST.length?'<div class="days" id="roundSel">'+RLIST.map(function(n){return '<button data-r="'+n+'" class="'+(n===r?'on':'')+'">Rodada '+n+'</button>';}).join('')+'</div>'+
  dias.map(function(k){return '<h3 style="margin:22px 0 12px">'+k+'</h3><div class="games">'+gs.filter(function(g){return (g.date?fmtD(g.date):'Data a definir')===k;}).map(gameCard).join('')+'</div>';}).join('')
  :'<div class="card"><p class="muted" style="margin:0">Nenhum jogo cadastrado ainda.</p></div>')+'</div>';
};

P.jogo=function(id){
  var g=ALLGAMES.filter(function(x){return x.id===id;})[0];if(!g)return P.jogos();
  var done=jogou(g),nm=function(pid){return PM[pid]?esc(PM[pid].n):'';},lnk=function(pid){return PM[pid]?'<a href="#atleta-'+pid+'">'+nm(pid)+'</a>':'';};
  var ev=g.ev.slice().reverse().map(function(e){var side=tn(e.side==='h'?g.h:g.a),m='<span class="m">'+(e.m!=null?e.m+"'":'')+'</span>';
    if(e.t==='gol')return '<div class="ev">'+m+'<div>⚽ Gol · '+lnk(e.p)+'<small>'+side+(e.as?' · assistência de '+nm(e.as):'')+'</small></div></div>';
    if(e.t==='gc')return '<div class="ev">'+m+'<div>⚽ Gol contra · '+nm(e.p)+'<small>'+side+' · conta para '+tn(e.side==='h'?g.a:g.h)+'</small></div></div>';
    if(e.t==='amarelo')return '<div class="ev">'+m+'<div>🟨 Cartão amarelo · '+nm(e.p)+'<small>'+side+'</small></div></div>';
    if(e.t==='vermelho')return '<div class="ev">'+m+'<div>🟥 Cartão vermelho · '+nm(e.p)+'<small>'+side+'</small></div></div>';
    if(e.t==='var')return '<div class="ev">'+m+'<div>🖥️ Desafio de VAR · '+side+'<small>'+esc(e.txt)+'</small></div></div>';
    return '<div class="ev">'+m+'<div>🔄 Substituições<small>'+esc(e.txt)+'</small></div></div>';}).join('');
  function dots(n){var h='';for(var k=g.varTot-1;k>=0;k--)h+='<i class="'+(n<=k?'u':'')+'"></i>';return '<span class="var-dots">'+h+'</span>';}
  var lib=g.comp==='jogo-lib-',volta=lib?'<a class="more" href="#campeonato-libertadores">‹ Libertadores FF'+(g.grupo?' · Grupo '+esc(g.grupo):'')+'</a>':'<a class="more" href="#jogos-'+g.r+'">‹ Rodada '+g.r+'</a>';
  return '<div class="wrap"><div class="phead">'+volta+'</div>'+
  '<div class="grid2"><div style="display:grid;gap:18px;align-content:start">'+
   '<div class="card" style="padding:24px"><div class="between" style="margin-bottom:14px;flex-wrap:wrap;gap:8px">'+statusChip(g)+'<span class="lbl">Rodada '+g.r+(g.grupo?' · Grupo '+esc(g.grupo):'')+' · '+quando(g)+(g.field?' · '+esc(g.field):'')+'</span></div><div class="sb"><a class="t" href="#time-'+g.h+'">'+badge(g.h,'lg')+tn(g.h)+'</a><div class="s">'+(done?g.gh+'<i>:</i>'+g.ga:'<i>x</i>')+'</div><a class="t" href="#time-'+g.a+'">'+badge(g.a,'lg')+tn(g.a)+'</a></div></div>'+
   (g.st==='ao vivo'&&ondaDaPagina('ao-vivo')<=ONDA?'<a class="card between" href="#ao-vivo"><div><span class="live">Ao vivo</span><div class="muted" style="margin-top:6px">Acompanhe a transmissão na página Ao vivo.</div></div><span class="more">Assistir ›</span></a>':'')+
   (g.mvp&&PM[g.mvp]?'<a class="card between" href="#atleta-'+g.mvp+'"><div><div class="lbl">Craque do jogo</div><b style="font-family:var(--cond);font-size:20px;text-transform:uppercase">'+nm(g.mvp)+'</b></div><span class="chip gold">⭐ MVP</span></a>':'')+
  '</div><div style="display:grid;gap:18px;align-content:start">'+
   (done?'<div class="card"><h3 style="margin-bottom:8px">Lances</h3><div class="tl">'+(ev||'<p class="muted">Sem lances registrados.</p>')+'</div></div>':'')+
   (g.varTot?'<div class="card" style="display:grid;gap:10px"><h3>Desafios de VAR</h3><div class="between"><span>'+tn(g.h)+'</span>'+dots(g.varH)+'</div><div class="between"><span>'+tn(g.a)+'</span>'+dots(g.varA)+'</div><span class="lbl">'+g.varTot+' por equipe · pênalti, impedimento e agressão</span></div>':'')+
  '</div></div></div>';
};

P.classificacao=function(){
  return '<div class="wrap"><div class="phead"><div class="eyebrow">1ª Temporada · primeira fase</div><h1>Classificação</h1><p class="lead">Atualizada automaticamente ao fim de cada súmula. Os 4 primeiros avançam às semifinais.</p></div>'+
  '<div class="clsgrid"><div class="card" style="padding:20px 20px 16px"><h2 class="blkh">Tabela</h2>'+classTable()+'</div>'+
  '<div class="card" style="padding:20px"><h2 class="blkh">Jogos</h2><div id="rbox">'+roundBox(CLR)+'</div></div></div>'+
  '<div class="grid3" style="margin-top:18px"><div class="card"><h3>Artilharia</h3>'+scorersHTML(SCORERS,10)+'</div><div class="card"><h3>Assistências</h3>'+scorersHTML(PLAYERS.filter(function(p){return p.a>0;}).sort(function(a,b){return b.a-a.a||b.g-a.g;}),10,'a')+'</div><div class="card"><h3>MVPs</h3>'+scorersHTML(MVPS,10,'mvp')+'</div></div></div>';
};

/* ================= LIBERTADORES FF: fase de grupos =================
   Times, grupos, jogos e súmulas vêm do painel (banco.js monta LIB). Cada grupo numa linha: a tabela à esquerda
   e o quadro "Jogos · Grupo X" à direita, com a sua própria rodada (LR). Os 2 primeiros de cada grupo avançam. */
var LR={};
function libGrupoHTML(G){
  var ultR=null,antes={};G.games.forEach(function(g){if(g.st==='encerrado'&&(ultR==null||g.r>ultR))ultR=g.r;});
  if(ultR!=null&&G.games.some(function(g){return g.r<ultR&&g.st==='encerrado';}))tabelaDe(G.teams,G.games.filter(function(g){return g.r<ultR;})).forEach(function(x,i){antes[x.t.id]=i;});
  var cols=['P','J','V','E','D','GP','GC','SG','%'];
  var h='<div class="tblw"><table class="ctbl libt"><colgroup><col style="width:40px"><col style="width:30%"><col style="width:52px">'+cols.map(function(){return '<col>';}).join('')+'<col style="width:120px"></colgroup><thead><tr><th class="l" colspan="3">Classificação</th>'+cols.map(function(c,i){return '<th class="'+(i%2?'c-odd':'')+'">'+c+'</th>';}).join('')+'<th>Últ. jogos</th></tr></thead><tbody>';
  G.st.forEach(function(x,i){
    var d=antes[x.t.id]==null?0:antes[x.t.id]-i,mv=d>0?'<span class="up">▲</span> '+d:d<0?'<span class="dn">▼</span> '+(-d):'<span>■</span> 0';
    var vals=[x.pts,x.j,x.v,x.e,x.d,x.gp,x.gc,(x.sg>0?'+':'')+x.sg,x.j?Math.round(x.pts/(x.j*3)*100):0];
    h+='<tr class="'+(G.g&&i<2?'q':'')+'"><td class="pos">'+(i+1)+'</td><td class="team"><a href="#time-'+x.t.id+'">'+badge(x.t.id,'sm')+tn(x.t.id)+'</a></td><td class="mv">'+mv+'</td>'+
    vals.map(function(v,k){return '<td class="'+(k===0?'pts':(k%2?'c-odd':''))+'">'+v+'</td>';}).join('')+
    '<td><span class="dots">'+x.f.slice(-5).map(function(f){return '<i class="'+f+'" title="'+({V:'Vitória',E:'Empate',D:'Derrota'})[f]+'"></i>';}).join('')+'</span></td></tr>';
  });
  return '<div class="card" style="padding:20px 20px 16px"><h2 class="blkh">'+(G.g?'Grupo '+esc(G.g):'Times sem grupo')+'</h2>'+h+'</tbody></table></div></div>';
}
function libEstatHTML(){
  var yc=LIB.players.filter(function(p){return p.ca>0;}).sort(function(a,b){return b.ca-a.ca;}),as=LIB.players.filter(function(p){return p.a>0;}).sort(function(a,b){return b.a-a.a||b.g-a.g;});
  return '<div class="grid4" style="margin-bottom:40px"><div class="card"><h3>Artilharia</h3>'+scorersHTML(LIB.scorers,10)+'</div><div class="card"><h3>Assistências</h3>'+scorersHTML(as,10,'a')+'</div>'+
    '<div class="card"><h3>Cartões amarelos</h3>'+scorersHTML(yc,10,'ca')+'</div><div class="card"><h3>MVPs</h3>'+scorersHTML(LIB.mvps,10,'mvp')+'</div></div>';
}
// Linha de um jogo nos quadros de rodada (FF Pro League e Libertadores FF)
function rgameHTML(g){var done=jogou(g),d=g.date;
  return '<div class="rgame"><div class="meta">'+esc(g.field)+' &nbsp;<b>'+(d?String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' · '+['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][d.getDay()]+(g.time?' · '+g.time:''):'Data a definir')+'</b></div>'+
    '<div class="ln"><span class="h">'+tn(g.h)+badge(g.h,'sm')+'</span><span class="sc">'+(done?g.gh:'')+'</span><span class="x">×</span><span class="sc">'+(done?g.ga:'')+'</span><span class="a">'+badge(g.a,'sm')+tn(g.a)+'</span></div>'+
    '<a class="go'+(g.st==='ao vivo'?' lv':'')+'" href="#'+g.id+'">'+(g.st==='ao vivo'?'● Ao vivo'+(g.min!=null?' · '+g.min+"'":''):g.st==='encerrado'?'Saiba como foi':g.st==='adiado'?'Adiado':g.st==='cancelado'?'Cancelado':'Detalhes do jogo')+'</a></div>';}
function libJogosBox(G){
  if(!G.rodadas.length)return '<p class="muted" style="margin:0">Nenhum jogo cadastrado ainda.</p>';
  var k=G.rodadas.indexOf(LR[G.g]);if(k<0){var pend=G.games.filter(function(g){return !jogou(g);}).map(function(g){return g.r;});LR[G.g]=pend.length?Math.min.apply(null,pend):G.rodadas[G.rodadas.length-1];k=G.rodadas.indexOf(LR[G.g]);}
  var r=LR[G.g],seta=function(d,dis,pth,lbl){return '<button class="lnav" data-g="'+esc(G.g)+'" data-d="'+d+'" aria-label="'+lbl+'"'+(dis?' disabled':'')+'><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="'+pth+'"/></svg></button>';};
  return '<div class="rnav">'+seta(-1,k<=0,'M11 3L5 9l6 6','Rodada anterior')+'<b>'+r+'ª Rodada</b>'+seta(1,k>=G.rodadas.length-1,'M7 3l6 6-6 6','Próxima rodada')+'</div>'+
    G.games.filter(function(g){return g.r===r;}).sort(function(a,b){return a.i-b.i;}).map(rgameHTML).join('');
}
document.addEventListener('click',function(e){var b=e.target.closest('button.lnav');if(!b||b.disabled)return;
  var G=LIB.grupos.filter(function(x){return x.g===b.dataset.g;})[0];if(!G)return;
  var k=G.rodadas.indexOf(LR[G.g])+(+b.dataset.d);if(k<0||k>=G.rodadas.length)return;LR[G.g]=G.rodadas[k];
  document.getElementById('lbox-'+(G.g||'x')).innerHTML=libJogosBox(G);});
function libGruposHTML(){
  if(!LIB.teams.length)return '<div class="card" style="margin-bottom:40px"><p class="muted" style="margin:0">Nenhum time cadastrado ainda. Os grupos e os jogos aparecem aqui assim que a equipe FF cadastrar no painel.</p></div>';
  var ex=LIB.extras||[];
  return '<div style="display:grid;gap:18px">'+LIB.grupos.map(function(G){return '<div class="clsgrid" style="align-items:stretch">'+libGrupoHTML(G)+
    '<div class="card" style="padding:20px"><h2 class="blkh">Jogos · '+(G.g?'Grupo '+esc(G.g):'Sem grupo')+'</h2><div id="lbox-'+(G.g||'x')+'">'+libJogosBox(G)+'</div></div></div>';}).join('')+
    (ex.length?'<div class="card" style="padding:20px"><h2 class="blkh">Outros jogos</h2>'+ex.slice().sort(function(a,b){return a.r-b.r||a.i-b.i;}).map(rgameHTML).join('')+'</div>':'')+'</div>'+
  '<div class="legend" style="margin-bottom:40px"><span><i style="width:10px;height:10px;background:var(--gold);border-radius:2px;display:inline-block"></i>Próxima fase</span><span><span class="dots"><i class="V"></i></span>Vitória</span><span><span class="dots"><i class="E"></i></span>Empate</span><span><span class="dots"><i class="D"></i></span>Derrota</span></div>';
}

function camp(tab,body){
  var tabs=[['tabela','Tabela e jogos','campeonato'],['estatisticas','Estatísticas','campeonato-estatisticas']];
  // Divisão por competição: Libertadores FF (ainda sem dados) e FF Pro League (tudo o que já existe)
  var lib=tab.indexOf('libertadores')===0,comps=[['libertadores','Libertadores FF','campeonato-libertadores'],['pro','FF Pro League','campeonato']];
  return '<div class="wrap"><div class="phead"><div class="eyebrow">'+(lib?'Fut7 · fase de grupos':'1ª Temporada · primeira fase')+'</div><h1>Campeonato</h1><p class="lead">'+(lib?'Tabela, jogos e números da Libertadores FF, atualizados a cada súmula.':'Tabela, jogos, números e todos os atletas da FF Soccer Pro League, atualizados a cada súmula.')+'</p></div>'+
  (BANCO_ERRO?'<div class="notice" style="margin-bottom:18px">Não foi possível carregar o campeonato agora. Tente de novo em alguns minutos.</div>':'')+
  '<nav class="comps" aria-label="Competição">'+comps.map(function(c){return '<a href="#'+c[2]+'" class="'+((c[0]==='libertadores')===lib?'on':'')+'">'+c[1]+'</a>';}).join('')+'</nav>'+
  '<nav class="ctabs">'+(lib?[['libertadores','Tabela e jogos','campeonato-libertadores'],['libertadores-estatisticas','Estatísticas','campeonato-libertadores-estatisticas']]:tabs).map(function(t){return '<a href="#'+t[2]+'" class="'+(t[0]===tab?'on':'')+'">'+t[1]+'</a>';}).join('')+'</nav>'+body+'</div>';
}
P.campeonato=function(tab){
  tab=tab||'tabela';
  if(tab==='libertadores'){
    return camp('libertadores',libGruposHTML());
  }
  if(tab==='libertadores-estatisticas'){
    return camp('libertadores-estatisticas',libEstatHTML());
  }
  if(tab==='estatisticas'){
    var yc=PLAYERS.filter(function(p){return p.ca>0;}).sort(function(a,b){return b.ca-a.ca;});
    // 4 colunas, igual à Libertadores FF: Artilharia, Assistências, Cartões amarelos e MVPs
    return camp('estatisticas','<div class="grid4" style="margin-bottom:40px"><div class="card"><h3>Artilharia</h3>'+scorersHTML(SCORERS,10)+'</div><div class="card"><h3>Assistências</h3>'+scorersHTML(PLAYERS.filter(function(p){return p.a>0;}).sort(function(a,b){return b.a-a.a||b.g-a.g;}),10,'a')+'</div><div class="card"><h3>Cartões amarelos</h3>'+scorersHTML(yc,10,'ca')+'</div><div class="card"><h3>MVPs</h3>'+scorersHTML(MVPS,10,'mvp')+'</div></div>');
  }
  if(tab==='atletas'){
    return camp('atletas','<div class="filters"><input id="aq" type="search" placeholder="Buscar por nome ou número"><select id="at"><option value="">Todos os times</option>'+TEAMS.map(function(t){return '<option value="'+t.id+'">'+t.n+'</option>';}).join('')+'</select><select id="ap"><option value="">Todas as posições</option>'+Object.keys(POSN).map(function(k){return '<option value="'+k+'">'+POSN[k]+'</option>';}).join('')+'</select></div><div class="athletes" id="alist"></div>');
  }
  return camp('tabela','<div class="clsgrid"><div class="card" style="padding:20px 20px 16px"><h2 class="blkh">Tabela</h2>'+classTable()+'</div><div class="card" style="padding:20px"><h2 class="blkh">Jogos</h2><div id="rbox">'+roundBox(CLR)+'</div></div></div>');
};

/* Temporada do zero (CONFIG.TEMPORADA_ZERADA, pedido do Deko em 22/10/2026): nenhum jogo disputado na FF Pro League.
   Vale para os dados de exemplo e para os do banco: placares, eventos, MVPs e números dos atletas zerados.
   O 1º jogo da 1ª rodada fica "ao vivo" começando (0x0), porque o Ao vivo e a faixa do topo precisam de um jogo. */
function zerarTemporada(){
  if(!CONFIG.TEMPORADA_ZERADA)return;
  GAMES.forEach(function(g){g.st='agendado';g.gh=null;g.ga=null;g.ev=[];g.mvp=null;g.varH=2;g.varA=2;delete g.min;});
  PLAYERS.forEach(function(p){p.g=0;p.a=0;p.mvp=0;p.ca=0;p.j=0;p.min=0;p.games=[];});
  var ini=GAMES.filter(function(g){return g.r===1;}).sort(function(a,b){return a.i-b.i;})[0];
  ini.st='ao vivo';ini.gh=0;ini.ga=0;ini.min=1;ini.min0=1;LIVE=ini;CUR=1;
  ST=standings();SCORERS=[];MVPS=[];
}
var CLR=CUR;
// posições antes da última rodada com jogo encerrado (para as setas ▲▼ da tabela)
function prevPositions(){
  var ultR=null;GAMES.forEach(function(g){if(g.st==='encerrado'&&(ultR==null||g.r>ultR))ultR=g.r;});
  var m={},ant=GAMES.filter(function(g){return g.r<ultR;});if(ultR==null||!ant.some(function(g){return g.st==='encerrado';}))return m;
  tabelaDe(TEAMS,ant).forEach(function(x,i){m[x.t.id]=i;});return m;
}
function classTable(){
  if(!ST.length)return '<p class="muted" style="margin:0">Nenhum time cadastrado ainda. A tabela aparece aqui assim que a equipe FF cadastrar os times no painel.</p>';
  var pv=prevPositions();
  var cols=['P','J','V','E','D','GP','GC','SG','%'];
  var h='<div class="tblw"><table class="ctbl"><thead><tr><th class="l" colspan="3">Classificação</th>'+cols.map(function(c,i){return '<th class="'+(i%2?'c-odd':'')+'">'+c+'</th>';}).join('')+'<th>Últ. jogos</th></tr></thead><tbody>';
  ST.forEach(function(x,i){
    var d=pv[x.t.id]==null?0:pv[x.t.id]-i,mv=d>0?'<span class="up">▲</span> '+d:d<0?'<span class="dn">▼</span> '+(-d):'<span>■</span> 0';
    var pct=x.j?Math.round(x.pts/(x.j*3)*100):0;
    var vals=[x.pts,x.j,x.v,x.e,x.d,x.gp,x.gc,(x.sg>0?'+':'')+x.sg,pct];
    h+='<tr class="'+(i<4?'q':'')+'"><td class="pos">'+(i+1)+'</td><td class="team"><a href="#time-'+x.t.id+'">'+badge(x.t.id,'sm')+tn(x.t.id)+'</a></td><td class="mv">'+mv+'</td>'+
    vals.map(function(v,k){return '<td class="'+(k===0?'pts':(k%2?'c-odd':''))+'">'+v+'</td>';}).join('')+
    '<td><span class="dots">'+x.f.slice(-5).map(function(f){return '<i class="'+f+'" title="'+({V:'Vitória',E:'Empate',D:'Derrota'})[f]+'"></i>';}).join('')+'</span></td></tr>';
  });
  return h+'</tbody></table></div><div class="legend"><span><i style="width:10px;height:10px;background:var(--gold);border-radius:2px;display:inline-block"></i>Semifinais</span><span><span class="dots"><i class="V"></i></span>Vitória</span><span><span class="dots"><i class="E"></i></span>Empate</span><span><span class="dots"><i class="D"></i></span>Derrota</span></div>';
}
function roundBox(r){
  if(!RLIST.length)return '<p class="muted" style="margin:0">Nenhum jogo cadastrado ainda.</p>';
  var k=RLIST.indexOf(r);if(k<0){r=CUR||RLIST[0];k=RLIST.indexOf(r);CLR=r;}
  var gs=GAMES.filter(function(g){return g.r===r;}).sort(function(a,b){return a.i-b.i;});
  return '<div class="rnav"><button id="rPrev" aria-label="Rodada anterior"'+(k<=0?' disabled':'')+'><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 3L5 9l6 6"/></svg></button><b>'+r+'ª Rodada</b><button id="rNext" aria-label="Próxima rodada"'+(k>=RLIST.length-1?' disabled':'')+'><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 3l6 6-6 6"/></svg></button></div>'+
  gs.map(rgameHTML).join('');
}
function bindRound(){
  var p=document.getElementById('rPrev'),n=document.getElementById('rNext'),mv=function(d){var k=RLIST.indexOf(CLR)+d;if(k<0||k>=RLIST.length)return;CLR=RLIST[k];document.getElementById('rbox').innerHTML=roundBox(CLR);bindRound();};
  if(p)p.addEventListener('click',function(){mv(-1);});
  if(n)n.addEventListener('click',function(){mv(1);});
}

P.atletas=function(){
  return '<div class="wrap"><div class="phead"><div class="eyebrow">'+PLAYERS.length+(PLAYERS.length===1?' atleta':' atletas')+' · '+TEAMS.length+(TEAMS.length===1?' time':' times')+'</div><h1>Atletas</h1><p class="lead">Cada jogo passa a fazer parte da sua história. Encontre qualquer atleta da League.</p></div>'+
  '<div class="filters"><input id="aq" type="search" placeholder="Buscar por nome ou número"><select id="at"><option value="">Todos os times</option>'+TEAMS.map(function(t){return '<option value="'+t.id+'">'+esc(t.n)+'</option>';}).join('')+'</select><select id="ap"><option value="">Todas as posições</option>'+Object.keys(POSN).map(function(k){return '<option value="'+k+'">'+POSN[k]+'</option>';}).join('')+'</select></div>'+
  '<div class="athletes" id="alist"></div></div>';
};
function athCard(p){return '<a class="ath" href="#atleta-'+p.id+'"><span class="n">'+p.num+'</span><div class="row"><div class="avatar" style="width:44px;height:44px;'+avBg(p.id)+'"></div><div><b>'+esc(p.n)+'</b><div class="lbl" style="margin-top:3px">'+tn(p.team)+(posn(p)?' · '+posn(p):'')+'</div></div></div><div class="st"><span><b>'+p.j+'</b>jogos</span><span><b>'+p.g+'</b>gols</span><span><b>'+p.mvp+'</b>MVP</span></div></a>';}

P.atleta=function(id,dentro){
  var p=PM[id];if(!p)return P.atletas();var t=TM[p.team],lib=t.comp==='jogo-lib-';
  var rows=p.games.map(function(x){var g=ALLGAMES.filter(function(y){return y.id===x.g;})[0];if(!g)return '';var home=g.h===p.team,op=home?g.a:g.h,my=home?g.gh:g.ga,th=home?g.ga:g.gh,res=my>th?'V':my<th?'D':'E';
    return '<tr><td class="l">'+g.r+'</td><td class="l"><a href="#'+g.id+'" class="row" style="gap:8px">'+badge(op,'sm')+tn(op)+'</a></td><td><span class="form"><i class="'+res+'">'+res+'</i></span> '+my+' x '+th+'</td><td>'+(x.gl||'–')+'</td><td>'+(g.mvp===p.id?'⭐':'')+'</td></tr>';}).join('');
  var mvpR=ALLGAMES.filter(function(g){return g.mvp===p.id;}).map(function(g){return '<span class="chip gold">⭐ MVP · rodada '+g.r+'</span>';}).join('');
  var corpo='<div class="prof" data-n="'+p.num+'"><div class="avatar'+(FOTOS[p.id]?' ret':'')+'" style="'+avBg(p.id)+'"></div><div style="display:grid;gap:8px;position:relative"><span class="k">'+(posn(p)?posn(p)+' · ':'')+esc(t.n)+' · Nº '+p.num+'</span><h1>'+esc(p.n)+'</h1>'+
    (p.unit?'<div class="row" style="flex-wrap:wrap;gap:6px"><span class="chip" style="background:rgba(0,0,0,.6);color:#FAF9F5;border-color:transparent">Unidade '+esc(p.unit)+'</span></div>':'')+'</div></div>'+
  '<div class="lbl" style="margin:26px 0 10px">'+(lib?'Libertadores FF':esc(PRO_NOME||'FF Pro League'))+'</div><div class="stats" style="grid-template-columns:repeat(4,1fr)"><div><b>'+p.j+'</b><span>Jogos</span></div><div><b>'+p.g+'</b><span>Gols</span></div><div><b>'+p.a+'</b><span>Assist.</span></div><div><b>'+p.mvp+'</b><span>MVPs</span></div></div>'+
  '<div class="grid2" style="margin-top:18px"><div class="card"><h3 style="margin-bottom:6px">Jogos na competição</h3>'+(rows?'<div class="tblw"><table class="tbl"><thead><tr><th class="l">Rod.</th><th class="l">Adversário</th><th>Placar</th><th>Gols</th><th>MVP</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p class="muted">Ainda sem jogos.</p>')+'</div>'+
  '<div style="display:grid;gap:18px;align-content:start"><div class="card" style="display:grid;gap:10px"><h3>Conquistas</h3>'+(mvpR?'<div class="row" style="flex-wrap:wrap;gap:6px">'+mvpR+'</div>':'<p class="muted" style="margin:0">Nenhuma conquista ainda.</p>')+'</div></div></div>';
  // dentro = mostrado na área do atleta (Meu perfil público), sem o “‹ Atletas” do Campeonato
  if(dentro)return corpo;
  return '<div class="wrap"><div class="phead">'+(lib?'<a class="more" href="#time-'+t.id+'">‹ '+esc(t.n)+'</a>':'<a class="more" href="#atletas">‹ Atletas</a>')+'</div>'+corpo+'</div>';
};
P['minha-area-perfil']=function(){
  return area('perfil','<div class="ahead"><div><div class="eyebrow">Como os outros atletas veem você</div><h1>Meu perfil público</h1></div></div>'+P.atleta(ME,1));
};

P.time=function(id){
  var t=TM[id];if(!t)return P.campeonato();var lib=t.comp==='jogo-lib-',G=lib?LIB.grupos.filter(function(x){return x.teams.indexOf(t)>=0;})[0]:null;
  var tab=G?G.st:ST,pos=tab.map(function(x){return x.t.id;}).indexOf(id),s=tab[pos];
  var gs=ALLGAMES.filter(function(g){return g.h===id||g.a===id;}).sort(function(a,b){return a.r-b.r||a.i-b.i;});
  return '<div class="wrap"><div class="phead"><a class="more" href="#'+(lib?'campeonato-libertadores':'campeonato')+'">‹ '+(lib?'Libertadores FF':'Campeonato')+'</a><div class="row" style="gap:16px">'+badge(id,'lg')+'<h1>'+esc(t.n)+'</h1></div>'+
  (s?'<p class="lead">'+(G&&G.g?'Grupo '+esc(G.g)+' · ':'')+(pos+1)+'º lugar · '+s.pts+(s.pts===1?' ponto':' pontos')+' · '+s.v+(s.v===1?' vitória, ':' vitórias, ')+s.e+(s.e===1?' empate e ':' empates e ')+s.d+(s.d===1?' derrota.':' derrotas.')+'</p>':'')+'</div>'+
  '<div class="grid2"><div class="card"><h3 style="margin-bottom:6px">Elenco</h3>'+(t.roster.length?'<div class="athletes" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">'+t.roster.map(athCard).join('')+'</div>':'<p class="muted" style="margin:0">Elenco ainda não cadastrado.</p>')+'</div>'+
  '<div class="card"><h3 style="margin-bottom:10px">Jogos</h3>'+(gs.length?'<div style="display:grid;gap:10px">'+gs.map(gameCard).join('')+'</div>':'<p class="muted" style="margin:0">Nenhum jogo cadastrado ainda.</p>')+'</div></div></div>';
};

/* Ao vivo: a transmissão vem do painel (aba Ao vivo, tabela transmissao): link da live do YouTube, título e ligada/desligada.
   Ligada: vídeo do YouTube e, no computador, o chat da live. Desligada: aviso e link para o canal. */
var YT_CANAL='https://www.youtube.com/@FFsocceracademy';
function ytInfo(l){l=String(l||'').trim();
  var m=l.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/))([\w-]{11})/);if(m)return {video:m[1]};
  m=l.match(/youtube\.com\/channel\/(UC[\w-]{22})/);if(m)return {canal:m[1]};
  if(/youtube\.com\/@/.test(l))return {erro:'Esse é o link do canal pelo nome (@…). Cole o link da live (botão Compartilhar da transmissão) ou o link do canal no formato youtube.com/channel/UC….'};
  return {erro:'Link do YouTube não reconhecido. Cole o link da live (botão Compartilhar da transmissão).'};}
function ytEmbed(y){return y.video?'https://www.youtube.com/embed/'+y.video+'?rel=0':'https://www.youtube.com/embed/live_stream?channel='+y.canal+'&rel=0';}
function ytAssistir(y){return y.video?'https://www.youtube.com/watch?v='+y.video:'https://www.youtube.com/channel/'+y.canal+'/live';}
P['ao-vivo']=function(){
  setTimeout(aoVivoCarregar,0);
  return '<div class="wrap" id="aovivo"><div class="phead"><div class="eyebrow">Canal oficial FF Soccer · YouTube</div><h1>TV FF Soccer</h1></div><p class="muted" id="avMsg">Carregando a transmissão…</p></div>';
};
function aoVivoCarregar(){
  var el=document.getElementById('aovivo');if(!el)return;
  var mostra=function(t){if(!document.getElementById('aovivo'))return;
    var y=t&&t.no_ar?ytInfo(t.link):null,cab='<div class="phead"><div class="eyebrow">Canal oficial FF Soccer · YouTube</div><h1>TV FF Soccer</h1></div>';
    if(!y||y.erro){el.innerHTML=cab+'<div class="card avoff"><span class="chip">Sem transmissão agora</span><h2>Nenhum jogo ao vivo neste momento</h2>'+
      '<p class="muted" style="margin:0">Quando houver transmissão, o jogo aparece aqui, com o chat do YouTube. Enquanto isso, acompanhe o canal oficial da FF Soccer.</p>'+
      '<a class="btn primary" href="'+YT_CANAL+'" target="_blank" rel="noopener">Abrir o canal no YouTube</a></div>';return;}
    var chat=y.video?'https://www.youtube.com/live_chat?v='+y.video+'&embed_domain='+encodeURIComponent(location.hostname):'';
    el.innerHTML=cab+'<div class="livegrid'+(chat?'':' semchat')+'"><div style="display:grid;gap:14px;align-content:start">'+
      '<div class="ytbox"><iframe src="'+ytEmbed(y)+'" title="'+esc(t.titulo||'Transmissão ao vivo')+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'+
      '<div class="between wrapm" style="flex-wrap:wrap;gap:10px"><div style="min-width:0"><span class="live">Ao vivo</span>'+(t.titulo?'<h2 style="font-size:32px;margin-top:8px">'+esc(t.titulo)+'</h2>':'')+'</div>'+
      '<div class="row" style="flex-wrap:wrap;gap:8px"><a class="btn sm" href="'+ytAssistir(y)+'" target="_blank" rel="noopener">Assistir no YouTube</a>'+
      (chat?'<a class="btn sm avchatbtn" href="'+ytAssistir(y)+'" target="_blank" rel="noopener">Abrir o chat no YouTube</a>':'')+'</div></div></div>'+
      (chat?'<div class="card avchat"><div class="between" style="margin-bottom:10px"><span class="lbl">Chat da live</span><span class="lbl">YouTube</span></div>'+
        '<iframe src="'+chat+'" title="Chat da transmissão no YouTube"></iframe><p class="muted" style="margin:8px 0 0;font-size:13px">Para comentar, entre com sua conta do YouTube.</p></div>':'')+'</div>';
  };
  if(!CONFIG.SUPABASE_URL)return mostra(null);
  fetch(CONFIG.SUPABASE_URL+'/rest/v1/transmissao?select=link,titulo,no_ar&id=eq.1',{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:'Bearer '+CONFIG.SUPABASE_KEY}})
    .then(function(r){return r.ok?r.json():[];}).then(function(d){mostra(d&&d[0]);}).catch(function(){mostra(null);});
}


P['libertadores']=function(){
  return '<div class="wrap"><div class="phead"><div class="eyebrow">Competição FF</div><h1>Libertadores FF</h1><p class="lead">A última edição da nossa tradicional Copa FF no formato Fut7 antes do novo calendário de competições de 2027.</p></div>'+
  '<div class="feat" style="margin:8px 0 64px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">'+[['⚽','Times de 10 a 12 atletas'],['👕','Novo uniforme com personalização do time'],['📸','Fotos gratuitas quando houver cobertura'],['🎥','Final transmitida ao vivo'],['🏆','E muito mais!']].map(function(x){return '<div><span style="font-size:26px">'+x[0]+'</span><b>'+x[1]+'</b></div>';}).join('')+'</div></div>';
};
P['a-league']=function(){
  return '<div class="wrap"><div class="phead"><div class="eyebrow">Uma nova era começa agora</div><h1>A Pro League</h1><p class="lead">Mais do que um campeonato, a FF Soccer Pro League é uma experiência de temporada. Você vive cada momento: time fixo, uniforme personalizado, jogos transmitidos ao vivo, seus números registrados rodada a rodada e, claro, VAR.</p></div>'+
  '<div class="feat"><div><span class="big">11×11</span><b>Futebol de campo</b><p>Cerca de 20 atletas por equipe.</p></div><div><span class="big">Turno único</span><b>Todos contra todos</b><p>Sem contar as fases finais.</p></div><div><span class="big">6 meses</span><b>Temporada completa</b><p>Do primeiro jogo até as finais.</p></div></div>'+
  '<section class="blk" style="margin-top:40px"><div class="grid2"><div style="display:grid;gap:14px;align-content:start"><h2>O que está incluído</h2><div class="feat">'+
  [['👕','Kit exclusivo','Camisa, shorts, meião e mochila personalizada.'],['🎥','Transmissão ao vivo','Estrutura planejada para transmitir todos os jogos.'],['🖥️','VAR e desafios','Até 2 desafios por equipe em cada jogo.'],['📸','Fotos gratuitas','Sempre que houver cobertura fotográfica.'],['📊','Registro individual','Gols, MVPs, participações e temporadas.'],['✨','Noite de premiação','Jantar de encerramento com os prêmios da temporada.']].map(function(x){return '<div><span style="font-size:26px">'+x[0]+'</span><b>'+x[1]+'</b><p>'+x[2]+'</p></div>';}).join('')+'</div></div>'+
  '<div style="display:grid;gap:14px;align-content:start"><h2>Quando são os jogos</h2><div class="card agenda"><div class="between"><span>Quartas-feiras</span><span class="chip gold">Principal · noite</span></div><div class="between"><span>Sextas-feiras</span><span class="chip gold">Principal · noite</span></div><div class="between"><span>Domingos</span><span class="chip">Quando o calendário pedir</span></div><div class="between"><span>Segundas-feiras</span><span class="chip">Quando o calendário pedir</span></div></div>'+
  '<h2 style="margin-top:14px">Calendário</h2><div class="card agenda"><div class="between"><span>1ª Temporada</span><span>Janeiro a junho</span></div><div class="between"><span>Copa FF</span><span>Julho</span></div><div class="between"><span>2ª Temporada</span><span>Agosto a dezembro</span></div></div></div></div></section>'+
  '<section class="blk"><h2 style="margin-bottom:10px">Perguntas frequentes</h2>'+
  [['Como funciona o VAR?','Cada equipe tem até dois pedidos de desafio por partida, para lances definidos pela organização: pênaltis, impedimentos e agressões ou situações disciplinares específicas.'],['A pré-inscrição garante minha vaga?','Não. A pré-inscrição passa por uma análise da FF, que considera o histórico de pontualidade nos pagamentos e o histórico comportamental nas unidades e competições FF.'],['Quem joga a 1ª Temporada tem prioridade?','Sim. Os participantes da 1ª Temporada têm prioridade para continuar na 2ª. Novas vagas só abrem se sobrarem.'],['As fotos são pagas?','Não. Sempre que houver cobertura fotográfica, as fotos são disponibilizadas gratuitamente aos participantes.']].filter(function(x){return preOn()||!/pré-inscrição/i.test(x[0]);}).map(function(x){return '<details><summary>'+x[0]+'</summary><p>'+x[1]+'</p></details>';}).join('')+
  '<div class="notice" style="margin-top:24px"><b>Pré-lançamento.</b> Datas, horários, locais, formato de disputa e número de partidas podem ter ajustes pontuais até a divulgação do regulamento oficial.</div></section></div>';
};

P['pre-inscricao']=function(){
  return '<div class="wrap"><div class="phead"><div class="eyebrow">FF Soccer Pro League · 1ª Temporada 2027</div><h1>Pré-inscrição</h1><p class="lead">Preencha seus dados para entrar na análise da FF. A pré-inscrição não confirma a vaga automaticamente.</p></div>'+
  '<div class="formgrid"><form class="card" id="preForm" novalidate style="padding:24px;display:grid;gap:18px">'+
  '<div class="fset"><label class="fld full">Nome completo<input id="fNome" required placeholder="Como aparece no documento" autocomplete="name"></label>'+
  '<label class="fld">E-mail<input id="fEmail" type="email" required placeholder="voce@email.com" autocomplete="email"></label>'+
  '<label class="fld">Celular com DDD<input id="fCel" type="tel" required placeholder="(11) 90000-0000" autocomplete="tel"></label>'+
  '<label class="fld">Data de nascimento<input id="fNasc" type="date" required></label>'+
  '<label class="fld">Unidade FF<select id="fUnid" required><option value="">Selecione</option>'+(CONFIG.UNIDADES||UNITS).map(function(u){return '<option>'+u+'</option>';}).join('')+'</select></label></div>'+
  '<div class="fld">Posições de preferência<div class="tri pos">'+[1,2,3].map(function(n){return '<label class="fld">'+n+'ª opção<select id="fPos'+n+'" required><option value="">Selecione</option>'+Object.keys(POSN).map(function(k){return '<option value="'+k+'">'+POSN[k]+'</option>';}).join('')+'</select></label>';}).join('')+'</div><span class="hint">Escolha três posições diferentes.</span></div>'+
  '<div class="fld">Personalização da camisa<div class="tri">'+['fNum','fNum2','fNum3'].map(function(id,i){return '<label class="fld">'+(i+1)+'º número<input id="'+id+'" class="fnum" type="text" inputmode="numeric" maxlength="2" required placeholder="1 a 99"></label>';}).join('')+'</div><div class="shirtrow"><label class="fld">Nome na camisa<input id="fNomeC" maxlength="12" required placeholder="Até 12 letras" style="text-transform:uppercase"></label>'+
  '<div class="shirt" aria-hidden="true"><svg viewBox="0 0 120 130"><path d="M38 6 L20 12 L2 34 L18 48 L26 40 L26 126 L94 126 L94 40 L102 48 L118 34 L100 12 L82 6 Q60 16 38 6 Z" fill="#F2C14D" stroke="#0B0B0A" stroke-width="3"/></svg><span class="sn" id="shN">SEU NOME</span><span class="sm" id="shM">10</span></div></div>'+
  '<span class="hint">A FF tenta o 1º número. Se já estiver em uso no seu time, passa para o 2º e depois para o 3º.</span></div>'+
  '<div class="fld">Tamanho do kit<div class="opts">'+['P','M','G','GG','XG'].map(function(s,i){return '<label><input type="radio" name="kit" value="'+s+'"'+(i===1?' checked':'')+'>'+s+'</label>';}).join('')+'</div></div>'+
  '<input type="text" id="fHp" name="empresa" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">'+
  '<label class="consent"><input type="checkbox" id="fLgpd"><span id="tLgpd">Autorizo a FF Soccer a analisar meu score financeiro e meu histórico comportamental nas unidades e competições FF para avaliar minha pré-inscrição, conforme a LGPD.</span></label>'+
  '<label class="consent"><input type="checkbox" id="fTerm"><span id="tTerm">Li e concordo com as condições da FF Soccer Pro League, incluindo a possibilidade de ajustes pontuais no calendário e no formato.</span></label>'+
  '<div class="err" id="fErr" role="alert"></div><button class="btn primary" id="fSend" type="submit" style="justify-content:center">Enviar pré-inscrição</button><span class="hint">Seus dados são usados só pela FF Soccer para analisar sua pré-inscrição e falar com você sobre a League.</span></form>'+
  '<div style="display:grid;gap:14px"><div class="card" style="display:grid;gap:12px"><h3>Como funciona</h3><div class="agenda"><div class="between"><span>1 · Pré-inscrição</span><span class="lbl">você envia</span></div><div class="between"><span>2 · Análise da FF</span><span class="lbl">score e histórico</span></div><div class="between"><span>3 · Aprovação</span><span class="lbl">a FF entra em contato</span></div><div class="between"><span>4 · Vaga confirmada</span><span class="lbl">kit de participação</span></div></div></div>'+
  
  '<div class="notice"><b>Sobre o pagamento.</b> A inscrição tem valor único para a temporada. Depois da aprovação, a FF orienta o pagamento diretamente com você.</div></div></div></div>';
};


/* ================= ÁREA LOGADA ================= */
var ME=null;try{if(localStorage.getItem('ffl_user'))ME=localStorage.getItem('ffl_user');}catch(e){}
if(ONDA<4)ME=null;  // área do atleta de demonstração só a partir da onda 4
var CONF=null,RENEW=false,SEL={},NEXTKIT='M';
function toast(t){var el=document.getElementById('toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('on');},2600);}
function login(id){ME=id;try{localStorage.setItem('ffl_user',id);}catch(e){}acct();location.hash='minha-area';}
function logout(){ME=null;try{localStorage.removeItem('ffl_user');}catch(e){}acct();location.hash='a-league';toast('Você saiu da sua área.');}
// E-mail de quem está conectado com login real (sessão guardada pelo Supabase neste navegador), ou ''.
function perfilSalvo(){try{return localStorage.getItem('ffl_perfil')||'';}catch(e){return '';}}
function sessaoEmail(){try{var ref=(CONFIG.SUPABASE_URL||'').split('//')[1].split('.')[0],v=JSON.parse(localStorage.getItem('sb-'+ref+'-auth-token')||'null');return (v&&v.user&&v.user.email)||'';}catch(e){return '';}}
function acct(){var a=document.getElementById('acct'),d=document.getElementById('drawAcct');
  if(ME){var p=PM[ME];a.className='acct';a.href='#minha-area';a.innerHTML='<span class="av">'+p.n[0]+'</span><span class="nm">'+esc(p.n.split(' ')[0])+'</span>';d.firstChild.textContent='Minha área ';}
  else if(sessaoEmail()){var em=sessaoEmail(),dest=perfilSalvo()==='atleta'?'#entrar':'#painel';a.className='acct so';a.href=dest;a.innerHTML='<span class="av">'+esc(em[0].toUpperCase())+'</span>';a.title='Conectado como '+em;a.setAttribute('aria-label','Conectado como '+em+(dest==='#painel'?'. Abrir o painel':'. Abrir a minha conta'));d.firstChild.textContent=dest==='#painel'?'Painel ':'Minha conta ';d.href=dest;}
  else{a.className='acct out';a.href='#entrar';a.textContent='Entrar';a.removeAttribute('title');a.removeAttribute('aria-label');d.firstChild.textContent='Entrar ';d.href='#entrar';}
  if(ME)d.href='#minha-area';
  a.hidden=d.hidden=semBotoes()&&!ME&&!sessaoEmail();}
function greet(){var h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';}
function myGames(p){return p.games.map(function(x){var g=GAMES.filter(function(y){return y.id===x.g;})[0];return {x:x,g:g,op:g.h===p.team?g.a:g.h};});}
function area(tab,body){
  var p=PM[ME];
  return '<div class="wrap"><div class="area"><nav class="side"><div class="me"><div class="avatar'+(FOTOS[p.id]?' ret':'')+'" style="width:52px;height:52px;border:2px solid #0B0B0A;'+avBg(p.id)+'"></div><b>'+esc(p.n).replace(' ','<br>')+'</b><span>'+POSN[p.pos]+' · '+tn(p.team)+' · Nº '+p.num+'</span></div>'+
  '<a href="#minha-area" class="'+(tab==='painel'?'on':'')+'">🏠 Meu painel</a>'+
  '<a href="#minha-area-time" class="'+(tab==='time'?'on':'')+'">⚽ Meu time</a>'+
  '<a href="#minha-area-inscricao" class="'+(tab==='insc'?'on':'')+'">📋 Inscrição e kit</a>'+
  '<a href="#minha-area-campeonatos" class="'+(tab==='camp'?'on':'')+'">🏆 Meus campeonatos</a>'+
  '<a href="#minha-area-perfil" class="'+(tab==='perfil'?'on':'')+'">👤 Meu perfil público</a>'+
  '<a href="#sair" id="doLogout">↩ Sair</a></nav><div>'+body+'</div></div></div>';
}

P['minha-area-time']=function(){
  var p=PM[ME],t=TM[p.team],pos=ST.map(function(x){return x.t.id;}).indexOf(p.team),s=ST[pos];
  var nx=GAMES.filter(function(g){return g.st==='agendado'&&(g.h===p.team||g.a===p.team);})[0];
  var ro=t.roster,order=['GOL','LAT','ZAG','VOL','MEI','ATA'];
  // presence
  var R2=rng(77),pres=ro.map(function(x){var st=x.id===p.id?(CONF==='sim'?'ok':CONF==='nao'?'no':'wait'):(R2()<.78?'ok':R2()<.5?'no':'wait');return {x:x,st:st};});
  var nOk=pres.filter(function(o){return o.st==='ok';}).length,nNo=pres.filter(function(o){return o.st==='no';}).length,nW=20-nOk-nNo;
  var rost='';order.forEach(function(k){var xs=ro.filter(function(x){return x.pos===k;});rost+='<div class="poshead">'+POSN[k]+'s</div>'+xs.map(function(x){return '<a class="'+(x.id===p.id?'me':'')+'" href="#atleta-'+x.id+'"><span class="n">'+x.num+'</span><span><b>'+esc(x.n)+'</b><small>'+x.j+' jogos</small></span><span class="g">'+(x.g?'⚽ '+x.g:'')+'</span></a>';}).join('');});
  var next3=GAMES.filter(function(g){return g.st==='agendado'&&(g.h===p.team||g.a===p.team);}).slice(0,3);
  return area('time',
  '<div class="teamhead">'+badge(p.team,'lg')+'<div><div class="eyebrow">Meu time · 1ª Temporada</div><h1 style="font-size:clamp(38px,5vw,60px)">'+t.n+'</h1></div><div class="tstats"><span><b>'+(pos+1)+'º</b>lugar</span><span><b>'+s.pts+'</b>pontos</span><span><b>'+s.gp+'</b>gols</span><span><b>'+s.v+'-'+s.e+'-'+s.d+'</b>V-E-D</span></div></div>'+
  '<div class="grid2" style="align-items:start">'+
   '<div class="card" style="display:grid;gap:12px"><div class="between"><h3>Presença · rodada '+nx.r+'</h3><span class="lbl">'+nOk+' de 20</span></div><div class="meter2"><i style="width:'+nOk*5+'%;background:var(--ok)"></i><i style="width:'+nNo*5+'%;background:var(--red)"></i></div><div class="lbl" style="display:flex;gap:12px;flex-wrap:wrap"><span style="color:var(--ok)">'+nOk+' confirmados</span><span style="color:#F2938D">'+nNo+' não vão</span><span>'+nW+' sem resposta</span></div>'+
   '<div class="pres">'+pres.map(function(o){return '<span class="chip '+(o.st==='ok'?'ok':o.st==='no'?'no':'wait')+'">'+o.x.num+' · '+esc(o.x.n.split(' ')[0])+'</span>';}).join('')+'</div>'+
   (CONF?'':'<div class="conf"><button class="yes" data-conf2="sim">✓ Vou jogar</button><button class="no" data-conf2="nao">✕ Não vou</button></div>')+'</div>'+
   '<div class="card agenda"><h3 style="margin-bottom:4px">Agenda do time</h3>'+next3.map(function(g){var op=g.h===p.team?g.a:g.h;return '<a class="between" href="#'+g.id+'"><span class="row">'+badge(op,'sm')+'x '+tn(op)+'</span><span class="lbl">'+fmtD(g.date)+' · '+g.time+' · '+g.field+'</span></a>';}).join('')+'</div>'+
  '</div>'+
  '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:4px">Elenco</h3><div class="rost">'+rost+'</div></div>');
};

P.entrar=function(){
  return '<div class="wrap"><div class="login"><div style="text-align:center;display:grid;gap:10px;justify-items:center"><img src="'+LOGO+'" width="76" height="76" alt="" style="object-fit:contain"><h1 style="font-size:44px">Entrar</h1><p class="muted" style="margin:0">Atletas e equipe FF entram por aqui. O site leva cada um para a sua área.</p></div>'+
  '<div class="card" id="entrarF"><p class="muted" style="margin:0">Carregando…</p></div>'+
  (preOn()?'<p class="muted" style="text-align:center;font-size:14px;margin:0">Ainda não é atleta da League? <a class="more" href="#pre-inscricao">Fazer pré-inscrição</a></p>':'')+'</div></div>';
};
P['minha-area']=function(){
  var p=PM[ME],t=TM[p.team],pos=ST.map(function(x){return x.t.id;}).indexOf(p.team),s=ST[pos];
  var nx=GAMES.filter(function(g){return g.st==='agendado'&&(g.h===p.team||g.a===p.team);})[0];
  var live=LIVE.h===p.team||LIVE.a===p.team;
  var days=nx?Math.round((nx.date-LIVE.date)/864e5):0;
  return area('painel',
  '<div class="ahead"><div><div class="eyebrow">'+greet()+', '+esc(p.n.split(' ')[0])+'</div><h1>Meu painel</h1></div><span class="chip ok">✓ Atleta confirmado · 1ª Temporada</span></div>'+
  (live?'<a class="card livecard" href="#ao-vivo" style="border-color:#5E2724;margin-bottom:16px"><div class="row"><span class="live">Ao vivo · <span data-livemin2>'+LIVE.min+"'</span></span><b style=\"font-family:var(--cond);font-size:18px;text-transform:uppercase\">Seu time está em campo: "+tn(LIVE.h)+' '+LIVE.gh+' x '+LIVE.ga+' '+tn(LIVE.a)+'</b></div><span class="more">Assistir ›</span></a>':'')+
  (nx?'<div class="card next" style="margin-bottom:16px"><div style="display:grid;gap:10px"><div class="lbl" style="color:var(--gold)">Seu próximo jogo · '+(days>1?'daqui a '+days+' dias':days===1?'amanhã':'hoje')+'</div><div class="vs">'+badge(nx.h)+tn(nx.h)+'<i>x</i>'+tn(nx.a)+badge(nx.a)+'</div><div class="lbl">Rodada '+nx.r+' · '+fmtD(nx.date)+' · '+nx.time+' · '+nx.field+' · chegar 30 min antes</div></div>'+
   '<div style="display:grid;gap:8px"><span class="lbl">Você foi convocado. Confirma presença?</span><div class="conf"><button class="yes'+(CONF==='sim'?' on':'')+'" data-conf="sim">✓ Vou jogar</button><button class="no'+(CONF==='nao'?' on':'')+'" data-conf="nao">✕ Não vou</button></div></div></div>':'')+
  '<div class="grid2"><div style="display:grid;gap:16px;align-content:start">'+
   '<div class="card"><div class="between" style="margin-bottom:10px"><h3>Meus números</h3><a class="more" href="#minha-area-perfil">Perfil público ›</a></div><div class="stats" style="grid-template-columns:repeat(4,1fr)"><div><b>'+p.j+'</b><span>Jogos</span></div><div><b>'+p.g+'</b><span>Gols</span></div><div><b>'+p.a+'</b><span>Assist.</span></div><div><b>'+p.mvp+'</b><span>MVPs</span></div></div></div>'+
  '</div><div style="display:grid;gap:16px;align-content:start">'+
   '<a class="card between" href="#minha-area-time"><div class="row">'+badge(p.team,'lg')+'<div><div class="lbl">Meu time</div><b style="font-family:var(--disp);font-size:28px;text-transform:uppercase">'+t.n+'</b></div></div><div style="text-align:right"><b class="num" style="font-size:30px;font-family:var(--disp)">'+(pos+1)+'º</b><div class="lbl">'+s.pts+' pts</div></div></a>'+
   '<div class="card notices"><div class="between" style="margin-bottom:4px"><h3>Avisos da FF</h3><span class="lbl">1 novo</span></div>'+
   '<div class="n new"><span class="ic">🔒</span><div><b>Renovação prioritária</b><div class="muted" style="font-size:14px">A renovação da 2ª Temporada abre em 20/05 para quem já joga.</div><small>12/03</small></div></div>'+
   '<div class="n"><span class="ic">🎥</span><div><b>Transmissão da rodada '+LIVE.r+'</b><div class="muted" style="font-size:14px">Todos os jogos ao vivo no canal oficial.</div><small>10/03</small></div></div></div>'+
  '</div></div>');
};
P['minha-area-inscricao']=function(){
  var p=PM[ME];
  return area('insc',
  '<div class="ahead"><div><div class="eyebrow">Inscrição, kit e bônus</div><h1>Minha inscrição</h1></div></div>'+
  '<div class="grid2"><div style="display:grid;gap:16px;align-content:start">'+
   '<div class="card"><div class="between" style="margin-bottom:14px"><h3>1ª Temporada</h3><span class="chip ok">✓ Ativa</span></div><div class="steps">'+
   (preOn()?'<div class="s"><span class="d">✓</span><div><b>Pré-inscrição enviada</b><small>12/10/2026 · posição Meia · unidade '+p.unit+'</small></div><span class="lbl">Feito</span></div>':'')+
   '<div class="s"><span class="d">✓</span><div><b>Análise da FF</b><small>Score financeiro e histórico comportamental aprovados</small></div><span class="lbl">Feito</span></div>'+
   '<div class="s"><span class="d">✓</span><div><b>Vaga confirmada</b><small>Confirmada pela FF em 28/10/2026</small></div><span class="lbl">Feito</span></div>'+
   '<div class="s"><span class="d">✓</span><div><b>Kit retirado</b><small>Camisa, shorts, meião e mochila · tamanho M · unidade '+p.unit+' em 22/01/2027</small></div><span class="lbl">Feito</span></div></div></div>'+
   '<div class="card" style="display:grid;gap:12px;border-color:var(--gold2)"><div class="between wrapm"><h3>2ª Temporada</h3><span class="chip gold">🔒 Prioridade garantida</span></div><p class="muted" style="margin:0">Como você joga a 1ª Temporada, tem prioridade na renovação. A janela abre em 20/05 e novas vagas só abrem se sobrarem.</p>'+
   '<div class="fld">Tamanho do kit da próxima temporada<div class="opts" id="nkit">'+['P','M','G','GG','XG'].map(function(z){return '<label><input type="radio" name="nk" value="'+z+'"'+(z===NEXTKIT?' checked':'')+'>'+z+'</label>';}).join('')+'</div></div>'+
   '<button class="btn '+(RENEW?'':'primary')+'" id="renewBtn" style="justify-content:center">'+(RENEW?'✓ Interesse registrado · avisaremos em 20/05':'Quero continuar na 2ª Temporada')+'</button></div>'+
  '</div><div style="display:grid;gap:16px;align-content:start">'+
   '<div class="card"><h3 style="margin-bottom:8px">Bônus</h3><div class="kv"><div class="between"><span>50% na Copa FF de dezembro</span><span class="chip ok">✓ Utilizado</span></div><div class="between"><span>Festival FF · esquenta da League</span><span class="chip ok">✓ Participou</span></div><div class="between"><span>Noite de premiação</span><span class="chip gold">Incluída · junho</span></div></div></div>'+
   '<div class="card"><div class="between" style="margin-bottom:8px"><h3>Meus dados</h3><button class="btn sm" id="editBtn">Atualizar</button></div><div class="kv"><div class="between"><span>E-mail</span><span>andre.m•••@email.com</span></div><div class="between"><span>Celular</span><span>(11) 9••••-4821</span></div><div class="between"><span>Unidade FF</span><span>'+p.unit+'</span></div><div class="between"><span>Posição</span><span>'+POSN[p.pos]+'</span></div><div class="between"><span>Camisa</span><span>'+esc(p.n.split(' ').slice(-1)[0].toUpperCase())+' · Nº '+p.num+'</span></div></div></div>'+
   '<div class="card"><h3 style="margin-bottom:8px">Termos e autorizações</h3><div class="kv"><div class="between"><span>Autorização de análise (LGPD)</span><span class="lbl">12/10/2026</span></div><div class="between"><span>Condições da FF Soccer Pro League</span><span class="lbl">12/10/2026</span></div><div class="between"><span>Uso de imagem nas transmissões</span><span class="lbl">12/10/2026</span></div></div></div>'+
  '</div></div>');
};
P['minha-area-campeonatos']=function(){  var p=PM[ME],t=TM[p.team],pos=ST.map(function(x){return x.t.id;}).indexOf(p.team),s=ST[pos];  var list=[   {n:'FF Soccer Pro League · 1ª Temporada',per:'Jan → jun 2027',time:badge(p.team)+t.n,posn:POSN[p.pos],cls:(pos+1)+'º de '+ST.length+' · '+s.pts+' pts',st:'<span class="chip gold">Em andamento</span>',atual:1},   {n:'Copa FF Soccer',per:'Nov → dez 2025',time:'Fulham',posn:'Zagueiro',cls:'🥈 Vice-campeão · Série Prata',st:'<span class="chip">Encerrado</span>',top:2}];  var tit=list.filter(function(c){return c.top===1;}).length,pod=list.filter(function(c){return c.top;}).length;  return area('camp',  '<div class="ahead"><div><div class="eyebrow">Sua história na FF</div><h1>Meus campeonatos</h1></div></div>'+  '<div class="card" style="margin-bottom:16px"><div class="stats" style="grid-template-columns:repeat(3,1fr)"><div><b>'+list.length+'</b><span>Campeonatos</span></div><div><b>'+tit+'</b><span>Títulos</span></div><div><b>'+pod+'</b><span>Pódios</span></div></div></div>'+  '<div class="grid2 camps">'+list.map(function(c){return '<div class="card"'+(c.atual?' style="border-color:var(--gold2)"':'')+'><div class="between" style="margin-bottom:8px;gap:10px;align-items:flex-start"><h3>'+c.n+'</h3>'+c.st+'</div><div class="kv">'+   '<div class="between"><span>Período</span><span>'+c.per+'</span></div>'+   '<div class="between"><span>Meu time</span><span class="row" style="gap:8px">'+c.time+'</span></div>'+   '<div class="between"><span>Minha posição</span><span>'+c.posn+'</span></div>'+   '<div class="between"><span>Classificação</span><span style="text-align:right">'+c.cls+'</span></div></div>'+   '</div>';}).join('')+'</div>');};

/* ================= VIDEO MODAL ================= */
var VM={timer:null,t:0,d:0,playing:false,last:null};
function fmtT(x){return Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0');}
function openVideo(btn){
  var g=GAMES.filter(function(x){return x.id===btn.dataset.vid;})[0];if(!g)return;
  var parts=btn.dataset.dur.split(':');VM.d=(+parts[0])*60+(+parts[1]);VM.t=0;VM.last=btn;
  var goals=g.ev.filter(function(e){return e.t==='gol';}).map(function(e){return e.m+"' "+esc(PM[e.p].n.split(' ').slice(-1)[0]);}).join(' · ');
  var m=document.getElementById('vmodal');
  m.innerHTML='<div class="bd" data-close></div><div class="box"><div class="top"><div><b id="vTitle">Melhores momentos: '+tn(g.h)+' '+g.gh+' x '+g.ga+' '+tn(g.a)+'</b><small>Rodada '+g.r+' · '+fmtD(g.date)+' · '+g.field+'</small></div><button class="x" data-close aria-label="Fechar vídeo">×</button></div>'+
  '<div class="player" id="vPlayer"><canvas class="bc" data-seed="'+btn.dataset.seed+'" id="vCanvas"></canvas><div class="bug"><span>'+tn(g.h).slice(0,3).toUpperCase()+' '+g.gh+'</span><span>'+g.ga+' '+tn(g.a).slice(0,3).toUpperCase()+'</span><span class="m">REPLAY</span></div><span class="tag">Canal oficial FF Soccer · YouTube</span></div>'+
  '<div class="vctl"><button class="pp" id="vPP" aria-label="Pausar"></button><span class="t" id="vT">0:00</span><div class="track" id="vTrack"><i id="vBar" style="width:0"></i></div><span class="t">'+btn.dataset.dur+'</span></div>'+
  '<div class="vfoot"><span class="lbl">'+(goals?'⚽ '+goals:'Sem gols no jogo')+'</span><a class="more" href="#'+g.id+'" data-close-nav>Ver lances do jogo ›</a></div></div>';
  m.hidden=false;document.body.style.overflow='hidden';
  try{Scene(document.getElementById('vCanvas'));}catch(e){}
  playVideo(true);
  m.querySelector('.x').focus();
}
function ppIcon(){document.getElementById('vPP').innerHTML=VM.playing?'<svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="1" width="3.5" height="12" fill="#0B0B0A"/><rect x="8.5" y="1" width="3.5" height="12" fill="#0B0B0A"/></svg>':'<svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1l10 6-10 6z" fill="#0B0B0A"/></svg>';document.getElementById('vPP').setAttribute('aria-label',VM.playing?'Pausar':'Reproduzir');}
function paint(){var b=document.getElementById('vBar');if(!b)return;b.style.width=(VM.t/VM.d*100)+'%';document.getElementById('vT').textContent=fmtT(VM.t);}
function playVideo(on){
  var cv=document.getElementById('vCanvas'),ag=document.querySelector('#vPlayer .again');if(ag)ag.remove();
  if(on&&VM.t>=VM.d)VM.t=0;
  VM.playing=on;if(cv){if(on)delete cv.dataset.paused;else cv.dataset.paused='1';}
  clearInterval(VM.timer);
  if(on)VM.timer=setInterval(function(){VM.t=Math.min(VM.d,VM.t+.25);paint();if(VM.t>=VM.d){playVideo(false);var pl=document.getElementById('vPlayer');if(pl)pl.insertAdjacentHTML('beforeend','<div class="again"><button class="btn primary" id="vAgain">↻ Assistir de novo</button></div>');}},250);
  ppIcon();paint();
}
function closeVideo(){var m=document.getElementById('vmodal');if(m.hidden)return;clearInterval(VM.timer);m.hidden=true;m.innerHTML='';document.body.style.overflow='';if(VM.last)VM.last.focus();}
document.addEventListener('click',function(e){
  var t=e.target.closest('button.thumb[data-vid]');if(t){e.preventDefault();openVideo(t);return;}
  var m=document.getElementById('vmodal');if(m.hidden)return;
  if(e.target.closest('[data-close]')){closeVideo();return;}
  if(e.target.closest('[data-close-nav]')){clearInterval(VM.timer);m.hidden=true;m.innerHTML='';document.body.style.overflow='';return;}
  if(e.target.closest('#vPP')){playVideo(!VM.playing);return;}
  if(e.target.closest('#vAgain')){VM.t=0;playVideo(true);return;}
  var tr=e.target.closest('#vTrack');if(tr){var r=tr.getBoundingClientRect();VM.t=Math.max(0,Math.min(VM.d,(e.clientX-r.left)/r.width*VM.d));paint();}
});
document.addEventListener('keydown',function(e){var m=document.getElementById('vmodal');if(m.hidden)return;if(e.key==='Escape')closeVideo();if(e.key===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();playVideo(!VM.playing);}});
window.addEventListener('hashchange',function(){var m=document.getElementById('vmodal');if(!m.hidden){clearInterval(VM.timer);m.hidden=true;m.innerHTML='';document.body.style.overflow='';}});

/* ================= ROUTER ================= */
var app=document.getElementById('app');
var ALIAS={'':'a-league'};
// Navegação: cada página fica no histórico do navegador (voltar e avançar funcionam) e o "voltar" devolve a página na mesma altura em que estava.
// Endereços antigos e redirecionamentos trocam o endereço no lugar (replace), para o "voltar" não cair numa página que só redireciona.
var NAV={k:0,n:0,pos:{},ant:'',atual:''};
try{history.scrollRestoration='manual';}catch(e){}
try{NAV.pos=JSON.parse(sessionStorage.getItem('ffl_rolagem')||'{}')||{};}catch(e){}
window.addEventListener('scroll',function(){if(NAV.k)NAV.pos[NAV.k]=window.scrollY;},{passive:true});
window.addEventListener('pagehide',function(){try{sessionStorage.setItem('ffl_rolagem',JSON.stringify(NAV.pos));}catch(e){}});
function trocaEndereco(h){try{history.replaceState(history.state,'',location.pathname+location.search+'#'+h);}catch(e){}}
function route(){
  var orig=(location.hash||'').replace('#',''),h=orig||'a-league',page=h,arg=null;
  if(h==='classificacao'||h==='hall-da-fama'||h==='campeonato-times')h='campeonato';if(h==='minha-area-fotos')h='minha-area';if(h==='inicio')h='a-league';if(h==='campeonato-atletas')h='atletas';page=h;
  if(h==='campeonato'||h.indexOf('campeonato-')===0){page='campeonato';arg=h.slice(11)||'tabela';}
  if(/^jogo-(lib-)?\d+-\d+$/.test(h)){page='jogo';arg=h;}
  else if(/^jogos-\d+$/.test(h)){page='jogos';arg=h.split('-')[1];}
  else if(h.indexOf('atleta-')===0){page='atleta';arg=h.slice(7);}
  else if(h.indexOf('time-')===0){page='time';arg=h.slice(5);}
  else if(h.indexOf('painel-')===0){page='painel';arg=h.slice(7);}
  if(h==='sair'){logout();return;}
  if(/^minha-area/.test(page)&&!ME){page=h='entrar';}
  if(page==='entrar'&&ME){page=h='minha-area';}
  if(!P[page])page=h='a-league';
  if(ondaDaPagina(page)>ONDA||(page==='pre-inscricao'&&!preOn())){page=h='a-league';arg=null;}
  if(orig&&h!==orig)trocaEndereco(h);
  // guarda a altura da página que está saindo; página nova abre no topo, página do histórico volta para onde estava
  if(NAV.k)NAV.pos[NAV.k]=window.scrollY;
  var st=history.state;
  if(st&&st.k){NAV.k=st.k;}else{NAV.k=Date.now()+'-'+(++NAV.n);try{history.replaceState({k:NAV.k},'',location.href);}catch(e){}}
  NAV.ant=NAV.atual;NAV.atual='#'+h;
  app.innerHTML=P[page](arg);
  var navKey={jogos:'campeonato',jogo:'campeonato',atletas:'campeonato',atleta:'campeonato',time:'campeonato'}[page]||page;
  document.getElementById('acct').classList.toggle('on',/^minha-area|entrar/.test(page));
  document.querySelectorAll('#nav a').forEach(function(a){a.classList.toggle('on',a.dataset.r===navKey);});
  document.getElementById('drawer').hidden=true;document.getElementById('burger').setAttribute('aria-expanded','false');
  var y=NAV.pos[NAV.k]||0;window.scrollTo(0,y);
  if(y)setTimeout(function(){window.scrollTo(0,y);},0);  // o painel termina de desenhar logo depois
  bind(page);initCanvases();
  document.title='Site FF Soccer Pro League';
}
function bind(page){
  if(document.getElementById('rbox')){bindRound();}
  if(page==='jogos'){document.querySelectorAll('#roundSel button').forEach(function(b){b.addEventListener('click',function(){location.hash='jogos-'+b.dataset.r;});});}
  if(document.getElementById('alist')){
    var q=document.getElementById('aq'),t=document.getElementById('at'),ps=document.getElementById('ap'),out=document.getElementById('alist');
    q.value=SEARCH||'';SEARCH='';
    function f(){var v=q.value.trim().toLowerCase(),list=PLAYERS.filter(function(p){return (!t.value||p.team===t.value)&&(!ps.value||p.pos===ps.value)&&(!v||p.n.toLowerCase().indexOf(v)>=0||String(p.num)===v);}).sort(function(a,b){return b.g-a.g||b.mvp-a.mvp||a.n.localeCompare(b.n);});
      out.innerHTML=list.length?list.slice(0,60).map(athCard).join(''):'<p class="muted">Nenhum atleta encontrado.</p>';}
    [q,t,ps].forEach(function(el){el.addEventListener('input',f);});f();
  }
  if(page==='entrar'){
    var db=document.getElementById('demoBtn');if(db)db.addEventListener('click',function(){login('falcoes-10');toast('Bem-vindo, André!');});
    if(window.entrarIniciar)entrarIniciar();
  }
  if(/^minha-area/.test(page)){var lo=document.getElementById('doLogout');lo.addEventListener('click',function(e){e.preventDefault();logout();});}
  if(page==='minha-area'){document.querySelectorAll('[data-conf]').forEach(function(b){b.addEventListener('click',function(){CONF=b.dataset.conf;document.querySelectorAll('[data-conf]').forEach(function(x){x.classList.toggle('on',x===b);});toast(CONF==='sim'?'Presença confirmada. Bom jogo!':'Tudo bem. A equipe FF foi avisada.');});});}

  if(page==='minha-area-time'){
    document.querySelectorAll('[data-conf2]').forEach(function(b){b.addEventListener('click',function(){CONF=b.dataset.conf2;toast(CONF==='sim'?'Presença confirmada. Bom jogo!':'Tudo bem. A equipe FF foi avisada.');route();});});
  }
  if(page==='minha-area-inscricao'){
    document.querySelectorAll('#nkit input').forEach(function(i){i.addEventListener('change',function(){NEXTKIT=i.value;toast('Tamanho '+i.value+' salvo para a 2ª Temporada.');});});
    var rb=document.getElementById('renewBtn');rb.addEventListener('click',function(){if(RENEW)return;RENEW=true;rb.className='btn';rb.textContent='✓ Interesse registrado · avisaremos em 20/05';toast('Interesse registrado. Sua vaga prioritária está garantida até 20/05.');});
    document.getElementById('editBtn').addEventListener('click',function(){toast('No site final, abre a edição dos seus dados com confirmação por e-mail.');});
  }
  if(page==='pre-inscricao'){
    var fN=document.getElementById('fNum'),fC=document.getElementById('fNomeC');
    document.querySelectorAll('.fnum').forEach(function(el){el.addEventListener('input',function(){el.value=el.value.replace(/\D/g,'').slice(0,2);document.getElementById('shM').textContent=fN.value||'10';});});
    fC.addEventListener('input',function(){fC.value=fC.value.replace(/[^A-Za-zÀ-ÿ .'-]/g,'');document.getElementById('shN').textContent=fC.value.trim().toUpperCase()||'SEU NOME';});
    var fm=document.getElementById('preForm');
    fm.addEventListener('submit',function(e){e.preventDefault();fm.classList.add('tried');
      var req=['fNome','fEmail','fCel','fNasc','fUnid','fPos1','fPos2','fPos3','fNum','fNum2','fNum3','fNomeC'],bad=req.filter(function(id){var el=document.getElementById(id);return !el.value.trim()||(el.type==='email'&&!/^\S+@\S+\.\S+$/.test(el.value))||(/^fNum/.test(id)&&!(+el.value>=1&&+el.value<=99));});
      var err=document.getElementById('fErr');
      if(bad.length){err.textContent=(/^fNum/.test(bad[0])&&document.getElementById(bad[0]).value)?'Os números da camisa precisam ser de 1 a 99.':'Preencha todos os campos, incluindo as 3 posições, os 3 números e o nome na camisa, para continuar.';document.getElementById(bad[0]).focus();return;}
      var poss=['fPos1','fPos2','fPos3'].map(function(id){return document.getElementById(id).value;}),nums=['fNum','fNum2','fNum3'].map(function(id){return +document.getElementById(id).value;});
      if(poss[0]===poss[1]||poss[0]===poss[2]||poss[1]===poss[2]){err.textContent='Escolha três posições diferentes.';document.getElementById('fPos2').focus();return;}
      if(nums[0]===nums[1]||nums[0]===nums[2]||nums[1]===nums[2]){err.textContent='Escolha três números de camisa diferentes.';document.getElementById('fNum2').focus();return;}
      if(!document.getElementById('fLgpd').checked||!document.getElementById('fTerm').checked){err.textContent='Para enviar, marque a autorização de análise e o aceite das condições.';return;}
      var v=function(id){return document.getElementById(id).value.trim();};
      var chk=function(n){var x=document.querySelector('input[name="'+n+'"]:checked');return x?x.value:'';};
      var payload={nome:v('fNome'),email:v('fEmail'),celular:v('fCel'),nascimento:v('fNasc'),unidade:v('fUnid'),posicao:poss.map(function(k){return POSN[k];}).join(' · '),posicoes:poss.map(function(k){return POSN[k];}),kit:chk('kit'),numero:nums[0],numeros:nums,nome_camisa:v('fNomeC').toUpperCase(),
        aceite_lgpd:document.getElementById('tLgpd').textContent,aceite_termos:document.getElementById('tTerm').textContent,versao_termos:CONFIG.VERSAO_TERMOS,origem:location.href.split('#')[0],hp:document.getElementById('fHp').value};
      if(!CONFIG.SUPABASE_URL||!CONFIG.SUPABASE_KEY){err.textContent='As pré-inscrições abrem em breve. Acompanhe a FF Soccer para saber a data.';return;}
      var btn=document.getElementById('fSend');btn.disabled=true;btn.textContent='Enviando…';err.textContent='';
      // grava direto no banco (função enviar_pre_inscricao), que devolve {ok, protocolo, duplicado}
      fetch(CONFIG.SUPABASE_URL+'/rest/v1/rpc/enviar_pre_inscricao',{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({dados:payload})}).then(function(r){return r.json();}).then(function(res){
        if(!res||!res.ok)throw new Error(res&&res.erro||'falha');
        fm.innerHTML='<div class="okbox"><span class="ck">✓</span><h2>Pré-inscrição recebida</h2><p class="muted" style="margin:0;max-width:44ch">Obrigado, '+esc(payload.nome.split(' ')[0])+'. Sua pré-inscrição entrou na fila de análise da FF. Você recebe o retorno por e-mail ou WhatsApp.</p><span class="chip">Camisa: '+esc(payload.nome_camisa)+' · Nº '+payload.numero+'</span><span class="chip gold">Protocolo '+esc(res.protocolo||'')+'</span>'+(res.duplicado?'<span class="hint">Já tínhamos uma pré-inscrição com este e-mail. Registramos esta como atualização.</span>':'')+'<a class="btn" href="#a-league">Voltar ao início</a></div>';
        window.scrollTo(0,0);
      }).catch(function(){btn.disabled=false;btn.textContent='Enviar pré-inscrição';err.textContent='Não conseguimos enviar agora. Confira sua internet e tente de novo em alguns minutos.';});
    });
  }
}
var SEARCH='';
document.getElementById('burger').addEventListener('click',function(){var d=document.getElementById('drawer');d.hidden=!d.hidden;
  // o menu do celular abre logo abaixo do cabeçalho (com ?demo, a tarja amarela empurra o cabeçalho para baixo)
  if(!d.hidden){var hb=document.querySelector('.hdr').getBoundingClientRect().bottom;d.style.top=Math.max(0,Math.round(hb))+'px';}
  this.setAttribute('aria-expanded',String(!d.hidden));});
window.addEventListener('hashchange',route);

/* ticker + live clock */
function ticker(){
  if(!document.getElementById('ticker'))return;  // faixa de resultados tirada em 23/10/2026
  var items=GAMES.filter(function(g){return g.r===CUR;}).map(function(g){
    var s=g.st==='ao vivo'?'<span class="live">'+g.min+"'</span>":g.st==='encerrado'?'<span class="lbl">Fim</span>':'<span class="lbl">'+fmtD(g.date)+' '+g.time+'</span>';
    return '<a href="#'+g.id+'">'+s+' '+tn(g.h)+' <b>'+(g.gh==null?'':g.gh)+'</b> x <b>'+(g.ga==null?'':g.ga)+'</b> '+tn(g.a)+'</a>';});
  var tk=document.getElementById('ticker');if(!tk)return;  // faixa de resultados tirada em 23/10/2026
  tk.innerHTML='<span class="lbl" style="color:var(--gold)">Rodada '+CUR+'</span>'+items.join('<span class="sep">|</span>');
}
acct();
ticker();
setInterval(function(){
  if(LIVE&&LIVE.min0&&LIVE.min<90){LIVE.min++;
    document.querySelectorAll('[data-livemin],[data-livemin2]').forEach(function(e){e.textContent=LIVE.min+"'";});
    document.querySelectorAll('[data-livepill]').forEach(function(e){e.textContent=(LIVE.min<=45?'1º':'2º')+' tempo · '+LIVE.min+"'";});
    var v=186+Math.floor((LIVE.min-(LIVE.min0||67))*2.3);document.querySelectorAll('[data-viewers]').forEach(function(e){e.textContent=v;});
    ticker();}
},20000);

aplicarOnda();
// Desenha só depois de todos os scripts (o painel.js vem depois deste arquivo e define o login).
document.addEventListener('DOMContentLoaded',function(){
  if(ONDA<2)route();  // onda 1 não mostra dados de jogos: não espera o banco
  else carregarBanco(function(){if(ME&&!PM[ME])ME=null;acct();CLR=CUR;ticker();route();});
});
