/* Separate chapters; required routes never depend on powers. */
const CHAPTERS = [
 {name:'O último brilho',place:'Início da Floresta',color:'#6cbfba',text:'Na noite em que a constelação se apagou, Lunara encontrou um fragmento preso ao seu pingente. A guardiã da floresta havia deixado um pedido: siga a luz antes que a manhã esqueça as estrelas.',goal:'Reúna os cinco fragmentos e atravesse o portal. As lanternas indicam o caminho.',lesson:'Ande com A/D ou ←/→. Pule com W, ↑ ou Espaço; segure para subir mais. No celular, use os botões na tela.'},
 {name:'O bosque que sonha',place:'Bosque dos Cogumelos',color:'#c18bff',text:'O primeiro brilho despertou o bosque. Sob as raízes, Lunara ouviu a voz da guardiã: a escuridão separou as estrelas para esconder um caminho até a Árvore Ancestral.',goal:'Use os cogumelos para alcançar as copas. Uma memória violeta espera fora do caminho principal.',lesson:'Cogumelos impulsionam automaticamente. Seu pingente libera um impulso com E ou ✦; ele se recarrega.'},
 {name:'Entre duas margens',place:'Ponte Antiga',color:'#e2ae73',text:'A ponte ainda guardava as pegadas dos antigos viajantes. Cada fragmento revelou uma parte da constelação: ela era um mapa, e Lunara era a primeira a segui-lo em muitos invernos.',goal:'Atravesse os vãos da ponte. Os monólitos guardam seu ponto de retorno.',lesson:'É possível pular logo após sair de uma borda. Cair não apaga os fragmentos. Esc ou ⏸ pausa a jornada.'},
 {name:'A canção do riacho',place:'Riacho Encantado',color:'#68dacf',text:'As águas levaram os últimos ecos da guardiã para longe. Lunara reuniu a luz sobre as pedras e devolveu ao riacho sua canção. Nas ondas, viu a Árvore: viva, mas adormecida.',goal:'Salte pelas pedras sobre a água e alcance as ilhas mais altas.',lesson:'Ao cair na água, você retorna ao último monólito. O brilho verde marca um ponto seguro.'},
 {name:'Memórias de pedra',place:'Clareira Mística',color:'#bda4f5',text:'Nas ruínas, a verdade ganhou forma: a guardiã havia dividido sua própria luz para proteger a floresta. As memórias violetas conservavam seu nome. Recuperá-las era uma escolha de Lunara, não uma condição para salvar o céu.',goal:'Suba as escadarias e atravesse as plataformas que flutuam entre as ruínas.',lesson:'As plataformas em movimento carregam você. O poder permite um segundo salto no ar; nenhum salto obrigatório depende dele.'},
 {name:'De volta ao firmamento',place:'Árvore Ancestral',color:'#ffd15c',text:'O pingente era a última semente da guardiã. Ao reunir a constelação, Lunara poderia devolver a luz ao céu — e, com todas as memórias, devolver um nome à voz que a acompanhou.',goal:'Reúna os últimos fragmentos e leve a constelação ao coração da Árvore.',lesson:'Este santuário reúne o que você aprendeu: impulsos, travessias e saltos em sequência.'}
];
const SAVE_KEY = 'lunara.campaign.v1', SETTINGS_KEY = 'lunara.settings.v1';
function freshProgress() { return {version:1,unlocked:0,current:0,completed:[],records:{}}; }
function readProgress() {
 try {
  const d = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (!d || d.version !== 1 || !Number.isInteger(d.unlocked) || d.unlocked < 0 || d.unlocked > 5) return freshProgress();
  const c = freshProgress(); c.unlocked = d.unlocked;
  c.current = Number.isInteger(d.current) ? Math.max(0,Math.min(c.unlocked,d.current)) : 0;
  c.completed = Array.isArray(d.completed) ? [...new Set(d.completed.filter(n => Number.isInteger(n) && n >= 0 && n <= c.unlocked))] : [];
  for (let i=0;i<=c.unlocked;i++) { const r=d.records?.[i]; if (!r) continue;
   c.records[i]={stars:Array.isArray(r.stars)?[...new Set(r.stars.filter(id=>typeof id==='string' && /^(s[0-4]|secret)$/.test(id)))]:[],checkpoint:r.checkpoint==='middle'?'middle':'start'};
  } return c;
 } catch { return freshProgress(); }
}
function persist(key,value) { try {localStorage.setItem(key,JSON.stringify(value));return true;} catch {return false;} }
Level.prototype.init = function(stage=0) {
 this.stage=stage; this.chapter=CHAPTERS[stage]; this.platforms=[]; this.waterZones=[]; this.decorativeProps=[]; this.collectiblesData=[]; this.time=0;
 const ground=(x,w,y=820)=>this.addPlatform(x,y,w,1100-y,false,'grass');
 const ledge=(x,y,w=150,style='stone')=>this.addPlatform(x,y,w,24,true,style);
 ground(0,260); ground(2200,200);
 const targets=[400,800,1200,1600,2000]; let tops;
 if(stage===0) {
  ground(260,1940); tops=[740,720,710,720,740]; targets.forEach((x,i)=>ledge(x-65,tops[i],150,'grass'));
 } else if(stage===1) {
  ground(260,1940); tops=[620,620,620,620,620];
  targets.forEach(x=>{this.addMushroom(x-110,790,100,30);ledge(x-35,620,150,'branch');this.addProp('glowing_mushrooms_cluster',x-155,820);});
 } else if(stage===2) {
  tops=[780,760,760,760,780];
  for(let x=260;x<2200;x+=220) ledge(x,790-Math.sin(x/500)*20,170,'bridge');
  targets.forEach((x,i)=>ledge(x-60,tops[i],130,'bridge'));
  ledge(930,930,170,'ruined_stone');this.addMushroom(1090,920,100,30);
  this.addProp('bridge_post_lantern',240,820);this.addProp('bridge_post_lantern',2200,820);
 } else if(stage===3) {
  tops=[780,730,730,730,780];this.waterZones.push({x:260,y:855,w:1940,h:245});
  for(let x=260;x<2200;x+=220) ledge(x,810-(Math.floor(x/220)%3)*30,140,'stepping_stone');
  targets.forEach((x,i)=>ledge(x-60,tops[i],145,'stepping_stone'));this.addProp('waterfall',1450,860);
 } else if(stage===4) {
  ground(260,1940);tops=[580,580,580,580,580];
  targets.forEach((x,i)=>{
   ledge(x-240,740,105,'ruined_stone');ledge(x-130,660,110,'ruined_stone');ledge(x-20,580,155,'ruined_stone');
   if(i%2){const p=this.platforms[this.platforms.length-1];p.baseX=p.x;p.moving=true;p.phase=i;}
   this.addProp('ruin_arch',x,820);
  });
 } else {
  ground(260,400);ground(980,490);ground(1800,400);
  this.waterZones.push({x:660,y:865,w:320,h:235},{x:1470,y:865,w:330,h:235});
  tops=[620,750,580,740,620];
  this.addMushroom(290,790,100,30);ledge(365,620,160,'branch');
  ledge(650,790,130);ledge(770,750,140);ledge(910,790,130);
  ledge(1010,740,105);ledge(1100,660,110);ledge(1190,580,150,'branch');
  ledge(1450,790,130,'bridge');ledge(1570,740,145,'bridge');ledge(1730,790,130,'bridge');
  this.addMushroom(1880,790,100,30);ledge(1965,620,160,'branch');
  this.addProp('ancient_tree_monument',2280,820);
 }
 targets.forEach((x,i)=>{this.collectiblesData.push({id:'s'+i,x:x+20,y:tops[i]-42,isSecret:false});this.addProp('stone_lantern',x-80,820);});
 const sy=stage===2?885:stage===1||stage===5?505:stage===4?480:615;
 if(stage!==2) ledge(1260,sy+42,130,'secret_branch');
 if(stage===0||stage===3) ledge(1160,735,110);
 this.collectiblesData.push({id:'secret',x:stage===2?1020:1310,y:sy,isSecret:true});
 this.checkpointsData=[{id:'start',x:110,y:820,name:this.chapter.place},{id:'middle',x:stage===2||stage===3?1180:1390,y:stage===2?760:stage===3?730:820,name:'Ponto seguro'}];
 if(stage===2||stage===3) ledge(1140,this.checkpointsData[1].y,160);
 this.portal={x:2310,y:820};
};
Level.prototype.update=function(dt){
 this.time+=dt;
 for(const p of this.platforms){p.dx=0;if(p.moving){const old=p.x;p.x=p.baseX+Math.sin(this.time*1.3+p.phase)*24;p.dx=p.x-old;}}
};
Level.prototype.drawPortal=function(ctx,count){
 const {x,y}=this.portal,ready=count===5;
 ctx.save();ctx.translate(x,y);ctx.strokeStyle=ready?'#ffdf86':'#66769d';ctx.lineWidth=8;
 ctx.shadowColor=ready?'#ffd15c':'#6fa3c9';ctx.shadowBlur=ready?25:0;
 ctx.beginPath();ctx.ellipse(0,-56,38,61,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle=ready?'rgba(255,215,120,.25)':'rgba(80,100,160,.12)';ctx.fill();ctx.shadowBlur=0;
 for(let i=0;i<5;i++){ctx.fillStyle=i<count?'#ffe6a4':'#354064';ctx.beginPath();ctx.arc(-32+i*16,-137,5,0,Math.PI*2);ctx.fill();}
 ctx.restore();
};
window.CHAPTERS=CHAPTERS;

// Original vector scenery: no external images or loading dependencies.
const drawBaseProp = Level.prototype.drawProp;
Level.prototype.drawProp = function(ctx,prop,progress) {
 drawBaseProp.call(this,ctx,prop,progress);
 ctx.save();ctx.translate(prop.x,prop.y);
 if(prop.type==='ancient_tree_monument'){
  const glow=ctx.createRadialGradient(0,-150,10,0,-150,230);glow.addColorStop(0,'rgba(255,215,130,'+(.08+progress*.18)+')');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(-230,-380,460,430);
  ctx.strokeStyle='#63505b';ctx.lineCap='round';ctx.lineWidth=34;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-25,-110,15,-190,-10,-275);ctx.stroke();
  for(let i=0;i<7;i++){
   const sign=i%2?1:-1,y=-90-i*25;
   ctx.lineWidth=15-i;ctx.beginPath();ctx.moveTo(-3,y);ctx.quadraticCurveTo(sign*80,y-12,sign*(100+i*7),y-95);ctx.stroke();
   ctx.fillStyle=progress>.8?'#51796a':'#375563';ctx.beginPath();ctx.ellipse(sign*(80+i*7),y-100,60,40,sign*.4,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=progress>.8?'#e4cd85':'#94a9af';for(let j=0;j<5;j++){ctx.beginPath();ctx.ellipse(sign*(70+i*7)+j*13-25,y-90+(j%2)*17,5,2,-.5,0,Math.PI*2);ctx.fill();}
  }
  ctx.strokeStyle='#f6d27b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-15);ctx.bezierCurveTo(-15,-100,14,-150,-5,-245);ctx.stroke();
  ctx.lineWidth=10;ctx.strokeStyle='#514858';ctx.beginPath();ctx.moveTo(-8,-10);ctx.lineTo(-80,2);ctx.moveTo(8,-10);ctx.lineTo(80,2);ctx.stroke();
 } else if(prop.type==='ruin_arch'){
  ctx.strokeStyle='#394863';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(-55,0);ctx.lineTo(-55,-122);ctx.bezierCurveTo(-50,-185,50,-185,55,-122);ctx.lineTo(55,0);ctx.stroke();
  ctx.strokeStyle='#779895';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-58,-15);ctx.lineTo(-48,-89);ctx.moveTo(55,-105);ctx.lineTo(49,-30);ctx.stroke();
  ctx.fillStyle='#82cbbd';ctx.beginPath();ctx.arc(0,-168,5,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
};

const drawBasePlatform = Level.prototype.drawPlatform;
Level.prototype.drawPlatform = function(ctx,p,progress) {
 drawBasePlatform.call(this,ctx,p,progress);
 if(p.isMushroom)return;
 ctx.save();
 if(p.style==='bridge'){
  ctx.strokeStyle='#978071';ctx.lineWidth=2;
  for(const side of [0,p.w]){
   ctx.beginPath();ctx.moveTo(p.x+side,p.y-35);ctx.lineTo(p.x+side,p.y+2);ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(p.x,p.y-35);ctx.quadraticCurveTo(p.x+p.w/2,p.y-8,p.x+p.w,p.y-35);ctx.stroke();
 }else if(p.style==='grass'){
  ctx.strokeStyle=progress>.5?'#67bba1':'#4b8d83';ctx.lineWidth=1.5;
  const start=Math.max(p.x+8,Math.floor(window.gameInstance?.camera.x||0));
  const end=Math.min(p.x+p.w-5,start+CONFIG.VIEWPORT.WIDTH+60);
  for(let x=start;x<end;x+=24){
   ctx.beginPath();ctx.moveTo(x,p.y+3);ctx.lineTo(x-3,p.y-5-(Math.floor(x)%7));ctx.moveTo(x,p.y+3);ctx.lineTo(x+4,p.y-3);ctx.stroke();
   ctx.fillStyle='#253445';ctx.beginPath();ctx.ellipse(x+10,p.y+27+(Math.floor(x)%43),7,3,.25,0,Math.PI*2);ctx.fill();
   if(Math.floor(x/24)%5===0){ctx.fillStyle=progress>.5?'#c6a9f0':'#79999b';ctx.beginPath();ctx.arc(x,p.y-6,2.5,0,Math.PI*2);ctx.fill();}
  }
 }else{
  ctx.strokeStyle='#63768d88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x+p.w*.3,p.y+10);ctx.lineTo(p.x+p.w*.4,p.y+18);ctx.lineTo(p.x+p.w*.37,p.y+p.h);ctx.stroke();
 }
 ctx.restore();
};
