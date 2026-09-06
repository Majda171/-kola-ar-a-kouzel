(()=>{
  const panel=document.getElementById('requirementTasks');if(!panel)return;
  const display=document.getElementById('runeDisplay'),grid=document.getElementById('runeGrid'),start=document.getElementById('requirementStart'),status=document.getElementById('requirementTaskStatus'),roundEl=document.getElementById('requirementRound'),buttons=[...grid.querySelectorAll('[data-rune]')];
  const items={candle:{img:'img/candle-real.webp',label:'Svíčka'},cauldron:{img:'img/kotlik-velky.webp',label:'Kotlík'},armor:{img:'img/old-armor.webp',label:'Brnění'},chest:{img:'img/prop-chest-closed.webp',label:'Truhla'},snitch:{img:'img/zlatonka.webp',label:'Zlatonka'}};
  const store='bradavice_requirement_focus_v40';let done=localStorage.getItem(store)==='done',round=1,sequence=[],input=[],showing=false;
  const setDisabled=v=>buttons.forEach(b=>b.disabled=v);
  const card=id=>`<span class="memory-object"><img src="${items[id].img}" alt=""><b>${items[id].label}</b></span>`;
  function completedState(){display.innerHTML='<strong class="focus-complete">Zkouška splněna ✓</strong>';status.textContent='Komnata už ví, že se dokážeš soustředit.';start.textContent='Zahrát znovu pro zábavu';setDisabled(true)}
  if(done)completedState();else setDisabled(true);
  function makeSequence(){const ids=Object.keys(items),len=round+3;sequence=Array.from({length:len},()=>ids[Math.floor(Math.random()*ids.length)]);input=[]}
  async function showSequence(){showing=true;setDisabled(true);display.textContent='Sleduj…';await new Promise(r=>setTimeout(r,600));for(const id of sequence){display.innerHTML=card(id);display.classList.remove('flash');void display.offsetWidth;display.classList.add('flash');await new Promise(r=>setTimeout(r,700));display.textContent='·';await new Promise(r=>setTimeout(r,180))}display.textContent='Teď zopakuj pořadí';showing=false;setDisabled(false)}
  async function begin(){if(done){done=false;round=1}start.disabled=true;status.textContent='';makeSequence();roundEl.textContent=`${round} / 3`;await showSequence();start.disabled=false}
  async function clickItem(id){if(showing)return;const expected=sequence[input.length];if(id!==expected){status.textContent='To nebyl správný předmět. Kolo se zopakuje.';setDisabled(true);setTimeout(()=>begin(),850);return}input.push(id);display.innerHTML=`<div class="memory-input-row">${input.map(card).join('')}</div>`;if(input.length===sequence.length){setDisabled(true);if(round<3){status.textContent=`Kolo ${round} splněno. Další bude o jeden předmět delší.`;round++;setTimeout(()=>begin(),950)}else{done=true;localStorage.setItem(store,'done');roundEl.textContent='3 / 3';status.textContent='Komnata se rozzářila. Zkouška soustředění je splněná.';completedState();try{await window.BradaviceDB?.claimV40Activity?.('requirement-focus')}catch(e){console.warn(e)}}}}
  buttons.forEach(b=>b.addEventListener('click',()=>clickItem(b.dataset.rune)));start.addEventListener('click',begin);

  // Přepínání her
  const focus=document.getElementById('roomFocusGame'),ttt=document.getElementById('roomTicTacToe'),title=document.getElementById('roomGameTitle');
  document.querySelectorAll('[data-room-game]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-room-game]').forEach(x=>x.classList.toggle('active',x===btn));const isTtt=btn.dataset.roomGame==='tictactoe';focus.hidden=isTtt;ttt.hidden=!isTtt;title.textContent=isTtt?'Kouzelnické piškvorky':'Zkouška soustředění'}));

  // Piškvorky 5x5, čtyři v řadě. Bez bodů — opakovatelná hra.
  const boardEl=document.getElementById('roomTttBoard'),tttStatus=document.getElementById('roomTttStatus'),restart=document.getElementById('roomTttRestart');let board=Array(25).fill(''),turn='p',ended=false;
  function lines(){const out=[];for(let r=0;r<5;r++)for(let c=0;c<=1;c++)out.push([0,1,2,3].map(k=>r*5+c+k));for(let c=0;c<5;c++)for(let r=0;r<=1;r++)out.push([0,1,2,3].map(k=>(r+k)*5+c));for(let r=0;r<=1;r++)for(let c=0;c<=1;c++)out.push([0,1,2,3].map(k=>(r+k)*5+c+k));for(let r=0;r<=1;r++)for(let c=3;c<5;c++)out.push([0,1,2,3].map(k=>(r+k)*5+c-k));return out}
  const WIN=lines();
  function winner(){for(const line of WIN){const v=board[line[0]];if(v&&line.every(i=>board[i]===v))return{v,line}}return null}
  function renderTtt(){boardEl.innerHTML='';const w=winner();board.forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.className='room-ttt-cell';if(w?.line.includes(i))b.classList.add('winner');b.textContent=v==='p'?'✦':v==='a'?'☾':'';b.disabled=ended||turn!=='p'||Boolean(v);b.addEventListener('click',()=>playerMove(i));boardEl.appendChild(b)})}
  function finishCheck(){const w=winner();if(w){ended=true;tttStatus.textContent=w.v==='p'?'Vyhrál/a jsi. Komnata uznává tvůj tah.':'Komnata vyhrála. Zkus ji přechytračit znovu.';renderTtt();return true}if(board.every(Boolean)){ended=true;tttStatus.textContent='Remíza. Komnata zůstává nerozhodná.';renderTtt();return true}return false}
  function bestAi(){const free=board.map((v,i)=>v?'':i).filter(v=>v!=='');for(const mark of['a','p'])for(const i of free){board[i]=mark;const w=winner();board[i]='';if(w?.v===mark)return i}const center=[12,7,11,13,17].filter(i=>!board[i]);if(center.length)return center[Math.floor(Math.random()*center.length)];return free[Math.floor(Math.random()*free.length)]}
  function aiMove(){if(ended)return;const i=bestAi();if(i===undefined)return;board[i]='a';if(finishCheck())return;turn='p';tttStatus.textContent='Jsi na tahu.';renderTtt()}
  function playerMove(i){if(ended||turn!=='p'||board[i])return;board[i]='p';renderTtt();if(finishCheck())return;turn='a';tttStatus.textContent='Komnata přemýšlí…';renderTtt();setTimeout(aiMove,380)}
  function resetTtt(){board=Array(25).fill('');turn='p';ended=false;tttStatus.textContent='Jsi na tahu.';renderTtt()}
  restart.addEventListener('click',resetTtt);resetTtt();
})();
