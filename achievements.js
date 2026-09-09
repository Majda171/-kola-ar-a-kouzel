(() => {
  // v42.2: starý v25 reset byl odstraněn — aktualizace nesmí mazat lokální postup studenta.
  const STUDENT_KEY='bradavice_student_v1';
  const STATE_KEY='bradavice_achievements_v2';
  const VISITS_KEY='bradavice_location_visits_v1';
  const QUEST_KEY='bradavice_quests_v1';
  const GHOST_KEY='bradavice_ghosts_seen_v1';
  const ACTIVITY_KEY='bradavice_activity_count_v1';
  const CONSTELLATION_KEY='bradavice_constellations_v1';
  const COUNTER_KEY='bradavice_achievement_counters_v4363';
  const DB=window.BradaviceDB;

  const coreBadges=[
    {id:'prvni-kroky',title:'První kroky',desc:'Dokonči registraci a rozřazení.',img:'img/badge-prvni-kroky.webp'},
    {id:'novy-domov',title:'Nový domov',desc:'Poprvé vstup do své společenské místnosti.',img:'img/badge-novy-domov.webp'},
    {id:'prvni-body',title:'První body',desc:'Získej alespoň 10 bodů pro svou kolej.',img:'img/badge-prvni-body.webp'},
    {id:'zvidavy-student',title:'Zvídavý student',desc:'Navštiv alespoň 5 různých míst.',img:'img/badge-zvidavy-student.webp'},
    {id:'pruzkumnik-bradavic',title:'Průzkumník Bradavic',desc:'Navštiv všechny hlavní lokace hradu a pozemků.',img:'img/badge-pruzkumnik-bradavic.webp'},
    {id:'tajemstvi-hradu',title:'Tajemství hradu',desc:'Objev první skrytou interakci.',img:'img/badge-tajemstvi-hradu.webp'},
    {id:'godrikuv-nalezce',title:'Godrikův nálezce',desc:'Najdi na hradě obraz Godrika Nebelvíra.',img:'img/badge-godrikuv-nalezce.webp'},
    {id:'mistnost-se-ukazala',title:'Místnost se ukázala',desc:'Objev Komnatu nejvyšší potřeby.',img:'img/badge-mistnost-se-ukazala.webp'},
    {id:'lechtiva-hruska',title:'Lechtivá hruška',desc:'Objev vstup do kuchyně.',img:'img/badge-lechtiva-hruska.webp'},
    {id:'nocni-pozorovatel',title:'Noční pozorovatel',desc:'Najdi všechna tři skrytá souhvězdí v Astronomické věži.',img:'img/badge-nocni-pozorovatel.webp'},
    {id:'rocnikova-zkouska',title:'Ročníková zkouška',desc:'Úspěšně dokonči první ročníkovou zkoušku.',img:'img/badge-rocnikova-zkouska.webp'},
  ];

  const bonusBadges=[
    {id:'ctyri-zakladatele',title:'Zakladatelé hradu',desc:'Najdi portréty všech čtyř zakladatelů Bradavic.',img:'img/badge-zakladatele-v42.webp'},
    {id:'prvni-lektvar',title:'První lektvar',desc:'Probuď kotlík v učebně lektvarů.',img:'img/badge-prvni-lektvar.webp'},
    {id:'prvni-promena',title:'První proměna',desc:'Proveď první proměnu v učebně přeměňování.',img:'img/badge-prvni-promena.webp'},
    {id:'obrance-hradu',title:'Obránce hradu',desc:'Zvládni Lupinovu praktickou zkoušku s bubákem.',img:'img/badge-obrance-hradu.webp'},
    {id:'famfrpalova-hvezda',title:'Famfrpálová hvězda',desc:'Pošli camrál směrem k obručím.',img:'img/badge-famfrpalova-hvezda.webp'},
    {id:'pritel-duchu',title:'Přítel duchů',desc:'Spatři všech pět potulných duchů.',img:'img/badge-pritel-duchu.webp'},
    {id:'srdce-velke-sine',title:'Srdce Velké síně',desc:'Rozhýbej plovoucí svíčku ve Velké síni.',img:'img/badge-srdce-velke-sine.webp'},
    {id:'strazce-koleje',title:'Strážce koleje',desc:'Vrať se do své společenské místnosti vícekrát.',img:'img/badge-strazce-koleje.webp'},
    {id:'znalec-hesel',title:'Znalec hesel',desc:'Úspěšně projdi vstupem na heslo.',img:'img/badge-znalec-hesel.webp'},
    {id:'orli-hadanka',title:'Orlí hádanka',desc:'Správně odpověz na otázku orlího klepadla.',img:'img/badge-orli-hadanka.webp'},
    {id:'rytmus-sudu',title:'Rytmus sudů',desc:'Zaklepej správný rytmus na mrzimorské sudy.',img:'img/badge-rytmus-sudu.webp'},
    {id:'dama-otevrela',title:'Dáma otevřela',desc:'Přesvědč Baculatou dámu správným heslem.',img:'img/badge-dama-otevrela.webp'},
    {id:'septane-heslo',title:'Šeptané heslo',desc:'Odhal skrytý zmijozelský průchod.',img:'img/badge-septane-heslo.webp'},
    {id:'herbarnik',title:'Herbářník',desc:'Dokonči Herbář profesorky Prýtové a odevzdej všech pět vzorků.',img:'img/badge-herbarnik.webp'},
    {id:'mandragorovy-pestitel',title:'Mandragorový pěstitel',desc:'Úspěšně dokonči minutovou výzvu s přesazováním mandragor.',img:'img/badge-mandragorovy-pestitel.webp'},
    {id:'sachovy-mistr',title:'Šachový mistr',desc:'Vyhraj pět kouzelnických šachových partií.',img:'img/badge-sachovy-mistr.webp'},
    {id:'mistr-lektvaru',title:'Mistr lektvarů',desc:'Uvař několik lektvarů bez jediné chyby.',img:'img/badge-mistr-lektvaru.webp'},
    {id:'mistr-premen',title:'Mistr přeměn',desc:'Zvládni pokročilé úkoly z přeměňování.',img:'img/badge-mistr-premen.webp'},
    {id:'pritel-hagrida',title:'Přítel Hagrida',desc:'Dokonči Hagridův úkol.',img:'img/badge-pritel-hagrida.webp'},
    {id:'jezerni-badatel',title:'Jezerní badatel',desc:'Objev tajemství Černého jezera.',img:'img/badge-jezerni-badatel.webp'},
    {id:'prvni-test',title:'První test',desc:'Dokonči první školní test.',img:'img/badge-prvni-test.webp'},
    {id:'bystra-mysl',title:'Bystrá mysl',desc:'Prokaž výborné znalosti napříč školními testy.',img:'img/badge-bystra-mysl.webp'},
    {id:'bez-jedine-chyby',title:'Bez jediné chyby',desc:'Dokonči školní test na 100 %.',img:'img/badge-bez-jedine-chyby.webp'},
    {id:'pilny-student',title:'Pilný student',desc:'Absolvuj všechny hlavní předmětové testy.',img:'img/badge-pilny-student.webp'},
    {id:'s-vyznamenanim',title:'S vyznamenáním',desc:'Dosáhni výborného výsledku v ročníkové zkoušce.',img:'img/badge-s-vyznamenanim.webp'},
    {id:'opora-koleje',title:'Opora koleje',desc:'Nasbírej 50 osobních bodů.',img:'img/badge-opora-koleje.webp'},
    {id:'sto-bodu',title:'Sto bodů',desc:'Dosáhni 100 osobních bodů.',img:'img/badge-sto-bodu.webp'},
    {id:'legenda-koleje',title:'Legenda koleje',desc:'Dosáhni vysokého dlouhodobého bodového milníku.',img:'img/badge-legenda-koleje.webp'},
    {id:'kolejni-hlas',title:'Kolejní hlas',desc:'Zapoj se do kolejního chatu.',img:'img/badge-kolejni-hlas.webp'},
  ];

  const allBadges=[...coreBadges,...bonusBadges];
  const coreIds=new Set(coreBadges.map(b=>b.id));
  const byId=Object.fromEntries(allBadges.map(b=>[b.id,b]));
  const locationPages=new Set(['hrad.html','koleje.html','nebelvir-spolecenska.html','nebelvir-loznice.html','havraspar-spolecenska.html','havraspar-loznice.html','mrzimor-spolecenska.html','mrzimor-loznice.html','zmijozel-spolecenska.html','zmijozel-loznice.html','ucebna-lektvaru.html','ucebna-premenovani.html','ucebna-obrany.html','velka-sin.html','famfrpal.html','skleniky.html','astronomicka-vez.html','kuchyne.html','zapovezeny-les.html','hagriduv-dum.html','vrba-mlaticka.html','jezero.html','nadvori.html','chodby.html','chodby-schody.html','chodby-portretni-galerie.html','chodby-stara-galerie.html','chodby-podzemni-1.html','chodby-podzemni-2.html','chodby-horni.html','sin-slavy.html','komnata-nejvyssi-potreby.html','hagriduv-dum-uvnitr.html','tajemna-cesta.html','tajemna-komnata.html','knihovna.html']);
  const privatePageHouse={
    'nebelvir-spolecenska.html':'N','nebelvir-loznice.html':'N',
    'havraspar-spolecenska.html':'H','havraspar-loznice.html':'H',
    'mrzimor-spolecenska.html':'M','mrzimor-loznice.html':'M',
    'zmijozel-spolecenska.html':'Z','zmijozel-loznice.html':'Z'
  };
  const explorerPages=['ucebna-lektvaru.html','ucebna-premenovani.html','ucebna-obrany.html','velka-sin.html','famfrpal.html','skleniky.html','astronomicka-vez.html','kuchyne.html','zapovezeny-les.html','hagriduv-dum.html','vrba-mlaticka.html','jezero.html','nadvori.html','chodby.html','chodby-schody.html','chodby-portretni-galerie.html','chodby-stara-galerie.html','chodby-podzemni-1.html','chodby-podzemni-2.html','chodby-horni.html','sin-slavy.html','komnata-nejvyssi-potreby.html','hagriduv-dum-uvnitr.html','knihovna.html'];

  function read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch{return fallback}}
  function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
  function getStudent(){return read(STUDENT_KEY,null)}
  function saveStudent(s){write(STUDENT_KEY,s)}
  function studentScopeId(){const s=getStudent();return String(s?.supabaseUserId||s?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_')}
  function scopedKey(base){const id=studentScopeId();return id==='guest'?base:`${base}_${id}`}
  function state(){const s=read(scopedKey(STATE_KEY),{unlocked:{},history:[]});s.unlocked||={};s.history||=[];return s}
  function saveState(v){write(scopedKey(STATE_KEY),v);write(STATE_KEY,v)}
  function counters(){return read(scopedKey(COUNTER_KEY),{})||{}}
  function recordCounter(id,delta=1){const c=counters();c[id]=Math.max(0,Number(c[id]||0)+Number(delta||0));write(scopedKey(COUNTER_KEY),c);return c[id]}
  function toast(title,extra=''){
    let box=document.querySelector('.achievement-toast');
    if(!box){box=document.createElement('div');box.className='achievement-toast';document.body.append(box)}
    box.innerHTML=`<span>✦</span><div><strong>${title}</strong>${extra?`<small>${extra}</small>`:''}</div>`;
    box.classList.remove('show');void box.offsetWidth;box.classList.add('show');setTimeout(()=>box.classList.remove('show'),3600)
  }
  function award(id,{silent=false,skipMaster=false}={}){
    if(!byId[id]) return false;
    const st=state();if(st.unlocked[id])return false;
    const now=new Date().toISOString();
    st.unlocked[id]=now;st.history.unshift({type:'badge',id,at:now});saveState(st);

    // Každý nově získaný základní odznak přidá 5 skutečných bodů studentovi i jeho koleji.
    const student=getStudent();
    if(coreIds.has(id) && student?.houseCode && !DB?.client){
      student.points=Number(student.points||0)+5;saveStudent(student);
      const hk=`bradavice_house_points_v2_${student.houseCode}`;
      const oldHouse=parseInt(localStorage.getItem(hk),10);
      localStorage.setItem(hk,String((Number.isFinite(oldHouse)?oldHouse:0)+5));
      const st2=state();st2.history.unshift({type:'points',amount:5,reason:`Odznak: ${byId[id].title}`,at:now});saveState(st2);
      if(student.points>=10)award('prvni-body',{silent:true});
    }
    if(DB?.client){DB.unlockAchievement(id).catch(err=>console.warn('Odznak se nepodařilo synchronizovat s databází:',id,err));}
    if(!silent) toast(`Nový odznak: ${byId[id].title}`,coreIds.has(id)?'+5 bodů pro kolej':'Bonusový odznak');
    if(!skipMaster)checkMaster();return true
  }
  function isUnlocked(id){return Boolean(state().unlocked[id])}
  function addPoints(amount,reason='Úkol'){
    const s=getStudent();if(!s||!s.houseCode)return false;
    s.points=Number(s.points||0)+Number(amount||0);saveStudent(s);
    const hk=`bradavice_house_points_v2_${s.houseCode}`;const old=parseInt(localStorage.getItem(hk),10);localStorage.setItem(hk,String((Number.isFinite(old)?old:0)+Number(amount||0)));
    const st=state();st.history.unshift({type:'points',amount:Number(amount||0),reason,at:new Date().toISOString()});saveState(st);
    if(s.points>=10)award('prvni-body',{silent:true});
    toast(`+${amount} bodů pro ${s.house||'kolej'}`,reason);return true
  }
  function questDone(value){return value===true || value?.done===true}
  function completeQuest(id,{points=0,badgeId=null,title='Úkol splněn',syncDb=true}={}){
    const q=read(scopedKey(QUEST_KEY),{})||{};
    if(questDone(q[id])){
      // Starší verze mohly uložit splnění bez odznaku. Doplň ho, ale body podruhé nepřičítej.
      if(badgeId) award(badgeId,{silent:true});
      return false;
    }
    q[id]={done:true,at:new Date().toISOString()};write(scopedKey(QUEST_KEY),q);write(QUEST_KEY,q);
    if(syncDb&&DB?.client){DB.completeQuest(id).catch(err=>console.warn('Úkol se nepodařilo synchronizovat s databází:',id,err));}
    if(points)addPoints(points,title);
    if(badgeId)award(badgeId);
    return true
  }
  function markVisit(page){
    if(!locationPages.has(page))return;
    const requiredHouse=privatePageHouse[page];
    if(requiredHouse && getStudent()?.houseCode!==requiredHouse) return;
    const v=read(scopedKey(VISITS_KEY),{});v[page]=v[page]||new Date().toISOString();write(scopedKey(VISITS_KEY),v);write(VISITS_KEY,v);
    if(DB?.client){DB.visitLocationByPage(page).catch(err=>console.warn('Návštěva lokace se nepodařila synchronizovat:',page,err));}
    const count=Object.keys(v).filter(p=>locationPages.has(p)).length;
    if(count>=5)award('zvidavy-student',{silent:true});
    if(explorerPages.every(p=>v[p]))award('pruzkumnik-bradavic',{silent:true});
  }
  function recordActivity(){const k=scopedKey(ACTIVITY_KEY),n=(parseInt(localStorage.getItem(k),10)||0)+1;localStorage.setItem(k,String(n));return n}
  function recordGhost(key){const k=scopedKey(GHOST_KEY),g=read(k,{});g[key]=true;write(k,g);write(GHOST_KEY,g);if(Object.keys(g).length>=5)award('pritel-duchu',{silent:true})}
  function checkMaster(){return false}

  // Oprava starších uložených stavů: odznaky se dopočítají z bodů a již splněných úkolů.
  // Díky tomu student o odznak nepřijde ani po aktualizaci webu nebo pokud už měl úkol splněný v předchozí verzi.
  function syncDerivedAchievements(){
    const s=getStudent();
    if(s?.sortingCompleted) award('prvni-kroky',{silent:true});
    const pts=Number(s?.points||0);
    if(pts>=10) award('prvni-body',{silent:true});

    const quests=read(scopedKey(QUEST_KEY),{})||{};
    if(questDone(quests['find-godric'])) award('godrikuv-nalezce',{silent:true});
    if(questDone(quests['find-three-constellations'])) award('nocni-pozorovatel',{silent:true});

    const visits=read(scopedKey(VISITS_KEY),{})||{};
    const visitCount=Object.keys(visits).filter(p=>locationPages.has(p)).length;
    if(visitCount>=5) award('zvidavy-student',{silent:true});
    if(explorerPages.every(p=>visits[p])) award('pruzkumnik-bradavic',{silent:true});

    const ghosts=read(scopedKey(GHOST_KEY),{})||{};
    if(Object.keys(ghosts).length>=5) award('pritel-duchu',{silent:true});
    if(questDone(quests['prytova-herbar'])) award('herbarnik',{silent:true});
    if(questDone(quests['prytova-mandragory'])) award('mandragorovy-pestitel',{silent:true});
    if(pts>=50) award('opora-koleje',{silent:true});
    if(pts>=100) award('sto-bodu',{silent:true});
    if(pts>=250) award('legenda-koleje',{silent:true});
    const c=counters();if(Number(c['chess-wins']||0)>=5)award('sachovy-mistr',{silent:true});if(Number(c['perfect-brews']||0)>=3)award('mistr-lektvaru',{silent:true});if(Number(c['transfigurations']||0)>=6)award('mistr-premen',{silent:true});
    checkMaster();
  }

  function weekIndex(){const d=new Date(),day=(d.getDay()+6)%7;const monday=new Date(d.getFullYear(),d.getMonth(),d.getDate()-day);return Math.floor(monday.getTime()/604800000)}
  const weekly={
    N:[
      {display:'Nimbulus Nimbletonia',answers:['Nimbulus Nimbletonia']},{display:'Šarlatový plášť',answers:['Šarlatový plášť']},{display:'Zlatý lev',answers:['Zlatý lev']},{display:'Ohnivý pohár',answers:['Ohnivý pohár']},{display:'Dračí dech',answers:['Dračí dech']},{display:'Rudá jiskra',answers:['Rudá jiskra']}
    ],
    Z:[
      {display:'Bezoár',answers:['Bezoár']},{display:'Stříbrný had',answers:['Stříbrný had']},{display:'Noční stín',answers:['Noční stín']},{display:'Smaragd',answers:['Smaragd']},{display:'Černé jezero',answers:['Černé jezero']},{display:'Hadí jazyk',answers:['Hadí jazyk']}
    ],
    H:[
      {prompt:'Co je vždy před tebou, ale nikdy to nemůžeš vidět?',answers:['Budoucnost','Tvoje budoucnost']},
      {prompt:'Co je lehčí než pírko, ale ani nejsilnější člověk to dlouho neudrží?',answers:['Dech','Svůj dech']},
      {prompt:'Čím víc z ní bereš, tím je větší. Co je to?',answers:['Díra','Dira']},
      {prompt:'Co patří tobě, ale ostatní to používají častěji než ty?',answers:['Jméno','Tvoje jméno','Mé jméno']},
      {prompt:'Co může naplnit celou místnost, ale nezabere žádné místo?',answers:['Světlo']},
      {prompt:'Když mě vyslovíš, zničíš mě. Co jsem?',answers:['Ticho']}
    ]
  };
  function getWeeklyEntry(code){const arr=weekly[code]||[];return arr.length?arr[Math.abs(weekIndex())%arr.length]:null}

  function injectStyles(){if(document.getElementById('achievement-runtime-style'))return;const s=document.createElement('style');s.id='achievement-runtime-style';s.textContent=`
  .achievement-toast{position:fixed;z-index:9999;right:22px;bottom:22px;display:flex;gap:12px;align-items:center;max-width:330px;padding:14px 17px;border:1px solid rgba(220,190,115,.55);background:rgba(9,11,9,.95);color:#efe4c7;box-shadow:0 18px 45px #000;transform:translateY(22px);opacity:0;pointer-events:none;transition:.35s;font-family:Georgia,serif}.achievement-toast.show{transform:none;opacity:1}.achievement-toast>span{font-size:1.45rem;color:#d7b458}.achievement-toast strong{display:block;font-family:Cinzel,Georgia,serif;font-size:.76rem;text-transform:uppercase;letter-spacing:.08em}.achievement-toast small{display:block;margin-top:3px;color:#bdae8d;font-size:.78rem}`;document.head.append(s)}

  function currentPage(){return location.pathname.split('/').pop()||'index.html'}
  injectStyles();
  markVisit(currentPage());
  syncDerivedAchievements();

  window.BradaviceAchievements={coreBadges,bonusBadges,allBadges,award,isUnlocked,addPoints,completeQuest,markVisit,recordActivity,recordGhost,toast,getState:state,getStudent,getWeeklyEntry,read,write,syncDerivedAchievements,recordCounter,studentScopeId,scopedKey,keys:{STATE_KEY,VISITS_KEY,QUEST_KEY,GHOST_KEY,CONSTELLATION_KEY,COUNTER_KEY}};
})();
