function normalize(value){
  return value.trim().toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function playAudioElement(id){
  const audio = document.getElementById(id);
  if(!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function revealForm(trigger, panel, options = {}){
  const el = document.querySelector(trigger);
  const form = document.querySelector(panel);
  if(!el || !form) return;
  el.addEventListener('click', () => {
    form.hidden = false;
    requestAnimationFrame(()=>form.classList.add('visible'));
    form.querySelector('input')?.focus();
    options.onReveal?.();
    const audioId = el.dataset.audio;
    if(audioId) playAudioElement(audioId);
  });
}

function setupPasswordForm({formId, inputId, errorId, answers, successUrl, successText, wrongText, onSuccess, delay=650}){
  const form = document.getElementById(formId);
  if(!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    const value = normalize(input.value);
    const valid = answers.map(normalize).includes(value);
    if(valid){
      if(error) error.textContent = successText || '';
      onSuccess?.();
      setTimeout(() => { window.location.href = successUrl; }, delay);
    }else{
      if(error) error.textContent = wrongText || 'To není správná odpověď.';
      input.select();
    }
  });
}

function magicKnock(kind='wood'){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    const ctx=new AC();
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(kind==='stone'?105:145,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(kind==='stone'?55:78,ctx.currentTime+.12);
    gain.gain.setValueAtTime(.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(kind==='stone'?.17:.11,ctx.currentTime+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime+.2);
    osc.onended=()=>ctx.close();
  }catch(e){}
}
