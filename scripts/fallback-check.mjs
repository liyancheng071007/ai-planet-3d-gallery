import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-webgl']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GALLERY_URL||'http://127.0.0.1:4174');
 await page.locator('#static-preview').waitFor({state:'visible'});
 assert.equal(await page.locator('#rotate').isDisabled(),true);
 await page.locator('[data-model="chip-ethics"]').click();
 await page.waitForFunction(()=>document.querySelector('#object-name').textContent==='伦理芯片');
 assert.ok((await page.locator('#static-preview').getAttribute('src')).includes('chip-ethics'));
 const download=page.waitForEvent('download');await page.locator('#download-glb').click();
 assert.equal((await download).suggestedFilename(),'chip-ethics.glb');
 assert.deepEqual(errors,[]);
 console.log('No-WebGL fallback, model switching and GLB export passed.');
}finally{await browser.close();}
const motionBrowser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await motionBrowser.newPage({reducedMotion:'reduce'});
 await page.goto(process.env.GALLERY_URL||'http://127.0.0.1:4174');
 await page.locator('#viewport canvas').waitFor();
 assert.equal(await page.locator('#rotate').isDisabled(),true);
 console.log('Reduced-motion preference verified.');
}finally{await motionBrowser.close();}
