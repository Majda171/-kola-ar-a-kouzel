(()=>{
  const page=location.pathname.split('/').pop()||'';
  const route=[
    'nadvori.html','chodby.html','chodby-schody.html','chodby-portretni-galerie.html','chodby-stara-galerie.html','chodby-podzemni-1.html','chodby-podzemni-2.html','chodby-horni.html','komnata-nejvyssi-potreby.html',
    'knihovna.html','ucebna-premenovani.html','ucebna-obrany.html','astronomicka-vez.html','sin-slavy.html','velka-sin.html',
    'ucebna-lektvaru.html','skleniky.html','pozemky.html','jezero.html','hagriduv-dum.html','vrba-mlaticka.html','zapovezeny-les.html'
  ];
  const names={
    'nadvori.html':'Nádvoří','chodby.html':'Hradní chodby','chodby-schody.html':'Schodiště','chodby-portretni-galerie.html':'Portrétní galerie','chodby-stara-galerie.html':'Východní chodba','chodby-podzemni-1.html':'Podzemní chodba','chodby-podzemni-2.html':'Hluboké sklepení','chodby-horni.html':'Horní galerie','komnata-nejvyssi-potreby.html':'Chodba 7. patra','knihovna.html':'Knihovna','ucebna-premenovani.html':'Přeměňování','ucebna-obrany.html':'Obrana proti černé magii','astronomicka-vez.html':'Astronomická věž','sin-slavy.html':'Síň slávy','velka-sin.html':'Velká síň','ucebna-lektvaru.html':'Lektvary','skleniky.html':'Skleníky','pozemky.html':'Pozemky','jezero.html':'Černé jezero','hagriduv-dum.html':'Hagridův dům','vrba-mlaticka.html':'Vrba mlátička','zapovezeny-les.html':'Zapovězený les'
  };
  const i=route.indexOf(page);if(i<0)return;
  const make=(href,dir)=>{if(!href)return null;const a=document.createElement('a');a.className=`castle-side-nav castle-side-${dir}`;a.href=href;a.setAttribute('aria-label',`${dir==='prev'?'Předchozí':'Další'} lokace: ${names[href]||href}`);a.innerHTML=`<span class="castle-side-arrow">${dir==='prev'?'‹':'›'}</span><small>${names[href]||''}</small>`;a.addEventListener('click',()=>document.documentElement.classList.add('castle-leaving'));return a};
  const prev=make(route[i-1],'prev'),next=make(route[i+1],'next');if(prev)document.body.append(prev);if(next)document.body.append(next);
})();
