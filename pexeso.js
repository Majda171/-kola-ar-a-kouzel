(() => {
  const modal=document.getElementById('memoryModal');
  const openBtn=document.getElementById('openMemoryGame');
  if(!modal||!openBtn)return;
  const $=s=>modal.querySelector(s), $$=s=>[...modal.querySelectorAll(s)];
  const setup=$('#memorySetupView'), game=$('#memoryGameView'), board=$('#memoryBoard'), stats=$('#memoryStats'), message=$('#memoryMessage'), result=$('#memoryResult');
  const ALL=Array.from({length:32},(_,i)=>`img/pexeso-v25/${i+1}.webp`);
  const BACK='img/pexeso-v25/back.webp';
  const state={players:1,pairs:20,current:1,scores:[0,0],moves:0,matches:0,first:null,second:null,lock:false,start:0,timer:null,elapsed:0};
  {const im=new Image();im.src=BACK;}
  const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
  const time=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  function show(which){setup.classList.toggle('memory-hidden',which!=='setup');game.classList.toggle('memory-hidden',which!=='game')}
  function select(attr,value){state[attr]=Number(value);$$(`[data-${attr}]`).forEach(b=>{const on=Number(b.dataset[attr])===state[attr];b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')})}
  $$('[data-players]').forEach(b=>b.addEventListener('click',()=>select('players',b.dataset.players)));
  $$('[data-pairs]').forEach(b=>b.addEventListener('click',()=>select('pairs',b.dataset.pairs)));
  function bestKey(){return `bradavice_pexeso_best_${state.pairs}`}
  function best(){try{return JSON.parse(localStorage.getItem(bestKey()))}catch{return null}}
  function saveBest(){if(state.players!==1)return false;const cur={moves:state.moves,seconds:state.elapsed},old=best();const better=!old||cur.moves<old.moves||(cur.moves===old.moves&&cur.seconds<old.seconds);if(better)localStorage.setItem(bestKey(),JSON.stringify(cur));return better}
  function stat(label,val,active=''){return `<div class="memory-stat ${active}"><small>${label}</small><b>${val}</b></div>`}
  function update(){if(state.players===1){const b=best();stats.innerHTML=stat('Dvojice',`${state.matches}/${state.pairs}`)+stat('Tahy',state.moves)+stat('Čas',time(state.elapsed))+(b?stat('Rekord',`${b.moves} tahů`):'');message.textContent=state.matches?'Hledej další dvojici':'Najdi první dvojici'}else{stats.innerHTML=stat('Hráč 1',state.scores[0],state.current===1?'active':'')+stat('Hráč 2',state.scores[1],state.current===2?'active':'')+stat('Tahy',state.moves)+stat('Čas',time(state.elapsed));message.textContent=`Na tahu je hráč ${state.current}`}}
  function stopTimer(){if(state.timer)clearInterval(state.timer);state.timer=null}
  function startTimer(){stopTimer();state.start=Date.now();state.elapsed=0;state.timer=setInterval(()=>{state.elapsed=Math.floor((Date.now()-state.start)/1000);update()},1000)}
  function makeBoard(){const chosen=shuffle(ALL).slice(0,state.pairs);chosen.forEach(src=>{const im=new Image();im.src=src});const cards=shuffle(chosen.flatMap((src,id)=>[{src,id},{src,id}]));board.style.setProperty('--cols',state.pairs<=12?'6':state.pairs<=20?'8':'8');board.innerHTML=cards.map((c,i)=>`<button class="memory-card" type="button" data-pair="${c.id}" aria-label="Zakrytá karta ${i+1}"><span class="memory-card-inner"><span class="memory-face memory-back" style="background-image:url('${BACK}')"></span><span class="memory-face memory-front"><img src="${c.src}" alt="Ilustrace pexesa" draggable="false"></span></span></button>`).join('');$$('.memory-card').forEach(c=>c.addEventListener('click',()=>flip(c)))}
  function flip(c){if(state.lock||c===state.first||c.classList.contains('is-open')||c.classList.contains('is-matched'))return;c.classList.add('is-open');if(!state.first){state.first=c;return}state.second=c;state.moves++;state.lock=true;const a=state.first,b=state.second;if(a.dataset.pair===b.dataset.pair){a.classList.add('is-matched');b.classList.add('is-matched');a.disabled=b.disabled=true;state.matches++;if(state.players===2)state.scores[state.current-1]++;state.first=state.second=null;state.lock=false;update();if(state.matches===state.pairs)finish();return}message.textContent=state.players===2?'Neshoda – střídání hráčů':'Zkus si zapamatovat, kde byly';setTimeout(()=>{a.classList.remove('is-open');b.classList.remove('is-open');if(state.players===2)state.current=state.current===1?2:1;state.first=state.second=null;state.lock=false;update()},1250)}
  function start(){state.current=1;state.scores=[0,0];state.moves=0;state.matches=0;state.first=state.second=null;state.lock=false;result.classList.add('memory-hidden');result.innerHTML='';makeBoard();show('game');startTimer();update()}
  function finish(){stopTimer();state.elapsed=Math.max(1,Math.floor((Date.now()-state.start)/1000));if(state.players===1){const rec=saveBest();result.innerHTML=`<strong>${rec?'Nový rekord!':'Všechny dvojice nalezeny!'}</strong><p>${state.moves} tahů · ${time(state.elapsed)}</p>`}else{const winner=state.scores[0]===state.scores[1]?0:(state.scores[0]>state.scores[1]?1:2);result.innerHTML=`<strong>${winner?`Vyhrává hráč ${winner}!`:'Je to remíza!'}</strong><p>Konečné skóre ${state.scores[0]} : ${state.scores[1]}.</p>`}result.classList.remove('memory-hidden');update()}
  function open(){modal.hidden=false;document.body.style.overflow='hidden';show('setup')}
  function close(){modal.hidden=true;document.body.style.overflow='';stopTimer();state.first=state.second=null;state.lock=false}
  openBtn.addEventListener('click',open);$('#memoryClose').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});$('#memoryStart').addEventListener('click',start);$('#memoryRestart').addEventListener('click',start);$('#memoryBack').addEventListener('click',()=>{stopTimer();show('setup')});
})();

if(location.hash==='#pexeso')setTimeout(()=>document.getElementById('openMemoryGame')?.click(),120);
