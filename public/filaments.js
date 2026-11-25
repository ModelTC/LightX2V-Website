import * as T from './three.module.js';

// Braided lanes share a waist at each project, then separate into individual fibres.
const knots=[[-190,-115],[-79,-11],[-5,31],[70,-23],[190,101]];
export function lane(x,branch){
 if(Math.abs(x)>190){
   const side=Math.sign(x),d=Math.abs(x)-190;
   return (side>0?101:-115)+side*(1-Math.exp(-d/65))*(.32*d+65*Math.sin(d*.009)+branch*21*Math.sin(d*.016));
 }
 let k=0;
 while(k<knots.length-2 && x>knots[k+1][0])k++;
 const [a,z]=knots[k],[b,end]=knots[k+1];
 const u=T.MathUtils.clamp((x-a)/(b-a),0,1);
 const arch=Math.sin(Math.PI*u)**2;
 return z+(end-z)*u*u*(3-2*u)+arch*(branch*31+9*Math.sin(k*2+branch));
}
export function createFilaments(scene){
 const pos=[],attrs=[],dots=[],dustAttrs=[],pickPoints=[];
 let seed=413;
 const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let strand=0;strand<680;strand++){
   const branch=Math.floor(rand()*5)/2-1;
   const q=(rand()-.5)*2, phase=rand()*6.28, strength=.2+rand()*.8;
   const extent=910+rand()*220;
   const steps=209;
   // Keep tight sampling around commits and gradually widen it in the distant reaches.
   function along(t){
     const outer=Math.max(0,Math.abs(t)-.60)/.40;
     return Math.sign(t)*(Math.min(Math.abs(t)/.60,1)*190+outer*42+outer*outer*(extent-232));
   }
   function sample(x){
     const spread=6+6*Math.sin(x*.037+branch)**2;
     const free=1-Math.exp(-Math.min(Math.abs(x+79),Math.abs(x+5),Math.abs(x-70))*.055);
     const twist=x*.028+branch*1.8;
     const depth=free*(branch*14*Math.cos(twist)+q*8*Math.sin(twist)+4*Math.sin(phase));
     return [x,-2.8+depth+q*1.8,lane(x,branch)+q*spread+Math.sin(x*.065+phase)*1.9];
   }
   let prev=sample(-extent);
   for(let i=1;i<=steps;i++){
     const x=along(2*i/steps-1), next=sample(x);
     if(strand%13===0 && i%2===0)pickPoints.push(new T.Vector3(...next));
     pos.push(...prev,...next);attrs.push(strength,phase,branch,strength,phase,branch);
     if(rand()<.24){dots.push(...sample(x-rand()*2));dustAttrs.push(rand(),phase,branch)}
     prev=next;
   }
 }
 const uniforms={time:{value:0},hits:{value:Array.from({length:5},()=>new T.Vector3(0,0,-100))},heat:{value:new T.Vector3()}};
 for(const [particles,vertices,data] of [[false,pos,attrs],[true,dots,dustAttrs]]){
   const geometry=new T.BufferGeometry();
   geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
   geometry.setAttribute('grain',new T.Float32BufferAttribute(data,3));
   const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
   vertexShader:`attribute vec3 grain; uniform float time; uniform vec3 hits[5],heat; varying float brightness,wave,tint;
   float pathZ(float x){
     if(abs(x)>190.){
       float side=sign(x),d=abs(x)-190.;
       return (side>0.?101.:-115.)+side*(1.-exp(-d/65.))*(.32*d+65.*sin(d*.009)+grain.z*21.*sin(d*.016));
     }
     vec2 a,b;float k;
     if(x< -79.){a=vec2(-190.,-115.);b=vec2(-79.,-11.);k=0.;}
     else if(x< -5.){a=vec2(-79.,-11.);b=vec2(-5.,31.);k=1.;}
     else if(x<70.){a=vec2(-5.,31.);b=vec2(70.,-23.);k=2.;}
     else{a=vec2(70.,-23.);b=vec2(190.,101.);k=3.;}
     float u=clamp((x-a.x)/(b.x-a.x),0.,1.);
     return mix(a.y,b.y,smoothstep(0.,1.,u))+pow(sin(3.141592*u),2.)*(grain.z*31.+9.*sin(k*2.+grain.z));
   }
   void main(){
    vec3 p=position;
    float breath=sin(time*.53+p.x*.022+grain.y*.19);
    p.z+=breath*1.25; p.y+=breath*.65;
    float activity=dot(heat,exp(-abs(vec3(p.x)-vec3(-79.,-5.,70.))*.05));
    wave=0.;
    for(int i=0;i<5;i++){
      float age=time-hits[i].z;
      float offset=position.z-pathZ(p.x);
      float crossDist=abs(pathZ(hits[i].x)+offset-hits[i].y);
      float travel=abs(p.x-hits[i].x)+crossDist*.85;
      float delta=travel-age*28.;
      wave=max(wave,exp(-crossDist*.13)*(exp(-delta*delta*.14)+.48*exp(-pow(abs(delta+5.),2.)*.2))*exp(-max(age,0.)*.75)*step(0.,age));
    }
    tint=grain.y/6.28;
    brightness=(.75+breath*.16+activity*.6)*grain.x*(1.-smoothstep(510.,910.,abs(p.x)));
    vec4 mv=modelViewMatrix*vec4(p,1.);
    brightness*=1.-.78*smoothstep(280.,1050.,length(mv.xyz));
    gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp((1.4+3.2*grain.x+wave*3.)*210./max(110.,-mv.z),1.,8.);
   }`,
   fragmentShader:`varying float brightness,wave,tint;void main(){
    vec3 ink=mix(vec3(.47,.66,.83),vec3(.92,.92,.90),tint);
    if(tint>.92)ink=vec3(1.,.74,.49);
    float light=${particles?'exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*18.)*(brightness*.95+wave*1.8)':'brightness*.088+wave*.28'};
    gl_FragColor=vec4(mix(ink,vec3(.98,.91,.76),wave*.65),light);
   }`});
   scene.add(particles?new T.Points(geometry,material):new T.LineSegments(geometry,material));
 }
 let index=0,last=-100;
 return {uniforms, pick(ray,radius){
   let best=null,score=radius*radius;
   for(const point of pickPoints){
     const distance=ray.distanceSqToPoint(point);
     if(distance<score){score=distance;best=point}
   }
   return best;
 }, excite(x,z,time){if(time-last<.085)return;last=time;uniforms.hits.value[index++%5].set(x,z,time)}};
}
