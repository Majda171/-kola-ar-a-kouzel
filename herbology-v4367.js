(()=>{
  const DB=window.BradaviceDB,A=window.BradaviceAchievements;
  const STUDENT_KEY='bradavice_student_v1';
  const QUEST_KEY='bradavice_quests_v1';
  const HERB_PREFIX='bradavice_herbology_v4367';
  const OWNER_KEY='bradavice_herbology_owner_v4367';
  const plantDefs={
    salvej:{name:'Šalvěj',img:'img/plant-salvej-v423.webp',page:'nadvori.html',cls:'plant-salvej'},
    kopriva:{name:'Kopřiva',img:'img/plant-kopriva-v423.webp',page:'jezero.html',cls:'plant-kopriva'},
    jmeli:{name:'Jmelí',img:'img/plant-jmeli-v423.webp',page:'hagriduv-dum.html',cls:'plant-jmeli'},
    houby:{name:'Houby',img:'img/plant-houby-v423.webp',page:'zapovezeny-les.html',cls:'plant-houby'},
    brectan:{name:'Břečťan',img:'img/plant-brectan-v423.webp',page:'vrba-mlaticka.html',cls:'plant-brectan'}
  };
  const ids=Object.keys(plantDefs);
  const qid={accept:'prytova-herbar-accepted',done:'prytova-herbar',mandAccept:'prytova-mandragory-accepted',mandDone:'prytova-mandragory'};
  const plantQ=id=>`prytova-plant-${id}`;
  const clean=v=>String(v||'').trim().replace(/[^a-zA-Z0-9@._-]/g,'_');
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const student=()=>read(STUDENT_KEY,null);
  function aliases(){const s=student();return [...new Set([s?.supabaseUserId,s?.email].map(clean).filter(Boolean))]}
  function primary(){return aliases()[0]||'guest'}
  const herbKey=id=>`${HERB_PREFIX}_${id}`;
  const questKey=id=>`${QUEST_KEY}_${id}`;
  const blank=()=>({accepted:false,done:false,mandAccepted:false,mandDone:false,found:{},updatedAt:null});
  const isDone=v=>v===true||v?.done===true;

  function mergeState(){
    const out=blank(),a=aliases();
    for(const id of a){const x=read(herbKey(id),null);if(!x)continue;out.accepted ||= !!x.accepted;out.done ||= !!x.done;out.mandAccepted ||= !!x.mandAccepted;out.mandDone ||= !!x.mandDone;for(const p of ids)out.found[p] ||= !!x.found?.[p]}
    // Legacy migration is allowed only when the legacy value belonged to the same current student.
    const owner=localStorage.getItem(OWNER_KEY)||'';
    if(a.length&&owner&&a.includes(owner)){
      for(const legacy of ['bradavice_herbology_v4362','bradavice_herbology_v4354']){
        const x=read(`${legacy}_${primary()}`,null);if(!x)continue;out.accepted ||= !!x.accepted;out.done ||= !!x.done;out.mandAccepted ||= !!x.mandAccepted;out.mandDone ||= !!x.mandDone;for(const p of ids)out.found[p] ||= !!x.found?.[p]
      }
    }
    return out;
  }
  function saveState(s){
    s={...blank(),...s,found:{...(s?.found||{})},updatedAt:new Date().toISOString()};
    const a=aliases();if(a.length){for(const id of a)write(herbKey(id),s);localStorage.setItem(OWNER_KEY,a[0])}else write(herbKey('guest'),s);
    return s;
  }
  function mergeQuests(){
    const q={},a=aliases();
    for(const id of a)Object.assign(q,read(questKey(id),{})||{});
    // Generic cache is used only if explicitly owned by this student through achievements aliasing.
    if(!a.length)Object.assign(q,read(QUEST_KEY,{})||{});
    return q;
  }
  function saveQuest(id){
    const q=mergeQuests();q[id]={done:true,at:new Date().toISOString()};
    const a=aliases();if(a.length)for(const sid of a)write(questKey(sid),q);else write(QUEST_KEY,q);
    return q;
  }
  function reconcilePositive(){
    const q=mergeQuests(),s=mergeState();
    const qFound=Object.fromEntries(ids.map(id=>[id,isDone(q[plantQ(id)])]));
    if(isDone(q[qid.accept])||isDone(q[qid.done])||ids.some(id=>qFound[id]))s.accepted=true;
    if(isDone(q[qid.done]))s.done=true;
    if(isDone(q[qid.mandAccept])||isDone(q[qid.mandDone]))s.mandAccepted=true;
    if(isDone(q[qid.mandDone]))s.mandDone=true;
    for(const id of ids)if(qFound[id])s.found[id]=true;
    return saveState(s);
  }
  const state=()=>reconcilePositive();
  const accepted=()=>state().accepted,finished=()=>state().done,mandAccepted=()=>state().mandAccepted,mandFinished=()=>state().mandDone;
  const found=id=>!!state().found[id];
  const foundCount=()=>ids.filter(id=>found(id)).length;
  function setFlag(flag,questId){const s=mergeState();s[flag]=true;saveState(s);saveQuest(questId)}
  function setFound(id){const s=mergeState();s.accepted=true;s.found[id]=true;saveState(s);saveQuest(plantQ(id))}

  const toast=msg=>{if(A?.toast){A.toast(msg);return}let b=document.querySelector('.herb-v435-toast');if(!b){b=document.createElement('div');b.className='herb-v435-toast';document.body.appendChild(b)}b.textContent=msg;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('show'),2400)};
  async function remote(id){
    try{if(DB?.client&&DB?.completeQuest)await DB.completeQuest(id)}catch(e){console.warn('Prýtová – uložení do Supabase selhalo:',id,e)}
    finally{reconcilePositive();refreshMountedPlants();document.getElementById('herbQuestModal')?._herbRender?.()}
  }
  async function hydratePositive(){
    try{if(DB?.client&&DB?.hydrateStudent)await DB.hydrateStudent();if(DB?.client&&DB?.hydrateProgress)await DB.hydrateProgress()}catch(e){console.warn('Prýtová – načtení postupu selhalo:',e)}
    reconcilePositive();
  }

  const page=location.pathname.split('/').pop()||'';
  function refreshPlantButton(b,id){const s=state(),isFound=!!s.found[id];b.classList.toggle('v435-locked',!s.accepted);b.classList.toggle('v435-collected',isFound);b.hidden=false;b.disabled=false;b.setAttribute('aria-pressed',isFound?'true':'false')}
  function mountPlants(){
    const entries=ids.filter(id=>plantDefs[id].page===page);if(!entries.length)return;
    const host=document.querySelector('main')||document.body;
    for(const id of entries){
      const d=plantDefs[id];let b=document.querySelector(`[data-herb-plant="${id}"]`);
      if(!b){b=document.createElement('button');b.type='button';b.className=`herb-specimen ${d.cls}`;b.dataset.herbPlant=id;b.setAttribute('aria-label',`Rostlina: ${d.name}`);b.title=d.name;b.innerHTML=`<img src="${d.img}" alt="${d.name}">`;
        b.addEventListener('click',e=>{e.stopPropagation();const s=state();if(!s.accepted){toast('Nejdřív přijmi Herbář u profesorky Prýtové.');b.classList.add('hint-pulse');setTimeout(()=>b.classList.remove('hint-pulse'),500);return}if(s.found[id]){toast(`${d.name} už v herbáři máš.`);return}setFound(id);refreshPlantButton(b,id);toast(`${d.name} přidána do herbáře · ${foundCount()} / 5`);remote(plantQ(id))});host.appendChild(b)}
      refreshPlantButton(b,id);
    }
  }
  function refreshMountedPlants(){document.querySelectorAll('[data-herb-plant]').forEach(b=>refreshPlantButton(b,b.dataset.herbPlant))}

  function initGreenhouse(){
    const teacher=document.getElementById('prytovaTeacher'),modal=document.getElementById('herbQuestModal');if(!teacher||!modal)return;
    if(modal.dataset.herbInit==='1'){modal._herbRender?.();return}modal.dataset.herbInit='1';
    const close=document.getElementById('herbQuestClose'),herbDialog=document.getElementById('herbQuestDialog'),progress=document.getElementById('herbProgress'),herbAction=document.getElementById('herbMainAction');
    const mandDialog=document.getElementById('mandrakeQuestDialog'),trans=document.getElementById('herbTransplant'),start=document.getElementById('transplantStart'),count=document.getElementById('transplantCount'),timer=document.getElementById('transplantTimer'),source=document.getElementById('mandrakeSource'),pot=document.getElementById('mandrakePot'),inPot=document.getElementById('mandrakeInPot'),soil=document.getElementById('mandrakeSoil'),cover=document.getElementById('transplantCover'),instruction=document.getElementById('transplantInstruction'),status=document.getElementById('transplantStatus'),workbench=document.getElementById('mandrakeWorkbench');
    let running=false,phase='idle',score=0,left=60,tick=null,finishing=false;
    let mandAccept=document.getElementById('mandrakeAccept');if(!mandAccept){mandAccept=document.createElement('button');mandAccept.id='mandrakeAccept';mandAccept.type='button';mandAccept.className='herb-action mandrake-accept';mandAccept.textContent='Přijmout úkol Mandragory';trans.parentElement.insertBefore(mandAccept,trans)}
    const open=()=>{modal.hidden=false;render()},shut=()=>{modal.hidden=true};teacher.addEventListener('click',open);close?.addEventListener('click',shut);modal.addEventListener('click',e=>{if(e.target===modal)shut()});
    function renderProgress(){const s=state();progress.innerHTML=ids.map(id=>`<div class="${s.found[id]?'done':''}"><strong>${plantDefs[id].name}</strong><span>${s.found[id]?'nalezeno':'čeká'}</span></div>`).join('')}
    function resetMand(){phase='idle';workbench?.classList.remove('picked','potted','covered');if(source)source.hidden=false;if(inPot)inPot.hidden=true;if(soil)soil.classList.remove('show');if(cover)cover.disabled=true;if(instruction)instruction.textContent=running?'Vezmi další mandragoru a vlož ji do prázdného květináče.':'Po spuštění vezmi mandragoru a vlož ji do prázdného květináče.';if(status&&!running)status.textContent='Máš přesně 60 sekund. Přesaď jich co nejvíc.'}
    function render(){
      const s=state();renderProgress();const n=ids.filter(id=>s.found[id]).length;
      if(s.done){A?.award?.('herbarnik',{silent:true});herbDialog.innerHTML='<strong>Herbář je odevzdaný.</strong> Všech pět vzorků má profesorka Prýtová zapsaných.';herbAction.hidden=true}
      else if(!s.accepted){herbDialog.textContent='Najdi pět různých rostlin na školních pozemcích. Sbírat je můžeš po přijetí Herbáře.';herbAction.hidden=false;herbAction.textContent='Přijmout úkol Herbář';herbAction.disabled=false}
      else if(n<5){herbDialog.textContent=`Herbář: ${n} / 5. Hledej zbývající rostliny na školních pozemcích.`;herbAction.hidden=true}
      else{herbDialog.textContent='Máš všech 5 vzorků. Odevzdej Herbář profesorce Prýtové.';herbAction.hidden=false;herbAction.textContent='Odevzdat Herbář';herbAction.disabled=false}
      if(s.mandDone){A?.award?.('mandragorovy-pestitel',{silent:true});mandDialog.innerHTML='<strong>Mandragorový úkol je splněný.</strong> Profesorka Prýtová má výsledek zapsaný.';mandAccept.hidden=true;trans.hidden=true}
      else if(!s.mandAccepted){mandDialog.textContent='Přijmi výzvu a potom máš 60 sekund na co nejvíc správně přesazených mandragor.';mandAccept.hidden=false;mandAccept.disabled=false;trans.hidden=true}
      else{mandDialog.textContent='Máš 60 sekund. Mandragora → květináč → přikrýt hlínou. Pro splnění potřebuješ alespoň 5.';mandAccept.hidden=true;trans.hidden=false;if(!running)resetMand()}
    }
    modal._herbRender=render;
    herbAction?.addEventListener('click',()=>{herbAction.disabled=true;const s=state();if(!s.accepted){setFlag('accepted',qid.accept);render();toast('Herbář přijat. Rostliny teď můžeš sbírat.');remote(qid.accept);return}if(foundCount()===5&&!s.done){setFlag('done',qid.done);A?.award?.('herbarnik');render();toast('Herbář odevzdán.');remote(qid.done);return}render()});
    mandAccept?.addEventListener('click',()=>{mandAccept.disabled=true;setFlag('mandAccepted',qid.mandAccept);render();toast('Úkol s mandragorami přijat.');remote(qid.mandAccept)});
    function stopTimer(){running=false;clearInterval(tick);tick=null;start.disabled=false;start.textContent='Zkusit znovu'}
    function finishMinute(){if(!running||finishing)return;finishing=true;stopTimer();instruction.textContent='Čas vypršel.';if(score<5){status.textContent=`Stihl/a jsi ${score}. Pro splnění je potřeba alespoň 5. Zkus to znovu.`;finishing=false;return}setFlag('mandDone',qid.mandDone);A?.award?.('mandragorovy-pestitel');status.textContent=`Hotovo · ${score} mandragor za minutu.`;toast('Úkol s mandragorami splněn.');remote(qid.mandDone);setTimeout(render,500)}
    function begin(){if(running||mandFinished()||!mandAccepted())return;score=0;left=60;finishing=false;count.textContent='0';timer.textContent='60 s';running=true;start.disabled=true;start.textContent='Čas běží…';resetMand();tick=setInterval(()=>{left--;timer.textContent=`${left} s`;if(left<=0)finishMinute()},1000);status.textContent='Čas běží.'}
    function pick(){if(!running||phase!=='idle')return;phase='picked';workbench.classList.add('picked');instruction.textContent='Mandragoru držíš. Klikni na květináč.';status.textContent='Opatrně — mandragora se vzpírá.'}
    function put(){if(!running)return;if(phase==='idle'){status.textContent='Nejdřív vezmi mandragoru.';return}if(phase!=='picked')return;phase='potted';workbench.classList.remove('picked');workbench.classList.add('potted');source.hidden=true;inPot.hidden=false;cover.disabled=false;instruction.textContent='Mandragora je v květináči. Přikryj kořeny hlínou.'}
    function coverSoil(){if(!running||phase!=='potted')return;phase='covered';cover.disabled=true;soil.classList.add('show');score++;count.textContent=String(score);status.textContent='Správně. Připravuji další mandragoru…';setTimeout(()=>{soil.classList.remove('show');resetMand()},380)}
    start?.addEventListener('click',begin);source?.addEventListener('click',pick);pot?.addEventListener('click',put);cover?.addEventListener('click',coverSoil);
    source?.addEventListener('dragstart',e=>{if(!running){e.preventDefault();return}pick();e.dataTransfer?.setData('text/plain','mandrake')});pot?.addEventListener('dragover',e=>{if(running){e.preventDefault();pot.classList.add('drag-over')}});pot?.addEventListener('dragleave',()=>pot.classList.remove('drag-over'));pot?.addEventListener('drop',e=>{e.preventDefault();pot.classList.remove('drag-over');put()});
    render();
  }

  (async()=>{await hydratePositive();mountPlants();initGreenhouse();window.addEventListener('bradavice:progress-synced',()=>{reconcilePositive();refreshMountedPlants();document.getElementById('herbQuestModal')?._herbRender?.()})})();
})();
