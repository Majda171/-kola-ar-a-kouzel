(() => {
  const modal=document.getElementById('memoryModal');
  const openBtn=document.getElementById('openMemoryGame');
  if(!modal||!openBtn)return;
  const $=s=>modal.querySelector(s), $$=s=>[...modal.querySelectorAll(s)];
  const setup=$('#memorySetupView'), game=$('#memoryGameView'), board=$('#memoryBoard'), stats=$('#memoryStats'), message=$('#memoryMessage'), result=$('#memoryResult');
  const onlineSetup=$('#memoryOnlineSetup'), createBtn=$('#memoryCreateRoom'), joinBtn=$('#memoryJoinRoom'), joinInput=$('#memoryJoinCode'), roomCodeEl=$('#memoryRoomCode'), onlineStatus=$('#memoryOnlineStatus');
  const DB=window.BradaviceDB;
  const ALL=Array.from({length:32},(_,i)=>`img/pexeso-v25/${i+1}.webp`);
  const BACK='img/pexeso-v25/back.webp';
  const state={players:1,pairs:20,current:1,scores:[0,0],moves:0,matches:0,first:null,second:null,lock:false,start:0,timer:null,elapsed:0,deck:[],matched:[]};
  let online={code:'',seat:null,version:0,ready:false,status:'',channel:null,poll:null,leaving:false,startedAt:0};
  {const im=new Image();im.src=BACK;}

  const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
  const time=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const onlineSay=t=>{if(onlineStatus)onlineStatus.textContent=t};
  const safeCode=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
  function show(which){setup.classList.toggle('memory-hidden',which!=='setup');game.classList.toggle('memory-hidden',which!=='game')}
  function select(attr,value){state[attr]=Number(value);$$(`[data-${attr}]`).forEach(b=>{const on=Number(b.dataset[attr])===state[attr];b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});if(attr==='players'){const isOnline=state.players===3;onlineSetup?.classList.toggle('memory-hidden',!isOnline);$('#memoryStart')?.classList.toggle('memory-hidden',isOnline);if(!isOnline&&online.code)leaveOnline().catch(()=>{})}}
  $$('[data-players]').forEach(b=>b.addEventListener('click',()=>select('players',b.dataset.players)));
  $$('[data-pairs]').forEach(b=>b.addEventListener('click',()=>select('pairs',b.dataset.pairs)));
  if(joinInput)joinInput.addEventListener('input',()=>{joinInput.value=safeCode(joinInput.value)});

  function bestKey(){return `bradavice_pexeso_best_${state.pairs}`}
  function best(){try{return JSON.parse(localStorage.getItem(bestKey()))}catch{return null}}
  function saveBest(){if(state.players!==1)return false;const cur={moves:state.moves,seconds:state.elapsed},old=best();const better=!old||cur.moves<old.moves||(cur.moves===old.moves&&cur.seconds<old.seconds);if(better)localStorage.setItem(bestKey(),JSON.stringify(cur));return better}
  function stat(label,val,active=''){return `<div class="memory-stat ${active}"><small>${label}</small><b>${val}</b></div>`}
  function update(){
    if(state.players===1){const b=best();stats.innerHTML=stat('Dvojice',`${state.matches}/${state.pairs}`)+stat('Tahy',state.moves)+stat('Čas',time(state.elapsed))+(b?stat('Rekord',`${b.moves} tahů`):'');message.textContent=state.matches?'Hledej další dvojici':'Najdi první dvojici';return}
    const onlineMode=state.players===3;
    const p1=onlineMode?(online.seat===1?'Ty':'Hráč 1'):'Hráč 1', p2=onlineMode?(online.seat===2?'Ty':'Hráč 2'):'Hráč 2';
    stats.innerHTML=stat(p1,state.scores[0],state.current===1?'active':'')+stat(p2,state.scores[1],state.current===2?'active':'')+stat('Tahy',state.moves)+stat('Čas',time(state.elapsed));
    if(onlineMode){
      if(online.status==='waiting')message.textContent='Čeká se na soupeře.';
      else if(online.status==='abandoned')message.textContent='Soupeř partii opustil.';
      else if(online.status==='ended')message.textContent='Online partie skončila.';
      else message.textContent=state.current===online.seat?'Jsi na tahu.':'Na tahu je soupeř.';
    }else message.textContent=`Na tahu je hráč ${state.current}`;
  }
  function stopTimer(){if(state.timer)clearInterval(state.timer);state.timer=null}
  function startTimer(startAt=Date.now()){stopTimer();state.start=Number(startAt)||Date.now();state.elapsed=Math.max(0,Math.floor((Date.now()-state.start)/1000));state.timer=setInterval(()=>{state.elapsed=Math.max(0,Math.floor((Date.now()-state.start)/1000));update()},1000)}

  function buildDeck(){const picked=shuffle([...Array(32).keys()]).slice(0,state.pairs);return shuffle(picked.flatMap((asset,pair)=>[{asset,pair},{asset,pair}]))}
  function renderBoard(deck=state.deck){
    state.deck=Array.isArray(deck)?deck:[];
    board.style.setProperty('--cols',state.pairs<=12?'6':'8');
    board.innerHTML=state.deck.map((c,i)=>`<button class="memory-card${state.matched.includes(Number(c.pair))?' is-open is-matched':''}" type="button" data-index="${i}" data-pair="${Number(c.pair)}" aria-label="${state.matched.includes(Number(c.pair))?'Nalezená':'Zakrytá'} karta ${i+1}" ${state.matched.includes(Number(c.pair))?'disabled':''}><span class="memory-card-inner"><span class="memory-face memory-back" style="background-image:url('${BACK}')"></span><span class="memory-face memory-front"><img src="${ALL[Number(c.asset)]||ALL[0]}" alt="Ilustrace pexesa" draggable="false"></span></span></button>`).join('');
    $$('.memory-card').forEach(c=>c.addEventListener('click',()=>flip(c)));
  }
  function resetState({keepDeck=false}={}){state.current=1;state.scores=[0,0];state.moves=0;state.matches=0;state.first=state.second=null;state.lock=false;state.matched=[];result.classList.add('memory-hidden');result.innerHTML='';if(!keepDeck)state.deck=buildDeck()}
  function serializeOnline(){return {deck:state.deck,current:state.current,scores:state.scores,moves:state.moves,matches:state.matches,matched:state.matched}}
  function applyOnlineState(src,{render=true}={}){
    if(!src||!Array.isArray(src.deck))return false;
    const pairs=src.deck.length/2;if(![12,20,32].includes(pairs))return false;
    state.pairs=pairs;state.current=Number(src.current)===2?2:1;state.scores=Array.isArray(src.scores)&&src.scores.length===2?src.scores.map(x=>Math.max(0,Number(x)||0)):[0,0];state.moves=Math.max(0,Number(src.moves)||0);state.matches=Math.max(0,Number(src.matches)||0);state.matched=Array.isArray(src.matched)?src.matched.map(Number):[];state.deck=src.deck.map(x=>({asset:Number(x.asset),pair:Number(x.pair)}));state.first=state.second=null;state.lock=false;if(render)renderBoard();return true
  }

  async function removeOnlineWatch(){if(online.poll){clearInterval(online.poll);online.poll=null}if(online.channel&&DB?.client){try{await DB.client.removeChannel(online.channel)}catch{}online.channel=null}}
  async function leaveOnline({notify=true}={}){if(online.leaving)return;online.leaving=true;const code=online.code;await removeOnlineWatch();if(notify&&code)try{await DB?.leaveMemoryRoom?.(code)}catch{}online={code:'',seat:null,version:0,ready:false,status:'',channel:null,poll:null,leaving:false,startedAt:0};if(roomCodeEl)roomCodeEl.textContent=''}
  function roomSummary(r){
    if(!r)return;online.version=Number(r.version||0);online.status=String(r.status||'');online.ready=online.status==='playing'||online.status==='ended';online.code=r.room_code||online.code;if(roomCodeEl)roomCodeEl.textContent=online.code;
    if(r.state)applyOnlineState(r.state);
    if(online.status==='waiting'){show('setup');onlineSetup?.classList.remove('memory-hidden');$('#memoryStart')?.classList.add('memory-hidden');onlineSay(`Kód ${online.code}. Pošli ho spolužákovi a počkej, až se připojí.`);}
    else if(online.status==='playing'){show('game');onlineSay(`${r.host_name||'Hráč 1'} × ${r.guest_name||'Hráč 2'} · ${online.seat===1?'hraješ jako hráč 1':'hraješ jako hráč 2'}`);}
    else if(online.status==='ended')onlineSay('Partie skončila.');
    else if(online.status==='abandoned')onlineSay('Soupeř partii opustil.');
    if(online.status==='playing'&&!online.startedAt){online.startedAt=Date.now();startTimer(online.startedAt)}
    if(['ended','abandoned'].includes(online.status))stopTimer();
    update();
    if(online.status==='ended')finish(true);
  }
  async function refreshOnline(force=false){if(state.players!==3||!online.code)return;try{const r=await DB?.getMemoryRoom?.(online.code);if(!r)return;if(force||Number(r.version||0)>online.version||String(r.status||'')!==online.status)roomSummary(r)}catch(e){if(force)onlineSay(e?.message||'Online partii se nepodařilo načíst.')}}
  async function watchOnline(code){await removeOnlineWatch();if(DB?.client){try{const ch=DB.client.channel(`v422-memory-${code}`);ch.on('postgres_changes',{event:'*',schema:'public',table:'memory_rooms',filter:`room_code=eq.${code}`},()=>refreshOnline(true));ch.subscribe();online.channel=ch}catch(e){console.warn('Pexeso realtime:',e)}}online.poll=setInterval(()=>refreshOnline(false),1400)}
  async function createOnline(){
    if(!DB?.client||!DB?.createMemoryRoom){onlineSay('Online pexeso vyžaduje databázovou aktualizaci v42.2.');return}
    await leaveOnline();state.players=3;resetState();show('setup');onlineSetup?.classList.remove('memory-hidden');$('#memoryStart')?.classList.add('memory-hidden');update();onlineSay('Zakládám soukromou partii…');
    try{const r=await DB.createMemoryRoom(state.pairs,serializeOnline());online.code=r.room_code;online.seat=1;online.version=Number(r.version||0);roomSummary(r);await watchOnline(online.code)}catch(e){show('setup');onlineSay(e?.message||'Partii se nepodařilo vytvořit.')}
  }
  async function joinOnline(){
    const code=safeCode(joinInput?.value);if(code.length!==6){onlineSay('Zadej šestimístný kód partie.');return}
    if(!DB?.client||!DB?.joinMemoryRoom){onlineSay('Online pexeso vyžaduje databázovou aktualizaci v42.2.');return}
    await leaveOnline();state.players=3;onlineSay('Připojuji se…');
    try{const r=await DB.joinMemoryRoom(code);online.code=r.room_code;online.seat=2;online.version=Number(r.version||0);applyOnlineState(r.state);renderBoard();show('game');roomSummary(r);await watchOnline(online.code)}catch(e){onlineSay(e?.message||'K partii se nepodařilo připojit.')}
  }
  async function pushOnline(){
    if(state.players!==3||!online.code||!online.ready)return false;
    try{const r=await DB.updateMemoryRoom(online.code,serializeOnline(),online.version);roomSummary(r);return true}catch(e){try{const fresh=await DB.getMemoryRoom(online.code);roomSummary(fresh)}catch(err){onlineSay(err?.message||e?.message||'Partii se nepodařilo synchronizovat.')}return false}
  }

  async function flip(c){
    if(state.lock||c===state.first||c.classList.contains('is-open')||c.classList.contains('is-matched'))return;
    if(state.players===3&&(!online.ready||online.status!=='playing'||state.current!==online.seat)){update();return}
    c.classList.add('is-open');
    if(!state.first){state.first=c;return}
    state.second=c;state.moves++;state.lock=true;const a=state.first,b=state.second;
    if(a.dataset.pair===b.dataset.pair){
      a.classList.add('is-matched');b.classList.add('is-matched');a.disabled=b.disabled=true;const pair=Number(a.dataset.pair);if(!state.matched.includes(pair))state.matched.push(pair);state.matches++;if(state.players!==1)state.scores[state.current-1]++;state.first=state.second=null;update();if(state.players===3)await pushOnline();state.lock=false;if(state.matches===state.pairs)finish(state.players===3);return
    }
    message.textContent=state.players===1?'Zkus si zapamatovat, kde byly':'Neshoda – střídání hráčů';
    setTimeout(async()=>{a.classList.remove('is-open');b.classList.remove('is-open');if(state.players!==1)state.current=state.current===1?2:1;state.first=state.second=null;update();if(state.players===3)await pushOnline();state.lock=false},1000)
  }
  function start(){state.players=state.players===3?1:state.players;resetState();renderBoard();show('game');startTimer();update()}
  function finish(fromServer=false){
    stopTimer();state.elapsed=Math.max(1,Math.floor((Date.now()-(state.start||Date.now()))/1000));
    if(state.players===1){const rec=saveBest();result.innerHTML=`<strong>${rec?'Nový rekord!':'Všechny dvojice nalezeny!'}</strong><p>${state.moves} tahů · ${time(state.elapsed)}</p>`}
    else{const winner=state.scores[0]===state.scores[1]?0:(state.scores[0]>state.scores[1]?1:2);const label=state.players===3&&winner?(winner===online.seat?'Vyhráváš!':'Vyhrává soupeř!'):(winner?`Vyhrává hráč ${winner}!`:'Je to remíza!');result.innerHTML=`<strong>${label}</strong><p>Konečné skóre ${state.scores[0]} : ${state.scores[1]}.</p>`}
    result.classList.remove('memory-hidden');update();
    if(state.players===3&&!fromServer&&online.status==='playing')pushOnline().catch(()=>{});
  }
  function open(){modal.hidden=false;document.body.style.overflow='hidden';show('setup');select('players',state.players===3?1:state.players)}
  async function close(){modal.hidden=true;document.body.style.overflow='';stopTimer();state.first=state.second=null;state.lock=false;await leaveOnline()}

  openBtn.addEventListener('click',open);$('#memoryClose').addEventListener('click',()=>close());modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
  $('#memoryStart').addEventListener('click',start);createBtn?.addEventListener('click',createOnline);joinBtn?.addEventListener('click',joinOnline);joinInput?.addEventListener('keydown',e=>{if(e.key==='Enter')joinOnline()});
  $('#memoryRestart').addEventListener('click',async()=>{if(state.players===3){await leaveOnline();show('setup');onlineSay('Založ novou partii nebo zadej nový kód.')}else start()});
  $('#memoryBack').addEventListener('click',async()=>{stopTimer();if(state.players===3)await leaveOnline();show('setup')});
  window.addEventListener('pagehide',()=>{removeOnlineWatch().catch(()=>{})});
})();

if(location.hash==='#pexeso')setTimeout(()=>document.getElementById('openMemoryGame')?.click(),120);
