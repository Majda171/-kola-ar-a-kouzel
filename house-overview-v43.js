(()=>{
  const DB=window.BradaviceDB;
  const clues={
    N:'Tvoje kolej: vstup hledej v severních hradních chodbách. Portrét Baculaté dámy střeží průchod a pustí tě dál jen se správným heslem.',
    H:'Tvoje kolej: vystoupej z horních chodeb do věže. Dveře s bronzovým orlím klepadlem nechtějí heslo, ale správnou odpověď.',
    M:'Tvoje kolej: sejdi do podzemních chodeb poblíž kuchyní. V jednom výklenku čeká řada starých sudů a správný rytmus.',
    Z:'Tvoje kolej: jdi hluboko do sklepení. Na konci podzemní chodby je nenápadná kamenná stěna, která reaguje na heslo.'
  };
  function localCode(){try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')?.houseCode||''}catch{return''}}
  async function resolve(){let code=localCode();try{const p=await DB?.getProfile?.();code=p?.house_code||code}catch{}return code}
  resolve().then(code=>{
    document.querySelectorAll('[data-house-entry-note]').forEach(el=>{
      const c=el.dataset.houseEntryNote;
      if(code===c){el.textContent=clues[c];el.classList.add('own-house-clue')}
      else{el.textContent='Vstup do této koleje není na mapě. Pokud ho chceš poznat, musíš ho objevit při procházení hradu.';el.classList.remove('own-house-clue')}
    });
  });
})();
