import {createRingField} from './commit-ring.js';
import * as T from './three.module.js';
import {lane,createFilaments} from './filaments.js';
import {OrbitControls} from './orbit.js';
const $=s=>document.querySelector(s), sky=$('#sky');
const rows=await (await fetch('history.json')).json();
// A project may publish integrations, examples or bindings as separate Git repositories.
const companionProjects=new Map([
 ['lightllm-blog','LightLLM'],['mqbench-paper','MQBench'],
 ['general-sam-py','general-sam'],['ComfyUI-LightVAE','LightVAE']
]);
function projectOf(repo){
 return /lightx2v/i.test(repo)?'LightX2V':companionProjects.get(repo)??repo;
}
const totals=new Map();
for(const row of rows){
 const project=projectOf(row[4]);
 totals.set(project,(totals.get(project)||0)+1);
}
const priority=['LightX2V','LightLLM','LightCompress','MQBench'];
const groupNames=[...totals.keys()].sort((a,b)=>totals.get(b)-totals.get(a));
const order=[...groupNames].sort((a,b)=>(priority.includes(b)-priority.includes(a))||totals.get(b)-totals.get(a));
const footprints=groupNames.map(name=>1.3+.65*Math.sqrt(totals.get(name)||0));
const circumference=footprints.reduce((sum,r)=>sum+2*r+4,0);
const ringRadius=Math.max(85,circumference/(Math.PI*2));
const sectors=[],centers=groupNames.map(()=>[0,0]);let ringAngle=-Math.PI*.8;
for(const name of order){const g=groupNames.indexOf(name),arc=(2*footprints[g]+4)/circumference*Math.PI*2;const angle=ringAngle+arc/2;sectors[g]={angle,arc};centers[g]=[Math.cos(angle)*ringRadius,Math.sin(angle)*ringRadius];ringAngle+=arc;}
const hues=groupNames.map((_,i)=>.46+(i%6)*.028);
const dates=[...new Set(rows.map(r=>r[1]))], range=$('#timeline');
range.max=rows.length-1;range.value=range.max;
for(const year of ['2025','2026']){
 const first=rows.findIndex(row=>row[1].startsWith(year));
 if(first<0)continue;
 const tick=document.createElement('span');
 tick.textContent=year;tick.style.left=(100*first/(rows.length-1))+'%';
 $('#year-ticks').append(tick);
}
let renderer;
try{renderer=new T.WebGLRenderer({alpha:true,antialias:true})}catch{sky.textContent='此设备未能启动 WebGL。';throw Error('WebGL unavailable')}
sky.append(renderer.domElement);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new T.Scene(), cam=new T.PerspectiveCamera(39,1,.1,1500), orbit=new OrbitControls(cam,renderer.domElement);
orbit.enableDamping=true;orbit.maxPolarAngle=Math.PI*.48;orbit.minDistance=1.5;
const rotateView=$('#rotate-view');
function setRotationMode(rotating){
 orbit.mouseButtons.LEFT=rotating ? T.MOUSE.ROTATE : T.MOUSE.PAN;
 orbit.mouseButtons.RIGHT=rotating ? T.MOUSE.PAN : T.MOUSE.ROTATE;
 orbit.touches.ONE=rotating ? T.TOUCH.ROTATE : T.TOUCH.PAN;
 rotateView.setAttribute('aria-pressed',String(rotating));
 if(!document.body.classList.contains('in-project'))$('#context').textContent=rotating ? '拖动旋转，再点「旋转视角」恢复平移。' : '每个星点是一条提交；点击项目探索，或回放它的成长过程。';
}
rotateView.onclick=()=>setRotationMode(rotateView.getAttribute('aria-pressed')!=='true');
setRotationMode(false);
function overviewPosition(){return new T.Vector3(0,ringRadius*3.1,ringRadius*1.7).multiplyScalar(Math.max(1,1.15/cam.aspect))}
function home(){orbit.target.set(0,0,0);cam.position.copy(overviewPosition());orbit.update()}
function resize(){renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;orbit.maxDistance=overviewPosition().length()*1.25;cam.updateProjectionMatrix();orbit.update()}
resize();home();onresize=()=>{resize()};$('#reset').onclick=home;
const geo=new T.BoxGeometry(1,1,1), material=new T.MeshBasicMaterial({transparent:true,opacity:.72});
const mesh=new T.InstancedMesh(geo,material,rows.length);scene.add(mesh);

const coords=[],colors=[], labels=[], neighbors=[], groups=groupNames.map(()=>[]);
rows.forEach((r,i)=>groups[groupNames.indexOf(projectOf(r[4]))].push(i));
const obj=new T.Object3D(), c=new T.Color();
groups.forEach((ids,g)=>{
 const [cx,cz]=centers[g],cells=[],bins=new Map();
 let state=9137+g*417;
 const random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
 const radiusLimit=footprints[g]-.28, spacing=.40;
 const heading=g*.89+.28,cos=Math.cos(heading),sin=Math.sin(heading);
 while(cells.length<ids.length){
   const t=random()*2-1,branch=random()<.62?0:(random()<.5?-1:1);
   const width=Math.sqrt(1-t*t);
   const fork=Math.sin((t+1)*Math.PI)*.43;
   const along=t*.96;
   const across=.22*Math.sin(t*4+g*.4)+branch*fork+(random()+random()-1)*(.09+.33*width);
   if(Math.hypot(along,across)>1)continue;
   const x=radiusLimit*(along*cos-across*sin),z=radiusLimit*(along*sin+across*cos);
   const bx=Math.floor(x/spacing),bz=Math.floor(z/spacing);
   let free=true;
   for(let i=bx-1;i<=bx+1&&free;i++)for(let j=bz-1;j<=bz+1&&free;j++)
     free=!(bins.get(i+','+j)||[]).some(p=>Math.hypot(x-p.x,z-p.z)<spacing);
   if(!free)continue;
   const cell={x,z,t},key=bx+','+bz;
   if(!bins.has(key))bins.set(key,[]);
   bins.get(key).push(cell);cells.push(cell);
 }
 cells.sort((a,b)=>a.t-b.t);
 let radius=0;
 ids.forEach((id,j)=>{
   const {x:px,z:pz}=cells[j],seed=parseInt(rows[id][0].slice(0,6),16)/16777216;
   const h=.38+.48*Math.log1p(rows[id][5]+rows[id][6]);
   const {angle,arc}=sectors[g],phi=angle+px/radiusLimit*arc*.39,radial=ringRadius+pz*.75;
   coords[id]=new T.Vector3(Math.cos(phi)*radial,h*.34,Math.sin(phi)*radial);
   radius=Math.max(radius,pz);
   obj.position.copy(coords[id]);obj.rotation.y=g*.43;obj.scale.set(.22,h*.68,.22);obj.updateMatrix();mesh.setMatrixAt(id,obj.matrix);
   colors[id]=new T.Color().setHSL(hues[g]+seed*.025,.52,.32+seed*.29);mesh.setColorAt(id,colors[id]);neighbors[id]=ids[j+1];
 });
 const label=document.createElement('button');label.dataset.minZoom=order.indexOf(groupNames[g])>7?'1':'0';label.onclick=()=>focusProject(g);label.className=priority.slice(0,3).includes(groupNames[g])?"label primary":"label";label.textContent=groupNames[g].replace(/^LightX2V-/,"")+" · "+ids.length;sky.append(label);labels.push([label,new T.Vector3(cx*1.13,0,cz*1.13),ids[0]]);
});
// Anchor each year in its chronological band of commit prisms.
const yearRegions=groups.map(ids=>['2025','2026'].flatMap((year,index)=>{
 const band=ids.filter(id=>rows[id][1].startsWith(year));
 if(!band.length)return [];
 const label=document.createElement('span');
 label.className='region-year';label.textContent=year;label.hidden=true;sky.append(label);
 return [{band,label,index}];
}));
function positionYears(){
 const box=sky.getBoundingClientRect(),used=[];
 for(let g=0;g<yearRegions.length;g++)for(const {label,band,index} of yearRegions[g]){
   label.hidden=true;
   if(g!==activeProject||band[0]>=limit)continue;
   let end=band.length;
   if(band[end-1]>=limit){
     let low=0,high=end;
     while(low<high){const mid=(low+high)>>1;if(band[mid]<limit)low=mid+1;else high=mid}
     end=low;
   }
   // Try representative columns on opposite sides before falling back to a nearby one.
   for(const fraction of [index ? .76 : .32,.52,.17,.89,.05]){
     const v=vec.copy(coords[band[Math.floor((end-1)*fraction)]]);
     v.y=v.y*2+.7;v.project(cam);
     const x=(1+v.x)*box.width/2,y=(1-v.y)*box.height/2;
     if(Math.abs(v.z)>1||x<30||x>box.width-30||y<100||y>box.height-96)continue;
     const dy=used.some(pt=>Math.abs(pt.x-x)<58&&Math.abs(pt.y-y)<25)?-29:0;
     label.style.left=x+'px';label.style.top=(y+dy)+'px';label.hidden=false;
     used.push({x,y:y+dy});break;
   }
 }
}
const field=createRingField(scene,ringRadius);
// Each star sits at the tip of its own commit prism.
const tips=new T.BufferGeometry();
tips.setAttribute('position',new T.Float32BufferAttribute(coords.flatMap(v=>[v.x,v.y*2,v.z]),3));
tips.setAttribute('emphasis',new T.Float32BufferAttribute(new Array(rows.length).fill(1),1));
tips.setAttribute('seed',new T.Float32BufferAttribute(rows.map(r=>parseInt(r[0].slice(0,4),16)/65535),1));
const wave={value:new T.Vector3(0,0,-100)};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const starMaterial=new T.ShaderMaterial({
 transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 uniforms:{clock:{value:0},wave,pixelRatio:{value:renderer.getPixelRatio()},motion:{value:reduced.matches?0:1}},
 vertexShader:`attribute float seed,emphasis;uniform float clock,pixelRatio,motion;uniform vec3 wave;varying float light,crest;
 void main(){vec4 mv=modelViewMatrix*vec4(position,1.);
 float age=clock-wave.z;float distanceToHit=distance(position.xz,wave.xy);
 float phase=distanceToHit-age*6.;crest=(exp(-phase*phase*5.)+.60*exp(-pow(phase+1.4,2.)*6.)+.32*exp(-pow(phase+2.8,2.)*6.))*exp(-age*1.2)*step(0.,age)*motion;
 light=(.28+pow(seed,4.)*2.3+crest*3.)*emphasis;
 gl_PointSize=clamp((2.+pow(seed,9.)*19.+crest*8.)*pixelRatio*72./max(16.,-mv.z),2.,42.);
 gl_Position=projectionMatrix*mv;}`,
 fragmentShader:`varying float light,crest;void main(){
 vec2 uv=gl_PointCoord-.5;float r=length(uv);
 float core=exp(-r*r*105.);float halo=exp(-r*r*18.)*.30;
 float glint=exp(-abs(uv.x)*105.-abs(uv.y)*7.)+exp(-abs(uv.y)*105.-abs(uv.x)*7.);
 vec3 tint=mix(vec3(.33,.78,.90),vec3(.94,1.,1.),min(1.,core+crest));
 gl_FragColor=vec4(tint,clamp((core+halo+glint*.26)*light,0.,1.));}`
});
const stars=new T.Points(tips,starMaterial);stars.renderOrder=3;scene.add(stars);
const events=await (await fetch('milestones.json')).json(),pins=[];
for(const name of [...new Set(rows.map(r=>r[4]))]){
 const first=rows.find(row=>row[4]===name);
 const origin=name+' · 最早收录的提交';
 events[first[0]]=events[first[0]] ? origin+' / '+events[first[0]] : origin;
}
// Use the commit prism's own geometry for the marker.
const litFace=new T.MeshBasicMaterial({color:0xffd8ad,transparent:true,opacity:.85});
const litEdge=new T.MeshBasicMaterial({color:0xd89d79,transparent:true,opacity:.64});
const capFaces=[litEdge,litEdge,litFace,litEdge,litEdge,litEdge];
const facet=new T.BoxGeometry(.28,.16,.28);
const hitSphere=new T.SphereGeometry(.25,12,8);
const hitMaterial=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
rows.forEach(([sha],id)=>{if(!events[sha])return;
 const base=coords[id],pin=new T.Group();pin.position.set(base.x,base.y*2,base.z);
 const cap=new T.Mesh(hitSphere,hitMaterial);cap.position.y=.08;cap.userData.commit=id;
 const crown=new T.Mesh(facet,capFaces);
 crown.rotation.y=groupNames.indexOf(projectOf(rows[id][4]))*.43;cap.add(crown);
 pin.add(cap);scene.add(pin);pins.push({id,pin,cap});
});
material.onBeforeCompile=s=>{
 s.vertexShader='varying vec3 localPos;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlocalPos=position;');
 s.fragmentShader='varying vec3 localPos;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec3 d=.5-abs(localPos); float e=min(max(d.x,d.y),min(max(d.x,d.z),max(d.y,d.z))); float rim=1.-smoothstep(.012,.12,e);diffuseColor.rgb*=.24+.5*rim; diffuseColor.rgb+=vec3(.07,.19,.21)*rim;diffuseColor.a=.22+.32*rim;');
};
let activeProject=-1,flight=null,userMuted=false;
let selected=-1,hover=-1,limit=rows.length,query='',audio,enabled=false,playing=false,elapsed=0;
let matches=new Set(), pulses=[],lastNote=0;
function update(){limit=+range.value+1;const day=rows[limit-1][1];mesh.count=limit;let monthly=0;tips.setDrawRange(0,limit);for(const {pin,id} of pins)pin.visible=id<limit;$('#date').textContent=day;matches.clear();
 groups.forEach((ids,g)=>{
 const visible=ids.filter(i=>i<limit);
 const cutoff=Date.parse(day)-29*86400000;
 const recent=visible.filter(i=>Date.parse(rows[i][1])>=cutoff).length;
 const main=priority.indexOf(groupNames[g]);if(main>=0&&main<3)field.uniforms.heat.value.setComponent(main,Math.log1p(recent)/7);
 monthly+=recent;labels[g][0].dataset.recent=recent;const label=labels[g][0];
 const name=document.createElement('strong'),stat=document.createElement('small');
 name.textContent=groupNames[g];stat.textContent='累计提交 '+visible.length.toLocaleString()+' 次';
 label.replaceChildren(name,stat);
 });

 const authors=new Set();for(let i=0;i<limit;i++){authors.add(rows[i][2]);if(query&&rows[i][2].normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s._-]+/g,'').includes(query.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\s._-]+/g,'')))matches.add(i)}
 $('#count').textContent=limit.toLocaleString()+' 次提交 · '+authors.size+' 个 Git 作者名'+(query?' · 匹配 '+matches.size+' 次提交':'');
 if(selected>=limit){selected=-1;$('#detail').replaceChildren()}paint();}
function paint(){for(let i=0;i<limit;i++){c.copy(colors[i]);if(query&&!matches.has(i))c.multiplyScalar(.11);if(matches.has(i))c.set('#e0fbff');if(i===selected)c.set('#ffd799');mesh.setColorAt(i,c);}mesh.instanceColor.needsUpdate=true;const weights=tips.getAttribute('emphasis');for(let i=0;i<rows.length;i++)weights.setX(i,query&&!matches.has(i)?.025:1);weights.needsUpdate=true}
range.oninput=()=>{stop();playback.hidden=true;update()};$('#search').oninput=e=>{query=e.target.value.trim().toLowerCase();update()};
function stop(){playing=false;$('#play').textContent='回放提交历史';$('#play').setAttribute('aria-pressed','false');const status=document.querySelector('.playback-story span');if(status)status.textContent=status.textContent.replace('正在回放','已暂停')}
$('#play').onclick=()=>{if(playing){stop();return}if(+range.value===+range.max)range.value=0;playing=true;elapsed=0;$('#play').textContent='暂停';update()};
function unlock(){audio??=new AudioContext();audio.resume().catch(()=>{});enabled=true;$('#sound').textContent='静音'}
$('#sound').onclick=()=>{if(enabled){userMuted=true;enabled=false;hushWind(.018);$('#sound').textContent='开启声音'}else {userMuted=false;unlock()}};
let wind,previousPointer=null,windTimer;
function hushWind(decay=.28){
 clearTimeout(windTimer);
 if(!wind)return;
 wind.level.gain.setTargetAtTime(0,audio.currentTime,decay);
}
function makeWind(){
 const buffer=audio.createBuffer(1,audio.sampleRate*5,audio.sampleRate);
 const samples=buffer.getChannelData(0);
 let low=0;
 for(let i=0;i<samples.length;i++){
   low=low*.93+(Math.random()*2-1)*.07;
   samples[i]=low*3;
 }
 // Crossfade the wrap so a sustained sweep has no periodic click.
 const blend=Math.floor(audio.sampleRate*.25);
 for(let i=0;i<blend;i++){
   const u=i/blend,idx=samples.length-blend+i;
   samples[idx]=samples[idx]*(1-u)+samples[i]*u;
 }
 const source=audio.createBufferSource(),air=audio.createBiquadFilter(),level=audio.createGain(),pan=audio.createStereoPanner();
 source.buffer=buffer;source.loop=true;source.loopStart=blend/audio.sampleRate;source.loopEnd=buffer.duration;
 air.type='lowpass';air.Q.value=.48;air.frequency.value=830;level.gain.value=0;
 source.connect(air).connect(level).connect(pan).connect(audio.destination);source.start();
 return {air,level,pan};
}
function blowWind(speed,x,nearProject){
 if(!enabled||audio?.state!=='running'||speed<.005)return;
 wind??=makeWind();
 const strength=Math.min(speed/1.4,1),t=audio.currentTime;
 wind.air.frequency.setTargetAtTime(720+strength*490,t,.24);
 wind.level.gain.setTargetAtTime((.018+.035*strength)*(nearProject ? .48 : 1),t,.17);
 wind.pan.pan.setTargetAtTime((x/innerWidth-.5)*.8,t,.22);
 clearTimeout(windTimer);windTimer=setTimeout(()=>hushWind(),150);
}
const voices=[
 ['玻璃琴','sine',2.76,.008,.85],['木琴','sine',3.98,.004,.32],['拨弦','triangle',2,.006,.60],
 ['柔笛','sine',2,.07,.65],['低音弦','triangle',1.5,.03,.72],['钢片琴','sine',4.2,.006,1.2],['竖琴','triangle',2.8,.012,.96],['管风琴','sine',3,.05,.82],['钟琴','sine',5.4,.008,1.35],['簧管','triangle',3,.035,.55],['手碟','sine',1.49,.012,.68]
];
function voice(id,pitch,delay,gain){
 const group=groupNames.indexOf(projectOf(rows[id][4])),[,wave,harmonic,attack,tail]=voices[group%voices.length];
 const t=audio.currentTime+delay,f=330*2**((pitch+(group===4?-7:0))/12);
 const decay=Math.min(.62,tail*.74);
 // The impact partial disappears first, leaving the quieter pitched body.
 for(const [ratio,level,duration,rise] of [[1,.055,decay,Math.min(.009,attack)],[harmonic,.036,.12,.0025],[Math.min(7.1,harmonic+2.31),.018,.048,.0018]]){
   const osc=audio.createOscillator(),env=audio.createGain();
   osc.type=ratio===1?wave:'sine';osc.frequency.value=Math.min(f*ratio,8800);
   env.gain.setValueAtTime(.00001,t);env.gain.exponentialRampToValueAtTime(level*gain,t+rise);
   env.gain.exponentialRampToValueAtTime(.00001,t+duration);
   osc.connect(env).connect(audio.destination);osc.start(t);osc.stop(t+duration+.01);
   osc.onended=()=>{osc.disconnect();env.disconnect()};
 }
}
function tone(id){const now=performance.now();if(!enabled||now-lastNote<65)return;lastNote=now;
 const pitch=[0,2,4,7,9,12,14,16,19,21][id%10];voice(id,pitch,0,1);
 if(events[rows[id][0]]){voice(groups[1][0],pitch+4,.07,.6);voice(groups[3][0],pitch+7,.12,.56)}
}
const glow=document.createElement('canvas');glow.width=glow.height=64;const ctx=glow.getContext('2d'),grad=ctx.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'white');grad.addColorStop(.12,'#dfffff');grad.addColorStop(.36,'#65ebfbaa');grad.addColorStop(1,'#38aaff00');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
const sparkMat=new T.SpriteMaterial({map:new T.CanvasTexture(glow),transparent:true,depthWrite:false,blending:T.AdditiveBlending});
function strike(id,positions=coords){wave.value.set(positions[id].x,positions[id].z,performance.now()/1000);tone(id);let path=[id];for(let j=0;j<4;j++){let n=neighbors[path.at(-1)];if(n===undefined||n>=limit)break;path.push(n)}const dot=new T.Sprite(sparkMat);dot.scale.setScalar(2.6);scene.add(dot);pulses.push({dot,path,positions,start:performance.now()})}
const ray=new T.Raycaster();
let hitPositions=coords;
function hit(e){ray.setFromCamera({x:e.clientX/innerWidth*2-1,y:1-e.clientY/innerHeight*2},cam);const target=ray.intersectObjects([mesh,...pins.filter(p=>p.pin.visible).map(p=>p.cap)],false)[0];hitPositions=coords;return target?.object.userData.commit??target?.instanceId??-1}
const tip=document.createElement('div');
tip.className='commit-tip';tip.hidden=true;sky.append(tip);
// Pick a point on the visible fibre volume, even when orbiting near its side.

const canvas=renderer.domElement, panel=$('#detail');
function closePanel(){panel.replaceChildren();selected=-1;paint()}
function fly(target,position){
 flight={from:cam.position.clone(),to:position,origin:orbit.target.clone(),target,start:performance.now()};
}
function focusProject(g){
  document.body.classList.add('in-project');stop();selector.value=String(g);activeProject=g;closePanel();tip.hidden=true;hover=-1;
 
 const [x,z]=centers[g],target=new T.Vector3(x,1,z);
 const size=Math.max(4,footprints[g]);
 const offset=new T.Vector3(.35,1.38,.76).multiplyScalar(size*1.95*Math.max(1,1/cam.aspect));
 fly(target,target.clone().add(offset));
 $('header h1').textContent=groupNames[g];$('#context').hidden=true;
 $('#reset').textContent='返回全景';
}
const selector=$('#project-select');
for(const name of order){const option=new Option(name,groupNames.indexOf(name));selector.add(option)}
selector.onchange=()=>{if(selector.value!=='')focusProject(Number(selector.value))};
$('#reset').onclick=()=>{document.body.classList.remove('in-project');selector.value='';activeProject=-1;closePanel();tip.hidden=true;fly(new T.Vector3(),overviewPosition());$('header h1').textContent='提交历史';$('#context').hidden=false;setRotationMode(false);$('#reset').textContent='全景'};
function projectAt(e,id){
 if(id>=0)return groupNames.indexOf(projectOf(rows[id][4]));
 const surface=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());
 return surface?centers.findIndex(([x,z],g)=>Math.hypot(surface.x-x,surface.z-z)<Math.max(3,footprints[g])&&groups[g][0]<limit):-1;
}
function changeSummary(row){
 const [, , , , ,added,removed,binary]=row;
 const total=(added+removed).toLocaleString('zh-CN');
 const summary='变更 '+total+' 行　+'+added.toLocaleString('zh-CN')+' / −'+removed.toLocaleString('zh-CN');
 return binary?summary+'　·　另含 '+binary+' 个二进制文件':summary;
}
function showCommit(i){
 stop();selected=i;paint();const [sha,date,name,title,repo]=rows[i];panel.replaceChildren();
 const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','关闭提交详情');close.onclick=closePanel;
 const hash=document.createElement('code');hash.textContent=(events[sha]?'里程碑　':'提交　')+sha.slice(0,8);
 const heading=document.createElement('h2');heading.textContent=events[sha]||title;
 const meta=document.createElement('p');meta.textContent=repo+' · '+name+' · '+date;
 const base='https://github.com/ModelTC/'+repo;
 const diff=document.createElement("p");diff.className="diff-stat";diff.textContent=changeSummary(rows[i]);
 for(const item of [close,hash,heading,meta,diff])panel.append(item);
 for(const [label,url] of [['查看这次提交 ↗',base+'/commit/'+sha],['项目仓库 ↗',base]]){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=label;panel.append(a)}
}
let down=null;
const pressed=new Set();
function zoomBy(factor){
 flight=null;
 const offset=cam.position.clone().sub(orbit.target);
 offset.setLength(T.MathUtils.clamp(offset.length()*factor,orbit.minDistance,orbit.maxDistance));
 cam.position.copy(orbit.target).add(offset);orbit.update();
}
const zoomLevel=$('#zoom-level');
const zoomSpan=()=>Math.log(orbit.maxDistance/orbit.minDistance);
function syncZoomLevel(){
 const distance=cam.position.distanceTo(orbit.target);
 zoomLevel.value=Math.round(1000*Math.log(orbit.maxDistance/distance)/zoomSpan());
 zoomLevel.setAttribute('aria-valuetext',Math.round(Number(zoomLevel.value)/10)+'%');
}
zoomLevel.oninput=()=>{
 const distance=orbit.maxDistance*Math.exp(-Number(zoomLevel.value)*zoomSpan()/1000);
 zoomBy(distance/cam.position.distanceTo(orbit.target));
};
orbit.addEventListener('change',syncZoomLevel);
syncZoomLevel();
$('#zoom-in').onclick=()=>zoomBy(.78);
$('#zoom-out').onclick=()=>zoomBy(1/.78);
// Labels sit above the canvas; scrolling over one must still move the camera.
sky.addEventListener('wheel',e=>{
 if(e.target===canvas)return;
 e.preventDefault();
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
 zoomBy(Math.exp(T.MathUtils.clamp(delta*.002,-.7,.7)));
},{passive:false});
canvas.addEventListener('pointercancel',e=>{pressed.delete(e.pointerId);down=null});
canvas.onpointerdown=e=>{flight=null;tip.hidden=true;pressed.add(e.pointerId);down=e.button===0&&pressed.size===1?[e.clientX,e.clientY]:null};
canvas.onwheel=()=>{flight=null};
canvas.onpointermove=e=>{
 if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)down=null;
 if(pressed.size||e.buttons||flight)return;const i=hit(e);
 const point=i>=0?coords[i]:field.pick(ray.ray,3);
 const now=performance.now();
 if(point&&previousPointer){
   const speed=Math.hypot(e.clientX-previousPointer.x,e.clientY-previousPointer.y)/Math.max(1,now-previousPointer.t);
   blowWind(speed,e.clientX,i>=0||activeProject>=0);
 }
 previousPointer={x:e.clientX,y:e.clientY,t:now};
 if(point&&!reduced.matches)field.excite(point.x,point.z,performance.now()/1000);
 if(activeProject<0){
   const g=projectAt(e,i);
   if(g>=0&&g!==hover)tone(i>=0?i:groups[g][0]);
   hover=g;canvas.style.cursor=g>=0?'pointer':'grab';return
 }
 const valid=i>=0&&projectOf(rows[i][4])===groupNames[activeProject]&&hitPositions===coords;
 canvas.style.cursor=valid?'pointer':'grab';tip.hidden=!valid;
 if(valid){if(i!==hover)strike(i,coords);tip.textContent=(events[rows[i][0]]||rows[i][3])+"\n"+changeSummary(rows[i]);
 tip.style.left=Math.min(innerWidth-tip.offsetWidth-6,e.clientX+12)+'px';tip.style.top=Math.max(4,e.clientY-tip.offsetHeight-8)+'px'}
 hover=valid?i:-1;
};
canvas.onpointerleave=()=>{previousPointer=null;hushWind();tip.hidden=true;hover=-1};
canvas.onpointerup=e=>{
 pressed.delete(e.pointerId);
 const start=down;down=null;
 if(e.button!==0||!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;
 const i=hit(e),g=projectAt(e,i);
 if(g<0)return;
 if(activeProject!==g)focusProject(g);
 if(i<0)return;
 stop();strike(i,coords);showCommit(i);tip.hidden=true;
 const target=coords[i].clone();
 const direction=cam.position.clone().sub(orbit.target);
 const framing=(target.y*2+1.5)/(2*Math.tan(T.MathUtils.degToRad(cam.fov/2)))*2.2;
 const distance=Math.max(orbit.minDistance,Math.min(direction.length()*.72,Math.max(6,framing)));
 fly(target,target.clone().add(direction.setLength(distance)));
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel.childElementCount)closePanel();else $('#reset').click()}});
const playback=document.createElement('button');playback.className='playback-story';playback.hidden=true;sky.append(playback);
playback.onclick=()=>{stop();showCommit(replayCurrent)};
let replayIds=[],replayCursor=0,replayCurrent=0;
const norm=value=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s._-]+/g,'');
const results=document.createElement('div');results.className='author-results';results.hidden=true;results.setAttribute('aria-label','作者搜索结果');document.querySelector('.search-wrap').append(results);
function searchAuthors(){
 stop();playback.hidden=true;flight=null;query=$('#search').value.trim().toLowerCase();range.value=range.max;update();results.replaceChildren();results.hidden=!query;
 if(!query)return;
 const byAuthor=new Map();rows.forEach((r,i)=>{if(norm(r[2]).includes(norm(query))){if(!byAuthor.has(r[2]))byAuthor.set(r[2],[]);byAuthor.get(r[2]).push(i)}});
 const summary=document.createElement('p');summary.setAttribute('role','status');summary.textContent=byAuthor.size?`找到 ${byAuthor.size} 位作者，点击查看提交`:'没有匹配的 Git 作者名。可尝试姓名片段或提交时使用的昵称。';results.append(summary);
 for(const [name,ids] of [...byAuthor].sort((a,b)=>b[1].length-a[1].length).slice(0,20)){
  const b=document.createElement('button');b.textContent=name+' · '+ids.length+' 次提交';b.onclick=()=>{
   query=name.toLowerCase();$('#search').value=name;range.value=range.max;update();results.replaceChildren();
   const title=document.createElement('p');title.textContent=name+' · 最近提交';results.append(title);
   for(const i of ids.slice(-30).reverse()){const row=document.createElement('button');row.textContent=rows[i][1]+' · '+rows[i][4]+' · '+rows[i][3];row.onclick=()=>{focusProject(groupNames.indexOf(projectOf(rows[i][4])));showCommit(i);strike(i);results.hidden=true};results.append(row)}
   const first=ids.at(-1);focusProject(groupNames.indexOf(projectOf(rows[first][4])));strike(first);
  };results.append(b);
 }
}
$('#search').oninput=searchAuthors;
$('#search').addEventListener('focus',()=>{if($('#search').value)results.hidden=false});
$('#search').addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;e.stopPropagation()}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.search-wrap'))results.hidden=true});
$('#play').onclick=()=>{
 if(playing){stop();return}
 query=$('#search').value.trim().toLowerCase();
 replayIds=rows.map((r,i)=>i).filter(i=>(activeProject<0||projectOf(rows[i][4])===groupNames[activeProject])&&(!query||norm(rows[i][2]).includes(norm(query))));
 if(!replayIds.length){results.hidden=false;return}
 replayCursor=replayIds.findIndex(i=>i>Number(range.value));if(replayCursor<0)replayCursor=0;
 selected=-1;panel.replaceChildren();results.hidden=true;playing=true;elapsed=200;$('#play').textContent='暂停回放';$('#play').setAttribute('aria-pressed','true');
};
const resetHistory=$('#reset').onclick;$('#reset').onclick=()=>{stop();playback.hidden=true;range.value=range.max;update();resetHistory()};
update();let last=performance.now();const vec=new T.Vector3();
// The opening pulls back from the centre of this same ring of real commits.
if(!reduced.matches){cam.position.set(0,ringRadius*.38,ringRadius*.16);orbit.target.set(0,0,0);orbit.update();fly(new T.Vector3(),overviewPosition());flight.duration=2400;field.uniforms.entry.value=1;}
renderer.setAnimationLoop(now=>{starMaterial.uniforms.clock.value=now/1000;if(document.hidden){last=now;return}if(playing){elapsed+=Math.min(100,now-last);if(elapsed>160){elapsed=0;
 replayCurrent=replayIds[replayCursor];range.value=replayCurrent;update();strike(replayCurrent);
 playback.hidden=false;playback.replaceChildren();const project=document.createElement('span'),title=document.createElement('strong'),meta=document.createElement('small');
 project.textContent='正在回放 · '+projectOf(rows[replayCurrent][4]);title.textContent=events[rows[replayCurrent][0]]||rows[replayCurrent][3];meta.textContent=rows[replayCurrent][1]+' · '+rows[replayCurrent][2]+' · 点击查看提交';playback.append(project,title,meta);
 const batch=Math.max(1,Math.ceil(replayIds.length/450));const nextEvent=replayIds.slice(replayCursor+1,replayCursor+batch+1).find(i=>events[rows[i][0]]);
 replayCursor=nextEvent===undefined?replayCursor+batch:replayIds.indexOf(nextEvent);
 if(events[rows[replayCurrent][0]])elapsed=-1400;
 if(replayCursor>=replayIds.length){range.value=replayIds.at(-1);update();stop();project.textContent='回放完成 · '+projectOf(rows[replayCurrent][4]);}
 }}last=now;
 if(flight){const t=reduced.matches?1:Math.min(1,(now-flight.start)/(flight.duration||850)),k=t*t*(3-2*t);
 cam.position.lerpVectors(flight.from,flight.to,k);orbit.target.lerpVectors(flight.origin,flight.target,k);
 if(t===1)flight=null}orbit.update();
 field.uniforms.time.value=reduced.matches?0:now*.001;field.uniforms.entry.value=Math.max(0,field.uniforms.entry.value-.012);
 positionYears();
 const occupied=[];
 for(const name of [...priority.slice(0,3),...order.filter(n=>!priority.slice(0,3).includes(n))]){
 const [el,pos,first]=labels[groupNames.indexOf(name)],primary=el.classList.contains('primary');
 vec.copy(pos).project(cam);el.hidden=activeProject>=0||first>=limit||(!primary&&(innerWidth<700||order.indexOf(name)>7)&&cam.position.distanceTo(pos)>ringRadius*1.6)||Math.abs(vec.x)>1||Math.abs(vec.y)>1||vec.z>1;
 if(el.hidden)continue;
 const x=(vec.x+1)*innerWidth/2,y=(1-vec.y)*innerHeight/2,w=el.offsetWidth/2,h=el.offsetHeight;
 const left=Math.max(w+4,Math.min(innerWidth-w-4,x));
 const top=Math.min(innerHeight-90,Math.max(innerWidth<700?172:100,y));
 const box={l:left-w-4,r:left+w+4,t:top-h-3,b:top+3};
 if(occupied.some(q=>box.l<q.r&&box.r>q.l&&box.t<q.b&&box.b>q.t)){if(!primary){el.hidden=true;continue}box.t-=h+6;box.b-=h+6}
 occupied.push(box);el.style.left=left+'px';el.style.top=(box.b-3)+'px';
 }

 pulses=pulses.filter(({dot,path,positions,start})=>{const t=(now-start)/180,j=Math.max(0,Math.floor(t));if(j>=path.length||path[j]>=limit){scene.remove(dot);return false}const a=positions[path[j]],b=positions[path[Math.min(j+1,path.length-1)]];dot.position.copy(a).lerp(b,Math.max(0,t-j));dot.position.y*=2;dot.position.y+=.15+Math.sin(Math.PI*(t-j))*.35;dot.scale.setScalar(2.7*(1-t/path.length)+.35);return true});
 renderer.render(scene,cam)});
