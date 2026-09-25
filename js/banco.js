/* Lê do banco de dados (Supabase) os times, atletas e jogos e monta as mesmas variáveis
   de js/dados-exemplo.js (TEAMS, TM, PLAYERS, PM, GAMES, LIVE, ST, SCORERS, MVPS, FOTOS, CUR, ROUNDS).
   Se o banco não responder a tempo, o site segue com os dados gerados em dados-exemplo.js. */

var BANCO_OK=false;

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

function montarDados(d){
  var ORD={GOL:0,LAT:1,ZAG:2,VOL:3,MEI:4,ATA:5},un={},at={},sid={},nVar=(d.temporadas[0]||{}).desafios_var_por_jogo;
  if(nVar==null)nVar=2;
  d.unidades.forEach(function(u){un[u.id]=u.nome;});
  d.atletas.forEach(function(a){at[a.id]=a;});
  var teams=d.times.map(function(t){return {id:t.id,n:t.nome,c:t.cor,roster:[]};}),tm={};
  teams.forEach(function(t){tm[t.id]=t;});
  // id do site = <time>-<número da camisa>, como nas rotas #atleta-falcoes-10
  var players=[],pm={},fotos={};
  d.elencos.forEach(function(e){var a=at[e.atleta_id];if(!a||!tm[e.time_id])return;
    var p={id:e.time_id+'-'+e.numero,n:a.nome,num:e.numero,pos:a.posicao,team:e.time_id,unit:un[a.unidade_id]||'',g:0,a:0,j:0,mvp:0,min:0,ca:0,games:[]};
    sid[a.id]=p.id;pm[p.id]=p;if(a.foto_url)fotos[p.id]=a.foto_url;players.push(p);});
  players.sort(function(x,y){return teams.indexOf(tm[x.team])-teams.indexOf(tm[y.team])||ORD[x.pos]-ORD[y.pos]||x.num-y.num;});
  players.forEach(function(p){tm[p.team].roster.push(p);});

  var ST_={agendado:'agendado',ao_vivo:'ao vivo',encerrado:'encerrado'},games=[],gm={};
  d.jogos.forEach(function(j){if(!tm[j.time_casa]||!tm[j.time_fora])return;
    var dh=j.data_hora?dataBrasilia(j.data_hora):{date:new Date(2027,0,1),time:''};
    var g={id:'jogo-'+j.rodada+'-'+j.ordem,r:j.rodada,i:j.ordem-1,h:j.time_casa,a:j.time_fora,date:dh.date,time:dh.time,field:j.local||'',
      st:ST_[j.status]||'agendado',gh:j.gols_casa,ga:j.gols_fora,ev:[],mvp:sid[j.mvp_atleta_id]||null,varH:nVar,varA:nVar};
    if(j.minuto_atual!=null)g.min=j.minuto_atual;
    games.push(g);gm[j.id]=g;});

  var TIPO={gol:'gol',cartao_amarelo:'amarelo',substituicao:'sub'};
  d.eventos_jogo.forEach(function(e){var g=gm[e.jogo_id],t=TIPO[e.tipo];if(!g||!t)return;
    var x={m:e.minuto,t:t,side:e.time_id===g.h?'h':'a'};
    if(t==='sub')x.txt=e.observacao||'';else x.p=sid[e.atleta_id];
    if(t==='gol')x.as=sid[e.atleta2_id]||null;
    if(t==='sub'||x.p)g.ev.push(x);});
  d.desafios_var.forEach(function(v){var g=gm[v.jogo_id];if(!g)return;var side=v.time_id===g.h?'h':'a';
    g.ev.push({m:v.minuto,t:'var',side:side,txt:v.motivo});if(side==='h')g.varH--;else g.varA--;});
  games.forEach(function(g){g.ev.sort(function(a,b){return a.m-b.m;});});

  var porJogo={};d.escalacoes.forEach(function(s){(porJogo[s.jogo_id]=porJogo[s.jogo_id]||[]).push(s);});
  d.jogos.forEach(function(j){var g=gm[j.id];if(!g)return;
    var gols={};g.ev.forEach(function(e){if(e.t==='gol')gols[e.p]=(gols[e.p]||0)+1;});
    (porJogo[j.id]||[]).forEach(function(s){var p=pm[sid[s.atleta_id]];if(!p)return;var m=s.minutos||0;
      p.j++;p.min+=m;p.games.push({g:g.id,min:m,gl:gols[p.id]||0});});
    if(g.st==='encerrado'||g.st==='ao vivo')g.ev.forEach(function(e){if(e.t==='gol'){pm[e.p].g++;if(e.as)pm[e.as].a++;}});
    if(g.st==='encerrado'){g.ev.forEach(function(e){if(e.t==='amarelo')pm[e.p].ca++;});if(g.mvp)pm[g.mvp].mvp++;}
  });

  var live=games.filter(function(g){return g.st==='ao vivo';})[0];
  if(!teams.length||!players.length||!games.length||!live)return false;  // o site ainda precisa de um jogo ao vivo

  TEAMS=teams;TM=tm;PLAYERS=players;PM=pm;GAMES=games;FOTOS=fotos;LIVE=live;
  ROUNDS=Math.max.apply(null,games.map(function(g){return g.r;}));CUR=live.r;
  ST=standings();
  SCORERS=PLAYERS.filter(function(p){return p.g>0;}).sort(function(a,b){return b.g-a.g||b.a-a.a||a.n.localeCompare(b.n);});
  MVPS=PLAYERS.filter(function(p){return p.mvp>0;}).sort(function(a,b){return b.mvp-a.mvp||b.g-a.g;});
  return true;
}

// Chama pronto() uma única vez: com os dados do banco, ou com os de exemplo se o banco falhar ou demorar.
function carregarBanco(pronto){
  var feito=false;function fim(){if(!feito){feito=true;pronto();}}
  if(!CONFIG.SUPABASE_URL||!CONFIG.SUPABASE_KEY||!window.fetch)return fim();
  setTimeout(fim,4000);
  var T=['temporadas','unidades','times','atletas','elencos','jogos','escalacoes','eventos_jogo','desafios_var'];
  Promise.all([
    sbGet('temporadas','select=id,desafios_var_por_jogo&order=id.desc'),
    sbGet('unidades','select=id,nome'),
    sbGet('times','select=id,nome,cor,ordem&order=ordem,nome'),
    sbGet('atletas','select=id,nome,posicao,unidade_id,foto_url&order=id'),
    sbGet('elencos','select=time_id,atleta_id,numero&order=id'),
    sbGet('jogos','select=id,rodada,ordem,data_hora,local,time_casa,time_fora,status,gols_casa,gols_fora,minuto_atual,mvp_atleta_id&order=rodada,ordem'),
    sbGet('escalacoes','select=jogo_id,atleta_id,minutos&order=jogo_id,atleta_id'),
    sbGet('eventos_jogo','select=jogo_id,minuto,tipo,time_id,atleta_id,atleta2_id,observacao&order=minuto,criado_em,id'),
    sbGet('desafios_var','select=jogo_id,time_id,minuto,motivo&order=minuto,criado_em,id')
  ]).then(function(r){
    if(feito)return;
    var d={};T.forEach(function(k,i){d[k]=r[i];});
    BANCO_OK=montarDados(d);
    if(!BANCO_OK)console.warn('Banco sem jogo ao vivo ou vazio: usando os dados de exemplo.');
    fim();
  }).catch(function(e){console.warn('Banco indisponível, usando os dados de exemplo.',e);fim();});
}
