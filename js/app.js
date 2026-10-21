/* Páginas, menu, área logada (demonstração), pop-up de vídeo, roteador e pré-inscrição. */
var LOGO='assets/escudo.webp';
/* ================= ONDAS DE LANÇAMENTO =================
   CONFIG.ONDA diz o que já está no ar; o resto some do menu e das rotas. ?demo mostra tudo (apresentações). */
var DEMO=/[?&]demo(=|&|$)/.test(location.search),ONDA=DEMO?99:(CONFIG.ONDA||99);
function ondaDaPagina(pg){return ({libertadores:1,'a-league':1,'pre-inscricao':1,entrar:1,painel:1,'ao-vivo':3})[pg]||(/^minha-area/.test(pg)?4:2);}
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
function badge(tid,cls){var t=TM[tid];return '<span class="badge '+(cls||'')+'" style="background:'+t.c+'">'+t.n[0]+'</span>';}
function tn(tid){return TM[tid].n;}
function avBg(id){return FOTOS[id]?'background:url('+FOTOS[id]+') center 18%/cover;':'';}function esc(s){return String(s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function statusChip(g){if(g.st==='ao vivo')return '<span class="live">Ao vivo · '+g.min+"'</span>";if(g.st==='encerrado')return '<span class="lbl">Encerrado</span>';return '<span class="lbl">'+fmtD(g.date)+' · '+g.time+'</span>';}
function gameCard(g){
  var done=g.st!=='agendado',hl=done&&g.gh<g.ga,al=done&&g.ga<g.gh;
  return '<a class="game'+(g.st==='ao vivo'?' is-live':'')+'" href="#'+g.id+'"><div class="between">'+statusChip(g)+'<span class="lbl">'+g.field+'</span></div>'+
  '<div class="line'+(hl?' lose':'')+'">'+badge(g.h,'sm')+tn(g.h)+'<b>'+(done?g.gh:'–')+'</b></div>'+
  '<div class="line'+(al?' lose':'')+'">'+badge(g.a,'sm')+tn(g.a)+'<b>'+(done?g.ga:'–')+'</b></div>'+
  '<div class="foot"><span>Rodada '+g.r+'</span><span>'+(g.st==='agendado'?'Ao vivo no YouTube':g.st==='ao vivo'?'Assistir ▸':'Replay ▸')+'</span></div></a>';
}
function tableHTML(rows,full){
  var h='<div class="tblw"><table class="tbl"><thead><tr><th class="l">#</th><th class="l">Time</th><th>Pts</th><th>J</th><th>V</th>'+(full?'<th>E</th><th>D</th><th>GP</th><th>GC</th>':'')+'<th>SG</th>'+(full?'<th class="l">Últimos</th>':'')+'</tr></thead><tbody>';
  rows.forEach(function(x,i){h+='<tr><td class="pos l'+(i<4?' q':'')+'">'+(i+1)+'</td><td class="l"><a class="row" style="gap:8px" href="#time-'+x.t.id+'">'+badge(x.t.id,'sm')+x.t.n+'</a></td><td class="pts">'+x.pts+'</td><td>'+x.j+'</td><td>'+x.v+'</td>'+(full?'<td>'+x.e+'</td><td>'+x.d+'</td><td>'+x.gp+'</td><td>'+x.gc+'</td>':'')+'<td>'+(x.sg>0?'+':'')+x.sg+'</td>'+(full?'<td class="l"><span class="form">'+x.f.slice(-5).map(function(f){return '<i class="'+f+'">'+f+'</i>';}).join('')+'</span></td>':'')+'</tr>';});
  return h+'</tbody></table></div>';
}
function scorersHTML(list,n,key){key=key||'g';if(!list.length)return '<p class="muted" style="margin:10px 0 0">Nenhum registro ainda.</p>';return '<div class="list">'+list.slice(0,n).map(function(p,i){return '<a class="it" href="#atleta-'+p.id+'"><span class="p">'+(i+1)+'</span><span class="row" style="gap:10px">'+badge(p.team,'sm')+'<span>'+esc(p.n)+'<small>'+tn(p.team)+' · '+POSN[p.pos]+'</small></span></span><b class="v">'+p[key]+'</b></a>';}).join('')+'</div>';}
function playerBox(opts){
  return '<div class="player"'+(opts.id?' id="'+opts.id+'"':'')+'><canvas class="bc" data-seed="'+(opts.seed||11)+'"'+(opts.st?' data-static="1"':'')+'></canvas>'+(opts.bug||'')+(opts.live?'<span class="live">Ao vivo</span>':'')+(opts.tag?'<span class="tag">'+opts.tag+'</span>':'')+(opts.bar?'<div class="ytbar"><div class="prog"></div><div class="ctl"><span>● Ao vivo</span><span>'+opts.bar+'</span><span class="sp">HD · ⛶</span></div></div>':'')+(opts.dur?'<span class="dur">'+opts.dur+'</span>':'')+(opts.play?'<span class="play"><i><svg width="16" height="16" viewBox="0 0 16 16"><path d="M5 3l8 5-8 5z" fill="#fff"/></svg></i></span>':'')+'</div>';
}
function liveBug(){return '<div class="bug"><span>'+tn(LIVE.h).slice(0,3).toUpperCase()+' '+LIVE.gh+'</span><span>'+LIVE.ga+' '+tn(LIVE.a).slice(0,3).toUpperCase()+'</span><span class="m" data-livemin>'+LIVE.min+"'</span></div>";}

/* ================= PAGES ================= */
var P={};
P.inicio=function(){
  var lead=ST[0],cr=craqueOf(CUR-1),rg=GAMES.filter(function(g){return g.r===CUR;});
  var nextG=GAMES.filter(function(g){return g.r===CUR+1;});
  return ''+
  '<section class="hero"><div class="wrap">'+
   '<div class="hero-txt"><div class="eyebrow">1ª Temporada · Rodada '+CUR+'</div>'+
   '<h1>'+tn(LIVE.h)+' e '+tn(LIVE.a)+'<span> ao vivo agora</span></h1>'+
   '<p class="lead">'+(lead.j?tn(lead.t.id)+' lidera com '+lead.pts+' pontos depois de '+lead.j+' jogos. ':'A temporada começa agora. ')+'Hoje, '+tn(LIVE.h)+' e '+tn(LIVE.a)+' fazem o jogo da rodada no '+LIVE.field+'.</p>'+
   '<div class="card" style="padding:18px"><div class="sb"><div class="t">'+badge(LIVE.h,'lg')+tn(LIVE.h)+'</div><div class="s">'+LIVE.gh+'<i>:</i>'+LIVE.ga+'</div><div class="t">'+badge(LIVE.a,'lg')+tn(LIVE.a)+'</div></div><div class="between" style="margin-top:10px"><span class="live" data-livepill>'+(LIVE.min<=45?'1º':'2º')+' tempo · '+LIVE.min+"'</span><a class=\"more\" href=\"#"+LIVE.id+'">Lances e VAR ›</a></div></div>'+
   '<div class="cta-row"><a class="btn primary" href="#ao-vivo">▶ Assistir ao vivo</a><a class="btn" href="#campeonato">Tabela e jogos</a></div></div>'+
   '<a href="#ao-vivo">'+playerBox({seed:11,bug:liveBug(),live:1,tag:'Canal oficial FF Soccer · YouTube',bar:'<span data-viewers>186</span> assistindo'})+'</a>'+
  '</div></section>'+

  '<section class="blk"><div class="wrap"><div class="sec-h"><div><div class="eyebrow">Rodada '+CUR+' · '+fmtD(rg[0].date)+' e '+fmtD(rg[2].date)+'</div><h2>Jogos da rodada</h2></div><a class="more" href="#campeonato">Todos os jogos ›</a></div>'+
  '<div class="games compact">'+rg.map(gameCard).join('')+'</div></div></section>'+

  '<section class="blk"><div class="wrap grid2" style="align-items:stretch">'+
   '<div class="card" style="display:grid;gap:10px;align-content:start"><div class="between"><h3>Classificação</h3><span class="lbl">Top 4 · zona de semifinal</span></div>'+tableHTML(ST.slice(0,4),false)+'<a class="btn" href="#campeonato" style="justify-content:center;margin-top:6px">Ver tabela completa</a></div>'+
    (cr?'<a class="craque" data-n="'+cr.p.num+'" href="#atleta-'+cr.p.id+'"><span class="k">Craque da rodada '+(CUR-1)+'</span><span class="nm">'+esc(cr.p.n).replace(' ','<br>')+'</span><span class="sub">'+tn(cr.p.team)+' · '+cr.gl+' gol'+(cr.gl===1?'':'s')+' contra '+tn(cr.g.h===cr.p.team?cr.g.a:cr.g.h)+'</span><span class="by">Apresentado por · espaço do patrocinador</span></a>':'')+
  '</div></section>'+

  '<section class="blk"><div class="wrap grid2">'+
   '<div class="card"><div class="between" style="margin-bottom:6px"><h3>Próxima rodada</h3><span class="lbl">Rodada '+(CUR+1)+'</span></div><div class="agenda">'+nextG.map(function(g){return '<a class="between" href="#'+g.id+'"><span class="row">'+badge(g.h,'sm')+tn(g.h)+' <span class="muted">x</span> '+tn(g.a)+badge(g.a,'sm')+'</span><span class="lbl">'+fmtD(g.date)+' · '+g.time+'</span></a>';}).join('')+'</div></div>'+
   '<div class="card" style="display:grid;gap:12px;align-content:start"><h3>Encontre seu perfil</h3><p class="muted" style="margin:0">Gols e MVPs de cada atleta, temporada após temporada.</p><form id="homeSearch" class="row"><input id="homeQ" type="search" placeholder="Nome do atleta" style="flex:1;background:var(--bg2);border:1px solid var(--line2);border-radius:10px;padding:11px 14px;color:var(--ink);min-width:0"><button class="btn primary sm" type="submit">Buscar</button></form></div>'+
  '</div></section>'+

  '<section class="blk"><div class="wrap"><div class="sec-h"><div><div class="eyebrow">Calendário FF 2027</div><h2>Uma temporada inteira</h2></div><a class="more" href="#a-league">Como funciona ›</a></div>'+
  '<div class="season"><div class="now"><b>Fev → Jun</b><span>FF Soccer Pro League · 1ª Temporada · em andamento</span></div><div><b>Julho</b><span>Copa FF</span></div><div><b>Ago → Dez</b><span>FF Soccer Pro League · 2ª Temporada</span></div></div></div></section>'+

  '<section class="blk"><div class="wrap"><div class="renew"><img src="'+LOGO+'" width="90" height="90" alt="" style="object-fit:contain"><div style="display:grid;gap:8px"><div class="eyebrow">Vagas limitadas</div><h2>2ª Temporada · agosto a dezembro</h2><p class="muted" style="margin:0">Quem joga a 1ª Temporada tem prioridade para continuar. Novas vagas só abrem se sobrarem.</p></div>'+(preOn()?'<a class="btn primary" href="#pre-inscricao">Fazer pré-inscrição</a>':'')+'</div></div></section>'+

  '<section class="blk"><div class="wrap"><div class="sec-h"><div><div class="eyebrow">Parceiros da League</div><h2>Patrocinadores</h2></div></div><div class="sponsors"><div>Seu logo aqui</div><div>Seu logo aqui</div><div>Seu logo aqui</div><div>Seu logo aqui</div><div>Seu logo aqui</div></div></div></section>';
};

P.jogos=function(q){
  var r=+(q||CUR);if(!(r>=1&&r<=ROUNDS))r=CUR;
  var gs=GAMES.filter(function(g){return g.r===r;});
  return '<div class="wrap"><div class="phead"><div class="eyebrow">1ª Temporada · primeira fase</div><h1>Jogos</h1><p class="lead">Quartas e sextas à noite. Todos os jogos com transmissão ao vivo pelo canal oficial da FF no YouTube.</p></div>'+
  '<div class="days" id="roundSel">'+Array.from({length:ROUNDS},function(_,i){return '<button data-r="'+(i+1)+'" class="'+(i+1===r?'on':'')+'">Rodada '+(i+1)+'</button>';}).join('')+'</div>'+
  [0,2].map(function(k){return '<h3 style="margin:22px 0 12px">'+fmtD(gs[k].date)+'</h3><div class="games">'+gs.slice(k,k+2).map(gameCard).join('')+'</div>';}).join('')+'</div>';
};

P.jogo=function(id){
  var g=GAMES.filter(function(x){return x.id===id;})[0];if(!g)return P.jogos();
  var done=g.st!=='agendado';
  var ev=g.ev.slice().reverse().map(function(e){var side=tn(e.side==='h'?g.h:g.a);
    if(e.t==='gol')return '<div class="ev"><span class="m">'+e.m+"'</span><div>⚽ Gol · <a href=\"#atleta-"+e.p+'">'+esc(PM[e.p].n)+'</a><small>'+side+(e.as?' · assistência de '+esc(PM[e.as].n):'')+'</small></div></div>';
    if(e.t==='amarelo')return '<div class="ev"><span class="m">'+e.m+"'</span><div>🟨 Cartão amarelo · "+esc(PM[e.p].n)+'<small>'+side+'</small></div></div>';
    if(e.t==='var')return '<div class="ev"><span class="m">'+e.m+"'</span><div>🖥️ Desafio de VAR · "+side+'<small>'+e.txt+'</small></div></div>';
    return '<div class="ev"><span class="m">'+e.m+"'</span><div>🔄 Substituições<small>"+e.txt+'</small></div></div>';}).join('');
  function dots(n){return '<span class="var-dots"><i class="'+(n<2?'u':'')+'"></i><i class="'+(n<1?'u':'')+'"></i></span>';}
  return '<div class="wrap"><div class="phead"><a class="more" href="#jogos-'+g.r+'">‹ Rodada '+g.r+'</a></div>'+
  '<div class="grid2"><div style="display:grid;gap:18px">'+
   '<div class="card" style="padding:24px"><div class="between" style="margin-bottom:14px">'+statusChip(g)+'<span class="lbl">'+fmtD(g.date)+' · '+g.time+' · '+g.field+'</span></div><div class="sb"><a class="t" href="#time-'+g.h+'">'+badge(g.h,'lg')+tn(g.h)+'</a><div class="s">'+(done?g.gh+'<i>:</i>'+g.ga:'<i>x</i>')+'</div><a class="t" href="#time-'+g.a+'">'+badge(g.a,'lg')+tn(g.a)+'</a></div></div>'+
   (g.st==='agendado'?'<div class="card"><h3>Transmissão ao vivo</h3><p class="muted" style="margin:6px 0 0">Este jogo será transmitido pelo canal oficial da FF no YouTube e aparece aqui na hora do jogo.</p></div>':
   '<a href="#ao-vivo">'+playerBox(g.st==='ao vivo'?{seed:11,bug:liveBug(),live:1,bar:'186 assistindo'}:{seed:40+g.r*3+g.i,st:1,play:1,dur:'1:32:10',tag:'Replay do jogo completo'})+'</a>')+
  '</div><div style="display:grid;gap:18px;align-content:start">'+
   (done?'<div class="card"><h3 style="margin-bottom:8px">Lances</h3><div class="tl">'+(ev||'<p class="muted">Sem lances registrados.</p>')+'</div></div>':'')+
   '<div class="card" style="display:grid;gap:10px"><h3>Desafios de VAR</h3><div class="between"><span>'+tn(g.h)+'</span>'+dots(g.varH)+'</div><div class="between"><span>'+tn(g.a)+'</span>'+dots(g.varA)+'</div><span class="lbl">2 por equipe · pênalti, impedimento e agressão</span></div>'+
   (g.mvp?'<a class="card between" href="#atleta-'+g.mvp+'"><div><div class="lbl">Craque do jogo</div><b style="font-family:var(--cond);font-size:20px;text-transform:uppercase">'+esc(PM[g.mvp].n)+'</b></div><span class="chip gold">⭐ MVP</span></a>':'')+
  '</div></div></div>';
};

P.classificacao=function(){
  return '<div class="wrap"><div class="phead"><div class="eyebrow">1ª Temporada · primeira fase</div><h1>Classificação</h1><p class="lead">Atualizada automaticamente ao fim de cada súmula. Os 4 primeiros avançam às semifinais.</p></div>'+
  '<div class="clsgrid"><div class="card" style="padding:20px 20px 16px"><h2 class="blkh">Tabela</h2>'+classTable()+'</div>'+
  '<div class="card" style="padding:20px"><h2 class="blkh">Jogos</h2><div id="rbox">'+roundBox(CLR)+'</div></div></div>'+
  '<div class="grid3" style="margin-top:18px"><div class="card"><h3>Artilharia</h3>'+scorersHTML(SCORERS,10)+'</div><div class="card"><h3>Assistências</h3>'+scorersHTML(PLAYERS.filter(function(p){return p.a>0;}).sort(function(a,b){return b.a-a.a||b.g-a.g;}),10,'a')+'</div><div class="card"><h3>MVPs</h3>'+scorersHTML(MVPS,10,'mvp')+'</div></div></div>';
};

/* ================= LIBERTADORES FF: fase de grupos (DADOS DE EXEMPLO) =================
   3 grupos com 4 times (nenhum brasileiro). Ida e volta: 6 rodadas, 2 jogos por rodada.
   A tabela é calculada a partir dos placares (r), como na FF Pro League. Por enquanto, sem jogos: todos zerados.
   Cada placar entra em r na ordem de LIB_JOGOS, ex.: r:[[2,0],[1,1],...]. */
var LIB_GRUPOS=[
  {g:'A',t:[['River Plate','#E2463F'],['Peñarol','#F2C14D'],['Colo-Colo','#CFCFCF'],['Barcelona SC','#F08A3C']],
   r:[]},
  {g:'B',t:[['Boca Juniors','#3B6FD6'],['Nacional','#8FB8E8'],['Olimpia','#B9B9B9'],['Atlético Nacional','#3FA34D']],
   r:[]},
  {g:'C',t:[['Estudiantes','#D9534F'],['LDU Quito','#E9E3D0'],['Cerro Porteño','#C0392B'],['Universitario','#E8D9A8']],
   r:[]}];
// confrontos de cada rodada (índices dos times): 1º turno e returno
var LIB_JOGOS=[[0,1],[2,3],[0,2],[1,3],[0,3],[1,2],[1,0],[3,2],[2,0],[3,1],[3,0],[2,1]];
function libTabela(G,ate){
  var s=G.t.map(function(t,i){return {i:i,n:t[0],c:t[1],pts:0,j:0,v:0,e:0,d:0,gp:0,gc:0,f:[]};});
  LIB_JOGOS.slice(0,ate).forEach(function(m,k){var a=s[m[0]],b=s[m[1]],x=G.r[k][0],y=G.r[k][1];
    a.j++;b.j++;a.gp+=x;a.gc+=y;b.gp+=y;b.gc+=x;
    if(x>y){a.v++;a.pts+=3;b.d++;a.f.push('V');b.f.push('D');}else if(x<y){b.v++;b.pts+=3;a.d++;a.f.push('D');b.f.push('V');}else{a.e++;b.e++;a.pts++;b.pts++;a.f.push('E');b.f.push('E');}});
  s.forEach(function(x){x.sg=x.gp-x.gc;});
  return s.sort(function(a,b){return b.pts-a.pts||b.v-a.v||b.sg-a.sg||b.gp-a.gp||a.n.localeCompare(b.n);});
}
function libGrupoHTML(G){
  var n=G.r.length,st=libTabela(G,n),antes={};libTabela(G,Math.max(0,n-2)).forEach(function(x,i){antes[x.i]=i;});
  var cols=['P','J','V','E','D','GP','GC','SG','%'];
  var h='<div class="tblw"><table class="ctbl libt"><colgroup><col style="width:40px"><col style="width:30%"><col style="width:52px">'+cols.map(function(){return '<col>';}).join('')+'<col style="width:120px"></colgroup><thead><tr><th class="l" colspan="3">Classificação</th>'+cols.map(function(c,i){return '<th class="'+(i%2?'c-odd':'')+'">'+c+'</th>';}).join('')+'<th>Últ. jogos</th></tr></thead><tbody>';
  st.forEach(function(x,i){
    var d=antes[x.i]-i,mv=d>0?'<span class="up">▲</span> '+d:d<0?'<span class="dn">▼</span> '+(-d):'<span>■</span> 0';
    var vals=[x.pts,x.j,x.v,x.e,x.d,x.gp,x.gc,(x.sg>0?'+':'')+x.sg,x.j?Math.round(x.pts/(x.j*3)*100):0];
    h+='<tr class="'+(i<2?'q':'')+'"><td class="pos">'+(i+1)+'</td><td class="team"><span class="row" style="gap:10px"><span class="badge sm" style="background:'+x.c+'">'+x.n[0]+'</span>'+esc(x.n)+'</span></td><td class="mv">'+mv+'</td>'+
    vals.map(function(v,k){return '<td class="'+(k===0?'pts':(k%2?'c-odd':''))+'">'+v+'</td>';}).join('')+
    '<td><span class="dots">'+x.f.slice(-5).map(function(f){return '<i class="'+f+'" title="'+({V:'Vitória',E:'Empate',D:'Derrota'})[f]+'"></i>';}).join('')+'</span></td></tr>';
  });
  return '<div class="card" style="padding:20px 20px 16px"><h2 class="blkh">Grupo '+G.g+'</h2>'+h+'</tbody></table></div></div>';
}
function libEstatHTML(){
  return '<div class="grid4" style="margin-bottom:40px">'+['Artilharia','Assistências','Cartões amarelos','MVPs'].map(function(x){return '<div class="card"><h3>'+x+'</h3>'+scorersHTML([],10)+'</div>';}).join('')+'</div>';
}
// Jogos da Libertadores (DADOS DE EXEMPLO): 6 rodadas às quartas, 2 jogos de cada grupo por rodada.
// Cada grupo tem o seu quadro de jogos, ao lado da tabela do grupo, com a sua própria rodada (LR).
var LIB_DATAS=['04/11','11/11','18/11','25/11','02/12','09/12'],LIB_HORA={A:'19h30',B:'20h30',C:'21h30'},LR={A:1,B:1,C:1};
function libBadge(t){return '<span class="badge sm" style="background:'+t[1]+'">'+t[0][0]+'</span>';}
function libJogosBox(G){
  var r=LR[G.g],seta=function(d,dis,pth,lbl){return '<button class="lnav" data-g="'+G.g+'" data-d="'+d+'" aria-label="'+lbl+'"'+(dis?' disabled':'')+'><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="'+pth+'"/></svg></button>';};
  return '<div class="rnav">'+seta(-1,r<=1,'M11 3L5 9l6 6','Rodada anterior')+'<b>'+r+'ª Rodada</b>'+seta(1,r>=6,'M7 3l6 6-6 6','Próxima rodada')+'</div>'+
  [0,1].map(function(k){var m=LIB_JOGOS[(r-1)*2+k],h=G.t[m[0]],a=G.t[m[1]];return '<div class="rgame"><div class="meta">Campo '+(k+1)+' &nbsp;<b>'+LIB_DATAS[r-1]+' · Quarta · '+LIB_HORA[G.g]+'</b></div>'+
    '<div class="ln"><span class="h">'+esc(h[0])+libBadge(h)+'</span><span class="sc"></span><span class="x">×</span><span class="sc"></span><span class="a">'+libBadge(a)+esc(a[0])+'</span></div></div>';}).join('');
}
document.addEventListener('click',function(e){var b=e.target.closest('button.lnav');if(!b||b.disabled)return;var g=b.dataset.g;LR[g]=Math.min(6,Math.max(1,LR[g]+(+b.dataset.d)));
  var G=LIB_GRUPOS.filter(function(x){return x.g===g;})[0];document.getElementById('lbox-'+g).innerHTML=libJogosBox(G);});
function libGruposHTML(){
  return '<div style="display:grid;gap:18px">'+LIB_GRUPOS.map(function(G){return '<div class="clsgrid">'+libGrupoHTML(G)+
    '<div class="card" style="padding:20px"><h2 class="blkh">Jogos · Grupo '+G.g+'</h2><div id="lbox-'+G.g+'">'+libJogosBox(G)+'</div></div></div>';}).join('')+'</div>'+
  '<div class="legend" style="margin-bottom:40px"><span><i style="width:10px;height:10px;background:var(--gold);border-radius:2px;display:inline-block"></i>Próxima fase</span><span><span class="dots"><i class="V"></i></span>Vitória</span><span><span class="dots"><i class="E"></i></span>Empate</span><span><span class="dots"><i class="D"></i></span>Derrota</span></div>';
}

function camp(tab,body){
  var tabs=[['tabela','Tabela e jogos','campeonato'],['estatisticas','Estatísticas','campeonato-estatisticas']];
  // Divisão por competição: Libertadores FF (ainda sem dados) e FF Pro League (tudo o que já existe)
  var lib=tab.indexOf('libertadores')===0,comps=[['libertadores','Libertadores FF','campeonato-libertadores'],['pro','FF Pro League','campeonato']];
  return '<div class="wrap"><div class="phead"><div class="eyebrow">'+(lib?'Fut7 · fase de grupos':'1ª Temporada · primeira fase')+'</div><h1>Campeonato</h1><p class="lead">'+(lib?'Tabela, jogos e números da Libertadores FF, atualizados a cada súmula.':'Tabela, jogos, números e todos os atletas da FF Soccer Pro League, atualizados a cada súmula.')+'</p></div>'+
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
function prevPositions(){
  var fin=GAMES.filter(function(g){return g.st==='encerrado';}),last=CUR-1;
  var S={};TEAMS.forEach(function(t){S[t.id]={id:t.id,pts:0,v:0,sg:0,gp:0};});
  fin.filter(function(g){return g.r<last;}).forEach(function(g){var h=S[g.h],a=S[g.a];h.gp+=g.gh;a.gp+=g.ga;h.sg+=g.gh-g.ga;a.sg+=g.ga-g.gh;if(g.gh>g.ga){h.pts+=3;h.v++;}else if(g.gh<g.ga){a.pts+=3;a.v++;}else{h.pts++;a.pts++;}});
  var o=Object.keys(S).map(function(k){return S[k];}).sort(function(a,b){return b.pts-a.pts||b.v-a.v||b.sg-a.sg||b.gp-a.gp;}),m={};o.forEach(function(x,i){m[x.id]=i;});return m;
}
function classTable(){
  var pv=prevPositions();
  var cols=['P','J','V','E','D','GP','GC','SG','%'];
  var h='<div class="tblw"><table class="ctbl"><thead><tr><th class="l" colspan="3">Classificação</th>'+cols.map(function(c,i){return '<th class="'+(i%2?'c-odd':'')+'">'+c+'</th>';}).join('')+'<th>Últ. jogos</th></tr></thead><tbody>';
  ST.forEach(function(x,i){
    var d=pv[x.t.id]-i,mv=d>0?'<span class="up">▲</span> '+d:d<0?'<span class="dn">▼</span> '+(-d):'<span>■</span> 0';
    var pct=x.j?Math.round(x.pts/(x.j*3)*100):0;
    var vals=[x.pts,x.j,x.v,x.e,x.d,x.gp,x.gc,(x.sg>0?'+':'')+x.sg,pct];
    h+='<tr class="'+(i<4?'q':'')+'"><td class="pos">'+(i+1)+'</td><td class="team"><a href="#time-'+x.t.id+'">'+badge(x.t.id,'sm')+x.t.n+'</a></td><td class="mv">'+mv+'</td>'+
    vals.map(function(v,k){return '<td class="'+(k===0?'pts':(k%2?'c-odd':''))+'">'+v+'</td>';}).join('')+
    '<td><span class="dots">'+x.f.slice(-5).map(function(f){return '<i class="'+f+'" title="'+({V:'Vitória',E:'Empate',D:'Derrota'})[f]+'"></i>';}).join('')+'</span></td></tr>';
  });
  return h+'</tbody></table></div><div class="legend"><span><i style="width:10px;height:10px;background:var(--gold);border-radius:2px;display:inline-block"></i>Semifinais</span><span><span class="dots"><i class="V"></i></span>Vitória</span><span><span class="dots"><i class="E"></i></span>Empate</span><span><span class="dots"><i class="D"></i></span>Derrota</span></div>';
}
function roundBox(r){
  var gs=GAMES.filter(function(g){return g.r===r;});
  return '<div class="rnav"><button id="rPrev" aria-label="Rodada anterior"'+(r<=1?' disabled':'')+'><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 3L5 9l6 6"/></svg></button><b>'+r+'ª Rodada</b><button id="rNext" aria-label="Próxima rodada"'+(r>=ROUNDS?' disabled':'')+'><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 3l6 6-6 6"/></svg></button></div>'+
  gs.map(function(g){var done=g.st!=='agendado';
    return '<div class="rgame"><div class="meta">'+g.field+' &nbsp;<b>'+String(g.date.getDate()).padStart(2,'0')+'/'+String(g.date.getMonth()+1).padStart(2,'0')+' · '+({0:'Domingo',3:'Quarta',5:'Sexta'})[g.date.getDay()]+' · '+g.time+'</b></div>'+
    '<div class="ln"><span class="h">'+tn(g.h)+badge(g.h,'sm')+'</span><span class="sc">'+(done?g.gh:'')+'</span><span class="x">×</span><span class="sc">'+(done?g.ga:'')+'</span><span class="a">'+badge(g.a,'sm')+tn(g.a)+'</span></div>'+
    '<a class="go'+(g.st==='ao vivo'?' lv':'')+'" href="#'+g.id+'">'+(g.st==='ao vivo'?'● Ao vivo · '+g.min+"'":g.st==='encerrado'?'Saiba como foi':'Transmissão ao vivo')+'</a></div>';}).join('');
}
function bindRound(){
  var p=document.getElementById('rPrev'),n=document.getElementById('rNext');
  if(p)p.addEventListener('click',function(){if(CLR>1){CLR--;document.getElementById('rbox').innerHTML=roundBox(CLR);bindRound();}});
  if(n)n.addEventListener('click',function(){if(CLR<ROUNDS){CLR++;document.getElementById('rbox').innerHTML=roundBox(CLR);bindRound();}});
}

P.atletas=function(){
  return '<div class="wrap"><div class="phead"><div class="eyebrow">160 atletas · 8 times</div><h1>Atletas</h1><p class="lead">Cada jogo passa a fazer parte da sua história. Encontre qualquer atleta da League.</p></div>'+
  '<div class="filters"><input id="aq" type="search" placeholder="Buscar por nome ou número"><select id="at"><option value="">Todos os times</option>'+TEAMS.map(function(t){return '<option value="'+t.id+'">'+t.n+'</option>';}).join('')+'</select><select id="ap"><option value="">Todas as posições</option>'+Object.keys(POSN).map(function(k){return '<option value="'+k+'">'+POSN[k]+'</option>';}).join('')+'</select></div>'+
  '<div class="athletes" id="alist"></div></div>';
};
function athCard(p){return '<a class="ath" href="#atleta-'+p.id+'"><span class="n">'+p.num+'</span><div class="row"><div class="avatar" style="width:44px;height:44px;'+avBg(p.id)+'"></div><div><b>'+esc(p.n)+'</b><div class="lbl" style="margin-top:3px">'+tn(p.team)+' · '+POSN[p.pos]+'</div></div></div><div class="st"><span><b>'+p.j+'</b>jogos</span><span><b>'+p.g+'</b>gols</span><span><b>'+p.mvp+'</b>MVP</span></div></a>';}

P.atleta=function(id,dentro){
  var p=PM[id];if(!p)return P.atletas();var t=TM[p.team];
  var rows=p.games.map(function(x){var g=GAMES.filter(function(y){return y.id===x.g;})[0],home=g.h===p.team,op=home?g.a:g.h,my=home?g.gh:g.ga,th=home?g.ga:g.gh,res=my>th?'V':my<th?'D':'E';
    return '<tr><td class="l">'+g.r+'</td><td class="l"><a href="#'+g.id+'" class="row" style="gap:8px">'+badge(op,'sm')+tn(op)+'</a></td><td><span class="form"><i class="'+res+'">'+res+'</i></span> '+my+' x '+th+'</td><td>'+(x.gl||'–')+'</td><td>'+(g.mvp===p.id?'⭐':'')+'</td></tr>';}).join('');
  var mvpR=GAMES.filter(function(g){return g.mvp===p.id;}).map(function(g){return '<span class="chip gold">⭐ MVP · rodada '+g.r+'</span>';}).join('');
  var corpo='<div class="prof" data-n="'+p.num+'"><div class="avatar'+(FOTOS[p.id]?' ret':'')+'" style="'+avBg(p.id)+'"></div><div style="display:grid;gap:8px;position:relative"><span class="k">'+POSN[p.pos]+' · '+t.n+' · Nº '+p.num+'</span><h1>'+esc(p.n)+'</h1><div class="row" style="flex-wrap:wrap;gap:6px"><span class="chip" style="background:rgba(0,0,0,.6);color:#FAF9F5;border-color:transparent">Unidade '+p.unit+'</span><span class="chip" style="background:rgba(0,0,0,.6);color:#FAF9F5;border-color:transparent">Atleta FF desde 2026</span></div></div></div>'+
  '<div class="lbl" style="margin:26px 0 10px">1ª Temporada</div><div class="stats" style="grid-template-columns:repeat(4,1fr)"><div><b>'+p.j+'</b><span>Jogos</span></div><div><b>'+p.g+'</b><span>Gols</span></div><div><b>'+p.a+'</b><span>Assist.</span></div><div><b>'+p.mvp+'</b><span>MVPs</span></div></div>'+
  '<div class="grid2" style="margin-top:18px"><div class="card"><h3 style="margin-bottom:6px">Jogos na temporada</h3>'+(rows?'<div class="tblw"><table class="tbl"><thead><tr><th class="l">Rod.</th><th class="l">Adversário</th><th>Placar</th><th>Gols</th><th>MVP</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p class="muted">Ainda sem jogos.</p>')+'</div>'+
  '<div style="display:grid;gap:18px;align-content:start"><div class="card" style="display:grid;gap:10px"><h3>Conquistas</h3><div class="row" style="flex-wrap:wrap;gap:6px">'+(mvpR||'')+'<span class="chip ok">✓ 1ª Temporada</span><span class="chip ok">✓ Festival FF</span><span class="chip">🔒 Campeão</span><span class="chip">🔒 Artilheiro</span></div></div>'+
  '<div class="card" style="display:grid;gap:10px"><h3>Carreira FF</h3><div class="agenda"><div class="between"><span>Temporadas</span><b class="num">1</b></div><div class="between"><span>Títulos</span><b class="num">0</b></div><div class="between"><span>Copa FF 2026</span><span class="chip">Participou</span></div></div></div></div></div>';
  // dentro = mostrado na área do atleta (Meu perfil público), sem o “‹ Atletas” do Campeonato
  if(dentro)return corpo;
  return '<div class="wrap"><div class="phead"><a class="more" href="#campeonato-atletas">‹ Atletas</a></div>'+corpo+'</div>';
};
P['minha-area-perfil']=function(){
  return area('perfil','<div class="ahead"><div><div class="eyebrow">Como os outros atletas veem você</div><h1>Meu perfil público</h1></div></div>'+P.atleta(ME,1));
};

P.time=function(id){
  var t=TM[id];if(!t)return P.classificacao();var pos=ST.map(function(x){return x.t.id;}).indexOf(id),s=ST[pos];
  var gs=GAMES.filter(function(g){return g.h===id||g.a===id;});
  return '<div class="wrap"><div class="phead"><a class="more" href="#campeonato">‹ Campeonato</a><div class="row" style="gap:16px">'+badge(id,'lg')+'<h1>'+t.n+'</h1></div><p class="lead">'+(pos+1)+'º lugar · '+s.pts+' pontos · '+s.v+' vitórias, '+s.e+' empates e '+s.d+' derrotas.</p></div>'+
  '<div class="grid2"><div class="card"><h3 style="margin-bottom:6px">Elenco</h3><div class="athletes" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">'+t.roster.map(athCard).join('')+'</div></div><div class="card"><h3 style="margin-bottom:10px">Jogos</h3><div style="display:grid;gap:10px">'+gs.map(gameCard).join('')+'</div></div></div></div>';
};

P['ao-vivo']=function(){
  var up=GAMES.filter(function(g){return g.st==='agendado';}).slice(0,5);
  return '<div class="wrap"><div class="phead"><div class="eyebrow">Canal oficial FF Soccer · YouTube</div><h1>TV FF Soccer</h1></div>'+
  '<div class="livegrid"><div style="display:grid;gap:14px;align-content:start">'+playerBox({seed:11,bug:liveBug(),live:1,tag:'Transmissão oferecida por · espaço do patrocinador',bar:'<span data-viewers>186</span> assistindo'})+
  '<div class="between wrapm" style="flex-wrap:wrap"><div style="min-width:0"><h2 style="font-size:32px">'+tn(LIVE.h)+' x '+tn(LIVE.a)+'</h2><div class="lbl" style="margin-top:6px">Rodada '+LIVE.r+' · '+LIVE.field+' · <span data-viewers>186</span> assistindo agora</div></div><div class="row"><a class="btn sm" href="#'+LIVE.id+'">Lances e VAR</a><span class="btn primary sm">Inscrever-se no canal</span></div></div></div>'+
  '<div style="display:grid;gap:14px;align-content:start"><div class="card"><div class="between" style="margin-bottom:10px"><span class="lbl">Chat da torcida</span><span class="lbl">moderado pela FF</span></div><div class="chat" id="chat">'+(CONFIG.TEMPORADA_ZERADA?'<div><b>Cláudia Tavares</b>Começou a temporada! ⚽</div><div><b>Ju Sampaio</b>Bora '+tn(LIVE.h)+'!</div><div><b>Carlos · '+tn(LIVE.a)+'</b>Hoje é nosso, '+tn(LIVE.a)+' 💪</div><div><b>Tio Beto</b>Assistindo de Campinas</div><div class="ff"><b>FF Soccer</b>Bem-vindos à 1ª rodada da FF Soccer Pro League!</div>':'<div><b>Cláudia Tavares</b>VAI FILHO!!! Que gol ⚽</div><div><b>Ju Sampaio</b>Diego jogando muito hoje</div><div><b>Carlos · Lobos</b>Era pênalti, o VAR foi generoso 😅</div><div><b>Tio Beto</b>Assistindo de Campinas, bora Falcões</div><div class="ff"><b>FF Soccer</b>O replay do gol já está na TV FF Soccer.</div>')+'</div><form id="chatF"><input class="chat-in" id="chatIn" type="text" placeholder="Mande sua mensagem para a torcida" maxlength="140"></form></div>'+
  '<div class="card agenda"><div class="lbl" style="margin-bottom:4px">Próximas transmissões</div>'+up.map(function(g){return '<a class="between" href="#'+g.id+'"><span>'+tn(g.h)+' x '+tn(g.a)+'</span><span class="lbl">'+fmtD(g.date)+' · '+g.time+'</span></a>';}).join('')+'</div></div></div></div>';
};


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
function logout(){ME=null;try{localStorage.removeItem('ffl_user');}catch(e){}acct();location.hash='inicio';toast('Você saiu da sua área.');}
// E-mail de quem está conectado com login real (sessão guardada pelo Supabase neste navegador), ou ''.
function sessaoEmail(){try{var ref=(CONFIG.SUPABASE_URL||'').split('//')[1].split('.')[0],v=JSON.parse(localStorage.getItem('sb-'+ref+'-auth-token')||'null');return (v&&v.user&&v.user.email)||'';}catch(e){return '';}}
function acct(){var a=document.getElementById('acct'),d=document.getElementById('drawAcct');
  if(ME){var p=PM[ME];a.className='acct';a.href='#minha-area';a.innerHTML='<span class="av">'+p.n[0]+'</span><span class="nm">'+esc(p.n.split(' ')[0])+'</span>';d.firstChild.textContent='Minha área ';}
  else if(sessaoEmail()){var em=sessaoEmail();a.className='acct so';a.href='#painel';a.innerHTML='<span class="av">'+esc(em[0].toUpperCase())+'</span>';a.title='Conectado como '+em;a.setAttribute('aria-label','Conectado como '+em+'. Abrir o painel');d.firstChild.textContent='Painel ';d.href='#painel';}
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
  (ONDA>=4?'<div class="demo"><div class="lbl" style="color:var(--gold)">Protótipo · atleta de demonstração</div><div class="row"><div class="avatar" style="width:42px;height:42px;'+avBg('falcoes-10')+'"></div><div><b style="font-family:var(--cond);text-transform:uppercase;font-size:17px">André Marques</b><div class="lbl">Meia · Falcões · Nº 10</div></div></div><button class="btn primary sm" id="demoBtn" type="button" style="justify-content:center">Entrar como André</button></div>':'')+
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
var ALIAS={'':'inicio'};
function route(){
  var h=(location.hash||'').replace('#','')||'a-league',page=h,arg=null;
  if(h==='classificacao'||h==='hall-da-fama'||h==='campeonato-times')h='campeonato';if(h==='minha-area-fotos')h='minha-area';if(h==='campeonato-atletas')h='atletas';page=h;
  if(h==='campeonato'||h.indexOf('campeonato-')===0){page='campeonato';arg=h.slice(11)||'tabela';}
  if(/^jogo-\d+-\d+$/.test(h)){page='jogo';arg=h;}
  else if(/^jogos-\d+$/.test(h)){page='jogos';arg=h.split('-')[1];}
  else if(h.indexOf('atleta-')===0){page='atleta';arg=h.slice(7);}
  else if(h.indexOf('time-')===0){page='time';arg=h.slice(5);}
  if(h==='sair'){logout();return;}
  if(/^minha-area/.test(page)&&!ME){page='entrar';}
  if(page==='entrar'&&ME){page='minha-area';}
  if(!P[page])page='inicio';
  if(ondaDaPagina(page)>ONDA||(page==='pre-inscricao'&&!preOn())){page='a-league';arg=null;try{history.replaceState(null,'',location.pathname+location.search+'#a-league');}catch(e){}}
  app.innerHTML=P[page](arg);
  var navKey={jogos:'campeonato',jogo:'campeonato',atletas:'campeonato',atleta:'campeonato',time:'campeonato'}[page]||page;
  document.getElementById('acct').classList.toggle('on',/^minha-area|entrar/.test(page));
  document.querySelectorAll('#nav a').forEach(function(a){a.classList.toggle('on',a.dataset.r===navKey);});
  document.getElementById('drawer').hidden=true;document.getElementById('burger').setAttribute('aria-expanded','false');
  window.scrollTo(0,0);
  bind(page);initCanvases();
  document.title=({inicio:'Site FF Soccer Pro League'})[page]||'Site FF Soccer Pro League';
}
function bind(page){
  if(document.getElementById('rbox')){bindRound();}
  if(page==='jogos'){document.querySelectorAll('#roundSel button').forEach(function(b){b.addEventListener('click',function(){location.hash='jogos-'+b.dataset.r;});});}
  if(page==='inicio'){document.getElementById('homeSearch').addEventListener('submit',function(e){e.preventDefault();SEARCH=document.getElementById('homeQ').value;location.hash='campeonato-atletas';});}
  if(document.getElementById('alist')){
    var q=document.getElementById('aq'),t=document.getElementById('at'),ps=document.getElementById('ap'),out=document.getElementById('alist');
    q.value=SEARCH||'';SEARCH='';
    function f(){var v=q.value.trim().toLowerCase(),list=PLAYERS.filter(function(p){return (!t.value||p.team===t.value)&&(!ps.value||p.pos===ps.value)&&(!v||p.n.toLowerCase().indexOf(v)>=0||String(p.num)===v);}).sort(function(a,b){return b.g-a.g||b.mvp-a.mvp||a.n.localeCompare(b.n);});
      out.innerHTML=list.length?list.slice(0,60).map(athCard).join(''):'<p class="muted">Nenhum atleta encontrado.</p>';}
    [q,t,ps].forEach(function(el){el.addEventListener('input',f);});f();
  }
  if(page==='ao-vivo'){var cf=document.getElementById('chatF'),ci=document.getElementById('chatIn'),ch=document.getElementById('chat');cf.addEventListener('submit',function(e){e.preventDefault();var v=ci.value.trim();if(!v)return;var d=document.createElement('div');d.innerHTML='<b>Você</b>';d.appendChild(document.createTextNode(v));ch.appendChild(d);ch.scrollTop=ch.scrollHeight;ci.value='';});}
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
        fm.innerHTML='<div class="okbox"><span class="ck">✓</span><h2>Pré-inscrição recebida</h2><p class="muted" style="margin:0;max-width:44ch">Obrigado, '+esc(payload.nome.split(' ')[0])+'. Sua pré-inscrição entrou na fila de análise da FF. Você recebe o retorno por e-mail ou WhatsApp.</p><span class="chip">Camisa: '+esc(payload.nome_camisa)+' · Nº '+payload.numero+'</span><span class="chip gold">Protocolo '+esc(res.protocolo||'')+'</span>'+(res.duplicado?'<span class="hint">Já tínhamos uma pré-inscrição com este e-mail. Registramos esta como atualização.</span>':'')+'<a class="btn" href="#inicio">Voltar ao início</a></div>';
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
  var items=GAMES.filter(function(g){return g.r===CUR;}).map(function(g){
    var s=g.st==='ao vivo'?'<span class="live">'+g.min+"'</span>":g.st==='encerrado'?'<span class="lbl">Fim</span>':'<span class="lbl">'+fmtD(g.date)+' '+g.time+'</span>';
    return '<a href="#'+g.id+'">'+s+' '+tn(g.h)+' <b>'+(g.gh==null?'':g.gh)+'</b> x <b>'+(g.ga==null?'':g.ga)+'</b> '+tn(g.a)+'</a>';});
  document.getElementById('ticker').innerHTML='<span class="lbl" style="color:var(--gold)">Rodada '+CUR+'</span>'+items.join('<span class="sep">|</span>');
}
acct();
try{if(localStorage.getItem('ffl_pl'))document.getElementById('prelaunch').hidden=true;}catch(e){}
document.getElementById('plClose').addEventListener('click',function(){document.getElementById('prelaunch').hidden=true;try{localStorage.setItem('ffl_pl','1');}catch(e){}});
ticker();
setInterval(function(){
  if(LIVE.min<90){LIVE.min++;
    document.querySelectorAll('[data-livemin],[data-livemin2]').forEach(function(e){e.textContent=LIVE.min+"'";});
    document.querySelectorAll('[data-livepill]').forEach(function(e){e.textContent=(LIVE.min<=45?'1º':'2º')+' tempo · '+LIVE.min+"'";});
    var v=186+Math.floor((LIVE.min-(LIVE.min0||67))*2.3);document.querySelectorAll('[data-viewers]').forEach(function(e){e.textContent=v;});
    ticker();}
},20000);

aplicarOnda();
// Desenha só depois de todos os scripts (o painel.js vem depois deste arquivo e define o login).
document.addEventListener('DOMContentLoaded',function(){
  if(ONDA<2)route();  // onda 1 não mostra dados de jogos: não espera o banco
  else carregarBanco(function(){zerarTemporada();CLR=CUR;ticker();route();});
});
