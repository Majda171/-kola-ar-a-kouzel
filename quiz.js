(() => {
  const A=window.BradaviceAchievements;
  const banks=window.BradaviceQuizBanks||{};
  const KEY='bradavice_tests_v1';
  const subjectIds=['potions','transfiguration','defense','herbology','astronomy'];
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}};
  const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
  const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
  const grading=(score,total)=>{
    if(total===10){if(score===10)return['V','Vynikající',true];if(score>=8)return['N','Nad očekávání',true];if(score>=6)return['P','Přijatelné',true];if(score>=4)return['M','Mizerné',false];if(score>=2)return['H','Hrozné',false];return['T','Troll',false]}
    if(score>=23)return['V','Vynikající',true];if(score>=20)return['N','Nad očekávání',true];if(score>=15)return['P','Přijatelné',true];if(score>=10)return['M','Mizerné',false];if(score>=5)return['H','Hrozné',false];return['T','Troll',false];
  };
  const makeSet=(id)=>{
    if(id==='year1'){
      const picked=[];subjectIds.forEach(s=>{const b=banks[s];shuffle(b.questions).slice(0,5).forEach(q=>picked.push({...q,subject:s,subjectTitle:b.title}))});
      return shuffle(picked);
    }
    return shuffle(banks[id]?.questions||[]).slice(0,10).map(q=>({...q,subject:id,subjectTitle:banks[id].title}));
  };
  const bestGrade=(a,b)=>{const rank={V:6,N:5,P:4,M:3,H:2,T:1};return (rank[a]||0)>=(rank[b]||0)?a:b};
  function saveResult(id,score,total){
    const all=read(),old=all[id]||{},g=grading(score,total),now=new Date().toISOString(),passed=g[2];
    const best=Math.max(Number(old.bestScore??-1),score);
    const bestG=old.bestGrade?bestGrade(old.bestGrade,g[0]):g[0];
    const firstPass=!old.passed&&passed;
    all[id]={...old,attempts:Number(old.attempts||0)+1,lastScore:score,lastTotal:total,lastGrade:g[0],bestScore:best,bestTotal:total,bestGrade:bestG,passed:Boolean(old.passed||passed),lastAt:now,completedAt:old.completedAt||now};
    if(firstPass){
      all[id].firstPassAt=now;all[id].firstPassRewarded=true;
      if(id==='year1')A?.addPoints(25,'Ročníková zkouška');else A?.addPoints(10,`Test: ${banks[id]?.title||id}`);
      const dbKey=id==='year1'?'exam-year1':`test-${id}`;
      window.BradaviceDB?.claimV40Activity?.(dbKey).catch(err=>console.warn('Body za první úspěšný test se nepodařilo synchronizovat:',err));
    }
    write(all);
    if(total===10&&score===10)
    if(subjectIds.every(s=>all[s]?.attempts>0))
    if(subjectIds.filter(s=>Number(all[s]?.bestScore||0)>=8).length>=5)
    if(id==='year1'&&passed)A?.award('rocnikova-zkouska');
    if(id==='year1'&&score>=23)
    window.dispatchEvent(new CustomEvent('bradavice:test-updated',{detail:{id,result:all[id]}}));
    return {grade:g[0],label:g[1],passed,firstPass,result:all[id]};
  }
  function ensureModal(){
    let modal=document.getElementById('bradaviceQuizModal');if(modal)return modal;
    modal=document.createElement('div');modal.id='bradaviceQuizModal';modal.className='quiz-modal';modal.hidden=true;modal.innerHTML=`<section class="quiz-card" role="dialog" aria-modal="true" aria-labelledby="quizTitle"><button class="quiz-close" type="button" aria-label="Zavřít">×</button><p class="quiz-kicker">Bradavická zkouška</p><h2 id="quizTitle">Test</h2><div id="quizBody"></div></section>`;document.body.appendChild(modal);
    modal.querySelector('.quiz-close').addEventListener('click',()=>modal.hidden=true);modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});return modal;
  }
  function start(id){
    if(id!=='year1'&&!banks[id])return;
    const questions=makeSet(id),total=questions.length,modal=ensureModal(),body=modal.querySelector('#quizBody'),title=modal.querySelector('#quizTitle');
    title.textContent=id==='year1'?'Ročníková zkouška · 1. ročník':banks[id].title;
    let index=0,score=0,selected=null;
    const render=()=>{
      const q=questions[index],pct=Math.round(index/total*100),answers=shuffle(q.answers);
      body.innerHTML=`<div class="quiz-meta"><span>Otázka ${index+1} z ${total}</span><span>${id==='year1'?q.subjectTitle:'Krátký test · 10 otázek'}</span></div><div class="quiz-progress"><span style="--quiz-p:${pct}%"></span></div><p class="quiz-question">${q.q}</p><div class="quiz-answers">${answers.map((a,i)=>`<button class="quiz-answer" type="button" data-answer="${encodeURIComponent(a)}"><span class="quiz-letter">${String.fromCharCode(65+i)}</span><span>${a}</span></button>`).join('')}</div><div class="quiz-actions"><button class="quiz-btn primary" id="quizNext" type="button" disabled>${index===total-1?'Vyhodnotit':'Další otázka'}</button></div>`;
      selected=null;body.querySelectorAll('.quiz-answer').forEach(btn=>btn.addEventListener('click',()=>{body.querySelectorAll('.quiz-answer').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');selected=decodeURIComponent(btn.dataset.answer);body.querySelector('#quizNext').disabled=false}));
      body.querySelector('#quizNext').addEventListener('click',()=>{if(selected===q.correct)score++;index++;if(index<total)render();else finish()});
    };
    const finish=()=>{
      const out=saveResult(id,score,total),best=out.result.bestScore,perfect=score===total;
      body.innerHTML=`<div class="quiz-result"><div class="quiz-grade">${out.grade}</div><h3>${out.label}</h3><p class="quiz-score">${score} z ${total} správně</p><p class="${out.passed?'quiz-pass':'quiz-fail'}">${out.passed?'Zkouška je splněna.':'Zkouška zatím není splněna. Můžeš ji zopakovat.'}</p>${out.firstPass?`<p>${id==='year1'?'+25':'+10'} bodů pro kolej za první úspěšné složení.</p>`:''}${perfect&&total===10?'<p>Bez jediné chyby — výborný výkon.</p>':''}<p class="quiz-best">Nejlepší výsledek: ${best} / ${total} · ${out.result.bestGrade}</p><div class="quiz-actions"><button class="quiz-btn" id="quizAgain" type="button">Zkusit znovu</button><button class="quiz-btn primary" id="quizDone" type="button">Hotovo</button></div>${id!=='year1'?'<a class="quiz-year-link" href="rocnikova-zkouska.html">Přejít na ročníkovou zkoušku</a>':''}</div>`;
      body.querySelector('#quizAgain').addEventListener('click',()=>start(id));body.querySelector('#quizDone').addEventListener('click',()=>modal.hidden=true);
    };
    modal.hidden=false;render();
  }
  document.querySelectorAll('[data-quiz]').forEach(btn=>btn.addEventListener('click',()=>start(btn.dataset.quiz)));
  if(document.body.dataset.autoQuiz)start(document.body.dataset.autoQuiz);
  window.BradaviceQuiz={start,readResults:read,grading,subjects:subjectIds};
})();
