const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const root=require('path').resolve(__dirname,'..'),context={console,Math,localStorage:{getItem:()=>null,setItem(){}},window:{soundEngine:{playJump(){},playBounce(){}}}};context.window.gameSettings={reduceMotion:true};vm.createContext(context);
for(const file of ['config','player','level','campaign'])vm.runInContext(fs.readFileSync(root+'/js/'+file+'.js','utf8'),context);
const Level=context.window.Level,Player=context.window.Player;let assertions=0;
function check(v,message){assert.ok(v,message);assertions++;}
function make(stage){const l=new Level();l.init(stage);l.triggerHazardRespawn=p=>p.isRespawning=true;context.window.gameInstance={particles:{spawnBurst(){}}};return l;}
for(let stage=0;stage<6;stage++){
 const l=make(stage);const reached=new Set([0]);const stars=new Set();let changed=true;
 while(changed){changed=false;
  for(const source of [...reached]){
   const p=l.platforms[source];
   for(let x=p.x+2;x<=p.x+p.w-8;x+=Math.min(30,Math.max(10,p.w/4))){
    for(const direction of [-1,0,1])for(const speed of [0,260,370])for(const jumping of [true,false]){
     const player=new Player(x,p.y-48);player.isGrounded=true;player.keys={jump:jumping,jumpPressed:jumping,right:direction>0,left:direction<0,run:speed===370};player.vx=direction*speed;
     if(p.isMushroom){player.vy=-760;player.keys.jumpPressed=false;player.isGrounded=false;player.bounceGrace=.6;}
     let airborne=false;
     for(let frame=0;frame<230;frame++){
      player.update(1/120,l);
      for(const s of l.collectiblesData)if(Math.hypot(player.x+19-s.x,player.y+24-s.y)<42)stars.add(s.id);
      if(!player.isGrounded)airborne=true;
      if(player.isRespawning)break;
      if(player.isGrounded&&airborne){const index=l.platforms.indexOf(player.support);if(!reached.has(index)){reached.add(index);changed=true;}break;}
     }
    }
   }
  }
 }
 for(const s of l.collectiblesData)check(stars.has(s.id),'Chapter '+stage+' unreachable '+s.id);
 check([...reached].some(i=>{const p=l.platforms[i];return p.x<=2310&&p.x+p.w>=2310&&p.y===820;}),'Chapter '+stage+' unreachable exit');
 console.log('Chapter '+(stage+1)+': all 5 fragments, optional memory and exit reachable without powers; platforms '+reached.size+'/'+l.platforms.length);
}
const l=make(0);
let player=new Player(100,772);player.isGrounded=true;player.keys={jump:true,jumpPressed:true};let high=player.y;
for(let i=0;i<100;i++){player.update(1/120,l);high=Math.min(high,player.y);}check(772-high>110,'full jump height');
player=new Player(100,772);player.isGrounded=true;player.keys={jump:false,jumpPressed:true};let low=player.y;
for(let i=0;i<100;i++){player.update(1/120,l);low=Math.min(low,player.y);}check(772-low<35,'short jump cut');
player=new Player(100,700);player.keys.jumpPressed=true;player.update(.008,l);for(let i=0;i<25;i++)player.update(.008,l);check(player.buffer===0,'expired buffer must clear');
player=new Player(250,772);player.isGrounded=false;player.coyote=.1;player.keys={jump:true,jumpPressed:true};player.update(.008,l);check(player.vy< -500,'coyote jump');
player=new Player(100,820);player.vy=850;player.update(.033,l);check(player.y>820,'no teleport snapping from below');
player=new Player(420,690);player.vy=850;player.update(.033,l);check(player.y===692,'swept landing prevents tunneling');
const mushroom=make(1);player=new Player(310,735);player.vy=300;player.update(.03,mushroom);check(player.vy===-760,'automatic mushroom bounce');
const water=make(3);player=new Player(500,820);player.update(.008,water);check(player.isRespawning,'water causes respawn');
player=new Player(100,772);player.setStars(20);check(player.useStarPower(),'power available');check(!player.useStarPower(),'cooldown blocks repeat');for(let i=0;i<730;i++)player.update(1/120,l);check(player.powerReady,'power recharges');
const corrupt=vm.runInContext("readProgress()",context);check(corrupt.unlocked===0,'missing save fallback');
console.log(assertions+' assertions passed');

const moving=make(4),platform=moving.platforms.find(p=>p.moving);
player=new Player(platform.x+40,platform.y-48);player.isGrounded=true;player.support=platform;
const startX=player.x,platformX=platform.x;
moving.update(.01);player.update(.01,moving);
check(Math.abs((player.x-startX)-(platform.x-platformX))<.001,'moving platform carries player');
player=new Player(500,1200);player.setStars(20);player.useStarPower();player.update(.008,l);check(player.isRespawning,'power never causes endless falling');
context.localStorage.getItem=()=>'{bad json';check(vm.runInContext('readProgress()',context).unlocked===0,'corrupt save fallback');
context.localStorage.getItem=()=>JSON.stringify({version:1,unlocked:99});check(vm.runInContext('readProgress()',context).unlocked===0,'invalid chapter save fallback');
console.log(assertions+' total physics assertions passed');
