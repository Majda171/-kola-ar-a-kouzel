(()=>{
 const mirror=document.getElementById('mirrorObject'),btn=document.getElementById('mirrorButton'),box=document.getElementById('mirrorQuestion'),qtext=document.getElementById('mirrorQuestionText'),answers=document.getElementById('mirrorAnswers'),msg=document.getElementById('mirrorMessage'),reward=document.getElementById('stoneReward'),stone=document.getElementById('stoneButton'),label=document.getElementById('stoneLabel');
 if(!mirror||!btn||!box||!qtext||!answers||!reward||!stone)return;
 const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
 const sid=String(student?.supabaseUserId||student?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
 const OWN=`bradavice_philosophers_stone_v4363_${sid}`;
 const questions=[
  {q:'Podle čeho se dal mezi létajícími klíči poznat ten správný?',a:['Byl největší a nejzářivější','Měl poškozené křídlo a vypadal opotřebovaně','Jako jediný byl celý ze zlata'],ok:1},
  {q:'Co bylo nutné udělat v kouzelnických šachách, aby cesta skutečně pokračovala?',a:['Dostat jednu figurku na poslední řadu','Vyřadit soupeřovu věž','Vyhrát celou partii'],ok:2},
  {q:'Komu zrcadlo vydá Kámen mudrců?',a:['Tomu, kdo ho chce najít, ale nechce ho použít pro vlastní prospěch','Tomu, kdo po něm touží nejvíc','Tomu, kdo nasbíral nejvíc kolejních bodů'],ok:0}
 ];
 let index=0,started=false;
 function showQuestion(){
   const q=questions[index];box.hidden=false;qtext.textContent=q.q;if(msg)msg.textContent='';
   answers.innerHTML=q.a.map((x,i)=>`<button type="button" data-i="${i}">${x}</button>`).join('');
   answers.querySelectorAll('button').forEach(b=>b.onclick=()=>pick(b,Number(b.dataset.i)));
 }
 function pick(b,i){
   const q=questions[index];
   if(i!==q.ok){b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');if(msg)msg.textContent='Odraz se zachvěl. Tohle není správná odpověď.';return}
   b.classList.add('correct');answers.querySelectorAll('button').forEach(x=>x.disabled=true);if(msg)msg.textContent='Zrcadlo odpověď přijalo.';
   setTimeout(()=>{index++;if(index<questions.length)showQuestion();else finish()},650);
 }
 function finish(){
   box.hidden=true;reward.classList.add('visible');
   const intro=document.getElementById('mirrorIntro');if(intro)intro.textContent='Zrcadlo se rozjasnilo. V jeho odrazu se objevil rudý Kámen mudrců.';
   mirror.classList.add('active');
 }
 btn.onclick=()=>{if(started)return;started=true;mirror.classList.add('active');showQuestion()};
 async function claim(){
   if(localStorage.getItem(OWN)==='owned'){label.textContent='Kámen mudrců už vlastníš';label.classList.add('stone-owned');stone.disabled=true;return}
   localStorage.setItem(OWN,'owned');label.textContent='Kámen mudrců získán';label.classList.add('stone-owned');stone.disabled=true;
   window.BradaviceAchievements?.completeQuest?.('kamen-mudrcu',{title:'Kámen mudrců'});
   window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true});
 }
 stone.onclick=claim;
 if(localStorage.getItem(OWN)==='owned'){reward.classList.add('visible');label.textContent='Kámen mudrců už vlastníš';label.classList.add('stone-owned');stone.disabled=true}
})();