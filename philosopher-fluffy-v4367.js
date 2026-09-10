(()=>{
  const room=document.getElementById('fluffyRoom'),dog=document.getElementById('fluffyDog'),useHarp=document.getElementById('fluffyHarp'),next=document.getElementById('trapdoorNext'),msg=document.getElementById('fluffyMessage'),audio=document.getElementById('fluffyHarpAudio'),timerEl=document.getElementById('fluffyDangerTimer');
  if(!room||!dog||!useHarp||!next||!audio)return;
  const readStudent=()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}};
  const sid=String(readStudent()?.supabaseUserId||readStudent()?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
  const STATE=`bradavice_philosopher_fluffy_v436_${sid}`,HARP=`bradavice_inventory_harp_v4363_${sid}`,SEEN=`bradavice_fluffy_seen_v4363_${sid}`;
  localStorage.setItem(SEEN,'seen');
  let passed=false,sleepTick=null,entryTick=null,redirectTimer=null,escaping=false;
  const ownsHarp=()=>localStorage.getItem(HARP)==='owned';
  const paintEntry=n=>{if(timerEl){timerEl.hidden=false;timerEl.textContent=`${n} s`;timerEl.classList.toggle('danger',n<=3)}};
  function clearEntry(){clearInterval(entryTick);entryTick=null;if(timerEl)timerEl.hidden=true}
  function wake(text='Chloupek je vzhůru a znovu hlídá padací dveře.'){
    clearInterval(sleepTick);sleepTick=null;dog.src='img/philosopher-fluffy-awake.webp';dog.classList.remove('sleeping');next.classList.remove('visible');useHarp.disabled=false;useHarp.classList.remove('playing');localStorage.setItem(STATE,'awake');if(msg)msg.textContent=text;
  }
  function escapeToHagrid(reason='Chloupek se vrhl vpřed. Musíš pryč!'){
    if(passed||escaping)return;escaping=true;clearEntry();wake(reason);
    redirectTimer=setTimeout(()=>{location.href='hagriduv-dum.html?chloupek=utekl'},850);
  }
  function startEntryDanger(){
    clearEntry();let left=8;paintEntry(left);
    if(msg)msg.textContent=ownsHarp()?'Chloupek tě zpozoroval. Zahraj rychle na harfu!':'Chloupek tě zpozoroval. Tady není nic, čím bys ho dokázal/a uklidnit.';
    entryTick=setInterval(()=>{left--;paintEntry(Math.max(0,left));if(left<=0)escapeToHagrid('Chloupek přestal čekat a vyrazil po tobě!')},1000);
  }
  function sleep(){
    clearEntry();escaping=false;dog.src='img/philosopher-fluffy-sleep.webp';dog.classList.add('sleeping');next.classList.add('visible');localStorage.setItem(STATE,'sleeping');useHarp.disabled=true;useHarp.classList.add('playing');
    const total=Math.max(1,Math.ceil(Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:16));let left=total;
    if(timerEl){timerEl.hidden=false;timerEl.classList.remove('danger');timerEl.textContent=`${left} s`}
    if(msg)msg.textContent=`Chloupek usnul. Dokud hraje hudba, můžeš projít padacími dveřmi.`;
    clearInterval(sleepTick);sleepTick=setInterval(()=>{left--;if(timerEl)timerEl.textContent=`${Math.max(0,left)} s`;if(left>0&&!passed&&msg)msg.textContent=`Chloupek spí. Hudba dohraje za ${left} s.`},1000);
  }
  useHarp.hidden=!ownsHarp();
  useHarp.addEventListener('click',async()=>{
    if(!ownsHarp()){useHarp.hidden=true;return}
    clearEntry();passed=false;escaping=false;clearTimeout(redirectTimer);audio.currentTime=0;
    try{await audio.play();sleep();window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true})}
    catch{if(msg)msg.textContent='Harfa nezahrála. Zkus ji okamžitě použít znovu.';useHarp.disabled=false;startEntryDanger()}
  });
  audio.addEventListener('ended',()=>escapeToHagrid('Hudba dohrála. Chloupek otevřel všech šest očí — musíš pryč!'));
  next.addEventListener('click',e=>{
    if(!dog.classList.contains('sleeping')||audio.ended||audio.paused){e.preventDefault();escapeToHagrid();return}
    passed=true;clearEntry();clearInterval(sleepTick);clearTimeout(redirectTimer);localStorage.setItem(STATE,'passed');audio.pause();
  });
  window.addEventListener('pagehide',()=>{clearEntry();clearInterval(sleepTick);clearTimeout(redirectTimer)});
  // Při KAŽDÉM vstupu do místnosti běží osm sekund, než Chloupek zaútočí.
  startEntryDanger();
})();