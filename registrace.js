const form = document.getElementById('registrationForm');
const successPanel = document.getElementById('successPanel');
const successTitle = document.getElementById('successTitle');
const successText = document.getElementById('successText');

const fields = {
  firstName: document.getElementById('firstName'),
  lastName: document.getElementById('lastName'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  passwordConfirm: document.getElementById('passwordConfirm'),
  consent: document.getElementById('consent')
};

function setError(name, message) {
  const error = document.getElementById(`${name}Error`);
  if (error) error.textContent = message;
  const field = fields[name];
  if (field && field.type !== 'checkbox') field.setAttribute('aria-invalid', message ? 'true' : 'false');
}
function clearErrors(){['salutation','firstName','lastName','email','password','passwordConfirm','consent'].forEach(n=>setError(n,''));}
function normaliseName(value){return value.trim().replace(/\s+/g,' ');}
function validate(){
  clearErrors(); let valid=true;
  const salutation=form.querySelector('input[name="salutation"]:checked');
  const firstName=normaliseName(fields.firstName.value), lastName=normaliseName(fields.lastName.value);
  const email=fields.email.value.trim().toLowerCase(), password=fields.password.value, passwordConfirm=fields.passwordConfirm.value;
  if(!salutation){setError('salutation','Vyberte oslovení, které se použije v přijímacím dopise.');valid=false;}
  if(firstName.length<2){setError('firstName','Zadejte jméno alespoň o 2 znacích.');valid=false;}
  if(lastName.length<2){setError('lastName','Zadejte příjmení alespoň o 2 znacích.');valid=false;}
  if(!fields.email.validity.valid||!email){setError('email','Zadejte platnou e-mailovou adresu.');valid=false;}
  const strongPassword=password.length>=12 && /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(password) && /[a-záčďéěíňóřšťúůýž]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž]/.test(password);
  if(!strongPassword){setError('password','Použij alespoň 12 znaků, malé i velké písmeno, číslo a speciální znak.');valid=false;}
  if(passwordConfirm!==password){setError('passwordConfirm','Hesla se neshodují.');valid=false;}
  if(!fields.consent.checked){setError('consent','Pro registraci je potřeba souhlas potvrdit.');valid=false;}
  return {valid,data:{salutation:salutation?.value||'',firstName,lastName,email,password}};
}
function showSuccess(student){
  form.hidden=true; successPanel.hidden=false;
  const titlePrefix=student.salutation==='slečna'?'slečno':'pane';
  successTitle.textContent=`Vítejte, ${student.firstName}`;
  successText.textContent=`Registrace byla přijata, ${titlePrefix} ${student.lastName}. Studentský účet je uložený v Bradavické databázi.`;
  try{sessionStorage.setItem('bradavice_acceptance_student',JSON.stringify(student));}catch{}
  successPanel.scrollIntoView({behavior:'smooth',block:'center'});
}
function authErrorMessage(error){
  const raw=String(error?.message||'').toLowerCase();
  if(raw.includes('duplicate student name')) return 'Student s tímto jménem a příjmením už je registrován. Zvol jiné jméno nebo kontaktuj správce.';
  if(raw.includes('already')||raw.includes('registered')) return 'Student s tímto e-mailem už existuje. Použijte přihlášení.';
  if(raw.includes('password')) return 'Heslo nesplňuje požadavky databáze. Zkuste silnější heslo.';
  if(raw.includes('email')) return 'E-mail se nepodařilo použít. Zkontrolujte jeho správnost.';
  return 'Registraci se nepodařilo uložit do databáze. Zkontrolujte připojení a zkuste to znovu.';
}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const result=validate();
  if(!result.valid){const firstInvalid=form.querySelector('[aria-invalid="true"], input:invalid');firstInvalid?.focus();return;}
  const submitButton=form.querySelector('.submit-button');
  submitButton.disabled=true; submitButton.querySelector('span:first-child').textContent='Zapisuji studenta…';
  try{
    if(!window.BradaviceDB?.client) throw new Error('Supabase není dostupný');
    const data=await window.BradaviceDB.signUp(result.data);
    if(!data?.session){
      throw new Error('Registrace vznikla, ale není aktivní relace. Zkontrolujte, že je v Supabase vypnuté Confirm email.');
    }
    const student=await window.BradaviceDB.hydrateAll();
    if(!student) throw new Error('Profil studenta se nepodařilo načíst.');
    showSuccess(student);
  }catch(error){
    console.error(error);
    submitButton.disabled=false; submitButton.querySelector('span:first-child').textContent='Potvrdit registraci';
    const msg=authErrorMessage(error);
    const raw=String(error?.message||'').toLowerCase();
    if(raw.includes('duplicate student name')){setError('firstName',msg);setError('lastName',msg);}
    else if(raw.includes('already')) setError('email',msg);
    else alert(msg);
  }
});

form.querySelectorAll('input').forEach(input=>{
  input.addEventListener('input',()=>{if(input.name&&input.name!=='salutation')setError(input.name,'');});
  input.addEventListener('change',()=>{if(input.name==='salutation')setError('salutation','');if(input.name==='consent')setError('consent','');});
});
document.querySelectorAll('.toggle-password').forEach(button=>button.addEventListener('click',()=>{
  const input=document.getElementById(button.dataset.target),show=input.type==='password';
  input.type=show?'text':'password';button.textContent=show?'Skrýt':'Zobrazit';button.setAttribute('aria-label',show?'Skrýt heslo':'Zobrazit heslo');
}));
