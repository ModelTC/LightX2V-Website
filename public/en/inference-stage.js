// User upload order: second attachment first, then first attachment.
const BACKGROUND_VIDEOS = ['home-film-02.mp4','home-film-04.mp4','home-film-01.mp4'];
const stage=document.querySelector('.inference-stage');
const triggers=[...stage.querySelectorAll('.code-trigger')];
function closeOthers(except){for(const b of triggers){if(b===except)continue;b.setAttribute('aria-expanded','false');document.getElementById(b.getAttribute('aria-controls')).hidden=true;}}
for(const button of triggers){button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';closeOthers(button);button.setAttribute('aria-expanded',String(open));document.getElementById(button.getAttribute('aria-controls')).hidden=!open;});}
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.code-point'))closeOthers();});
for(const point of stage.querySelectorAll('.code-point'))point.addEventListener('keydown',event=>{if(event.key==='Escape'){closeOthers();point.querySelector('button').focus();}});
const video=stage.querySelector('.stage-video'),toggle=stage.querySelector('.background-toggle');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let manuallyPaused=false,explicitPlay=false,visible=true,active=0,request=0,scrubbing=false;
const videos=BACKGROUND_VIDEOS.map((src,i)=>{
 const v=i===0?video:video.cloneNode(false);v.loop=false;v.muted=true;v.playsInline=true;v.preload=i===0?'auto':'metadata';v.src=new URL(src,location.origin+'/').href;
 v.classList.toggle('is-active',i===0);if(i>0){v.removeAttribute('poster');stage.insertBefore(v,video.nextSibling)}
 v.addEventListener('ended',()=>{if(active===i&&!manuallyPaused&&!scrubbing)switchFilm((i+1)%BACKGROUND_VIDEOS.length)});
 v.addEventListener('play',()=>{if(active===i)setToggle(true)});
 v.addEventListener('pause',()=>{if(active===i)setToggle(false)});
 return v;
});
function setToggle(playing){toggle.textContent=playing?'Ⅱ':'▶';toggle.setAttribute('aria-label',playing?'Pause background video':'Play background video')}
const controls=document.createElement('div');controls.className='stage-film-controls';stage.append(controls);
const track=document.createElement('div');track.className='film-track';controls.append(track);controls.append(toggle);toggle.hidden=false;setToggle(false);
const filmButtons=videos.map((v,i)=>{const b=document.createElement('button');b.type='button';b.className='film-dot';b.setAttribute('aria-label','Play background video '+(i+1)+'');b.setAttribute('aria-pressed',String(i===0));const fill=document.createElement('span');b.append(fill);b.textContent=String(i+1).padStart(2,'0');b.title=b.getAttribute('aria-label');b.onclick=()=>{manuallyPaused=false;explicitPlay=true;switchFilm(i)};track.append(b);v.addEventListener('timeupdate',()=>{b.style.setProperty('--progress',(v.duration?v.currentTime/v.duration:0)*100+'%')});return b});
const seek=document.createElement('input');seek.type='range';seek.className='film-seek';seek.min=0;seek.max=1000;seek.step=1;seek.value=0;seek.setAttribute('aria-label','Background video progress');track.prepend(seek);
function updateSeek(){const v=videos[active],duration=Number.isFinite(v.duration)?v.duration:0;if(!scrubbing)seek.value=duration?v.currentTime/duration*1000:0;seek.style.setProperty('--seek-progress',Number(seek.value)/10+'%');seek.setAttribute('aria-valuetext',v.currentTime.toFixed(1)+' / '+duration.toFixed(1)+' seconds')}
for(const v of videos){v.addEventListener('timeupdate',updateSeek);v.addEventListener('loadedmetadata',updateSeek)}
seek.addEventListener('pointerdown',()=>{scrubbing=true;videos[active].pause()});
seek.addEventListener('input',()=>{const v=videos[active];if(Number.isFinite(v.duration))v.currentTime=Number(seek.value)/1000*v.duration;updateSeek()});
function finishSeek(){if(!scrubbing)return;scrubbing=false;updateSeek();syncPlayback()}
window.addEventListener('pointerup',finishSeek);window.addEventListener('pointercancel',finishSeek);seek.addEventListener('blur',finishSeek);
async function syncPlayback(){
 for(let i=0;i<videos.length;i++)if(i!==active)videos[i].pause();
 const v=videos[active];if(scrubbing||!visible||document.hidden||manuallyPaused||(reduced.matches&&!explicitPlay)){v.pause();return}
 try{await v.play()}catch{setToggle(false)}
}
let loadTimer;
const filmStatus=document.createElement('span');filmStatus.className='film-status';filmStatus.setAttribute('role','status');controls.append(filmStatus);
function clearLoad(){clearTimeout(loadTimer);stage.removeAttribute('aria-busy');filmStatus.textContent=''}
function switchFilm(index){
 ++request;clearLoad();scrubbing=false;const previous=videos[active],next=videos[index];
 active=index;previous.pause();next.preload='auto';
 videos.forEach((v,i)=>v.classList.toggle('is-active',i===active));
 filmButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===active)));
 if(next.readyState>=1)next.currentTime=0;
 if(next.readyState<2){stage.setAttribute('aria-busy','true');filmStatus.textContent=document.documentElement.lang.startsWith('en')?'Loading video…':'视频加载中…';
 loadTimer=setTimeout(()=>{if(next.readyState<2)filmStatus.textContent=document.documentElement.lang.startsWith('en')?'Loading slowly. Select the video again to retry.':'加载较慢，可再次点击视频编号重试。'},12000);
 if(next.error||next.networkState===0)next.load();
 }
 updateSeek();syncPlayback();
}
for(const [i,v] of videos.entries()){
 v.addEventListener('loadeddata',()=>{if(i===active){clearLoad();syncPlayback()}});
 v.addEventListener('error',()=>{if(i===active){clearLoad();filmStatus.textContent=document.documentElement.lang.startsWith('en')?'Unable to load video. Select again to retry.':'视频加载失败，请再次点击编号重试。';setToggle(false)}});
}
toggle.onclick=()=>{const v=videos[active];if(v.paused){manuallyPaused=false;explicitPlay=true;syncPlayback()}else{manuallyPaused=true;v.pause()}};
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncPlayback()}).observe(stage);
document.addEventListener('visibilitychange',syncPlayback);
reduced.addEventListener('change',()=>{explicitPlay=false;syncPlayback()});

syncPlayback();
