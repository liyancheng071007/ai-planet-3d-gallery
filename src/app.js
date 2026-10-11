import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import {catalog,categories} from './catalog.js';
import {createModel,disposeModel} from './models.js';

const $=s=>document.querySelector(s),viewport=$('#viewport');
let renderer,scene,camera,controls,model,selected=catalog[0],filter='all',wireframe=false,auto=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function cards(){
  const list=catalog.filter(x=>filter==='all'||x.type===filter);
  $('#count').textContent=list.length+' 件藏品';
  $('#cards').innerHTML=list.map(x=>'<button class="card" data-model="'+x.id+'" aria-pressed="'+(x.id===selected.id)+'" style="--accent:'+x.color+'"><div class="card-art" aria-hidden="true"><img src="previews/'+x.id+'.png" loading="lazy" width="600" height="600" alt=""></div><div class="card-info"><div class="card-top"><span>'+categories[x.type]+'</span><span>↗</span></div><h3>'+x.name+'</h3><p>'+x.form+'</p></div></button>').join('');
}
function select(id){
  selected=catalog.find(x=>x.id===id)||catalog[0];
  if(model){scene.remove(model);disposeModel(model);}
  model=createModel(selected);
  if(scene)scene.add(model);
  model.rotation.set(-.18,-.32,.06);
  model.traverse(o=>{if(o.isMesh)o.material.wireframe=wireframe;});
  $('#object-name').textContent=selected.name;$('#object-code').textContent=selected.en;
  $('#object-category').textContent=categories[selected.type]+' / OBJECT '+String(catalog.indexOf(selected)+1).padStart(3,'0');
  $('#object-form').textContent=selected.concept||selected.form;
  $('#object-meaning').textContent=selected.meaning;
  $('#spec-form').textContent=selected.form;$('#spec-size').textContent=selected.size;
  $('#spec-meshes').textContent=model.children.length+' 个立体组件';
  $('#object-detail').textContent=selected.detail;$('#status').textContent='';
  document.title=selected.name+' · AI星球三维藏品馆';
  reset();cards();
}
function reset(){if(camera){camera.position.set(2,1.5,5.2);controls.target.set(0,0,0);controls.update();}}
function init(){
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
    viewport.appendChild(renderer.domElement);$('#fallback').hidden=true;
    scene=new T.Scene();camera=new T.PerspectiveCamera(35,1,.1,100);
    const environment=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);
    const env=pmrem.fromScene(environment,.04);scene.environment=env.texture;environment.dispose();pmrem.dispose();
    scene.environmentIntensity=.7;
    scene.add(new T.HemisphereLight('#ffffff','#929387',.8));
    const key=new T.DirectionalLight('#fff6e3',2);key.position.set(3,4,5);scene.add(key);
    const fill=new T.DirectionalLight('#dcd9ff',1);fill.position.set(-3,1,2);scene.add(fill);
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=9;controls.autoRotateSpeed=.7;
    new ResizeObserver(()=>{const {width,height}=viewport.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(viewport);
    renderer.setAnimationLoop(()=>{controls.autoRotate=auto&&!reduced;controls.update();renderer.render(scene,camera);});
  }catch(e){$('#fallback').textContent='此设备无法显示实时3D。你仍可浏览说明和下载模型，在建模软件中打开。';}
}
function save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function download(format){
  $('#status').textContent='正在准备 '+format.toUpperCase()+' 文件…';
  const asset=createModel(selected);
  try{
    if(format==='glb'){
      const result=await new GLTFExporter().parseAsync(asset,{binary:true});
      save(new Blob([result],{type:'model/gltf-binary'}),selected.id+'.glb');
    }else{
      // Physical reference: 1 model unit = 20 mm. STL itself has no unit metadata.
      asset.scale.setScalar(20);asset.updateMatrixWorld(true);
      save(new Blob([new STLExporter().parse(asset,{binary:true})],{type:'application/octet-stream'}),selected.id+'.stl');
    }
    $('#status').textContent='文件已准备好，请在浏览器下载中查看。';
  }catch(e){$('#status').textContent='导出失败，请重试或查看项目源码。';}
  finally{disposeModel(asset);}
}
init();select(location.hash.slice(1));
window.addEventListener('hashchange',()=>{if(catalog.some(x=>x.id===location.hash.slice(1)))select(location.hash.slice(1));});
document.addEventListener('click',e=>{
  const card=e.target.closest('[data-model]');
  if(card){const id=card.dataset.model;if(location.hash.slice(1)===id)select(id);else location.hash=id;$('.studio').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}
  const f=e.target.closest('[data-filter]');
  if(f){filter=f.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b===f));cards();}
});
$('#reset').onclick=reset;
$('#rotate').onclick=()=>{auto=!auto;$('#rotate').setAttribute('aria-pressed',auto);$('#rotate').textContent=auto?'暂停旋转':'自动旋转';};
$('#wireframe').onclick=()=>{wireframe=!wireframe;model.traverse(o=>{if(o.isMesh)o.material.wireframe=wireframe;});$('#wireframe').setAttribute('aria-pressed',wireframe);};
$('#download-glb').onclick=()=>download('glb');$('#download-stl').onclick=()=>download('stl');
