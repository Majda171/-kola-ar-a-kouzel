(()=>{
  const open=document.getElementById('openPotionBrew'),sceneCauldron=document.getElementById('scenePotionCauldron'),teacher=document.getElementById('snapeCharacterButton'),modal=document.getElementById('potionBrewModal');if(!open||!modal)return;
  const close=document.getElementById('potionBrewClose'),memory=document.getElementById('recipeMemory'),game=document.getElementById('brewGame'),outcome=document.getElementById('brewOutcome'),shelf=document.getElementById('ingredientShelf'),recipeName=document.getElementById('brewRecipeName'),recipeSteps=document.getElementById('brewRecipeSteps'),timerEl=document.getElementById('brewTimer'),hideBtn=document.getElementById('hideRecipeNow'),snape=document.getElementById('snapeComment'),seq=document.getElementById('brewSequence'),stepCount=document.getElementById('brewStepCount'),status=document.getElementById('brewStatus'),result=document.getElementById('brewResult'),cauldron=document.getElementById('brewCauldron'),reset=document.getElementById('brewReset');
  const DB=window.BradaviceDB,A=window.BradaviceAchievements;
  const ING={
    mandragora:['Mandragora','mandragora.webp'],kridla:['Křídla víly','kridla-vily.webp'],kridlaHmyzu:['Křídla hmyzu','kridla-hmyzu.webp'],pelynek:['Pelyněk','pelynek.webp'],bezoar:['Bezoár','bezoar.webp'],omej:['Oměj','omej.webp'],asfodel:['Kořen asfodelu','asfodelovy-koren.webp'],fazolky:['Fazolky','fazolky.webp'],belladonna:['Belladonna','belladonna.webp'],kozlik:['Kořen kozlíku','koren-kozlika.webp'],pijavice:['Pijavice','pijavice.webp'],mesicni:['Měsíční prášek','mesicni-prasek.webp'],hadi:['Hadí kůže','hadi-kuze.webp'],krvavy:['Krvavý extrakt','krvavy-extrakt.webp'],sliz:['Magický sliz','sliz.webp'],kostni:['Kostní prášek','kostni-prasek.webp'],roh:['Drcený roh','roh.webp'],semena:['Stříbrná semena','semena-stribrne.webp'],listy:['Sušené listy','susene-listy.webp'],plod:['Sušený plod','suseny-plod.webp']
  };
  const recipes=[
    {id:'uklidnujici',name:'Uklidňující odvar',result:'zeleny.webp',steps:[['i','fazolky'],['i','fazolky'],['r'],['r'],['i','pelynek'],['h'],['i','bezoar'],['f']]},
    {id:'mnoholicny',name:'Mnoholičný lektvar',result:'temne-zeleny.webp',steps:[['i','hadi'],['i','pijavice'],['r'],['r'],['i','sliz'],['i','mandragora'],['l'],['h'],['f']]},
    {id:'probuzeni',name:'Lektvar probuzení',result:'jantarovy.webp',steps:[['i','kozlik'],['i','mesicni'],['l'],['l'],['i','kridlaHmyzu'],['h'],['r'],['f']]},
    {id:'peprovy',name:'Pepřový lektvar',result:'cerveny.webp',steps:[['i','plod'],['i','plod'],['r'],['r'],['r'],['i','listy'],['h'],['f']]},
    {id:'zapomneni',name:'Lektvar zapomnění',result:'modry.webp',steps:[['i','belladonna'],['i','asfodel'],['l'],['l'],['i','mesicni'],['l'],['h'],['f']]},
    {id:'pravdomluvnost',name:'Lektvar pravdomluvnosti',result:'ledovy.webp',steps:[['i','semena'],['i','mesicni'],['r'],['i','kozlik'],['r'],['i','kridla'],['h'],['f']]},
    {id:'sila',name:'Lektvar síly',result:'kourovy.webp',steps:[['i','roh'],['i','kostni'],['i','mandragora'],['r'],['r'],['r'],['h'],['f']]},
    {id:'spanek',name:'Spánkový lektvar',result:'fialovy.webp',steps:[['i','asfodel'],['i','pelynek'],['i','kozlik'],['l'],['l'],['l'],['h'],['f']]},
    {id:'stesti',name:'Lektvar štěstí',result:'ruzovy.webp',steps:[['i','kridla'],['i','semena'],['i','mesicni'],['r'],['l'],['r'],['h'],['f']]},
    {id:'protijed',name:'Protijed',result:'tyrkysovy.webp',steps:[['i','bezoar'],['i','listy'],['i','belladonna'],['l'],['r'],['i','omej'],['h'],['f']]},
    {id:'jasna-mysl',name:'Lektvar jasné mysli',result:'ledovy.webp',steps:[['i','mesicni'],['i','semena'],['l'],['i','kozlik'],['r'],['r'],['i','asfodel'],['h'],['f']]},
    {id:'obnova',name:'Obnovující tonikum',result:'jantarovy.webp',steps:[['i','listy'],['i','kozlik'],['i','kozlik'],['r'],['i','bezoar'],['l'],['h'],['f']]},
    {id:'soustredeni',name:'Elixír soustředění',result:'modry.webp',steps:[['i','pelynek'],['i','mesicni'],['r'],['l'],['r'],['i','semena'],['i','kridlaHmyzu'],['h'],['f']]},
    {id:'odvaha',name:'Lektvar odvahy',result:'cerveny.webp',steps:[['i','roh'],['i','fazolky'],['r'],['r'],['i','krvavy'],['l'],['i','mandragora'],['h'],['f']]},
    {id:'stribrny-tonik',name:'Stříbrný tonik',result:'tyrkysovy.webp',steps:[['i','semena'],['i','semena'],['l'],['i','kridla'],['r'],['i','bezoar'],['r'],['h'],['f']]}
  ];
  const labels={r:'Zamíchat doprava',l:'Zamíchat doleva',h:'Zahřát kotlík',f:'Dokončit lektvar'};
  const successComments=['„Přijatelné. Nečekal jsem, že recept skutečně dodržíte.“','„Správná barva, správná konzistence. Tentokrát jste nic nezničil/a.“','„Kupodivu použitelný lektvar. Zapamatujte si, že přesnost není volitelná.“','„Tentokrát bez katastrofy. Pokrok, byť nepatrný.“'];
  const failComments=['„Výtečně. Z přesného receptu jste dokázal/a vyrobit břečku.“','„Tohle není lektvar. Tohle je důvod, proč se u kotlíku dává pozor.“','„Jediný špatný krok stačil. Kotlík si vaše improvizace pamatovat nebude, já ano.“','„Břečka. A ještě k tomu drahá břečka.“'];
  let recipe=null,index=0,history=[],timer=null,seconds=30,failed=false,brewing=false;
  const actionKey=(type,id)=>type==='i'?`i:${id}`:type;
  const stepKey=s=>s[0]==='i'?`i:${s[1]}`:s[0];
  const stepLabel=s=>s[0]==='i'?`Přidat: ${ING[s[1]][0]}`:labels[s[0]];
  const setControlsDisabled=v=>{shelf.querySelectorAll('button').forEach(b=>b.disabled=v);document.querySelectorAll('[data-brew-action]').forEach(b=>b.disabled=v)};
  function pickRecipe(){
    // Poslední recept ukládáme trvale, aby se stejný lektvar neobjevil dvakrát po sobě
    // ani po obnovení stránky nebo novém otevření hry.
    const key='bradavice_last_potion_recipe_v41';
    let lastId=null;try{lastId=localStorage.getItem(key)}catch{}
    const pool=recipes.filter(r=>r.id!==lastId);
    const chosen=pool[Math.floor(Math.random()*pool.length)]||recipes[0];
    try{localStorage.setItem(key,chosen.id)}catch{}
    return chosen;
  }
  function buildShelf(){
    const used=[...new Set(recipe.steps.filter(s=>s[0]==='i').map(s=>s[1]))];
    const all=Object.keys(ING),extras=all.filter(x=>!used.includes(x)).sort(()=>Math.random()-.5).slice(0,Math.max(4,10-used.length));
    const ids=[...used,...extras].sort(()=>Math.random()-.5);
    shelf.innerHTML=ids.map(id=>`<button class="ingredient-card" type="button" data-ingredient="${id}"><img src="img/potions-v40/ingredients/${ING[id][1]}" alt="${ING[id][0]}"><span>${ING[id][0]}</span></button>`).join('');
    shelf.querySelectorAll('[data-ingredient]').forEach(b=>b.addEventListener('click',()=>act('i',b.dataset.ingredient)));
  }
  function showRecipe(){
    memory.hidden=false;game.hidden=true;outcome.hidden=true;seconds=30;timerEl.textContent=seconds;brewing=false;setControlsDisabled(true);
    const grouped=[];for(const st of recipe.steps){const key=stepKey(st),prev=grouped[grouped.length-1];if(prev&&prev.key===key){prev.count++}else grouped.push({key,step:st,count:1})}
    recipeSteps.innerHTML=grouped.map(x=>`<li>${x.count>1?`${x.count}× `:''}${stepLabel(x.step)}</li>`).join('');
    snape.textContent='„Třicet sekund. Potom recept zmizí. Kdo si nepamatuje postup, nemá co dělat u kotlíku.“';
    clearInterval(timer);timer=setInterval(()=>{seconds--;timerEl.textContent=Math.max(0,seconds);if(seconds<=0)beginBrew()},1000);
  }
  function beginBrew(){if(brewing)return;brewing=true;clearInterval(timer);timer=null;memory.hidden=true;game.hidden=false;outcome.hidden=true;setControlsDisabled(false);snape.textContent='„Recept je pryč. Teď se ukáže, jestli jste četl/a, nebo jen zíral/a na pergamen.“'}
  function start(){clearInterval(timer);recipe=pickRecipe();index=0;history=[];failed=false;recipeName.textContent=recipe.name;seq.textContent='Zatím žádný krok.';stepCount.textContent=`0 / ${recipe.steps.length}`;status.textContent='';result.innerHTML='';buildShelf();showRecipe()}
  function pulse(){cauldron.classList.add('active');setTimeout(()=>cauldron.classList.remove('active'),650)}
  function act(type,id=''){
    if(!brewing||failed||index>=recipe.steps.length)return;const got=actionKey(type,id),expected=stepKey(recipe.steps[index]);history.push(type==='i'?ING[id][0]:labels[type]);seq.textContent=history.join(' → ');pulse();
    if(got!==expected){fail(recipe.steps[index],type,id);return}
    index++;stepCount.textContent=`${index} / ${recipe.steps.length}`;
    if(index===recipe.steps.length){success();return}
    snape.textContent=index===1?'„První krok. Neoslavujte předčasně.“':index>recipe.steps.length-3?'„Ještě pár kroků. Teď bývají studenti nejnepozornější.“':'„Pokračujte.“';
  }
  function localPenalty(amount){
    try{
      const key='bradavice_student_v1',student=JSON.parse(localStorage.getItem(key)||'null');if(!student?.houseCode)return -amount;
      student.points=Math.max(0,Number(student.points||0)-amount);localStorage.setItem(key,JSON.stringify(student));
      const hk=`bradavice_house_points_v2_${student.houseCode}`,hp=Number(localStorage.getItem(hk)||0);localStorage.setItem(hk,String(Math.max(0,hp-amount)));
      const stateKey=A?.scopedKey?.(A?.keys?.STATE_KEY||'bradavice_achievements_v2')||'bradavice_achievements_v2',st=JSON.parse(localStorage.getItem(stateKey)||'{"unlocked":{},"history":[]}');st.history=st.history||[];st.history.unshift({type:'points',amount:-amount,reason:'Profesor lektvarů – zkažený lektvar',at:new Date().toISOString()});localStorage.setItem(stateKey,JSON.stringify(st));DB?.updateStudentHud?.(student);return -amount;
    }catch{return -amount}
  }
  async function applyPenalty(){
    const weighted=[5,5,5,5,10,10,10,15,15,20,20,25,30,35,40,45,50];const fallback=weighted[Math.floor(Math.random()*weighted.length)];
    try{if(DB?.client&&DB?.snapePenalty){const delta=Number(await DB.snapePenalty());if(Number.isFinite(delta)&&delta<0)return delta}}catch(e){console.warn('Snape penalty DB:',e)}
    return localPenalty(fallback);
  }
  async function fail(expected,type,id){
    failed=true;setControlsDisabled(true);const expectedText=stepLabel(expected),got=type==='i'?`Přidat: ${ING[id][0]}`:labels[type];game.hidden=true;outcome.hidden=false;result.innerHTML='<div class="slop">☁ BŘEČKA ☁</div>';status.textContent=`Chyba. Mělo následovat „${expectedText}“, ale udělal/a jsi „${got}“. Uvařil/a jsi břečku.`;snape.textContent=failComments[Math.floor(Math.random()*failComments.length)];
    const delta=await applyPenalty(),student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})(),house=student?.house||'kolej';
    const penalty=document.createElement('strong');penalty.className='snape-penalty';penalty.textContent=` ${delta} bodů pro ${house}.`;snape.appendChild(penalty);status.textContent+=` Profesor strhl ${Math.abs(delta)} bodů.`;
  }
  async function success(){
    failed=false;setControlsDisabled(true);game.hidden=true;outcome.hidden=false;result.innerHTML=`<img src="img/potions-v40/results/${recipe.result}" alt="${recipe.name}">`;status.textContent=`Správně. ${recipe.name} je hotový bez jediné chyby.`;snape.textContent=successComments[Math.floor(Math.random()*successComments.length)];
    try{await DB?.claimV40Activity?.('brew-first-potion');await DB?.submitTournamentScore?.('potions-cup',100)}catch(e){console.warn(e)}A?.award?.('prvni-lektvar',{silent:true});const perfectBrews=A?.recordCounter?.('perfect-brews',1)||0;if(perfectBrews>=3)A?.award?.('mistr-lektvaru');
  }
  document.querySelectorAll('[data-brew-action]').forEach(b=>b.addEventListener('click',()=>{const m={'stir-right':'r','stir-left':'l',heat:'h',finish:'f'};act(m[b.dataset.brewAction])}));
  hideBtn.addEventListener('click',beginBrew);reset.addEventListener('click',start);
  const openGame=()=>{modal.hidden=false;document.body.style.overflow='hidden';start()};open.addEventListener('click',openGame);sceneCauldron?.addEventListener('click',openGame);teacher?.addEventListener('click',openGame);
  function shut(){clearInterval(timer);timer=null;modal.hidden=true;document.body.style.overflow=''}close.addEventListener('click',shut);modal.addEventListener('click',e=>{if(e.target===modal)shut()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)shut()});if(location.hash==='#vareni')setTimeout(()=>open.click(),150);
})();
