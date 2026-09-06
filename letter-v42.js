(()=>{
  const DB=window.BradaviceDB;
  const shell=document.querySelector('.magic-letter-shell');
  const close=document.querySelector('.magic-letter-close');
  if(!shell)return;
  function safeStudent(){try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}}
  async function student(){let s=safeStudent();if(s?.lastName)return s;try{s=await DB?.hydrateStudent?.();return s||safeStudent()}catch{return s}}
  function salutation(s){const isMiss=String(s?.salutation||'').toLocaleLowerCase('cs-CZ').includes('sle');const last=String(s?.lastName||'').trim()||'studente';return `${isMiss?'Vážená slečno':'Vážený pane'} ${last},`}
  async function fill(){const s=await student();document.querySelectorAll('[data-letter-salutation]').forEach(el=>el.textContent=salutation(s));document.querySelectorAll('[data-letter-lastname]').forEach(el=>el.textContent=String(s?.lastName||'').trim()||'student')}
  fill();
  shell.classList.add('opening');setTimeout(()=>shell.classList.remove('opening'),800);
  close?.addEventListener('click',()=>{
    if(shell.classList.contains('closing'))return;shell.classList.add('closing');
    setTimeout(async()=>{
      const mode=document.body.dataset.letterMode;
      if(mode==='acceptance'){location.replace('rozrazeni.html');return}
      if(mode==='expulsion'){try{await DB?.signOut?.()}catch{}location.replace('index.html');return}
      shell.hidden=true;
    },980);
  });
})();
