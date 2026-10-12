import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {STLExporter} from 'three/addons/exporters/STLExporter.js';
import {createModel,disposeModel} from './models.js';
export async function exportModel(item,format){
  const asset=createModel(item);
  try{
    // glTF defines metres. STL has no unit metadata; coordinates are millimetres.
    asset.scale.setScalar(format==='glb'?.02:20);
    asset.userData={design:item.id,description:'AI Planet original display model. Multiple components; inspect before fabrication.'};
    asset.updateMatrixWorld(true);
    if(format==='glb')return await new GLTFExporter().parseAsync(asset,{binary:true});
    if(format==='stl')return new STLExporter().parse(asset,{binary:true});
    throw Error('Unsupported export format');
  }finally{disposeModel(asset);}
}
