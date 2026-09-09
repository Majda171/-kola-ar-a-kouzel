(()=>{
  const mount=document.querySelector('.chess-mount');
  if(!mount)return;
  const context=mount.dataset.chessContext||'hall';
  document.body.dataset.chessContext=context;
  const kicker=context==='philosopher'?'Cesta za Kamenem mudrců · první zkouška':'Velká síň · kouzelnické šachy';
  mount.innerHTML=`<div class="chess-modal" id="chessModal" hidden role="dialog" aria-modal="true" aria-label="Kouzelnické šachy">
    <section class="chess-panel ${context==='philosopher'?'chess-trial-context':''}">
      <button class="chess-close" id="chessClose" type="button" aria-label="Zavřít">×</button>
      <header class="chess-head"><div><p class="chess-kicker">${kicker}</p><h2>Kouzelnické šachy</h2></div><div class="chess-mode"><button class="active" data-chess-mode="ai" type="button">Sir Nicholas</button><button data-chess-mode="local" type="button">Dva hráči</button><button data-chess-mode="online" type="button">Online duel</button></div></header>
      <div class="chess-game">
        <div class="magic-chess-board" aria-label="Kouzelnická šachovnice"><div class="chess-turn-banner" id="chessTurnBanner" aria-live="polite">SVĚTLÉ NA TAHU</div><div class="chess-grid" id="chessGrid"></div><div class="chess-result-overlay" id="chessResultOverlay" hidden aria-live="assertive"><div class="chess-result-text" id="chessResultText"></div></div></div>
        <aside class="chess-sidebar">
          <div class="chess-opponent"><img src="img/ghost-nick-v40.webp" alt="Sir Nicholas"><div><small>Tréninkový soupeř</small><strong>Sir Nicholas</strong><p id="chessNickQuote">„Tak ukaž, jestli tě něco naučili.“</p></div></div>
          <div class="chess-status" id="chessStatus"></div>
          <div class="chess-online" id="chessOnlineControls" hidden><div class="chess-online-create"><button id="chessCreateRoom" type="button">Vytvořit soukromou partii</button><span id="chessRoomCode"></span></div><div class="chess-online-join"><input id="chessJoinCode" maxlength="6" placeholder="Kód partie"><button id="chessJoinRoom" type="button">Připojit se</button></div><p id="chessOnlineStatus">Vytvoř partii nebo zadej kód od spolužáka.</p></div>
          <div class="chess-difficulty" id="chessDifficulty"><span>Obtížnost</span><div><button type="button" data-chess-level="easy">První ročník</button><button class="active" type="button" data-chess-level="medium">Pokročilý</button><button type="button" data-chess-level="hard">Mistr</button></div></div>
          <div class="chess-captured"><div><span>Zajaly světlé</span><strong id="capturedWhite"></strong></div><div><span>Zajaly tmavé</span><strong id="capturedBlack"></strong></div></div>
          <div class="chess-history"><span>Historie tahů</span><div id="chessMoveList">Partie právě začala.</div></div>
          <div class="chess-actions"><button class="primary" id="chessRestart" type="button">Nová partie</button></div>
        </aside>
      </div>
    </section>
  </div>`;
})();
