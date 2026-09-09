(()=>{
 const mirror=document.getElementById('mirrorObject'),btn=document.getElementById('mirrorButton'),box=document.getElementById('mirrorQuestion'),qtext=document.getElementById('mirrorQuestionText'),answers=document.getElementById('mirrorAnswers'),msg=document.getElementById('mirrorMessage'),reward=document.getElementById('stoneReward'),stone=document.getElementById('stoneButton'),label=document.getElementById('stoneLabel');
 if(!mirror||!btn)return;
 const OWN='bradavice_philosophers_stone_v436';
 const questions=[
  {q:'Co uspalo tříhlavého strážce nad padacími dveřmi?',a:['Kouzelná harfa','Lektvar spánku','Zaklínadlo Lumos'],ok:0},
  {q:'Který z létajících klíčů otevřel další cestu?',a:['Nejzářivější klíč','Starý klíč s poškozeným křídlem','Největší stříbrný klíč'],ok:1},
  {q:'Kolik lahviček stálo v poslední logické zkoušce?',a:['Pět','Sedm','Devět'],ok:1}
 ];
 let index=0,started=false;
 function showQuestion(){const q=questions[index];box.hidden=false;qtext.textContent=q.q;msg.textContent='';answers.innerHTML=q.a.map((x,i)=>`<button type="button" data-i="${i}">${x}</button>`).join('');answers.querySelectorAll('button').forEach(b=>b.onclick=()=>pick(b,Number(b.dataset.i)))}
 function pick(b,i){const q=questions[index];if(i!==q.ok){b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');msg.textContent='Zrcadlo potemnělo. Zkus to znovu.';return}b.classList.add('correct');answers.querySelectorAll('button').forEach(x=>x.disabled=true);msg.textContent='Správně.';setTimeout(()=>{index++;if(index<questions.length)showQuestion();else finish()},520)}
 function finish(){box.hidden=true;reward.classList.add('visible');document.getElementById('mirrorIntro').textContent='Zrcadlo se rozjasnilo. Uprostřed jeho odrazu se objevil rudý kámen.';mirror.classList.add('active')}
 btn.onclick=()=>{if(started)return;started=true;mirror.classList.add('active');showQuestion()};
 async function claim(){if(localStorage.getItem(OWN)==='owned'){label.textContent='Kámen mudrců už vlastníš';label.classList.add('stone-owned');return}localStorage.setItem(OWN,'owned');label.textContent='Kámen mudrců získán';label.classList.add('stone-owned');stone.disabled=true;window.BradaviceAchievements?.completeQuest?.('kamen-mudrcu',{title:'Kámen mudrců'});window.BradaviceAchievements?.toast?.('Kámen mudrců získán','Vzácný nález byl uložen do profilu.');}
 stone.onclick=claim;
 if(localStorage.getItem(OWN)==='owned'){started=true;finish();label.textContent='Kámen mudrců už vlastníš';label.classList.add('stone-owned');stone.disabled=true}
})();
