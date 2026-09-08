(()=>{
  const DB=window.BradaviceDB,A=window.BradaviceAchievements;
  const QUEST_KEY='bradavice_quests_v1';
  const plantDefs={
    salvej:{name:'Šalvěj',img:'img/plant-salvej-v423.webp',page:'pozemky.html',cls:'plant-salvej'},
    kopriva:{name:'Kopřiva',img:'img/plant-kopriva-v423.webp',page:'jezero.html',cls:'plant-kopriva'},
    jmeli:{name:'Jmelí',img:'img/plant-jmeli-v423.webp',page:'hagriduv-dum.html',cls:'plant-jmeli'},
    houby:{name:'Houby',img:'img/plant-houby-v423.webp',page:'famfrpal.html',cls:'plant-houby'},
    brectan:{name:'Břečťan',img:'img/plant-brectan-v423.webp',page:'vrba-mlaticka.html',cls:'plant-brectan'}
  };
  const ids=Object.keys(plantDefs);
  const qid={accept:'prytova-herbar-accepted',done:'prytova-herbar',mandAccept:'prytova-mandragory-accepted',mandDone:'prytova-mandragory'};
  const plantQ=id=>`prytova-plant-${id}`;
  const read=()=>{try{return JSON.parse(localStorage.getItem(QUEST_KEY)||'{}')||{}}catch{return{}}};
  const write=q=>{try{localStorage.setItem(QUEST_KEY,JSON.stringify(q))}catch{}};
  const done=(q,id)=>q?.[id]===true||q?.[id]?.done===true;
  const setLocal=id=>{const q=read();q[id]={done:true,at:new Date().toISOString()};write(q);return q};
  const completeRemote=async id=>{try{if(DB?.client&&DB?.completeQuest)await DB.completeQuest(id)}catch(e){console.warn('Prýtová – uložení stavu do Supabase selhalo:',id,e)}};
  const toast=msg=>{if(A?.toast){A.toast(msg);return}let b=document.querySelector('.herb-v435-toast');if(!b){b=document.createElement('div');b.className='herb-v435-toast';document.body.appendChild(b)}b.textContent=msg;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('show'),2400)};
  const page=location.pathname.split('/').pop()||'';

  async function syncBeforeRender(){
    try{if(DB?.client&&DB?.hydrateProgress)await DB.hydrateProgress()}catch(e){console.warn('Prýtová – načtení postupu selhalo:',e)}
  }

  function herbAccepted(){return done(read(),qid.accept)}
  function herbDone(){return done(read(),qid.done)}
  function mandAccepted(){return done(read(),qid.mandAccept)}
  function mandDone(){return done(read(),qid.mandDone)}
  function found(id){return done(read(),plantQ(id))}
  function foundCount(){return ids.filter(found).length}

  function mountPlants(){
    const entries=ids.filter(id=>plantDefs[id].page===page);if(!entries.length)return;
    const host=document.querySelector('main')||document.body;
    for(const id of entries){
      const d=plantDefs[id];
      if(document.querySelector(`[data-herb-plant="${id}"]`))continue;
      const b=document.createElement('button');b.type='button';b.className=`herb-specimen ${d.cls}`;b.dataset.herbPlant=id;b.setAttribute('aria-label',`Rostlina: ${d.name}`);b.title=d.name;
      b.innerHTML=`<img src="${d.img}" alt="${d.name}">`;
      if(!herbAccepted())b.classList.add('v435-locked');
      if(found(id)){b.classList.add('v435-collected');b.hidden=true}
      b.addEventListener('click',async e=>{
        e.stopPropagation();
        if(!herbAccepted()){toast('Nejdřív přijmi úkol Herbář u profesorky Prýtové.');b.classList.add('hint-pulse');setTimeout(()=>b.classList.remove('hint-pulse'),500);return}
        if(found(id)){toast(`${d.name} už v herbáři máš.`);return}
        b.disabled=true;b.classList.add('herb-found');setLocal(plantQ(id));await completeRemote(plantQ(id));
        const n=foundCount();toast(`${d.name} přidána do herbáře · ${n} / 5`);setTimeout(()=>{b.hidden=true},620);
      });
      host.appendChild(b);
    }
  }

  function initGreenhouse(){
    const teacher=document.getElementById('prytovaTeacher'),modal=document.getElementById('herbQuestModal');if(!teacher||!modal)return;
    const close=document.getElementById('herbQuestClose'),herbDialog=document.getElementById('herbQuestDialog'),progress=document.getElementById('herbProgress'),herbAction=document.getElementById('herbMainAction');
    const mandDialog=document.getElementById('mandrakeQuestDialog'),trans=document.getElementById('herbTransplant'),start=document.getElementById('transplantStart'),count=document.getElementById('transplantCount'),timer=document.getElementById('transplantTimer'),source=document.getElementById('mandrakeSource'),pot=document.getElementById('mandrakePot'),inPot=document.getElementById('mandrakeInPot'),soil=document.getElementById('mandrakeSoil'),cover=document.getElementById('transplantCover'),instruction=document.getElementById('transplantInstruction'),status=document.getElementById('transplantStatus'),workbench=document.getElementById('mandrakeWorkbench');
    let running=false,phase='idle',score=0,left=60,tick=null,finishing=false;
    let mandAccept=document.getElementById('mandrakeAccept');
    if(!mandAccept){mandAccept=document.createElement('button');mandAccept.id='mandrakeAccept';mandAccept.type='button';mandAccept.className='herb-action mandrake-accept';mandAccept.textContent='Přijmout úkol Mandragory';trans.parentElement.insertBefore(mandAccept,trans)}

    const open=()=>{modal.hidden=false;render()};const shut=()=>{modal.hidden=true};teacher.addEventListener('click',open);close?.addEventListener('click',shut);modal.addEventListener('click',e=>{if(e.target===modal)shut()});

    function renderProgress(){
      progress.innerHTML=ids.map(id=>`<div class="${found(id)?'done':''}"><strong>${plantDefs[id].name}</strong><span>${found(id)?'nalezeno':'čeká'}</span></div>`).join('');
    }
    function resetMand(){phase='idle';workbench?.classList.remove('picked','potted','covered');if(source)source.hidden=false;if(inPot)inPot.hidden=true;if(soil)soil.classList.remove('show');if(cover)cover.disabled=true;if(instruction)instruction.textContent=running?'Vezmi další mandragoru a vlož ji do prázdného květináče.':'Po spuštění vezmi mandragoru a vlož ji do prázdného květináče.';if(status&&!running)status.textContent='Máš přesně 60 sekund. Přesaď jich co nejvíc.'}
    function render(){
      renderProgress();const n=foundCount();
      if(herbDone()){herbDialog.innerHTML='<strong>Herbář je odevzdaný.</strong> Všech pět vzorků má profesorka Prýtová zapsaných.';herbAction.hidden=true}
      else if(!herbAccepted()){herbDialog.textContent='Najdi pět různých rostlin po školních pozemcích. Rostliny jsou na místech vidět už teď, ale sbírat je můžeš až po přijetí úkolu.';herbAction.hidden=false;herbAction.textContent='Přijmout úkol Herbář';herbAction.disabled=false}
      else if(n<5){herbDialog.textContent=`Herbář: ${n} / 5. Hledej na pozemcích, u jezera, Hagridova domu, famfrpálového hřiště a Vrby mlátičky.`;herbAction.hidden=true}
      else{herbDialog.textContent='Máš všech 5 vzorků. Odevzdej Herbář profesorce Prýtové.';herbAction.hidden=false;herbAction.textContent='Odevzdat Herbář';herbAction.disabled=false}

      if(mandDone()){mandDialog.innerHTML='<strong>Mandragorový úkol je splněný.</strong> Výsledek je uložený.';mandAccept.hidden=true;trans.hidden=true}
      else if(!mandAccepted()){mandDialog.textContent='Samostatný úkol: přijmi výzvu a potom máš 60 sekund na co nejvíc správně přesazených mandragor.';mandAccept.hidden=false;trans.hidden=true}
      else{mandDialog.textContent='Máš 60 sekund. Mandragora → květináč → Přikrýt hlínou. Pro splnění potřebuješ alespoň 5.';mandAccept.hidden=true;trans.hidden=false;if(!running)resetMand()}
    }

    herbAction?.addEventListener('click',async()=>{
      herbAction.disabled=true;
      if(!herbAccepted()){setLocal(qid.accept);await completeRemote(qid.accept);toast('Úkol Herbář přijat. Rostliny teď můžeš sbírat.');render();return}
      if(foundCount()===5&&!herbDone()){setLocal(qid.done);await completeRemote(qid.done);toast('Herbář odevzdán.');render();return}
      render();
    });
    mandAccept?.addEventListener('click',async()=>{mandAccept.disabled=true;setLocal(qid.mandAccept);await completeRemote(qid.mandAccept);toast('Mandragorový úkol přijat.');render()});

    function stopTimer(){running=false;clearInterval(tick);tick=null;start.disabled=false;start.textContent='Zkusit znovu'}
    function tickTimer(){left--;timer.textContent=`${left} s`;if(left<=0)finishMinute()}
    function begin(){if(running||mandDone()||!mandAccepted())return;score=0;left=60;finishing=false;count.textContent='0';timer.textContent='60 s';running=true;start.disabled=true;start.textContent='Čas běží…';resetMand();tick=setInterval(tickTimer,1000);status.textContent='Čas běží.'}
    async function finishMinute(){if(!running||finishing)return;finishing=true;stopTimer();instruction.textContent='Čas vypršel.';if(score<5){status.textContent=`Stihl/a jsi ${score}. Pro splnění je potřeba alespoň 5. Zkus to znovu.`;finishing=false;return}setLocal(qid.mandDone);await completeRemote(qid.mandDone);status.textContent=`Hotovo · ${score} mandragor za minutu. Výsledek je uložený.`;toast('Mandragorový úkol splněn.');setTimeout(render,500)}
    function pick(){if(!running||phase!=='idle')return;phase='picked';workbench.classList.add('picked');instruction.textContent='Mandragoru držíš. Klikni na květináč.';status.textContent='Opatrně — mandragora se vzpírá.'}
    function put(){if(!running)return;if(phase==='idle'){status.textContent='Nejdřív vezmi mandragoru.';return}if(phase!=='picked')return;phase='potted';workbench.classList.remove('picked');workbench.classList.add('potted');source.hidden=true;inPot.hidden=false;cover.disabled=false;instruction.textContent='Mandragora je v květináči. Přikryj kořeny hlínou.'}
    function coverSoil(){if(!running||phase!=='potted')return;phase='covered';cover.disabled=true;soil.classList.add('show');score++;count.textContent=String(score);status.textContent='Správně. Připravuji další mandragoru…';setTimeout(()=>{soil.classList.remove('show');resetMand()},380)}
    start?.addEventListener('click',begin);source?.addEventListener('click',pick);pot?.addEventListener('click',put);cover?.addEventListener('click',coverSoil);
    source?.addEventListener('dragstart',e=>{if(!running){e.preventDefault();return}pick();e.dataTransfer?.setData('text/plain','mandrake')});pot?.addEventListener('dragover',e=>{if(running){e.preventDefault();pot.classList.add('drag-over')}});pot?.addEventListener('dragleave',()=>pot.classList.remove('drag-over'));pot?.addEventListener('drop',e=>{e.preventDefault();pot.classList.remove('drag-over');put()});
    render();
  }

  (async()=>{await syncBeforeRender();mountPlants();initGreenhouse();window.addEventListener('bradavice:progress-synced',()=>{mountPlants();if(page==='skleniky.html')initGreenhouse()})})();
})();
