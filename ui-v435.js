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

  if(!document.querySelector('.v435-fullscreen')&&document.fullscreenEnabled){
    const b=document.createElement('button');b.type='button';b.className='v435-fullscreen';b.setAttribute('aria-label','Přepnout celou obrazovku');b.title='Celá obrazovka';b.innerHTML='<span>⛶</span>';
    const sync=()=>{b.title=document.fullscreenElement?'Opustit celou obrazovku':'Celá obrazovka';b.setAttribute('aria-label',b.title);b.innerHTML=`<span>${document.fullscreenElement?'×':'⛶'}</span>`};
    b.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(e){console.warn('Fullscreen není v tomto prohlížeči dostupný.',e)}});
    document.addEventListener('fullscreenchange',sync);document.body.appendChild(b);sync();
  }
})();
