/* Lê do banco de dados (Supabase) os times, atletas, jogos e súmulas cadastrados no painel e monta as variáveis do Campeonato:
   FF Pro League em TEAMS, PLAYERS, GAMES, ST, SCORERS, MVPS, CUR, RLIST (as mesmas de js/dados-exemplo.js)
   e Libertadores FF em LIB (times por grupo, jogos e números). TM, PM e ALLGAMES juntam as duas competições
   (páginas de time, atleta e jogo servem para as duas).
   Desde 26/10/2026 o Campeonato não usa mais os dados de exemplo: se o banco falhar, as páginas avisam e ficam vazias. */

var BANCO_OK=false,BANCO_ERRO=false;
var LIB={teams:[],players:[],games:[],grupos:[],scorers:[],mvps:[],nome:''},ALLGAMES=[],RLIST=[],PRO_NOME='';

function sbGet(tabela,query){
  var url=CONFIG.SUPABASE_URL+'/rest/v1/'+tabela+'?'+query,out=[];
  function pagina(ini){
    return fetch(url,{headers:{apikey:CONFIG.SUPABASE_KEY,Range:ini+'-'+(ini+999)}})
      .then(function(r){if(!r.ok)throw new Error(tabela+': '+r.status);return r.json();})
      .then(function(rows){out=out.concat(rows);return rows.length===1000?pagina(ini+1000):out;});
  }
  return pagina(0);
}

// data_hora vem em UTC; o site mostra sempre o horário de Brasília (UTC-3, sem horário de verão).
function dataBrasilia(iso){
  var d=new Date(Date.parse(iso)-3*3600e3);
  return {date:new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()),
          time:d.getUTCHours()+'h'+(d.getUTCMinutes()?String(d.getUTCMinutes()).padStart(2,'0'):'')};
}

// Campeonato vazio (banco ainda sem cadastros, ou fora do ar).
function campVazio(){
  TEAMS=[];TM={};PLAYERS=[];PM={};GAMES=[];FOTOS={};LIVE=null;ROUNDS=0;RLIST=[];CUR=0;ST=[];SCORERS=[];MVPS=[];
  LIB={teams:[],players:[],games:[],grupos:[],scorers:[],mvps:[],nome:''};ALLGAMES=[];
}

// Tabela de classificação de uma lista de times, a partir dos jogos encerrados (súmula fechada).
function tabelaDe(teams,games){
  var S={};teams.forEach(function(t){S[t.id]={t:t,j:0,v:0,e:0,d:0,gp:0,gc:0,f:[]};});
  games.filter(function(g){return g.st==='encerrado'&&S[g.h]&&S[g.a];}).sort(function(a,b){return (a.date||0)-(b.date||0)||a.r-b.r;}).forEach(function(g){
    var h=S[g.h],a=S[g.a];h.j++;a.j++;h.gp+=g.gh;h.gc+=g.ga;a.gp+=g.ga;a.gc+=g.gh;
    if(g.gh>g.ga){h.v++;a.d++;h.f.push('V');a.f.push('D');}else if(g.gh<g.ga){a.v++;h.d++;a.f.push('V');h.f.push('D');}else{h.e++;a.e++;h.f.push('E');a.f.push('E');}
  });
  return Object.keys(S).map(function(k){var x=S[k];x.pts=x.v*3+x.e;x.sg=x.gp-x.gc;return x;})
    .sort(function(a,b){return b.pts-a.pts||b.v-a.v||b.sg-a.sg||b.gp-a.gp||teams.indexOf(a.t)-teams.indexOf(b.t);});
}
function rankingDe(players){
  return {scorers:players.filter(function(p){return p.g>0;}).sort(function(a,b){return b.g-a.g||b.a-a.a||a.n.localeCompare(b.n);}),
          mvps:players.filter(function(p){return p.mvp>0;}).sort(function(a,b){return b.mvp-a.mvp||b.g-a.g;})};
}

// Monta uma competição (a temporada mais recente dela). pre = começo do endereço dos jogos ('jogo-' ou 'jogo-lib-').
function montarComp(d,temp,pre,tm,pm,fotos){
  var c={teams:[],players:[],games:[]};if(!temp)return c;
  var tid=temp.id,nVar=temp.desafios_var_por_jogo==null?2:temp.desafios_var_por_jogo;
  var ORD={GOL:0,LAT:1,ZAG:2,VOL:3,MEI:4,ATA:5},un={},at={},sid={};
  d.unidades.forEach(function(u){un[u.id]=u.nome;});
  d.atletas.forEach(function(a){at[a.id]=a;});
  c.teams=d.times.filter(function(t){return t.temporada_id===tid;}).map(function(t){var x={id:t.id,n:t.nome,c:t.cor||'#888',e:t.escudo_url||'',u:un[t.unidade_id]||'',grupo:t.grupo||'',comp:pre,roster:[]};tm[t.id]=x;return x;});
  // id do atleta no site = <time>-<número da camisa>, como nas rotas #atleta-falcoes-10
  d.elencos.forEach(function(e){var a=at[e.atleta_id];if(e.temporada_id!==tid||!a||!tm[e.time_id]||a.ativo===false)return;
    var p={id:e.time_id+'-'+e.numero,n:a.nome,num:e.numero,pos:a.posicao||'',team:e.time_id,unit:un[a.unidade_id]||'',g:0,a:0,j:0,mvp:0,min:0,ca:0,cv:0,games:[]};
    sid[a.id]=p.id;pm[p.id]=p;if(a.foto_url)fotos[p.id]=a.foto_url;c.players.push(p);});
  c.players.sort(function(x,y){return c.teams.indexOf(tm[x.team])-c.teams.indexOf(tm[y.team])||(ORD[x.pos]==null?9:ORD[x.pos])-(ORD[y.pos]==null?9:ORD[y.pos])||x.num-y.num;});
  c.players.forEach(function(p){tm[p.team].roster.push(p);});

  var ST_={agendado:'agendado',ao_vivo:'ao vivo',encerrado:'encerrado',adiado:'adiado',cancelado:'cancelado'},gm={};
  d.jogos.forEach(function(j){if(j.temporada_id!==tid||!tm[j.time_casa]||!tm[j.time_fora])return;
    var dh=j.data_hora?dataBrasilia(j.data_hora):{date:null,time:''};
    var g={id:pre+j.rodada+'-'+j.ordem,r:j.rodada,i:j.ordem-1,h:j.time_casa,a:j.time_fora,date:dh.date,time:dh.time,field:j.local||'',grupo:j.grupo||'',comp:pre,
      st:j.sumula_fechada?'encerrado':(ST_[j.status]||'agendado'),gh:j.gols_casa,ga:j.gols_fora,ev:[],mvp:sid[j.mvp_atleta_id]||null,varTot:nVar,varH:nVar,varA:nVar,min:j.minuto_atual};
    if(g.st==='encerrado'&&(g.gh==null||g.ga==null))g.st='agendado';
    c.games.push(g);gm[j.id]=g;});

  var TIPO={gol:'gol',gol_contra:'gc',cartao_amarelo:'amarelo',cartao_vermelho:'vermelho',substituicao:'sub'};
  d.eventos_jogo.forEach(function(e){var g=gm[e.jogo_id],t=TIPO[e.tipo];if(!g||!t)return;
    var x={m:e.minuto,t:t,side:e.time_id===g.h?'h':'a'};
    if(t==='sub')x.txt=e.observacao||'';else x.p=sid[e.atleta_id];
    if(t==='gol')x.as=sid[e.atleta2_id]||null;
    if(t==='sub'||x.p)g.ev.push(x);});
  d.desafios_var.forEach(function(v){var g=gm[v.jogo_id];if(!g)return;var side=v.time_id===g.h?'h':'a';
    g.ev.push({m:v.minuto,t:'var',side:side,txt:v.motivo||''});if(side==='h')g.varH--;else g.varA--;});
  c.games.forEach(function(g){g.ev.sort(function(a,b){return (a.m||0)-(b.m||0);});});

  // Números dos atletas: só de jogos com súmula fechada (ou ao vivo, para os gols).
  var porJogo={};d.escalacoes.forEach(function(s){(porJogo[s.jogo_id]=porJogo[s.jogo_id]||[]).push(s);});
  Object.keys(gm).forEach(function(jid){var g=gm[jid];if(g.st!=='encerrado'&&g.st!=='ao vivo')return;
    var gols={};g.ev.forEach(function(e){if(e.t==='gol')gols[e.p]=(gols[e.p]||0)+1;});
    (porJogo[jid]||[]).forEach(function(s){var p=pm[sid[s.atleta_id]];if(!p)return;p.j++;p.games.push({g:g.id,min:0,gl:gols[p.id]||0});});
    g.ev.forEach(function(e){if(e.t==='gol'){pm[e.p].g++;if(e.as&&pm[e.as])pm[e.as].a++;}});
    if(g.st==='encerrado'){g.ev.forEach(function(e){if(e.t==='amarelo')pm[e.p].ca++;if(e.t==='vermelho')pm[e.p].cv++;});if(g.mvp&&pm[g.mvp])pm[g.mvp].mvp++;}
  });
  var rk=rankingDe(c.players);c.scorers=rk.scorers;c.mvps=rk.mvps;c.nome=temp.nome||'';
  return c;
}

function montarDados(d){
  var ultima=function(comp){return d.temporadas.filter(function(t){return (t.competicao||'pro_league')===comp;}).sort(function(a,b){return b.id-a.id;})[0];};
  var tm={},pm={},fotos={};
  var pro=montarComp(d,ultima('pro_league'),'jogo-',tm,pm,fotos),lib=montarComp(d,ultima('libertadores'),'jogo-lib-',tm,pm,fotos);

  TEAMS=pro.teams;TM=tm;PLAYERS=pro.players;PM=pm;GAMES=pro.games;FOTOS=fotos;PRO_NOME=pro.nome||'';
  ALLGAMES=pro.games.concat(lib.games);
  LIVE=ALLGAMES.filter(function(g){return g.st==='ao vivo';})[0]||null;
  RLIST=[];GAMES.forEach(function(g){if(RLIST.indexOf(g.r)<0)RLIST.push(g.r);});RLIST.sort(function(a,b){return a-b;});
  ROUNDS=RLIST.length?RLIST[RLIST.length-1]:0;
  // rodada atual: a primeira que ainda tem jogo por acontecer; se todas acabaram, a última
  var pend=GAMES.filter(function(g){return g.st==='agendado'||g.st==='ao vivo'||g.st==='adiado';}).map(function(g){return g.r;});
  CUR=pend.length?Math.min.apply(null,pend):ROUNDS;
  ST=tabelaDe(TEAMS,GAMES);SCORERS=pro.scorers;MVPS=pro.mvps;

  // Libertadores: grupos (letra do time); times sem grupo ficam juntos no fim
  var gs=[];lib.teams.forEach(function(t){if(gs.indexOf(t.grupo)<0)gs.push(t.grupo);});
  gs.sort(function(a,b){return !a?1:!b?-1:a.localeCompare(b);});
  lib.grupos=gs.map(function(G){var ts=lib.teams.filter(function(t){return t.grupo===G;}),ids=ts.map(function(t){return t.id;});
    var js=lib.games.filter(function(g){return G?(g.grupo===G||(!g.grupo&&ids.indexOf(g.h)>=0&&ids.indexOf(g.a)>=0)):(ids.indexOf(g.h)>=0||ids.indexOf(g.a)>=0)&&!g.grupo;});
    var rs=[];js.forEach(function(g){if(rs.indexOf(g.r)<0)rs.push(g.r);});rs.sort(function(a,b){return a-b;});
    return {g:G,teams:ts,games:js,rodadas:rs,st:tabelaDe(ts,js)};});
  var noGrupo={};lib.grupos.forEach(function(G){G.games.forEach(function(g){noGrupo[g.id]=1;});});
  lib.extras=lib.games.filter(function(g){return !noGrupo[g.id];});  // mata-mata e jogos entre grupos
  LIB=lib;
  return true;
}

// Chama pronto() uma única vez: com os dados do banco ou, se o banco falhar ou demorar, com o Campeonato vazio e um aviso.
// Se o banco responder depois do prazo, a página é desenhada de novo com os dados.
function carregarBanco(pronto){
  var feito=false;function fim(){if(!feito){feito=true;pronto();}}
  campVazio();
  if(!CONFIG.SUPABASE_URL||!CONFIG.SUPABASE_KEY||!window.fetch){BANCO_ERRO=true;return fim();}
  var prazo=setTimeout(function(){BANCO_ERRO=true;fim();},6000);
  var T=['temporadas','unidades','times','atletas','elencos','jogos','escalacoes','eventos_jogo','desafios_var'];
  Promise.all([
    sbGet('temporadas','select=id,nome,desafios_var_por_jogo,competicao&order=id.desc'),
    sbGet('unidades','select=id,nome'),
    sbGet('times','select=id,nome,cor,escudo_url,unidade_id,ordem,temporada_id,grupo&order=ordem,nome'),
    sbGet('atletas','select=id,nome,posicao,unidade_id,foto_url,ativo&order=id'),
    sbGet('elencos','select=time_id,atleta_id,numero,temporada_id&order=id'),
    sbGet('jogos','select=id,temporada_id,rodada,ordem,grupo,data_hora,local,time_casa,time_fora,status,gols_casa,gols_fora,minuto_atual,mvp_atleta_id,sumula_fechada&order=rodada,ordem'),
    sbGet('escalacoes','select=jogo_id,atleta_id&order=jogo_id,atleta_id'),
    sbGet('eventos_jogo','select=jogo_id,minuto,tipo,time_id,atleta_id,atleta2_id,observacao&order=minuto,criado_em,id'),
    sbGet('desafios_var','select=jogo_id,time_id,minuto,motivo&order=minuto,criado_em,id')
  ]).then(function(r){
    var d={};T.forEach(function(k,i){d[k]=r[i];});
    try{BANCO_OK=montarDados(d);BANCO_ERRO=false;}catch(e){console.error('Erro ao montar o Campeonato.',e);campVazio();BANCO_ERRO=true;}
    clearTimeout(prazo);
    if(feito){if(typeof route==='function')route();return;}
    fim();
  },function(e){console.warn('Banco indisponível: o Campeonato fica vazio.',e);BANCO_ERRO=true;clearTimeout(prazo);fim();});
}
