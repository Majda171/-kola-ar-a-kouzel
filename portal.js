(() => {
  const STUDENT_KEY='bradavice_student_v1';
  const A=window.BradaviceAchievements,DB=window.BradaviceDB;
  const houseNames={N:'Nebelvír',H:'Havraspár',M:'Mrzimor',Z:'Zmijozel'};
  const crestNames={N:'nebelvir-erb.webp',H:'havraspar-erb.webp',M:'mrzimor-erb.webp',Z:'zmijozel-erb.webp'};
  const avatarPath=(k,house='N')=>`img/avatars/${DB?.avatarKeys?.includes(k)?k:(DB?.defaultAvatarForHouse?.(house)||'n1')}.webp`;

  document.querySelectorAll('[data-random-fall]').forEach(el=>el.addEventListener('click',()=>{el.classList.remove('falling');void el.offsetWidth;el.classList.add('falling');setTimeout(()=>el.classList.remove('falling'),1000)}));
  const cauldron=document.querySelector('.cauldron'),smoke=document.querySelector('.potion-smoke');
  if(cauldron&&smoke)cauldron.addEventListener('click',()=>{smoke.classList.remove('pop');void smoke.offsetWidth;smoke.classList.add('pop');A?.award('prvni-lektvar')});
  document.querySelectorAll('.trans-object').forEach(el=>el.addEventListener('click',()=>{el.classList.add('changed');A?.award('prvni-promena');if(el.dataset.hotspot==='true'){setTimeout(()=>el.classList.remove('changed'),650);return}const a=el.dataset.a,b=el.dataset.b;setTimeout(()=>{el.textContent=el.textContent.trim()===a?b:a;el.classList.remove('changed')},390)}));
  const dummy=document.querySelector('.practice-dummy');if(dummy)dummy.addEventListener('click',()=>{dummy.classList.remove('hit');void dummy.offsetWidth;dummy.classList.add('hit');A?.award('obrance-hradu')});
  document.querySelectorAll('.floating-candle').forEach(c=>c.addEventListener('click',()=>{c.style.left=`${10+Math.random()*80}%`;c.style.top=`${10+Math.random()*37}%`;A?.award('srdce-velke-sine')}));
  document.querySelectorAll('.flying-ball').forEach(ball=>ball.addEventListener('click',()=>{ball.classList.add('caught');setTimeout(()=>ball.classList.remove('caught'),650);if(ball.classList.contains('flying-quaffle'))A?.award('famfrpalova-hvezda')}));
  document.querySelectorAll('.real-cauldron').forEach(c=>c.addEventListener('click',()=>{c.classList.remove('bubble-pop');void c.offsetWidth;c.classList.add('bubble-pop');if(smoke){smoke.classList.remove('pop');void smoke.offsetWidth;smoke.classList.add('pop')}A?.award('prvni-lektvar')}));

  function safeStudent(){try{return JSON.parse(localStorage.getItem(STUDENT_KEY))}catch{return null}}
  function badgeCard(b,unlocked){if(!b?.img)return '';return `<article class="badge-card${unlocked?'':' locked'}" title="${b.desc}"><img src="${b.img}" alt="Odznak ${b.title}"><strong>${b.title}</strong><small>${b.desc}</small></article>`}
  function renderAvatarChoices(active,house){
    const keys=DB?.avatarKeysByHouse?.[house]||[];
    return keys.map((k,i)=>`<button class="avatar-choice${k===active?' selected':''}" type="button" data-avatar="${k}" aria-label="Profilový portrét ${i+1}"><img src="${avatarPath(k,house)}" alt="Profilový portrét ${i+1}"><span>Portrét ${i+1}</span></button>`).join('');
  }
  function bindProfileEditor(student){
    const form=document.getElementById('profileEditForm'),edit=document.getElementById('profileEditButton'),cancel=document.getElementById('profileEditCancel'),bio=document.getElementById('profileBioInput'),choices=document.getElementById('avatarChoices'),msg=document.getElementById('profileEditMessage');if(!form)return;
    const house=student.houseCode||'N';let selected=student.avatarKey||DB?.defaultAvatarForHouse?.(house)||'n1';
    const open=()=>{selected=student.avatarKey||DB?.defaultAvatarForHouse?.(house)||'n1';bio.value=student.bio||'';choices.innerHTML=renderAvatarChoices(selected,house);form.hidden=false;edit.hidden=true;bindChoices()};
    const close=()=>{form.hidden=true;edit.hidden=false;msg.textContent=''};
    const bindChoices=()=>choices.querySelectorAll('[data-avatar]').forEach(btn=>btn.addEventListener('click',()=>{selected=btn.dataset.avatar;choices.querySelectorAll('.avatar-choice').forEach(x=>x.classList.toggle('selected',x===btn))}));
    edit.onclick=open;cancel.onclick=close;
    form.onsubmit=async e=>{e.preventDefault();const save=form.querySelector('[type="submit"]');save.disabled=true;msg.textContent='Ukládám…';try{await DB.updateOwnProfile({bio:bio.value,avatarKey:selected});const fresh=safeStudent();if(fresh){student=fresh;renderProfile();}msg.textContent='Profil je uložený.';setTimeout(close,550)}catch(err){msg.textContent=err?.message?.includes('update_own_profile')?'Nejdřív spusť v Supabase soubor SUPABASE-V35-ADMIN-PROFILY-AVATARY.sql.':(err?.message||'Profil se nepodařilo uložit.')}finally{save.disabled=false}};
  }

  function renderProfile(){
    if(!document.body.classList.contains('profile-page'))return;
    const missing=document.getElementById('profileMissing'),content=document.getElementById('profileContent'),s=safeStudent();
    if(!s){missing.hidden=false;content.hidden=true;return}missing.hidden=true;content.hidden=false;
    const code=s.houseCode||'N',house=s.houseCode?(houseNames[code]||'Nerozřazen'):'Čeká na rozřazení';
    document.getElementById('profileCrest').src=`img/${crestNames[code]||crestNames.N}`;
    document.getElementById('profileAvatar').src=avatarPath(s.avatarKey,code);
    document.getElementById('profileName').textContent=`${s.firstName||''} ${s.lastName||''}`.trim();
    document.getElementById('profileHouse').textContent=s.houseCode?`${house} · ${s.year||1}. ročník`:house;
    document.getElementById('profilePoints').textContent=s.points||0;document.getElementById('profileYear').textContent=s.year||1;
    document.getElementById('profileBioText').textContent=s.bio?.trim()||'Zatím jsi o sobě nic nenapsal/a.';
    const houseInline=document.getElementById('profileHouseInline');if(houseInline)houseInline.textContent=house;
    const roomLinks={N:'Nebelvir.html',H:'Havraspar.html',M:'Mrzimor.html',Z:'Zmijozel.html'};document.getElementById('profileRoomLink').href=s.houseCode?(roomLinks[code]||'koleje.html'):'rozrazeni.html';
    bindProfileEditor(s);
    if(A){
      A.syncDerivedAchievements?.();const st=A.getState(),unlocked=st.unlocked||{},displayBadges=A.allBadges.filter(b=>b.img);
      document.getElementById('profileBadges').textContent=displayBadges.filter(b=>unlocked[b.id]).length;
      document.getElementById('achievementGrid').innerHTML=displayBadges.map(b=>badgeCard(b,Boolean(unlocked[b.id]))).join('');
      const weekly=s.houseCode?A.getWeeklyEntry(code):null,access=document.getElementById('profileAccess'),mail=document.getElementById('profileOwlMail');
      if(!s.houseCode){access.innerHTML='<strong>Rozřazení čeká</strong><p>Nejdřív dokonči rozřazovací ceremonii.</p>';if(mail)mail.innerHTML='<p>Soví pošta dorazí po rozřazení.</p>'}
      else{
        if(code==='N')access.innerHTML='<strong>Severní křídlo</strong><p>Hledej starou portrétovou stěnu a Baculatou dámu. Aktuální heslo chodí soví poštou.</p>';
        else if(code==='Z')access.innerHTML='<strong>Hluboké sklepení</strong><p>Hledej nenápadnou kamennou stěnu. Aktuální heslo chodí soví poštou.</p>';
        else if(code==='H')access.innerHTML='<strong>Věž Havraspáru</strong><p>Ke vstupu vede schodiště z horních chodeb. Aktuální heslo chodí soví poštou.</p>';
        else access.innerHTML='<strong>Nedaleko kuchyní</strong><p>Vstup je ukrytý mezi sudy a reaguje na správný rytmus poklepání.</p>';
        if(mail){
          const d=new Date(),day=(d.getDay()+6)%7,monday=new Date(d.getFullYear(),d.getMonth(),d.getDate()-day),weekId=`${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`,seenKey=`bradavice_owl_mail_seen_${code}`,seen=localStorage.getItem(seenKey)===weekId;
          const body=code==='N'?`Nové heslo k portrétu Baculaté dámy: <b>${weekly?.display||'—'}</b>`:code==='Z'?`Nové heslo ke kamenné stěně: <b>${weekly?.display||'—'}</b>`:code==='H'?`Nové heslo k orlímu klepadlu: <b>${weekly?.display||'—'}</b>`:'Prefekti připomínají: vstup hledej mezi sudy nedaleko kuchyní. Heslo se nepoužívá.';
          mail.innerHTML=`<div class="owl-mail-head"><span>${seen?'Přečtený dopis':'✦ Nová soví pošta'}</span><small>Týden od ${monday.toLocaleDateString('cs-CZ')}</small></div><button class="owl-mail-open" type="button">${seen?'Otevřít znovu':'Otevřít dopis'}</button><div class="owl-mail-letter" ${seen?'':'hidden'}><strong>Pro člena koleje ${house}</strong><p>${body}</p><small>Tento dopis je určený jen pro tvoji kolej.</small></div>`;
          const openMail=mail.querySelector('.owl-mail-open'),letter=mail.querySelector('.owl-mail-letter');openMail?.addEventListener('click',()=>{letter.hidden=false;localStorage.setItem(seenKey,weekId);openMail.textContent='Dopis otevřen';mail.querySelector('.owl-mail-head span').textContent='Přečtený dopis'});
        }
      }
      const quests=A.read(A.keys.QUEST_KEY,{})||{},done=v=>v===true||v?.done===true;
      const questRows=[
        ['find-godric','Najdi na hradě obraz Godrika Nebelvíra','Hledej v Síni slávy mezi slavnými portréty.','Obraz už jsi objevil/a.','+10 bodů'],
        ['find-three-constellations','Najdi tři souhvězdí v Astronomické věži','Každé nové pozorování začíná od 0/3. Najdi všechny tři obrazce.','Všechna tři souhvězdí byla nalezena.','+50 bodů'],
        ['prytova-herbar','Herbář Bradavic pro profesorku Prýtovou','Najdi pět rostlin při procházení školních pozemků a vrať se je odevzdat.','Herbář je kompletní a odevzdaný.','samostatný úkol'],
        ['prytova-mandragory','Minuta s mandragorami','Přijmi druhý úkol u Prýtové a za 60 sekund přesaď alespoň pět mandragor.','Mandragorová výzva je splněná.','samostatný úkol'],
        ['mcgonagall-feather','Lehké jako pírko','Promluv s profesorkou McGonagallovou a splň praktický úkol s pírkem.','Pírko jsi bezpečně zvedl/a a vrátil/a na lavici.','+10 bodů'],
        ['lupin-boggart','Praktická zkouška s bubákem','V učebně obrany otevři skříň a zvládni bubáka kouzlem Riddikulus.','Bubák byl poražen.','+20 bodů'],
        ['founders-all','Zakladatelé hradu','Najdi Godrika, Salazara, Rowenu a Helgu v různých částech hradu.','Všichni čtyři zakladatelé byli nalezeni.','odznak']
      ];
      document.getElementById('questList').innerHTML=questRows.map(([id,title,openText,doneText,reward])=>{const ok=id==='find-three-constellations'?localStorage.getItem('bradavice_astronomy_task_v42')==='done':done(quests[id]);return `<article class="quest-card ${ok?'done':''}"><div><strong>${ok?'Splněno · ':''}${title}</strong><p>${ok?doneText:openText}</p></div><span class="quest-reward">${ok?'✓':reward}</span></article>`}).join('');
      const validBadgeIds=new Set(A.allBadges.filter(b=>b.img).map(b=>b.id));const hist=(st.history||[]).filter(h=>h.type==='points'||(h.type==='badge'&&validBadgeIds.has(h.id))).slice(0,8);document.getElementById('pointsHistory').innerHTML=hist.length?hist.map(h=>h.type==='points'?`<div class="history-row"><span>${h.reason}</span><span>${Number(h.amount)>0?'+':''}${h.amount}</span></div>`:`<div class="history-row"><span>Odznak · ${A.allBadges.find(x=>x.id===h.id)?.title||h.id}</span><span>✦</span></div>`).join(''):'<div class="history-row"><span>Zatím bez záznamu</span><span>—</span></div>';
    }
  }
  if(document.body.classList.contains('profile-page')){(async()=>{if(DB?.client)await DB.hydrateAll();renderProfile()})();window.addEventListener('bradavice:progress-synced',renderProfile);window.addEventListener('bradavice:profile-updated',renderProfile);document.getElementById('logoutLink')?.addEventListener('click',async e=>{e.preventDefault();await DB?.signOut();location.href='index.html'})}
  document.querySelectorAll('.defense-hotspot').forEach(el=>el.addEventListener('click',()=>{el.classList.remove('activated');void el.offsetWidth;el.classList.add('activated');setTimeout(()=>el.classList.remove('activated'),780);if(el.dataset.defense==='sigil')A?.award('tajemstvi-hradu',{silent:true})}));
  document.querySelectorAll('.quidditch-player').forEach(p=>p.addEventListener('click',()=>{p.classList.remove('swoop');void p.offsetWidth;p.classList.add('swoop');setTimeout(()=>p.classList.remove('swoop'),800)}));
  const sceneToast=message=>{if(!message)return;let box=document.querySelector('.scene-toast');if(!box){box=document.createElement('div');box.className='scene-toast';document.body.appendChild(box)}box.textContent=message;box.classList.remove('show');void box.offsetWidth;box.classList.add('show');clearTimeout(sceneToast.timer);sceneToast.timer=setTimeout(()=>box.classList.remove('show'),2600)};
  document.querySelectorAll('.scene-prop').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();const action=el.dataset.propAction||'nudge',cls=`react-${action}`;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),900);sceneToast(el.dataset.message||'Předmět zareagoval na dotyk.');if(el.classList.contains('prop-potions-red'))A?.award('prvni-lektvar');if(el.classList.contains('prop-defense-sword'))A?.award('obrance-hradu');if(el.classList.contains('prop-quidditch-broom'))A?.award('famfrpalova-hvezda')}));
})();


/* v27 — Velká síň: 3 poklepání na stůl přivolají hostinu. Stav se neukládá. */
(() => {
  const scene=document.getElementById('greatHallScene');
  const table=document.getElementById('hallTableTap');
  if(!scene||!table)return;
  const countEl=document.getElementById('hallTapCount');
  const food=[...document.querySelectorAll('.hall-food-hotspot')];
  let taps=0,resetTimer=null,feast=false,audioCtx=null;

  function ctx(){
    try{if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();return audioCtx}catch{return null}
  }
  function knockSound(){
    const c=ctx();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(150,c.currentTime);o.frequency.exponentialRampToValueAtTime(95,c.currentTime+.07);g.gain.setValueAtTime(.11,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.09);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.1)
  }
  function chimeSound(){
    const c=ctx();if(!c)return;[660,880,1100].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.045,c.currentTime+i*.025);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.5+i*.05);o.connect(g).connect(c.destination);o.start(c.currentTime+i*.025);o.stop(c.currentTime+.55+i*.05)})
  }
  function showCount(){
    if(!countEl)return;countEl.textContent=taps===1?'První klepnutí':taps===2?'Druhé klepnutí':'';countEl.classList.add('show');setTimeout(()=>countEl.classList.remove('show'),600)
  }
  function summon(){
    feast=true;clearTimeout(resetTimer);table.disabled=true;scene.classList.add('feast-summoning');chimeSound();
    setTimeout(()=>scene.classList.add('feast-visible'),180);
    setTimeout(()=>{scene.classList.remove('feast-summoning');food.forEach(f=>f.hidden=false)},1050);
    window.BradaviceAchievements?.award('srdce-velke-sine');
  }
  table.addEventListener('click',e=>{
    if(feast)return;e.preventDefault();taps++;knockSound();table.classList.remove('knock');void table.offsetWidth;table.classList.add('knock');showCount();
    if(taps===2){scene.classList.add('second-knock');chimeSound();setTimeout(()=>scene.classList.remove('second-knock'),480)}
    if(taps>=3){summon();return}
    clearTimeout(resetTimer);resetTimer=setTimeout(()=>{taps=0;if(countEl)countEl.classList.remove('show')},1700)
  });
  food.forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    if(el.classList.contains('food-cake')){el.classList.add('vanish');chimeSound();return}
    if(el.classList.contains('food-goblet')){el.classList.remove('chime');void el.offsetWidth;el.classList.add('chime');chimeSound();return}
    el.classList.remove('wobble');void el.offsetWidth;el.classList.add('wobble');knockSound();
  }));
})();
