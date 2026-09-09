(()=>{
  const root=document.querySelector('.secret-trials-shell');if(!root)return;
  const STORE='bradavice_philosopher_trials_v436',GATE='bradavice_philosopher_trials_gate_v436';
  let progress={chess:false,key:false,potion:false};try{progress={...progress,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{}
  const save=()=>{localStorage.setItem(STORE,JSON.stringify(progress));if(progress.chess&&progress.key&&progress.potion)localStorage.setItem(GATE,'open')};
  const stages={chess:document.getElementById('trialChess'),key:document.getElementById('trialKeys'),potion:document.getElementById('trialPotions'),done:document.getElementById('trialComplete')};
  function paintProgress(){document.querySelectorAll('[data-progress]').forEach((x,i)=>x.classList.toggle('done',[progress.key,progress.chess,progress.potion][i]))}
  function showStage(name){Object.values(stages).forEach(x=>x.hidden=true);stages[name].hidden=false;paintProgress();window.scrollTo({top:0,behavior:'smooth'})}
  function resume(){if(!progress.key){showStage('key');buildKeys()}else if(!progress.chess)showStage('chess');else if(!progress.potion){showStage('potion');buildBottles()}else{save();showStage('done')}}

  // --- skutečné šachy ---
  const grid=document.getElementById('trialChessGrid'),status=document.getElementById('trialChessStatus'),quote=document.getElementById('trialChessQuote');
  const pieceFile=(c,t)=>`img/chess/${c==='w'?'white':'black'}_${({k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'})[t]}.webp`;
  const values={p:100,n:320,b:330,r:500,q:900,k:20000};let board=[],turn='w',selected=null,ended=false,aiTimer=null,last=null;
  const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8,enemy=c=>c==='w'?'b':'w';
  function chessInit(){clearTimeout(aiTimer);board=Array.from({length:8},()=>Array(8).fill(null));const back=['r','n','b','q','k','b','n','r'];for(let c=0;c<8;c++){board[0][c]={c:'b',t:back[c]};board[1][c]={c:'b',t:'p'};board[6][c]={c:'w',t:'p'};board[7][c]={c:'w',t:back[c]}}turn='w';selected=null;ended=false;last=null;status.textContent='Táhneš světlými.';quote.textContent='„Dokud nepadne můj král, dveře zůstanou zavřené.“';renderChess()}
  function findKing(color){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.c===color&&board[r][c].t==='k')return[r,c];return null}
  function attacked(r,c,by){const pd=by==='w'?-1:1;for(const dc of[-1,1]){const rr=r-pd,cc=c-dc;if(inside(rr,cc)&&board[rr][cc]?.c===by&&board[rr][cc].t==='p')return true}for(const[dr,dc]of[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]){const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&board[rr][cc]?.c===by&&board[rr][cc].t==='n')return true}for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc){const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&board[rr][cc]?.c===by&&board[rr][cc].t==='k')return true}for(const[dirs,types]of[[[[1,0],[-1,0],[0,1],[0,-1]],['r','q']],[[[1,1],[1,-1],[-1,1],[-1,-1]],['b','q']]])for(const[dr,dc]of dirs){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const p=board[rr][cc];if(p){if(p.c===by&&types.includes(p.t))return true;break}rr+=dr;cc+=dc}}return false}
  function pseudo(r,c){const p=board[r][c];if(!p)return[];const out=[],add=(rr,cc)=>{if(!inside(rr,cc))return false;const q=board[rr][cc];if(!q){out.push([rr,cc,false]);return true}if(q.c!==p.c&&q.t!=='k')out.push([rr,cc,true]);return false},slide=dirs=>dirs.forEach(([dr,dc])=>{let rr=r+dr,cc=c+dc;while(inside(rr,cc)){if(!add(rr,cc))break;rr+=dr;cc+=dc}});if(p.t==='p'){const d=p.c==='w'?-1:1,start=p.c==='w'?6:1;if(inside(r+d,c)&&!board[r+d][c]){out.push([r+d,c,false]);if(r===start&&!board[r+2*d][c])out.push([r+2*d,c,false])}for(const dc of[-1,1])if(inside(r+d,c+dc)&&board[r+d][c+dc]&&board[r+d][c+dc].c!==p.c&&board[r+d][c+dc].t!=='k')out.push([r+d,c+dc,true])}if(p.t==='n')[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([dr,dc])=>add(r+dr,c+dc));if(p.t==='b')slide([[1,1],[1,-1],[-1,1],[-1,-1]]);if(p.t==='r')slide([[1,0],[-1,0],[0,1],[0,-1]]);if(p.t==='q')slide([[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]);if(p.t==='k')[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>add(r+dr,c+dc));return out}
  function legal(r,c){const p=board[r][c];if(!p)return[];return pseudo(r,c).filter(([rr,cc])=>{const t=board[rr][cc];board[rr][cc]=p;board[r][c]=null;const k=findKing(p.c),bad=!k||attacked(k[0],k[1],enemy(p.c));board[r][c]=p;board[rr][cc]=t;return!bad})}
  function all(color){const out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.c===color)for(const m of legal(r,c))out.push({from:[r,c],to:[m[0],m[1]]});return out}
  function state(){const k=findKing(turn),check=k&&attacked(k[0],k[1],enemy(turn)),moves=all(turn);if(!moves.length){ended=true;if(check&&turn==='b'){status.textContent='MAT. Vyhrál/a jsi druhou zkoušku.';quote.textContent='„Dobře. Figurky tě pustí dál.“';progress.chess=true;save();paintProgress();setTimeout(()=>{showStage('potion');buildBottles()},900)}else if(check){status.textContent='Mat. Zkoušku musíš zkusit znovu.';quote.textContent='„Dveře se neotevřou poraženému.“'}else status.textContent='Pat. Zkus novou partii.';return false}status.textContent=turn==='w'?(check?'Jsi v šachu. Najdi obranu.':'Jsi na tahu.'):(check?'Soupeř je v šachu…':'Kamenné figurky přemýšlejí…');return true}
  function move(fr,fc,tr,tc,ai=false){if(ended)return;const p=board[fr][fc],target=board[tr][tc];board[tr][tc]=p;board[fr][fc]=null;if(p.t==='p'&&(tr===0||tr===7))p.t='q';last={from:[fr,fc],to:[tr,tc]};turn=enemy(turn);selected=null;renderChess();if(!state())return;if(turn==='b'&&!ai)aiTimer=setTimeout(aiMove,380)}
  function score(m){const[fr,fc]=m.from,[tr,tc]=m.to,p=board[fr][fc],t=board[tr][tc];let s=(t?values[t.t]:0)+Math.random()*30;s+=8-Math.abs(3.5-tr)-Math.abs(3.5-tc);return s}
  function aiMove(){if(ended||turn!=='b')return;const moves=all('b');moves.sort((a,b)=>score(b)-score(a));const pool=moves.slice(0,Math.min(6,moves.length)),m=pool[Math.floor(Math.random()*pool.length)];move(...m.from,...m.to,true);if(!ended){quote.textContent=['„Ještě nejsi u cíle.“','„Nedívej se jen na můj poslední tah.“','„Dobrá obrana. Ale co uděláš teď?“'][Math.floor(Math.random()*3)];state()}}
  function clickSquare(r,c){if(ended||turn==='b')return;const p=board[r][c];if(selected){const[sr,sc]=selected,m=legal(sr,sc).find(x=>x[0]===r&&x[1]===c);if(m){move(sr,sc,r,c);return}selected=null}if(p&&p.c==='w'){selected=[r,c];renderChess()}else renderChess()}
  function renderChess(){grid.innerHTML='';const lm=selected?legal(...selected):[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const b=document.createElement('button');b.className='trial-square';b.type='button';if(selected&&selected[0]===r&&selected[1]===c)b.classList.add('selected');if(last&&((last.from[0]===r&&last.from[1]===c)||(last.to[0]===r&&last.to[1]===c)))b.style.background='rgba(211,161,52,.13)';const m=lm.find(x=>x[0]===r&&x[1]===c);if(m)b.classList.add(m[2]?'capture':'legal');const p=board[r][c];if(p){const im=document.createElement('img');im.src=pieceFile(p.c,p.t);im.alt='';im.className='trial-piece '+(p.c==='b'?'black':'white');b.appendChild(im)}b.onclick=()=>clickSquare(r,c);grid.appendChild(b)}}
  document.getElementById('trialChessRestart').onclick=chessInit;

  // --- létající klíče přes celou obrazovku ---
  let keysBuilt=false;
  function buildKeys(){
    if(keysBuilt)return;keysBuilt=true;
    const arena=document.getElementById('keyArena'),msg=document.getElementById('keyMessage');
    const count=14,correctIndex=Math.floor(Math.random()*count);
    for(let i=0;i<count;i++){
      const correct=i===correctIndex,b=document.createElement('button');b.type='button';b.className='flying-key';
      const y=6+Math.random()*78,dur=4.6+Math.random()*4.4,delay=-(Math.random()*dur),reverse=Math.random()>.5;
      b.style.setProperty('--y',`${y}%`);b.style.setProperty('--dur',`${dur}s`);b.style.setProperty('--delay',`${delay}s`);b.style.setProperty('--bob',`${10+Math.random()*22}px`);b.style.setProperty('--spin',`${reverse?-1:1}`);b.classList.toggle('reverse',reverse);
      b.innerHTML=`<img src="img/keys/${correct?'winged-key-broken.webp':'winged-key.webp'}" alt="Okřídlený klíč">`;
      b.onclick=()=>{
        if(correct){msg.textContent='Správně — starý klíč se zlomeným křídlem. Zámek povolil.';progress.key=true;save();paintProgress();arena.querySelectorAll('button').forEach(x=>x.disabled=true);setTimeout(()=>{showStage('chess')},850)}
        else{msg.textContent='Tenhle ne. Správný klíč má poškozené křídlo.';b.classList.add('miss');setTimeout(()=>b.classList.remove('miss'),500)}
      };
      arena.appendChild(b);
    }
  }

  // --- sedm lektvarů ---
  let bottlesBuilt=false;function buildBottles(){if(bottlesBuilt)return;bottlesBuilt=true;const box=document.getElementById('riddleBottles'),msg=document.getElementById('potionMessage');const bottles=[['cerveny.webp','Červená'],['modry.webp','Modrá'],['jantarovy.webp','Jantarová'],['fialovy.webp','Fialová'],['zeleny.webp','Zelená'],['ledovy.webp','Ledová'],['kourovy.webp','Kouřová']];box.innerHTML=bottles.map((x,i)=>`<button type="button" class="riddle-bottle" data-pos="${i+1}"><img src="img/potions-v40/results/${x[0]}" alt="${x[1]} lahvička"><span>${i+1}</span></button>`).join('');box.querySelectorAll('button').forEach(b=>b.onclick=async()=>{const pos=Number(b.dataset.pos);if(pos===5){msg.textContent='Správně. Zelený lektvar je jediná cesta vpřed.';progress.potion=true;save();paintProgress();box.querySelectorAll('button').forEach(x=>x.disabled=true);window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true});setTimeout(()=>showStage('done'),900)}else{msg.textContent='Špatně. Indicie téhle lahvičce neodpovídají.';b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong')}})}

  chessInit();resume();
})();
