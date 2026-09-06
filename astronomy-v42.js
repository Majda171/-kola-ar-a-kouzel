(()=>{
  const teacher=document.getElementById('astronomyTeacher'),modal=document.getElementById('astronomyTaskModal');if(!teacher||!modal)return;
  const close=document.getElementById('astronomyTaskClose'),accept=document.getElementById('astronomyTaskAccept'),text=document.getElementById('astronomyTaskText');
  const KEY='bradavice_astronomy_task_v42';
  const questDone=()=>{try{const q=JSON.parse(localStorage.getItem('bradavice_quests_v1')||'{}');return q?.['find-three-constellations']===true||q?.['find-three-constellations']?.done===true}catch{return false}};
  const accepted=()=>localStorage.getItem(KEY)==='accepted'||questDone();
  function render(){if(questDone()){text.textContent='„Výborně. Tři obrazce jsi našel/a. Teď už víš, že na obloze se nesmí hledat jen to nejjasnější.“';accept.textContent='Úkol splněn';accept.disabled=true}else if(accepted()){text.textContent='„Najdi na noční obloze tři skrytá souhvězdí. Každé pozorování začíná od nuly, takže se dívej pozorně.“';accept.textContent='Úkol přijat';accept.disabled=true}else{text.textContent='„Dnešní úkol je pozorovací. Na obloze jsou ukryté tři obrazce. Najdi všechny tři bez nápovědy.“';accept.textContent='Přijmout úkol';accept.disabled=false}}
  function show(){render();modal.hidden=false;document.body.style.overflow='hidden'}function hide(){modal.hidden=true;document.body.style.overflow=''}
  teacher.addEventListener('click',show);close.addEventListener('click',hide);modal.addEventListener('click',e=>{if(e.target===modal)hide()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)hide()});
  accept.addEventListener('click',()=>{localStorage.setItem(KEY,'accepted');document.getElementById('astronomyQuest')?.classList.add('astronomy-task-accepted');render();setTimeout(hide,420)});
  if(accepted())document.getElementById('astronomyQuest')?.classList.add('astronomy-task-accepted');
})();
