(()=>{
 const msg=document.getElementById('chamberMessage'),diary=document.getElementById('chamberDiary'),fang=document.getElementById('chamberFang'),student=document.getElementById('chamberStudent');
 const tell=t=>{if(msg)msg.textContent=t};
 document.getElementById('chamberBasilisk')?.addEventListener('click',()=>tell('Bazilišek se zvedá nad podlahu komnaty. Jeho pohled působí nebezpečně i jako ozvěna dávného příběhu.'));
 document.getElementById('chamberSword')?.addEventListener('click',()=>tell('Na jílci meče se leskne velký rubín. Čepel nese stopu Godrika Nebelvíra.'));
 document.getElementById('chamberStudentHotspot')?.addEventListener('click',()=>tell('Mladík se tváří chladně a povýšeně. Připomíná dávného zmijozelského studenta.'));
 fang?.addEventListener('click',()=>tell('Baziliščí zub je ostrý a stále působí hrozivě.'));
 diary?.addEventListener('click',()=>{diary.classList.toggle('pierced');student?.classList.toggle('fading',diary.classList.contains('pierced'));tell(diary.classList.contains('pierced')?'Zub prorazil starý deník. Postava v pozadí začíná blednout.':'Deník se znovu zavřel. Na jeho deskách není žádný nápis.')});
})();
