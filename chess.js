(()=>{
  const open=document.getElementById('openChessGame');
  const modal=document.getElementById('chessModal');
  if(!open||!modal)return;

  const close=document.getElementById('chessClose');
  const grid=document.getElementById('chessGrid');
  const boardShell=document.querySelector('.magic-chess-board');
  const turnBanner=document.getElementById('chessTurnBanner');
  const resultOverlay=document.getElementById('chessResultOverlay');
  const resultText=document.getElementById('chessResultText');
  const statusEl=document.getElementById('chessStatus');
  const captW=document.getElementById('capturedWhite');
  const captB=document.getElementById('capturedBlack');
  const moveList=document.getElementById('chessMoveList');
  const nickQuote=document.getElementById('chessNickQuote');
  const onlineBox=document.getElementById('chessOnlineControls');
  const createBtn=document.getElementById('chessCreateRoom');
  const joinBtn=document.getElementById('chessJoinRoom');
  const joinInput=document.getElementById('chessJoinCode');
  const roomCodeEl=document.getElementById('chessRoomCode');
  const onlineStatus=document.getElementById('chessOnlineStatus');

  const DB=window.BradaviceDB;
  const names={k:'král',q:'dáma',r:'věž',b:'střelec',n:'jezdec',p:'pěšec'};
  const values={p:100,n:320,b:330,r:500,q:900,k:20000};
  const pieceNames={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
  const file=(c,t)=>`img/chess/${c==='w'?'white':'black'}_${pieceNames[t]}.webp`;
  const quotes=['„Odvážné.“','„Pěkný tah. Teď sleduj odpověď.“','„Šachy trestají spěch.“','„Král není ozdoba. Hlídej si ho.“','„Hm. Tohle už začíná být zajímavé.“'];

  const freshCastling=()=>({w:{k:true,q:true},b:{k:true,q:true}});
  const noCastling=()=>({w:{k:false,q:false},b:{k:false,q:false}});
  const cloneCastling=v=>({
    w:{k:Boolean(v?.w?.k),q:Boolean(v?.w?.q)},
    b:{k:Boolean(v?.b?.k),q:Boolean(v?.b?.q)}
  });

  let mode='ai';
  let level='medium';
  let turn='w';
  let selected=null;
  let board=[];
  let captured={w:[],b:[]};
  let ended=false;
  let aiTimer=null;
  let lastMove=null;
  let movesLog=[];
  let castlingRights=freshCastling();
  let online={code:'',seat:null,version:0,ready:false,channel:null,poll:null,leaving:false};

  const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
  const enemy=c=>c==='w'?'b':'w';
  const say=t=>{if(statusEl)statusEl.textContent=t};
  const onlineSay=t=>{if(onlineStatus)onlineStatus.textContent=t};
  const square=(r,c)=>String.fromCharCode(97+c)+(8-r);
  const setNick=t=>{if(nickQuote)nickQuote.textContent=t};
  const hideResult=()=>{if(resultOverlay)resultOverlay.hidden=true;if(resultText)resultText.textContent=''};

  function viewColor(){
    // Každý hráč má své figurky vždy u spodního okraje šachovnice.
    // Online je perspektiva pevně podle přidělené barvy; u hry dvou hráčů
    // na jednom zařízení se šachovnice po tahu otočí k hráči, který je právě na tahu.
    if(mode==='online'&&(online.seat==='w'||online.seat==='b')) return online.seat;
    if(mode==='local') return turn;
    return 'w';
  }

  function updateTurnBanner(check=false){
    if(!turnBanner)return;
    turnBanner.classList.remove('is-you','is-opponent','is-check','is-waiting');
    if(ended){turnBanner.textContent='PARTIE SKONČILA';return}
    const color=turn==='w'?'SVĚTLÉ':'TMAVÉ';
    if(mode==='online'){
      if(!online.ready){turnBanner.textContent='ČEKÁME NA SOUPEŘE';turnBanner.classList.add('is-waiting');return}
      if(online.seat===turn){turnBanner.textContent=`TVŮJ TAH · ${color}${check?' · ŠACH':''}`;turnBanner.classList.add('is-you')}
      else{turnBanner.textContent=`TAH SOUPEŘE · ${color}${check?' · ŠACH':''}`;turnBanner.classList.add('is-opponent')}
    }else if(mode==='ai'){
      if(turn==='w'){turnBanner.textContent=`TVŮJ TAH · SVĚTLÉ${check?' · ŠACH':''}`;turnBanner.classList.add('is-you')}
      else{turnBanner.textContent=`SIR NICHOLAS TÁHNE · TMAVÉ${check?' · ŠACH':''}`;turnBanner.classList.add('is-opponent')}
    }else{
      turnBanner.textContent=`${color} NA TAHU${check?' · ŠACH':''}`;
      turnBanner.classList.add('is-you');
    }
    if(check)turnBanner.classList.add('is-check');
    if(boardShell){
      boardShell.classList.toggle('your-turn',mode!=='online'||online.seat===turn);
      boardShell.classList.toggle('opponent-turn',mode==='online'&&online.ready&&online.seat!==turn);
      boardShell.classList.toggle('view-black',viewColor()==='b');
    }
  }

  function showResult(kind,winner=null){
    if(!resultOverlay||!resultText)return;
    let text='PAT – REMÍZA';
    if(kind==='mate'){
      if(mode==='local')text=`MAT – ${winner==='w'?'SVĚTLÍ':'TMAVÍ'} VYHRÁVAJÍ`;
      else if(mode==='online')text=`MAT – ${online.seat===winner?'VYHRÁVÁŠ':'PROHRÁL JSI'}`;
      else text=`MAT – ${winner==='w'?'VYHRÁVÁŠ':'PROHRÁL JSI'}`;
    }
    resultText.textContent=text;
    resultOverlay.hidden=false;
  }

  function init(){
    clearTimeout(aiTimer);
    hideResult();
    board=Array.from({length:8},()=>Array(8).fill(null));
    const back=['r','n','b','q','k','b','n','r'];
    for(let c=0;c<8;c++){
      board[0][c]={c:'b',t:back[c]};
      board[1][c]={c:'b',t:'p'};
      board[6][c]={c:'w',t:'p'};
      board[7][c]={c:'w',t:back[c]};
    }
    turn='w';
    selected=null;
    captured={w:[],b:[]};
    ended=false;
    lastMove=null;
    movesLog=[];
    castlingRights=freshCastling();
    setNick('„Tak ukaž, jestli tě něco naučili.“');
    render();
    updateTurnBanner(false);
    if(mode==='ai')say('Táhneš světlými. Sir Nicholas čeká na tvůj tah.');
    else if(mode==='online')say(online.ready?(online.seat===turn?'Jsi na tahu.':'Čekáš na tah soupeře.'):'Online partie čeká na soupeře.');
    else say('Světlé figurky začínají.');
  }

  function serialize(){
    return {board,turn,captured,ended,lastMove,movesLog,castlingRights};
  }

  function looksLikeInitialCastlingPosition(){
    return board[7]?.[4]?.c==='w'&&board[7][4].t==='k'&&board[7]?.[0]?.c==='w'&&board[7][0].t==='r'&&board[7]?.[7]?.c==='w'&&board[7][7].t==='r'&&
      board[0]?.[4]?.c==='b'&&board[0][4].t==='k'&&board[0]?.[0]?.c==='b'&&board[0][0].t==='r'&&board[0]?.[7]?.c==='b'&&board[0][7].t==='r';
  }

  function applyState(state){
    if(!state||!Array.isArray(state.board)||state.board.length!==8)return;
    board=state.board;
    turn=state.turn==='b'?'b':'w';
    captured=state.captured?.w&&state.captured?.b?state.captured:{w:[],b:[]};
    ended=Boolean(state.ended);
    lastMove=state.lastMove||null;
    movesLog=Array.isArray(state.movesLog)?state.movesLog:[];
    castlingRights=state.castlingRights?cloneCastling(state.castlingRights):(movesLog.length===0&&looksLikeInitialCastlingPosition()?freshCastling():noCastling());
    selected=null;
    render();
    stateText();
  }

  function roomSummary(r){
    if(!r)return;
    online.version=Number(r.version||0);
    online.ready=r.status==='playing'||r.status==='ended';
    if(roomCodeEl)roomCodeEl.textContent=r.room_code||online.code;
    if(r.status==='waiting')onlineSay(`Kód ${r.room_code}. Pošli ho spolužákovi a počkej, až se připojí.`);
    else if(r.status==='playing')onlineSay(`${r.white_name||'Světlý'} × ${r.black_name||'Tmavý'} · ${online.seat==='w'?'hraješ světlými':'hraješ tmavými'}`);
    else if(r.status==='abandoned'){
      online.ready=false;
      onlineSay('Soupeř partii opustil.');
      say('Online partie byla ukončena.');
    }else if(r.status==='ended')onlineSay('Partie skončila.');
    updateTurnBanner(false);
  }

  async function removeOnlineChannel(){
    if(online.poll){clearInterval(online.poll);online.poll=null}
    if(online.channel&&DB?.client){try{await DB.client.removeChannel(online.channel)}catch{}online.channel=null}
  }

  async function leaveOnline({notify=true}={}){
    if(online.leaving)return;
    online.leaving=true;
    const code=online.code;
    await removeOnlineChannel();
    if(notify&&code)try{await DB?.leaveChessRoom?.(code)}catch{}
    online={code:'',seat:null,version:0,ready:false,channel:null,poll:null,leaving:false};
    if(roomCodeEl)roomCodeEl.textContent='';
  }

  async function refreshOnlineRoom(code,{force=false}={}){
    if(mode!=='online'||online.code!==code)return;
    try{
      const fresh=await DB?.getChessRoom?.(code);
      if(!fresh)return;
      const changed=force||Number(fresh.version||0)>online.version||String(fresh.status||'')==='abandoned';
      if(!changed)return;
      roomSummary(fresh);
      applyState(fresh.state);
    }catch(e){console.warn('Šachy synchronizace:',e)}
  }

  async function subscribeRoom(code){
    await removeOnlineChannel();
    if(DB?.client){
      try{
        const ch=DB.client.channel(`v422-chess-${code}`);
        ch.on('postgres_changes',{event:'*',schema:'public',table:'chess_rooms',filter:`room_code=eq.${code}`},()=>refreshOnlineRoom(code,{force:true}));
        ch.subscribe(async st=>{
          if(st==='SUBSCRIBED'){
            try{
              const u=await DB.getUser();
              await ch.track({user_id:u?.id||'',seat:online.seat,joined_at:new Date().toISOString()});
            }catch{}
          }
        });
        online.channel=ch;
      }catch(e){console.warn('Šachy realtime:',e)}
    }
    online.poll=setInterval(()=>refreshOnlineRoom(code),1300);
  }

  async function createOnlineRoom(){
    if(!DB?.client){onlineSay('Databáze není dostupná.');return}
    await leaveOnline();
    mode='online';
    online.seat='w';
    init();
    onlineSay('Zakládám soukromou partii…');
    try{
      const r=await DB.createChessRoom(serialize());
      online.code=r.room_code;
      online.version=Number(r.version||0);
      online.ready=false;
      roomSummary(r);
      render();
      await subscribeRoom(online.code);
      await refreshOnlineRoom(online.code,{force:true});
    }catch(e){onlineSay(e?.message||'Partii se nepodařilo vytvořit.')}
  }

  async function joinOnlineRoom(){
    const code=String(joinInput?.value||'').trim().toUpperCase();
    if(code.length!==6){onlineSay('Zadej šestimístný kód partie.');return}
    await leaveOnline();
    onlineSay('Připojuji se…');
    try{
      const r=await DB.joinChessRoom(code);
      mode='online';
      online.code=r.room_code;
      online.seat='b';
      online.version=Number(r.version||0);
      online.ready=true;
      roomSummary(r);
      applyState(r.state);
      await subscribeRoom(online.code);
      await refreshOnlineRoom(online.code,{force:true});
    }catch(e){onlineSay(e?.message||'K partii se nepodařilo připojit.')}
  }

  async function syncOnline(){
    if(mode!=='online'||!online.code||!online.ready)return;
    try{
      const r=await DB.updateChessRoom(online.code,serialize(),online.version);
      roomSummary(r);
    }catch(e){
      try{
        const fresh=await DB.getChessRoom(online.code);
        roomSummary(fresh);
        applyState(fresh.state);
      }catch(err){onlineSay(err?.message||'Partii se nepodařilo synchronizovat.')}
    }
  }

  function findKing(color){
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.c===color&&board[r][c].t==='k')return[r,c];
    return null;
  }

  function isSquareAttacked(r,c,by){
    const pawnDir=by==='w'?-1:1;
    for(const dc of[-1,1]){
      const rr=r-pawnDir,cc=c-dc;
      if(inside(rr,cc)&&board[rr][cc]?.c===by&&board[rr][cc].t==='p')return true;
    }
    for(const[dr,dc]of[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]){
      const rr=r+dr,cc=c+dc;
      if(inside(rr,cc)&&board[rr][cc]?.c===by&&board[rr][cc].t==='n')return true;
    }
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc){
      const rr=r+dr,cc=c+dc;
      if(inside(rr,cc)&&board[rr][cc]?.c===by&&board[rr][cc].t==='k')return true;
    }
    for(const[dirs,types]of[[[[1,0],[-1,0],[0,1],[0,-1]],['r','q']],[[[1,1],[1,-1],[-1,1],[-1,-1]],['b','q']]]){
      for(const[dr,dc]of dirs){
        let rr=r+dr,cc=c+dc;
        while(inside(rr,cc)){
          const p=board[rr][cc];
          if(p){if(p.c===by&&types.includes(p.t))return true;break}
          rr+=dr;cc+=dc;
        }
      }
    }
    return false;
  }

  function canCastle(color,side){
    if(!castlingRights[color]?.[side])return false;
    const row=color==='w'?7:0;
    const rookCol=side==='k'?7:0;
    const between=side==='k'?[5,6]:[1,2,3];
    const travel=side==='k'?[5,6]:[3,2];
    const king=board[row][4];
    const rook=board[row][rookCol];
    if(king?.c!==color||king.t!=='k'||rook?.c!==color||rook.t!=='r')return false;
    if(between.some(c=>board[row][c]))return false;
    const foe=enemy(color);
    if(isSquareAttacked(row,4,foe))return false;
    if(travel.some(c=>isSquareAttacked(row,c,foe)))return false;
    return true;
  }

  function pseudoMoves(r,c){
    const p=board[r][c];
    if(!p)return[];
    const out=[];
    const add=(rr,cc)=>{
      if(!inside(rr,cc))return false;
      const q=board[rr][cc];
      if(!q){out.push([rr,cc,false,null]);return true}
      if(q.c!==p.c&&q.t!=='k')out.push([rr,cc,true,null]);
      return false;
    };
    const slide=dirs=>dirs.forEach(([dr,dc])=>{
      let rr=r+dr,cc=c+dc;
      while(inside(rr,cc)){if(!add(rr,cc))break;rr+=dr;cc+=dc}
    });

    if(p.t==='p'){
      const d=p.c==='w'?-1:1,start=p.c==='w'?6:1;
      if(inside(r+d,c)&&!board[r+d][c]){
        out.push([r+d,c,false,null]);
        if(r===start&&!board[r+2*d][c])out.push([r+2*d,c,false,null]);
      }
      for(const dc of[-1,1])if(inside(r+d,c+dc)&&board[r+d][c+dc]&&board[r+d][c+dc].c!==p.c&&board[r+d][c+dc].t!=='k')out.push([r+d,c+dc,true,null]);
    }
    if(p.t==='n')[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([dr,dc])=>add(r+dr,c+dc));
    if(p.t==='b')slide([[1,1],[1,-1],[-1,1],[-1,-1]]);
    if(p.t==='r')slide([[1,0],[-1,0],[0,1],[0,-1]]);
    if(p.t==='q')slide([[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]);
    if(p.t==='k'){
      [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>add(r+dr,c+dc));
      const home=p.c==='w'?7:0;
      if(r===home&&c===4){
        if(canCastle(p.c,'k'))out.push([home,6,false,'castle-k']);
        if(canCastle(p.c,'q'))out.push([home,2,false,'castle-q']);
      }
    }
    return out;
  }

  function simulateMove(fr,fc,tr,tc,special){
    const p=board[fr][fc];
    const target=board[tr][tc];
    let rookInfo=null;
    board[tr][tc]=p;
    board[fr][fc]=null;
    if(special==='castle-k'||special==='castle-q'){
      const rookFrom=special==='castle-k'?7:0;
      const rookTo=special==='castle-k'?5:3;
      rookInfo={row:fr,from:rookFrom,to:rookTo,piece:board[fr][rookFrom],target:board[fr][rookTo]};
      board[fr][rookTo]=board[fr][rookFrom];
      board[fr][rookFrom]=null;
    }
    return ()=>{
      if(rookInfo){board[rookInfo.row][rookInfo.from]=rookInfo.piece;board[rookInfo.row][rookInfo.to]=rookInfo.target}
      board[fr][fc]=p;
      board[tr][tc]=target;
    };
  }

  function legalMoves(r,c){
    const p=board[r][c];
    if(!p)return[];
    return pseudoMoves(r,c).filter(([rr,cc,,special])=>{
      const restore=simulateMove(r,c,rr,cc,special);
      const king=findKing(p.c);
      const bad=!king||isSquareAttacked(king[0],king[1],enemy(p.c));
      restore();
      return !bad;
    });
  }

  function allMoves(color){
    const out=[];
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.c===color){
      for(const m of legalMoves(r,c))out.push({from:[r,c],to:[m[0],m[1]],capture:m[2],special:m[3]||null});
    }
    return out;
  }

  function stateText(){
    const king=findKing(turn);
    const check=king&&isSquareAttacked(king[0],king[1],enemy(turn));
    const moves=allMoves(turn);
    if(!moves.length){
      ended=true;
      updateTurnBanner(check);
      if(check){
        const whiteWon=turn==='b',winner=whiteWon?'w':'b';
        showResult('mate',winner);
        say(mode==='ai'?(whiteWon?'MAT. Vyhráváš.':'MAT. Sir Nicholas vítězí.'):`MAT. ${winner==='w'?'Světlí':'Tmaví'} vítězí.`);
        if(mode==='ai'&&whiteWon){
          setNick('„Výborně. Tohle už byla skutečná partie.“');
          DB?.claimV40Activity?.('chess-first-win').catch(()=>{});
          DB?.submitTournamentScore?.('chess-cup',100).catch(()=>{});
          const wins=window.BradaviceAchievements?.recordCounter?.('chess-wins',1)||0;
          if(wins>=5)window.BradaviceAchievements?.award?.('sachovy-mistr',{silent:true});
          window.dispatchEvent(new CustomEvent('bradavice:chess-win',{detail:{mode:'ai',context:document.body.dataset.chessContext||'hall'}}));
        }else if(mode==='ai')setNick('„Mat. Příště se dívej o tah dál.“');
        if(mode==='online'&&online.seat===enemy(turn)){
          DB?.submitTournamentScore?.('chess-cup',100).catch(()=>{});
          const wins=window.BradaviceAchievements?.recordCounter?.('chess-wins',1)||0;
          if(wins>=5)window.BradaviceAchievements?.award?.('sachovy-mistr',{silent:true});
          window.dispatchEvent(new CustomEvent('bradavice:chess-win',{detail:{mode:'online',context:document.body.dataset.chessContext||'hall'}}));
        }
      }else{
        showResult('stalemate');
        say('Pat. Partie končí remízou.');
      }
      return false;
    }
    updateTurnBanner(check);
    if(mode==='ai'&&turn==='b')say(check?'Sir Nicholas je v šachu a přemýšlí…':'Sir Nicholas přemýšlí…');
    else if(mode==='online')say(`${turn==='w'?'Světlé':'Tmavé'} jsou na tahu${check?' · ŠACH':''}${online.ready?(online.seat===turn?' · tvůj tah':' · tah soupeře'):' · čeká se na soupeře'}.`);
    else say(`${turn==='w'?'Světlé':'Tmavé'} jsou na tahu${check?' · ŠACH':''}.`);
    return true;
  }

  function logMove(p,fr,fc,tr,tc,target,special){
    const notation=special==='castle-k'?'O-O':special==='castle-q'?'O-O-O':`${p.c==='w'?'S':'T'} ${square(fr,fc)}${target?'×':'–'}${square(tr,tc)}`;
    movesLog.push(`${movesLog.length+1}. ${notation}`);
    if(moveList){
      moveList.innerHTML=movesLog.map(x=>`<div>${x}</div>`).join('');
      moveList.scrollTop=moveList.scrollHeight;
    }
  }

  function disableRookRight(color,row,col){
    const home=color==='w'?7:0;
    if(row!==home)return;
    if(col===0)castlingRights[color].q=false;
    if(col===7)castlingRights[color].k=false;
  }

  function move(fr,fc,tr,tc,fromAI=false){
    if(ended)return;
    const p=board[fr][fc],target=board[tr][tc];
    if(!p)return;
    const special=p.t==='k'&&Math.abs(tc-fc)===2?(tc===6?'castle-k':'castle-q'):null;
    logMove(p,fr,fc,tr,tc,target,special);

    if(target){
      captured[p.c].push(target);
      if(target.t==='r')disableRookRight(target.c,tr,tc);
    }
    if(p.t==='k')castlingRights[p.c]={k:false,q:false};
    if(p.t==='r')disableRookRight(p.c,fr,fc);

    board[tr][tc]=p;
    board[fr][fc]=null;

    if(special){
      const rookFrom=special==='castle-k'?7:0;
      const rookTo=special==='castle-k'?5:3;
      board[fr][rookTo]=board[fr][rookFrom];
      board[fr][rookFrom]=null;
    }

    if(p.t==='p'&&(tr===0||tr===7))p.t='q';
    lastMove={from:[fr,fc],to:[tr,tc],special};
    turn=enemy(turn);
    selected=null;
    render();
    const alive=stateText();
    if(mode==='online')syncOnline();
    if(!alive)return;
    if(mode==='ai'&&turn==='b'&&!fromAI){
      setNick(quotes[Math.floor(Math.random()*quotes.length)]);
      aiTimer=setTimeout(aiMove,level==='hard'?260:level==='easy'?520:390);
    }
  }

  function scoreMove(m){
    const[fr,fc]=m.from,[tr,tc]=m.to,p=board[fr][fc],target=board[tr][tc];
    let score=(target?values[target.t]-values[p.t]*.05:0)+Math.random()*(level==='hard'?2:14);
    score+=((3.5-Math.abs(3.5-tr))+(3.5-Math.abs(3.5-tc)))*3;
    if(m.special)score+=level==='hard'?45:20;
    const restore=simulateMove(fr,fc,tr,tc,m.special);
    const king=findKing('w');
    if(king&&isSquareAttacked(king[0],king[1],'b'))score+=90;
    const own=findKing('b');
    if(own&&isSquareAttacked(own[0],own[1],'w'))score-=150;
    restore();
    return score;
  }

  function aiMove(){
    if(ended||mode!=='ai'||turn!=='b')return;
    const moves=allMoves('b');
    if(!moves.length){stateText();return}
    let chosen;
    if(level==='easy')chosen=moves[Math.floor(Math.random()*moves.length)];
    else{
      const ranked=[...moves].sort((a,b)=>scoreMove(b)-scoreMove(a));
      const pool=level==='hard'?ranked.slice(0,1):ranked.slice(0,Math.min(5,ranked.length));
      chosen=pool[Math.floor(Math.random()*pool.length)];
    }
    move(...chosen.from,...chosen.to,true);
    if(!ended){setNick(quotes[Math.floor(Math.random()*quotes.length)]);stateText()}
  }

  function click(r,c){
    if(ended||(mode==='ai'&&turn==='b'))return;
    if(mode==='online'&&(!online.ready||online.seat!==turn)){
      say(online.ready?'Teď je na tahu soupeř.':'Počkej, až se připojí soupeř.');
      return;
    }
    const p=board[r][c];
    if(selected){
      const[sr,sc]=selected;
      const m=legalMoves(sr,sc).find(x=>x[0]===r&&x[1]===c);
      if(m){move(sr,sc,r,c);return}
      selected=null;
    }
    if(p&&p.c===turn){selected=[r,c];render()}
    else render();
  }

  function capturedHTML(list){
    return list.map(p=>`<img class="captured-piece" src="${file(p.c,p.t)}" alt="${names[p.t]}">`).join('');
  }

  function render(){
    grid.innerHTML='';
    const legalNow=selected?legalMoves(...selected):[];
    const perspective=viewColor();
    const blackView=perspective==='b';
    if(boardShell){
      boardShell.classList.toggle('view-black',blackView);
      boardShell.dataset.perspective=perspective;
      boardShell.setAttribute('aria-label',blackView?'Šachovnice z pohledu tmavých figur':'Šachovnice z pohledu světlých figur');
    }

    for(let vr=0;vr<8;vr++)for(let vc=0;vc<8;vc++){
      const r=blackView?7-vr:vr;
      const c=blackView?7-vc:vc;
      const b=document.createElement('button');
      b.type='button';
      b.className='chess-square';
      b.setAttribute('aria-label',`Pole ${square(r,c)}`);
      if(selected&&selected[0]===r&&selected[1]===c)b.classList.add('selected');
      if(lastMove&&((lastMove.from[0]===r&&lastMove.from[1]===c)||(lastMove.to[0]===r&&lastMove.to[1]===c)))b.classList.add('last');
      const lm=legalNow.find(x=>x[0]===r&&x[1]===c);
      if(lm)b.classList.add(lm[2]?'capture':'legal');
      if(lm?.[3])b.classList.add('castle');
      const p=board[r][c];
      if(p){
        const im=document.createElement('img');
        im.className=`chess-piece ${p.c==='b'?'black':'white'} piece-${pieceNames[p.t]}`;
        im.src=file(p.c,p.t);
        im.alt=`${p.c==='w'?'Světlý':'Tmavý'} ${names[p.t]}`;
        im.draggable=false;
        b.appendChild(im);
      }
      b.addEventListener('click',()=>click(r,c));
      grid.appendChild(b);
    }
    if(captW)captW.innerHTML=capturedHTML(captured.w);
    if(captB)captB.innerHTML=capturedHTML(captured.b);
    if(moveList)moveList.innerHTML=movesLog.length?movesLog.map(x=>`<div>${x}</div>`).join(''):'Partie právě začala.';
  }

  async function setMode(next){
    if(mode==='online'&&next!=='online')await leaveOnline();
    mode=next;
    document.querySelectorAll('[data-chess-mode]').forEach(x=>x.classList.toggle('active',x.dataset.chessMode===mode));
    if(onlineBox)onlineBox.hidden=mode!=='online';
    document.getElementById('chessDifficulty').hidden=mode!=='ai';
    if(mode==='online'){
      onlineSay('Vytvoř partii nebo zadej kód od spolužáka.');
      init();
    }else init();
  }

  async function shut(){
    clearTimeout(aiTimer);
    if(mode==='online')await leaveOnline();
    modal.hidden=true;
    document.body.style.overflow='';
  }

  open.addEventListener('click',()=>{modal.hidden=false;document.body.style.overflow='hidden';setMode('ai')});
  close?.addEventListener('click',shut);
  modal.addEventListener('click',e=>{if(e.target===modal)shut()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)shut()});
  document.querySelectorAll('[data-chess-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.chessMode)));
  document.querySelectorAll('[data-chess-level]').forEach(b=>b.addEventListener('click',()=>{
    level=b.dataset.chessLevel;
    document.querySelectorAll('[data-chess-level]').forEach(x=>x.classList.toggle('active',x.dataset.chessLevel===level));
    setNick(`„Dobře. Obtížnost: ${b.textContent.trim()}. Začneme znovu.“`);
    init();
  }));
  document.getElementById('chessRestart')?.addEventListener('click',()=>mode==='online'?say('V online partii založ novou místnost pro novou hru.'):init());
  createBtn?.addEventListener('click',createOnlineRoom);
  joinBtn?.addEventListener('click',joinOnlineRoom);
  joinInput?.addEventListener('input',()=>joinInput.value=joinInput.value.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,6));
  window.addEventListener('pagehide',()=>{removeOnlineChannel().catch(()=>{})});
  if(location.hash==='#chess')setTimeout(()=>open.click(),120);
})();
