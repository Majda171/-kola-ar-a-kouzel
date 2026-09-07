(() => {
  const STUDENT_KEY = 'bradavice_student_v1';
  const A = window.BradaviceAchievements;
  const houseCode = document.body.dataset.house;
  if (!houseCode) return;

  const config = {
    N: {
      name:'Nebelvír', entry:'prihlaseniNeb.html',
      motto:'Odvaha se nepozná podle toho, zda máme strach, ale podle toho, co uděláme navzdory němu.',
      prefect:'Před večerkou prosím vraťte vypůjčené šachy ke krbu. A kdo znovu nechal plášť přes opěradlo mého křesla, ať si ho raději vyzvedne dřív, než zmizí.',
      challenge:'Oslov někoho, koho běžně míjíš, a udělej dnes jednu věc, do které se ti nechce jen proto, že z ní máš respekt.',
      poll:{q:'Který kout společenské místnosti je nejlepší?',opts:['Křesla u krbu','Stůl u oken','Schody do ložnic']},
      notes:[
        ['Trénink soubojového klubu dnes po večeři. Přijďte včas — a bez výmluv.','Oliver'],
        ['Našla jsem u krbu červený šál. Nechala jsem ho na opěradle nejbližšího křesla.','Katie'],
        ['Kdo chce večer zkusit kouzelnické šachy? Sháním někoho, kdo mě konečně porazí.','Fred']
      ],
      chronicle:[['★','Výhra v kolejním kvízu','Nebelvír získal pět bodů za dnešní večerní soutěž.'],['✦','Nový rekord','Nejrychlejší dokončení knihovnické hádanky tohoto týdne.'],['⚔','Soubojový klub','Ve čtvrtek proběhne další společný trénink.']]
    },
    H: {
      name:'Havraspár', entry:'prihlaseniHavraspar.html',
      motto:'Ne všechno, co stojí za nalezení, má odpověď napsanou na první stránce.',
      prefect:'Na parapetu ve východním výklenku zůstaly poznámky ke starodávným runám. Autor si je může vyzvednout — ovšem až po zodpovězení otázky na obálce.',
      challenge:'Najdi dnes odpověď na otázku, kterou sis nikdy nepoložil/a. Pokud možno ne tu, kterou lze vyřešit prvním výsledkem v knihovně.',
      poll:{q:'Co by mělo přibýt ve věži?',opts:['Další hvězdná mapa','Stůl na společné studium','Polička s hádankami']},
      notes:[
        ['Ve věži zůstala kniha o runách s modrou záložkou. Je u třetího okna.','Luna'],
        ['Dnešní hádanka na nástěnce má víc než jedno správné řešení. Ano, opravdu.','Padma'],
        ['Pozorování oblohy začíná ve 21:15. Kdo má dalekohled, vezměte ho s sebou.','Anthony']
      ],
      chronicle:[['✦','Hádanka týdne','Tři studenti našli alternativní řešení orlí otázky.'],['☾','Noční pozorování','Ve středu se věž otevře pro společné pozorování oblohy.'],['⌁','Kronika věže','Do archivu přibyla nová sada poznámek ke starým runám.']]
    },
    M: {
      name:'Mrzimor', entry:'prihlaseniMrzimor.html',
      motto:'Velké věci často vzniknou z drobných skutků, které někdo udělá poctivě každý den.',
      prefect:'Na stole u kulatého okna je čerstvý čaj. Hrnek po sobě vraťte, sušenky jsou pro všechny a poslední člověk dnes večer zhasíná lampy.',
      challenge:'Udělej dnes něco užitečného, aniž bys čekal/a, že si toho někdo všimne. Přesně takhle se získávají ty nejpoctivější body.',
      poll:{q:'Co má být příště na společném stole?',opts:['Medové sušenky','Jablečný koláč','Teplé skořicové rohlíčky']},
      notes:[
        ['Kdo si nechal učebnici bylinkářství u zadního stolku? Mám ji u sebe.','Susan'],
        ['V kuchyni prý dnes zbyly koláčky. Neříkám, že tam máme jít. Jen informuji.','Ernie'],
        ['Prosím nezalévejte rostlinu u dveří dvakrát. Už se nám začíná mstít.','Hannah']
      ],
      chronicle:[['❦','Bylinkářská výzva','Mrzimor získal body za nejlepší péči o školní skleník.'],['✦','Pomoc spolužákům','Dnešní studijní skupina byla zapsána do kolejní kroniky.'],['☕','Večerní setkání','V pátek se u kulatých oken koná kolejní večer.']]
    },
    Z: {
      name:'Zmijozel', entry:'prihlaseniZmijozel.html',
      motto:'Nestačí vědět, kam chceš dojít. Důležité je všimnout si cesty, kterou ostatní přehlédli.',
      prefect:'Večer bude část místnosti u oken vyhrazena pro přípravu na lektvary. Pokud si chcete zachovat obočí, nenechávejte své přísady bez dozoru.',
      challenge:'Vyber si jeden konkrétní cíl na dnešek a dokonči ho dřív, než začneš další. Rozhodnost má cenu jen tehdy, když vede k výsledku.',
      poll:{q:'Která část sklepení má nejlepší atmosféru?',opts:['Okna pod hladinou','Kožená křesla','Výklenek u krbu']},
      notes:[
        ['Ve 20:30 se scházíme kvůli přípravě na lektvary. Přineste si vlastní poznámky.','Daphne'],
        ['Někdo nechal na stole stříbrnou sponu. Je u krbu, než se rozhodne změnit majitele sama.','Blaise'],
        ['Potřebuji parťáka na procvičení neverbálních kouzel. Jen někdo, kdo se umí soustředit.','Theodore']
      ],
      chronicle:[['◇','Lektvarová výzva','Nejvyšší hodnocení týdne putovalo do Zmijozelu.'],['♜','Strategický večer','V sobotu proběhne další turnaj v kouzelnických šachách.'],['✦','Kolejní kronika','Nový zápis připomíná úspěch v poslední školní soutěži.']]
    }
  }[houseCode];

  const $ = (s) => document.querySelector(s);
  const student = (() => { try { return JSON.parse(localStorage.getItem(STUDENT_KEY)) || null; } catch { return null; } })();
  const isMember = Boolean(student && student.houseCode === houseCode);
  if(isMember){
    A?.award('novy-domov');
    const visitKey=`bradavice_room_visits_v1_${houseCode}_${student.email||'student'}`;
    const visits=(parseInt(localStorage.getItem(visitKey),10)||0)+1;localStorage.setItem(visitKey,String(visits));
    if(visits>=3)A?.award('strazce-koleje',{silent:true});
  }
  const fullName = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '';
  const initials = student ? `${(student.firstName || '?')[0] || '?'}${(student.lastName || '')[0] || ''}`.toUpperCase() : '—';

  $('#roomHouseName').textContent = config.name;
  $('#roomMotto').textContent = config.motto;
  $('#exitRoom').href = config.entry;
  $('#prefectText').textContent = config.prefect;
  $('#challengeText').textContent = config.challenge;

  const status = $('#roomAccessStatus');
  if (isMember) {
    status.textContent = `Vítej zpět, ${student.firstName}.`;
    status.classList.remove('visitor-badge');
    status.classList.add('room-welcome');
  } else {
    status.textContent = 'Návštěvnický režim · nástěnka a body jsou dostupné členům koleje';
  }

  $('#studentSeal').textContent = initials;
  $('#studentName').textContent = fullName || 'Návštěvník';
  $('#studentMeta').textContent = isMember ? `${student.year || 1}. ročník · ${config.name}` : 'Bez kolejního zápisu';
  $('#studentPoints').textContent = isMember ? (student.points || 0) : '—';

  // Soukromé kolejní lokace — odkazy fungují pouze členům právě této koleje.
  document.querySelectorAll('[data-private-house-link]').forEach(link=>{
    if(!isMember){
      link.classList.add('locked');
      link.setAttribute('aria-disabled','true');
      link.title='Tato místnost je přístupná pouze členům této koleje.';
      link.addEventListener('click',e=>e.preventDefault());
    }
  });

  // Message board
  const boardKey = `bradavice_board_v1_${houseCode}`;
  const board = $('#noteBoard');
  const addButton = $('#addNoteButton');
  const form = $('#noteForm');
  const textarea = $('#noteText');
  const count = $('#noteCount');

  addButton.disabled = !isMember;
  if (!isMember) addButton.title = 'Vzkazy mohou připínat pouze členové této koleje.';

  function seedNotes(){
    return config.notes.map((n,i)=>({id:`seed-${houseCode}-${i}`,text:n[0],author:n[1],owner:'',createdAt:new Date(Date.now()-(i+1)*86400000).toISOString(),seed:true}));
  }
  function loadNotes(){
    try {
      const data = JSON.parse(localStorage.getItem(boardKey));
      return Array.isArray(data) ? data : seedNotes();
    } catch { return seedNotes(); }
  }
  let notes = loadNotes();
  function saveNotes(){ localStorage.setItem(boardKey,JSON.stringify(notes)); }
  if (!localStorage.getItem(boardKey)) saveNotes();

  function dateLabel(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('cs-CZ',{day:'numeric',month:'numeric'});
  }
  function renderNotes(){
    board.innerHTML='';
    if (!notes.length) { board.innerHTML='<p class="board-empty">Nástěnka je zatím prázdná.</p>'; return; }
    notes.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).forEach((note,index)=>{
      const el=document.createElement('article');
      el.className='note';
      el.style.setProperty('--tilt',`${[-1.6,.8,-.5,1.4,-1,.4][index%6]}deg`);
      const p=document.createElement('p');p.className='note-text';p.textContent=note.text;
      const meta=document.createElement('p');meta.className='note-meta';meta.textContent=`${note.author} · ${dateLabel(note.createdAt)}`;
      el.append(p,meta);
      if(isMember && note.owner && note.owner === student.email){
        const del=document.createElement('button');del.className='note-delete';del.type='button';del.setAttribute('aria-label','Sundat vlastní vzkaz');del.textContent='×';
        del.addEventListener('click',()=>{notes=notes.filter(n=>n.id!==note.id);saveNotes();renderNotes();});
        el.append(del);
      }
      board.append(el);
    });
  }
  renderNotes();
  addButton.addEventListener('click',()=>{ if(!isMember)return; form.hidden=!form.hidden; if(!form.hidden) textarea.focus(); });
  textarea.addEventListener('input',()=>{count.textContent=`${textarea.value.length}/220`;});
  form.addEventListener('submit',(e)=>{
    e.preventDefault(); if(!isMember)return;
    const text=textarea.value.trim(); if(!text)return;
    notes.push({id:`note-${Date.now()}`,text:text.slice(0,220),author:student.firstName || 'Student',owner:student.email || '',createdAt:new Date().toISOString()});
    saveNotes(); textarea.value=''; count.textContent='0/220'; form.hidden=true; renderNotes();  A?.recordActivity();
  });

  // House cup / points
  const basePoints={N:0,H:0,M:0,Z:0};
  const pointKey=(code)=>`bradavice_house_points_v2_${code}`;
  function getHousePoints(code){ const v=parseInt(localStorage.getItem(pointKey(code)),10); return Number.isFinite(v)?v:basePoints[code]; }
  function setHousePoints(code,value){localStorage.setItem(pointKey(code),String(value));}
  const cupNames={N:'Nebelvír',H:'Havraspár',M:'Mrzimor',Z:'Zmijozel'};
  function renderCup(){
    const values=Object.fromEntries(Object.keys(basePoints).map(c=>[c,getHousePoints(c)]));
    const max=Math.max(1,...Object.values(values));
    $('#cupList').innerHTML=Object.entries(values).sort((a,b)=>b[1]-a[1]).map(([code,value])=>`<div class="cup-item ${code===houseCode?'current':''}"><span class="cup-name">${cupNames[code]}</span><span class="cup-track"><span class="cup-fill" style="--w:${(value>0?Math.max(6,(value/max)*100):0)}%"></span></span><span class="cup-score">${value}</span></div>`).join('');
  }
  renderCup();
  window.BradaviceDB?.syncHouseStandingsLocal?.().then(()=>renderCup()).catch(()=>{});

  // Poll
  $('#pollQuestion').textContent=config.poll.q;
  const pollKey=`bradavice_poll_v1_${houseCode}`;
  const pollVoteKey=`bradavice_poll_vote_v1_${houseCode}`;
  if(!localStorage.getItem('bradavice_v19_poll_reset')){['N','H','M','Z'].forEach(c=>{localStorage.removeItem(`bradavice_poll_v1_${c}`);localStorage.removeItem(`bradavice_poll_vote_v1_${c}`)});localStorage.setItem('bradavice_v19_poll_reset','1');}
  let pollCounts=(()=>{try{const x=JSON.parse(localStorage.getItem(pollKey));return Array.isArray(x)&&x.length===config.poll.opts.length?x:[0,0,0];}catch{return [0,0,0];}})();
  let pollVote=localStorage.getItem(pollVoteKey);
  function renderPoll(){
    const total=pollCounts.reduce((a,b)=>a+b,0)||1;
    $('#pollOptions').innerHTML='';
    config.poll.opts.forEach((label,i)=>{
      const btn=document.createElement('button');btn.type='button';btn.className='poll-option';btn.disabled=Boolean(pollVote);
      const pct=Math.round((pollCounts[i]/total)*100);btn.style.setProperty('--pct',pollVote?`${pct}%`:'0%');
      btn.innerHTML=`<span class="poll-option-fill"></span><span class="poll-option-content"><span>${label}</span><strong>${pollVote?pct+'%':''}</strong></span>`;
      btn.addEventListener('click',()=>{if(pollVote)return;pollCounts[i]+=1;pollVote=String(i);localStorage.setItem(pollKey,JSON.stringify(pollCounts));localStorage.setItem(pollVoteKey,pollVote);A?.recordActivity();renderPoll();});
      $('#pollOptions').append(btn);
    });
    $('#pollStatus').textContent=pollVote?'Hlas je zapsaný. Výsledky se ukládají v tomto prohlížeči.':'Vyber jednu možnost.';
  }
  renderPoll();

  // Daily challenge
  const today=new Date().toISOString().slice(0,10);
  const challengeKey=`bradavice_challenge_v1_${houseCode}_${today}_${student?.email||'visitor'}`;
  const challengeBtn=$('#challengeButton');
  const challengeMsg=$('#challengeMessage');
  function updateChallenge(){
    const done=localStorage.getItem(challengeKey)==='1';
    challengeBtn.disabled=!isMember||done;
    challengeBtn.textContent=done?'Dnešní výzva splněna':'Splněno · +5 bodů';
    challengeMsg.textContent=!isMember?'Body může získat pouze člen koleje.':done?'Pět bodů už je připsáno. Zítra čeká další výzva.':'';
  }
  challengeBtn.addEventListener('click',async()=>{
    if(!isMember||localStorage.getItem(challengeKey)==='1')return;
    challengeBtn.disabled=true;
    let databaseAwarded=false;
    try{
      if(window.BradaviceDB?.client) databaseAwarded=await window.BradaviceDB.claimDailyChallenge();
    }catch(err){console.warn('Denní výzva zatím není v databázi aktivní.',err)}
    localStorage.setItem(challengeKey,'1');
    if(databaseAwarded){
      await window.BradaviceDB.hydrateAll();
      const fresh=A?.getStudent();if(fresh){student.points=fresh.points;$('#studentPoints').textContent=fresh.points;}
      A?.recordActivity();
    }else if(A){
      A.addPoints(5,'Denní kolejní výzva');A.recordActivity();const fresh=A.getStudent();if(fresh){student.points=fresh.points;$('#studentPoints').textContent=fresh.points;}
    }else{
      student.points=(student.points||0)+5;localStorage.setItem(STUDENT_KEY,JSON.stringify(student));setHousePoints(houseCode,getHousePoints(houseCode)+5);$('#studentPoints').textContent=student.points;
    }
    renderCup();updateChallenge();
  });
  updateChallenge();

  // Chronicle
  $('#chronicleList').innerHTML=config.chronicle.map(([mark,title,text])=>`<article class="chronicle-item"><div class="chronicle-mark">${mark}</div><div><h3>${title}</h3><p>${text}</p></div></article>`).join('');
})();
