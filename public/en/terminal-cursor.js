(()=>{
 const hero=document.querySelector('.inference-stage');if(!hero)return;
 const allowed=matchMedia('(hover: hover) and (pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const cursor=document.createElement('span');cursor.className='terminal-pointer';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
 const pixels=Array.from({length:8},()=>{const p=document.createElement('span');p.className='terminal-pixel';p.setAttribute('aria-hidden','true');document.body.append(p);return p});
 let index=0,last=0;
 function hide(){hero.classList.remove('terminal-active');cursor.classList.remove('is-visible');for(const p of pixels){p.getAnimations().forEach(a=>a.cancel());p.style.opacity=0}}
 hero.addEventListener('pointermove',e=>{
  if(!allowed.matches||reduced.matches||e.pointerType!=='mouse'||e.target.closest('a,button:not(.code-trigger),input,.code-panel')){hide();return}
  hero.classList.add('terminal-active');cursor.classList.add('is-visible');cursor.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`;
  const now=performance.now();if(now-last<65)return;last=now;
  const p=pixels[index++%pixels.length];p.getAnimations().forEach(a=>a.cancel());
  const x=Math.round(e.clientX/8)*8,y=Math.round(e.clientY/8)*8;
  p.animate([{transform:`translate(${x}px,${y}px)`,opacity:.55},{transform:`translate(${x-8}px,${y+10}px)`,opacity:0}],{duration:380,easing:'ease-out'});
 });
 hero.addEventListener('pointerleave',hide);window.addEventListener('scroll',hide,{passive:true});window.addEventListener('blur',hide);document.addEventListener('visibilitychange',hide);allowed.addEventListener('change',hide);reduced.addEventListener('change',hide);
})();
