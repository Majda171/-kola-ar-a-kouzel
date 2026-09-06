(() => {
 const DB=window.BradaviceDB,form=document.getElementById('adminLoginForm'),msg=document.getElementById('adminLoginMessage');
 const show=(t,ok=false)=>{msg.textContent=t;msg.classList.toggle('ok',ok)};
 async function already(){try{const u=await DB?.getUser();if(u&&await DB.isAdmin()){location.replace('admin.html')}}catch{}}
 already();
 form.addEventListener('submit',async e=>{e.preventDefault();show('Ověřuji přístup…');const email=document.getElementById('adminEmail').value.trim(),password=document.getElementById('adminPassword').value;const btn=form.querySelector('button');btn.disabled=true;try{await DB.signIn(email,password);if(!(await DB.isAdmin())){await DB.signOut();show('Účet je platný, ale nemá administrátorské oprávnění (nebo ještě není spuštěná v34 SQL migrace).');return}show('Přístup povolen.',true);location.replace('admin.html')}catch(err){show(err?.message||'Přihlášení se nezdařilo.')}finally{btn.disabled=false}});
})();
