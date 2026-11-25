import * as T from './three.module.js';

// Commit stars use the source row as their identity; ambient dust is not interactive.
export function createCommitJourney({renderer,rows,events,range,onSelect,onExit,reduced}){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(64,1,.1,800);
 const root=document.querySelector('#sky'),play=document.querySelector('#play');
 const hud=document.createElement('div');hud.className='journey-caption';
 const eyebrow=document.createElement('span'),title=document.createElement('h2'),hint=document.createElement('p');
 hud.append(eyebrow,title,hint);root.append(hud);
 const milestone=document.createElement('button');milestone.className='journey-milestone';milestone.hidden=true;root.append(milestone);
 const n=rows.length,depth=2400,positions=new Float32Array(n*3),seeds=new Float32Array(n),marks=new Float32Array(n);
 const curated=rows.map((r,i)=>({r,i})).filter(({r})=>events[r[0]]&&!events[r[0]].includes('最早收录'));
 let active=false,running=false,progress=0,speed=0,clock=0,last=0,intro=0,selected=-1,lastUI=-1,hold=0,overviewRange=range.value;
 let pointer={x:0,y:0},shift={x:0,y:0};
 let state=1729;const random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<n;i++){
  const a=random()*Math.PI*2,r=9+Math.pow(random(),.7)*34;
  positions[i*3]=Math.cos(a)*r;positions[i*3+1]=Math.sin(a)*r;
  positions[i*3+2]=-i/(n-1)*depth;
  seeds[i]=random();marks[i]=events[rows[i][0]]?1:0;
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('seed',new T.BufferAttribute(seeds,1));geometry.setAttribute('mark',new T.BufferAttribute(marks,1));
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 uniforms:{ratio:{value:renderer.getPixelRatio()},boost:{value:0}},
 vertexShader:`attribute float seed,mark;uniform float ratio,boost;varying float light,m;void main(){vec4 v=modelViewMatrix*vec4(position,1.);m=mark;light=(.8+seed*1.8)*(1.-smoothstep(30.,650.,-v.z));gl_PointSize=clamp((130.+seed*260.+mark*150.)*ratio/max(8.,-v.z),2.,32.);gl_Position=projectionMatrix*v;}`,
 fragmentShader:`varying float light,m;void main(){vec2 uv=gl_PointCoord-.5;float r=length(uv);float glow=exp(-r*r*34.)*.35+exp(-r*r*160.);vec3 tint=mix(vec3(.46,.87,.91),vec3(.94,1.,1.),m);gl_FragColor=vec4(tint,glow*light);}`});
 const points=new T.Points(geometry,material);scene.add(points);
 // Camera-local dust gives close/far parallax without inventing commits.
 const dustCount=innerWidth<700?2400:6500,dustPos=new Float32Array(dustCount*3);
 for(let i=0;i<dustCount;i++){const a=random()*Math.PI*2,r=7+random()*105;dustPos[i*3]=Math.cos(a)*r;dustPos[i*3+1]=Math.sin(a)*r;dustPos[i*3+2]=-random()*600;}
 const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(dustPos,3));
 const dot=document.createElement('canvas');dot.width=dot.height=32;const dc=dot.getContext('2d'),dg=dc.createRadialGradient(16,16,0,16,16,16);dg.addColorStop(0,'#ffffff');dg.addColorStop(.2,'#ffffffdd');dg.addColorStop(1,'#ffffff00');dc.fillStyle=dg;dc.fillRect(0,0,32,32);
 const dust=new T.Points(dustGeo,new T.PointsMaterial({map:new T.CanvasTexture(dot),color:0xa8dce1,size:.42,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true}));scene.add(dust);
 // Thin, segmented rings dissolve after the entry; no full-screen flashing.
 const ringVertices=[];
 for(let ring=0;ring<22;ring++)for(let segment=0;segment<42;segment++){
  if(random()<.25)continue;const start=segment/42*Math.PI*2+ring*.085,end=start+.085;
  for(let k=0;k<4;k++){const a=start+(end-start)*k/4,b=start+(end-start)*(k+1)/4;ringVertices.push(Math.cos(a)*18,Math.sin(a)*18,-ring*12,Math.cos(b)*18,Math.sin(b)*18,-ring*12);}
 }
 const ringGeo=new T.BufferGeometry();ringGeo.setAttribute('position',new T.Float32BufferAttribute(ringVertices,3));
 const ringMat=new T.LineBasicMaterial({color:0xc8f5f7,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});const rings=new T.LineSegments(ringGeo,ringMat);scene.add(rings);
 const streakPos=new Float32Array(320*6),streakGeo=new T.BufferGeometry();streakGeo.setAttribute('position',new T.BufferAttribute(streakPos,3));
 const streakMat=new T.LineBasicMaterial({color:0x76dee7,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});const streaks=new T.LineSegments(streakGeo,streakMat);scene.add(streaks);
 const visited=new Set();
 function index(){return Math.min(n-1,Math.round(progress*(n-1)))}
 function refresh(){const i=index();range.value=i;document.querySelector('#date').textContent=rows[i][1];document.querySelector('#count').textContent=`${(i+1).toLocaleString()} / ${n.toLocaleString()} 次提交 · 星点对应真实提交 · 时间轴可拖动`;
  play.textContent=running?'暂停穿梭':progress>=1?'重新穿梭':'开始穿梭';
  eyebrow.textContent=running?'沿着提交，向前探索':'开源的每一步';title.textContent=rows[i][1].slice(0,4);hint.textContent=running?'点击星点，停下来查看提交':'点击开始穿梭，或拖动底部时间轴';
  lastUI=i;
 }
 function pause(){running=false;speed=0;hold=0;refresh()}
 function seek(){const value=Number(range.value);pause();progress=value/(n-1);intro=0;selected=-1;milestone.hidden=true;refresh()}
 function toggle(){if(running){pause();return}if(progress>=1){progress=0;visited.clear()}running=true;intro=0;selected=-1;document.querySelector('#detail').replaceChildren();refresh()}
 function enter(){overviewRange=range.value;active=true;running=false;last=0;selected=-1;document.body.classList.add('in-journey');hud.hidden=false;progress=0;pointer={x:0,y:0};shift={x:0,y:0};
  try{intro=!reduced.matches&&!sessionStorage.getItem('lightx2v-journey-seen')?2.4:0;sessionStorage.setItem('lightx2v-journey-seen','1')}catch{intro=reduced.matches?0:2.4}
  refresh();
 }
 function exit(){active=false;pause();range.value=overviewRange;hud.hidden=true;milestone.hidden=true;document.body.classList.remove('in-journey');onExit()}
 function show(i){pause();progress=i/(n-1);refresh();selected=i;hud.hidden=true;milestone.hidden=true;onSelect(i)}
 const v=new T.Vector3();
 function pick(e){let best=-1,distance=18;camera.updateMatrixWorld();for(let i=0;i<n;i++){
   const z=positions[i*3+2]-camera.position.z;if(z>-.5||z< -600)continue;
   v.fromArray(positions,i*3).project(camera);if(Math.abs(v.z)>1)continue;
   const d=Math.hypot((v.x+1)*innerWidth/2-e.clientX,(1-v.y)*innerHeight/2-e.clientY);if(d<distance){distance=d;best=i;}
  }return best;
 }
 const canvas=renderer.domElement;let down=null;
 canvas.addEventListener('pointerdown',e=>{if(!active)return;e.stopImmediatePropagation();down={x:e.clientX,y:e.clientY};},{capture:true});
 canvas.addEventListener('pointermove',e=>{if(!active)return;e.stopImmediatePropagation();pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2;},{capture:true});
 canvas.addEventListener('pointerup',e=>{if(!active)return;e.stopImmediatePropagation();if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7){const i=pick(e);if(i>=0)show(i)}down=null;},{capture:true});
 canvas.addEventListener('wheel',e=>{if(!active)return;e.preventDefault();e.stopImmediatePropagation();range.value=T.MathUtils.clamp(index()+Math.sign(e.deltaY)*Math.min(180,Math.abs(e.deltaY)*2),0,n-1);seek();},{capture:true,passive:false});
 play.addEventListener('click',e=>{if(active){e.stopImmediatePropagation();toggle()}},{capture:true});
 range.addEventListener('input',e=>{if(active){e.stopImmediatePropagation();seek()}},{capture:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause();last=0});
 reduced.addEventListener('change',()=>{intro=0;if(active)pause()});
 function frame(now){if(!active)return false;if(document.hidden){last=now;return true}const dt=last?Math.min(.05,(now-last)/1000):0;last=now;clock+=dt;
  camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?78:64;camera.updateProjectionMatrix();
  if(intro>0)intro=Math.max(0,intro-dt);
  if(running){
   if(hold>0)hold-=dt;else{
    const old=index();progress=Math.min(1,progress+dt/100);
    const event=curated.find(({i})=>i>old&&i<=index()&&!visited.has(i)&&/lightx2v/i.test(rows[i][4]));
    if(event){progress=event.i/(n-1);visited.add(event.i);hold=2.5;milestone.textContent=rows[event.i][1]+' · '+events[event.r[0]];milestone.onclick=()=>show(event.i);milestone.hidden=false;}
    else if(selected<0)milestone.hidden=true;
   }
   if(progress>=1)pause();
  }
  const targetSpeed=running&&hold<=0&&!reduced.matches?1:0;speed+=(targetSpeed-speed)*Math.min(1,dt*3);
  if(reduced.matches){shift.x=shift.y=0}else{shift.x+=(pointer.x*.8-shift.x)*Math.min(1,dt*2);shift.y+=(-pointer.y*.6-shift.y)*Math.min(1,dt*2)}
  camera.position.set(shift.x,shift.y,24-progress*depth+(intro>0?intro*13:0));camera.lookAt(0,0,camera.position.z-90);
  // Reduced-motion mode changes snapshots without flying through intermediate space.
  if(reduced.matches&&running)camera.position.z=24-Math.floor(progress*50)/50*depth;
  dust.position.z=camera.position.z;
  if(!reduced.matches&&speed>.001){for(let i=0;i<dustCount;i++){dustPos[i*3+2]+=dt*speed*27;if(dustPos[i*3+2]>-1)dustPos[i*3+2]=-600}dustGeo.attributes.position.needsUpdate=true;}
  ringMat.opacity=reduced.matches?0:Math.max(0,Math.min(1,intro/1.1))*.6;rings.position.z=camera.position.z-20-(2.4-intro)*14;
  const burst=speed*Math.pow(Math.max(0,Math.sin(clock*.8)),12);streakMat.opacity=reduced.matches?0:burst*.18;
  if(streakMat.opacity>.001){for(let i=0;i<320;i++){const j=i*3,k=i*6;streakPos[k]=dustPos[j];streakPos[k+1]=dustPos[j+1];streakPos[k+2]=dustPos[j+2];streakPos[k+3]=dustPos[j];streakPos[k+4]=dustPos[j+1];streakPos[k+5]=dustPos[j+2]-3-burst*11}streakGeo.attributes.position.needsUpdate=true;streaks.position.z=camera.position.z;}
  if(index()!==lastUI)refresh();
  if(selected>=0&&!document.querySelector('#detail').childElementCount)selected=-1;
  if(selected<0)hud.hidden=false;
  renderer.render(scene,camera);return true;
 }
 hud.hidden=true;
 return {get active(){return active},enter,exit,pause,frame,seek};
}
