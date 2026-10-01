class Game {
 constructor(){
  this.canvas=document.getElementById('gameCanvas');this.ctx=this.canvas.getContext('2d');
  this.progress=readProgress();this.state='menu';this.held=new Set();this.last=0;this.accumulator=0;this.activeStage=0;this.saveAvailable=true;
  this.level=new Level();this.player=new Player(100,772);this.particles=new ParticleSystem();this.world=new World();
  this.camera=new Camera(CONFIG.VIEWPORT.WIDTH,CONFIG.VIEWPORT.HEIGHT,CONFIG.WORLD.WIDTH,CONFIG.WORLD.HEIGHT);
  this.collectibles=new CollectiblesManager();this.checkpoints=new CheckpointManager();this.ui=new GameUI(this);
  this.loadStage(0);this.ui.menu();this.bindKeys();this.resize();window.addEventListener('resize',()=>this.resize());
  window.addEventListener('blur',()=>{this.clearInput();if(this.state==='playing')this.ui.pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clearInput();this.save();if(this.state==='playing')this.ui.pause();}});
  window.addEventListener('pagehide',()=>this.save());requestAnimationFrame(t=>this.loop(t));
 }
 resize(){this.canvas.width=CONFIG.VIEWPORT.WIDTH;this.canvas.height=CONFIG.VIEWPORT.HEIGHT;}
 loadStage(stage){
  this.clearInput();this.activeStage=stage;this.level.init(stage);this.player=new Player(100,772);this.particles=new ParticleSystem();
  this.collectibles.init(this.level.collectiblesData);this.checkpoints.init(this.level.checkpointsData);
  const record=this.progress.records[stage];
  if(record){
   for(const star of this.collectibles.stars)star.collected=record.stars.includes(star.id);
   this.collectibles.mainCollected=this.collectibles.stars.filter(s=>s.collected&&!s.isSecret).length;
   this.collectibles.secretsCollected=this.collectibles.stars.filter(s=>s.collected&&s.isSecret).length;
   const cp=this.checkpoints.checkpoints.find(c=>c.id===record.checkpoint);
   if(cp){this.checkpoints.activeCheckpoint=cp;for(const c of this.checkpoints.checkpoints)c.isActive=c===cp;this.player.x=cp.spawnX;this.player.y=cp.y-this.player.height;}
  }
  this.player.setStars(this.total('main'));this.camera.x=Math.max(0,this.player.x-this.camera.offsetX);this.camera.y=380;this.camera.isCutscene=false;document.getElementById('fade-curtain').classList.remove('fade-in');
  this.ui.update();this.draw();
 }
 total(type){
  let count=0;
  for(const [key,r]of Object.entries(this.progress.records)){if(Number(key)===this.activeStage)continue;count+=r.stars.filter(id=>type==='secret'?id==='secret':id!=='secret').length;}
  return count+(type==='secret'?this.collectibles.secretsCollected:this.collectibles.mainCollected);
 }
 save(){
  if(!this.collectibles.stars.length||this.state==='menu')return;
  this.progress.records[this.activeStage]={stars:this.collectibles.stars.filter(s=>s.collected).map(s=>s.id),checkpoint:this.checkpoints.activeCheckpoint?.id||'start'};
  this.progress.current=this.activeStage;this.saveAvailable=persist(SAVE_KEY,this.progress);
 }
 start(stage=this.progress.current,reset=false){
  if(reset){this.progress=freshProgress();persist(SAVE_KEY,this.progress);stage=0;}if(stage>this.progress.unlocked)return;
  this.loadStage(stage);this.ui.chapter(stage);window.soundEngine.unlock();window.soundEngine.startMusic();
 }
 enter(){this.clearInput();this.state='playing';this.ui.hideOverlays();this.ui.showGameplay(true);this.ui.update();this.save();}
 complete(){
  if(this.state!=='playing')return;this.clearInput();this.state='transition';
  this.progress.completed=[...new Set([...this.progress.completed,this.activeStage])];this.progress.unlocked=Math.max(this.progress.unlocked,Math.min(5,this.activeStage+1));
  this.save();window.soundEngine.playVictory();if(this.activeStage===5)this.ui.ending();else this.ui.completed();
 }
 clearInput(){this.held?.clear();if(this.player){this.player.keys={};this.player.buffer=0;}}
 input(token,down){
  const jump=['w','arrowup',' ','touch-jump'],wasJump=[...this.held].some(k=>jump.includes(k));
  if(down)this.held.add(token);else this.held.delete(token);
  this.player.keys.left=['a','arrowleft','touch-left'].some(k=>this.held.has(k));
  this.player.keys.right=['d','arrowright','touch-right'].some(k=>this.held.has(k));
  this.player.keys.jump=jump.some(k=>this.held.has(k));this.player.keys.run=this.held.has('shift');
  if(!wasJump&&this.player.keys.jump&&this.state==='playing')this.player.keys.jumpPressed=true;
 }
 bindKeys(){
  addEventListener('keydown',e=>{
   const k=e.key.toLowerCase();
   if(k==='escape'&&!e.repeat){if(this.state==='playing')this.ui.pause();else if(this.ui.dialog==='pause')this.enter();else if(this.ui.dialog==='settings'||this.ui.dialog==='help')this.ui.closeDialog();return;}
   if(this.state!=='playing')return;
   if(['arrowleft','arrowright','arrowup',' ','a','d','w','shift','e'].includes(k))e.preventDefault();
   if(k==='e'&&!e.repeat)this.player.useStarPower();if(!e.repeat)this.input(k,true);
  });
  addEventListener('keyup',e=>this.input(e.key.toLowerCase(),false));
 }
 step(dt){
  this.level.update(dt);this.player.update(dt,this.level);
  if(this.player.isRespawning){
   this.player.respawnTime-=dt;
   if(this.player.respawnTime<=0){
    const cp=this.checkpoints.activeCheckpoint;this.player.x=cp.spawnX;this.player.y=cp.y-this.player.height;
    this.player.vx=this.player.vy=0;this.player.coyote=this.player.buffer=0;this.player.isGrounded=false;this.player.support=null;this.player.isRespawning=false;this.player.bounceGrace=0;document.getElementById('fade-curtain').classList.remove('fade-in');
    this.camera.x=Math.max(0,this.player.x-this.camera.offsetX);this.camera.y=Math.max(0,this.player.y-this.camera.offsetY);
   }
  }else{
   const previous=this.checkpoints.activeCheckpoint;this.checkpoints.update(dt,this.player,this.particles,window.soundEngine);if(previous!==this.checkpoints.activeCheckpoint)this.save();
   this.collectibles.update(dt,this.player,this.particles,window.soundEngine,()=>{this.player.setStars(this.total('main'));this.ui.update();this.save();});
   if(this.collectibles.mainCollected===5&&Math.abs(this.player.x+19-this.level.portal.x)<42&&Math.abs(this.player.y+48-820)<70)this.complete();
  }
  this.camera.follow(this.player,dt);this.particles.update(dt);this.ui.updatePower();
 }
 loop(t){
  const dt=this.last?Math.min(.05,(t-this.last)/1000):0;this.last=t;
  if(this.state==='playing'){this.accumulator+=dt;while(this.accumulator>=1/120&&this.state==='playing'){this.step(1/120);this.accumulator-=1/120;}}else this.accumulator=0;
  this.draw();requestAnimationFrame(n=>this.loop(n));
 }
 draw(){
  const c=this.ctx,ratio=this.total('main')/30;
  this.world.draw(c,this.camera,ratio,this.activeStage);this.camera.applyTransform(c);this.level.render(c,this.camera,ratio);this.level.drawPortal(c,this.collectibles.mainCollected);
  this.collectibles.render(c,this.camera);this.checkpoints.render(c,this.camera);this.player.draw(c);this.particles.draw(c);this.camera.restoreTransform(c);
 }
}
window.addEventListener('DOMContentLoaded',()=>{window.gameInstance=new Game();});
