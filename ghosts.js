(() => {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ghosts = [
    {src:'img/ghost-nick.webp', key:'N', cls:'ghost-nick'},
    {src:'img/ghost-seda-dama.webp', key:'H', cls:'ghost-seda-dama'},
    {src:'img/ghost-mnich.webp', key:'M', cls:'ghost-mnich'},
    {src:'img/ghost-krvavy-baron.webp', key:'Z', cls:'ghost-baron'},
    {src:'img/ghost-protiva.webp', key:'P', cls:'ghost-protiva'}
  ];
  const layer = document.createElement('div');
  layer.className = 'ghost-layer';
  layer.setAttribute('aria-hidden','true');
  document.body.appendChild(layer);

  const house = document.body.dataset.house || '';
  let first = true;
  function chooseGhost(){
    if (house && first && Math.random() < .82) return ghosts.find(g => g.key === house) || ghosts[0];
    if (house && Math.random() < .55) return ghosts.find(g => g.key === house) || ghosts[0];
    return ghosts[Math.floor(Math.random()*ghosts.length)];
  }
  function summon(){
    first = false;
    const g = chooseGhost();
    const img = document.createElement('img');
    img.src = g.src;
    img.alt = '';
    img.className = `ghost-visitor ${g.cls}`;
    const fromLeft = Math.random() > .5;
    const y = 8 + Math.random()*58;
    const isProtiva = g.key === 'P';
    const w = isProtiva ? 180 + Math.random()*150 : 250 + Math.random()*190;
    img.style.width = `${w}px`;
    img.style.top = `${y}vh`;
    layer.appendChild(img);
    window.BradaviceAchievements?.recordGhost(g.key);
    const drift = (Math.random()-.5)*95;
    const tilt = (Math.random()-.5)*6;
    const startX = fromLeft ? -w-60 : window.innerWidth+w+60;
    const endX = fromLeft ? window.innerWidth+w+80 : -w-80;
    const duration = 8200 + Math.random()*4200;
    const peak1 = isProtiva ? .82 : .58;
    const peak2 = isProtiva ? .94 : .70;
    const peak3 = isProtiva ? .78 : .56;
    const anim = img.animate([
      {transform:`translate3d(${startX}px,18px,0) rotate(${tilt}deg) scale(.96)`,opacity:0},
      {offset:.14,transform:`translate3d(${startX+(endX-startX)*.14}px,0,0) rotate(${tilt*.5}deg) scale(1)`,opacity:peak1},
      {offset:.55,transform:`translate3d(${startX+(endX-startX)*.55}px,${drift}px,0) rotate(${-tilt*.5}deg) scale(1.03)`,opacity:peak2},
      {offset:.88,transform:`translate3d(${startX+(endX-startX)*.88}px,${drift*.25}px,0) rotate(${-tilt}deg) scale(1)`,opacity:peak3},
      {transform:`translate3d(${endX}px,0,0) rotate(0deg) scale(.97)`,opacity:0}
    ],{duration,easing:'ease-in-out',fill:'forwards'});
    anim.onfinish=()=>img.remove();
  }
  function schedule(initial=false){
    const wait = initial ? 6500 + Math.random()*7500 : 38000 + Math.random()*42000;
    window.setTimeout(()=>{summon();schedule(false)},wait);
  }
  schedule(true);
})();
