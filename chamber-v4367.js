(()=>{
 const diary=document.getElementById('chamberDiary'),raddle=document.getElementById('chamberRaddle'),basilisk=document.getElementById('chamberBasilisk'),sword=document.getElementById('chamberSword'),fang=document.getElementById('chamberFang'),msg=document.getElementById('chamberMessage'),intro=document.getElementById('chamberIntro');
 if(!diary||!raddle||!basilisk||!sword||!fang)return;
 const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
 const sid=String(student?.supabaseUserId||student?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
 const KEY=`bradavice_chamber_sequence_v4367_${sid}`;
 let stage=Math.max(0,Math.min(4,Number(localStorage.getItem(KEY)||0))),locked=false;
 const tell=t=>{if(msg)msg.textContent=t};
 const save=n=>{stage=n;localStorage.setItem(KEY,String(n))};
 function revealRaddle(){
   raddle.hidden=false;raddle.classList.add('entering');
   if(intro)intro.textContent='Z deníku se vynořila průsvitná postava mladého studenta.';
   tell('„Nejsem člověk. Jsem vzpomínka — otisk Toma Raddla, který v tomto deníku zůstal.“');
 }
 function summon(){
   if(stage<1||stage>=3)return;
   save(2);basilisk.hidden=false;basilisk.classList.add('appear');sword.hidden=false;
   tell('Raddle se usměje. „Pohleď na dědice komnaty.“ Z hlubin se ozve syčení a bazilišek se zvedne z temnoty. Použij meč.');
 }
 function killBasilisk(){
   if(stage!==2||locked)return;locked=true;
   basilisk.classList.add('defeated');tell('Čepel zasáhla baziliška. Nestvůra se hroutí a mizí v temnotě…');
   setTimeout(()=>{basilisk.hidden=true;sword.hidden=true;fang.hidden=false;save(3);locked=false;tell('Po baziliškovi zůstal jediný dlouhý zub. Deník stále leží na podlaze.');},850);
 }
 function destroyDiary(){
   if(stage!==3||locked)return;locked=true;save(4);diary.classList.add('pierced');fang.hidden=true;
   tell('Zub prorazil deník. Inkoust se rozpil a Raddle začíná blednout.');
   raddle.classList.add('fading');
   window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true});
   window.BradaviceAchievements?.completeQuest?.('tajemna-komnata',{title:'Tajemná komnata'});
   setTimeout(()=>{raddle.hidden=true;locked=false;tell('Raddle zmizel. V komnatě zůstalo jen ticho a zničený deník.');},2900);
 }
 function overlaps(a,b){const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top}
 function makeDrag(el,target,onDrop){
   let active=false,startX=0,startY=0,dx=0,dy=0;
   el.addEventListener('pointerdown',e=>{if(el.hidden)return;active=true;startX=e.clientX;startY=e.clientY;dx=dy=0;el.setPointerCapture?.(e.pointerId);el.classList.add('dragging');e.preventDefault()});
   el.addEventListener('pointermove',e=>{if(!active)return;dx=e.clientX-startX;dy=e.clientY-startY;el.style.translate=`${dx}px ${dy}px`;e.preventDefault()});
   const end=e=>{if(!active)return;active=false;el.classList.remove('dragging');const ok=overlaps(el,target);el.style.translate='';if(ok)onDrop();else tell(el===sword?'Meč musí zasáhnout baziliška.':'Baziliščím zubem musíš probodnout deník.');try{el.releasePointerCapture?.(e.pointerId)}catch{}};
   el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 }
 diary.addEventListener('click',()=>{
   if(stage===0){save(1);revealRaddle();setTimeout(summon,2100)}
   else if(stage===1){revealRaddle();setTimeout(summon,650)}
   else if(stage===4)tell('Deník je zničený. Raddle už z něj nemůže promluvit.');
 });
 makeDrag(sword,basilisk,killBasilisk);makeDrag(fang,diary,destroyDiary);
 // Obnova přesně podle studenta.
 if(stage>=1)revealRaddle();
 if(stage===1)setTimeout(summon,1200);
 if(stage===2){basilisk.hidden=false;sword.hidden=false}
 if(stage===3){raddle.hidden=false;basilisk.hidden=true;sword.hidden=true;fang.hidden=false;tell('Bazilišek je pryč. Přetáhni jeho zub na deník.')}
 if(stage>=4){diary.classList.add('pierced');basilisk.hidden=true;sword.hidden=true;fang.hidden=true;raddle.hidden=true;if(intro)intro.textContent='Deník leží zničený na podlaze.';tell('Raddle zmizel. Tajemná komnata znovu ztichla.')}
})();