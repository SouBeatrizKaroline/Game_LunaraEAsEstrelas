class Player {
 constructor(x,y) { Object.assign(this,{x,y,width:38,height:48,vx:0,vy:0,isGrounded:false,isRespawning:false,facingRight:true,keys:{},stars:0,powerLevel:0,powerReady:false,powerActive:false,powerTime:0,cooldown:0,doubleJumpUsed:false,coyote:0,buffer:0,anim:0,pendant:0,bounceGrace:0,support:null}); }
 setStars(count) {this.stars=count;this.powerLevel=count>=20?3:count>=10?2:count>=5?1:0;this.powerReady=this.powerLevel>0&&this.cooldown<=0;}
 useStarPower() {
  if(!this.powerReady||this.isRespawning)return false;
  this.powerReady=false;this.powerActive=true;this.powerTime=3;this.cooldown=6;this.vy=Math.min(this.vy,-650);this.bounceGrace=.25;this.isGrounded=false;this.doubleJumpUsed=false;
  window.soundEngine?.playJump();return true;
 }
 update(dt,level) {
  if(this.isRespawning)return;
  const cfg=CONFIG.PLAYER;this.anim+=dt;this.pendant=Math.max(0,this.pendant-dt);
  this.cooldown=Math.max(0,this.cooldown-dt);this.powerReady=this.powerLevel>0&&this.cooldown===0;
  this.powerTime=Math.max(0,this.powerTime-dt);this.powerActive=this.powerTime>0;this.bounceGrace=Math.max(0,this.bounceGrace-dt);
  if(this.support?.moving)this.x+=this.support.dx;
  const dir=Number(!!this.keys.right)-Number(!!this.keys.left),speed=this.keys.run?cfg.RUN_SPEED:cfg.WALK_SPEED;
  const accel=dir?(this.isGrounded?cfg.ACCEL:cfg.AIR_ACCEL):(this.isGrounded?cfg.DECEL:cfg.AIR_DECEL);
  const target=dir*speed;this.vx+=Math.sign(target-this.vx)*Math.min(Math.abs(target-this.vx),accel*dt);if(dir)this.facingRight=dir>0;
  this.coyote=this.isGrounded?cfg.COYOTE_TIME:Math.max(0,this.coyote-dt);
  this.buffer=this.keys.jumpPressed?cfg.JUMP_BUFFER:Math.max(0,this.buffer-dt);this.keys.jumpPressed=false;
  if(this.buffer>0&&(this.coyote>0||(this.powerActive&&this.powerLevel>=2&&!this.doubleJumpUsed))){
   this.doubleJumpUsed=this.coyote<=0;this.vy=cfg.JUMP_VELOCITY;this.buffer=0;this.coyote=0;this.isGrounded=false;this.support=null;window.soundEngine?.playJump();
  }
  if(!this.keys.jump&&this.vy< -240&&this.bounceGrace<=0)this.vy=-240;
  this.vy=Math.min(cfg.MAX_FALL_SPEED,this.vy+cfg.GRAVITY*dt);
  const oldX=this.x;this.x=Math.max(0,Math.min(CONFIG.WORLD.WIDTH-this.width,this.x+this.vx*dt));
  for(const p of level.platforms){
   if(p.oneWay||this.y+this.height<=p.y+1||this.y>=p.y+p.h)continue;
   if(this.x+this.width>p.x&&this.x<p.x+p.w){
    if(oldX+this.width<=p.x+1)this.x=p.x-this.width;else if(oldX>=p.x+p.w-1)this.x=p.x+p.w;
    this.vx=0;
   }
  }
  const oldY=this.y;this.y+=this.vy*dt;this.isGrounded=false;this.support=null;
  for(const p of level.platforms){
   if(this.x+this.width<=p.x||this.x>=p.x+p.w)continue;
   if(this.vy>=0&&oldY+this.height<=p.y+.5&&this.y+this.height>=p.y){
    this.y=p.y-this.height;this.vy=0;this.isGrounded=true;this.doubleJumpUsed=false;this.support=p;
    if(p.isMushroom){this.vy=cfg.MUSHROOM_BOUNCE_VELOCITY;this.bounceGrace=.6;this.coyote=0;this.isGrounded=false;this.support=null;window.soundEngine?.playBounce();window.gameInstance?.particles.spawnBurst(this.x+19,p.y,'#c18bff');}
   }else if(!p.oneWay&&this.vy<0&&oldY>=p.y+p.h&&this.y<p.y+p.h){this.y=p.y+p.h;this.vy=0;}
  }
  const wet=level.waterZones.some(w=>this.x+this.width>w.x&&this.x<w.x+w.w&&this.y+this.height>w.y+8);
  if(wet||this.y>CONFIG.WORLD.DEATH_PIT_Y)level.triggerHazardRespawn(this,window.gameInstance.particles,window.soundEngine);
 }
 pulsePendantOnCollect(){this.pendant=.6;}
 draw(ctx){
  if(this.isRespawning)return;
  const reduce=window.gameSettings?.reduceMotion,stride=this.isGrounded&&Math.abs(this.vx)>20&&!reduce?Math.sin(this.anim*14):0,bob=stride?Math.abs(stride)*1.5:0;
  ctx.save();ctx.translate(this.x+19,this.y+26-bob);ctx.scale(this.facingRight?1:-1,1);
  ctx.strokeStyle='#d8b49b';ctx.lineWidth=5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-9,14);ctx.quadraticCurveTo(-32,9,-22,-3+(reduce?0:Math.sin(this.anim*3)*3));ctx.stroke();
  ctx.fillStyle='#244c83';ctx.beginPath();ctx.moveTo(-12,-7);ctx.quadraticCurveTo(-24-Math.abs(this.vx)*.025,6,-28,19+stride*2);ctx.lineTo(10,18);ctx.lineTo(13,-6);ctx.fill();
  ctx.strokeStyle='#78aedd';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#101b35';ctx.beginPath();ctx.roundRect(-11,-5,24,23,6);ctx.fill();
  ctx.fillStyle='#d3ad91';ctx.beginPath();ctx.ellipse(-5+stride*3,19,6,4,0,0,Math.PI*2);ctx.ellipse(9-stride*3,19,6,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e3bfa3';ctx.beginPath();ctx.moveTo(-14,-17);ctx.lineTo(-14,-34);ctx.lineTo(-3,-26);ctx.lineTo(9,-26);ctx.lineTo(17,-34);ctx.lineTo(17,-15);ctx.fill();
  ctx.fillStyle='#b77783';ctx.beginPath();ctx.moveTo(-12,-29);ctx.lineTo(-6,-24);ctx.lineTo(-12,-20);ctx.moveTo(14,-29);ctx.lineTo(9,-23);ctx.lineTo(14,-20);ctx.fill();
  ctx.fillStyle='#e3bfa3';ctx.beginPath();ctx.ellipse(2,-16,17,15,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#4b3240';ctx.beginPath();ctx.moveTo(-15,-19);ctx.quadraticCurveTo(-7,-36,16,-24);ctx.lineTo(10,-15);ctx.lineTo(7,-23);ctx.lineTo(0,-15);ctx.lineTo(-1,-24);ctx.lineTo(-12,-12);ctx.fill();
  const blink=!reduce&&this.anim%4.5>4.35;
  ctx.fillStyle='#35253b';ctx.beginPath();ctx.ellipse(-4,-13,4.5,blink?1:5,0,0,Math.PI*2);ctx.ellipse(10,-13,4.5,blink?1:5,0,0,Math.PI*2);ctx.fill();
  if(!blink){ctx.fillStyle='#ffd76e';ctx.beginPath();ctx.ellipse(-3,-13,2.3,4,0,0,Math.PI*2);ctx.ellipse(11,-13,2.3,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-4,-16,1.5,2);ctx.fillRect(10,-16,1.5,2);}
  ctx.strokeStyle='#6c4350';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(1,-7);ctx.lineTo(4,-5);ctx.lineTo(7,-7);ctx.stroke();
  ctx.fillStyle='#ffd15c';ctx.shadowColor='#ffe49a';ctx.shadowBlur=this.pendant>0||this.powerActive?20:5;
  ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(6,5);ctx.lineTo(2,10);ctx.lineTo(-2,5);ctx.closePath();ctx.fill();ctx.restore();
 }
}
window.Player=Player;
