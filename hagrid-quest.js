(() => {
  const DB=window.BradaviceDB;
  if(!DB?.client)return;
  let status={accepted:false,found:0,completed:false,rewarded:false,ids:[]};
  const toast=(t)=>{let x=document.querySelector('.quest-toast');if(!x){x=document.createElement('div');x.className='quest-toast';document.body.appendChild(x)}x.textContent=t;x.classList.remove('show');void x.offsetWidth;x.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove('show'),2200)};
  const get=async()=>{try{status=await DB.hagridStatus();return status}catch(e){console.warn(e);return status}};
  const syncNifflers=()=>document.querySelectorAll('[data-niffler-id]').forEach(b=>{const id=b.dataset.nifflerId;b.classList.toggle('is-hidden',!status.accepted||status.rewarded||status.ids?.includes(id))});
  const openDialog=async()=>{
    await get();
    let d=document.getElementById('hagridQuestDialog');
    if(!d){d=document.createElement('div');d.id='hagridQuestDialog';d.className='quest-dialog';document.body.appendChild(d)}
    const found=Number(status.found||0);
    const done=Boolean(status.rewarded);
    d.innerHTML=`<section class="quest-card"><p class="quest-kicker">Hagridův úkol</p><h2>${done?'Hrabáci jsou doma':'Pět zatoulaných hrabáků'}</h2><p>${done?'„Ještě jednou díky. Bez tebe bych je hledal až do Vánoc.“':'„Rozuteklo se mi po škole pět hrabáků. Jsou malí, rychlí a lezou hlavně tam, kde se něco leskne. Pomůžeš mi je všechny najít?“'}</p>${status.accepted&&!done?`<div class="quest-progress">Nalezeno: <strong>${found} / 5</strong></div>`:''}<div class="quest-actions">${!status.accepted&&!done?'<button class="primary" data-q="accept">Přijmout úkol</button><button data-q="close">Teď ne</button>':status.accepted&&!done&&found<5?'<button data-q="close">Budu hledat dál</button>':status.accepted&&!done&&found>=5?'<button class="primary" data-q="return">Vrátit hrabáky Hagridovi</button><button data-q="close">Ještě chvíli</button>':'<button data-q="close">Zavřít</button>'}</div></section>`;
    d.hidden=false;
    d.querySelector('[data-q="close"]')?.addEventListener('click',()=>d.hidden=true);
    d.querySelector('[data-q="accept"]')?.addEventListener('click',async()=>{try{await DB.hagridAccept();status=await DB.hagridStatus();syncNifflers();d.hidden=true;toast('Úkol přijat · najdi 5 hrabáků')}catch(e){toast('Nejdřív spusť SUPABASE-V40-KOMPLET.sql')}});
    d.querySelector('[data-q="return"]')?.addEventListener('click',async()=>{try{const rewarded=await DB.hagridReturn();status=await DB.hagridStatus();syncNifflers();d.hidden=true;toast(rewarded?'+50 bodů pro tvoji kolej':'Odměna už byla vyzvednuta')}catch(e){toast(e?.message||'Hrabáky se nepodařilo odevzdat')}});
    d.addEventListener('click',e=>{if(e.target===d)d.hidden=true},{once:true});
  };
  document.querySelector('.hagrid-questgiver')?.addEventListener('click',openDialog);
  if(location.hash==='#quest')setTimeout(()=>openDialog(),140);
  document.querySelectorAll('[data-niffler-id]').forEach(b=>b.addEventListener('click',async()=>{
    if(!status.accepted){toast('Nejdřív přijmi Hagridův úkol.');return}
    try{const n=await DB.hagridFind(b.dataset.nifflerId);b.classList.add('is-found');setTimeout(()=>b.classList.add('is-hidden'),520);status=await DB.hagridStatus();toast(`Hrabák nalezen · ${n} / 5${n===5?' · vrať se k Hagridovi':''}`)}catch(e){toast(e?.message||'Hrabák utekl.')}
  }));
  get().then(()=>syncNifflers());
})();
