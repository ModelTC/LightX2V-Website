(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:700px)');
 const running=new Set();
 function animate(el,delay=0){
  if(!el||reduced.matches||el.contains(document.activeElement))return;
  const a=el.animate([{opacity:0,translate:mobile.matches?'0 0':'0 12px'},{opacity:1,translate:'0 0'}],{duration:mobile.matches?240:540,delay:mobile.matches?0:delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
  running.add(a);a.onfinish=a.oncancel=()=>running.delete(a);
 }
 const lora=document.querySelector('section[aria-label="MiniMax-H3 Turbo"]');
 if(lora){lora.id=lora.id||'lora';lora.classList.add('scan-section');const line=document.createElement('span');line.className='section-scan';line.setAttribute('aria-hidden','true');lora.append(line)}
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;const section=entry.target;observer.unobserve(section);
   if(section.id==='projects'){
    animate(section.querySelector('.gallery-heading'));
    [...section.querySelectorAll('.repo-card')].filter(el=>{const r=el.getBoundingClientRect();return r.right>0&&r.left<innerWidth}).forEach((el,i)=>animate(el,80+i*55));
   }else if(section===lora){
    if(!reduced.matches&&!mobile.matches){const line=section.querySelector('.section-scan');const a=line.animate([{opacity:0,transform:'scaleX(0)',offset:0},{opacity:.8,transform:'scaleX(.15)',offset:.15},{opacity:.7,transform:'scaleX(1)',offset:.7},{opacity:0,transform:'scaleX(1)',offset:1}],{duration:850,easing:'cubic-bezier(.22,1,.36,1)'});running.add(a);a.onfinish=a.oncancel=()=>running.delete(a)}
    [...section.children].filter(el=>!el.classList.contains('section-scan')).forEach((el,i)=>animate(el,120+i*65));
   }else{
    const heading=section.querySelector('h2');animate(heading);
    [...section.children].filter(el=>el!==heading&&!el.contains(heading)&&el.tagName!=='BUTTON').forEach((el,i)=>animate(el,90+Math.min(i,3)*45));
    if(section.id==='research')animate(section.querySelector('.research-heading p'),60);
   }
  }
 },{threshold:.08,rootMargin:'0px 0px -8% 0px'});
 document.querySelectorAll('#projects,#ecosystem,#lora,#research,#community').forEach(el=>observer.observe(el));
 let arrival=null,timer;
 document.querySelector('.topnav')?.addEventListener('click',e=>{
  const link=e.target.closest('a[href^="#"]');if(!link||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const id=link.getAttribute('href').slice(1);if(!id)return;const target=document.getElementById(id);if(!target)return;
  e.preventDefault();clearTimeout(timer);arrival?.disconnect();
  history.pushState(null,'','#'+id);target.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
  const mark=()=>{arrival?.disconnect();clearTimeout(timer);const h=target.querySelector('h2');if(!h)return;h.classList.remove('nav-arrival');void h.offsetWidth;h.classList.add('nav-arrival');setTimeout(()=>h.classList.remove('nav-arrival'),1100)};
  arrival=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting))mark()},{rootMargin:'-100px 0px -55% 0px',threshold:0});arrival.observe(target.querySelector('h2')||target);timer=setTimeout(()=>arrival?.disconnect(),2500);
 });
 reduced.addEventListener('change',()=>{if(reduced.matches)for(const a of running)a.cancel()});
 document.addEventListener('focusin',()=>{for(const a of running)if(a.effect?.target?.contains(document.activeElement))a.cancel()});
})();
