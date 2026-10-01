class ParticleSystem {
 constructor(){this.items=[];Object.defineProperty(this,'particles',{get:()=>this.items});}
 spawnStarCollect(x,y){this.spawnBurst(x,y,'#ffd15c');}
 spawnStarBurst(x,y,secret=false){this.spawnBurst(x,y,secret?'#d38fff':'#ffd15c');}
 spawnSecretCollect(x,y){this.spawnBurst(x,y,'#d38fff');}
 spawnCheckpointActivate(x,y){this.spawnBurst(x,y,'#32b5a1');}
 spawnCheckpointBurst(x,y){this.spawnBurst(x,y,'#32b5a1');}
 spawnFloatingText(){} // Gameplay feedback is visual, never prose over the player.
 spawnBurst(x,y,color){
  if(window.gameSettings?.reduceMotion)return;
  const count=window.gameSettings?.particles==='low'?4:window.gameSettings?.particles==='medium'?8:14;
  for(let i=0;i<count;i++)this.items.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.7)*180,life:.8,color});
 }
 spawnRespawnDust(x,y){this.spawnBurst(x,y,'#c3abef');}
 update(dt){this.items=this.items.filter(p=>(p.life-=dt)>0).slice(-180);this.items.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;});}
 draw(ctx){this.items.forEach(p=>{ctx.globalAlpha=Math.min(1,Math.max(0,p.life));ctx.fillStyle=p.color||'#ffd15c';ctx.fillRect(p.x-2,p.y-2,4,4);});ctx.globalAlpha=1;}
}
window.ParticleSystem=ParticleSystem;
