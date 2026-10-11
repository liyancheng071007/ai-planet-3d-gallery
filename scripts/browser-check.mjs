import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.GALLERY_URL||'http://127.0.0.1:4174');
 await page.locator('#viewport canvas').waitFor();
 await page.waitForTimeout(600);
 assert.equal(await page.locator('.card').count(),13);
 await page.locator('[data-filter="chip"]').click();
 assert.equal(await page.locator('.card').count(),8);
 await page.locator('[data-model="chip-future"]').click();
 await page.waitForFunction(()=>document.querySelector('#object-name').textContent==='未来芯片');
 await page.locator('#wireframe').click();assert.equal(await page.locator('#wireframe').getAttribute('aria-pressed'),'true');
 await page.locator('#wireframe').click();
 await page.locator('#reset').click();
 await page.locator('[data-view="front"]').click();
 await page.waitForTimeout(150);
 const front=await page.locator('#viewport').screenshot();
 await page.locator('[data-view="back"]').click();await page.waitForTimeout(150);
 assert.notDeepEqual(await page.locator('#viewport').screenshot(),front);
 await page.locator('#zoom-in').click();await page.locator('#zoom-out').click();
 await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Home');
 await page.locator('#previous').click();await page.waitForFunction(()=>document.querySelector('#object-name').textContent==='伦理芯片');
 await page.locator('#next').click();await page.waitForFunction(()=>document.querySelector('#object-name').textContent==='未来芯片');
 for(const format of ['glb','stl']){
  const wait=page.waitForEvent('download');await page.locator('#download-'+format).click();
  const download=await wait;assert.ok(download.suggestedFilename().endsWith('.'+format));assert.equal(await download.failure(),null);
 }
 await page.locator('[data-filter="all"]').click();
 await page.goto((process.env.GALLERY_URL||'http://127.0.0.1:4174')+'/#compute-coin');
 await page.waitForTimeout(500);
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 for(const width of [360,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width));
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Browser check passed: real WebGL, filters, model selection, wireframe, GLB/STL downloads and five viewport widths.');
}finally{await browser.close();}
