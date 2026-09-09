(()=>{
  const teacher=document.getElementById('mcgonagallTeacher'),feather=document.getElementById('transfigurationFeather'),modal=document.getElementById('transfigurationTaskModal');if(!teacher||!feather||!modal)return;
  const close=document.getElementById('transfigurationTaskClose'),accept=document.getElementById('transfigurationTaskAccept'),text=document.getElementById('transfigurationTaskText');
  const KEY='bradavice_mcgonagall_feather_v42';
  const sk=()=>window.BradaviceAchievements?.scopedKey?.(KEY)||KEY;
  const load=()=>{try{return{accepted:false,done:false,...JSON.parse(localStorage.getItem(sk())||'{}')}}catch{return{accepted:false,done:false}}};
  const save=s=>{localStorage.setItem(sk(),JSON.stringify(s));localStorage.setItem(KEY,JSON.stringify(s))};let state=load(),flying=false;
  function render(){state=load();if(state.done){text.textContent='„Přesné, klidné a bez zbytečného mávání. Tak má základní kouzlo vypadat.“';accept.textContent='Úkol splněn';accept.disabled=true;accept.classList.add('done')}else if(state.accepted){text.textContent='„Úkol platí. Rozpohybujte pírko na přední lavici a vraťte ho bezpečně na stejné místo.“';accept.textContent='Úkol přijat';accept.disabled=true}else{accept.disabled=false;accept.classList.remove('done');accept.textContent='Přijmout úkol'}}
  function show(){render();modal.hidden=false;document.body.style.overflow='hidden'}function hide(){modal.hidden=true;document.body.style.overflow=''}
  teacher.addEventListener('click',show);close.addEventListener('click',hide);modal.addEventListener('click',e=>{if(e.target===modal)hide()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)hide()});
  accept.addEventListener('click',()=>{state=load();state.accepted=true;save(state);render();hide();setTimeout(()=>feather.focus(),120)});
  feather.addEventListener('click',async()=>{if(flying)return;flying=true;feather.classList.remove('is-flying');void feather.offsetWidth;feather.classList.add('is-flying');state=load();if(state.accepted&&!state.done){state.done=true;save(state);setTimeout(async()=>{let dbHandled=false;try{const pts=await window.BradaviceDB?.claimV42Activity?.('mcgonagall-feather',1);dbHandled=Number.isFinite(Number(pts))}catch(e){console.warn('McGonagallová v42 DB:',e)}window.BradaviceAchievements?.completeQuest?.('mcgonagall-feather',{points:dbHandled?0:10,badgeId:'prvni-promena',title:'McGonagallová · lehké jako pírko',syncDb:!dbHandled});},3100)}setTimeout(()=>{feather.classList.remove('is-flying');flying=false},4700)});


  // v43.5.6 — samostatná praktická přeměna krysy a poháru na lavici.
  const transfigureObject=document.getElementById('transfigurationRatGoblet');
  const transfigureImage=document.getElementById('transfigurationRatGobletImage');
  const transfigureNote=document.getElementById('transfigurationRatGobletNote');
  if(transfigureObject&&transfigureImage){
    let objectClicks=0,objectBusy=false,noteTimer=null;
    const forms={
      rat:{src:'img/transfiguration-rat-v4356.webp',alt:'Krysa na lavici',next:'pohár'},
      goblet:{src:'img/transfiguration-goblet-v4356.webp',alt:'Pohár na lavici',next:'krysu'}
    };
    const note=t=>{if(!transfigureNote)return;clearTimeout(noteTimer);transfigureNote.textContent=t;transfigureNote.classList.add('show');noteTimer=setTimeout(()=>transfigureNote.classList.remove('show'),1100)};
    const setForm=form=>{const f=forms[form];transfigureObject.dataset.form=form;transfigureImage.src=f.src;transfigureImage.alt=f.alt;transfigureObject.setAttribute('aria-label',`${f.alt}. Třikrát klikni pro přeměnu v ${f.next}.`)};
    transfigureObject.addEventListener('click',()=>{
      if(objectBusy)return;
      objectClicks++;
      if(objectClicks<3){
        transfigureObject.classList.remove('is-tapped');void transfigureObject.offsetWidth;transfigureObject.classList.add('is-tapped');
        note(`${objectClicks} / 3`);
        return;
      }
      objectClicks=0;objectBusy=true;
      const next=transfigureObject.dataset.form==='rat'?'goblet':'rat';
      transfigureObject.classList.remove('is-tapped');transfigureObject.classList.add('is-transforming');
      note('Přeměna…');
      setTimeout(()=>setForm(next),470);
      setTimeout(()=>{transfigureObject.classList.remove('is-transforming');objectBusy=false;note(next==='goblet'?'Krysa se změnila v pohár':'Pohár se změnil v krysu');const n=window.BradaviceAchievements?.recordCounter?.('transfigurations',1)||0;if(n>=6)window.BradaviceAchievements?.award?.('mistr-premen')},960);
    });
  }
})();
