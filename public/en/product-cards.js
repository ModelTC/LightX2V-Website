const eco=document.querySelector('.eco-wall'),toggle=document.querySelector('#eco-toggle');
toggle.addEventListener('click',()=>{const paused=eco.classList.toggle('paused');toggle.textContent=paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',paused?'Resume logo animation':'Pause logo animation');toggle.setAttribute('aria-pressed',String(paused));});
const tracks=[...eco.querySelectorAll('.eco-track')];
new IntersectionObserver(entries=>{for(const track of tracks)track.style.animationPlayState=entries[0].isIntersecting?'':'paused';}).observe(eco);

// Continuous rounded step around the entry button: two convex shoulders
// and a concave inner corner, rather than a circle cut through two edges.
const contourObserver=new ResizeObserver(entries=>{
 for(const {target,contentRect:{width:w,height:h}} of entries){
  const r=30;
  const d=`M ${r} 0 H ${w-r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h-80} A 20 20 0 0 1 ${w-20} ${h-60} A 40 40 0 0 0 ${w-60} ${h-20} A 20 20 0 0 1 ${w-80} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h-r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path fill="white" d="${d}"/></svg>`;
  const mask=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  target.style.maskImage=mask;target.style.webkitMaskImage=mask;
 }
});
document.querySelectorAll('.card-surface').forEach(el=>contourObserver.observe(el));

const projectTrack=document.querySelector('.product-track');
const carouselControls=document.createElement('div');carouselControls.className='project-carousel-controls';
const progress=document.createElement('input');progress.type='range';progress.min='0';progress.max='1000';progress.step='1';progress.value='0';progress.className='project-scroll-progress';progress.setAttribute('aria-label','Project carousel position');carouselControls.append(progress);projectTrack.after(carouselControls);
let seeking=false;
function updateCarousel(){const max=projectTrack.scrollWidth-projectTrack.clientWidth;const fraction=max>1?projectTrack.scrollLeft/max:0;carouselControls.hidden=max<=1;progress.disabled=max<=1;if(!seeking)progress.value=Math.round(fraction*1000);progress.style.setProperty('--position',fraction*100+'%')}
progress.addEventListener('input',()=>{projectTrack.style.scrollSnapType='none';projectTrack.scrollLeft=Number(progress.value)/1000*(projectTrack.scrollWidth-projectTrack.clientWidth);updateCarousel()});
progress.addEventListener('pointerdown',()=>{seeking=true;projectTrack.style.scrollSnapType='none'});
function endSeek(){seeking=false;projectTrack.style.scrollSnapType='none';updateCarousel()}
window.addEventListener('pointerup',endSeek);window.addEventListener('pointercancel',endSeek);
projectTrack.addEventListener('scroll',updateCarousel,{passive:true});const carouselResize=new ResizeObserver(updateCarousel);carouselResize.observe(projectTrack);projectTrack.querySelectorAll('.repo-card').forEach(card=>carouselResize.observe(card));updateCarousel();

// Slow automatic drift, yielding to reading and manual navigation.
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let autoVisible=false,autoHover=false,autoTouch=false,autoResumeAt=0,autoDirection=1,autoLast=0,autoPosition=projectTrack.scrollLeft;
new IntersectionObserver(([entry])=>{autoVisible=entry.isIntersecting;},{threshold:.15}).observe(projectTrack);
projectTrack.addEventListener('mouseenter',()=>{autoHover=true});
projectTrack.addEventListener('mouseleave',()=>{autoHover=false;autoResumeAt=performance.now()+900});
function holdAuto(){autoResumeAt=performance.now()+3000;autoPosition=projectTrack.scrollLeft}
projectTrack.addEventListener('pointerdown',()=>{autoTouch=true;holdAuto()});
window.addEventListener('pointerup',()=>{if(autoTouch){autoTouch=false;holdAuto()}});
window.addEventListener('pointercancel',()=>{autoTouch=false;holdAuto()});
projectTrack.addEventListener('wheel',holdAuto,{passive:true});
projectTrack.addEventListener('keydown',holdAuto);
progress.addEventListener('input',holdAuto);
function driftProjects(now){
 const dt=Math.min((now-autoLast)/1000,.05);autoLast=now;
 const focused=projectTrack.contains(document.activeElement)||carouselControls.contains(document.activeElement);
 const max=projectTrack.scrollWidth-projectTrack.clientWidth;
 if(autoVisible&&!document.hidden&&!motionPreference.matches&&!autoHover&&!autoTouch&&!seeking&&!focused&&now>autoResumeAt&&max>0){
  projectTrack.style.scrollSnapType='none';
  autoPosition=Math.max(0,Math.min(max,autoPosition+autoDirection*18*dt));
  projectTrack.scrollLeft=autoPosition;
  if(autoPosition>=max||autoPosition<=0){autoDirection*=-1;autoResumeAt=now+1500}
 }else{autoPosition=projectTrack.scrollLeft}
 requestAnimationFrame(driftProjects);
}
requestAnimationFrame(driftProjects);
