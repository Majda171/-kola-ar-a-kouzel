(()=>{
 const DB=window.BradaviceDB;
 const lobby=document.getElementById('tchorickyLobby'),game=document.getElementById('tchorickyGame'),canvas=document.getElementById('tchorickyCanvas'),ctx=canvas?.getContext('2d'),turnLabel=document.getElementById('turnLabel'),leftCount=document.getElementById('leftCount'),rightCount=document.getElementById('rightCount'),leftLabel=document.getElementById('leftLabel'),rightLabel=document.getElementById('rightLabel'),toastEl=document.getElementById('tchorickyToast'),splat=document.getElementById('tchorickySplat'),result=document.getElementById('gameResult'),resultTitle=document.getElementById('resultTitle'),resultText=document.getElementById('resultText'),roomStatus=document.getElementById('roomStatus');
 if(!canvas||!ctx)return;ctx.imageSmoothingEnabled=true;try{ctx.imageSmoothingQuality='high'}catch{}
 const W=canvas.width,H=canvas.height,arena={x:W/2,y:H/2,r:304},FRICTION=.985,BOUNCE=.91,STOP=.055,MAX_POWER=21;
 let stones=[],mode='training',role='player',turn='player',phase='idle',selected=null,pointer=null,roomCode='',roomVersion=0,pollTimer=null,toastTimer=null,shotOwner='',onlineNames={host:'Student 1',guest:'Student 2'};
 const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const boardImg=new Image(),blueSwirl=new Image(),blueStar=new Image(),greenSwirl=new Image(),greenStar=new Image(),slimeTexture=new Image();
 boardImg.src='img/tchoricky-board-v4369.webp';blueSwirl.src='img/tchoricky-blue-swirl-v4369.webp';blueStar.src='img/tchoricky-blue-star-v4369.webp';greenSwirl.src='img/tchoricky-green-swirl-v4369.webp';greenStar.src='img/tchoricky-green-star-v4369.webp';slimeTexture.src='img/tchoricky-slime-texture-v43611.webp';
 const myOwner=()=>mode==='online'?role:'player';
 const opponentOf=o=>mode==='online'?(o==='host'?'guest':'host'):(o==='player'?'ai':'player');
 const canShoot=()=>phase==='aim'&&turn===myOwner();
 function toast(t){toastEl.textContent=t;toastEl.classList.remove('show');void toastEl.offsetWidth;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1800)}
 function showSplat(){splat.classList.remove('show');void splat.offsetWidth;splat.classList.add('show')}
 function stoneRadius(type){return type==='heavy'?21:type==='swift'?17:18.5}
 function stoneMass(s){return s.type==='heavy'?1.75:s.type==='swift'?0.82:1}
 function makeStone(owner,x,y,i,type='normal'){return{owner,x,y,vx:0,vy:0,r:stoneRadius(type),type,alive:true,id:`${owner}-${i}`,spin:rnd(0,6.28),rotV:0,slimed:0}}
 function formation(owner,sign){
   const out=[],xs=[-116,-58,0,58,116],ys=[182,226,268];
   let i=0;for(const y of ys)for(const x of xs){const type=i===0?'heavy':i===1?'swift':i===2?'slime':'normal';out.push(makeStone(owner,arena.x+x,arena.y+sign*y,i,type));i++}
   return out;
 }
 function initialState(a='host',b='guest'){return{stones:[...formation(a,1),...formation(b,-1)],turn:a,ended:false,winner:null,move:0}}
 function setFromState(st){if(!st||!Array.isArray(st.stones))return;stones=st.stones.map(x=>({...x,r:Number(x.r)||stoneRadius(x.type),vx:0,vy:0,spin:Number(x.spin)||0,rotV:0,alive:x.alive!==false}));turn=st.turn||turn;phase=st.ended?'over':'aim';updateHud();if(st.ended)showResult(st.winner)}
 function serialState(ended=false,winner=null){return{stones:stones.map(({owner,x,y,r,type,alive,id,slimed,spin})=>({owner,x,y,r,type,alive,id,slimed:slimed||0,spin:Number(spin)||0})),turn,ended,winner,move:Date.now()}}
 function startTraining(){mode='training';role='player';turn='player';stones=[...formation('player',1),...formation('ai',-1)];phase='aim';roomCode='';lobby.hidden=true;game.hidden=false;result.hidden=true;leftLabel.textContent='Ty';rightLabel.textContent='Kouzelný soupeř';updateHud()}
 async function getUser(){try{return await DB?.getUser?.()}catch{return null}}
 async function createOnline(){
   if(!DB?.createTchorickyRoom){roomStatus.textContent='Online partie není připravená.';return}
   roomStatus.textContent='Zakládám partii…';
   try{
     const data=await DB.createTchorickyRoom(initialState('host','guest'));roomCode=data.room_code;roomVersion=Number(data.version||0);role='host';mode='online';onlineNames.host=data.host_name||'Student 1';onlineNames.guest='Čeká se…';setFromState(data.state);lobby.hidden=true;game.hidden=false;result.hidden=true;phase='waiting';updateHud();toast(`Kód partie: ${roomCode}`);startPolling();
   }catch(e){roomStatus.textContent=e?.message||'Partii se nepodařilo vytvořit.'}
 }
 async function joinOnline(){
   const code=(document.getElementById('roomCodeInput')?.value||'').trim().toUpperCase();if(code.length<4){roomStatus.textContent='Zadej kód partie.';return}
   roomStatus.textContent='Připojuji…';
   try{
     const data=await DB.joinTchorickyRoom(code);roomCode=data.room_code;roomVersion=Number(data.version||0);role='guest';mode='online';onlineNames.host=data.host_name||'Student 1';onlineNames.guest=data.guest_name||'Student 2';setFromState(data.state);lobby.hidden=true;game.hidden=false;result.hidden=true;phase='aim';updateHud();startPolling();
   }catch(e){roomStatus.textContent=e?.message||'Připojení se nepodařilo.'}
 }
 function startPolling(){clearInterval(pollTimer);pollTimer=setInterval(pollRoom,850);pollRoom()}
 async function pollRoom(){
   if(mode!=='online'||!roomCode||phase==='moving'||phase==='syncing')return;
   try{
     const data=await DB.getTchorickyRoom(roomCode);
     onlineNames.host=data.host_name||onlineNames.host;onlineNames.guest=data.guest_name||onlineNames.guest;
     if(Number(data.version)!==roomVersion){roomVersion=Number(data.version||0);setFromState(data.state)}
     if(data.status==='waiting'){phase='waiting'}else if(data.status==='playing'&&phase==='waiting')phase='aim';
     if(data.status==='abandoned'){phase='over';result.hidden=false;resultTitle.textContent='Partie skončila';resultText.textContent='Druhý student partii opustil.'}
     updateHud();
   }catch(e){console.warn(e)}
 }
 async function pushOnline(winner=null){
   if(mode!=='online'||!roomCode)return;phase='syncing';
   const ended=Boolean(winner);
   try{
     const data=await DB.updateTchorickyRoom(roomCode,serialState(ended,winner),roomVersion);roomVersion=Number(data.version||roomVersion+1);setFromState(data.state);onlineNames.host=data.host_name||onlineNames.host;onlineNames.guest=data.guest_name||onlineNames.guest;
   }catch(e){toast(e?.message||'Tah se nepodařilo uložit.');try{const d=await DB.getTchorickyRoom(roomCode);roomVersion=Number(d.version||0);setFromState(d.state)}catch{}}
   if(!ended&&phase!=='over')phase='aim';updateHud();
 }
 function updateHud(){
   const mine=myOwner(),other=opponentOf(mine),mc=stones.filter(s=>s.alive&&s.owner===mine).length,oc=stones.filter(s=>s.alive&&s.owner===other).length;
   leftCount.textContent=String(mc);rightCount.textContent=String(oc);
   if(mode==='online'){leftLabel.textContent=role==='host'?(onlineNames.host||'Ty'):(onlineNames.guest||'Ty');rightLabel.textContent=role==='host'?(onlineNames.guest||'Soupeř'):(onlineNames.host||'Soupeř')}
   if(phase==='waiting')turnLabel.textContent=`Kód ${roomCode} · čeká se na druhého studenta`;
   else if(phase==='over')turnLabel.textContent='Partie skončila';
   else turnLabel.textContent=turn===mine?'Tvůj tah':'Tah soupeře';
 }
 function drawBoard(){
   ctx.clearRect(0,0,W,H);
   const bw=710,bh=700,bx=arena.x-bw/2,by=arena.y-bh/2;
   // Jemný stín pod skutečnou zdobenou deskou; mimo ni zůstává vidět nádvoří.
   ctx.save();ctx.beginPath();ctx.arc(arena.x,arena.y,arena.r+28,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.52)';ctx.shadowColor='rgba(0,0,0,.78)';ctx.shadowBlur=34;ctx.fill();ctx.restore();
   if(boardImg.complete&&boardImg.naturalWidth){ctx.drawImage(boardImg,bx,by,bw,bh)}
   else{
     ctx.save();ctx.translate(arena.x,arena.y);ctx.beginPath();ctx.arc(0,0,arena.r+16,0,Math.PI*2);ctx.fillStyle='#24231f';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#a98a50';ctx.stroke();ctx.restore();
   }
 }
 function stoneSprite(s){
   const blue=s.owner==='player'||s.owner==='host';
   // Většina kamenů má jednotný kolejní vzhled. Rychlý kámen má vířivý znak,
   // aby byly zvláštní kameny rozeznatelné bez směsi náhodných symbolů.
   if(s.type==='swift')return blue?blueSwirl:greenSwirl;
   return blue?blueStar:greenStar;
 }
 function drawStone(s){
   const img=stoneSprite(s),size=s.r*(s.type==='heavy'?2.72:2.55);
   ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.spin*.11);
   ctx.shadowColor='rgba(0,0,0,.82)';ctx.shadowBlur=9;ctx.shadowOffsetY=4;
   if(img.complete&&img.naturalWidth){ctx.drawImage(img,-size/2,-size/2,size,size)}
   else{ctx.beginPath();ctx.arc(0,0,s.r,0,Math.PI*2);ctx.fillStyle=(s.owner==='player'||s.owner==='host')?'#2d70ba':'#2e8750';ctx.fill()}
   ctx.shadowBlur=0;ctx.shadowOffsetY=0;
   if(s.type==='heavy'){
     ctx.beginPath();ctx.arc(0,0,s.r*1.16,0,Math.PI*2);ctx.strokeStyle='rgba(217,181,101,.84)';ctx.lineWidth=2.3;ctx.stroke();
   }
   if(s.type==='swift'){
     ctx.beginPath();ctx.arc(0,0,s.r*1.22,0,Math.PI*2);ctx.strokeStyle='rgba(230,219,169,.7)';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
   }
   if(s.type==='slime'||s.slimed>0){
     // Skutečná textura slizu z lektvarových surovin, oříznutá přímo do kamene.
     if(slimeTexture.complete&&slimeTexture.naturalWidth){
       ctx.save();ctx.beginPath();ctx.arc(0,0,s.r*1.03,0,Math.PI*2);ctx.clip();ctx.globalAlpha=s.type==='slime'?.63:.48;ctx.drawImage(slimeTexture,-s.r*1.18,-s.r*1.18,s.r*2.36,s.r*2.36);ctx.restore();
     }
     ctx.beginPath();ctx.arc(0,0,s.r*1.16,0,Math.PI*2);ctx.strokeStyle='rgba(153,178,69,.9)';ctx.lineWidth=2.6;ctx.stroke();
     ctx.fillStyle='rgba(156,183,73,.9)';ctx.beginPath();ctx.arc(s.r*.7,s.r*.72,2.7,0,Math.PI*2);ctx.arc(-s.r*.66,s.r*.8,2.1,0,Math.PI*2);ctx.fill();
   }
   ctx.restore();
 }
 function drawAim(){
   if(!selected||!pointer||!canShoot())return;const dx=selected.x-pointer.x,dy=selected.y-pointer.y,d=Math.hypot(dx,dy);if(d<2)return;const ux=dx/d,uy=dy/d,p=clamp(d/7,0,MAX_POWER),len=p*7;
   ctx.save();ctx.strokeStyle='rgba(239,216,160,.9)';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(selected.x,selected.y);ctx.lineTo(selected.x+ux*len,selected.y+uy*len);ctx.stroke();ctx.restore();
 }
 function render(){drawBoard();stones.filter(s=>s.alive).forEach(drawStone);drawAim();requestAnimationFrame(render)}
 function resolveCollisions(){
   const alive=stones.filter(s=>s.alive);
   for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){
     const a=alive[i],b=alive[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;if(d===0){d=.001;dx=.001}
     if(d>=min)continue;const nx=dx/d,ny=dy/d,over=min-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;
     const rvx=b.vx-a.vx,rvy=b.vy-a.vy,sep=rvx*nx+rvy*ny;if(sep>=0)continue;
     const ma=stoneMass(a),mb=stoneMass(b),imp=-(1+BOUNCE)*sep/(1/ma+1/mb),ix=imp*nx,iy=imp*ny;a.vx-=ix/ma;a.vy-=iy/ma;b.vx+=ix/mb;b.vy+=iy/mb;
     if(a.type==='slime'&&a.owner!==b.owner){const fresh=!(b.slimed>0);b.slimed=Math.max(b.slimed||0,2);if(fresh&&b.owner===myOwner())toast('Tvůj tchoříček je obalený slizem.')}if(b.type==='slime'&&a.owner!==b.owner){const fresh=!(a.slimed>0);a.slimed=Math.max(a.slimed||0,2);if(fresh&&a.owner===myOwner())toast('Tvůj tchoříček je obalený slizem.')}
   }
 }
 function checkOut(){
   for(const s of stones){if(!s.alive)continue;if(Math.hypot(s.x-arena.x,s.y-arena.y)>arena.r+s.r*.4){s.alive=false;s.vx=s.vy=0;if(s.owner===myOwner()){showSplat();toast('Tvůj tchoříček byl vyražen!')}else toast('Soupeřův tchoříček je venku!')}}
 }
 function winner(){
   const owners=mode==='online'?['host','guest']:['player','ai'];const alive=Object.fromEntries(owners.map(o=>[o,stones.some(s=>s.alive&&s.owner===o)]));
   if(!alive[owners[0]])return owners[1];if(!alive[owners[1]])return owners[0];return null;
 }
 function showResult(w){result.hidden=false;const mine=myOwner();resultTitle.textContent=w===mine?'Vítězství':'Prohra';resultText.textContent=w===mine?'Vyrazil/a jsi všechny soupeřovy tchoříčky.':'Soupeř vyrazil všechny tvoje tchoříčky.';phase='over';updateHud()}
 async function finishMotion(){
   if(phase==='resolving'||phase==='syncing'||phase==='over')return;phase='resolving';
   stones.forEach(s=>{s.vx=s.vy=s.rotV=0;if(s.slimed>0)s.slimed--});
   const w=winner();if(w){turn=opponentOf(shotOwner||turn);if(mode==='online')await pushOnline(w);else showResult(w);return}
   turn=opponentOf(shotOwner||turn);selected=null;pointer=null;updateHud();
   if(mode==='online'){await pushOnline(null);return}
   if(turn==='ai'){phase='ai';setTimeout(aiMove,620)}else phase='aim';
 }
 function physics(){
   if(phase==='moving'||phase==='ai-moving'){
     let moving=false;for(const s of stones){if(!s.alive)continue;s.x+=s.vx;s.y+=s.vy;s.spin+=s.rotV;const f=s.slimed>0?.955:FRICTION;s.vx*=f;s.vy*=f;s.rotV*=.99;if(Math.abs(s.vx)<STOP)s.vx=0;if(Math.abs(s.vy)<STOP)s.vy=0;if(Math.hypot(s.vx,s.vy)>0)moving=true}
     resolveCollisions();checkOut();if(!moving)finishMotion();
   }
   requestAnimationFrame(physics)
 }
 function aiMove(){
   if(mode!=='training'||turn!=='ai'||phase!=='ai')return;const own=stones.filter(s=>s.alive&&s.owner==='ai'),targets=stones.filter(s=>s.alive&&s.owner==='player');if(!own.length||!targets.length)return;
   const s=own[Math.floor(Math.random()*own.length)],t=targets[Math.floor(Math.random()*targets.length)];let dx=t.x-s.x+rnd(-35,35),dy=t.y-s.y+rnd(-20,20),d=Math.hypot(dx,dy)||1,p=rnd(12,18)*(s.type==='swift'?1.22:1);s.vx=dx/d*p;s.vy=dy/d*p;s.rotV=rnd(-.16,.16);shotOwner='ai';phase='ai-moving';
 }
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
 canvas.addEventListener('pointerdown',e=>{if(!canShoot())return;const p=point(e),mine=myOwner();selected=stones.filter(s=>s.alive&&s.owner===mine).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(!selected||dist(selected,p)>selected.r*1.8){selected=null;return}pointer=p;canvas.setPointerCapture?.(e.pointerId);canvas.classList.add('aiming');e.preventDefault()});
 canvas.addEventListener('pointermove',e=>{if(selected)pointer=point(e)});
 canvas.addEventListener('pointerup',e=>{if(!selected||!canShoot())return;pointer=point(e);const dx=selected.x-pointer.x,dy=selected.y-pointer.y,d=Math.hypot(dx,dy);canvas.classList.remove('aiming');if(d<6){selected=null;pointer=null;return}const mult=selected.type==='swift'?1.25:1,p=clamp(d/7,0,MAX_POWER)*mult;selected.vx=dx/d*p;selected.vy=dy/d*p;selected.rotV=rnd(-.18,.18);shotOwner=turn;phase='moving';selected=null;pointer=null;updateHud()});
 document.getElementById('startTraining')?.addEventListener('click',startTraining);document.getElementById('createOnline')?.addEventListener('click',createOnline);document.getElementById('joinOnline')?.addEventListener('click',joinOnline);
 async function leave(){clearInterval(pollTimer);if(mode==='online'&&roomCode)try{await DB.leaveTchorickyRoom(roomCode)}catch{}location.href='nadvori.html'}
 document.getElementById('leaveGame')?.addEventListener('click',leave);document.getElementById('resultClose')?.addEventListener('click',leave);
 window.addEventListener('pagehide',()=>clearInterval(pollTimer));
 render();physics();
})();