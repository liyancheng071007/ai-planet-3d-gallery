import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3} from 'three';
import {STLExporter} from 'three/addons/exporters/STLExporter.js';
import {catalog} from '../src/catalog.js';
import {createModel,disposeModel} from '../src/models.js';
test('13 distinct catalog IDs and complete category counts',()=>{assert.equal(new Set(catalog.map(x=>x.id)).size,13);assert.deepEqual(['coin','chip','data'].map(t=>catalog.filter(x=>x.type===t).length),[1,8,4]);});
test('all models contain finite geometry and export binary STL',()=>{
 for(const item of catalog){
  const model=createModel(item);const bounds=new Box3().setFromObject(model);assert.ok(!bounds.isEmpty());
  model.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v),item.id);});
  const stl=new STLExporter().parse(model,{binary:true});assert.ok(stl.byteLength>84);assert.equal(stl.byteLength,84+stl.getUint32(80,true)*50);disposeModel(model);
 }
});
