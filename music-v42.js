(()=>{
  const page=location.pathname.split('/').pop()||'index.html';
  const excluded=new Set(['index.html','registrace.html','prihlaseni-student.html','prijeti.html','vylouceni.html','admin-login.html','admin.html']);
  if(excluded.has(page)||page.startsWith('prihlaseni'))return;
  const KEY='bradavice_music_v42';
  const tracks=['audio/harry-potter-theme-v42.mp3','audio/hedwigs-theme-v42.mp3'];
  let state={enabled:true,index:0,time:0};
  try{state={...state,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
  state.index=Math.max(0,Math.min(tracks.length-1,Number(state.index)||0));
  state.time=Math.max(0,Number(state.time)||0);
  const audio=new Audio();audio.preload='auto';audio.volume=.16;audio.src=tracks[state.index];audio.dataset.castleMusic='1';
  const btn=document.createElement('button');btn.type='button';btn.className='castle-music-toggle';btn.setAttribute('aria-label','Zapnout nebo vypnout hudební podkres');document.body.appendChild(btn);
  function save(){try{localStorage.setItem(KEY,JSON.stringify({enabled:state.enabled,index:state.index,time:Number.isFinite(audio.currentTime)?audio.currentTime:0}))}catch{}}
  function render(){btn.textContent=state.enabled?'🔊 Hudba':'🔇 Hudba';btn.classList.toggle('is-muted',!state.enabled);btn.setAttribute('aria-pressed',String(state.enabled))}
  function play(){if(!state.enabled)return;audio.play().catch(()=>{})}
  audio.addEventListener('loadedmetadata',()=>{if(state.time>0&&state.time<audio.duration-1){try{audio.currentTime=state.time}catch{}}if(state.enabled)play()},{once:true});
  audio.addEventListener('ended',()=>{state.index=(state.index+1)%tracks.length;state.time=0;audio.src=tracks[state.index];save();play()});
  btn.addEventListener('click',()=>{state.enabled=!state.enabled;if(state.enabled)play();else audio.pause();render();save()});
  const unlock=()=>{if(state.enabled)play();document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true)};
  document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);
  let saveTimer=setInterval(save,4000);window.addEventListener('pagehide',()=>{save();clearInterval(saveTimer)});document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
  render();if(state.enabled)play();
})();
