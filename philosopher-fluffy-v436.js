(()=>{
  const room=document.getElementById('fluffyRoom'),dog=document.getElementById('fluffyDog'),harp=document.getElementById('fluffyHarp'),next=document.getElementById('trapdoorNext'),msg=document.getElementById('fluffyMessage');
  if(!room||!dog||!harp||!next)return;
  const KEY='bradavice_philosopher_fluffy_v436';
  const reveal=()=>{dog.src='img/philosopher-fluffy-sleep.webp';dog.classList.add('sleeping');next.classList.add('visible');msg.textContent='Chloupek usnul. Padací dveře jsou volné.';localStorage.setItem(KEY,'sleeping')};
  if(localStorage.getItem(KEY)==='sleeping')reveal();
  function playHarp(){
    if(harp.disabled)return;harp.disabled=true;harp.classList.add('playing');msg.textContent='Harfa začíná hrát tichou uspávací melodii…';
    try{
      const AC=window.AudioContext||window.webkitAudioContext,ctx=new AC();const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63];
      notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.0001,ctx.currentTime+i*.23);g.gain.exponentialRampToValueAtTime(.12,ctx.currentTime+i*.23+.025);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+i*.23+.48);o.connect(g).connect(ctx.destination);o.start(ctx.currentTime+i*.23);o.stop(ctx.currentTime+i*.23+.5)});setTimeout(()=>ctx.close().catch(()=>{}),3200);
    }catch{}
    setTimeout(()=>{reveal();harp.classList.remove('playing');harp.disabled=false;window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true})},2350);
  }
  harp.addEventListener('click',playHarp);
})();
