(()=>{
  const KEY='bradavice_founders_v42',A=window.BradaviceAchievements;
  const info={
    godric:{name:'Godrik Nebelvír',img:'img/badge-godrikuv-nalezce.webp',text:'„Odvaha není nepřítomnost strachu. Je to rozhodnutí pokračovat navzdory němu.“'},
    salazar:{name:'Salazar Zmijozel',img:'img/founder-salazar-v42.webp',text:'„Hrad si pamatuje každé tajemství. Ne všechna však chtějí být nalezena.“'},
    rowena:{name:'Rowena z Havraspáru',img:'img/founder-rowena-v42.webp',text:'„Otázka, kterou položíš správně, může mít větší cenu než rychlá odpověď.“'},
    helga:{name:'Helga z Mrzimoru',img:'img/founder-helga-v42.webp',text:'„Trpělivá práce a laskavost bývají silnější, než se na první pohled zdá.“'}
  };
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}},save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  let state=load();
  function ensureDialog(){let d=document.getElementById('founderDialog');if(d)return d;d=document.createElement('div');d.id='founderDialog';d.className='founder-dialog';d.hidden=true;d.innerHTML='<article class="founder-card"><button class="founder-close" type="button">×</button><img id="founderDialogImg" alt=""><div><small>Zakladatel Bradavic</small><h2 id="founderDialogName"></h2><p id="founderDialogText"></p><div class="founder-progress" id="founderProgress"></div></div></article>';document.body.appendChild(d);d.querySelector('.founder-close').addEventListener('click',()=>d.hidden=true);d.addEventListener('click',e=>{if(e.target===d)d.hidden=true});return d}
  function count(){return ['godric','salazar','rowena','helga'].filter(k=>state[k]).length}
  function found(id){
    state=load();
    if(!state[id]){state[id]=new Date().toISOString();save(state)}
    document.querySelector(`[data-founder="${id}"]`)?.classList.add('found');
    if(id==='godric'){
      const g=document.getElementById('godrikQuest');
      const done=A?.completeQuest?.('find-godric',{points:10,badgeId:'godrikuv-nalezce',title:'Nalezen obraz Godrika Nebelvíra'});
      if(done!==undefined)g?.classList.add('quest-complete');
    }
    const n=count(),d=ensureDialog(),x=info[id];
    d.querySelector('#founderDialogImg').src=x.img;d.querySelector('#founderDialogImg').alt=x.name;d.querySelector('#founderDialogName').textContent=x.name;d.querySelector('#founderDialogText').textContent=x.text;d.querySelector('#founderProgress').textContent=`Zakladatelé nalezeni: ${n} / 4`;d.hidden=false;
    if(n===4)A?.completeQuest?.('founders-all',{points:0,badgeId:'ctyri-zakladatele',title:'Zakladatelé hradu — nalezeni všichni čtyři'});
  }
  document.querySelectorAll('[data-founder]').forEach(b=>{if(state[b.dataset.founder])b.classList.add('found');b.addEventListener('click',e=>{e.stopPropagation();found(b.dataset.founder)})});

  // Godrik je součástí samotného pozadí Síně slávy. Proto se hotspot neumisťuje
  // pevnými procenty viewportu: při background-size: cover se obrázek na širokých
  // a vysokých displejích ořezává a starý hotspot mohl skončit mimo portrét.
  const godric=document.getElementById('godrikQuest');
  function positionGodric(){
    if(!godric)return;
    const scene=godric.closest('.hall-of-fame');if(!scene)return;
    const r=scene.getBoundingClientRect(),iw=1600,ih=900,scale=Math.max(r.width/iw,r.height/ih);
    const rw=iw*scale,rh=ih*scale,ox=(r.width-rw)/2,oy=(r.height-rh)/2;
    // Skutečný obdélník centrálního portrétu v hall-v28-gallery.webp.
    const x=716,y=276,w=184,h=294;
    godric.style.left=`${ox+x*scale}px`;godric.style.top=`${oy+y*scale}px`;
    godric.style.width=`${w*scale}px`;godric.style.height=`${h*scale}px`;
  }
  if(godric){
    positionGodric();window.addEventListener('resize',positionGodric,{passive:true});
    godric.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();found('godric')});
    godric.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();found('godric')}});
  }
})();
