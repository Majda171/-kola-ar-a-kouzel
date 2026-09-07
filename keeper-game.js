(()=>{
  const open=document.getElementById('openKeeperGame'),modal=document.getElementById('keeperModal');if(!open||!modal)return;
  const close=document.getElementById('keeperClose'),start=document.getElementById('keeperStart'),keeper=document.getElementById('kgKeeper'),ball=document.getElementById('kgBall'),msg=document.getElementById('kgMessage'),status=document.getElementById('keeperStatus'),shotEl=document.getElementById('keeperShot'),saveEl=document.getElementById('keeperSaves'),hoops=[...document.querySelectorAll('.kg-hoop')];
  const TOTAL=20;
  let shot=0,saves=0,target=1,selected=null,flying=false,raf=null,timer=null;
  const centers=[{x:32.65,y:35.15},{x:49.4,y:22.8},{x:66.25,y:40.2}],kp=[{x:32.65,y:52},{x:49.4,y:40},{x:66.25,y:57}];
  const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
  const isGirl=String(student?.salutation||'').toLowerCase().includes('sle');
  keeper.src=isGirl?'img/brankar-holka-v41.webp':'img/brankar-kluk-v41.webp';
  keeper.alt=isGirl?'Brankářka na koštěti':'Brankář na koštěti';
  const playerWord=isGirl?'brankářka':'brankář';
  const copy=document.querySelector('#brankar span');if(copy)copy.textContent=`${TOTAL} střel · klikni na obruč a přesuň ${playerWord==='brankářka'?'brankářku':'brankáře'}`;
  const intro=document.querySelector('.keeper-panel header>p:last-child');if(intro)intro.textContent=`Camrál letí k jedné ze tří obručí. Klikni na obruč, kam se má ${playerWord} přesunout.`;
  start.textContent=`Začít ${TOTAL} střel`;shotEl.textContent=`0 / ${TOTAL}`;
  function choose(){return Math.floor(Math.random()*3)}
  function setKeeper(i){if(!flying)return;selected=i;hoops.forEach((h,n)=>h.classList.toggle('selected',n===i));keeper.style.left=kp[i].x+'%';keeper.style.top=kp[i].y+'%'}
  function resetKeeper(){selected=null;hoops.forEach(h=>h.classList.remove('selected'));keeper.style.left='50%';keeper.style.top='68%'}
  function flash(t){msg.textContent=t;msg.classList.add('show');setTimeout(()=>msg.classList.remove('show'),520)}
  function next(){if(shot>=TOTAL){finish();return}shot++;shotEl.textContent=`${shot} / ${TOTAL}`;target=choose();resetKeeper();flying=true;ball.style.display='block';const sx=50,sy=82,e=centers[target],born=performance.now(),dur=Math.max(820,1650-shot*28),curve=(Math.random()-.5)*7;function anim(now){const t=Math.min(1,(now-born)/dur),u=1-t,x=u*u*sx+2*u*t*((sx+e.x)/2+curve)+t*t*e.x,y=u*u*sy+2*u*t*(Math.min(sy,e.y)-8)+t*t*e.y;ball.style.left=x+'%';ball.style.top=y+'%';ball.style.transform=`translate(-50%,-50%) scale(${.45+t*.65})`;if(t<1)raf=requestAnimationFrame(anim);else resolve()}raf=requestAnimationFrame(anim)}
  function resolve(){flying=false;const ok=selected===target;if(ok){saves++;saveEl.textContent=saves;flash('CHYCENO');status.textContent='Výborný zákrok.'}else{flash('GÓL');status.textContent='Camrál proletěl obručí.'}timer=setTimeout(()=>{ball.style.display='none';next()},650)}
  function finish(){ball.style.display='none';resetKeeper();status.textContent=`Konec: ${saves} z ${TOTAL} střel chycených.`;flash(saves>=Math.ceil(TOTAL*.8)?'VÝBORNĚ':saves>=Math.ceil(TOTAL*.5)?'DOBRÁ PRÁCE':'TRÉNUJ DÁL');start.textContent='Hrát znovu';if(saves>=Math.ceil(TOTAL*.6))window.BradaviceAchievements?.award?.('famfrpalova-hvezda',{silent:true});window.BradaviceDB?.submitTournamentScore?.('keeper-cup',Math.round(saves/TOTAL*100)).catch?.(()=>{})}
  function begin(){cancelAnimationFrame(raf);clearTimeout(timer);shot=0;saves=0;shotEl.textContent=`0 / ${TOTAL}`;saveEl.textContent='0';start.textContent='Nová hra';status.textContent='Připrav se na první střelu.';setTimeout(next,550)}
  hoops.forEach((h,i)=>h.addEventListener('click',()=>setKeeper(i)));start.addEventListener('click',begin);open.addEventListener('click',()=>{modal.hidden=false;document.body.style.overflow='hidden';begin()});function shut(){cancelAnimationFrame(raf);clearTimeout(timer);modal.hidden=true;document.body.style.overflow=''}close.addEventListener('click',shut);modal.addEventListener('click',e=>{if(e.target===modal)shut()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)shut();if(!flying)return;if(e.key==='1'||e.key==='ArrowLeft')setKeeper(0);if(e.key==='2'||e.key==='ArrowUp')setKeeper(1);if(e.key==='3'||e.key==='ArrowRight')setKeeper(2)});if(location.hash==='#brankar')setTimeout(()=>open.click(),120)
})();
