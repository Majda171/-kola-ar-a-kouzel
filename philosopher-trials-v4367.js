(()=>{
  const root=document.querySelector('.secret-trials-shell');if(!root)return;
  const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
  const sid=String(student?.supabaseUserId||student?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
  const STORE=`bradavice_philosopher_trials_v4363_${sid}`,GATE=`bradavice_philosopher_trials_gate_v4363_${sid}`;
  let progress={chess:false,key:false,potion:false};try{progress={...progress,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{}
  const save=()=>{localStorage.setItem(STORE,JSON.stringify(progress));if(progress.chess&&progress.key&&progress.potion)localStorage.setItem(GATE,'open')};
  const stages={chess:document.getElementById('trialChess'),key:document.getElementById('trialKeys'),potion:document.getElementById('trialPotions'),done:document.getElementById('trialComplete')};
  function paintProgress(){document.querySelectorAll('[data-progress]').forEach((x,i)=>x.classList.toggle('done',[progress.chess,progress.key,progress.potion][i]))}
  function showStage(name){Object.values(stages).forEach(x=>{if(x)x.hidden=true});if(stages[name])stages[name].hidden=false;paintProgress();window.scrollTo({top:0,behavior:'smooth'})}
  function resume(){if(!progress.chess)showStage('chess');else if(!progress.key){showStage('key');buildKeys()}else if(!progress.potion){showStage('potion');buildBottles()}else{save();showStage('done')}}

  // Šachy používají jedinou společnou implementaci chess.js. Po výhře se pokračuje na klíče.
  window.addEventListener('bradavice:chess-win',e=>{
    if((e.detail?.context||'')!=='philosopher'||progress.chess)return;
    progress.chess=true;save();paintProgress();
    document.getElementById('chessClose')?.click();
    setTimeout(()=>{showStage('key');buildKeys()},650);
  });

  let keysBuilt=false;
  function buildKeys(){
    if(keysBuilt)return;keysBuilt=true;
    const arena=document.getElementById('keyArena'),msg=document.getElementById('keyMessage');if(!arena)return;
    const count=14,correctIndex=Math.floor(Math.random()*count);
    for(let i=0;i<count;i++){
      const correct=i===correctIndex,b=document.createElement('button');b.type='button';b.className='flying-key';
      const y=6+Math.random()*78,dur=4.6+Math.random()*4.4,delay=-(Math.random()*dur),reverse=Math.random()>.5;
      b.style.setProperty('--y',`${y}%`);b.style.setProperty('--dur',`${dur}s`);b.style.setProperty('--delay',`${delay}s`);b.style.setProperty('--bob',`${10+Math.random()*22}px`);b.style.setProperty('--spin',`${reverse?-1:1}`);b.classList.toggle('reverse',reverse);
      b.innerHTML=`<img src="img/keys/${correct?'winged-key-broken.webp':'winged-key.webp'}" alt="Okřídlený klíč">`;
      b.onclick=()=>{
        if(correct){msg.textContent='Správně — starý klíč se zlomeným křídlem. Zámek povolil.';progress.key=true;save();paintProgress();arena.querySelectorAll('button').forEach(x=>x.disabled=true);setTimeout(()=>{showStage('potion');buildBottles()},850)}
        else{msg.textContent='Tenhle ne. Správný klíč má poškozené křídlo.';b.classList.add('miss');setTimeout(()=>b.classList.remove('miss'),500)}
      };
      arena.appendChild(b);
    }
  }

  let bottlesBuilt=false;
  function buildBottles(){
    if(bottlesBuilt)return;bottlesBuilt=true;
    const box=document.getElementById('riddleBottles'),msg=document.getElementById('potionMessage');if(!box)return;
    const bottles=[['cerveny.webp','Červená'],['modry.webp','Modrá'],['jantarovy.webp','Jantarová'],['fialovy.webp','Fialová'],['zeleny.webp','Zelená'],['ledovy.webp','Ledová'],['kourovy.webp','Kouřová']];
    box.innerHTML=bottles.map((x,i)=>`<button type="button" class="riddle-bottle" data-pos="${i+1}"><img src="img/potions-v40/results/${x[0]}" alt="${x[1]} lahvička"><span>${i+1}</span></button>`).join('');
    box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const pos=Number(b.dataset.pos);if(pos===5){msg.textContent='Správně. Všechny indicie ukazují právě na tuto lahvičku.';progress.potion=true;save();paintProgress();box.querySelectorAll('button').forEach(x=>x.disabled=true);window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true});setTimeout(()=>showStage('done'),900)}else{msg.textContent='Ne. Tahle volba odporuje alespoň jedné indicii. Projdi je znovu.';b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong')}})
  }
  resume();
})();
