(()=>{
const root=document.querySelector('.lora-showcase');if(!root)return;
const stage=root.querySelector('.showcase-stage'),img=stage.querySelector('img'),video=stage.querySelector('video'),fine=matchMedia('(hover:hover) and (pointer:fine)'),en=document.documentElement.lang.startsWith('en');
const lens=document.createElement('div');lens.className='media-lens';lens.hidden=true;lens.setAttribute('aria-hidden','true');const glass=document.createElement('canvas');glass.width=glass.height=320;lens.append(glass);stage.append(lens);const ctx=glass.getContext('2d');
const format=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
// Accessible transport, styled like a compact editor timeline.
const transport=document.createElement('div');transport.className='media-transport';
transport.innerHTML=`<button type="button" class="transport-play" aria-label="${en?'Play':'播放'}">▶</button><output>00:00 / 00:00</output><input type="range" min="0" max="1000" value="0" step="1" aria-label="${en?'Video progress':'视频进度'}"><button type="button" class="transport-sound">${en?'SOUND':'声音'}</button><button type="button" class="transport-full" aria-label="${en?'Fullscreen':'全屏'}">⛶</button>`;
stage.append(transport);video.controls=false;
const play=transport.querySelector('.transport-play'),seek=transport.querySelector('input'),sound=transport.querySelector('.transport-sound');
let loading=false,playError=false;
const stamp=t=>format(Number.isFinite(t)?t:0).padStart(5,'0');
function syncTransport(){
 transport.hidden=video.hidden;
 play.textContent=video.paused?'▶':'Ⅱ';play.setAttribute('aria-label',video.paused?(en?'Play':'播放'):(en?'Pause':'暂停'));
 transport.querySelector('output').textContent=playError?(en?'Retry playback':'点击重试'):!Number.isFinite(video.duration)?(en?'Loading…':'加载中…'):loading?(en?'Buffering…':'缓冲中…'):stamp(video.currentTime)+' / '+stamp(video.duration);
 seek.disabled=!ready();seek.value=ready()?Math.round(video.currentTime/video.duration*1000):0;
 seek.style.setProperty('--played',seek.value/10+'%');
 sound.setAttribute('aria-label',video.muted?(en?'Unmute':'开启声音'):(en?'Mute':'静音'));sound.setAttribute('aria-pressed',String(!video.muted));
}
function togglePlayback(){if(!video.paused){video.pause();return}if(video.error||playError){playError=false;video.load()}video.play().catch(error=>{if(error.name==='AbortError')return;playError=true;loading=false;syncTransport()})}
play.onclick=togglePlayback;
seek.oninput=()=>{if(ready())video.currentTime=Number(seek.value)/1000*video.duration};
sound.onclick=()=>{video.muted=!video.muted;syncTransport()};
const fullscreen=transport.querySelector('.transport-full');
const anchor=document.createComment('showcase-stage-home');stage.before(anchor);
let pageFullscreen=false,previousOverflow='';
function fullscreenLabel(){const active=pageFullscreen||document.fullscreenElement===stage;fullscreen.setAttribute('aria-label',active?(en?'Exit fullscreen':'退出全屏'):(en?'Fullscreen':'全屏'));fullscreen.setAttribute('aria-pressed',String(active));fullscreen.textContent=active?'×':'⛶'}
function pageEnter(){hide();previousOverflow=document.body.style.overflow;document.body.append(stage);stage.classList.add('media-page-fullscreen');document.body.style.overflow='hidden';pageFullscreen=true;fullscreenLabel();fullscreen.focus()}
function pageExit(){if(!pageFullscreen)return;hide();anchor.after(stage);stage.classList.remove('media-page-fullscreen');document.body.style.overflow=previousOverflow;pageFullscreen=false;fullscreenLabel();fullscreen.focus()}
fullscreen.onclick=async()=>{
 if(pageFullscreen){pageExit();return}
 if(document.fullscreenElement===stage){await document.exitFullscreen();return}
 try{if(!stage.requestFullscreen||document.fullscreenEnabled===false)throw Error('Use page fullscreen');await stage.requestFullscreen()}catch{pageEnter()}
};
document.addEventListener('fullscreenchange',()=>{hide();fullscreenLabel()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pageFullscreen){e.preventDefault();pageExit()}});

['timeupdate','loadedmetadata','durationchange','play','pause','volumechange','emptied','ended'].forEach(event=>video.addEventListener(event,syncTransport));
['loadstart','waiting','stalled'].forEach(event=>video.addEventListener(event,()=>{loading=true;if(event==='loadstart'){playError=false;const empty=root.querySelector('.showcase-empty');if(empty)empty.hidden=true}syncTransport()}));
['canplay','playing','loadeddata','pause'].forEach(event=>video.addEventListener(event,()=>{loading=false;syncTransport()}));
video.addEventListener('error',()=>{playError=true;loading=false;syncTransport()});
new MutationObserver(syncTransport).observe(video,{attributes:true,attributeFilter:['hidden']});
const ready=()=>!video.hidden&&Number.isFinite(video.duration)&&video.duration>0;
syncTransport();
let pointer=null,frame=0;
function hide(){lens.hidden=true;pointer=null;cancelAnimationFrame(frame);frame=0;stage.classList.remove('media-pointer')}
function drawLens(){
 frame=0;if(!pointer||document.hidden)return;
 const media=!video.hidden?video:img,w=media===video?video.videoWidth:img.naturalWidth,h=media===video?video.videoHeight:img.naturalHeight;
 if(!w||!h){hide();return}
 const r=media.getBoundingClientRect(),scale=Math.min(r.width/w,r.height/h),x=pointer.x-r.left-(r.width-w*scale)/2,y=pointer.y-r.top-(r.height-h*scale)/2;
 if(x<0||y<0||x>w*scale||y>h*scale){hide();return}
 const sr=stage.getBoundingClientRect();lens.style.left=(pointer.x-sr.left)+'px';lens.style.top=(pointer.y-sr.top)+'px';lens.hidden=false;stage.classList.add('media-pointer');
 ctx.clearRect(0,0,320,320);const span=160/(scale*2);ctx.drawImage(media,x/scale-span/2,y/scale-span/2,span,span,0,0,320,320);
 if(media===video&&!video.paused)frame=requestAnimationFrame(drawLens);
}
stage.addEventListener('pointermove',e=>{
 if(!fine.matches||e.pointerType==='touch'||e.target.closest('.media-transport')){hide();return}
 pointer={x:e.clientX,y:e.clientY};cancelAnimationFrame(frame);drawLens();
});
stage.addEventListener('pointerleave',hide);stage.addEventListener('pointercancel',hide);
video.addEventListener('play',()=>{if(pointer&&!frame)drawLens()});video.addEventListener('seeked',()=>{if(pointer)drawLens()});
video.addEventListener('click',togglePlayback);
const dialog=document.createElement('dialog');dialog.className='media-lightbox';const close=document.createElement('button');close.textContent=en?'Close ×':'关闭 ×';const full=document.createElement('img');dialog.append(close,full);root.append(dialog);close.onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
function expand(){if(img.hidden||!img.naturalWidth)return;full.src=img.currentSrc;full.alt=img.alt;dialog.showModal()}
img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',en?'View full image':'查看大图');img.addEventListener('click',()=>{if(!fine.matches)expand()});img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();expand()}});
root.querySelector('.showcase-tabs').addEventListener('click',()=>{hide();video.pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){hide();video.pause()}});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting){video.pause();hide()}}).observe(stage);
})();
