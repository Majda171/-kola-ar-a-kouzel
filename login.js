const form=document.getElementById('studentLogin');
const msg=document.getElementById('loginMessage');
form.addEventListener('submit',async e=>{
  e.preventDefault(); msg.textContent='';
  const email=document.getElementById('loginEmail').value.trim().toLowerCase();
  const password=document.getElementById('loginPassword').value;
  const button=form.querySelector('.login-submit');
  button.disabled=true; button.textContent='Otevírám bránu…';
  try{
    if(!window.BradaviceDB?.client) throw new Error('Databázové připojení není dostupné.');
    await window.BradaviceDB.signIn(email,password);
    const student=await window.BradaviceDB.hydrateAll();
    if(!student) throw new Error('Profil studenta se nepodařilo načíst.');
    const access=await window.BradaviceDB.getAccessState();
    if(access?.banned){window.location.href='vylouceni.html';return;}
    const next=new URLSearchParams(location.search).get('next');
    window.location.href=student.sortingCompleted?(next||'hrad.html'):'rozrazeni.html';
  }catch(error){
    console.error(error);
    const raw=String(error?.message||'').toLowerCase();
    if(raw.includes('invalid login')||raw.includes('invalid credentials')) msg.textContent='E-mail nebo heslo není správné.';
    else msg.textContent='Přihlášení se nepodařilo. Zkontrolujte připojení a zkuste to znovu.';
    button.disabled=false; button.textContent='Vstoupit do Bradavic';
  }
});
