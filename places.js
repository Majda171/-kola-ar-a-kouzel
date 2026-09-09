(() => {
  const A=window.BradaviceAchievements;
  const plants=[...document.querySelectorAll('.plant')];
  const plantSeen=new Set();
  plants.forEach((p,i)=>p.addEventListener('click',()=>{
    p.classList.remove('startled');void p.offsetWidth;p.classList.add('startled');
    plantSeen.add(i);if(plantSeen.size===plants.length&&plants.length)A?.award('sklenikovy-znalec');
  }));

  const willow=document.querySelector('.willow-tree');
  if(willow) willow.addEventListener('click',()=>{willow.classList.remove('thrash');void willow.offsetWidth;willow.classList.add('thrash')});

  const water=document.querySelector('.lake-water');
  if(water) water.addEventListener('click',e=>{const r=document.createElement('span');r.className='ripple go';const b=water.getBoundingClientRect();r.style.left=(e.clientX-b.left-50)+'px';r.style.top=(e.clientY-b.top-16)+'px';water.appendChild(r);setTimeout(()=>r.remove(),1300)});

  const pear=document.querySelector('.pear'); const kitchen=document.querySelector('.kitchen-scene');
  if(pear&&kitchen) pear.addEventListener('click',()=>{
    pear.classList.remove('tickled'); void pear.offsetWidth; pear.classList.add('tickled');
    A?.award('lechtiva-hruska');A?.award('tajemstvi-hradu',{silent:true});
    kitchen.classList.add('open');
  });

  const req=document.querySelector('.requirement'); const zone=document.querySelector('.require-wall'); const count=document.querySelector('.walk-count');
  if(req&&zone){let passes=0;zone.addEventListener('pointerenter',()=>{passes++;if(count) count.textContent=passes<3?'…':' ';if(passes>=3&&!req.classList.contains('ready')){req.classList.add('ready');A?.award('mistnost-se-ukazala');A?.award('tajemstvi-hradu',{silent:true})}})}

  const telescope=document.querySelector('.telescope');
  if(telescope)telescope.addEventListener('click',()=>{telescope.classList.remove('telescope-nudge');void telescope.offsetWidth;telescope.classList.add('telescope-nudge')});

  const godrik=document.getElementById('godrikQuest');
  if(godrik){
    const q=A?.read(A?.scopedKey?.(A?.keys?.QUEST_KEY||'bradavice_quests_v1')||A?.keys?.QUEST_KEY||'bradavice_quests_v1',{})||{};
    if(q['find-godric']===true||q['find-godric']?.done===true)godrik.classList.add('quest-complete');
    // Kliknutí na Godrika řeší founders-v41.js, aby se jedním klikem správně
    // zapsal jak úkol, tak nalezení zakladatele a otevřel se jeho dialog.
  }

  const armor=document.querySelector('.corridor-armor');if(armor)armor.addEventListener('click',()=>{armor.classList.remove('rattle');void armor.offsetWidth;armor.classList.add('rattle')});

  const tree=document.getElementById('courtyardTree');
  if(tree) tree.addEventListener('click',e=>{
    const b=tree.getBoundingClientRect();
    for(let i=0;i<14;i++){const l=document.createElement('i');l.className='fall-leaf';l.style.left=`${b.left+b.width*(.18+Math.random()*.65)}px`;l.style.top=`${b.top+b.height*(.06+Math.random()*.25)}px`;l.style.setProperty('--dx',`${-90+Math.random()*180}px`);l.style.setProperty('--rot',`${180+Math.random()*540}deg`);document.body.appendChild(l);setTimeout(()=>l.remove(),1900)}
  });

  const courtyardFountain=document.getElementById('courtyardFountain');
  if(courtyardFountain) courtyardFountain.addEventListener('click',()=>{
    courtyardFountain.classList.remove('sparkle');void courtyardFountain.offsetWidth;courtyardFountain.classList.add('sparkle');
  });

  const hut=document.querySelector('.hut');if(hut)hut.addEventListener('click',()=>{hut.classList.remove('knock');void hut.offsetWidth;hut.classList.add('knock')});
  document.querySelectorAll('.cloud').forEach(c=>c.addEventListener('click',()=>{c.classList.toggle('scud')}));

  document.querySelectorAll('.trophy-case').forEach(t=>t.addEventListener('click',()=>{t.classList.remove('portrait-jolt');void t.offsetWidth;t.classList.add('portrait-jolt')}));

  document.querySelectorAll('.castle-painting').forEach(pic=>pic.addEventListener('click',()=>{
    pic.classList.remove('portrait-jolt');void pic.offsetWidth;pic.classList.add('portrait-jolt');
  }));
  document.querySelectorAll('.corridor-torch').forEach(torch=>torch.addEventListener('click',()=>{
    torch.classList.remove('flare');void torch.offsetWidth;torch.classList.add('flare');
  }));


  // Astronomická věž v41 — každé pozorování začíná od 0/3. Ukládá se pouze jednorázové splnění úkolu.
  const constellationZones=[...document.querySelectorAll('.constellation-zone')];
  if(constellationZones.length){
    const LEGACY='bradavice_constellations_v1';
    try{localStorage.removeItem(LEGACY)}catch{}
    let found={};
    const counter=document.getElementById('constellationCount'),replay=document.getElementById('astronomyReplay');
    const renderConstellations=()=>{
      constellationZones.forEach(z=>z.classList.toggle('found',Boolean(found[z.dataset.constellation])));
      const n=constellationZones.filter(z=>found[z.dataset.constellation]).length;
      if(counter)counter.textContent=`${n} / 3`;
      if(n===3){
        // Nález třetího obrazce už úkol automaticky NEODEVZDÁ. Student se musí vrátit k profesorovi.
        try{const k=A?.scopedKey?.('bradavice_astronomy_task_v42')||'bradavice_astronomy_task_v42';localStorage.setItem(k,'ready');localStorage.setItem('bradavice_astronomy_task_v42','ready')}catch{}
        document.getElementById('astronomyQuest')?.classList.add('astronomy-ready-to-hand-in');
        A?.toast?.('Všechna tři souhvězdí nalezena. Vrať se k profesorovi a úkol odevzdej.');
        if(replay)replay.hidden=true;
      }
    };
    const resetConstellations=()=>{found={};constellationZones.forEach(z=>z.classList.remove('found'));document.getElementById('astronomyQuest')?.classList.remove('quest-complete');if(counter)counter.textContent='0 / 3';if(replay)replay.hidden=true};
    constellationZones.forEach(z=>z.addEventListener('click',e=>{e.stopPropagation();const id=z.dataset.constellation;if(found[id])return;let accepted=false;try{const qk=A?.scopedKey?.(A?.keys?.QUEST_KEY||'bradavice_quests_v1')||'bradavice_quests_v1',ak=A?.scopedKey?.('bradavice_astronomy_task_v42')||'bradavice_astronomy_task_v42',q=JSON.parse(localStorage.getItem(qk)||'{}');accepted=['accepted','ready','done'].includes(localStorage.getItem(ak))||q?.['find-three-constellations']===true||q?.['find-three-constellations']?.done===true}catch{}if(!accepted){A?.toast?.('Nejdřív si promluv s profesorem astronomie.');return}found[id]=true;z.classList.add('found');renderConstellations()}));
    replay?.addEventListener('click',resetConstellations);
    resetConstellations();
    document.getElementById('astronomySky')?.addEventListener('click',e=>{const spark=document.createElement('i');spark.className='sky-spark';spark.style.left=`${e.clientX}px`;spark.style.top=`${e.clientY}px`;document.body.appendChild(spark);setTimeout(()=>spark.remove(),650)});
  }

  // Zapovězený les — oči mezi stromy při kliknutí zmizí a objeví se jinde.
  document.querySelectorAll('.forest-eyes').forEach(eyes=>eyes.addEventListener('click',()=>{
    eyes.classList.add('vanish');setTimeout(()=>{eyes.style.left=`${12+Math.random()*72}%`;eyes.style.top=`${18+Math.random()*48}%`;eyes.classList.remove('vanish')},900)
  }));

  // Komnata nejvyšší potřeby už není na mapě; náhodný student ji může objevit ve staré galerii.
  const secretWall=document.getElementById('secretWallTrigger'),secretDoor=document.getElementById('secretRoomDoor');
  if(secretWall&&secretDoor){let taps=0;secretWall.addEventListener('click',()=>{taps++;secretWall.classList.add('touched');setTimeout(()=>secretWall.classList.remove('touched'),350);if(taps>=3){secretDoor.classList.add('visible');A?.award('tajemstvi-hradu',{silent:true})}})}


  // v24 — občasná zlatonka v hradních chodbách. Je čistě interaktivní, body nedává.
  const corridorStage=document.querySelector('.corridor-stage');
  if(corridorStage && Math.random()<0.42){
    const snitch=document.createElement('button');
    snitch.className='wandering-snitch';snitch.type='button';snitch.setAttribute('aria-label','Letící zlatonka');snitch.title='Chyť zlatonku';
    snitch.innerHTML='<img src="img/zlatonka.webp" alt="">';
    corridorStage.appendChild(snitch);
    snitch.addEventListener('click',()=>{snitch.classList.remove('dart');void snitch.offsetWidth;snitch.classList.add('dart');setTimeout(()=>snitch.remove(),800)});
  }


  // v25 — interaktivita je navázaná na prvky, které už jsou namalované přímo v pozadí.
  const pulse=(el,cls='activated',ms=720)=>{if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),ms)};

  const sceneToast=(message)=>{if(!message)return;let box=document.querySelector('.scene-toast');if(!box){box=document.createElement('div');box.className='scene-toast';document.body.appendChild(box)}box.textContent=message;box.classList.remove('show');void box.offsetWidth;box.classList.add('show');clearTimeout(sceneToast.timer);sceneToast.timer=setTimeout(()=>box.classList.remove('show'),2600)};

  document.querySelectorAll('.embedded-hotspot,[data-interaction]').forEach(el=>el.addEventListener('click',e=>{
    const kind=el.dataset.interaction;
    if(kind==='armor'){el.animate([{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],{duration:420});}
    if(kind==='globe'){el.animate([{transform:'rotate(0deg)'},{transform:'rotate(2deg)'},{transform:'rotate(0deg)'}],{duration:620});}
    if(el.dataset.message)sceneToast(el.dataset.message);
  }));

  document.querySelectorAll('.scene-prop').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    const action=el.dataset.propAction||'nudge',cls=`react-${action}`;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),900);
    sceneToast(el.dataset.message||'Předmět na okamžik zareagoval na dotyk.');
    if(el.classList.contains('prop-greenhouse-plant'))A?.award('sklenikovy-znalec',{silent:true});if(el.classList.contains('prop-hagrid-egg'))A?.award('tajemstvi-hradu',{silent:true});
  }));

  document.querySelectorAll('[data-forest]').forEach(el=>el.addEventListener('click',()=>{
    pulse(el);document.querySelector('.forbidden-forest')?.classList.add('rune-awake');
    setTimeout(()=>document.querySelector('.forbidden-forest')?.classList.remove('rune-awake'),1200);
    A?.award('tajemstvi-hradu',{silent:true});
  }));

  const shell=document.querySelector('.lake-shell-hotspot');
  if(shell)shell.addEventListener('click',()=>{pulse(shell,'awake',1100);A?.award('tajemstvi-hradu',{silent:true});A?.award('jezerni-badatel')});

  const hagridDoor=document.getElementById('hagridDoor');
  if(hagridDoor){
    const enter=()=>{hagridDoor.classList.add('knock');setTimeout(()=>{location.href='hagriduv-dum-uvnitr.html'},260)};
    hagridDoor.addEventListener('dblclick',e=>{e.preventDefault();enter()});
    hagridDoor.addEventListener('click',()=>{pulse(hagridDoor,'knock',430);enter()});
  }

  const egg=document.getElementById('hagridEgg');
  if(egg)egg.addEventListener('click',()=>{pulse(egg,'awake',1100);A?.award('tajemstvi-hradu',{silent:true})});

  const willowHot=document.getElementById('willowTree');
  if(willowHot)willowHot.addEventListener('click',()=>{
    const scene=document.getElementById('willowScene');scene?.classList.remove('willow-shake');void scene?.offsetWidth;scene?.classList.add('willow-shake');
    const b=willowHot.getBoundingClientRect();
    for(let i=0;i<12;i++){const l=document.createElement('i');l.className='fall-leaf-v25';l.style.left=`${b.left+b.width*(.2+Math.random()*.6)}px`;l.style.top=`${b.top+b.height*(.15+Math.random()*.35)}px`;l.style.setProperty('--dx',`${-80+Math.random()*160}px`);l.style.setProperty('--rot',`${180+Math.random()*500}deg`);document.body.appendChild(l);setTimeout(()=>l.remove(),1800)}
  });

  const greenhouseTouched=new Set();
  document.querySelectorAll('.plant-hotspot').forEach((el,i)=>el.addEventListener('click',()=>{
    greenhouseTouched.add(`hot-${i}`);el.animate([{transform:'rotate(0deg)'},{transform:'rotate(-2deg)'},{transform:'rotate(2deg)'},{transform:'rotate(0deg)'}],{duration:520});
    if(greenhouseTouched.size>=3)A?.award('sklenikovy-znalec',{silent:true});
  }));

  const secretChamberTrigger=document.getElementById('secretChamberTrigger');
  if(secretChamberTrigger)secretChamberTrigger.addEventListener('click',()=>{
    pulse(secretChamberTrigger);A?.award('tajemstvi-hradu',{silent:true});
    setTimeout(()=>{location.href='tajemna-cesta.html'},520);
  });

  const secretSeal=document.getElementById('secretSeal');
  if(secretSeal)secretSeal.addEventListener('click',()=>{
    pulse(secretSeal);document.getElementById('secretRouteScene')?.classList.add('unsealed');A?.award('tajemstvi-hradu',{silent:true});
  });

  const chamberFloor=document.getElementById('chamberFloorSeal');
  if(chamberFloor)chamberFloor.addEventListener('click',()=>{
    pulse(chamberFloor);document.getElementById('secretChamberScene')?.classList.remove('awake');void document.getElementById('secretChamberScene')?.offsetWidth;document.getElementById('secretChamberScene')?.classList.add('awake');A?.award('tajemstvi-hradu',{silent:true});
  });


})();

// v39 — sedmé patro: dveře se objeví samy až po chvíli ticha.
(()=>{
  const scene=document.getElementById('requirementScene'),door=document.getElementById('requireDoorLink'),whisper=document.getElementById('requireWhisper');
  if(!scene||!door)return;
  let revealed=false;
  const reveal=()=>{
    if(revealed)return; revealed=true;
    scene.classList.add('ready'); door.setAttribute('aria-hidden','false');
    sessionStorage.setItem('bradavice_requirement_gate','open');
    if(whisper)whisper.textContent='Ve zdi se tiše objevily dveře…';
    window.BradaviceAchievements?.award?.('mistnost-se-ukazala',{silent:true});
    window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true});
  };
  window.setTimeout(reveal,4800);
})();
