import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {catalog,categories} from './catalog.js';
import {createModel,disposeModel,explodeModel,inspectModel} from './models.js';
import {exportModel} from './export.js';

const $=s=>document.querySelector(s),viewport=$('#viewport');
let renderer,scene,camera,controls,model,selected=catalog[0],filter='all',wireframe=false,auto=false,exploded=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let dirty=true,visible=true,contextLost=false;
function invalidate(){dirty=true;}
function fallback(message){
  contextLost=true;
  if(renderer)renderer.domElement.hidden=true;
  $('#static-preview').hidden=false;$('#fallback').hidden=false;$('#fallback').textContent=message;$('#retry3d').hidden=false;
  for(const selector of ['#reset','#rotate','#wireframe','#explode','#zoom-in','#zoom-out','[data-view]','#fullscreen'])document.querySelectorAll(selector).forEach(button=>button.disabled=true);
}
function cards(){
  const list=catalog.filter(x=>filter==='all'||x.type===filter);
  $('#count').textContent=list.length+' 件藏品';
  $('#cards').innerHTML=list.map(x=>'<button class="card" data-model="'+x.id+'" aria-pressed="'+(x.id===selected.id)+'" style="--accent:'+x.color+'"><div class="card-art" aria-hidden="true"><img src="previews/'+x.id+'.png" loading="lazy" width="600" height="600" alt=""></div><div class="card-info"><div class="card-top"><span>'+categories[x.type]+'</span><span>↗</span></div><h3>'+x.name+'</h3><p>'+x.form+'</p></div></button>').join('');
}
function select(id){
  selected=catalog.find(x=>x.id===id)||catalog[0];
  if(model){if(scene)scene.remove(model);disposeModel(model);}
  model=createModel(selected);
  const info=inspectModel(model);
  if(scene)scene.add(model);
  model.rotation.set(-.18,-.32,.06);
  model.traverse(o=>{if(o.isMesh)o.material.wireframe=wireframe;});
  explodeModel(model,exploded?.35:0);
  $('#object-name').textContent=selected.name;$('#object-code').textContent=selected.en;
  $('#object-category').textContent=categories[selected.type]+' / OBJECT '+String(catalog.indexOf(selected)+1).padStart(3,'0');
  $('#object-form').textContent=selected.concept||selected.form;
  $('#object-meaning').textContent=selected.meaning;
  $('#spec-form').textContent=selected.form;$('#spec-size').textContent=info.sizeMM.join(' × ')+' mm';
  $('#spec-meshes').textContent=info.meshes+' 个组件 / '+Math.round(info.triangles/1000)+'k 三角面';
  $('#object-detail').textContent=selected.detail;$('#status').textContent='';
  $('#position').textContent=String(catalog.indexOf(selected)+1).padStart(2,'0')+' / 13';
  $('#share-link').hidden=true;
  $('#static-preview').src='previews/'+selected.id+'.png';$('#static-preview').alt=selected.name+'模型预览';
  document.title=selected.name+' · AI星球三维藏品馆';
  reset();cards();invalidate();
}
function reset(){if(camera){camera.position.set(2,1.5,5.2);controls.target.set(0,0,0);if(model)model.rotation.set(-.18,-.32,.06);controls.update();}}
function zoom(factor){if(!camera)return;const offset=camera.position.clone().sub(controls.target);offset.setLength(T.MathUtils.clamp(offset.length()*factor,3,9));camera.position.copy(controls.target).add(offset);controls.update();}
function orbit(horizontal,vertical){if(!camera)return;const sphere=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));sphere.theta+=horizontal;sphere.phi=T.MathUtils.clamp(sphere.phi+vertical,.15,Math.PI-.15);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(sphere));controls.update();}
function navigate(direction){const list=catalog.filter(x=>filter==='all'||x.type===filter),index=list.findIndex(x=>x.id===selected.id);location.hash=list[(index+direction+list.length)%list.length].id;}
function init(){
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:2));renderer.outputColorSpace=T.SRGBColorSpace;
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
    controls.addEventListener('change',invalidate);
    new ResizeObserver(()=>{const {width,height}=viewport.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();}).observe(viewport);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate();}).observe(viewport);
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('3D连接已中断，已切换为模型预览；下载仍可使用。');});
    renderer.setAnimationLoop(()=>{
      if(document.hidden||!visible||contextLost)return;
      controls.autoRotate=auto&&!reduced;
      const changed=controls.update();
      if(dirty||changed||controls.autoRotate){renderer.render(scene,camera);dirty=false;}
    });
    if(reduced){$('#rotate').disabled=true;$('#rotate').textContent='已减少动画';}
  }catch(e){fallback('此设备无法显示实时3D，现为模型预览；仍可下载模型。');}
}
function save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function download(format){
  $('#status').textContent='正在准备 '+format.toUpperCase()+' 文件…';
  const item=selected;
  $('#download-glb').disabled=true;$('#download-stl').disabled=true;
  try{
    const result=await exportModel(item,format);
    save(new Blob([result],{type:format==='glb'?'model/gltf-binary':'application/octet-stream'}),item.id+'.'+format);
    $('#status').textContent='文件已准备好，请在浏览器下载中查看。';
  }catch(e){$('#status').textContent='导出失败，请重试或查看项目源码。';}
  finally{$('#download-glb').disabled=false;$('#download-stl').disabled=false;}
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
$('#wireframe').onclick=()=>{wireframe=!wireframe;model.traverse(o=>{if(o.isMesh)o.material.wireframe=wireframe;});$('#wireframe').setAttribute('aria-pressed',wireframe);invalidate();};
$('#download-glb').onclick=()=>download('glb');$('#download-stl').onclick=()=>download('stl');
$('#previous').onclick=()=>navigate(-1);$('#next').onclick=()=>navigate(1);
$('#zoom-in').onclick=()=>zoom(.85);$('#zoom-out').onclick=()=>zoom(1.15);
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
  if(!camera)return;model.rotation.set(0,0,0);
  const poses={front:[0,0,5.5],back:[0,0,-5.5],side:[5.5,0,0]};camera.position.set(...poses[button.dataset.view]);controls.update();
});
viewport.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))e.preventDefault();
  if(e.key==='ArrowLeft')orbit(-.15,0);if(e.key==='ArrowRight')orbit(.15,0);
  if(e.key==='ArrowUp')orbit(0,-.15);if(e.key==='ArrowDown')orbit(0,.15);
  if(e.key==='+'||e.key==='=')zoom(.85);if(e.key==='-')zoom(1.15);if(e.key==='Home')reset();
});
$('#share').onclick=async()=>{
  const url=new URL(location.href);url.hash=selected.id;
  try{await navigator.clipboard.writeText(url.href);$('#status').textContent='藏品链接已复制，可直接分享。';}
  catch{const input=$('#share-link');input.hidden=false;input.value=url.href;input.focus();input.select();$('#status').textContent='请复制下方链接分享。';}
};
$('#fullscreen').onclick=async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.viewport-wrap').requestFullscreen();}
  catch{$('#status').textContent='此浏览器不支持全屏，可使用缩放和旋转查看。';}
};
$('#explode').onclick=()=>{
  exploded=!exploded;explodeModel(model,exploded?.35:0);$('#explode').setAttribute('aria-pressed',exploded);
  invalidate();
  $('#status').textContent=exploded?'展示层已展开，下载仍为正常装配状态。':'已恢复正常装配状态。';
};
$('#retry3d').onclick=()=>location.reload();
