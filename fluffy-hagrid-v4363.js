(()=>{
  const params=new URLSearchParams(location.search);if(params.get('chloupek')!=='utekl')return;
  const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
  const sid=String(student?.supabaseUserId||student?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
  const key=`bradavice_fluffy_hint_v4363_${sid}`;localStorage.setItem(key,'seen');
  let d=document.getElementById('fluffyAdviceDialog');if(!d){d=document.createElement('div');d.id='fluffyAdviceDialog';d.className='quest-dialog';document.body.appendChild(d)}
  d.innerHTML=`<section class="quest-card"><p class="quest-kicker">Hagridova rada</p><h2>„Chloupek, jo?“</h2><p>„Ty ses hnal, jako by ti za patami hořelo. Jestli jde o Chloupka, pamatuj si jednu věc: <strong>když hraje hudba, usne</strong>. Jakmile je zase ticho, probudí se. Budeš potřebovat něco, na co se dá hrát — a pak být rychlý/á.“</p><div class="quest-actions"><button class="primary" data-q="close">Rozumím</button></div></section>`;
  d.hidden=false;d.querySelector('[data-q="close"]')?.addEventListener('click',()=>{d.hidden=true;history.replaceState(null,'',location.pathname)});d.addEventListener('click',e=>{if(e.target===d)d.hidden=true},{once:true});
})();
