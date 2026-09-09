(()=>{
  const harp=document.getElementById('philosopherHarpFind');if(!harp)return;
  const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
  const sid=String(student?.supabaseUserId||student?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
  const KEY=`bradavice_inventory_harp_v4363_${sid}`;
  const owned=()=>localStorage.getItem(KEY)==='owned';
  if(owned())harp.hidden=true;
  harp.addEventListener('click',e=>{e.stopPropagation();if(owned()){harp.hidden=true;return}localStorage.setItem(KEY,'owned');harp.classList.add('found');window.BradaviceAchievements?.toast?.('Našel/a jsi starou harfu. Uložil/a sis ji do výbavy.');window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true});setTimeout(()=>harp.hidden=true,650)});
})();
