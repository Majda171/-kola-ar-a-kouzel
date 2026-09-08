(()=>{
  const KEY='bradavice_herbarium_v433',A=window.BradaviceAchievements,DB=window.BradaviceDB;
  const plantDefs={
    jmeli:{name:'Jmelí',src:'img/plant-jmeli-v423.webp'},salvej:{name:'Šalvěj',src:'img/plant-salvej-v423.webp'},kopriva:{name:'Kopřiva',src:'img/plant-kopriva-v423.webp'},brectan:{name:'Břečťan',src:'img/plant-brectan-v423.webp'},houby:{name:'Houby',src:'img/plant-houby-v423.webp'}
  };
  const blank=()=>({accepted:false,found:{jmeli:false,salvej:false,kopriva:false,brectan:false,houby:false},done:false,reward:0,best:0});
  function migrate(){
    try{
      if(localStorage.getItem(KEY))return;
      const fresh=blank();
      for(const oldKey of ['bradavice_herbarium_v431','bradavice_herbarium_v42']){
        const old=JSON.parse(localStorage.getItem(oldKey)||'{}')||{};
        if(old.accepted||old.done)fresh.accepted=true;
      }
      localStorage.setItem(KEY,JSON.stringify(fresh));
    }catch{}
  }
  migrate();
  const load=()=>{try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}')||{};return{...blank(),...raw,found:{...blank().found,...(raw.found||{})}}}catch{return blank()}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));let state=load();
  function toast(text){let t=document.querySelector('.herb-toast');if(!t){t=document.createElement('div');t.className='herb-toast';document.body.appendChild(t)}t.textContent=text;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600)}
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  const placements={
    'pozemky.html':[{id:'salvej',cls:'plant-salvej'}],
    'jezero.html':[{id:'kopriva',cls:'plant-kopriva'}],
    'hagriduv-dum.html':[{id:'jmeli',cls:'plant-jmeli'}],
    'famfrpal.html':[{id:'houby',cls:'plant-houby'}],
    'vrba-mlaticka.html':[{id:'brectan',cls:'plant-brectan'}]
  };
  function mountPlants(){
    const specs=placements[page]||[];if(!specs.length)return;
    const host=document.querySelector('.place-scene')||document.querySelector('.scene')||document.querySelector('main');if(!host)return;
    if(getComputedStyle(host).position==='static')host.style.position='relative';
    specs.forEach(spec=>{
      const def=plantDefs[spec.id],b=document.createElement('button');b.type='button';b.className=`herb-specimen ${spec.cls}`;b.dataset.herbId=spec.id;b.setAttribute('aria-label',`Rostlina pro profesorku Prýtovou: ${def.name}`);b.innerHTML=`<img src="${def.src}" alt="${def.name}">`;host.appendChild(b);
      const refresh=()=>{state=load();b.hidden=!state.accepted||state.done||Boolean(state.found[spec.id])};refresh();
      b.addEventListener('click',()=>{state=load();if(!state.accepted){toast('Nejdřív přijmi úkol od profesorky Prýtové ve skleníku.');return}if(state.found[spec.id])return;state.found[spec.id]=true;save(state);b.classList.add('herb-found');const n=Object.values(state.found).filter(Boolean).length;toast(n===5?'Pátý vzorek nalezen. Vrať se za profesorkou Prýtovou.':`Vzorek uložen · ${n} / 5`);setTimeout(refresh,650)});
      window.addEventListener('storage',refresh);
    })
  }
  mountPlants();

  const professor=document.getElementById('prytovaTeacher')||document.querySelector('.prytova-character'),modal=document.getElementById('herbQuestModal');if(!professor||!modal)return;
  const close=document.getElementById('herbQuestClose'),dialog=document.getElementById('herbQuestDialog'),progress=document.getElementById('herbProgress'),mainAction=document.getElementById('herbMainAction'),transplant=document.getElementById('herbTransplant'),transStatus=document.getElementById('transplantStatus'),instruction=document.getElementById('transplantInstruction'),countEl=document.getElementById('transplantCount'),timerEl=document.getElementById('transplantTimer'),startBtn=document.getElementById('transplantStart'),workbench=document.getElementById('mandrakeWorkbench'),source=document.getElementById('mandrakeSource'),pot=document.getElementById('mandrakePot'),inPot=document.getElementById('mandrakeInPot'),soil=document.getElementById('mandrakeSoil'),cover=document.getElementById('transplantCover');
  let phase='idle',transplanted=0,finishing=false,running=false,seconds=60,timer=null;
  const foundCount=()=>Object.values(state.found||{}).filter(Boolean).length;
  function renderProgress(){const order=['jmeli','salvej','kopriva','brectan','houby'];progress.innerHTML=order.map((id,i)=>`<div class="${state.found[id]?'done':''}"><strong>${state.found[id]?plantDefs[id].name:`Vzorek ${i+1}`}</strong><span>${state.found[id]?'nalezeno ✓':'nenalezeno'}</span></div>`).join('')}
  function resetMandrake(){phase='idle';workbench?.classList.remove('picked','potted','covered');if(source)source.hidden=false;if(inPot)inPot.hidden=true;if(cover)cover.disabled=true;if(instruction)instruction.textContent=running?'Vezmi další mandragoru a vlož ji do prázdného květináče.':'Po spuštění vezmi mandragoru a vlož ji do prázdného květináče.';if(transStatus)transStatus.textContent=running?'Čas běží. Každá správně zasazená mandragora se započítá.':'Máš přesně 60 sekund. Přesaď jich co nejvíc.'}
  function setTimer(){if(timerEl)timerEl.textContent=`${seconds} s`}
  function stopTimer(){clearInterval(timer);timer=null;running=false}
  function render(){state=load();renderProgress();if(state.done){dialog.innerHTML=`<strong>„Úkol splněn.“</strong> Herbář je kompletní. Za minutu jsi nejlépe přesadil/a ${state.best||0} mandragor a získal/a ${state.reward||0} bodů.`;mainAction.hidden=true;transplant.hidden=true;return}if(!state.accepted){dialog.textContent='„Přines mi pět různých rostlin ze školních pozemků. Ne ze skleníku a ne ze Zapovězeného lesa. Až je najdeš, vrať se ke mně.“';mainAction.hidden=false;mainAction.textContent='Přijmout úkol';transplant.hidden=true;return}const n=foundCount();if(n<5){dialog.textContent=`„Máš ${n} z 5 vzorků. Hledej na školních pozemcích — u jezera, Hagridova domu, Vrby, famfrpálového hřiště a na hlavních pozemcích.“`;mainAction.hidden=true;transplant.hidden=true;return}dialog.textContent='„Výborně. Herbář je kompletní. Teď máš jednu minutu. Přesaď tolik mandragor, kolik dokážeš: mandragora → květináč → přikrýt hlínou.“';mainAction.hidden=true;transplant.hidden=false;if(countEl)countEl.textContent=String(transplanted);setTimer();if(startBtn){startBtn.hidden=false;startBtn.disabled=running;startBtn.textContent=running?'Čas běží…':(transplanted?'Zkusit znovu':'Spustit 60 sekund')}resetMandrake()}
  mainAction.addEventListener('click',()=>{state=load();state.accepted=true;save(state);render();toast('Úkol přijat · 5 rostlin hledej po školních pozemcích')});

  function beginMinute(){if(running||finishing)return;transplanted=0;seconds=60;running=true;phase='idle';if(countEl)countEl.textContent='0';if(startBtn){startBtn.disabled=true;startBtn.textContent='Čas běží…'}setTimer();resetMandrake();timer=setInterval(()=>{seconds--;setTimer();if(seconds<=0)finishMinute()},1000)}
  function pick(){if(finishing||!running||phase!=='idle')return;phase='picked';workbench.classList.add('picked');instruction.textContent='Mandragoru držíš. Teď klikni na prázdný květináč.';transStatus.textContent='Opatrně — mandragora se vzpírá.'}
  function putInPot(){if(finishing||!running)return;if(phase==='idle'){transStatus.textContent='Nejdřív vezmi mandragoru.';source.classList.add('hint-pulse');setTimeout(()=>source.classList.remove('hint-pulse'),430);return}if(phase!=='picked')return;phase='potted';workbench.classList.remove('picked');workbench.classList.add('potted');source.hidden=true;inPot.hidden=false;cover.disabled=false;instruction.textContent='Mandragora je v květináči. Teď ji přikryj hlínou.';transStatus.textContent='Poslední krok: přikrýt kořeny hlínou.'}
  function coverSoil(){if(finishing||!running||phase!=='potted')return;phase='covered';cover.disabled=true;workbench.classList.add('covered');soil.classList.add('show');transplanted++;if(countEl)countEl.textContent=String(transplanted);instruction.textContent='Hotovo. Další!';transStatus.textContent=`Přesazeno ${transplanted}. Čas stále běží.`;setTimeout(()=>{soil.classList.remove('show');resetMandrake()},260)}
  async function finishMinute(){if(!running||finishing)return;stopTimer();if(startBtn){startBtn.disabled=false;startBtn.textContent='Zkusit znovu'}state=load();state.best=Math.max(Number(state.best||0),transplanted);save(state);if(transplanted<5){resetMandrake();instruction.textContent='Čas vypršel.';transStatus.textContent=`Stihl/a jsi ${transplanted}. Pro splnění potřebuješ alespoň 5 mandragor. Zkus to znovu.`;return}finishing=true;instruction.textContent='Čas vypršel.';transStatus.textContent=`Stihl/a jsi ${transplanted} mandragor. Profesorka Prýtová kontroluje práci…`;await finishQuest(transplanted)}
  async function finishQuest(score){let pts=score>=15?50:score>=10?20:5,dbRewarded=false;try{if(DB?.client&&DB?.claimV42Activity){const got=Number(await DB.claimV42Activity('herbarium-prytova',score));if(Number.isFinite(got)){if(got>0){pts=got;dbRewarded=true}else{pts=0;dbRewarded=true}}}}catch(e){console.warn('Prýtová v43.3 DB:',e)}state=load();state.done=true;state.reward=pts;state.best=Math.max(Number(state.best||0),score);save(state);A?.completeQuest?.('herbarium-prytova',{points:dbRewarded?0:pts,badgeId:'sklenikovy-znalec',title:'Profesorka Prýtová · Herbář a mandragory',syncDb:!dbRewarded});transStatus.textContent=`Úkol splněn · ${score} mandragor za minutu · +${pts} bodů pro kolej.`;setTimeout(render,1200)}
  startBtn?.addEventListener('click',beginMinute);source?.addEventListener('click',pick);pot?.addEventListener('click',putInPot);cover?.addEventListener('click',coverSoil);
  source?.addEventListener('dragstart',e=>{if(running){pick();e.dataTransfer?.setData('text/plain','mandrake')}});pot?.addEventListener('dragover',e=>{if(running){e.preventDefault();pot.classList.add('drag-over')}});pot?.addEventListener('dragleave',()=>pot.classList.remove('drag-over'));pot?.addEventListener('drop',e=>{e.preventDefault();pot.classList.remove('drag-over');putInPot()});
  professor.addEventListener('click',()=>{modal.hidden=false;document.body.style.overflow='hidden';render()});close.addEventListener('click',()=>{modal.hidden=true;document.body.style.overflow='';stopTimer()});modal.addEventListener('click',e=>{if(e.target===modal){modal.hidden=true;document.body.style.overflow='';stopTimer()}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden){modal.hidden=true;document.body.style.overflow='';stopTimer()}});
})();
