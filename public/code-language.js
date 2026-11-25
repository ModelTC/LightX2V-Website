(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const copy=[['加载','开源','模型'],['更少步数','更快','推理'],['携手','开源社区','共同构建']];
 const symbols='01<>/{}[]_+=:';
 document.querySelectorAll('.code-trigger').forEach((button,index)=>{
  const holder=button.children[1],action=holder.querySelector('.code-action');
  const original=holder.cloneNode(true);original.querySelector('.code-action')?.remove();
  const english=original.innerHTML.split(/<br\s*\/?\s*>/i).map(s=>s.trim());
  const label=document.createElement('span');label.className='code-language';label.setAttribute('aria-hidden','true');
  const lines=english.map(text=>{const line=document.createElement('span');line.className='code-language-line';line.textContent=text;label.append(line);return line});
  holder.replaceChildren(label,action);
  button.setAttribute('aria-label',english.join(' ')+ ' · '+action.textContent);
  let frame=0,hover=false,focus=false;
  function change(translated){
   cancelAnimationFrame(frame);const target=english;if(!target)return;
   if(reduced.matches){lines.forEach((line,i)=>line.textContent=target[i]);return}
   const start=performance.now();let last=-1;
   function tick(now){const progress=Math.min(1,(now-start)/600),step=Math.floor((now-start)/45);
    if(step!==last){last=step;lines.forEach((line,i)=>{const chars=Array.from(target[i]);line.textContent=chars.map((c,j)=>j<Math.floor(progress*chars.length)?c:c===' '?' ':symbols[Math.floor(Math.random()*symbols.length)]).join('')})}
    if(progress<1)frame=requestAnimationFrame(tick);else lines.forEach((line,i)=>line.textContent=target[i]);
   }frame=requestAnimationFrame(tick);
  }
  button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;change(true)}});
  button.addEventListener('pointerleave',()=>{hover=false;if(!focus)change(false)});
  button.addEventListener('focus',()=>{focus=true;change(true)});
  button.addEventListener('blur',()=>{focus=false;if(!hover)change(false)});
 });
})();
