(()=>{
  const room=document.getElementById('fluffyRoom'),dog=document.getElementById('fluffyDog'),useHarp=document.getElementById('fluffyHarp'),next=document.getElementById('trapdoorNext'),msg=document.getElementById('fluffyMessage'),audio=document.getElementById('fluffyHarpAudio');
  if(!room||!dog||!useHarp||!next||!audio)return;
  const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
  const sid=String(student?.supabaseUserId||student?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
  const STATE=`bradavice_philosopher_fluffy_v436_${sid}`,HARP=`bradavice_inventory_harp_v4363_${sid}`,SEEN=`bradavice_fluffy_seen_v4363_${sid}`;
  localStorage.setItem(SEEN,'seen');
  let passed=false,countdown=null,redirectTimer=null;
  const ownsHarp=()=>localStorage.getItem(HARP)==='owned';
  function wake(text='Chloupek je vzhůru a znovu hlídá padací dveře.'){
    clearInterval(countdown);countdown=null;dog.src='img/philosopher-fluffy-awake.webp';dog.classList.remove('sleeping');next.classList.remove('visible');useHarp.disabled=false;useHarp.classList.remove('playing');localStorage.setItem(STATE,'awake');msg.textContent=text;
  }
  function escapeToHagrid(){
    if(passed)return;
    wake('Hudba dohrála. Chloupek otevřel všech šest očí — musíš pryč!');
    redirectTimer=setTimeout(()=>{location.href='hagriduv-dum.html?chloupek=utekl'},1100);
  }
  function sleep(){
    dog.src='img/philosopher-fluffy-sleep.webp';dog.classList.add('sleeping');next.classList.add('visible');localStorage.setItem(STATE,'sleeping');useHarp.disabled=true;useHarp.classList.add('playing');
    const total=Math.max(1,Math.round(Number.isFinite(audio.duration)?audio.duration:16));let left=total;
    msg.textContent=`Chloupek usnul. Hudba hraje — máš přibližně ${left} s na průchod.`;
    clearInterval(countdown);countdown=setInterval(()=>{left--;if(left>0&& !passed)msg.textContent=`Chloupek spí. Hudba dohraje asi za ${left} s — rychle k padacím dveřím.`},1000);
  }
  useHarp.hidden=!ownsHarp();
  if(!ownsHarp())msg.textContent='Tady žádný nástroj neleží. Možná budeš muset něco vhodného najít jinde v hradu.';
  useHarp.addEventListener('click',async()=>{
    if(!ownsHarp()){useHarp.hidden=true;return}
    passed=false;clearTimeout(redirectTimer);audio.currentTime=0;
    try{await audio.play();sleep();window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true})}
    catch{msg.textContent='Harfa tentokrát nezahrála. Zkus ji použít znovu.';useHarp.disabled=false}
  });
  audio.addEventListener('ended',escapeToHagrid);
  next.addEventListener('click',e=>{
    if(!dog.classList.contains('sleeping')||audio.ended||audio.paused){e.preventDefault();escapeToHagrid();return}
    passed=true;clearTimeout(redirectTimer);clearInterval(countdown);localStorage.setItem(STATE,'passed');audio.pause();
  });
  window.addEventListener('pagehide',()=>{clearInterval(countdown);clearTimeout(redirectTimer)});
})();
