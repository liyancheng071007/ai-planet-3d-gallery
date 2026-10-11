import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const material=(color,metalness=.45,roughness=.3)=>new T.MeshStandardMaterial({color,metalness,roughness});
function mesh(group,geometry,mat,x=0,y=0,z=0,name='component'){
  const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.name=name;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
}
const box=(g,w,h,d,m,x=0,y=0,z=0)=>mesh(g,new RoundedBoxGeometry(w,h,d,3,Math.min(.06,d/3)),m,x,y,z);
const disk=(g,r,d,m,x=0,y=0,z=0,n=64)=>{const o=mesh(g,new T.CylinderGeometry(r,r,d,n),m,x,y,z);o.rotation.x=Math.PI/2;return o;};
const ring=(g,r,t,m,x=0,y=0,z=0)=>mesh(g,new T.TorusGeometry(r,t,12,64),m,x,y,z);
function shape(g,points,depth,mat,z=0){
  const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
  return mesh(g,new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.04,bevelThickness:.03,bevelSegments:3,steps:1}),mat,0,0,z-depth/2);
}
function regular(n,r,angle=Math.PI/2){return Array.from({length:n},(_,i)=>[Math.cos(angle+i*2*Math.PI/n)*r,Math.sin(angle+i*2*Math.PI/n)*r]);}
function star(g,mat,z,r=.45,inner=.2,points=4){return shape(g,Array.from({length:points*2},(_,i)=>{const a=Math.PI/2+i*Math.PI/points,rad=i%2?inner:r;return [Math.cos(a)*rad,Math.sin(a)*rad];}),.07,mat,z);}
function bar(g,x1,y1,x2,y2,z,mat,width=.055){
  const length=Math.hypot(x2-x1,y2-y1),o=box(g,length,width,.055,mat,(x1+x2)/2,(y1+y2)/2,z);o.rotation.z=Math.atan2(y2-y1,x2-x1);return o;
}
function symbol(g,i,ink,z){
  if(i===0){for(let k=0;k<3;k++)box(g,.52,.08,.06,ink,0,.2-k*.2,z);bar(g,-.3,-.28,-.16,-.4,z,ink);bar(g,-.16,-.4,.34,.22,z,ink);}
  if(i===1){ring(g,.31,.07,ink,0,0,z);for(let k=0;k<8;k++){const a=k*Math.PI/4,o=box(g,.15,.12,.07,ink,Math.cos(a)*.39,Math.sin(a)*.39,z);o.rotation.z=a;}}
  if(i===2){ring(g,.38,.035,ink,0,0,z);ring(g,.19,.025,ink,0,0,z);disk(g,.065,.06,ink,0,0,z);bar(g,0,0,.28,.28,z,ink);}
  if(i===3){bar(g,0,-.35,0,.35,z,ink);bar(g,-.4,.17,.4,.17,z,ink);bar(g,-.28,-.35,.28,-.35,z,ink);for(const x of [-.32,.32]){bar(g,x,.17,x,-.08,z,ink);shape(g,[[x-.17,-.08],[x+.17,-.08],[x,-.24]],.055,ink,z);}}
  if(i===4){star(g,ink,z,.43,.14,4);disk(g,.07,.05,ink,.35,.32,z);}
  if(i===5){ring(g,.26,.065,ink,-.05,.08,z);bar(g,.14,-.12,.38,-.38,z,ink,.1);}
  if(i===6){shape(g,[[-.3,.29],[.3,.29],[.27,-.1],[0,-.38],[-.27,-.1]],.05,ink,z);bar(g,-.14,0,-.02,-.12,z+.04,material('#735f98'));bar(g,-.02,-.12,.17,.13,z+.04,material('#735f98'));}
  if(i===7){shape(g,[[0,.47],[.22,.12],[.16,-.25],[-.16,-.25],[-.22,.12]],.08,ink,z);disk(g,.085,.025,material('#6475a8'),0,.11,z+.07);shape(g,[[-.14,-.2],[.14,-.2],[0,-.46]],.045,material('#e3ab63'),z);}
}
export function createModel(item){
  const g=new T.Group();g.name=item.id;
  const gold=material('#e5b85f',.78,.24),rim=material('#f5de9f',.65,.2),dark=material('#333b56',.55,.28),color=material(item.color,.4,.29),white=material('#ecede9',.18,.32);
  if(item.type==='coin'){
    disk(g,1,.24,gold);
    for(const z of [-.135,.135]){ring(g,.86,.045,rim,0,0,z);disk(g,.76,.035,gold,0,0,z);star(g,rim,z*1.3,.5,.2,4);}
    for(let k=0;k<48;k++){const a=k*Math.PI/24,o=box(g,.045,.1,.19,rim,Math.cos(a)*.985,Math.sin(a)*.985,0);o.rotation.z=a-Math.PI/2;}
    for(let k=0;k<8;k++){const a=k*Math.PI/4;disk(g,.027,.025,rim,Math.cos(a)*.67,Math.sin(a)*.67,.17,12);}
  }else if(item.type==='chip'){
    const i=item.variant;
    if(i===1)box(g,1.7,1.7,.22,dark);
    else if(i===7)box(g,1.45,1.95,.24,dark);
    else if(i===6)shape(g,[[-.82,.83],[.82,.83],[.75,-.35],[0,-1],[-.75,-.35]],.23,dark);
    else shape(g,regular([6,4,64,4,8,3,5,8][i],i===5?1.13:1.05,i===3?0:Math.PI/2),.24,dark);
    const panel=new T.Group();g.add(panel);panel.scale.setScalar(.79);
    if(i===1||i===7)box(panel,i===7?1.45:1.7,i===7?1.95:1.7,.16,color,0,0,.2);
    else if(i===6)shape(panel,[[-.82,.83],[.82,.83],[.75,-.35],[0,-1],[-.75,-.35]],.16,color,.2);
    else shape(panel,regular([6,4,64,4,8,3,5,8][i],i===5?1.13:1.05,i===3?0:Math.PI/2),.16,color,.2);
    for(let k=0;k<4;k++)for(const sign of [-1,1])box(g,.09,.26,.07,gold,(k-1.5)*.24,sign*.85,-.02);
    symbol(g,i,white,.36);
    for(const x of [-.48,.48]){disk(g,.035,.04,rim,x,-.5,.26,16);bar(g,x,-.49,x,-.28,.25,rim,.022);}
    for(let k=0;k<=i;k++)box(g,.045,.045,.045,rim,(k-i/2)*.085,-.65,.25);
  }else{
    const i=item.variant;
    if(i===0){
      for(let k=0;k<3;k++){const layer=box(g,1.55,1.15,.14,k===2?color:white,(k-1)*.12,(k-1)*.12,(k-1)*.18);layer.rotation.z=(k-1)*-.07;}
      shape(g,[[-.55,-.2],[-.16,.3],[.2,-.06],[.43,.12],[.72,-.23]],.06,white,.35);disk(g,.12,.06,rim,.48,.48,.35);
    }else if(i===1){
      box(g,1.55,1.8,.4,color);box(g,1.3,1.58,.42,white,.04,0,.03);box(g,.16,1.82,.47,color,-.72,0,.04);
      for(let k=0;k<5;k++)box(g,k===4?.55:.92,.045,.05,dark,.09-k%2*.08,.48-k*.21,.28);
    }else if(i===2){
      disk(g,.9,.4,dark);ring(g,.78,.07,color,0,0,.23);
      for(let k=0;k<9;k++)box(g,.09,.18+Math.sin(k*.8)**2*.65,.09,k%2?white:color,(k-4)*.14,0,.3);
    }else{
      box(g,1.65,1.65,.35,dark,0,0,-.18);
      for(let x=0;x<3;x++)for(let y=0;y<3;y++){const h=.16+(x+y)%3*.16;box(g,.43,.43,h,(x+y)%2?color:white,(x-1)*.5,(y-1)*.5,h/2);}
    }
    for(let k=0;k<3;k++)disk(g,.035,.04,rim,(k-1)*.12,-.65,.3,16);
  }
  g.updateMatrixWorld(true);
  return g;
}
export function disposeModel(g){const geometries=new Set(),materials=new Set();g.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());}
