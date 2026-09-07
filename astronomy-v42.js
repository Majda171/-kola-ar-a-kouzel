(()=>{
  const teacher=document.getElementById('astronomyTeacher'),modal=document.getElementById('astronomyTaskModal');if(!teacher||!modal)return;
  const close=document.getElementById('astronomyTaskClose'),accept=document.getElementById('astronomyTaskAccept'),text=document.getElementById('astronomyTaskText');
  const KEY='bradavice_astronomy_task_v42';
  const A=window.BradaviceAchievements;
  const questDone=()=>{try{const q=JSON.parse(localStorage.getItem('bradavice_quests_v1')||'{}');return q?.['find-three-constellations']===true||q?.['find-three-constellations']?.done===true}catch{return false}};
  const state=()=>localStorage.getItem(KEY)||'';
  const accepted=()=>['accepted','ready','done'].includes(state())||questDone();
  const ready=()=>state()==='ready'||(questDone()&&state()!=='done');
  const turnedIn=()=>state()==='done';
  function render(){
    if(turnedIn()){text.textContent='„Výborně. Tři obrazce jsi našel/a a úkol je řádně odevzdaný.“';accept.textContent='Úkol odevzdán';accept.disabled=true;return}
    if(ready()){text.textContent='„Vidím, že máš všechny tři obrazce. Přinesl/a jsi pozorování zpět. Odevzdej úkol.“';accept.textContent='Odevzdat úkol';accept.disabled=false;return}
    if(accepted()){text.textContent='„Najdi na noční obloze tři skrytá souhvězdí. Až je objevíš, vrať se ke mně a úkol odevzdej.“';accept.textContent='Úkol přijat';accept.disabled=true;return}
    text.textContent='„Dnešní úkol je pozorovací. Na obloze jsou ukryté tři obrazce. Najdi všechny tři bez nápovědy a vrať se ke mně.“';accept.textContent='Přijmout úkol';accept.disabled=false;
  }
  function show(){render();modal.hidden=false;document.body.style.overflow='hidden'}
  function hide(){modal.hidden=true;document.body.style.overflow=''}
  teacher.addEventListener('click',show);close.addEventListener('click',hide);modal.addEventListener('click',e=>{if(e.target===modal)hide()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)hide()});
  accept.addEventListener('click',()=>{
    if(ready()){
      // Starší v42.2 mohla úkol zapsat jako hotový už při třetím obrazci. completeQuest
      // v takovém případě body znovu nepřičte, ale odevzdání se nyní řádně uzavře.
      A?.completeQuest?.('find-three-constellations',{points:50,badgeId:'nocni-pozorovatel',title:'Odevzdaný úkol z astronomie'});
      localStorage.setItem(KEY,'done');
      document.getElementById('astronomyQuest')?.classList.add('quest-complete');
      const replay=document.getElementById('astronomyReplay');if(replay)replay.hidden=false;
      render();
      return;
    }
    localStorage.setItem(KEY,'accepted');document.getElementById('astronomyQuest')?.classList.add('astronomy-task-accepted');render();setTimeout(hide,420);
  });
  if(accepted())document.getElementById('astronomyQuest')?.classList.add('astronomy-task-accepted');if(turnedIn()){const replay=document.getElementById('astronomyReplay');if(replay)replay.hidden=false}
})();
