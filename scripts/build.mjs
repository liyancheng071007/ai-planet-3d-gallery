import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist/vendor',{recursive:true});
for(const f of ['index.html','styles.css','README.md'])await copyFile(f,'dist/'+f);
await cp('src','dist/src',{recursive:true});
await cp('public','dist',{recursive:true});
await cp('node_modules/three/examples/jsm','dist/vendor/addons',{recursive:true});
for(const f of ['three.module.js','three.core.js'])await copyFile('node_modules/three/build/'+f,'dist/vendor/'+f);
await copyFile('node_modules/three/LICENSE','dist/vendor/THREE-LICENSE.txt');
console.log('Built dist with local Three.js assets.');
