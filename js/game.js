(()=>{
'use strict';
/* ================= CHỈNH Ở ĐÂY ================= */
const CLUB='CLB EPIC';
const PHOTO_SRC='assets/poster.jpg';   // đường dẫn ảnh chụp chung của CLB, ví dụ 'anh-chung.jpg'. Để trống: dùng ảnh tạm + nút "Chọn ảnh chung"
const LETTER=[
 'Gửi các bạn nam của '+CLUB+',',
 'Nhân Ngày Quốc tế Nam giới 19/11, tụi mình, các bạn nữ của CLB, muốn nói với các bạn một lời cảm ơn. Cảm ơn vì lúc nào cũng có mặt, vì việc nặng việc khó luôn có các bạn gánh trước, và vì những khoảnh khắc mà sau này nhớ lại, ai cũng sẽ bật cười.',
 'Tụi mình chúc các bạn khỏe, giữ được đam mê của mình, đủ gan để đi qua mọi thử thách và đủ tự tin để theo đuổi ước mơ. Bài tập, kỳ thi hay áp lực có kéo đến thì các bạn cứ nhớ rằng phía sau vẫn luôn có cả '+CLUB+'.',
 'Cảm ơn vì các bạn là một mảnh ghép mà CLB không thể thiếu.'
];
const SIGN='Thân ái,\nCác bạn nữ '+CLUB;
const CLASSES=[
 {id:'war',name:'Giáp Titan',e:'🛡️',d:'Trâu bò, nhiều mạng',hp:1.3,dmg:1,spd:.95,lives:4},
 {id:'arc',name:'Động cơ Turbo',e:'🚀',d:'Nhanh nhẹn, chạy lẹ',hp:1,dmg:1.15,spd:1.12,lives:3},
 {id:'mag',name:'Lõi Plasma',e:'🔋',d:'Sát thương lớn',hp:.9,dmg:1.4,spd:1,lives:3}
];
/* ================================================= */
const MASCOT_SRC='assets/mascot.png';

const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PAL=['#ff7a1a','#4df5ea','#7ee787','#ffd166','#ff6b3d','#a78bff'];

/* ---------- trạng thái người chơi ---------- */
let slamHit=false,got=new Array(10).fill(false),pieceI=0,wPhase='spin',spinR=0,spinFrom=0,spinTo=0,spinT=0,spinLast=0;const pzc=document.getElementById('pzc');let M=CLASSES[0],pname='Chiến hữu',fails=new Array(10).fill(0),wishT=0,finT=0,letterOn=false;

/* ---------- âm thanh ---------- */
let AC=null,muted=false,bgmT=null,bstep=0;
function ensureAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}}
function sSlam(){tone(110,.28,'sine',.35,-70);tone(220,.12,'square',.14,-120);tone(880,.18,'triangle',.08,400)}
function tone(f,d=.1,type='sine',v=.12,slide=0){
  if(muted||!AC)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;
    o.type=type;o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d);
  }catch(e){}
}
const sHit=(c=0)=>tone(480+Math.min(c,12)*50,.1,'triangle',.13);
const sBad=()=>tone(150,.25,'sawtooth',.1,-80);
const sWin=()=>{[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.25,'triangle',.14),i*110))};
const sBoom=()=>tone(210,.5,'sawtooth',.09,-160);
const sPunch=()=>tone(120,.12,'square',.14,-60);
const SCALE=[0,3,5,7,10,12,15,17];
function bgmSet(ms){
  if(bgmT)clearInterval(bgmT);
  bgmT=setInterval(()=>{
    if(muted||!AC)return;bstep++;
    if(bstep%2===0)tone(220*Math.pow(2,SCALE[(bstep*3+(bstep>>3))%8]/12),.11,'square',.025);
    if(bstep%4===0)tone(55,.2,'triangle',.07);
  },ms);
}
try{muted=localStorage.getItem('epic1911_mute')==='1'}catch(e){}
$('mute').textContent=muted?'🔇':'🔊';
$('mute').onclick=e=>{muted=!muted;e.target.textContent=muted?'🔇':'🔊';try{localStorage.setItem('epic1911_mute',muted?'1':'0')}catch(_){}};

/* ---------- linh vật ---------- */
const mImg=new Image();mImg.src=MASCOT_SRC;
const mG1=$('mImg').getContext('2d'),mG2=$('mImg2').getContext('2d');
const blinking=()=>(bgT%3.7)<.14;
/* mắt: 'normal' (một mắt cong, một mắt X), 'happy' (hai mắt cong), 'hurt' (hai mắt X), 'angry' (mắt xếch), 'blink' */
function drawEyes(g,w,h,expr){
  if(expr==='normal'&&blinking())expr='blink';
  const e=w*.05,ly=-h+h*.345,lx=-w/2+w*.411,rx=-w/2+w*.646;
  g.save();g.lineCap='round';g.lineJoin='round';
  const bowl=cx=>{
    const gr=g.createLinearGradient(0,ly-e,0,ly+e);gr.addColorStop(0,'#ffffff');gr.addColorStop(.55,'#ffffff');gr.addColorStop(.56,'#a9d4ff');gr.addColorStop(1,'#8cc4ff');
    g.fillStyle=gr;g.beginPath();g.moveTo(cx-e*1.05,ly-e*.3);g.quadraticCurveTo(cx-e*.2,ly-e*.75,cx+e*1.05,ly-e*.35);
    g.quadraticCurveTo(cx+e*.9,ly+e*1.05,cx,ly+e*1.05);g.quadraticCurveTo(cx-e*.95,ly+e*1.0,cx-e*1.05,ly-e*.3);g.closePath();g.fill();
  };
  const xeye=cx=>{g.strokeStyle='#d4ebff';g.lineWidth=e*.55;g.beginPath();g.moveTo(cx-e*.8,ly-e*.7);g.lineTo(cx+e*.8,ly+e*.8);g.moveTo(cx+e*.8,ly-e*.7);g.lineTo(cx-e*.8,ly+e*.8);g.stroke()};
  const slant=(cx,dir)=>{g.strokeStyle='#ffffff';g.lineWidth=e*.6;g.beginPath();g.moveTo(cx-dir*e,ly-e*.55);g.lineTo(cx+dir*e,ly+e*.4);g.stroke()};
  const line=cx=>{g.strokeStyle='#ffffff';g.lineWidth=e*.45;g.beginPath();g.moveTo(cx-e,ly+e*.1);g.lineTo(cx+e,ly+e*.1);g.stroke()};
  if(expr==='normal'){bowl(lx);xeye(rx)}
  else if(expr==='happy'){g.strokeStyle='#e8f4ff';g.lineWidth=e*.5;g.beginPath();g.moveTo(lx-e*.7,ly-e*.7);g.lineTo(lx+e*.7,ly);g.lineTo(lx-e*.7,ly+e*.7);g.moveTo(rx+e*.7,ly-e*.7);g.lineTo(rx-e*.7,ly);g.lineTo(rx+e*.7,ly+e*.7);g.stroke()}
  else if(expr==='hurt'){xeye(lx);xeye(rx)}
  else if(expr==='angry'){slant(lx,1);slant(rx,-1)}
  else{line(lx);line(rx)}
  g.restore();
}
function mascotG(g,x,y,h,o){
  o=o||{};
  if(!mImg.complete||!mImg.naturalWidth)return;
  const w=h*mImg.naturalWidth/mImg.naturalHeight;
  g.save();g.translate(x,y);g.rotate(o.rot||0);g.scale((o.sx||1),(o.sy||1));
  if(o.glow){g.shadowColor=o.glow;g.shadowBlur=16}
  g.drawImage(mImg,-w/2,-h,w,h);
  g.shadowBlur=0;
  drawEyes(g,w,h,o.expr||'normal');
  if(o.flash){g.globalCompositeOperation='lighter';g.globalAlpha=o.flash;g.drawImage(mImg,-w/2,-h,w,h)}
  g.restore();
}
const mascot=(x,y,h,o)=>mascotG(ctx,x,y,h,o);

/* ---------- hạt & chữ nổi ---------- */
const parts=[],fts=[];
function burst(x,y,n=18,cols=PAL,spd=240,life=.8,size=3){
  for(let i=0;i<n;i++){
    if(parts.length>700)break;
    const a=Math.random()*6.283,s=rnd(spd*.3,spd);
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(life*.6,life),max:life,c:cols[(Math.random()*cols.length)|0],s:rnd(size*.6,size*1.5),g:120});
  }
}
function firework(x,y){burst(x,y,70,[PAL[(Math.random()*PAL.length)|0],'#fff'],360,1.4,3);sBoom()}
function ft(t,x,y,c='#fff',sz=22){fts.push({t,x,y,c,sz,life:.9,max:.9})}
function updParts(dt){
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];p.life-=dt;if(p.life<=0){parts.splice(i,1);continue}
    p.vy+=p.g*dt;p.vx*=.992;p.x+=p.vx*dt;p.y+=p.vy*dt;
  }
  for(let i=fts.length-1;i>=0;i--){const t=fts[i];t.life-=dt;t.y-=40*dt;if(t.life<=0)fts.splice(i,1)}
}
function drawParts(){
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const p of parts){const a=Math.max(0,p.life/p.max);ctx.globalAlpha=a;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(.5+a),0,6.283);ctx.fill()}
  ctx.restore();
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  for(const t of fts){ctx.globalAlpha=Math.min(1,t.life/t.max*1.6);ctx.font='900 '+t.sz+'px "Be Vietnam Pro",sans-serif';ctx.fillStyle=t.c;ctx.shadowColor=t.c;ctx.shadowBlur=10;ctx.fillText(t.t,t.x,t.y)}
  ctx.restore();
}

/* ---------- vẽ chung ---------- */
let bgT=0,shake=0;
let bgC=null,bgKey='';
const twk=Array.from({length:46},(_,i)=>({x:((i*137.5)%100)/100,y:((i*61.8+17)%100)/100,r:.6+(i%4)*.35,ph:i*1.7,sp:.6+(i%5)*.25,c:i%9===0?'180,200,255':i%7===0?'255,225,200':'255,255,255'}));
let shoot=null,shootT=6;
function buildBg(){
  bgC=document.createElement('canvas');bgC.width=W;bgC.height=H;const g=bgC.getContext('2d');
  let seed=7;const rn=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#070d1f');gr.addColorStop(.55,'#0d1b3d');gr.addColorStop(1,'#14295a');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
  const blob=(x,y,r,c,a)=>{const b=g.createRadialGradient(x,y,0,x,y,r);b.addColorStop(0,'rgba('+c+','+a+')');b.addColorStop(1,'rgba('+c+',0)');g.fillStyle=b;g.fillRect(x-r,y-r,r*2,r*2)};
  const R=Math.max(W,H);
  blob(W*.2,H*.22,R*.55,'120,90,230',.15);blob(W*.85,H*.38,R*.5,'60,130,255',.14);blob(W*.35,H*.8,R*.6,'50,190,220',.09);blob(W*.8,H*.9,R*.4,'150,90,220',.1);
  // dải ngân hà mờ
  g.save();g.translate(W*.5,H*.5);g.rotate(-.55);g.scale(1,.2);
  const mw=g.createRadialGradient(0,0,0,0,0,R*.95);mw.addColorStop(0,'rgba(200,215,255,.13)');mw.addColorStop(.5,'rgba(140,170,255,.06)');mw.addColorStop(1,'rgba(140,170,255,0)');
  g.fillStyle=mw;g.beginPath();g.arc(0,0,R*.95,0,6.283);g.fill();g.restore();
  // bụi sao
  for(let i=0;i<420;i++){
    const inBand=i<260;let x,y;
    if(inBand){const t=(rn()-.5)*R*1.5,off=(rn()+rn()+rn()-1.5)*H*.16;x=W/2+t*Math.cos(-.55)-off*Math.sin(-.55);y=H/2+t*Math.sin(-.55)+off*Math.cos(-.55)}
    else{x=rn()*W;y=rn()*H}
    g.globalAlpha=.12+rn()*.4;g.fillStyle='#dfe8ff';g.fillRect(x,y,rn()<.15?1.8:1,rn()<.15?1.8:1);
  }
  g.globalAlpha=1;
}
function drawBg(dt){
  if(!bgC||bgKey!==W+'x'+H){buildBg();bgKey=W+'x'+H}
  ctx.drawImage(bgC,0,0,W,H);
  for(const t of twk){
    const a=.18+.4*(.5+.5*Math.sin(bgT*t.sp+t.ph));
    ctx.fillStyle='rgba('+t.c+','+a+')';ctx.beginPath();ctx.arc(t.x*W,t.y*H,t.r,0,6.283);ctx.fill();
  }
  shootT-=1/60;
  if(!shoot&&shootT<=0){shoot={x:rnd(W*.4,W*.95),y:rnd(0,H*.3),t:0};shootT=rnd(7,13)}
  if(shoot){
    shoot.t+=1/60;const k=shoot.t/.9;
    if(k>=1)shoot=null;
    else{const x=shoot.x-k*W*.28,y=shoot.y+k*H*.12;const tg=ctx.createLinearGradient(x,y,x+60,y-25);tg.addColorStop(0,'rgba(255,255,255,'+(.5*(1-k))+')');tg.addColorStop(1,'rgba(255,255,255,0)');ctx.strokeStyle=tg;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+60,y-25);ctx.stroke()}
  }
}
function glowCircle(x,y,r,col,fill=true,lw=3){
  ctx.save();ctx.shadowColor=col;ctx.shadowBlur=16;ctx.strokeStyle=col;ctx.lineWidth=lw;
  ctx.beginPath();ctx.arc(x,y,r,0,6.283);
  if(fill){ctx.fillStyle=col;ctx.globalAlpha=.25;ctx.fill();ctx.globalAlpha=1}
  ctx.stroke();ctx.restore();
}
function dot(x,y,r,col,a=1){ctx.fillStyle=col;ctx.globalAlpha=a*.28;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r*1.9,0,6.283);ctx.fill();ctx.globalAlpha=a;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();ctx.globalAlpha=1}
function gtext(t,x,y,size,col,align='center'){
  ctx.save();ctx.font='900 '+size+'px "Be Vietnam Pro",sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';
  ctx.shadowColor=col;ctx.shadowBlur=14;ctx.fillStyle='#fff';ctx.fillText(t,x,y);ctx.restore();
}
function bar(x,y,w,h,p,col,flip=false){
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.shadowColor=col;ctx.shadowBlur=8;ctx.strokeRect(x,y,w,h);
  ctx.fillStyle=col;const fw=Math.max(0,(w-6)*clamp(p,0,1));
  ctx.fillRect(flip?x+3+(w-6-fw):x+3,y+3,fw,h-6);ctx.restore();
}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

/* ---------- nhập liệu ---------- */
const inp={down:false,x:0,y:0,sx:0,sy:0,px:0,py:0,mdx:0,mdy:0,sw:false};
const P={};
let state='title',si=0,cur=null,introT=0;
const kmap={ArrowLeft:'L',ArrowRight:'R',a:'L',d:'R',ArrowUp:'Up',w:'Up',ArrowDown:'Dn',s:'Dn',j:'A',k:'B',l:'D',u:'S',' ':'N',x:'U'};
const swk={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
function press(k){if(state==='play'&&cur&&cur.press)cur.press(k)}
addEventListener('keydown',e=>{
  const tg=e.target&&e.target.tagName;if(tg==='INPUT')return;
  const k=kmap[e.key];
  if(k&&!P[k]){P[k]=true;press(k)}
  if(swk[e.key]&&!e.repeat&&state==='play'&&cur&&cur.swipe)cur.swipe(swk[e.key]);
  if(e.key===' ')e.preventDefault();
});
addEventListener('keyup',e=>{const k=kmap[e.key];if(k)P[k]=false});
cv.addEventListener('pointerdown',e=>{
  e.preventDefault();ensureAudio();try{cv.setPointerCapture(e.pointerId)}catch(_){}
  inp.down=true;inp.sx=inp.px=inp.x=e.clientX;inp.sy=inp.py=inp.y=e.clientY;inp.sw=false;
  if(state==='play'&&cur&&cur.pointer)cur.pointer('down',inp.x,inp.y);
});
cv.addEventListener('pointermove',e=>{
  if(!inp.down)return;
  inp.mdx+=e.clientX-inp.px;inp.mdy+=e.clientY-inp.py;inp.px=inp.x=e.clientX;inp.py=inp.y=e.clientY;
  if(state==='play'&&cur){
    if(cur.swipe){
      const dx=inp.x-inp.sx,dy=inp.y-inp.sy;
      if(Math.hypot(dx,dy)>34){cur.swipe(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));inp.sx=inp.x;inp.sy=inp.y}
    }
    if(cur.pointer)cur.pointer('move',inp.x,inp.y);
  }
});
const pu=()=>{inp.down=false;if(state==='play'&&cur&&cur.pointer)cur.pointer('up',inp.x,inp.y)};
cv.addEventListener('pointerup',pu);cv.addEventListener('pointercancel',pu);
document.querySelectorAll('#pad button').forEach(b=>{
  const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();ensureAudio();try{b.setPointerCapture(e.pointerId)}catch(_){}P[k]=true;b.classList.add('dn');press(k)});
  const up=()=>{P[k]=false;b.classList.remove('dn')};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
});
function setPad(keys){
  document.querySelectorAll('#pad button').forEach(b=>{b.style.display=keys.includes(b.dataset.k)?'':'none'});
  $('pad').style.display=keys.length?'flex':'none';
  for(const k in P)P[k]=false;
}
const mvx=()=>(P.R?1:0)-(P.L?1:0);
const mvy=()=>(P.Dn?1:0)-(P.Up?1:0);

/* =====================================================
   CHẶNG 1: CHẠY NÉ
   ===================================================== */
function makeRunner(f){
  const sc=1-.12*f;
  const o={lane:1,x:1,jt:0,st:0,lives:M.lives,t:0,dur:28,obs:[],sp:.5,inv:0,coins:0,zoff:0,ownBg:true};
  const LW=()=>Math.min(120,W/3.2),hy=()=>H*.28,yb=()=>H*.95;
  const sx=(lane,s)=>W/2+(lane-1)*LW()*s, sy=s=>hy()+(yb()-hy())*s;
  const vel=()=>(3.6+1.5*o.t/o.dur)*sc;
  o.swipe=d=>{
    if(d==='left')o.lane=Math.max(0,o.lane-1);
    else if(d==='right')o.lane=Math.min(2,o.lane+1);
    else if(d==='up'&&o.jt<=0&&o.st<=0){o.jt=.7;tone(600,.15,'triangle',.1,300)}
    else if(d==='down'&&o.st<=0&&o.jt<=0){o.st=.6;tone(300,.15,'triangle',.1,-100)}
  };
  function spawnRow(){
    const free=(Math.random()*3)|0;const types=['low','high','tall'];
    for(let l=0;l<3;l++){
      if(l===free)continue;
      if(Math.random()<.78)o.obs.push({l,z:9.5,k:types[(Math.random()*3)|0],done:false});
    }
    if(Math.random()<.9)for(let i=0;i<3;i++)o.obs.push({l:free,z:9.5+i*.55,k:'coin',done:false});
  }
  o.update=dt=>{
    o.t+=dt;o.inv-=dt;o.sp-=dt;o.zoff+=vel()*dt;
    o.x+=(o.lane-o.x)*Math.min(1,dt*14);
    if(o.jt>0)o.jt-=dt;if(o.st>0)o.st-=dt;
    if(o.sp<=0){spawnRow();o.sp=3.1/vel()}
    const jh=o.jt>0?Math.sin(Math.PI*(1-o.jt/.7)):0;
    for(let i=o.obs.length-1;i>=0;i--){
      const b=o.obs[i];b.z-=vel()*dt;
      if(b.z<.65){o.obs.splice(i,1);continue}
      if(b.done||b.l!==o.lane||b.z>1.5||b.z<1.0)continue;
      if(b.k==='coin'){b.done=true;o.coins++;burst(sx(b.l,1/b.z),sy(1/b.z)-20,10,['#ffd166','#fff'],160,.5);sHit(o.coins);ft('+1',W/2,H*.62,'#ffd166',20);continue}
      let hit=true;
      if(b.k==='low'&&jh>.35)hit=false;
      if(b.k==='high'&&o.st>0)hit=false;
      if(hit&&o.inv<=0){
        b.done=true;o.lives--;o.inv=1.1;shake=.3;sBad();burst(sx(o.lane,.8),sy(.8),26,['#ff4d6d','#fff'],280);
      }
    }
    if(o.lives<=0)return 'fail';
    return o.t>=o.dur;
  };
  o.draw=()=>{
    const h=hy(),LWv=LW();
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#081022');g.addColorStop(1,'#1d3a6b');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,h);
    ctx.fillStyle='#0d1730';ctx.fillRect(0,h,W,H-h);
    // mặt trời neon
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,h);ctx.clip();
    const sun=ctx.createLinearGradient(0,h-90,0,h);sun.addColorStop(0,'#ffd166');sun.addColorStop(1,'#ff7a1a');
    ctx.fillStyle=sun;ctx.beginPath();ctx.arc(W/2,h,90,0,6.283);ctx.fill();ctx.restore();
    // thành phố
    ctx.fillStyle='#0a1427';for(let i=0;i<14;i++){const bw=W/14,bh=20+((i*37)%50);ctx.fillRect(i*bw,h-bh,bw-3,bh)}
    // đường
    ctx.fillStyle='#14284a';ctx.beginPath();ctx.moveTo(W/2-LWv*1.5*.11,sy(.11));ctx.lineTo(W/2+LWv*1.5*.11,sy(.11));ctx.lineTo(W/2+LWv*1.5*1.4,sy(1.4));ctx.lineTo(W/2-LWv*1.5*1.4,sy(1.4));ctx.fill();
    ctx.save();ctx.lineCap='round';ctx.strokeStyle='#ff7a1a';ctx.shadowColor='#ff7a1a';ctx.shadowBlur=10;ctx.lineWidth=3;
    for(const k of [-1.5,1.5]){ctx.beginPath();ctx.moveTo(W/2+k*LWv*.11,sy(.11));ctx.lineTo(W/2+k*LWv*1.4,sy(1.4));ctx.stroke()}
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(77,245,234,.8)';
    const fr=o.zoff%1;
    for(let kk=0;kk<9;kk++){
      const z=1+kk-fr, z2=z+.45;if(z<.72)continue;
      const s1=1/z,s2=1/z2;ctx.lineWidth=1+2*s1;
      for(const k of [-.5,.5]){ctx.beginPath();ctx.moveTo(W/2+k*LWv*s1,sy(s1));ctx.lineTo(W/2+k*LWv*s2,sy(s2));ctx.stroke()}
    }
    ctx.restore();
    // vật thể + người chơi theo độ sâu
    const list=o.obs.slice().sort((a,b)=>b.z-a.z);
    let drewP=false;
    const drawPlayer=()=>{
      drewP=true;const s=.8,px=sx(o.x,s),py=sy(s),u=LWv*s;
      const jh=o.jt>0?Math.sin(Math.PI*(1-o.jt/.7)):0,lift=jh*u*.9;
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(px,py+4,u*.38*(1-jh*.4),u*.09,0,0,6.283);ctx.fill();
      if(o.inv>0&&((o.inv*14)|0)%2)return;
      const bob=jh>0?0:Math.abs(Math.sin(bgT*12))*u*.07;
      mascot(px,py-lift-bob,u*1.5,{expr:o.inv>0?'hurt':'normal',rot:clamp((o.lane-o.x)*.35,-.35,.35)+Math.sin(bgT*12)*.05,sy:o.st>0?.55:1,sx:o.st>0?1.2:1,glow:'#4df5ea'});
    };
    for(const b of list){
      if(!drewP&&b.z<1.25)drawPlayer();
      const s=1/b.z,x=sx(b.l,s),y=sy(s),u=LWv*.8*s;
      ctx.save();ctx.shadowBlur=10;
      if(b.k==='coin'){dot(x,y-u*.35,u*.2,'#ffd166',b.done?0:1)}
      else if(b.k==='low'){ctx.shadowColor='#ff7a1a';ctx.fillStyle='rgba(255,122,26,.35)';ctx.strokeStyle='#ff7a1a';ctx.lineWidth=3;ctx.fillRect(x-u*.5,y-u*.45,u,u*.45);ctx.strokeRect(x-u*.5,y-u*.45,u,u*.45)}
      else if(b.k==='high'){ctx.shadowColor='#ffd166';ctx.strokeStyle='#ffd166';ctx.fillStyle='rgba(255,210,63,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-u*.5,y);ctx.lineTo(x-u*.5,y-u*1.05);ctx.moveTo(x+u*.5,y);ctx.lineTo(x+u*.5,y-u*1.05);ctx.stroke();ctx.fillRect(x-u*.55,y-u*1.15,u*1.1,u*.5);ctx.strokeRect(x-u*.55,y-u*1.15,u*1.1,u*.5)}
      else{ctx.shadowColor='#ff4d6d';ctx.fillStyle='rgba(255,61,90,.35)';ctx.strokeStyle='#ff4d6d';ctx.lineWidth=3;ctx.fillRect(x-u*.5,y-u*1.3,u,u*1.3);ctx.strokeRect(x-u*.5,y-u*1.3,u,u*1.3);ctx.beginPath();ctx.moveTo(x-u*.5,y-u*1.3);ctx.lineTo(x+u*.5,y);ctx.moveTo(x+u*.5,y-u*1.3);ctx.lineTo(x-u*.5,y);ctx.stroke()}
      ctx.restore();
    }
    if(!drewP)drawPlayer();
    // HUD
    bar(W/2-100,H-44,200,16,o.t/o.dur,'#4df5ea');
    gtext('♥'.repeat(Math.max(0,o.lives)),W/2,H-70,22,'#ff7a1a');
    gtext('🪙 '+o.coins,W-60,96,18,'#ffd166');
  };
  return o;
}

/* =====================================================
   CHẶNG 2: BẮN SINH TỒN
   ===================================================== */
function makeSurvive(f){
  const eas=1-.12*f;
  const o={x:W/2,y:H*.6,hp:100*M.hp,max:100*M.hp,t:0,dur:40,en:[],bu:[],gem:[],fire:0,sp:1,inv:0,xp:0,lvl:1,shots:1,rate:3.2,dmg:1.2*M.dmg,magnet:70,ax:0,ay:-1};
  o.update=dt=>{
    o.t+=dt;o.inv-=dt;
    let mx=mvx(),my=mvy();
    if(inp.down){const dx=inp.x-inp.sx,dy=inp.y-inp.sy,l=Math.hypot(dx,dy);if(l>6){const k=Math.min(l/50,1);mx+=dx/l*k;my+=dy/l*k}}
    const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml}
    o.x=clamp(o.x+mx*210*M.spd*dt,20,W-20);o.y=clamp(o.y+my*210*M.spd*dt,100,H-24);
    // sinh quái
    o.sp-=dt;
    if(o.sp<=0){
      const p=o.t/o.dur;o.sp=(.85-.5*p)/eas;
      const side=(Math.random()*4)|0;let ex,ey;
      if(side===0){ex=rnd(0,W);ey=70}else if(side===1){ex=rnd(0,W);ey=H+20}else if(side===2){ex=-20;ey=rnd(100,H)}else{ex=W+20;ey=rnd(100,H)}
      const r=Math.random();
      if(o.t>16&&r<.14)o.en.push({x:ex,y:ey,hp:9,mhp:9,r:22,sp:48,c:'#ff6b3d',k:'tank'});
      else if(r<.32)o.en.push({x:ex,y:ey,hp:1.5,mhp:1.5,r:11,sp:135,c:'#ffd166',k:'run'});
      else o.en.push({x:ex,y:ey,hp:3.5,mhp:3.5,r:15,sp:72,c:'#ff7a1a',k:'grunt'});
    }
    for(const e of o.en){
      const dx=o.x-e.x,dy=o.y-e.y,l=Math.hypot(dx,dy)||1;
      e.x+=dx/l*e.sp*dt;e.y+=dy/l*e.sp*dt;
      if(l<e.r+13&&o.inv<=0){o.hp-=e.k==='tank'?16:9;o.inv=.6;shake=.2;sBad();burst(o.x,o.y,14,['#ff4d6d','#fff'],200)}
    }
    // tự bắn
    o.fire-=dt;
    if(o.fire<=0&&o.en.length){
      let best=null,bd=1e9;for(const e of o.en){const d=Math.hypot(e.x-o.x,e.y-o.y);if(d<bd){bd=d;best=e}}
      if(best&&bd<430){
        const a0=Math.atan2(best.y-o.y,best.x-o.x);o.ax=Math.cos(a0);o.ay=Math.sin(a0);
        for(let s=0;s<o.shots;s++){const a=a0+(s-(o.shots-1)/2)*.2;o.bu.push({x:o.x,y:o.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,life:.9})}
        o.fire=1/o.rate;tone(700,.05,'square',.04);
      }
    }
    for(let i=o.bu.length-1;i>=0;i--){
      const b=o.bu[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.life<=0){o.bu.splice(i,1);continue}
      for(let j=o.en.length-1;j>=0;j--){
        const e=o.en[j];
        if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+4){
          e.hp-=o.dmg;o.bu.splice(i,1);burst(b.x,b.y,4,[e.c,'#fff'],130,.3);
          if(e.hp<=0){o.en.splice(j,1);o.gem.push({x:e.x,y:e.y});burst(e.x,e.y,14,[e.c,'#fff'],220,.5);sHit(2)}
          break;
        }
      }
    }
    for(let i=o.gem.length-1;i>=0;i--){
      const g=o.gem[i],dx=o.x-g.x,dy=o.y-g.y,l=Math.hypot(dx,dy)||1;
      if(l<o.magnet){g.x+=dx/l*320*dt;g.y+=dy/l*320*dt}
      if(l<18){
        o.gem.splice(i,1);o.xp++;sHit(o.xp);
        if(o.xp>=4){
          o.xp=0;o.lvl++;const u=o.lvl%4;
          if(u===1){o.shots=Math.min(3,o.shots+1);ft('Thêm đạn!',o.x,o.y-40,'#4df5ea',24)}
          else if(u===2){o.rate*=1.25;ft('Bắn nhanh hơn!',o.x,o.y-40,'#7ee787',24)}
          else if(u===3){o.dmg+=.7;ft('Đạn mạnh hơn!',o.x,o.y-40,'#ffd166',24)}
          else{o.hp=Math.min(o.max,o.hp+30);o.magnet+=40;ft('Hồi máu!',o.x,o.y-40,'#ff7a1a',24)}
          burst(o.x,o.y,30,PAL,260,.8);sWin();
        }
      }
    }
    if(o.hp<=0)return 'fail';
    return o.t>=o.dur;
  };
  o.draw=()=>{
    for(const g of o.gem)dot(g.x,g.y,5,'#7ee787');
    for(const e of o.en){
      ctx.fillStyle=e.c;dot(e.x,e.y,e.r*.7,e.c);
      ctx.strokeStyle=e.c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,6.283);ctx.stroke();
      if(e.k==='tank'&&e.hp<e.mhp){ctx.fillStyle='#fff';ctx.fillRect(e.x-e.r,e.y-e.r-8,e.r*2*e.hp/e.mhp,3)}
    }
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const b of o.bu)dot(b.x,b.y,3.5,'#4df5ea');
    ctx.restore();
    if(o.inv<=0||((o.inv*14)|0)%2){
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(o.x,o.y+4,18,6,0,0,6.283);ctx.fill();
      const ang=Math.atan2(o.ay,o.ax);
      ctx.save();ctx.translate(o.x,o.y-22);ctx.rotate(ang);ctx.strokeStyle='#4df5ea';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(34,-7);ctx.lineTo(44,0);ctx.lineTo(34,7);ctx.stroke();ctx.restore();
      mascot(o.x,o.y+18,50,{expr:o.inv>0?'hurt':'normal',rot:Math.sin(bgT*10)*.04,glow:'#4df5ea'});
    }
    if(inp.down){ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(inp.sx,inp.sy,40,0,6.283);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(inp.x,inp.y,14,0,6.283);ctx.fill()}
    bar(14,H-34,W-28,12,o.hp/o.max,'#ff7a1a');
    bar(14,96,W-28,10,o.t/o.dur,'#4df5ea');
    gtext('Cấp '+o.lvl,W/2,120,16,'#7ee787');
  };
  return o;
}

/* =====================================================
   CHẶNG 3: ĐẤU VÕ
   ===================================================== */
function makeFight(f){
  const U=clamp(Math.min(H*.16,W*.26),78,130),gy=H*.66;
  const mk=(x,face,hp)=>({x,face,hp,max:hp,st:'idle',t:0,dur:1,cd:0,hit:false,hitAt:0,rage:0,dmg:0,range:0,kb:0,kind:'',walk:0});
  const pl=mk(W*.3,1,100*M.hp),en=mk(W*.7,-1,100*(1-.15*f));
  const o={pl,en,freeze:0,ai:{m:'approach',t:.6,next:''},over:0,msg:'',mt:0};
  const busy=a=>a.st==='punch'||a.st==='kick'||a.st==='special'||a.st==='hurt'||a.st==='wind';
  function startAtk(a,kind,isP){
    const d={punch:[.28,.1,7,.95,30],kick:[.45,.18,13,1.15,70],special:[.62,.25,38,2.2,150]}[kind];
    a.st=kind;a.t=0;a.dur=d[0];a.hitAt=d[1];a.dmg=d[2]*(isP?M.dmg:(1-.12*f));a.range=U*d[3];a.kb=d[4];a.hit=false;a.cd=.15;
  }
  function strike(a,b,isP){
    const dist=Math.abs(a.x-b.x);
    if(dist>a.range)return;
    let dmg=a.dmg,kb=a.kb;
    if(b.st==='block'&&Math.sign(a.x-b.x)===b.face){dmg*=.15;kb*=.3;burst(b.x+b.face*U*.3,gy-U*.8,10,['#4df5ea','#fff'],160,.3);tone(300,.08,'square',.1);ft('Đỡ!',b.x,gy-U*1.4,'#4df5ea',18)}
    else{b.st='hurt';b.t=0;b.dur=.32;burst(b.x,gy-U*.8,20,['#ff4d6d','#fff','#ffd166'],280,.5);o.freeze=a.kind==='special'?.12:.06;shake=a.kind==='special'?.4:.18;sPunch();ft(Math.round(dmg),b.x,gy-U*1.4,'#ffd166',24)}
    b.hp=Math.max(0,b.hp-dmg);b.x+=Math.sign(b.x-a.x)*kb*.5;
    a.rage=Math.min(100,a.rage+dmg*1.3);b.rage=Math.min(100,b.rage+dmg*.8);
  }
  o.press=k=>{
    if(o.over)return;
    if(busy(pl))return;
    if(k==='A'){startAtk(pl,'punch',true);pl.kind='punch'}
    else if(k==='B'){startAtk(pl,'kick',true);pl.kind='kick'}
    else if(k==='S'&&pl.rage>=100){startAtk(pl,'special',true);pl.kind='special';pl.rage=0;burst(pl.x,gy-U*.8,40,['#4df5ea','#fff'],300,.7)}
  };
  function tickFighter(a,dt){
    a.cd-=dt;
    if(a.st==='punch'||a.st==='kick'||a.st==='special'||a.st==='hurt'){
      a.t+=dt;
      if((a.st==='punch'||a.st==='kick'||a.st==='special')&&!a.hit&&a.t>=a.hitAt){a.hit=true;a.kind=a.st;strike(a,a===pl?en:pl,a===pl)}
      if(a.t>=a.dur){a.st='idle';a.t=0}
    }
  }
  o.update=dt=>{
    if(o.freeze>0){o.freeze-=dt;return false}
    if(o.mt>0)o.mt-=dt;
    if(o.over){o.over-=dt;return o.over<=0?(pl.hp>0?true:'fail'):false}
    // người chơi
    if(!busy(pl)){
      if(P.D)pl.st='block';else if(pl.st==='block')pl.st='idle';
      if(pl.st!=='block'){const m=mvx();pl.x+=m*230*M.spd*dt;pl.walk+=Math.abs(m)*dt*10}
    }
    pl.face=Math.sign(en.x-pl.x)||1;en.face=-pl.face;
    // AI
    const ai=o.ai;ai.t-=dt;const dist=Math.abs(pl.x-en.x);
    if(en.st==='wind'){
      en.t+=dt;
      if(en.t>=en.dur){startAtk(en,ai.next,false);en.kind=ai.next;ai.m='recover';ai.t=.5}
    }else if(!busy(en)){
      if(ai.m==='approach'){
        en.x+=Math.sign(pl.x-en.x)*(150+f*0)*dt*(1-.1*f);
        if(dist<U*.95){
          const r=Math.random();
          if(r<.6){ai.next=Math.random()<.55?'punch':'kick';en.st='wind';en.t=0;en.dur=.38+.06*f}
          else if(r<.82){ai.m='guard';ai.t=.8;en.st='block'}
          else{ai.m='retreat';ai.t=.6}
        }
      }else if(ai.m==='guard'){if(ai.t<=0){ai.m='approach';en.st='idle'}}
      else if(ai.m==='retreat'){en.x-=Math.sign(pl.x-en.x)*170*dt;if(ai.t<=0)ai.m='approach'}
      else if(ai.m==='recover'){if(ai.t<=0)ai.m='approach'}
    }else if(en.st==='hurt'){ai.m='approach'}
    tickFighter(pl,dt);tickFighter(en,dt);
    pl.x=clamp(pl.x,U*.62,W-U*.62);en.x=clamp(en.x,U*.62,W-U*.62);
    const gap=U*.45;if(Math.abs(pl.x-en.x)<gap){const s=Math.sign(pl.x-en.x)||1;const mid=(pl.x+en.x)/2;pl.x=mid+s*gap/2;en.x=mid-s*gap/2}
    if(en.hp<=0){o.over=1.4;o.msg='K.O.!';o.mt=1.4;sWin();burst(en.x,gy-U*.8,60,PAL,380,1)}
    else if(pl.hp<=0){o.over=1.0;o.msg='Thua rồi...';o.mt=1}
    return false;
  };
  function drawF(a,col){
    const u=U,x=a.x,d=a.face,pr=a.dur?a.t/a.dur:0,ext=Math.sin(Math.PI*clamp(pr,0,1));
    const flash=a.st==='wind'&&((a.t*16)|0)%2?'#ffffff':col;
    const lean=a.st==='hurt'?-d*.2:0;
    const hx=x+lean*u*.4,hipY=gy-u*.5,shY=gy-u*.92;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle=a.st==='hurt'?'#fff':flash;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.lineWidth=Math.max(5,u*.07);
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x,gy+3,u*.35,u*.07,0,0,6.283);ctx.fill();
    ctx.beginPath();ctx.arc(hx+d*u*.03,gy-u*1.1,u*.12,0,6.283);ctx.stroke();
    ctx.beginPath();ctx.moveTo(hx,shY);ctx.lineTo(x,hipY);
    const wk=Math.sin(a.walk)*u*.1;
    // chân sau
    ctx.moveTo(x,hipY);ctx.lineTo(x-d*u*.14+wk,gy);
    // chân trước
    if(a.st==='kick')ctx.moveTo(x,hipY),ctx.lineTo(x+d*u*(.2+.95*ext),gy-u*(.3+.25*ext));
    else if(a.st==='special')ctx.moveTo(x,hipY),ctx.lineTo(x+d*u*.2,gy);
    else ctx.moveTo(x,hipY),ctx.lineTo(x+d*u*.14-wk,gy);
    // tay sau
    ctx.moveTo(hx,shY+u*.05);ctx.lineTo(hx-d*u*.22,shY+u*.28);
    // tay trước
    if(a.st==='punch')ctx.moveTo(hx,shY+u*.05),ctx.lineTo(hx+d*u*(.25+.75*ext),shY+u*.1);
    else if(a.st==='special')ctx.moveTo(hx,shY+u*.05),ctx.lineTo(hx+d*u*(.3+.6*ext),shY+u*.05);
    else if(a.st==='block')ctx.moveTo(hx,shY+u*.05),ctx.lineTo(hx+d*u*.22,shY-u*.05);
    else ctx.moveTo(hx,shY+u*.05),ctx.lineTo(hx+d*u*.3,shY+u*.22);
    ctx.stroke();
    if(a.st==='block'){ctx.strokeStyle='rgba(77,245,234,.8)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x+d*u*.3,gy-u*.7,u*.45,-1.2,1.2+(d<0?0:0));ctx.stroke()}
    if(a.st==='special'){const bx=hx+d*u*(.4+1.4*ext);dot(bx,shY+u*.05,u*.2,'#4df5ea');}
    ctx.restore();
  }
  function drawPl(){
    const a=pl,d=a.face,u=U,pr=a.dur?a.t/a.dur:0,ext=Math.sin(Math.PI*clamp(pr,0,1));
    let x=a.x,rot=0,sx=1,sy=1,flash=0,glow='#4df5ea';
    const mv=a.st==='idle'&&Math.abs(mvx())>0;
    sy=1+Math.sin(bgT*(mv?14:4))*(mv?.03:.014);
    if(mv)rot=Math.sin(bgT*14)*.06;
    if(a.st==='punch'){x+=d*u*.35*ext;rot=d*.22*ext}
    else if(a.st==='kick'){x+=d*u*.5*ext;rot=-d*.3*ext}
    else if(a.st==='special'){sx=sy=1+.2*ext;glow='#ffffff'}
    else if(a.st==='hurt'){x-=d*u*.12*ext;rot=-d*.25;flash=.7}
    else if(a.st==='block'){sy=.93}
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x,gy+3,u*.38,u*.07,0,0,6.283);ctx.fill();
    mascot(x,gy,u*1.3,{expr:a.st==='hurt'?'hurt':(a.st==='punch'||a.st==='kick'||a.st==='special')?'angry':'normal',rot,sx,sy,flash,glow});
    if(a.st==='punch')dot(x+d*u*(.35+.7*ext),gy-u*.62,u*.13,'#4df5ea');
    else if(a.st==='kick')dot(x+d*u*(.4+.8*ext),gy-u*.28,u*.13,'#4df5ea');
    else if(a.st==='special')dot(x+d*u*(.5+1.6*ext),gy-u*.6,u*.26,'#ffffff');
    else if(a.st==='block'){ctx.strokeStyle='rgba(77,245,234,.85)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x+d*u*.32,gy-u*.65,u*.5,-1.2,1.2);ctx.stroke()}
  }
  o.draw=()=>{
    // sàn
    ctx.fillStyle='rgba(255,122,26,.12)';ctx.fillRect(0,gy,W,H-gy);
    ctx.strokeStyle='#ff7a1a';ctx.shadowColor='#ff7a1a';ctx.shadowBlur=12;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();ctx.shadowBlur=0;
    drawF(en,'#ff7a1a');drawPl();
    const bw=W/2-22;
    bar(12,100,bw,16,pl.hp/pl.max,'#4df5ea');bar(W-12-bw,100,bw,16,en.hp/en.max,'#ff7a1a',true);
    bar(12,120,bw,8,pl.rage/100,'#ffd166');
    gtext(pname.slice(0,10),12+bw/2,142,13,'#4df5ea');gtext('Đại ca',W-12-bw/2,142,13,'#ff7a1a');
    if(pl.rage>=100)gtext('CHIÊU ĐÃ SẴN SÀNG!',W/2,H*.3,18,'#ffd166');
    if(o.mt>0)gtext(o.msg,W/2,H*.38,52,'#ffd166');
  };
  return o;
}

/* =====================================================
   CHẶNG 4: ĐUA XE
   ===================================================== */
function makeRace(f){
  const eas=1-.1*f,road=Math.min(W*.9,440);
  const o={x:W/2,tx:W/2,lives:M.lives,dist:0,total:14000,t:0,nitro:.3,nOn:0,inv:0,cars:[],sp:.6,off:0,ownBg:true,speed:420};
  const rl=()=>W/2-road/2,py=()=>H*.74;
  o.press=k=>{if(k==='N'&&o.nitro>=1&&o.nOn<=0){o.nOn=2.4;o.nitro=0;sWin();ft('NITRO!',W/2,H*.5,'#ffd166',34)}};
  o.update=dt=>{
    o.t+=dt;o.inv-=dt;
    const p=o.dist/o.total;
    o.speed=(420+120*p)*(o.nOn>0?1.7:1);
    if(o.nOn>0)o.nOn-=dt;
    o.nitro=Math.min(1,o.nitro+.03*dt);
    o.dist+=o.speed*dt;o.off+=o.speed*dt*1.1;
    o.tx+=inp.mdx*1.4+mvx()*380*dt;inp.mdx=0;inp.mdy=0;
    o.tx=clamp(o.tx,rl()+28,rl()+road-28);
    o.x+=(o.tx-o.x)*Math.min(1,dt*16);
    o.sp-=dt;
    if(o.sp<=0){
      o.sp=(.62-.2*p)/eas;
      o.cars.push({x:rl()+road*(((Math.random()*4)|0)+.5)/4,y:-90,sp:rnd(190,320),c:PAL[(Math.random()*5)|0],done:false,hit:false});
    }
    for(let i=o.cars.length-1;i>=0;i--){
      const c=o.cars[i];c.y+=(o.speed-c.sp)*dt*1.15;
      if(c.y>H+120){o.cars.splice(i,1);continue}
      const dx=Math.abs(c.x-o.x),dy=Math.abs(c.y-py());
      if(dx<34&&dy<62&&!c.hit){
        if(o.nOn>0){c.hit=true;burst(c.x,c.y,40,[c.c,'#fff','#ffd166'],340,.8);shake=.25;sBoom();ft('NÁT!',c.x,c.y,'#ffd166',22);o.cars.splice(i,1);continue}
        if(o.inv<=0){c.hit=true;o.lives--;o.inv=1.2;shake=.35;sBad();burst(o.x,py(),30,['#ff4d6d','#fff'],300);o.dist=Math.max(0,o.dist-150);continue}
      }
      if(!c.done&&c.y>=py()){c.done=true;if(!c.hit&&dx<78&&o.nOn<=0){o.nitro=Math.min(1,o.nitro+.25);ft('SÁT!',o.x,py()-70,'#7ee787',22);sHit(5)}}
    }
    if(o.nOn>0)burst(o.x+rnd(-8,8),py()+38,1,['#ffd166','#ff6b3d'],140,.3);
    if(o.lives<=0)return 'fail';
    return o.dist>=o.total;
  };
  function car(x,y,col,pl){
    ctx.save();ctx.translate(x,y);ctx.shadowColor=col;ctx.shadowBlur=14;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.fillStyle='rgba(6,12,28,.9)';
    rr(-18,-34,36,68,9);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.fillStyle=col;ctx.globalAlpha=.55;rr(-12,-20,24,16,4);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle=pl?'#fff':'#ff4d6d';ctx.fillRect(-14,30,8,3);ctx.fillRect(6,30,8,3);
    ctx.fillStyle='#fff';ctx.fillRect(-14,-36,6,3);ctx.fillRect(8,-36,6,3);
    ctx.restore();
  }
  o.draw=()=>{
    ctx.fillStyle='#050b17';ctx.fillRect(0,0,W,H);
    const l=rl();
    ctx.fillStyle='#0f1d3a';ctx.fillRect(l,0,road,H);
    // cột đèn hai bên
    ctx.save();ctx.strokeStyle='#4df5ea';ctx.shadowColor='#4df5ea';ctx.shadowBlur=12;ctx.lineWidth=3;
    const off=o.off%140;
    for(let y=-140+off;y<H+140;y+=140){ctx.beginPath();ctx.moveTo(l-16,y);ctx.lineTo(l-16,y+40);ctx.moveTo(l+road+16,y);ctx.lineTo(l+road+16,y+40);ctx.stroke()}
    ctx.strokeStyle='#ff7a1a';ctx.shadowColor='#ff7a1a';ctx.beginPath();ctx.moveTo(l,0);ctx.lineTo(l,H);ctx.moveTo(l+road,0);ctx.lineTo(l+road,H);ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.setLineDash([36,36]);ctx.lineDashOffset=-o.off;
    for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(l+road*k/4,0);ctx.lineTo(l+road*k/4,H);ctx.stroke()}
    ctx.restore();
    if(o.nOn>0){ctx.save();ctx.strokeStyle='rgba(255,210,63,.5)';ctx.lineWidth=2;for(let i=0;i<14;i++){const x=rnd(0,W),y=rnd(0,H);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+rnd(40,120));ctx.stroke()}ctx.restore()}
    for(const c of o.cars)car(c.x,c.y,c.c,false);
    if(o.inv<=0||((o.inv*14)|0)%2){car(o.x,py(),o.nOn>0?'#ffd166':'#4df5ea',true);mascot(o.x,py()+14,60,{expr:o.inv>0?'hurt':o.nOn>0?'angry':'normal',rot:clamp((o.tx-o.x)*.01,-.25,.25)})}
    bar(14,H-110,W-28,12,o.dist/o.total,'#4df5ea');
    gtext('♥'.repeat(Math.max(0,o.lives)),W/2,H-128,20,'#ff7a1a');
    bar(14,H-92,Math.min(W-28,200),12,o.nitro,o.nitro>=1?'#ffd166':'#7ee787');
    gtext(o.nitro>=1?'NITRO SẴN SÀNG!':'Nitro',22+60,H-100,11,'#fff','center');
    gtext(Math.round(o.speed/4)+' km/h',W-60,96,16,'#4df5ea');
  };
  return o;
}

/* =====================================================
   CHẶNG 5: BOSS
   ===================================================== */
function makeBoss(f){
  const eas=1-.1*f;
  const o={px:W/2,py:H*.72,hp:M.lives+2,maxhp:M.lives+2,bhp:220*(1-.12*f),bmax:220*(1-.12*f),bx:W/2,by:H*.2,t:0,bu:[],pb:[],fire:0,ph:1,a:1,b:.5,c:3,ang:0,warns:[],bt:2.5,inv:0,ult:0,flash:0,rain:0,over:0};
  const BY=()=>Math.max(150,H*.2);
  o.press=k=>{
    if(k==='U'&&o.ult>=1&&!o.over){
      o.ult=0;o.bu.length=0;o.warns.length=0;o.bhp-=45*M.dmg;o.flash=.5;shake=.5;sBoom();burst(o.bx,BY(),60,PAL,420,1);ft('TUYỆT CHIÊU!',W/2,H*.45,'#ffd166',34);
    }
  };
  function bullet(x,y,a,s,c){if(o.bu.length<420)o.bu.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c,r:5})}
  o.update=dt=>{
    o.t+=dt;o.inv-=dt;o.flash-=dt;
    if(o.over){o.over-=dt;return o.over<=0}
    o.px=clamp(o.px+inp.mdx*1.4+mvx()*340*dt,16,W-16);
    o.py=clamp(o.py+inp.mdy*1.4+mvy()*340*dt,H*.45,H-130);inp.mdx=0;inp.mdy=0;
    const r=o.bhp/o.bmax,ph=r>.66?1:r>.33?2:3;
    if(ph!==o.ph){o.ph=ph;o.bu.length=0;o.warns.length=0;ft('GIAI ĐOẠN '+ph,W/2,H*.4,'#ff7a1a',34);sBoom();shake=.4}
    o.bx=W/2+Math.sin(o.t*(.8+ph*.25))*(W*.32);o.by=BY()+Math.sin(o.t*1.7)*10;
    // bắn của người chơi
    o.fire-=dt;
    if(o.fire<=0){o.fire=1/8;o.pb.push({x:o.px-6,y:o.py-14});o.pb.push({x:o.px+6,y:o.py-14})}
    for(let i=o.pb.length-1;i>=0;i--){
      const b=o.pb[i];b.y-=640*dt;
      if(b.y<-10){o.pb.splice(i,1);continue}
      if(Math.abs(b.x-o.bx)<54&&Math.abs(b.y-o.by)<48){o.pb.splice(i,1);o.bhp-=.75*M.dmg;o.ult=Math.min(1,o.ult+.006);burst(b.x,b.y,2,['#fff','#ffd166'],120,.25)}
    }
    // boss tấn công
    if(ph===1){
      o.a-=dt;if(o.a<=0){o.a=1.3/eas;const base=Math.atan2(o.py-o.by,o.px-o.bx);for(let i=-3;i<=3;i++)bullet(o.bx,o.by,base+i*.22,190,'#ff7a1a')}
    }else if(ph===2){
      o.b-=dt;if(o.b<=0){o.b=.09/eas;o.ang+=.38;bullet(o.bx,o.by,o.ang,150,'#ffd166');bullet(o.bx,o.by,o.ang+Math.PI,150,'#ffd166')}
      o.c-=dt;if(o.c<=0){o.c=3/eas;for(let i=0;i<16;i++)bullet(o.bx,o.by,i/16*6.283+o.t,125,'#4df5ea')}
    }else{
      o.a-=dt;if(o.a<=0){o.a=.95/eas;const base=Math.atan2(o.py-o.by,o.px-o.bx);for(let i=-2;i<=2;i++)bullet(o.bx,o.by,base+i*.2,235,'#ff7a1a')}
      o.rain-=dt;if(o.rain<=0){o.rain=.16/eas;bullet(rnd(10,W-10),-5,Math.PI/2,200,'#7ee787')}
      o.bt-=dt;if(o.bt<=0){o.bt=2.8/eas;o.warns.push({x:Math.random()<.6?clamp(o.px+rnd(-30,30),30,W-30):rnd(30,W-30),t:0})}
    }
    for(let i=o.warns.length-1;i>=0;i--){const w=o.warns[i];w.t+=dt;if(w.t>1.5)o.warns.splice(i,1)}
    // đạn của boss
    for(let i=o.bu.length-1;i>=0;i--){
      const b=o.bu[i];if(!b)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x<-20||b.x>W+20||b.y<-20||b.y>H+20){o.bu.splice(i,1);continue}
      if(o.inv<=0&&Math.hypot(b.x-o.px,b.y-o.py)<b.r+5)hurt();
    }
    for(const w of o.warns)if(w.t>.9&&o.inv<=0&&Math.abs(w.x-o.px)<24+5)hurt();
    function hurt(){
      o.hp--;o.inv=1.6;shake=.4;sBad();burst(o.px,o.py,30,['#ff4d6d','#fff'],300);
      for(let j=o.bu.length-1;j>=0;j--)if(Math.hypot(o.bu[j].x-o.px,o.bu[j].y-o.py)<110)o.bu.splice(j,1);
    }
    if(o.hp<=0)return 'fail';
    if(o.bhp<=0){o.over=1.6;o.bu.length=0;o.warns.length=0;for(let k=0;k<6;k++)setTimeout(()=>firework(o.bx+rnd(-60,60),o.by+rnd(-40,40)),k*180)}
    return false;
  };
  o.draw=()=>{
    if(o.flash>0){ctx.fillStyle='rgba(255,255,255,'+Math.min(.5,o.flash)+')';ctx.fillRect(0,0,W,H)}
    for(const w of o.warns){
      const act=w.t>.9;ctx.save();ctx.fillStyle=act?'rgba(255,61,90,.8)':'rgba(255,61,90,.18)';
      ctx.fillRect(w.x-(act?24:2),0,act?48:4,H);ctx.restore();
    }
    // boss
    if(o.bhp>0){
      ctx.save();ctx.translate(o.bx,o.by);ctx.shadowColor='#ff7a1a';ctx.shadowBlur=24;ctx.strokeStyle='#ff7a1a';ctx.lineWidth=4;ctx.fillStyle='rgba(255,122,26,.2)';
      ctx.rotate(o.t*.5);ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*6.283;ctx.lineTo(Math.cos(a)*54,Math.sin(a)*54)}ctx.closePath();ctx.fill();ctx.stroke();
      ctx.rotate(-o.t*.5);ctx.shadowColor='#4df5ea';ctx.fillStyle='#4df5ea';ctx.beginPath();ctx.arc(-16,-6,7,0,6.283);ctx.arc(16,-6,7,0,6.283);ctx.fill();
      ctx.strokeStyle='#4df5ea';ctx.beginPath();ctx.arc(0,14,12,.1*Math.PI,.9*Math.PI);ctx.stroke();ctx.restore();
    }
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const b of o.bu)dot(b.x,b.y,b.r,b.c);
    for(const b of o.pb)dot(b.x,b.y,3,'#4df5ea');
    ctx.restore();
    if(o.inv<=0||((o.inv*14)|0)%2){
      ctx.fillStyle='rgba(77,245,234,.55)';ctx.beginPath();ctx.moveTo(o.px-7,o.py+22);ctx.lineTo(o.px,o.py+22+14+Math.random()*8);ctx.lineTo(o.px+7,o.py+22);ctx.fill();
      mascot(o.px,o.py+22,52,{expr:o.inv>0?'hurt':o.flash>0?'angry':'normal',rot:clamp(inp.mdx*.01,-.2,.2),glow:'#4df5ea'});
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.px,o.py,3,0,6.283);ctx.fill();
    }
    bar(14,96,W-28,14,o.bhp/o.bmax,'#ff7a1a');
    gtext('BOSS "ÁP LỰC"  ·  Giai đoạn '+o.ph+'/3',W/2,126,13,'#ffd166');
    gtext('♥'.repeat(Math.max(0,o.hp)),W/2,H-146,20,'#ff7a1a');
    if(o.ult>=1)gtext('TUYỆT CHIÊU SẴN SÀNG!',W/2,H-168,14,'#ffd166');
    else bar(W/2-60,H-170,120,8,o.ult,'#ffd166');
  };
  return o;
}

/* =====================================================
   CHẶNG MỚI: BAY VƯỢT CHƯỚNG NGẠI
   ===================================================== */
function makeFlap(f){
  const gap=205+14*f,pxx=()=>W*.28;
  const o={y:H*.45,vy:0,t:0,dur:30,pipes:[],sp:.6,lives:M.lives,inv:0,passed:0};
  const flap=()=>{o.vy=-330;tone(560,.08,'triangle',.08,200);burst(pxx(),o.y+30,4,['#4df5ea','#fff'],100,.3)};
  o.press=k=>{if(k==='N')flap()};
  o.pointer=t=>{if(t==='down')flap()};
  o.update=dt=>{
    o.t+=dt;o.inv-=dt;o.sp-=dt;
    o.vy+=900*dt;o.y+=o.vy*dt;
    if(o.y>H-110){o.y=H-110;o.vy=-260}
    if(o.y<115){o.y=115;o.vy=60}
    if(o.sp<=0){o.sp=1.55;o.pipes.push({x:W+40,gy:rnd(H*.3,H*.66),done:false})}
    for(let i=o.pipes.length-1;i>=0;i--){
      const p=o.pipes[i];p.x-=160*dt;
      if(p.x<-80){o.pipes.splice(i,1);continue}
      if(!p.done&&p.x+60<pxx()-20){p.done=true;o.passed++;sHit(o.passed)}
      if(o.inv<=0&&pxx()+18>p.x&&pxx()-18<p.x+60&&(o.y-24<p.gy-gap/2||o.y+8>p.gy+gap/2)){
        o.lives--;o.inv=1.3;o.vy=-200;shake=.3;sBad();burst(pxx(),o.y,24,['#ff4d6d','#fff'],260);
      }
    }
    if(o.lives<=0)return 'fail';
    return o.t>=o.dur;
  };
  o.draw=()=>{
    for(const p of o.pipes){
      ctx.save();ctx.shadowColor='#ff7a1a';ctx.shadowBlur=8;ctx.strokeStyle='#ff7a1a';ctx.fillStyle='rgba(255,122,26,.22)';ctx.lineWidth=3;
      ctx.fillRect(p.x,-5,60,p.gy-gap/2+5);ctx.strokeRect(p.x,-5,60,p.gy-gap/2+5);
      ctx.fillRect(p.x,p.gy+gap/2,60,H);ctx.strokeRect(p.x,p.gy+gap/2,60,H);
      ctx.fillStyle='#ff7a1a';ctx.fillRect(p.x-6,p.gy-gap/2-12,72,12);ctx.fillRect(p.x-6,p.gy+gap/2,72,12);ctx.restore();
    }
    ctx.fillStyle='rgba(79,139,255,.18)';ctx.fillRect(0,H-70,W,70);
    ctx.strokeStyle='#4f8bff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,H-70);ctx.lineTo(W,H-70);ctx.stroke();
    if(o.inv<=0||((o.inv*14)|0)%2){
      if(o.vy<0){ctx.fillStyle='rgba(255,209,102,.8)';ctx.beginPath();ctx.moveTo(pxx()-9,o.y+34);ctx.lineTo(pxx(),o.y+50+Math.random()*12);ctx.lineTo(pxx()+9,o.y+34);ctx.fill()}
      mascot(pxx(),o.y+34,68,{expr:o.inv>0?'hurt':'normal',rot:clamp(o.vy*.0014,-.35,.5),glow:'#4df5ea'});
    }
    bar(W/2-100,H-48,200,16,o.t/o.dur,'#4df5ea');
    gtext('♥'.repeat(Math.max(0,o.lives)),W/2,H-76,20,'#ff4d6d');
  };
  return o;
}

/* =====================================================
   CHẶNG MỚI: SÚT PHẠT ĐỀN
   ===================================================== */
function makeKick(f){
  const goalW=Math.min(W*.86,380),goalH=goalW*.42,gx=W/2-goalW/2,gt=H*.2,bx=W/2,by=H*.74,sc=goalW/330;
  const o={kick:0,goals:0,total:5,need:3,phase:'aim',pt:0,ball:{x:bx,y:by,s:1},tgt:null,kx:W/2,k0:W/2,k1:W/2,dir:1,krot:0,msg:'',mt:0,res:[],pc:Math.max(.08,.3-.1*f),t:0};
  o.pointer=(t,x,y)=>{
    if(t!=='down'||o.phase!=='aim'||y>by-50)return;
    o.tgt={x:clamp(x,gx-30,gx+goalW+30),y:clamp(y,gt-20,gt+goalH+10)};
    o.kick++;o.phase='fly';o.pt=0;o.k0=o.kx;
    const guess=Math.random()<o.pc;
    o.dir=guess?(Math.sign(o.tgt.x-o.kx)||1):(Math.random()<.5?-1:1);
    o.k1=clamp(guess?o.kx+clamp(o.tgt.x-o.kx,-240,240):o.kx+o.dir*140,gx+20,gx+goalW-20);
    tone(220,.12,'square',.12,-80);
  };
  o.update=dt=>{
    o.t+=dt;if(o.mt>0)o.mt-=dt;
    if(o.phase==='aim'){
      o.kx=W/2+Math.sin(o.t*1.5)*goalW*.28;
      if(o.goals>=o.need)return true;
      if(o.goals+(o.total-o.kick)<o.need)return 'fail';
    }else if(o.phase==='fly'){
      o.pt+=dt;const k=Math.min(1,o.pt/.5),kd=Math.min(1,o.pt/.45);
      o.ball.x=bx+(o.tgt.x-bx)*k;o.ball.y=by+(o.tgt.y-by)*k-Math.sin(Math.PI*k)*50;o.ball.s=1-.55*k;
      o.kx=o.k0+(o.k1-o.k0)*kd;o.krot=o.dir*.9*kd;
      if(k>=1){
        const inG=o.tgt.x>gx+10&&o.tgt.x<gx+goalW-10&&o.tgt.y>gt+8&&o.tgt.y<gt+goalH-6;
        const saved=inG&&Math.abs(o.k1-o.tgt.x)<52;
        const r=!inG?'miss':saved?'saved':'goal';
        o.res.push(r);o.phase='res';o.pt=0;o.mt=1.1;
        if(r==='goal'){o.goals++;o.msg='VÀOOO!!!';firework(rnd(W*.2,W*.8),rnd(H*.1,H*.4));sWin()}
        else if(r==='saved'){o.msg='Bị cản phá!';sBad();burst(o.tgt.x,o.tgt.y,16,['#ff7a1a','#fff'],220)}
        else{o.msg='Trượt rồi!';sBad()}
      }
    }else if(o.phase==='res'){
      o.pt+=dt;
      if(o.pt>1.1){o.phase='aim';o.ball={x:bx,y:by,s:1};o.krot=0}
    }
    return false;
  };
  function keeper(x,y,rot){
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(sc,sc);ctx.strokeStyle='#ff7a1a';ctx.shadowColor='#ff7a1a';ctx.shadowBlur=8;ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.arc(0,-50,9,0,6.283);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-41);ctx.lineTo(0,-12);ctx.moveTo(0,-12);ctx.lineTo(-10,6);ctx.moveTo(0,-12);ctx.lineTo(10,6);
    ctx.moveTo(0,-36);ctx.lineTo(-22,-54);ctx.moveTo(0,-36);ctx.lineTo(22,-54);ctx.stroke();ctx.restore();
  }
  o.draw=()=>{
    // sân
    ctx.fillStyle='rgba(60,200,120,.10)';ctx.fillRect(0,gt+goalH,W,H);
    ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,gt+goalH);ctx.lineTo(W,gt+goalH);ctx.stroke();
    // lưới
    ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;
    for(let i=1;i<10;i++){ctx.beginPath();ctx.moveTo(gx+goalW*i/10,gt);ctx.lineTo(gx+goalW*i/10,gt+goalH);ctx.stroke()}
    for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(gx,gt+goalH*i/5);ctx.lineTo(gx+goalW,gt+goalH*i/5);ctx.stroke()}
    keeper(o.kx,gt+goalH*.86,o.krot);
    ctx.save();ctx.strokeStyle='#fff';ctx.shadowColor='#4df5ea';ctx.shadowBlur=10;ctx.lineWidth=6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(gx,gt+goalH);ctx.lineTo(gx,gt);ctx.lineTo(gx+goalW,gt);ctx.lineTo(gx+goalW,gt+goalH);ctx.stroke();ctx.restore();
    // chấm phạt đền
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(bx,by,4,0,6.283);ctx.fill();
    // linh vật sút
    mascot(bx-72,by+50,112,{expr:o.phase==='aim'?'normal':'angry',rot:o.phase==='fly'?.18:0,glow:'#4df5ea'});
    // bóng
    const r=15*o.ball.s+3;
    ctx.save();ctx.shadowColor='#fff';ctx.shadowBlur=8;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.ball.x,o.ball.y,r,0,6.283);ctx.fill();
    ctx.fillStyle='#0a1a40';ctx.beginPath();ctx.arc(o.ball.x,o.ball.y,r*.38,0,6.283);ctx.fill();ctx.restore();
    if(o.phase==='aim'){ctx.strokeStyle='rgba(77,245,234,.5)';ctx.setLineDash([8,8]);ctx.lineWidth=2;ctx.strokeRect(gx-10,gt-10,goalW+20,goalH+20);ctx.setLineDash([])}
    if(o.tgt&&o.phase!=='aim'){ctx.strokeStyle='#ffd166';ctx.lineWidth=3;ctx.beginPath();ctx.arc(o.tgt.x,o.tgt.y,12,0,6.283);ctx.stroke()}
    if(o.mt>0)gtext(o.msg,W/2,H*.5,40,o.res[o.res.length-1]==='goal'?'#ffd166':'#ff7a1a');
    for(let i=0;i<o.total;i++){const c=o.res[i]==='goal'?'#7ee787':o.res[i]?'#ff4d6d':'#4a5a80';glowCircle(W/2+(i-(o.total-1)/2)*30,H-60,9,c,!!o.res[i])}
    gtext('Ghi '+o.need+' bàn trong '+o.total+' lượt',W/2,H-34,13,'#dfe2ff');
  };
  return o;
}

/* =====================================================
   CHẶNG MỚI: BẮN TỈA
   ===================================================== */
function makeSnipe(f){
  const need=14,life=1.5+.25*f;
  const o={t:0,kills:0,lives:M.lives,tg:[],sp:.4,ch:null,recoil:0,combo:0,tlim:42+4*f};
  o.pointer=(ty,x,y)=>{
    if(ty!=='down')return;
    o.ch={x,y,t:.3};o.recoil=.25;tone(900,.05,'square',.06,-500);
    for(let i=o.tg.length-1;i>=0;i--){
      const g=o.tg[i];
      if(Math.hypot(x-g.x,y-g.y)<g.r+10){
        o.tg.splice(i,1);
        if(g.k==='ally'){o.lives--;o.combo=0;shake=.3;sBad();ft('Bắn nhầm bạn!',g.x,g.y,'#ff4d6d',20);burst(g.x,g.y,18,['#ff4d6d','#fff'],240)}
        else{const n=g.k==='gold'?2:1;o.kills+=n;o.combo++;sHit(o.combo);burst(g.x,g.y,20,[g.k==='gold'?'#ffd166':'#ff7a1a','#fff'],260);ft(g.k==='gold'?'+2':'+1',g.x,g.y,'#ffd166',22)}
        return;
      }
    }
    o.combo=0;burst(x,y,4,['#8aa'],100,.25);
  };
  o.update=dt=>{
    o.t+=dt;o.sp-=dt;if(o.recoil>0)o.recoil-=dt;if(o.ch){o.ch.t-=dt;if(o.ch.t<=0)o.ch=null}
    if(o.sp<=0){
      o.sp=Math.max(.45,.85-.012*o.t);
      const r=Math.random(),k=r<.22?'ally':r<.3?'gold':'enemy';
      o.tg.push({x:rnd(50,W-50),y:rnd(150,H*.62),r:k==='gold'?22:28,t:0,life:k==='gold'?1.1:life,k});
    }
    for(let i=o.tg.length-1;i>=0;i--){const g=o.tg[i];g.t+=dt;if(g.t>g.life)o.tg.splice(i,1)}
    if(o.lives<=0)return 'fail';
    if(o.kills>=need)return true;
    if(o.t>o.tlim)return 'fail';
    return false;
  };
  o.draw=()=>{
    for(const g of o.tg){
      const s=Math.min(1,g.t/.15);ctx.save();ctx.translate(g.x,g.y);ctx.scale(s,s);
      const col=g.k==='ally'?'#4df5ea':g.k==='gold'?'#ffd166':'#ff7a1a';
      glowCircle(0,0,g.r,col);
      if(g.k==='enemy'){glowCircle(0,0,g.r*.6,col,false,2);dot(0,0,g.r*.22,'#fff')}
      else if(g.k==='ally'){ctx.font='26px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('😊',0,2)}
      else gtext('★',0,2,26,col);
      ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,g.r+8,-Math.PI/2,-Math.PI/2+6.283*(1-g.t/g.life));ctx.stroke();
      ctx.restore();
    }
    if(o.ch){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.ch.x,o.ch.y,16,0,6.283);ctx.moveTo(o.ch.x-24,o.ch.y);ctx.lineTo(o.ch.x+24,o.ch.y);ctx.moveTo(o.ch.x,o.ch.y-24);ctx.lineTo(o.ch.x,o.ch.y+24);ctx.stroke()}
    mascot(W/2,H-46+(o.recoil>0?6:0),84,{expr:o.recoil>0?'angry':'normal',rot:o.recoil>0?-.06:0,glow:'#4df5ea'});
    bar(14,96,W-28,10,o.kills/need,'#ff7a1a');
    gtext(o.kills+'/'+need+' mục tiêu   ·   '+'♥'.repeat(Math.max(0,o.lives)),W/2,122,14,'#dfe2ff');
    if(o.combo>=3)gtext('Chuỗi x'+o.combo,W/2,H*.7,22,'#ffd166');
  };
  return o;
}

/* =====================================================
   CHẶNG MỚI: PHÒNG THỦ CĂN CỨ
   ===================================================== */
function makeDefend(f){
  const dur=34,eas=1-.12*f,gnd=()=>H-110;
  const o={t:0,hp:100,mt:[],ms:[],ex:[],sp:1,cd:0,aim:0,fl:0};
  const bld=[.1,.27,.73,.9];
  o.pointer=(ty,x,y)=>{
    if(ty!=='down'||o.cd>0||y>gnd()-30)return;
    const sx=W/2,sy=gnd()-30,d=Math.hypot(x-sx,y-sy)||1;
    o.ms.push({x:sx,y:sy,tx:x,ty:y,vx:(x-sx)/d*820,vy:(y-sy)/d*820});
    o.cd=.22;o.fl=.2;o.aim=clamp((x-sx)*.002,-.3,.3);tone(300,.14,'sawtooth',.07,500);
  };
  o.update=dt=>{
    o.t+=dt;o.cd-=dt;o.sp-=dt;if(o.fl>0)o.fl-=dt;
    if(o.sp<=0){
      o.sp=Math.max(.42,.9-.014*o.t)/eas;
      const x=rnd(30,W-30),tx=rnd(30,W-30),v=(75+45*o.t/dur)*eas,dx=tx-x,dy=gnd()-90,d=Math.hypot(dx,dy);
      o.mt.push({x,y:90,vx:dx/d*v,vy:dy/d*v,r:11});
    }
    for(let i=o.ms.length-1;i>=0;i--){
      const m=o.ms[i];m.x+=m.vx*dt;m.y+=m.vy*dt;
      if(Math.hypot(m.tx-m.x,m.ty-m.y)<14||m.y<60){o.ex.push({x:m.tx,y:m.ty,t:0});o.ms.splice(i,1);sBoom()}
    }
    for(let i=o.ex.length-1;i>=0;i--){
      const e=o.ex[i];e.t+=dt;if(e.t>.6){o.ex.splice(i,1);continue}
      const rad=e.t<.15?64*e.t/.15:64*(1-(e.t-.15)/.45);e.r=rad;
      for(let j=o.mt.length-1;j>=0;j--){const m=o.mt[j];if(Math.hypot(m.x-e.x,m.y-e.y)<rad+m.r){burst(m.x,m.y,16,['#ffd166','#ff7a1a','#fff'],240,.6);ft('+',m.x,m.y,'#ffd166',20);o.mt.splice(j,1);sHit(3)}}
    }
    for(let i=o.mt.length-1;i>=0;i--){
      const m=o.mt[i];m.x+=m.vx*dt;m.y+=m.vy*dt;
      if(m.y>=gnd()){o.hp-=12;o.mt.splice(i,1);shake=.25;sBad();burst(m.x,gnd(),28,['#ff4d6d','#ff7a1a','#fff'],300,.7)}
    }
    if(o.hp<=0)return 'fail';
    return o.t>=dur;
  };
  o.draw=()=>{
    ctx.fillStyle='rgba(79,139,255,.14)';ctx.fillRect(0,gnd(),W,H-gnd());
    ctx.strokeStyle='#4f8bff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,gnd());ctx.lineTo(W,gnd());ctx.stroke();
    bld.forEach((p,i)=>{const h=34+(i%3)*14;ctx.save();ctx.shadowColor='#4df5ea';ctx.shadowBlur=8;ctx.strokeStyle='#4df5ea';ctx.fillStyle='rgba(77,245,234,.12)';ctx.lineWidth=2;ctx.fillRect(W*p-18,gnd()-h,36,h);ctx.strokeRect(W*p-18,gnd()-h,36,h);ctx.restore()});
    for(const m of o.mt){ctx.strokeStyle='rgba(255,122,26,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x-m.vx*.2,m.y-m.vy*.2);ctx.stroke();glowCircle(m.x,m.y,m.r,'#ff7a1a')}
    for(const m of o.ms){ctx.strokeStyle='rgba(77,245,234,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x-m.vx*.05,m.y-m.vy*.05);ctx.stroke();dot(m.x,m.y,4,'#4df5ea');ctx.strokeStyle='rgba(77,245,234,.7)';ctx.beginPath();ctx.arc(m.tx,m.ty,8,0,6.283);ctx.stroke()}
    for(const e of o.ex){glowCircle(e.x,e.y,Math.max(1,e.r),'#ffd166');}
    mascot(W/2,gnd()+4,78,{expr:o.fl>0?'angry':'normal',rot:o.aim,glow:'#4df5ea'});
    bar(14,96,W-28,10,o.hp/100,'#7ee787');bar(14,H-34,W-28,10,o.t/dur,'#4df5ea');
    gtext('Căn cứ',W/2,122,13,'#dfe2ff');
  };
  return o;
}

/* =====================================================
   CHẶNG MỚI: NHỊP ĐIỆU
   ===================================================== */
function makeRhythm(f){
  const L=4,beat=.54,N=50,start=2.4,fall=1.7+.15*f,win=.2+.02*f,loss=8-1.5*f;
  const cols=['#4f8bff','#4df5ea','#ffd166','#ff7a1a'],notes=[];
  let seed=11,last=-1,rep=0;const rn=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let i=0;i<N;i++){
    let l=Math.floor(rn()*L);if(l===last){rep++;if(rep>=2){l=(l+1+Math.floor(rn()*(L-1)))%L;rep=0}}else rep=0;
    last=l;notes.push({tm:start+i*beat,l,hit:false,miss:false});
    if(i%7===5){const l2=(l+1+Math.floor(rn()*(L-1)))%L;notes.push({tm:start+i*beat,l:l2,hit:false,miss:false})}
  }
  const o={t:0,health:60,combo:0,notes,msg:'',mt:0,lastExp:'normal',et:0};
  const hitY=()=>H*.76;
  const yOf=tm=>110+(hitY()-110)*(1-(tm-o.t)/fall);
  o.pointer=(ty,x)=>{
    if(ty!=='down')return;
    const l=clamp(Math.floor(x/(W/L)),0,L-1);
    let best=null,bd=9;
    for(const n of o.notes){if(n.l===l&&!n.hit&&!n.miss){const d=Math.abs(n.tm-o.t);if(d<win&&d<bd){bd=d;best=n}}}
    if(!best){return}
    best.hit=true;o.combo++;o.health=Math.min(100,o.health+(bd<.08?5:3));
    o.msg=bd<.08?'Hoàn hảo!':'Tốt!';o.mt=.5;o.lastExp='normal';o.et=.25;
    tone([523,587,659,784][l]*(1+(o.combo>15?1:0)),.16,'triangle',.12);
    burst((l+.5)*W/L,hitY(),14,[cols[l],'#fff'],220,.5);
  };
  o.update=dt=>{
    o.t+=dt;if(o.mt>0)o.mt-=dt;if(o.et>0)o.et-=dt;
    for(const n of o.notes){
      if(!n.hit&&!n.miss&&n.tm<o.t-win){n.miss=true;o.combo=0;o.health-=loss;o.msg='Trượt!';o.mt=.5;o.lastExp='hurt';o.et=.35;sBad()}
    }
    if(o.health<=0)return 'fail';
    return o.t>start+N*beat+1;
  };
  o.draw=()=>{
    const lw=W/L,hy=hitY();
    mascot(W/2,190+Math.sin(o.t*Math.PI/beat)*5,86,{expr:o.et>0?o.lastExp:'normal',rot:Math.sin(o.t*Math.PI/beat/2)*.1,glow:'#4df5ea'});
    for(let l=0;l<L;l++){
      ctx.fillStyle='rgba(255,255,255,'+(l%2?.03:.06)+')';ctx.fillRect(l*lw,100,lw,H-100);
      ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l*lw,100);ctx.lineTo(l*lw,H);ctx.stroke();
      glowCircle((l+.5)*lw,hy,26,cols[l],false,3);
    }
    for(const n of o.notes){
      if(n.hit)continue;const y=yOf(n.tm);if(y<95||y>H+30)continue;
      const x=(n.l+.5)*lw;ctx.save();ctx.globalAlpha=n.miss?.25:1;ctx.shadowColor=cols[n.l];ctx.shadowBlur=10;ctx.fillStyle=cols[n.l];
      ctx.beginPath();ctx.arc(x,y,22,0,6.283);ctx.fill();ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(x,y,9,0,6.283);ctx.fill();ctx.restore();
    }
    bar(14,96,W-28,10,o.health/100,o.health<30?'#ff4d6d':'#7ee787');
    if(o.mt>0)gtext(o.msg,W/2,hy-70,28,o.msg==='Trượt!'?'#ff4d6d':'#ffd166');
    if(o.combo>=3)gtext('Chuỗi x'+o.combo,W/2,hy+60,20,'#ffd166');
  };
  return o;
}

/* ---------- ảnh & mảnh ghép ---------- */
let photo=null;
function makePlaceholder(){
  const c=document.createElement('canvas');c.width=900;c.height=600;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,900,600);g.addColorStop(0,'#17305a');g.addColorStop(1,'#4f8bff');x.fillStyle=g;x.fillRect(0,0,900,600);
  x.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<14;i++){x.beginPath();x.arc((i*131)%900,(i*89)%600,40+(i%4)*26,0,6.283);x.fill()}
  x.textAlign='center';x.fillStyle='#fff';x.font='900 72px "Be Vietnam Pro",sans-serif';x.fillText(CLUB,450,270);
  x.font='700 30px "Be Vietnam Pro",sans-serif';x.fillText('Ảnh chụp chung của CLB sẽ hiện ở đây',450,335);x.fillText('19/11',450,385);
  return c;
}
function setPhoto(src){const im=new Image();im.onload=()=>{photo=im};im.src=src}
photo=makePlaceholder();
if(PHOTO_SRC)setPhoto(PHOTO_SRC);
document.querySelectorAll('.pickbtn').forEach(b=>{
  if(PHOTO_SRC){b.style.display='none';return}
  b.onclick=()=>$('pick').click();
});
$('pick').addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>setPhoto(r.result);r.readAsDataURL(f);
});
function drawPuzzle(g,w,h,count,o){
  o=o||{};const C=5,R=2,pw=w/C,ph=h/R,k=Math.min(pw,ph)*.2;
  const sw=photo.naturalWidth||photo.width,sh=photo.naturalHeight||photo.height;
  const sc=Math.max(w/sw,h/sh),dw=sw*sc,dh=sh*sc,ox=(w-dw)/2,oy=(h-dh)/2;
  const slam=o.slam&&o.slam.t<1?o.slam:null;
  const path=i=>{
    const c=i%C,r=(i/C)|0,x0=c*pw,x1=x0+pw,y0=r*ph,y1=y0+ph,cx=(x0+x1)/2,cy=(y0+y1)/2;
    g.beginPath();g.moveTo(x0,y0);
    if(r>0){g.lineTo(cx-k,y0);g.arc(cx,y0,k,Math.PI,0,true)}
    g.lineTo(x1,y0);
    if(c<C-1){g.lineTo(x1,cy-k);g.arc(x1,cy,k,-Math.PI/2,Math.PI/2,false)}
    g.lineTo(x1,y1);
    if(r<R-1){g.lineTo(cx+k,y1);g.arc(cx,y1,k,0,Math.PI,false)}
    g.lineTo(x0,y1);
    if(c>0){g.lineTo(x0,cy+k);g.arc(x0,cy,k,Math.PI/2,-Math.PI/2,true)}
    g.closePath();return [cx,cy];
  };
  const solid=(i,alpha)=>{g.save();g.clip();g.drawImage(photo,ox,oy,dw,dh);g.restore();
    g.strokeStyle='rgba(255,255,255,'+(alpha===undefined?.6:alpha)+')';g.lineWidth=2.5;g.stroke()};
  g.clearRect(0,0,w,h);
  for(let i=0;i<C*R;i++){
    const have=(o.have?o.have[i]:i<count)&&!(slam&&slam.i===i);
    g.save();
    if(have&&o.spread){const c=i%C,r=(i/C)|0;g.translate((c-2)*o.spread,(r?1:-1)*o.spread*.7)}
    const [cx,cy]=path(i);
    if(have){
      if(o.pop===i&&o.popT){const sq=1+o.popT*.12;g.translate(cx,cy);g.scale(sq,sq);g.translate(-cx,-cy);path(i)}
      solid(i,o.line);
    }else{
      g.fillStyle='rgba(255,255,255,.07)';g.fill();g.setLineDash([9,7]);g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=2.5;g.stroke();g.setLineDash([]);
      g.fillStyle='rgba(255,255,255,.55)';g.font='900 '+Math.round(Math.min(pw,ph)*.34)+'px "Be Vietnam Pro",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(i+1),cx,cy);
    }
    g.restore();
  }
  if(slam){ /* mảnh bay từ trên xuống, to dần rồi đập vào ô */
    const t=slam.t,e=t*t*t,i=slam.i,c=i%C,r=(i/C)|0,cx=c*pw+pw/2,cy=r*ph+ph/2;
    g.save();g.globalAlpha=Math.min(1,t*4);
    g.shadowColor='rgba(77,245,234,'+(1-t)*.9+')';g.shadowBlur=30*(1-t);
    g.translate(cx,cy-(1-e)*h*1.1);g.rotate((1-e)*(c%2?-.7:.7));
    const s=1+(1-e)*1.4;g.scale(s,s);g.translate(-cx,-cy);
    path(i);solid(i,.9);g.restore();
  }
  if(o.hit!==undefined&&o.hit>=0&&o.hit<1){ /* sóng xung kích + chớp sáng khi chạm ô */
    const i=o.hitI,c=i%C,r=(i/C)|0,cx=c*pw+pw/2,cy=r*ph+ph/2,q=o.hit;
    g.save();g.strokeStyle='rgba(255,255,255,'+(1-q)*.9+')';g.lineWidth=5*(1-q)+1;
    g.beginPath();g.arc(cx,cy,pw*(.35+q*1.1),0,7);g.stroke();
    g.strokeStyle='rgba(77,245,234,'+(1-q)*.8+')';g.lineWidth=3*(1-q)+1;
    g.beginPath();g.arc(cx,cy,pw*(.2+q*.8),0,7);g.stroke();
    for(let n=0;n<10;n++){const a=n/10*6.283+.3,d=pw*(.3+q*.9);
      g.fillStyle='rgba(255,255,255,'+(1-q)+')';g.beginPath();g.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,3.2*(1-q)+.6,0,7);g.fill()}
    if(q<.25){path(i);g.fillStyle='rgba(255,255,255,'+(.8*(1-q/.25))+')';g.fill()}
    g.restore();
  }
}
const pzG=$('pzc').getContext('2d'),fG=$('fcv').getContext('2d');

/* ---------- danh sách chặng ---------- */
const STAGES=[
 {name:'Đường đua sinh tử',hint:'Vuốt trái/phải đổi làn, vuốt lên để nhảy, vuốt xuống để trượt.',pad:[],make:makeRunner,bgm:150},
 {name:'Bay vượt chướng ngại',hint:'Chạm màn hình để bay lên, luồn qua khe giữa các cột. Sống sót 30 giây!',pad:[],make:makeFlap,bgm:140},
 {name:'Bầy đàn bài tập',hint:'Kéo ngón tay để di chuyển. Nhân vật tự bắn. Nhặt ngọc để lên cấp!',pad:[],make:makeSurvive,bgm:130},
 {name:'Sút phạt đền',hint:'Chạm vào góc khung thành để sút. Chọn góc xa thủ môn nhất!',pad:[],make:makeKick,bgm:170},
 {name:'Đại chiến đường phố',hint:'Đấm, đá, đỡ đòn. Đòn trúng sẽ nạp thanh nộ để tung chiêu!',pad:['L','R','D','A','B','S'],make:makeFight,bgm:140},
 {name:'Xạ thủ bắn tỉa',hint:'Chạm vào mục tiêu cam. Đừng bắn nhầm bạn mặt cười, ★ vàng được x2!',pad:[],make:makeSnipe,bgm:150},
 {name:'Tốc độ tử thần',hint:'Kéo ngang để lái. Lướt sát xe khác để nạp nitro rồi bấm 🚀!',pad:['L','R','N'],make:makeRace,bgm:115},
 {name:'Phòng thủ căn cứ',hint:'Chạm để bắn tên lửa chặn thiên thạch trước khi chúng rơi xuống căn cứ.',pad:[],make:makeDefend,bgm:130},
 {name:'Nhịp điệu chiến đấu',hint:'Chạm vào đúng làn khi nốt nhạc chạm vòng sáng. Giữ nhịp để không cạn năng lượng!',pad:[],make:makeRhythm,bgm:120},
 {name:'Boss cuối: Áp Lực',hint:'Kéo để di chuyển, né đạn, tàu tự bắn. Đầy thanh thì bấm 💥!',pad:['L','R','U'],make:makeBoss,bgm:105}
];

/* ---------- luồng game ---------- */
const hud=$('hud'),hint=$('hint'),banner=$('banner');
function show(id){['title','setup','wish','final'].forEach(k=>$(k).classList.toggle('on',k===id))}
function setBanner(t,on){banner.classList.toggle('on',on);if(on){$('bannerText').textContent=t;banner.style.animation='none';banner.offsetHeight;banner.style.animation=''}}
function startStage(i){
  si=i;cur=STAGES[i].make(fails[i]);state='intro';introT=1.7;
  show(null);hud.style.display='flex';setPad([]);
  $('hStage').textContent='CHẶNG '+(i+1)+'/'+STAGES.length+'  ·  🧩 '+got.filter(Boolean).length+'/'+STAGES.length;$('hName').textContent=STAGES[i].name;
  hint.textContent='';setBanner('Chặng '+(i+1)+': '+STAGES[i].name,true);
  bgmSet(STAGES[i].bgm);inp.down=false;inp.mdx=inp.mdy=0;
}
function winStage(){
  state='wish';sWin();setPad([]);
  for(let k=0;k<4;k++)setTimeout(()=>firework(rnd(W*.15,W*.85),rnd(H*.12,H*.45)),k*220);
  setTimeout(()=>{
    const left=STAGES.length-got.filter(Boolean).length;
    $('wTag').textContent='Vòng quay mảnh ghép · '+got.filter(Boolean).length+'/'+STAGES.length;
    $('wText').textContent='Quay để biết mình tìm lại được mảnh số mấy!';
    $('whc').style.display='block';$('pzc').style.display='none';
    $('wSpin').style.display='';$('wNext').style.display='none';
    hint.textContent='';wishT=0;slamHit=false;wPhase='spin';show('wish');
  },900);
}
function doSpin(){
  if(wPhase!=='spin')return;
  /* mảnh ít lộ nội dung (trang trí, dải ruy băng) ra trước, mảnh có chữ/mặt linh vật ra sau cùng */
  const TIERS=[[0,1,5,9],[6,4],[2,3,7,8]];
  let rest=[];for(const t of TIERS){rest=t.filter(i=>!got[i]);if(rest.length)break}
  pieceI=rest[Math.floor(Math.random()*rest.length)];
  spinFrom=spinR;
  let base=-pieceI*36+rnd(-12,12);
  let tgt=spinR+360*5;tgt+=((base-tgt)%360+360)%360;
  spinTo=tgt;spinT=0;wPhase='spinning';
  $('wSpin').style.display='none';$('wText').textContent='Quay quay quay...';ensureAudio();tone(520,.1);
}
function afterSpin(){
  got[pieceI]=true;saveGame(si+1);wPhase='slam';wishT=0;slamHit=false;
  const left=STAGES.length-got.filter(Boolean).length;
  $('wTag').textContent='Mảnh ký ức số '+(pieceI+1)+' · '+got.filter(Boolean).length+'/'+STAGES.length;
  $('wText').textContent=left>0?'Trúng số '+(pieceI+1)+'! Còn '+left+' mảnh nữa để khôi phục bức ảnh.':'Đủ cả '+STAGES.length+' mảnh rồi! Cùng khôi phục bức ảnh nào.';
  $('wNext').textContent=left>0?'Chặng tiếp theo ▶':'Khôi phục ký ức ★';
  $('whc').style.display='none';$('pzc').style.display='block';
  setTimeout(()=>{if(state==='wish')$('wNext').style.display=''},1500);
}
const whG=$('whc').getContext('2d');
function drawWheel(r,hl){
  const g=whG,S=320,c=S/2,R=130;g.clearRect(0,0,S,S);
  g.save();g.translate(c,c+4);
  g.shadowColor='rgba(77,245,234,.55)';g.shadowBlur=16;g.fillStyle="#0a1630";g.beginPath();g.arc(0,0,R+8,0,7);g.fill();g.shadowBlur=0;
  g.rotate(r*Math.PI/180);
  for(let i=0;i<10;i++){
    const a0=(i*36-18-90)*Math.PI/180,a1=(i*36+18-90)*Math.PI/180;
    g.beginPath();g.moveTo(0,0);g.arc(0,0,R,a0,a1);g.closePath();
    g.fillStyle=got[i]?'#16203c':(i%2?'#2f6bff':'#18b8d8');
    if(hl===i)g.fillStyle='#ffd166';
    g.fill();g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;g.stroke();
    g.save();g.rotate(i*36*Math.PI/180);g.translate(0,-R*.72);
    g.fillStyle=got[i]?'rgba(255,255,255,.28)':(hl===i?'#06122a':'#fff');
    g.font='900 26px "Be Vietnam Pro",sans-serif';g.textAlign='center';g.textBaseline='middle';
    g.fillText(got[i]?'✓':String(i+1),0,0);g.restore();
  }
  g.restore();
  g.fillStyle='#fff';g.strokeStyle='#08101f';g.lineWidth=3;g.beginPath();g.arc(c,c+4,22,0,7);g.fill();g.stroke();
  g.fillStyle='#4f8bff';g.font='900 15px "Be Vietnam Pro",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('EPIC',c,c+5);
  g.fillStyle='#ffd166';g.strokeStyle='#08101f';g.lineWidth=3;g.beginPath();g.moveTo(c,22);g.lineTo(c-15,-4);g.lineTo(c+15,-4);g.closePath();
  g.save();g.translate(0,6);g.beginPath();g.moveTo(c,26);g.lineTo(c-14,0);g.lineTo(c+14,0);g.closePath();g.fill();g.stroke();g.restore();
}
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function finale(){
  state='final';hud.style.display='none';hint.textContent='';setPad([]);setBanner('',false);
  finT=0;letterOn=false;$('letter').style.display='none';$('openLetter').style.display='';
  show('final');bgmSet(160);
  $('openLetter').style.display='none';  /* giữ ảnh vài giây để mọi người ngắm trước khi mở thư */
  setTimeout(()=>{if(state==='final'&&!letterOn)$('openLetter').style.display=''},4200);
}
function openLetter(){
  letterOn=true;sWin();
  const L=$('letter');
  L.innerHTML=LETTER.map((t,i)=>'<p style="animation-delay:'+(.5+i*1.1)+'s">'+esc(t).replace('{name}',esc(pname))+'</p>').join('')+'<p class="sign" style="animation-delay:'+(.5+LETTER.length*1.1)+'s">'+esc(SIGN).replace(/\n/g,'<br>')+'</p>';
  L.style.display='block';$('openLetter').style.display='none';
  for(let k=0;k<8;k++)setTimeout(()=>firework(rnd(W*.1,W*.9),rnd(H*.08,H*.5)),k*200);
  setTimeout(()=>{try{L.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}},400);
}
let fwT=0;

/* ---------- màn hình ---------- */
const clsBox=$('cls');
CLASSES.forEach((c,i)=>{
  const d=document.createElement('div');d.className='cls-i'+(i===0?' sel':'');
  d.innerHTML='<div class="e">'+c.e+'</div><div class="n">'+c.name+'</div><div class="d">'+c.d+'</div>';
  d.onclick=()=>{M=c;[...clsBox.children].forEach(k=>k.classList.remove('sel'));d.classList.add('sel');tone(500,.06)};
  clsBox.appendChild(d);
});
$('start').onclick=()=>{ensureAudio();tone(440,.08);bgmSet(160);show('setup')};
/* lưu / tiếp tục tiến trình (localStorage, lỗi thì bỏ qua) */
const SAVE_KEY='epic1911_save';
function saveGame(next){try{localStorage.setItem(SAVE_KEY,JSON.stringify({n:pname,c:CLASSES.indexOf(M),g:got,s:next}))}catch(e){}}
function loadGame(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(d&&Array.isArray(d.g)&&d.g.length===STAGES.length&&d.s>0)return d}catch(e){}return null}
const saved=loadGame();
if(saved){const n=saved.g.filter(Boolean).length;$('resume').textContent='Tiếp tục hành trình ('+n+'/'+STAGES.length+' mảnh)';$('resume').style.display=''}
$('resume').onclick=()=>{
  ensureAudio();pname=saved.n||'Chiến hữu';M=CLASSES[saved.c]||CLASSES[0];got=saved.g.slice();fails=STAGES.map(()=>0);tone(520,.1);
  saved.s>=STAGES.length?finale():startStage(saved.s);
};
$('go').onclick=()=>{
  ensureAudio();pname=($('nm').value||'').trim()||'Chiến hữu';fails=STAGES.map(()=>0);got=got.map(()=>false);tone(520,.1);saveGame(0);startStage(0);
};
$('wSpin').onclick=doSpin;
$('wNext').onclick=()=>{tone(440,.08);got.filter(Boolean).length<STAGES.length?startStage(si+1):finale()};
$('openLetter').onclick=openLetter;

/* ---------- vòng lặp ---------- */
let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;bgT+=dt;
  ctx.save();
  if(shake>0){shake-=dt;ctx.translate(rnd(-6,6),rnd(-6,6))}
  const own=cur&&cur.ownBg&&(state==='play'||state==='intro'||state==='retry');
  if(!own)drawBg();
  if(state==='intro'){
    introT-=dt;
    if(introT<=0){state='play';setBanner('',false);hint.textContent=STAGES[si].hint;setPad(STAGES[si].pad)}
  }else if(state==='play'){
    const r=cur.update(dt);
    if(r==='fail'){
      fails[si]++;state='retry';hint.textContent='';setPad([]);
      setBanner('Thử lại nhé! Chặng này sẽ dễ hơn một chút',true);
      setTimeout(()=>startStage(si),1500);
    }else if(r===true)winStage();
  }
  if(cur&&(state==='play'||state==='intro'||state==='retry'))cur.draw();
  if(state==='wish'){
    wishT+=dt;
    if(wPhase==='spin'){drawWheel(spinR+Math.sin(wishT*2.2)*3,-1)}
    else if(wPhase==='spinning'){
      spinT+=dt;const q=Math.min(1,spinT/4.4),e=1-Math.pow(1-q,3.2);
      spinR=spinFrom+(spinTo-spinFrom)*e;
      const seg=Math.floor((spinR+18)/36);if(seg!==spinLast){spinLast=seg;tone(760+(seg%3)*90,.04,'square',.06)}
      drawWheel(spinR,q>=1?pieceI:-1);
      if(q>=1){wPhase='won';wishT=0;sWin();for(let k=0;k<3;k++)setTimeout(()=>firework(rnd(W*.2,W*.8),rnd(H*.1,H*.35)),k*180)}
    }else if(wPhase==='won'){
      drawWheel(spinR,pieceI);if(wishT>1.1)afterSpin();
    }else{
      const tt=(wishT-.3)/.55,hit=(wishT-.85)/.55;
      if(tt>=1&&!slamHit){slamHit=true;sSlam();try{navigator.vibrate&&navigator.vibrate(35)}catch(e){}}
      const sh=hit>=0&&hit<1?Math.sin(hit*38)*(1-hit)*6:0;
      pzc.style.transform=sh?'translate('+sh.toFixed(1)+'px,'+(sh*.6).toFixed(1)+'px)':'';
      drawPuzzle(pzG,640,360,0,{have:got,slam:{i:pieceI,t:Math.max(0,tt)},pop:pieceI,popT:hit>=0?Math.max(0,1-hit)*Math.sin(Math.min(1,hit*3)*3.14):0,hit:hit,hitI:pieceI});
    }
  }
  if(state==='final'){
    finT+=dt;
    const e=Math.max(0,1-finT/1.8),sp=e*e*230;
    drawPuzzle(fG,800,450,STAGES.length,{spread:sp,line:Math.max(0,.6*(1-(finT-1.6)/.8))});
    fwT-=dt;
    if(finT>1.8&&fwT<=0){firework(rnd(W*.1,W*.9),rnd(H*.08,H*.5));fwT=letterOn?.35:.7}
  }else if(state==='title'){
    fwT-=dt;if(fwT<=0){firework(rnd(W*.1,W*.9),rnd(H*.08,H*.5));fwT=1.8}
  }
  if(state==='title'){mG1.clearRect(0,0,297,420);mascotG(mG1,148.5,420,420,{expr:'normal'})}
  if(state==='final'){mG2.clearRect(0,0,297,420);mascotG(mG2,148.5,420,420,{expr:'happy'})}
  updParts(dt);drawParts();
  ctx.restore();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__game={start:startStage,finale,openLetter,get cur(){return cur},get state(){return state},setName:n=>{pname=n}};
})();
