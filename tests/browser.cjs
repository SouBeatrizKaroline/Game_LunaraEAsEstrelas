const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
let checks=0;function check(v,msg){assert.ok(v,msg);checks++;}
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
 const errors=[];const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);check(await page.getByRole('button',{name:'Começar jornada',exact:true}).isVisible(),'menu loads');
 await page.getByRole('button',{name:'Capítulos',exact:true}).click();check(await page.locator('[data-stage]:disabled').count()===5,'only first chapter unlocked');
 await page.getByRole('button',{name:'Menu principal'}).click();await page.getByRole('button',{name:'Começar jornada',exact:true}).click();
 check(await page.locator('#dialog-title').textContent()==='O último brilho','story before action');
 await page.getByRole('button',{name:'Entrar no capítulo'}).click();
 await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');check(await page.evaluate(()=>gameInstance.player.x)>110,'keyboard movement');
 await page.keyboard.press('Escape');const x=await page.evaluate(()=>gameInstance.player.x);await page.waitForTimeout(100);check(await page.evaluate(()=>gameInstance.player.x)===x,'pause freezes world');
 await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.locator('#slider-music').fill('25');await page.locator('#toggle-reduce-motion').check();await page.locator('#toggle-touch').check();
 await page.getByRole('button',{name:'Salvar e voltar'}).click();check(await page.evaluate(()=>gameSettings.musicVolume)===.25,'settings apply');
 await page.getByRole('button',{name:'Retomar'}).click();
 const box=await page.locator('#btn-touch-right').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();check(await page.evaluate(()=>gameInstance.player.keys.right),'pointer starts movement');
 await page.mouse.move(700,300);await page.mouse.up();check(!await page.evaluate(()=>gameInstance.player.keys.right),'captured pointer releases outside button');
 await page.keyboard.down('a');await page.keyboard.down('ArrowLeft');await page.keyboard.up('a');check(await page.evaluate(()=>gameInstance.player.keys.left),'simultaneous aliases remain held');await page.keyboard.up('ArrowLeft');
 await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));});check(await page.evaluate(()=>gameInstance.state)==='paused','blur pauses and releases input');await page.getByRole('button',{name:'Retomar'}).click();
 for(let stage=0;stage<6;stage++){
  check(await page.evaluate(()=>gameInstance.activeStage)===stage,'correct chapter '+stage);
  await page.evaluate(()=>{const g=gameInstance;g.player.x=2291;g.player.y=772;g.player.vx=g.player.vy=0;g.step(1/120);});
  check(await page.evaluate(()=>gameInstance.state)==='playing','portal stays locked without fragments');
  // Collection lifecycle uses actual game updates. Geometry is separately verified by physics.cjs.
  await page.evaluate(()=>{
   const g=gameInstance;
   for(const star of g.collectibles.stars){g.clearInput();g.player.isRespawning=false;g.player.x=star.x-19;g.player.y=star.y-24;g.player.vx=g.player.vy=0;g.player.support=null;
    for(let i=0;i<70;i++)g.step(1/120);
   }
  });
  check(await page.evaluate(()=>gameInstance.collectibles.mainCollected)===5,'all fragments collected '+stage);
  check(await page.evaluate(()=>gameInstance.collectibles.secretsCollected)===1,'memory collected '+stage);
  if(stage===3){
   await page.evaluate(()=>{const g=gameInstance;g.player.x=500;g.player.y=840;g.player.vy=0;g.step(1/120);});check(await page.evaluate(()=>gameInstance.player.isRespawning),'water triggers respawn');
   await page.keyboard.press('Escape');const timer=await page.evaluate(()=>gameInstance.player.respawnTime);await page.waitForTimeout(120);check(await page.evaluate(()=>gameInstance.player.respawnTime)===timer,'pause freezes respawn');
   await page.getByRole('button',{name:'Retomar'}).click();await page.evaluate(()=>{for(let i=0;i<80;i++)gameInstance.step(1/120);});
   check(!await page.evaluate(()=>gameInstance.player.isRespawning),'respawn completes');check(await page.evaluate(()=>gameInstance.collectibles.mainCollected)===5,'respawn preserves stars');
  }
  await page.evaluate(()=>{const g=gameInstance;g.player.isRespawning=false;g.player.x=2291;g.player.y=772;g.player.vx=g.player.vy=0;g.step(1/120);});
  check(await page.evaluate(()=>gameInstance.progress.completed.includes(gameInstance.activeStage)),'completion saved '+stage);
  if(stage<5){await page.getByRole('button',{name:'Próximo capítulo'}).click();await page.getByRole('button',{name:'Entrar no capítulo'}).click();}
 }
 check(await page.locator('#dialog-title').textContent()==='Aurora volta a brilhar','complete memory ending');
 check(await page.evaluate(()=>gameInstance.total('main'))===30,'30 stars total');
 check(await page.evaluate(()=>gameInstance.total('secret'))===6,'six memories total');
 await page.reload();check(await page.getByRole('button',{name:'Continuar jornada'}).isVisible(),'reload restores progress');
 check(await page.evaluate(()=>gameInstance.progress.current)===5,'menu does not overwrite resume chapter');
 check(await page.evaluate(()=>gameSettings.musicVolume)===.25,'settings persisted');
 await page.getByRole('button',{name:'Continuar jornada'}).click();await page.getByRole('button',{name:'Entrar no capítulo'}).click();
 check(await page.evaluate(()=>gameInstance.collectibles.mainCollected)===5,'revisit preserves collection');
 check(await page.evaluate(()=>gameInstance.total('main'))===30,'revisit does not double count');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Menu principal'}).click();await page.getByRole('button',{name:'Nova jornada',exact:true}).click();await page.getByRole('button',{name:'Manter minha jornada'}).click();
 check(await page.evaluate(()=>gameInstance.progress.unlocked)===5,'reset cancellation preserves progress');
 await page.getByRole('button',{name:'Nova jornada',exact:true}).click();await page.getByRole('button',{name:'Recomeçar',exact:true}).click();check(await page.evaluate(()=>gameInstance.progress.unlocked)===0,'new journey resets chapters');
 check(await page.evaluate(()=>gameInstance.total('main'))===0,'new journey resets collection');
 check(await page.evaluate(()=>gameSettings.musicVolume)===.25,'new journey keeps preferences');
 // Alternate ending with no optional memories.
 await page.evaluate(()=>{const g=gameInstance;g.progress.records={};for(let i=0;i<6;i++)g.progress.records[i]={stars:['s0','s1','s2','s3','s4'],checkpoint:'start'};g.progress.unlocked=5;g.loadStage(5);g.ui.ending();});
 check(await page.locator('#dialog-title').textContent()==='O céu se lembra','standard ending');
 check(errors.length===0,'no browser errors: '+errors.join(','));
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const phone=await mobile.newPage();
 await phone.goto(url);await phone.getByRole('button',{name:'Começar jornada',exact:true}).click();await phone.getByRole('button',{name:'Entrar no capítulo'}).click();check(await phone.locator('#touch-controls').isVisible(),'mobile controls enabled automatically');
 await phone.touchscreen.tap(320,794);check(await phone.evaluate(()=>gameInstance.state)==='playing','touch gameplay stays active');
 await phone.getByRole('button',{name:'Pausar jogo'}).click();await phone.getByRole('button',{name:'Como jogar',exact:true}).click();check(await phone.locator('#dialog-title').textContent()==='Como jogar','mobile help accessible');
 check(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal mobile overflow');
 await phone.setViewportSize({width:844,height:390});await phone.getByRole('button',{name:'Voltar',exact:true}).click();check(await phone.getByRole('button',{name:'Retomar'}).isVisible(),'landscape pause accessible');
 await mobile.close();await context.close();console.log(checks+' browser assertions passed (desktop, mobile, all chapter transitions and both endings).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
