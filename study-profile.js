(() => {
  const KEY='bradavice_tests_v1';
  const labels={potions:'Lektvary',transfiguration:'Přeměňování',defense:'Obrana proti černé magii',herbology:'Bylinkářství',astronomy:'Astronomie'};
  const pages={potions:'ucebna-lektvaru.html',transfiguration:'ucebna-premenovani.html',defense:'ucebna-obrany.html',herbology:'skleniky.html',astronomy:'astronomicka-vez.html'};
  const sid=()=>{try{const st=JSON.parse(localStorage.getItem('bradavice_student_v1')||'null');return String(st?.supabaseUserId||st?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_')}catch{return'guest'}};
  const read=()=>{try{return JSON.parse(localStorage.getItem(`${KEY}_${sid()}`))||{}}catch{return {}}};
  function render(){
    const list=document.getElementById('studySubjectList');if(!list)return;const r=read();
    list.innerHTML=Object.entries(labels).map(([id,name])=>{const x=r[id];return `<a class="subject-row subject-link" href="${pages[id]}"><span>${name}</span><span class="profile-grade">${x?`${x.bestGrade} · ${x.bestScore}/10`:'—'}<small>${x?.passed?'splněno':x?'zatím nesplněno':'test neabsolvován'}</small></span></a>`}).join('');
    const annual=document.getElementById('annualExamStatus'),x=r.year1;if(annual)annual.innerHTML=x?`<strong>${x.bestGrade} · ${x.bestScore}/25</strong><span>${x.passed?'Ročníková zkouška splněna':'Zatím nesplněna'}</span>`:'<strong>—</strong><span>Zkouška zatím nebyla absolvována</span>';
  }
  render();window.addEventListener('bradavice:test-updated',render);
})();
