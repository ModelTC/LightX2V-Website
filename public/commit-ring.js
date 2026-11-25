import * as T from './three.module.js';
export function createRingField(scene,radius){
 const uniforms={time:{value:0},entry:{value:0},heat:{value:new T.Vector3()}};
 let seed=925;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const points=[],lines=[];
 for(let strand=0;strand<90;strand++){
  const r=radius+(random()-.5)*20,y=(random()-.5)*2,phase=random()*6.28;
  for(let step=0;step<260;step++){
   const a=step/260*Math.PI*2,b=(step+.65)/260*Math.PI*2;
   const ripple=Math.sin(a*7+phase)*.65;
   if(random()>.16)lines.push(Math.cos(a)*(r+ripple),y,Math.sin(a)*(r+ripple),Math.cos(b)*(r+ripple),y,Math.sin(b)*(r+ripple));
   if(random()<.55){const spread=(random()-.5)*20;points.push(Math.cos(a)*(r+spread),y+(random()-.5)*4,Math.sin(a)*(r+spread));}
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(lines,3));
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time,entry;varying vec3 p;void main(){float a=atan(p.z,p.x);float pulse=pow(.5+.5*sin(a*3.-time*.22),12.);gl_FragColor=vec4(.35,.78,.84,.065+pulse*.045+entry*.22);}'});
 scene.add(new T.LineSegments(geometry,material));
 const dots=new T.BufferGeometry();dots.setAttribute('position',new T.Float32BufferAttribute(points,3));
 const dm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(130./max(10.,-p.z),1.,3.);gl_Position=projectionMatrix*p;}',fragmentShader:'void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(.45,.85,.9,exp(-r*r*30.)*.38);}'});
 scene.add(new T.Points(dots,dm));
 return {uniforms,pick(){return null},excite(){}};
}
