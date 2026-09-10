(()=>{
  const btn=document.getElementById('hagridDragonEvent');
  const img=document.getElementById('hagridDragonImage');
  if(!btn||!img)return;
  const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
  const sid=String(student?.supabaseUserId||student?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
  const KEY=`bradavice_hagrid_dragon_v4369_${sid}`;
  const assets=[
    {src:'img/dragon-egg-whole-v4369.webp',alt:'Dračí vejce'},
    {src:'img/dragon-egg-cracked-v4369.webp',alt:'Praskající dračí vejce'},
    {src:'img/dragon-baby-v4369.webp',alt:'Čerstvě vylíhnutý dráček'}
  ];
  let stage=Math.max(0,Math.min(2,Number(localStorage.getItem(KEY)||0)));
  function render(animate=false){
    const a=assets[stage];img.src=a.src;img.alt=a.alt;
    btn.classList.toggle('hatched',stage===2);
    btn.setAttribute('aria-label',stage===0?'Prohlédnout dračí vejce':stage===1?'Dotknout se praskajícího dračího vejce':'Vylíhnutý dráček');
    btn.disabled=stage===2;
    if(animate){btn.classList.remove('crack');void btn.offsetWidth;btn.classList.add('crack');setTimeout(()=>btn.classList.remove('crack'),520)}
  }
  btn.addEventListener('click',()=>{
    if(stage>=2)return;
    stage++;
    try{localStorage.setItem(KEY,String(stage))}catch{}
    render(stage===1);
  });
  render(false);
})();


// v43.6.12 — růžový deštník: kliknutí vyšle jiskry
(()=>{
  const btn=document.getElementById('hagridUmbrellaEvent');
  if(!btn)return;
  let lock=false;
  btn.addEventListener('click',()=>{
    if(lock)return;
    lock=true;
    btn.classList.add('is-casting');
    const count=20;
    for(let i=0;i<count;i++){
      const p=document.createElement('span');
      p.className='umbrella-spark';
      const angle=(-125+(250/(count-1))*i)+(Math.random()*20-10);
      const dist=45+Math.random()*85;
      const rad=angle*Math.PI/180;
      p.style.setProperty('--sx',`${Math.cos(rad)*dist}px`);
      p.style.setProperty('--sy',`${Math.sin(rad)*dist}px`);
      p.style.left=`${62+Math.random()*18}%`;
      p.style.top=`${21+Math.random()*16}%`;
      p.style.animationDelay=`${Math.random()*90}ms`;
      btn.appendChild(p);
      setTimeout(()=>p.remove(),900);
    }
    setTimeout(()=>{btn.classList.remove('is-casting');lock=false},760);
  });
})();
