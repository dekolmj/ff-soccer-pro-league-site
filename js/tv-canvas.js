/* TV FF: animação em canvas que faz o papel dos vídeos do YouTube.
   Fica dentro de uma função para as variáveis internas não se misturarem com o resto do site;
   só Scene e initCanvases ficam disponíveis para o app.js. */
(function(){
/* ================= CANVAS ================= */
  // ===== Broadcast canvas =====
  function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  var FORM=[[4,34],[19,10],[17,26],[17,42],[19,58],[34,14],[32,34],[34,54],[47,20],[50,34],[47,48]];
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function Scene(cv){
    var seed=+cv.dataset.seed||1,r=rng(seed),st=!!cv.dataset.static;
    var ctx=cv.getContext('2d'),W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,2);
    var crowd=[];for(var i=0;i<420;i++)crowd.push([r(),r(),r()]);
    var P=[];for(var t=0;t<2;t++)FORM.forEach(function(f,k){var bx=t?105-f[0]:f[0],by=t?68-f[1]:f[1];P.push({t:t,k:k,bx:bx,by:by,x:bx+(r()-.5)*6,y:by+(r()-.5)*6,sp:3.5+r()*2});});
    var ball={x:40+r()*25,y:18+r()*32,tx:0,ty:0,h:0},cam=ball.x;
    function newPass(){var cands=P.filter(function(p){return Math.abs(p.x-ball.x)<28&&p.k>0;});var q=cands[Math.floor(r()*cands.length)]||P[9];ball.tx=q.x+(r()-.5)*3;ball.ty=q.y+(r()-.5)*3;ball.dist=Math.hypot(ball.tx-ball.x,ball.ty-ball.y);}
    newPass();
    function size(){var w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return false;if(w*dpr!==W){W=cv.width=Math.round(w*dpr);H=cv.height=Math.round(h*dpr);}return true;}
    function pr(x,y){var t=y/68,z=1.9-.9*t,inv=1/z,k=(inv-1/1.9)/(1-1/1.9),sc=W/34;return[W/2+(x-cam)*sc*inv,H*.24+k*H*.88,inv*sc];}
    function poly(pts,fill){ctx.beginPath();pts.forEach(function(p,i){var q=pr(p[0],p[1]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
    function line(pts,close){ctx.beginPath();pts.forEach(function(p,i){var q=pr(p[0],p[1]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});if(close)ctx.closePath();ctx.stroke();}
    function rect(x0,y0,x1,y1){line([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],true);}
    function update(dt){
      var dx=ball.tx-ball.x,dy=ball.ty-ball.y,d=Math.hypot(dx,dy),v=14*dt;
      if(d<v){ball.x=ball.tx;ball.y=ball.ty;newPass();}else{ball.x+=dx/d*v;ball.y+=dy/d*v;}
      ball.h=ball.dist>12?Math.sin(Math.PI*(1-Math.min(d/ball.dist,1)))*Math.min(ball.dist/12,2.2):0;
      [0,1].forEach(function(t){
        var team=P.filter(function(p){return p.t===t;}).sort(function(a,b){return Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y);});
        team.forEach(function(p,i){var tx,ty;
          if(p.k===0){tx=p.bx+(ball.x-52.5)*.06;ty=34+(ball.y-34)*.25;}
          else if(i<2){tx=ball.x+(t?2:-2)*(i+1);ty=ball.y+(i?3:-1.5);}
          else{tx=p.bx+(ball.x-52.5)*.45;ty=p.by+(ball.y-34)*.3;}
          var ex=tx-p.x,ey=ty-p.y,e=Math.hypot(ex,ey),m=p.sp*dt;if(e>.3){p.x+=ex/e*Math.min(m,e);p.y+=ey/e*Math.min(m,e);}
        });
      });
      cam+=(Math.max(18,Math.min(87,ball.x))-cam)*Math.min(1,dt*1.2);
    }
    function draw(){
      if(!size())return;
      var g=ctx.createLinearGradient(0,0,0,H*.3);g.addColorStop(0,'#050505');g.addColorStop(1,'#16140f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      // crowd
      crowd.forEach(function(c){var x=((c[0]*W*1.6)-(cam-52.5)*W*.012)%(W*1.6);if(x<0)x+=W*1.6;x-=W*.3;var y=H*(.04+c[1]*.17);ctx.fillStyle=c[2]>.85?'rgba(242,193,77,.55)':c[2]>.6?'rgba(250,249,245,.28)':'rgba(120,115,100,.35)';ctx.fillRect(x,y,W*.006,H*.012);});
      // grass
      poly([[-40,-2.5],[145,-2.5],[145,75],[-40,75]],'#1d4a2c');
      for(var i=0;i<20;i++){poly([[i*5.25,0],[(i+1)*5.25,0],[(i+1)*5.25,68],[i*5.25,68]],i%2?'#2a6a3d':'#245d36');}
      // ad boards
      ctx.fillStyle='#0B0B0A';ctx.fillRect(0,H*.215,W,H*.03);
      for(var b=0;b<8;b++){var bx=((b*W*.28)-(cam-52.5)*W*.02)%(W*2.24);if(bx<-W*.3)bx+=W*2.24;ctx.fillStyle=b%2?'#F2C14D':'#1b1a16';ctx.fillRect(bx,H*.218,W*.26,H*.024);ctx.fillStyle=b%2?'#0B0B0A':'#F2C14D';ctx.font='700 '+Math.round(H*.02)+'px "Barlow Condensed",Arial Narrow,sans-serif';ctx.fillText(b%2?'FF SOCCER PRO LEAGUE':'SUA MARCA AQUI',bx+W*.02,H*.236);}
      ctx.strokeStyle='rgba(255,255,255,.78)';ctx.lineWidth=Math.max(1,W/420);
      rect(0,0,105,68);line([[52.5,0],[52.5,68]]);
      var cc=[];for(var a=0;a<=40;a++)cc.push([52.5+Math.cos(a/40*Math.PI*2)*9.15,34+Math.sin(a/40*Math.PI*2)*9.15]);line(cc);
      rect(0,13.84,16.5,54.16);rect(0,24.84,5.5,43.16);rect(88.5,13.84,105,54.16);rect(99.5,24.84,105,43.16);
      [[0,-1],[105,1]].forEach(function(gp){var a1=pr(gp[0],30.34),a2=pr(gp[0],37.66);ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(1.5,W/300);ctx.beginPath();ctx.moveTo(a1[0],a1[1]);ctx.lineTo(a1[0],a1[1]-2.44*a1[2]);ctx.lineTo(a2[0],a2[1]-2.44*a2[2]);ctx.lineTo(a2[0],a2[1]);ctx.stroke();});
      // players sorted by depth
      var items=P.slice().sort(function(a,b){return a.y-b.y;});
      var bq=pr(ball.x,ball.y),bdrawn=false;
      items.forEach(function(p){
        if(!bdrawn&&p.y>ball.y){drawBall();bdrawn=true;}
        var q=pr(p.x,p.y),h=1.85*q[2],w=h*.34;
        ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(q[0]+w*.4,q[1],w*.9,w*.28,0,0,7);ctx.fill();
        var shirt=p.k===0?(p.t?'#E8A33B':'#F2C14D'):(p.t?'#E9E7E0':'#5AA9E6'),shorts=p.t?'#2b2b2b':'#FAF9F5';
        ctx.fillStyle='#111';ctx.fillRect(q[0]-w*.38,q[1]-h*.3,w*.3,h*.3);ctx.fillRect(q[0]+w*.08,q[1]-h*.3,w*.3,h*.3);
        ctx.fillStyle=shorts;ctx.fillRect(q[0]-w/2,q[1]-h*.47,w,h*.2);
        ctx.fillStyle=shirt;ctx.fillRect(q[0]-w/2,q[1]-h*.82,w,h*.37);
        ctx.fillStyle='#c79a7a';ctx.beginPath();ctx.arc(q[0],q[1]-h*.9,w*.34,0,7);ctx.fill();
      });
      if(!bdrawn)drawBall();
      function drawBall(){var q=pr(ball.x,ball.y),rr=Math.max(1.6,.3*q[2]);ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(q[0],q[1],rr,rr*.4,0,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q[0],q[1]-rr-ball.h*q[2],rr,0,7);ctx.fill();}
      // floodlight vignette
      var v=ctx.createRadialGradient(W/2,H*.55,H*.2,W/2,H*.55,W*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
    }
    // warm up positions for static thumbs / first frame
    for(var w=0;w<(st?60+seed:30);w++)update(.1);
    var visible=false,last=0;
    function loop(ts){if(!visible)return;var dt=Math.min(.05,(ts-(last||ts))/1000);last=ts;if(!cv.dataset.paused)update(dt);draw();requestAnimationFrame(loop);}
    if('ResizeObserver' in window)new ResizeObserver(function(){draw();}).observe(cv);
    if(!st&&!reduce&&'IntersectionObserver' in window){new IntersectionObserver(function(es){var was=visible;visible=es[0].isIntersecting;if(visible&&!was){last=0;requestAnimationFrame(loop);}}).observe(cv);}
    draw();
  }

function initCanvases(){document.querySelectorAll('#app canvas.bc').forEach(function(cv){if(cv.dataset.ok)return;cv.dataset.ok=1;try{Scene(cv);}catch(e){}});}
window.Scene=Scene;window.initCanvases=initCanvases;
})();
