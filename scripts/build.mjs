import {mkdir,copyFile,cp,readFile} from 'node:fs/promises';
import path from 'node:path';
await mkdir('dist/vendor',{recursive:true});
for(const f of ['index.html','styles.css','README.md'])await copyFile(f,'dist/'+f);
await cp('src','dist/src',{recursive:true});
await cp('public','dist',{recursive:true});
const copied=new Set();
async function addon(relative){
  relative=path.posix.normalize(relative);
  if(copied.has(relative))return;
  if(relative.startsWith('../'))throw Error('Unexpected dependency path');
  copied.add(relative);
  const source='node_modules/three/examples/jsm/'+relative,dest='dist/vendor/addons/'+relative;
  await mkdir(path.dirname(dest),{recursive:true});await copyFile(source,dest);
  const code=await readFile(source,'utf8');
  for(const match of code.matchAll(/(?:from\s*|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g))await addon(path.posix.join(path.posix.dirname(relative),match[1]));
}
for(const file of ['controls/OrbitControls.js','environments/RoomEnvironment.js','exporters/GLTFExporter.js','exporters/STLExporter.js','geometries/RoundedBoxGeometry.js'])await addon(file);
for(const f of ['three.module.js','three.core.js'])await copyFile('node_modules/three/build/'+f,'dist/vendor/'+f);
await copyFile('node_modules/three/LICENSE','dist/vendor/THREE-LICENSE.txt');
console.log('Built dist with local Three.js assets.');
