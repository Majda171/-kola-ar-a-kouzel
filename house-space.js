(() => {
  const house = document.body.dataset.house;
  const type = document.body.dataset.space;
  const STUDENT_KEY='bradavice_student_v1';
  const dashboards={N:'Nebelvir.html',H:'Havraspar.html',M:'Mrzimor.html',Z:'Zmijozel.html'};
  const names={N:'Nebelvír',H:'Havraspár',M:'Mrzimor',Z:'Zmijozel'};
  const otherPages={
    N:{lounge:'nebelvir-spolecenska.html',bedroom:'nebelvir-loznice.html'},
    H:{lounge:'havraspar-spolecenska.html',bedroom:'havraspar-loznice.html'},
    M:{lounge:'mrzimor-spolecenska.html',bedroom:'mrzimor-loznice.html'},
    Z:{lounge:'zmijozel-spolecenska.html',bedroom:'zmijozel-loznice.html'}
  };
  const readStudent=()=>{try{return JSON.parse(localStorage.getItem(STUDENT_KEY))}catch{return null}};
  async function ensureAccess(){
    let student=readStudent();
    if((!student || student.houseCode!==house) && window.BradaviceDB?.client){
      try{student=await window.BradaviceDB.hydrateStudent()}catch{}
    }
    const ok=Boolean(student && student.houseCode===house);
    document.body.classList.remove('loading');
    document.body.classList.add('access-ready');
    if(!ok){
      document.body.classList.add('house-locked');
      const houseName=document.getElementById('lockedHouseName');
      if(houseName) houseName.textContent=names[house]||'této koleje';
    }
  }
  ensureAccess();

  const dashboard=document.getElementById('houseDashboard');
  if(dashboard) dashboard.href=dashboards[house]||'koleje.html';
  const switchLink=document.getElementById('switchSpace');
  if(switchLink){
    const target=type==='lounge'?'bedroom':'lounge';
    switchLink.href=otherPages[house]?.[target]||dashboards[house];
    switchLink.textContent=target==='bedroom'?'Do ložnice':'Do společenské místnosti';
  }

  const toast=document.getElementById('magicToast');
  let timer;
  function say(text){
    if(!toast)return;
    toast.textContent=text;toast.classList.add('show');
    clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),2800);
  }

  document.querySelectorAll('.interactive-prop').forEach(prop=>{
    prop.addEventListener('click',()=>{
      const action=prop.dataset.action||'glow';
      prop.classList.remove('glow','shake');void prop.offsetWidth;
      if(action==='chest'){
        const img=prop.querySelector('img');
        const open=prop.dataset.open==='1';
        img.src=open?'img/prop-chest-closed.webp':'img/prop-chest-open.webp';
        prop.dataset.open=open?'0':'1';
        prop.classList.add('glow');
      }else if(action==='mandrake'){
        prop.classList.add('shake');
      }else{
        prop.classList.add(action==='shake'?'shake':'glow');
      }
      say(prop.dataset.message||'Něco v místnosti zareagovalo na tvou hůlku.');
      try{localStorage.setItem(`bradavice_house_interaction_v30_${house}_${type}_${prop.dataset.id||action}`,'1')}catch{}
    });
  });
})();
