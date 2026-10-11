import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {catalog} from '../src/catalog.js';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1000,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
try{
 await mkdir('public/previews',{recursive:true});
 await page.goto('http://127.0.0.1:4174');
 await page.addStyleTag({content:'.viewport-top,.viewport-bottom{visibility:hidden}.viewport-wrap{width:600px!important;height:600px!important;min-height:600px!important}.studio{display:block!important;width:600px!important}.inspector{display:none!important}#viewport{background:radial-gradient(ellipse at center,#fdfcf5,#efeee6)}'});
 for(const item of catalog){
  await page.evaluate(id=>location.hash=id,item.id);
  await page.waitForFunction(name=>document.querySelector('#object-name').textContent===name,item.name);
  await page.waitForTimeout(200);
  await page.locator('#viewport').screenshot({path:'public/previews/'+item.id+'.png'});
 }
 console.log('13 real-model previews saved.');
}finally{await browser.close();}
