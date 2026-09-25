/* Dados de exemplo do pré-lançamento: times, atletas, jogos, tabela e artilharia.
   Gerados com semente fixa (rng(2027)), então são sempre os mesmos. */
/* ================= DATA ================= */
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
var R=rng(2027);
var TEAMS=[
 {id:'tigres',n:'Tigres',c:'#E8A33B',s:1.55},{id:'falcoes',n:'Falcões',c:'#5AA9E6',s:1.35},
 {id:'lobos',n:'Lobos',c:'#9AA5B1',s:1.3},{id:'aguias',n:'Águias',c:'#E0574F',s:1.1},
 {id:'tubaroes',n:'Tubarões',c:'#2FB5A8',s:1.0},{id:'panteras',n:'Panteras',c:'#B76BE0',s:.95},
 {id:'touros',n:'Touros',c:'#D98B5F',s:.85},{id:'corvos',n:'Corvos',c:'#6B7BE0',s:.72}];
var TM={};TEAMS.forEach(function(t){TM[t.id]=t;});
var SLOTS=[[1,'GOL'],[12,'GOL'],[2,'LAT'],[6,'LAT'],[13,'LAT'],[16,'LAT'],[3,'ZAG'],[4,'ZAG'],[14,'ZAG'],[15,'ZAG'],[5,'VOL'],[8,'VOL'],[18,'VOL'],[7,'MEI'],[10,'MEI'],[17,'MEI'],[20,'MEI'],[9,'ATA'],[11,'ATA'],[19,'ATA']];
var POSN={GOL:'Goleiro',LAT:'Lateral',ZAG:'Zagueiro',VOL:'Volante',MEI:'Meia',ATA:'Atacante'};
var FIRST=['Rafael','Diego','Thiago','Marcelo','Caio','Leandro','Bruno','Gustavo','André','Felipe','Henrique','Otávio','Paulo','Renato','Vitor','Samuel','Igor','Leo','Tiago','Mateus','Rodrigo','Hugo','Davi','Ciro','Eduardo','Fábio','Ricardo','Gabriel','Wesley','Nicolas','Júlio','Lucas','Pedro','João','Daniel','Murilo','Vinícius','Arthur','Enzo','Caíque','Alan','Rogério','Márcio','Fernando','Sérgio','Alex','Danilo','Heitor','Kaio','Luan'];
var LAST=['Moura','Sampaio','Brandão','Tavares','Ferraz','Pires','Reis','Lima','Couto','Nunes','Sá','Rangel','Vieira','Cruz','Alencar','Duarte','Salles','Martins','Rocha','Brito','Leme','Pacheco','Moreira','Batista','Maciel','Guedes','Antunes','Teixeira','Paiva','Amaral','Lopes','Prates','Queiroz','Barros','Campos','Dias','Freitas','Gomes','Macedo','Neves','Peixoto','Ramos','Siqueira','Toledo','Viana','Xavier','Arruda','Bastos','Carvalho','Mendes'];
var UNITS=['Moema','Tatuapé','Santana','Pinheiros','Mooca','Vila Mariana'];
var FIXED={'tigres-9':'Rafael Moura','tigres-11':'Caio Ferraz','falcoes-10':'André Marques','falcoes-9':'Diego Sampaio','falcoes-1':'Gustavo Lima','lobos-9':'Thiago Brandão','lobos-5':'Júlio Prates','aguias-9':'Leandro Pires','tubaroes-9':'Bruno Reis'};var FOTOS={'falcoes-10':'assets/atleta-exemplo.webp'};
var STAR={'tigres-9':3.2,'falcoes-9':2.4,'lobos-9':2.3,'aguias-9':2.2,'tigres-11':1.8,'falcoes-10':1.7,'tubaroes-9':1.8};
var used={};Object.keys(FIXED).forEach(function(k){used[FIXED[k]]=1;});
var PLAYERS=[],PM={};
TEAMS.forEach(function(t){t.roster=[];SLOTS.forEach(function(sl){
  var id=t.id+'-'+sl[0],nm=FIXED[id];
  while(!nm){var c=FIRST[Math.floor(R()*FIRST.length)]+' '+LAST[Math.floor(R()*LAST.length)];if(!used[c]){used[c]=1;nm=c;}}
  var p={id:id,n:nm,num:sl[0],pos:sl[1],team:t.id,unit:UNITS[Math.floor(R()*UNITS.length)],g:0,a:0,j:0,mvp:0,min:0,ca:0,games:[]};
  PLAYERS.push(p);PM[id]=p;t.roster.push(p);});});

// schedule: circle method mapped so round 6 = Tigres x Corvos, Falcões x Lobos, Águias x Tubarões, Panteras x Touros
var C2T=[0,1,5,3,4,6,2,7];
function circle(k){var ps=[[7,k]];for(var i=1;i<=3;i++)ps.push([(k+i)%7,(k-i+7)%7]);return ps.map(function(p){return [C2T[p[0]],C2T[p[1]]];});}
var DAY0=new Date(2027,1,10); // Qua 10/02/2027
var WD=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function fmtD(d){return WD[d.getDay()]+' '+String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');}
var GAMES=[],ROUNDS=9,CUR=6,LIVE=null;
for(var r=1;r<=ROUNDS;r++){
  var base=r<=7?r:r-7,k=((base-6)%7+7)%7,ps=circle(k);
  if(r===6){var order=[[0,7],[1,2],[3,4],[5,6]];ps=order;}
  ps.forEach(function(p,i){
    var h=p[0],a=p[1];if(r!==6&&((r+i)%2)){h=p[1];a=p[0];}if(r>7){var t=h;h=a;a=t;}
    var wk=addDays(DAY0,7*(r-1)),d=i<2?wk:addDays(wk,2);
    GAMES.push({id:'jogo-'+r+'-'+(i+1),r:r,i:i,h:TEAMS[h].id,a:TEAMS[a].id,date:d,time:i%2?'21h':'19h30',field:i%2?'Campo 2':'Campo 1',st:'agendado',gh:null,ga:null,ev:[],mvp:null,varH:2,varA:2});
  });
}
function poisson(l){var L=Math.exp(-l),k=0,p=1;do{k++;p*=R();}while(p>L);return k-1;}
function pickScorer(tid,ex){var ro=TM[tid].roster.filter(function(p){return p.pos!=='GOL'&&p!==ex;});var w=ro.map(function(p){return ({ATA:5,MEI:3,VOL:1.2,LAT:1,ZAG:1})[p.pos]*(STAR[p.id]||1);});var s=w.reduce(function(a,b){return a+b;},0),x=R()*s;for(var i=0;i<ro.length;i++){x-=w[i];if(x<=0)return ro[i];}return ro[0];}
function addGoal(g,side,min,sc,as){g.ev.push({m:min,t:'gol',side:side,p:sc.id,as:as?as.id:null});}
function simGame(g,fh,fa){
  var H=TM[g.h],A=TM[g.a];
  var gh=fh!=null?fh:Math.min(6,poisson(1.35*H.s/A.s)),ga=fa!=null?fa:Math.min(6,poisson(1.1*A.s/H.s));
  g.gh=gh;g.ga=ga;g.st='encerrado';
  [[g.h,gh,'h'],[g.a,ga,'a']].forEach(function(x){for(var i=0;i<x[1];i++){var sc=pickScorer(x[0]);var as=R()<.7?pickScorer(x[0],sc):null;addGoal(g,x[2],1+Math.floor(R()*90),sc,as);}});
  var nc=Math.floor(R()*3);for(var c=0;c<nc;c++){var side=R()<.5?'h':'a',ro=TM[side==='h'?g.h:g.a].roster;g.ev.push({m:1+Math.floor(R()*90),t:'amarelo',side:side,p:ro[2+Math.floor(R()*18)].id});}
  if(R()<.55){var vs=R()<.5?'h':'a';g.ev.push({m:10+Math.floor(R()*75),t:'var',side:vs,txt:['Pedido de pênalti revisado. Decisão de campo mantida.','Impedimento confirmado após revisão.','Pênalti marcado após revisão.'][Math.floor(R()*3)]});if(vs==='h')g.varH--;else g.varA--;}
  g.ev.sort(function(a,b){return a.m-b.m;});
  finishStats(g);
}
function finishStats(g){
  var goals={};g.ev.forEach(function(e){if(e.t==='gol'){goals[e.p]=(goals[e.p]||0)+1;}});
  [g.h,g.a].forEach(function(tid){
    var ro=TM[tid].roster,full=[];while(full.length<3){var c=ro[2+Math.floor(R()*18)];if(full.indexOf(c)<0)full.push(c);}
    ro.forEach(function(p){var m=p.pos==='GOL'?45:full.indexOf(p)>=0?90:45+Math.floor(R()*28);p.j++;p.min+=m;p.games.push({g:g.id,min:m,gl:goals[p.id]||0});});
  });
  g.ev.forEach(function(e){if(e.t==='gol'){PM[e.p].g++;if(e.as)PM[e.as].a++;}if(e.t==='amarelo')PM[e.p].ca++;});
  var win=g.gh>g.ga?g.h:g.ga>g.gh?g.a:null,best=null,bv=-1;
  Object.keys(goals).forEach(function(pid){var v=goals[pid]*2+(PM[pid].team===win?1:0);if(v>bv){bv=v;best=pid;}});
  if(!best){var ro=TM[win||g.h].roster;best=ro[5+Math.floor(R()*14)].id;}
  g.mvp=best;PM[best].mvp++;
}
GAMES.forEach(function(g){if(g.r<CUR)simGame(g);});
var g61=GAMES.filter(function(g){return g.r===6;});
simGame(g61[0],3,0);
LIVE=g61[1];LIVE.st='ao vivo';LIVE.gh=2;LIVE.ga=1;LIVE.min=67;LIVE.varA=1;
LIVE.ev=[{m:12,t:'gol',side:'h',p:'falcoes-9',as:'falcoes-10'},{m:31,t:'amarelo',side:'a',p:'lobos-5'},{m:38,t:'gol',side:'a',p:'lobos-9'},{m:46,t:'sub',side:'h',txt:'8 substituições no intervalo. Todos os atletas do 1º tempo cumpriram 45 minutos.'},{m:54,t:'var',side:'a',txt:'Pedido de pênalti revisado. Decisão de campo mantida.'},{m:61,t:'gol',side:'h',p:'falcoes-10',as:'falcoes-9'}];
LIVE.ev.forEach(function(e){if(e.t==='gol'){PM[e.p].g++;if(e.as)PM[e.as].a++;}});

function standings(){
  var S={};TEAMS.forEach(function(t){S[t.id]={t:t,j:0,v:0,e:0,d:0,gp:0,gc:0,f:[]};});
  GAMES.filter(function(g){return g.st==='encerrado';}).sort(function(a,b){return a.date-b.date;}).forEach(function(g){
    var h=S[g.h],a=S[g.a];h.j++;a.j++;h.gp+=g.gh;h.gc+=g.ga;a.gp+=g.ga;a.gc+=g.gh;
    if(g.gh>g.ga){h.v++;a.d++;h.f.push('V');a.f.push('D');}else if(g.gh<g.ga){a.v++;h.d++;a.f.push('V');h.f.push('D');}else{h.e++;a.e++;h.f.push('E');a.f.push('E');}
  });
  return Object.keys(S).map(function(k){var x=S[k];x.pts=x.v*3+x.e;x.sg=x.gp-x.gc;return x;}).sort(function(a,b){return b.pts-a.pts||b.v-a.v||b.sg-a.sg||b.gp-a.gp;});
}
var ST=standings();
var SCORERS=PLAYERS.filter(function(p){return p.g>0;}).sort(function(a,b){return b.g-a.g||b.a-a.a||a.n.localeCompare(b.n);});
var MVPS=PLAYERS.filter(function(p){return p.mvp>0;}).sort(function(a,b){return b.mvp-a.mvp||b.g-a.g;});
function craqueOf(r){var gs=GAMES.filter(function(g){return g.r===r&&g.st==='encerrado';}),best=null,bv=-1;gs.forEach(function(g){var p=PM[g.mvp],gl=g.ev.filter(function(e){return e.t==='gol'&&e.p===p.id;}).length;var v=gl*3+(p.team===(g.gh>g.ga?g.h:g.a)?1:0);if(v>bv){bv=v;best={p:p,gl:gl,g:g};}});return best;}

