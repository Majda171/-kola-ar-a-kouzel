(()=>{
  function initHud(hud){
    if(!hud||hud.dataset.v435Ready==='1')return;
    hud.dataset.v435Ready='1';
    const card=hud.querySelector('.student-house-card');
    const actions=hud.querySelector('.student-hud-actions');
    const name=hud.querySelector('.student-house-card strong')?.textContent?.trim();
    if(actions&&name&&!actions.querySelector('.student-hud-house-name')){
      const n=document.createElement('div');n.className='student-hud-house-name';n.textContent=name;actions.prepend(n);
    }
    card?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();hud.classList.toggle('is-open')});
    document.addEventListener('click',e=>{if(!hud.contains(e.target))hud.classList.remove('is-open')});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')hud.classList.remove('is-open')});
  }
  const findHud=()=>initHud(document.getElementById('studentHouseHud'));
  findHud();
  new MutationObserver(findHud).observe(document.documentElement,{childList:true,subtree:true});

  const insideFullscreenFrame=window.self!==window.top;
  if(!insideFullscreenFrame && !document.querySelector('.v435-fullscreen') && document.fullscreenEnabled){
    const b=document.createElement('button');
    b.type='button';b.className='v435-fullscreen';b.setAttribute('aria-label','Celá obrazovka');b.title='Celá obrazovka';b.innerHTML='<span>⛶</span>';

    let shell=null,frame=null,closing=false;
    const cleanFrameUrl=(url)=>{
      try{const u=new URL(url,location.href);u.searchParams.delete('fsframe');return u.href}catch{return url}
    };
    const currentFrameUrl=()=>{
      try{return cleanFrameUrl(frame?.contentWindow?.location?.href||location.href)}catch{return location.href}
    };
    const leaveShell=()=>{
      if(closing)return;closing=true;
      const target=currentFrameUrl();
      try{shell?.remove()}catch{}
      shell=null;frame=null;
      if(target && target!==location.href) location.href=target;
      else closing=false;
    };
    const enterPersistentFullscreen=async()=>{
      shell=document.createElement('div');shell.className='v435-fs-shell';
      frame=document.createElement('iframe');frame.className='v435-fullscreen-frame';frame.title='Bradavice — celá obrazovka';
      const u=new URL(location.href);u.searchParams.set('fsframe','1');frame.src=u.href;
      const exit=document.createElement('button');exit.type='button';exit.className='v435-fs-exit';exit.title='Opustit celou obrazovku';exit.setAttribute('aria-label',exit.title);exit.textContent='×';
      exit.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();try{await document.exitFullscreen()}catch{leaveShell()}});
      shell.append(frame,exit);document.body.appendChild(shell);
      // Skrytá původní stránka nesmí hrát druhou kopii audia pod iframe.
      document.querySelectorAll('audio,video').forEach(m=>{try{m.pause()}catch{}});
      try{await shell.requestFullscreen()}catch(e){console.warn('Fullscreen není v tomto prohlížeči dostupný.',e);shell.remove();shell=null;frame=null;return}
    };
    b.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}}else await enterPersistentFullscreen()});
    document.addEventListener('fullscreenchange',()=>{
      if(shell && !document.fullscreenElement) leaveShell();
    });
    document.body.appendChild(b);
  }
})();
