(()=>{
  const mirror=document.getElementById('mirrorObject');
  const btn=document.getElementById('mirrorButton');
  const box=document.getElementById('mirrorQuestion');
  const qtext=document.getElementById('mirrorQuestionText');
  const answers=document.getElementById('mirrorAnswers');
  const msg=document.getElementById('mirrorMessage');
  const reward=document.getElementById('stoneReward');
  const stone=document.getElementById('stoneButton');
  const label=document.getElementById('stoneLabel');
  const intro=document.getElementById('mirrorIntro');
  if(!mirror||!btn||!box||!qtext||!answers||!reward||!stone)return;

  const student=(()=>{try{return JSON.parse(localStorage.getItem('bradavice_student_v1')||'null')}catch{return null}})();
  const sid=String(student?.supabaseUserId||student?.email||'guest').replace(/[^a-zA-Z0-9@._-]/g,'_');
  const OWN=`bradavice_philosophers_stone_v4363_${sid}`;

  // Zrcadlo neposuzuje znalosti. Sleduje, co člověk opravdu chce a co by s Kamenem udělal.
  const questions=[
    {
      q:'Kdybys mohl/a s Kamenem udělat jedinou věc a nikdo by se o tom nikdy nedozvěděl, co by sis vybral/a?',
      a:[
        {text:'Použil/a bych jeho moc, abych získal/a něco, po čem dlouho toužím.',score:0},
        {text:'Ukryl/a bych ho tak, aby ho nemohl použít nikdo — ani já.',score:2},
        {text:'Nejdřív bych zjistil/a, co všechno dokáže, a pak bych se rozhodl/a.',score:1}
      ]
    },
    {
      q:'Někdo, koho máš velmi rád/a, tě požádá, abys Kámen použil/a právě pro něj. Co je ti nejbližší?',
      a:[
        {text:'Když bych tím mohl/a pomoci blízkému člověku, použil/a bych ho.',score:1},
        {text:'Odmítl/a bych. Moc Kamene je příliš nebezpečná na to, abych rozhodoval/a, komu ji smím dát.',score:2},
        {text:'Použil/a bych ho — a potom bych si ho nechal/a pro případ, že ho ještě někdy budu potřebovat.',score:0}
      ]
    },
    {
      q:'Představ si, že držíš Kámen v ruce a můžeš s ním odejít. Co by podle tebe mělo následovat?',
      a:[
        {text:'Kámen by měl zůstat u mě. Dokázal/a jsem se k němu dostat, takže ho umím ochránit nejlépe.',score:0},
        {text:'Chci jen vědět, že je v bezpečí. Nemám potřebu jeho moc vlastnit ani používat.',score:2},
        {text:'Chtěl/a bych si ho chvíli ponechat a teprve potom se rozhodnout, co s ním.',score:1}
      ]
    }
  ];

  let index=0;
  let intent=0;
  let started=false;

  function showQuestion(){
    const q=questions[index];
    box.hidden=false;
    qtext.textContent=q.q;
    if(msg)msg.textContent=`Otázka ${index+1} z ${questions.length}`;
    answers.innerHTML=q.a.map((x,i)=>`<button type="button" data-i="${i}">${x.text}</button>`).join('');
    answers.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>pick(Number(b.dataset.i)),{once:true}));
  }

  function pick(i){
    const q=questions[index];
    const choice=q.a[i];
    if(!choice)return;
    intent+=Number(choice.score||0);
    answers.querySelectorAll('button').forEach((b,n)=>{b.disabled=true;b.classList.toggle('chosen',n===i)});
    if(msg)msg.textContent='Zrcadlo mlčky sleduje tvou odpověď…';
    setTimeout(()=>{
      index++;
      if(index<questions.length)showQuestion();
      else evaluateIntent();
    },650);
  }

  function evaluateIntent(){
    box.hidden=true;
    mirror.classList.add('active');
    if(intent>=5){
      reward.classList.add('visible');
      if(intro)intro.textContent='Odraz se projasnil. Zrcadlo poznalo, že Kámen nechceš pro vlastní moc. Na podstavci se objevil rudý Kámen mudrců.';
      if(msg)msg.textContent='';
      return;
    }
    reward.classList.remove('visible');
    if(intro)intro.textContent='V odrazu se na okamžik objeví rudý záblesk, ale hned mizí. Zrcadlo v tvém přání stále vidí touhu Kámen použít nebo vlastnit.';
    if(msg)msg.textContent='Kámen se neukázal.';
    setTimeout(()=>{
      started=false;
      index=0;
      intent=0;
      mirror.classList.remove('active');
      if(intro)intro.textContent='Můžeš se do zrcadla podívat znovu. Tentokrát odpovídej podle toho, co bys opravdu udělal/a.';
    },900);
  }

  btn.addEventListener('click',()=>{
    if(started||localStorage.getItem(OWN)==='owned')return;
    started=true;
    index=0;
    intent=0;
    reward.classList.remove('visible');
    mirror.classList.add('active');
    if(intro)intro.textContent='V odrazu není žádná správná poučka. Zrcadlo se snaží poznat, co bys s Kamenem opravdu udělal/a.';
    showQuestion();
  });

  async function claim(){
    if(localStorage.getItem(OWN)==='owned'){
      label.textContent='Kámen mudrců už vlastníš';
      label.classList.add('stone-owned');
      stone.disabled=true;
      return;
    }
    localStorage.setItem(OWN,'owned');
    label.textContent='Kámen mudrců získán';
    label.classList.add('stone-owned');
    stone.disabled=true;
    window.BradaviceAchievements?.completeQuest?.('kamen-mudrcu',{title:'Kámen mudrců'});
    window.BradaviceAchievements?.award?.('tajemstvi-hradu',{silent:true});
    window.BradaviceAchievements?.toast?.('Kámen mudrců získán','Vzácný nález byl uložen do profilu.');
  }
  stone.addEventListener('click',claim);

  if(localStorage.getItem(OWN)==='owned'){
    started=true;
    mirror.classList.add('active');
    reward.classList.add('visible');
    if(intro)intro.textContent='Zrcadlo už ti Kámen vydalo.';
    label.textContent='Kámen mudrců už vlastníš';
    label.classList.add('stone-owned');
    stone.disabled=true;
  }
})();
