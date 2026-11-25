import * as T from '../three.module.js';
import {OrbitControls} from '../orbit.js';
const $=s=>document.querySelector(s),sky=$('#sky');
const [rows,events]=await Promise.all(['history.json','/milestones.en.json?v=english-milestones'].map(p=>fetch(p).then(r=>r.json())));
const aliases=await fetch('author-aliases.json').then(r=>r.json()).catch(()=>({}));
const profiles=await fetch('author-profiles.json').then(r=>r.json()).catch(()=>({}));
const project=r=>/lightx2v/i.test(r[4])?'LightX2V':r[4];
const counts=new Map();rows.forEach(r=>counts.set(project(r),(counts.get(project(r))||0)+1));
const projects=[...counts.keys()].sort((a,b)=>(b==='LightX2V')-(a==='LightX2V')||counts.get(b)-counts.get(a));
const palette=['#76dee7','#ac9cff','#f4ba76','#f28dbb','#87d5a0','#7eafff','#e3df87','#c3a0dc'];
const colors=projects.map((_,i)=>new T.Color(i<palette.length?palette[i]:new T.Color().setHSL((i*.618)%1,.5,.65)));
const months=[...new Set(rows.map(r=>r[1].slice(0,7)))].sort().reverse(),layers=months.map(()=>[]);
rows.forEach((r,i)=>layers[months.indexOf(r[1].slice(0,7))].push(i));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));sky.append(renderer.domElement);
const scene=new T.Scene();scene.fog=new T.FogExp2('#03060c',.005);
const camera=new T.PerspectiveCamera(65,1,.1,1600),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enableZoom=false;controls.enablePan=true;controls.mouseButtons.LEFT=T.MOUSE.ROTATE;controls.mouseButtons.RIGHT=T.MOUSE.PAN;controls.minPolarAngle=.02;controls.maxPolarAngle=Math.PI-.02;
scene.add(new T.AmbientLight('#dceaff',.9));const light=new T.PointLight('#e9fbff',650,220,1.5);scene.add(light);
const material=new T.MeshStandardMaterial({roughness:.55,metalness:.25,emissive:'#263238',emissiveIntensity:.22});
const blockShape=new T.Shape();blockShape.moveTo(-.45,-.45);blockShape.lineTo(.45,-.45);blockShape.lineTo(.45,.45);blockShape.lineTo(-.45,.45);blockShape.closePath();
const blockGeometry=new T.ExtrudeGeometry(blockShape,{depth:.9,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2,steps:1,curveSegments:1});blockGeometry.translate(0,0,-.45);
const pillars=new T.InstancedMesh(blockGeometry,material,rows.length);scene.add(pillars);
// A sparse, non-interactive depth layer; commit pillars remain the visual focus.
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
const glowContext=glowCanvas.getContext('2d'),glow=glowContext.createRadialGradient(32,32,0,32,32,32);
glow.addColorStop(0,'rgba(220,237,242,.8)');glow.addColorStop(.28,'rgba(220,237,242,.55)');glow.addColorStop(.65,'rgba(220,237,242,.12)');glow.addColorStop(1,'rgba(220,237,242,0)');
glowContext.fillStyle=glow;glowContext.fillRect(0,0,64,64);
const glowTexture=new T.CanvasTexture(glowCanvas),atmosphere=new T.Group();camera.add(atmosphere);scene.add(camera);
const motes=Array.from({length:16},(_,i)=>{
 const angle=i*2.39996,radius=.62+(i%4)*.1;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:glowTexture,color:i%3===0?'#9bbfc8':'#d2d9e4',transparent:true,opacity:.10+(i%3)*.025,depthWrite:false,depthTest:true,fog:false}));
 atmosphere.add(sprite);return {sprite,x:Math.cos(angle)*radius,y:Math.sin(angle)*radius,phase:i*1.73,size:5+(i%5)*3};
});
// Fine world-space dust creates parallax while leaving every commit selectable.
const dustCount=innerWidth<700?480:960,dustPositions=new Float32Array(dustCount*3);
let dustSeed=137;const dustRandom=()=>{dustSeed=(dustSeed*16807)%2147483647;return (dustSeed-1)/2147483646};
for(let i=0;i<dustCount;i++){const a=dustRandom()*Math.PI*2,r=1.8+Math.sqrt(dustRandom())*17;dustPositions[i*3]=Math.cos(a)*r;dustPositions[i*3+1]=Math.sin(a)*r;dustPositions[i*3+2]=35-dustRandom()*(months.length*13+60)}
const dustGeometry=new T.BufferGeometry();dustGeometry.setAttribute('position',new T.BufferAttribute(dustPositions,3));
const dustMaterial=new T.PointsMaterial({color:'#b6d2db',size:.32,transparent:true,opacity:.48,depthWrite:false,sizeAttenuation:true,map:glowTexture,alphaTest:.01});
const dust=new T.Points(dustGeometry,dustMaterial);scene.add(dust);
// A stable star sea: crisp points, sparse colored beacons, and faint interstellar dust.
const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=64;
const sc=starCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,0,32,32,32);
sg.addColorStop(0,'rgba(255,255,255,1)');sg.addColorStop(.12,'rgba(255,255,255,1)');sg.addColorStop(.25,'rgba(255,255,255,.7)');sg.addColorStop(.5,'rgba(255,255,255,.12)');sg.addColorStop(1,'rgba(255,255,255,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);
const starTexture=new T.CanvasTexture(starCanvas);
const starLayers=[{count:2800,size:2.8,opacity:.9},{count:500,size:4.2,opacity:.95},{count:48,size:10,opacity:.9}].map((spec,layer)=>{
 const coords=Array.from({length:spec.count},()=>[dustRandom()*2-1,dustRandom()*2-1]);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(spec.count*3),3));
 const tint=new Float32Array(spec.count*3),choices=['#cbd9e7','#aac6f5','#64caff','#b29bff','#f3cf95'];
 for(let i=0;i<spec.count;i++){const c=new T.Color(choices[layer===2?1+i%4:(i%9===0?2:0)]);c.toArray(tint,i*3)}geometry.setAttribute('color',new T.BufferAttribute(tint,3));
 const points=new T.Points(geometry,new T.PointsMaterial({vertexColors:true,size:spec.size,transparent:true,opacity:spec.opacity,map:starTexture,sizeAttenuation:false,depthWrite:false,fog:false}));
 points.material.onBeforeCompile=shader=>{
  shader.uniforms.breathTime={value:0};
  shader.vertexShader='uniform float breathTime; varying float breath;\n'+shader.vertexShader.replace('void main() {','void main() { breath=.86+.14*sin(breathTime*(.48+fract(position.x*.137)*.22)+position.x*.29+position.y*.41);');
  shader.fragmentShader='varying float breath;\n'+shader.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a *= breath;\n#include <opaque_fragment>');
  points.userData.shader=shader;
 };
 camera.add(points);return {coords,geometry,points};
});
const cloudMaterial=new T.ShaderMaterial({depthWrite:false,depthTest:false,uniforms:{aspect:{value:1}},vertexShader:`varying vec2 uvPosition;void main(){uvPosition=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
 varying vec2 uvPosition;uniform float aspect;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.1;a*=.5;}return v;}
 void main(){vec2 p=(uvPosition-.5)*vec2(aspect,1.);float n=fbm(p*5.+vec2(4.3,2.8));float band=exp(-pow((p.y+.22*sin(p.x*3.5+n*2.))*3.5,2.));float cloud=pow(n,2.)*band;vec3 base=vec3(.002,.005,.012);vec3 hue=mix(vec3(.018,.065,.105),vec3(.058,.033,.10),smoothstep(-.5,.5,p.x));gl_FragColor=vec4(base+hue*cloud*1.9,1.);}`});
const cloudPlane=new T.Mesh(new T.PlaneGeometry(1,1),cloudMaterial);cloudPlane.position.z=-1490;cloudPlane.renderOrder=-100;cloudPlane.frustumCulled=false;camera.add(cloudPlane);
// A star cluster occupies the actual tunnel volume, so it remains visible in the vanishing point.
const coreCount=innerWidth<700?1800:3600,coreCoords=new Float32Array(coreCount*3),coreTint=new Float32Array(coreCount*3);
for(let i=0;i<coreCount;i++){const a=dustRandom()*Math.PI*2,r=Math.sqrt(dustRandom())*20;coreCoords[i*3]=Math.cos(a)*r;coreCoords[i*3+1]=Math.sin(a)*r;coreCoords[i*3+2]=40-dustRandom()*(months.length*13+160);new T.Color(i%19===0?'#78bde7':i%29===0?'#d3b8ed':'#c4d1dd').toArray(coreTint,i*3)}
const coreGeometry=new T.BufferGeometry();coreGeometry.setAttribute('position',new T.BufferAttribute(coreCoords,3));coreGeometry.setAttribute('color',new T.BufferAttribute(coreTint,3));
const coreMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,uniforms:{pixelRatio:{value:renderer.getPixelRatio()},breathTime:{value:0}},vertexShader:`uniform float breathTime; uniform float pixelRatio;varying vec3 starColor;varying float visibility;void main(){starColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);float d=-mv.z;visibility=(.86+.14*sin(breathTime*.6+position.x*.7+position.z*.11))*smoothstep(5.,30.,d)*(1.-smoothstep(650.,1300.,d));gl_PointSize=clamp(65./max(d,1.),1.65,4.2)*pixelRatio;gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec3 starColor;varying float visibility;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.1,1.,r))*.78*visibility;if(a<.01)discard;gl_FragColor=vec4(starColor,a);}`});
scene.add(new T.Points(coreGeometry,coreMaterial));
function resizeStars(){const h=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*1450,w=h*camera.aspect;for(const layer of starLayers){const a=layer.geometry.attributes.position;layer.coords.forEach(([x,y],i)=>a.setXYZ(i,x*w/2,y*h/2,-1450));a.needsUpdate=true;layer.geometry.computeBoundingSphere()}cloudPlane.scale.set(w*1490/1450,h*1490/1450,1);cloudMaterial.uniforms.aspect.value=camera.aspect}
const selectedMarker=new T.Mesh(new T.BoxGeometry(1.025,1.025,1.025),new T.MeshBasicMaterial({color:'#e9ffff',transparent:true,opacity:.92,fog:false}));
selectedMarker.matrixAutoUpdate=false;selectedMarker.visible=false;scene.add(selectedMarker);

const streakPositions=new Float32Array(160*6);
for(let i=0;i<160;i++){const offset=i*6,source=i*3;streakPositions.set(dustPositions.slice(source,source+3),offset);streakPositions.set(dustPositions.slice(source,source+3),offset+3);streakPositions[offset+5]+=1.4}
const streakGeometry=new T.BufferGeometry();streakGeometry.setAttribute('position',new T.BufferAttribute(streakPositions,3));
const streakMaterial=new T.LineBasicMaterial({color:'#9cbfcd',transparent:true,opacity:0,depthWrite:false});
scene.add(new T.LineSegments(streakGeometry,streakMaterial));
const travelGlowMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms:{strength:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float strength;void main(){float r=length((v-.5)*2.);float edge=smoothstep(.25,1.35,r);float halo=exp(-pow((r-.68)*5.,2.));gl_FragColor=vec4(.37,.76,.88,strength*(edge*.055+halo*.018));}`});
const travelGlow=new T.Mesh(new T.PlaneGeometry(2,2),travelGlowMaterial);camera.add(travelGlow);travelGlow.position.z=-1;travelGlow.renderOrder=100;
let atmosphereTime=0,travelEnergy=0,previousTravelPosition=0,travelSound;
function updateTravelSound(){
 if(!audio||audio.state!=='running')return;
 if(!travelSound&&enabled){
  const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),samples=buffer.getChannelData(0);let smooth=0;
  for(let i=0;i<samples.length;i++){smooth=(smooth+(Math.random()*2-1)*.02)/1.02;samples[i]=smooth*3.5}
  const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=650;gain.gain.value=0;source.connect(filter).connect(gain).connect(audio.destination);source.start();travelSound={gain,filter};
 }
 if(travelSound){travelSound.gain.gain.setTargetAtTime(enabled&&!document.hidden?travelEnergy*.11:0,audio.currentTime,.16);travelSound.filter.frequency.setTargetAtTime(350+travelEnergy*1000,audio.currentTime,.25)}
}
function updateAtmosphere(dt){
 if(!reduced.matches)atmosphereTime+=dt;
 const height=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*70,width=height*camera.aspect;
 const velocity=dt>0?Math.abs(position-previousTravelPosition)/dt:0;previousTravelPosition=position;
 const targetEnergy=reduced.matches?0:Math.min(1,velocity/4);
 travelEnergy+=(targetEnergy-travelEnergy)*(1-Math.exp(-dt*(targetEnergy>travelEnergy?3:2)));
 starLayers.forEach(layer=>{if(layer.points.userData.shader)layer.points.userData.shader.uniforms.breathTime.value=atmosphereTime});
 coreMaterial.uniforms.breathTime.value=atmosphereTime;
 travelGlowMaterial.uniforms.strength.value=travelEnergy;
 const viewHeight=2*Math.tan(T.MathUtils.degToRad(camera.fov/2));travelGlow.scale.set(viewHeight*camera.aspect/2,viewHeight/2,1);
 updateTravelSound();
 const quiet=.9+.1*Math.sin(atmosphereTime*.5);
 dustMaterial.opacity=.12;
 streakMaterial.opacity=travelEnergy*.12;
 motes.forEach((m,i)=>{const drift=reduced.matches?0:Math.sin(atmosphereTime*.12+m.phase)*.018;
 const z=-(42+(i%4)*18),depthScale=-z/70;
 m.sprite.position.set((m.x+drift)*width/2*depthScale,(m.y+drift*.6)*height/2*depthScale,z);
 const size=m.size*height/innerHeight;m.sprite.scale.setScalar(size);
 m.sprite.material.opacity=(.10+(i%3)*.025)*quiet;
 m.sprite.visible=innerWidth>=700||i%2===0;
 });
}

const positions=[],baseColors=[],layerOf=[],object=new T.Object3D();
for(let l=0;l<layers.length;l++){
 const ids=[...layers[l]].sort((a,b)=>projects.indexOf(project(rows[a]))-projects.indexOf(project(rows[b]))||a-b);
 const slots=Math.min(160,Math.max(24,ids.length)),step=2*Math.PI/slots;
 ids.forEach((id,j)=>{const tier=j%Math.ceil(ids.length/slots),a=j/ids.length*2*Math.PI+l*.043;const length=.9+Math.min(2.2,Math.log1p(rows[id][5]+rows[id][6])*.2),radius=23+tier*3.3+length/2;
  const v=new T.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,-l*13);positions[id]=v;layerOf[id]=l;
  object.position.copy(v);object.rotation.set(0,0,a-Math.PI/2);object.scale.set(Math.min(1.6,23*step*.57),length,2.1);object.updateMatrix();pillars.setMatrixAt(id,object.matrix);
  const color=colors[projects.indexOf(project(rows[id]))].clone().lerp(new T.Color('#a6b9c5'),.16);baseColors[id]=color;pillars.setColorAt(id,color);
 });
 // Quiet rims make sparse early months legible without inventing extra commits.
 const ring=new T.Mesh(new T.TorusGeometry(22.6,.035,4,128),new T.MeshBasicMaterial({color:'#9caab8',transparent:true,opacity:.18}));ring.position.z=-l*13;scene.add(ring);
}
pillars.instanceMatrix.needsUpdate=true;pillars.instanceColor.needsUpdate=true;
const monthLabels=months.map((month,l)=>{const b=document.createElement('button');b.className='tunnel-layer-label';b.textContent=month.slice(0,4);b.onclick=()=>seekLayer(l);sky.append(b);return b});
const legend=document.createElement('div');legend.className='tunnel-legend';legend.setAttribute('aria-label','Project colors');document.querySelector('header>div:first-child').append(legend);
for(let g=0;g<Math.min(7,projects.length);g++){const b=document.createElement('button');b.style.setProperty('--project-color','#'+colors[g].getHexString());b.textContent=projects[g];b.onclick=()=>selectProject(projects[g]);legend.append(b)}
const live=document.createElement('div');live.className='tunnel-live';live.hidden=true;sky.append(live);
const range=$('#timeline');range.min=0;range.max=months.length-1;range.value=0;range.setAttribute('aria-label','Timeline position');
$('#year-ticks').replaceChildren();for(let i=0;i<months.length;i++){if(i===0||months[i].slice(0,4)!==months[i-1].slice(0,4)){const s=document.createElement('span');s.textContent=months[i].slice(0,4);s.style.left=i/(months.length-1)*100+'%';$('#year-ticks').append(s)}}
let overview=true,completed=false;
const invitation=document.createElement('div');invitation.className='tunnel-invitation';invitation.hidden=true;invitation.innerHTML='<h2>BUILD WITH US</h2><p>The next chapter starts with you.</p><a href="/en/#community">Join the community ↗</a>';sky.append(invitation);
function clearEnding(){completed=false;invitation.hidden=true}
let position=0,target=0,playing=false,selected=-1,hover=-1,filter='',query='',last=0,hold=0,lastLayer=-1,lastTone=0,enabled=localStorage.getItem('history-sound')!=='off',audio,dragStart=null,interaction=false;
const normal=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s._-]+/g,'');
const authorTerms=rows.map(r=>[r[2],...(aliases[r[2]]||[])].map(normal));
const authorMatches=(i,q)=>!q||authorTerms[i].some(n=>n.includes(normal(q)));
function match(i){return (!filter||project(rows[i])===filter)&&(!query||authorMatches(i,query))}
// Only the explored bar changes gently; the surrounding scene stays steady.
const pendingColors=new Map(),currentColor=new T.Color();
function paint(){
 selectedMarker.visible=selected>=0;
 if(selected>=0){pillars.getMatrixAt(selected,selectedMarker.matrix);selectedMarker.matrixWorldNeedsUpdate=true}
 const c=new T.Color(),white=new T.Color('#d9eef2');
 for(let i=0;i<rows.length;i++){
  c.copy(baseColors[i]);
  if(!match(i))c.multiplyScalar(.08);
  else if(i===selected)c.set('#f1ffff');
  else if(i===hover)c.lerp(white,.12);
  pillars.getColorAt(i,currentColor);
  if(Math.abs(c.r-currentColor.r)+Math.abs(c.g-currentColor.g)+Math.abs(c.b-currentColor.b)>.001)pendingColors.set(i,c.clone());
  else pendingColors.delete(i);
 }
}
function easeColors(dt){
 if(!pendingColors.size)return;
 const amount=reduced.matches?1:1-Math.exp(-dt*9);
 for(const [i,targetColor] of pendingColors){
  pillars.getColorAt(i,currentColor);currentColor.lerp(targetColor,amount);
  if(Math.abs(currentColor.r-targetColor.r)+Math.abs(currentColor.g-targetColor.g)+Math.abs(currentColor.b-targetColor.b)<.001){currentColor.copy(targetColor);pendingColors.delete(i)}
  pillars.setColorAt(i,currentColor);
 }
 pillars.instanceColor.needsUpdate=true;
}
function clearHover(){if(hover>=0){hover=-1;paint()}renderer.domElement.style.cursor='grab'}

let roll=0;
function setCamera(){camera.up.set(Math.sin(roll),Math.cos(roll),0);camera.position.set(4,2,48-position*13);controls.target.set(0,0,camera.position.z-90);controls.update()}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?78:65;camera.updateProjectionMatrix();resizeStars()}
resize();setCamera();addEventListener('resize',resize);
function stop(){intro=0;playing=false;$('#play').textContent='Explore history';$('#play').setAttribute('aria-pressed','false')}
function seekLayer(l){overview=false;clearEnding();annualKey='';stop();hover=-1;target=T.MathUtils.clamp(l,0,months.length-1);if(reduced.matches){position=target;setCamera()}interaction=false;selected=-1;$('#detail').replaceChildren();live.hidden=true;paint()}
function selectProject(name){filter=name;$('#project-select').value=name;paint();const id=rows.findLastIndex((r,i)=>project(r)===name&&(!query||authorMatches(i,query)));if(id>=0)seekLayer(layerOf[id])}
const selector=$('#project-select');selector.replaceChildren(new Option('All projects',''));projects.forEach(p=>selector.add(new Option(p,p)));selector.onchange=()=>{filter=selector.value;paint();if(filter)selectProject(filter)};
$('#reset').textContent='Entrance';$('#reset').onclick=()=>{filter='';query='';$('#search').value='';selector.value='';seekLayer(0);overview=true;annualKey=''};
$('#rotate-view').textContent='Orbit';$('#rotate-view').onclick=()=>{interaction=!interaction;$('#rotate-view').setAttribute('aria-pressed',String(interaction));if(!interaction)setCamera()};
const scrubTip=document.createElement('output');scrubTip.className='timeline-tip';scrubTip.hidden=true;range.parentElement.append(scrubTip);
function updateScrubTip(){const value=Number(range.value);scrubTip.textContent=months[Math.round(value)];scrubTip.style.left=(3+value/(months.length-1)*94)+'%'}
range.addEventListener('pointerdown',()=>{scrubTip.hidden=false;updateScrubTip()});
range.addEventListener('focus',()=>{scrubTip.hidden=false;updateScrubTip()});
range.addEventListener('blur',()=>{scrubTip.hidden=true});
document.addEventListener('pointerup',()=>{scrubTip.hidden=true});
range.oninput=()=>{seekLayer(Number(range.value));scrubTip.hidden=false;updateScrubTip()};
$('#play').textContent='Explore history';$('#play').onclick=()=>{if(playing){stop();return}overview=false;clearEnding();if(position>=months.length-1)position=target=0;playing=true;lastLayer=-1;interaction=false;selected=-1;$('#detail').replaceChildren();paint();$('#play').textContent='Pause';$('#play').setAttribute('aria-pressed','true')};
$('#context').textContent='Travel through the years. Meet the contributors and explore key milestones.';
function soundLabel(){ $('#sound').textContent=enabled?'Mute':'Enable audio';$('#sound').setAttribute('aria-pressed',String(enabled)) }
async function unlockAudio(){if(!enabled)return;try{audio??=new AudioContext();await audio.resume();if(audio.state==='running')tone(layers[Math.round(position)][0])}catch{}}
$('#sound').onclick=()=>{enabled=!enabled;localStorage.setItem('history-sound',enabled?'on':'off');soundLabel();updateTravelSound();if(enabled)unlockAudio()};soundLabel();
document.addEventListener('pointerdown',e=>{if(e.target.closest('#sound'))return;if(enabled&&(!audio||audio.state!=='running'))unlockAudio()},{capture:true});
document.addEventListener('keydown',()=>{if(enabled&&(!audio||audio.state!=='running'))unlockAudio()});
function tone(i){if(i===undefined||!enabled||!audio||audio.state!=='running'||performance.now()-lastTone<160)return;lastTone=performance.now();const g=projects.indexOf(project(rows[i])),t=audio.currentTime,frequency=196*Math.pow(2,[0,3,5,7,10,12,15][g%7]/12);
 for(const [ratio,gain,duration] of [[1,.045,.7],[1.5+g%4,.014,.16]]){const osc=audio.createOscillator(),env=audio.createGain();osc.type=['sine','triangle','sine','triangle'][g%4];osc.frequency.value=frequency*ratio;env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(gain,t+.012);env.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(env).connect(audio.destination);osc.start(t);osc.stop(t+duration);osc.onended=()=>{osc.disconnect();env.disconnect()}}
}
function show(i){overview=false;clearEnding();results.hidden=true;stop();target=layerOf[i];interaction=false;if(reduced.matches){position=target;setCamera()}hover=-1;selected=i;paint();tone(i);$('#detail').style.setProperty('--commit-color','#'+baseColors[i].getHexString());const [sha,date,name,title,repo]=rows[i],panel=$('#detail');panel.replaceChildren();const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Close commit details');close.onclick=()=>{panel.replaceChildren();selected=-1;paint()};const h=document.createElement('h2');h.textContent=events[sha]||title;const p=document.createElement('p');p.textContent=repo+' · '+name+' · '+date;const d=document.createElement('p');d.className='contribution-stat';d.textContent='Added +'+Number(rows[i][5]).toLocaleString()+' lines';const a=document.createElement('a');a.textContent='View commit on GitHub';a.href='https://github.com/ModelTC/'+repo+'/commit/'+sha;a.target='_blank';a.rel='noopener';const profile=document.createElement('a');profile.className='developer-profile';profile.textContent='Loading developer profile…';profile.setAttribute('aria-disabled','true');profile.target='_blank';profile.rel='noopener';panel.append(close,h,p,d,profile,a);live.hidden=true;
 const apply=login=>{if(selected!==i||!profile.isConnected)return;if(login){profile.href='https://github.com/'+encodeURIComponent(login);profile.textContent='View '+name+' on GitHub';profile.removeAttribute('aria-disabled')}else{profile.textContent='No linked GitHub account';profile.removeAttribute('href')}};
 if(profiles[sha])apply(profiles[sha]);else fetch('https://api.github.com/repos/ModelTC/'+encodeURIComponent(repo)+'/commits/'+sha,{signal:AbortSignal.timeout(8000)}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{const login=data.author?.login;if(login)profiles[sha]=login;apply(login)}).catch(()=>{if(selected===i&&profile.isConnected){profile.textContent='Profile temporarily unavailable';profile.removeAttribute('href')}});
}
const results=document.createElement('div');results.className='author-results';results.hidden=true;document.querySelector('.search-wrap').append(results);
function searchAuthors(e){$('#detail').replaceChildren();selected=-1;stop();query=e.target.value.trim();filter='';selector.value='';paint();results.replaceChildren();results.hidden=!query;if(!query)return;const found=new Map();rows.forEach((r,i)=>{if(match(i)){if(!found.has(r[2]))found.set(r[2],[]);found.get(r[2]).push(i)}});const msg=document.createElement('p');msg.setAttribute('role','status');msg.textContent=found.size?'Select an author to view commits':'No matching authors. Try part of a name or Git username.';results.append(msg);for(const [name,ids] of [...found].sort((a,b)=>b[1].length-a[1].length).slice(0,20)){const b=document.createElement('button');b.textContent=name+' · '+ids.length+' commits';b.onclick=()=>{query=name;$('#search').value=name;paint();results.replaceChildren();for(const i of ids.slice(-30).reverse()){const item=document.createElement('button');item.textContent=rows[i][1]+' · '+project(rows[i])+' · '+rows[i][3];item.onclick=()=>{seekLayer(layerOf[i]);show(i);results.hidden=true};results.append(item)}seekLayer(layerOf[ids.at(-1)])};results.append(b)}}
$('#search').oninput=searchAuthors;$('#search').onfocus=e=>{if(e.target.value.trim())searchAuthors(e)};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.search-wrap'))results.hidden=true});
const ray=new T.Raycaster(),mouse=new T.Vector2();let lastHoverCheck=0;
function hit(e){mouse.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(mouse,camera);return ray.intersectObject(pillars)[0]?.instanceId??-1}
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{dragStart=[e.clientX,e.clientY];stop()});
canvas.addEventListener('pointermove',e=>{
 if(e.buttons){interaction=true;clearHover();return}
 const now=performance.now();if(now-lastHoverCheck<45)return;lastHoverCheck=now;
 const hitId=hit(e),i=hitId>=0&&match(hitId)?hitId:-1;
 canvas.style.cursor=i>=0?'pointer':'grab';
 if(i!==hover){hover=i;paint();if(i>=0)tone(i)}
});
canvas.addEventListener('pointerleave',clearHover);

canvas.addEventListener('pointerup',e=>{if(dragStart&&Math.hypot(e.clientX-dragStart[0],e.clientY-dragStart[1])<6){const i=hit(e);if(i>=0&&match(i))show(i)}dragStart=null});
canvas.addEventListener('wheel',e=>{e.preventDefault();seekLayer(target+e.deltaY*.003)},{passive:false});
$('#zoom-in').title='Travel forward';$('#zoom-out').title='Travel backward';$('#zoom-in').setAttribute('aria-label','Travel forward');$('#zoom-out').setAttribute('aria-label','Travel backward');$('#zoom-in').onclick=()=>seekLayer(target+1);$('#zoom-out').onclick=()=>seekLayer(target-1);const zoom=$('#zoom-level');zoom.setAttribute('aria-label','Timeline position');zoom.oninput=()=>seekLayer(Number(zoom.value)/1000*(months.length-1));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;$('#detail').replaceChildren();selected=-1;paint()}if(e.target===canvas&&e.key==='ArrowUp')seekLayer(target+1);if(e.target===canvas&&e.key==='ArrowDown')seekLayer(target-1)});canvas.tabIndex=0;canvas.setAttribute('aria-label','Commit timeline. Use the up and down arrow keys to travel.');
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();travelEnergy=0;updateTravelSound()}last=0});reduced.addEventListener('change',()=>{stop();position=target;setCamera()});
let annualKey='';
const years=[...new Set(months.map(m=>m.slice(0,4)))];
const yearRows=new Map(years.map(y=>[y,rows.flatMap((r,i)=>r[1].startsWith(y)?[i]:[])]));
function updateAnnual(year){
 const key=[overview,year,filter,query,playing,selected].join('|');if(key===annualKey)return;annualKey=key;
 const ids=(overview?rows.map((_,i)=>i):yearRows.get(year)).filter(match),people=new Set(ids.map(i=>normal(profiles[rows[i][0]]||rows[i][2])));
 $('#count').textContent=year+' · '+people.size+' contributors · '+ids.length.toLocaleString()+' commits';
 live.replaceChildren();live.hidden=selected>=0;if(selected>=0)return;
 const heading=document.createElement('strong');heading.textContent=overview?'ALL-TIME':year+' OVERVIEW';live.append(heading);
 const metrics=document.createElement('div');metrics.className='annual-metrics';
 for(const [value,label] of [[people.size,'Contributors'],[ids.length,'Commits']]){const item=document.createElement('div'),number=document.createElement('b'),caption=document.createElement('span');number.textContent=value.toLocaleString();caption.textContent=label;item.append(number,caption);metrics.append(item)}live.append(metrics);
 const caption=document.createElement('span');caption.className='annual-caption';caption.textContent='Selected milestones';live.append(caption);
 const highlights=ids.filter(i=>events[rows[i][0]]&&!/版本标签|version tag/i.test(events[rows[i][0]])).sort((a,b)=>rows[b][1].localeCompare(rows[a][1])).filter((id,index,list)=>list.findIndex(other=>events[rows[other][0]]===events[rows[id][0]])===index).slice(0,3);
 if(!highlights.length){const label=document.createElement('span');label.textContent='Contributions across '+new Set(ids.map(i=>project(rows[i]))).size+' projects';live.append(label)}
 highlights.forEach(i=>{const b=document.createElement('button');b.textContent=(overview?rows[i][1]:rows[i][1].slice(5,10))+' · '+project(rows[i])+' · '+events[rows[i][0]];b.onclick=()=>show(i);live.append(b)});
}
const p=new T.Vector3();let intro=reduced.matches?0:1;
if(intro){position=target=months.length-1;roll=-.7;setCamera()}
renderer.setAnimationLoop(now=>{const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(document.hidden)return;
 if(playing){if(reduced.matches){hold-=dt;if(hold<=0){target=Math.min(months.length-1,target+12);hold=3}}else if(hold>0)hold-=dt;else target=Math.min(months.length-1,target+dt*3.5);if(target>=months.length-1){stop();completed=true}}
 if(intro>0){intro=Math.max(0,intro-dt/2.6);const progress=1-intro,eased=1-Math.pow(1-progress,3);position=target=(months.length-1)*(1-eased);roll=-.7*(1-eased);setCamera()}
 else if(!interaction){const before=position;position=reduced.matches?target:T.MathUtils.lerp(position,target,1-Math.exp(-dt*5));if(!reduced.matches)roll+=(position-before)*.035+(playing?dt*.045:0);setCamera()}else controls.update();

 light.position.copy(camera.position);const l=Math.round(position);range.value=playing||intro>0?l:Math.round(target);zoom.value=position/(months.length-1)*1000;$('#date').textContent=overview?'ALL-TIME':months[l].slice(0,4);
 if(completed&&Math.abs(position-(months.length-1))<.15)invitation.hidden=false;
 updateAnnual(months[l].slice(0,4));
 monthLabels.forEach((el,j)=>{const depth=camera.position.z+j*13;el.hidden=depth<16||depth>200||(j>0&&months[j-1].slice(0,4)===months[j].slice(0,4));if(el.hidden)return;p.set(-20,8,-j*13).project(camera);el.style.left=(p.x+1)*innerWidth/2+'px';el.style.top=(1-p.y)*innerHeight/2+'px';el.style.opacity=Math.max(.2,1-depth/240)});
 easeColors(dt);
 updateAtmosphere(dt);
 renderer.render(scene,camera)
});
