import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {catalog} from '../src/catalog.js';
import {createModel,disposeModel,inspectModel} from '../src/models.js';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const manifest=[];
try{
 await mkdir('public/models',{recursive:true});
 await page.goto(process.env.GALLERY_URL||'http://127.0.0.1:4174');
 await page.locator('#viewport canvas').waitFor();
 for(const item of catalog){
  await page.evaluate(id=>location.hash=id,item.id);
  await page.waitForFunction(name=>document.querySelector('#object-name').textContent===name,item.name);
  const model=createModel(item),info=inspectModel(model);disposeModel(model);
  const record={id:item.id,name:item.name,...info,files:{}};
  for(const format of ['glb','stl']){
   const waiting=page.waitForEvent('download');await page.locator('#download-'+format).click();
   const download=await waiting,file='public/models/'+download.suggestedFilename();await download.saveAs(file);
   const data=await readFile(file);record.files[format]={path:'models/'+download.suggestedFilename(),bytes:data.length};
   if(format==='glb'){
    assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(8),data.length);
    const buffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
    const gltf=await new GLTFLoader().parseAsync(buffer,'');
    const size=new Box3().setFromObject(gltf.scene).getSize(new Vector3()).multiplyScalar(1000).toArray();
    size.forEach((value,i)=>assert.ok(Math.abs(value-info.sizeMM[i])<.15,item.id+' GLB units'));
   }else{
    const count=data.readUInt32LE(80);assert.equal(data.length,84+count*50);
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<count;i++)for(let v=0;v<3;v++)for(let axis=0;axis<3;axis++){
      const value=data.readFloatLE(84+i*50+12+v*12+axis*4);assert.ok(Number.isFinite(value));
      min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);
    }
    max.forEach((value,i)=>assert.ok(Math.abs(value-min[i]-info.sizeMM[i])<.15,item.id+' STL units'));
   }
  }
  manifest.push(record);
 }
 assert.deepEqual(errors,[]);
 await writeFile('public/models/manifest.json',JSON.stringify({units:{glb:'metres',stl:'millimetres'},models:manifest},null,2)+'\n');
 console.log('All 26 files exported, parsed, checked for finite geometry and matched dimensions.');
}finally{await browser.close();}
