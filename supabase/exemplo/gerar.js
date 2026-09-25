/* Gera supabase/exemplo/dados-exemplo.sql a partir de js/dados-exemplo.js,
   para o banco ter exatamente os mesmos times, atletas e jogos que o site mostra.
   Uso: node supabase/exemplo/gerar.js */
var fs=require('fs'),vm=require('vm'),path=require('path');
var raiz=path.join(__dirname,'..','..'),ctx={console:console};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz,'js','dados-exemplo.js'),'utf8')+
  ';this.D={TEAMS:TEAMS,PLAYERS:PLAYERS,PM:PM,GAMES:GAMES,FOTOS:FOTOS,UNITS:UNITS};',ctx);
var D=ctx.D;
function q(s){return s==null?'null':"'"+String(s).replace(/'/g,"''")+"'";}
function aid(id){return "pg_temp.a('"+id+"')";}
function jid(g){return "pg_temp.j('"+g.id+"')";}
function p2(n){return String(n).padStart(2,'0');}
function dataHora(g){var d=g.date,hm=g.time==='21h'?'21:00':'19:30';return q(d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+' '+hm+':00-03');}
var TEMP='pg_temp.t()';
var out=['-- Dados de exemplo da apresentação. Gerado por supabase/exemplo/gerar.js; não edite à mão.','begin;',
 "create function pg_temp.a(text) returns uuid language sql immutable as $$ select md5('exemplo-atleta-'||$1)::uuid $$;",
 "create function pg_temp.j(text) returns uuid language sql immutable as $$ select md5('exemplo-'||$1)::uuid $$;",
 "create function pg_temp.t() returns smallint language sql stable as $$ select id from public.temporadas where nome='Temporada 2027' $$;",
 "create function pg_temp.u(text) returns smallint language sql stable as $$ select id from public.unidades where nome=$1 $$;"];
out.push('insert into public.times (id,temporada_id,nome,cor,ordem,exemplo) values');
out.push(D.TEAMS.map(function(t,i){return ' ('+q(t.id)+','+TEMP+','+q(t.n)+','+q(t.c)+','+(i+1)+',true)';}).join(',\n')+';');
out.push('insert into public.atletas (id,nome,posicao,unidade_id,foto_url,exemplo) values');
out.push(D.PLAYERS.map(function(p){return ' ('+aid(p.id)+','+q(p.n)+','+q(p.pos)+',pg_temp.u('+q(p.unit)+'),'+q(D.FOTOS[p.id]||null)+',true)';}).join(',\n')+';');
out.push('insert into public.elencos (temporada_id,time_id,atleta_id,numero,nome_camisa,kit) values');
out.push(D.PLAYERS.map(function(p){return ' ('+TEMP+','+q(p.team)+','+aid(p.id)+','+p.num+','+q(p.n.split(' ').slice(-1)[0].toUpperCase().slice(0,12))+",'M')";}).join(',\n')+';');
var st={'agendado':'agendado','ao vivo':'ao_vivo','encerrado':'encerrado'};
out.push('insert into public.jogos (id,temporada_id,rodada,ordem,data_hora,local,time_casa,time_fora,status,gols_casa,gols_fora,minuto_atual,mvp_atleta_id,sumula_fechada,exemplo) values');
out.push(D.GAMES.map(function(g){return ' ('+jid(g)+','+TEMP+','+g.r+','+(g.i+1)+','+dataHora(g)+','+q(g.field)+','+q(g.h)+','+q(g.a)+','+q(st[g.st])+','+(g.gh==null?'null':g.gh)+','+(g.ga==null?'null':g.ga)+','+(g.min==null?'null':g.min)+','+(g.mvp?aid(g.mvp):'null')+','+(g.st==='encerrado')+',true)';}).join(',\n')+';');
var esc=[],nEsc=0;D.GAMES.forEach(function(g){[g.h,g.a].forEach(function(tm){var ns=[],ms=[];
  D.PLAYERS.forEach(function(p){if(p.team!==tm)return;p.games.forEach(function(x){if(x.g===g.id){ns.push(p.num);ms.push(x.min);nEsc++;}});});
  if(ns.length)esc.push(" ('"+g.id+"','"+tm+"','{"+ns.join(',')+"}','{"+ms.join(',')+"}')");});});
out.push('insert into public.escalacoes (jogo_id,atleta_id,time_id,titular,posicao,entrou_min,minutos)');
out.push("select pg_temp.j(v.jogo),e.atleta_id,v.time,x.m>=90,a.posicao,0,x.m from (values");
out.push(esc.join(',\n'));
out.push(") v(jogo,time,ns,ms) cross join lateral unnest(v.ns::int[],v.ms::int[]) x(n,m)");
out.push("join public.elencos e on e.time_id=v.time and e.numero=x.n join public.atletas a on a.id=e.atleta_id;");
var ev=[],vr=[],k=0,tipo={gol:'gol',amarelo:'cartao_amarelo',sub:'substituicao'};
D.GAMES.forEach(function(g){g.ev.forEach(function(e){var tm=e.side==='h'?g.h:g.a;
  if(e.t==='var'){vr.push(' ('+jid(g)+','+q(tm)+','+e.m+','+q(e.txt)+','+q(/marcado/.test(e.txt)?'revertida':'mantida')+')');return;}
  ev.push(' ('+jid(g)+','+e.m+','+q(tipo[e.t])+','+q(tm)+','+(e.p?aid(e.p):'null')+','+(e.as?aid(e.as):'null')+','+q(e.txt||null)+",timestamptz '2027-01-01Z'+"+(k++)+"*interval '1ms')");});});
out.push('insert into public.eventos_jogo (jogo_id,minuto,tipo,time_id,atleta_id,atleta2_id,observacao,criado_em) values');
out.push(ev.join(',\n')+';');
out.push('insert into public.desafios_var (jogo_id,time_id,minuto,motivo,resultado) values');
out.push(vr.join(',\n')+';');
out.push('commit;');
fs.writeFileSync(path.join(__dirname,'dados-exemplo.sql'),out.join('\n')+'\n');
console.log('times',D.TEAMS.length,'atletas',D.PLAYERS.length,'jogos',D.GAMES.length,'escalacoes',nEsc,'eventos',ev.length,'var',vr.length);
