(()=>{
 const fine=matchMedia('(hover:hover) and (pointer:fine)'), reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const cards=[...document.querySelectorAll('.product-track .repo-card')];
 cards.forEach(card=>{
  let frame=0;
  const reset=()=>{cancelAnimationFrame(frame);card.style.removeProperty('transform');card.style.removeProperty('filter')};
  card.addEventListener('pointermove',event=>{
   if(!fine.matches||reduced.matches||event.pointerType!=='mouse')return;
   const r=card.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),y=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));
   cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
    card.style.transform=`perspective(900px) rotateX(${-y*5}deg) rotateY(${x*5}deg)`;
    card.style.filter=`drop-shadow(${-x*5}px ${12-y*3}px 12px rgba(0,0,0,.12))`;
   });
  });
  card.addEventListener('pointerleave',reset);card.addEventListener('pointercancel',reset);card.addEventListener('blur',reset);
  fine.addEventListener('change',reset);reduced.addEventListener('change',reset);
 });
})();
