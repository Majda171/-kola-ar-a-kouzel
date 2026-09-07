(()=>{
  const KEY='bradavice_herbarium_v431',A=window.BradaviceAchievements,DB=window.BradaviceDB;
  const TARGET=5;
  const plantDefs={
    jmeli:{name:'Jmelí',src:'img/plant-jmeli-v423.webp'},salvej:{name:'Šalvěj',src:'img/plant-salvej-v423.webp'},kopriva:{name:'Kopřiva',src:'img/plant-kopriva-v423.webp'},brectan:{name:'Břečťan',src:'img/plant-brectan-v423.webp'},houby:{name:'Houby',src:'img/plant-houby-v423.webp'}
  };
  const blank=()=>({accepted:false,found:{jmeli:false,salvej:false,kopriva:false,brectan:false,houby:false},done:false,reward:0,best:0});
  function seedV431(){
    try{
      if(localStorage.getItem(KEY)) return;
      const legacy=JSON.parse(localStorage.getItem('bradavice_herbarium_v42')||'{}')||{};
      // V43.1 zachová jen informaci, že student úkol už přijal.
      // Staré nálezy/dokončení z testovacích verzí se nepřenášejí, protože schovávaly nové rostliny.
      const fresh=blank();
      fresh.accepted=Boolean(legacy.accepted);
      localStorage.setItem(KEY,JSON.stringify(fresh));
    }catch{}
  }
  seedV431();
  const load=()=>{try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}')||{};return{...blank(),...raw,found:{...blank().found,...(raw.found||{})}}}catch{return blank()}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));let state=load();
  function toast(text){let t=document.querySelector('.herb-toast');if(!t){t=document.createElement('div');t.className='herb-toast';document.body.appendChild(t)}t.textContent=text;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600)}
  const page=location.pathname.split('/').pop();
  // V43: všechny vzorky jsou na školních pozemcích. Zapovězený les se do úkolu Prýtové nepočítá.
  const placements={
    'pozemky.html':[{id:'salvej',cls:'plant-salvej'}],
    'jezero.html':[{id:'kopriva',cls:'plant-kopriva'}],
    'hagriduv-dum.html':[{id:'jmeli',cls:'plant-jmeli'},{id:'houby',cls:'plant-houby'}],
    'vrba-mlaticka.html':[{id:'brectan',cls:'plant-brectan'}]
  };
  function mountPlants(){const specs=placements[page]||[];if(!specs.length)return;const host=document.querySelector('.place-scene')||document.querySelector('main');if(!host)return;specs.forEach(spec=>{const def=plantDefs[spec.id],b=document.createElement('button');b.type='button';b.className=`herb-specimen ${spec.cls}`;b.hidden=!state.accepted||state.done||state.found[spec.id];b.dataset.herbId=spec.id;b.setAttribute('aria-label',`Rostlina pro profesorku Prýtovou: ${def.name}`);b.innerHTML=`<img src="${def.src}" alt="${def.name}">`;host.appendChild(b);b.addEventListener('click',()=>{state=load();if(!state.accepted){toast('Nejdřív si promluv s profesorkou Prýtovou ve skleníku.');return}if(state.found[spec.id])return;state.found[spec.id]=true;save(state);b.classList.add('herb-found');const n=Object.values(state.found).filter(Boolean).length;toast(n===5?'Pátý vzorek nalezen. Vrať se za profesorkou Prýtovou.':`Vzorek uložen · ${n} / 5`);setTimeout(()=>b.hidden=true,650)})})}
  mountPlants();

  const professor=document.getElementById('prytovaTeacher')||document.querySelector('.prytova-character'),modal=document.getElementById('herbQuestModal');if(!professor||!modal)return;
  const close=document.getElementById('herbQuestClose'),dialog=document.getElementById('herbQuestDialog'),progress=document.getElementById('herbProgress'),mainAction=document.getElementById('herbMainAction'),transplant=document.getElementById('herbTransplant'),transStatus=document.getElementById('transplantStatus'),instruction=document.getElementById('transplantInstruction'),countEl=document.getElementById('transplantCount'),workbench=document.getElementById('mandrakeWorkbench'),source=document.getElementById('mandrakeSource'),pot=document.getElementById('mandrakePot'),inPot=document.getElementById('mandrakeInPot'),soil=document.getElementById('mandrakeSoil'),cover=document.getElementById('transplantCover');
  let phase='idle',transplanted=0,finishing=false;
  const foundCount=()=>Object.values(state.found||{}).filter(Boolean).length;
  function renderProgress(){const order=['jmeli','salvej','kopriva','brectan','houby'];progress.innerHTML=order.map((id,i)=>`<div class="${state.found[id]?'done':''}"><strong>${state.found[id]?plantDefs[id].name:`Vzorek ${i+1}`}</strong><span>${state.found[id]?'nalezeno ✓':'nenalezeno'}</span></div>`).join('')}
  function resetMandrake(){phase='idle';workbench?.classList.remove('picked','potted','covered');source.hidden=false;inPot.hidden=true;cover.disabled=true;instruction.textContent='Vezmi mandragoru a vlož ji do prázdného květináče.';transStatus.textContent='Mandragoru můžeš vzít kliknutím nebo ji na počítači přetáhnout do květináče.'}
  function render(){state=load();renderProgress();if(state.done){dialog.innerHTML=`<strong>„Úkol splněn.“</strong> Herbář je kompletní a mandragory jsou bezpečně přesazené. Odměna byla ${state.reward||5} bodů pro kolej.`;mainAction.hidden=true;transplant.hidden=true;return}if(!state.accepted){dialog.textContent='„Přines mi pět různých rostlin ze školních pozemků. Ne ze skleníku a ne ze Zapovězeného lesa. Až je najdeš, vrať se ke mně.“';mainAction.hidden=false;mainAction.textContent='Přijmout úkol';transplant.hidden=true;return}const n=foundCount();if(n<5){dialog.textContent=`„Máš ${n} z 5 vzorků. Hledej po školních pozemcích — u cest, vody, stromů a Hagridova domu.“`;mainAction.hidden=true;transplant.hidden=true;return}dialog.textContent='„Výborně. Herbář je kompletní. Teď správně přesaď pět mandragor: vezmi mandragoru, vlož ji do prázdného květináče a přikryj hlínou.“';mainAction.hidden=true;transplant.hidden=false;countEl.textContent=`${transplanted} / ${TARGET}`;if(!finishing&&phase==='idle')resetMandrake()}
  mainAction.addEventListener('click',()=>{state=load();state.accepted=true;save(state);render();toast('Úkol přijat · 5 rostlin hledej po školních pozemcích')});

  function pick(){if(finishing||phase!=='idle')return;phase='picked';workbench.classList.add('picked');instruction.textContent='Mandragoru držíš. Teď klikni na prázdný květináč.';transStatus.textContent='Opatrně — mandragora se vzpírá.'}
  function putInPot(){if(finishing)return;if(phase==='idle'){transStatus.textContent='Nejdřív vezmi mandragoru.';source.classList.add('hint-pulse');setTimeout(()=>source.classList.remove('hint-pulse'),430);return}if(phase!=='picked')return;phase='potted';workbench.classList.remove('picked');workbench.classList.add('potted');source.hidden=true;inPot.hidden=false;cover.disabled=false;instruction.textContent='Mandragora je v květináči. Teď ji přikryj hlínou.';transStatus.textContent='Poslední krok: přikrýt kořeny hlínou.'}
  async function coverSoil(){if(finishing||phase!=='potted')return;phase='covered';cover.disabled=true;workbench.classList.add('covered');soil.classList.add('show');transplanted++;countEl.textContent=`${transplanted} / ${TARGET}`;instruction.textContent='Hotovo. Mandragora je bezpečně přesazená.';transStatus.textContent=transplanted<TARGET?'Připravuji další mandragoru…':'Všech pět je přesazeno. Profesorka Prýtová kontroluje práci.';if(transplanted>=TARGET){finishing=true;setTimeout(finishQuest,700);return}setTimeout(()=>{soil.classList.remove('show');resetMandrake()},650)}
  async function finishQuest(){let pts=5,dbRewarded=false;try{if(DB?.client&&DB?.claimV42Activity){const got=Number(await DB.claimV42Activity('herbarium-prytova',TARGET));if(Number.isFinite(got)){pts=got||5;dbRewarded=true}}}catch(e){console.warn('Prýtová v43 DB:',e)}state=load();state.done=true;state.reward=pts;state.best=TARGET;save(state);A?.completeQuest?.('herbarium-prytova',{points:dbRewarded?0:pts,badgeId:'sklenikovy-znalec',title:'Profesorka Prýtová · Herbář a mandragory',syncDb:!dbRewarded});transStatus.textContent=`Úkol splněn · +${pts} bodů pro kolej.`;setTimeout(render,950)}
  source?.addEventListener('click',pick);pot?.addEventListener('click',putInPot);cover?.addEventListener('click',coverSoil);
  source?.addEventListener('dragstart',e=>{pick();e.dataTransfer?.setData('text/plain','mandrake')});pot?.addEventListener('dragover',e=>{e.preventDefault();pot.classList.add('drag-over')});pot?.addEventListener('dragleave',()=>pot.classList.remove('drag-over'));pot?.addEventListener('drop',e=>{e.preventDefault();pot.classList.remove('drag-over');putInPot()});
  professor.addEventListener('click',()=>{modal.hidden=false;document.body.style.overflow='hidden';render()});close.addEventListener('click',()=>{modal.hidden=true;document.body.style.overflow=''});modal.addEventListener('click',e=>{if(e.target===modal){modal.hidden=true;document.body.style.overflow=''}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden){modal.hidden=true;document.body.style.overflow=''}});
})();
