class World {
 draw(ctx,camera,progress,stage=0){
  const w=CONFIG.VIEWPORT.WIDTH,h=CONFIG.VIEWPORT.HEIGHT,color=CHAPTERS[stage].color;
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,stage===5?'#181936':'#0a122b');sky.addColorStop(.65,'#233251');sky.addColorStop(1,'#152c3e');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  // A deterministic sky and three parallax layers retain readable platform silhouettes.
  for(let i=0;i<90;i++){
   const x=((i*173-camera.x*.08)%w+w)%w,y=25+(i*67)%300;
   ctx.fillStyle=i<15+progress*75?'#f5e8b5':'#68799c';ctx.globalAlpha=.3+progress*.6;ctx.fillRect(x,y,i%7===0?3:1.5,i%7===0?3:1.5);
  }ctx.globalAlpha=1;
  const mx=780-camera.x*.04,my=105;
  const glow=ctx.createRadialGradient(mx,my,5,mx,my,110);glow.addColorStop(0,'#eadcbf22');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(mx-110,my-110,220,220);
  ctx.fillStyle='#eadfc5';ctx.beginPath();ctx.arc(mx,my,25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#18233d';ctx.beginPath();ctx.arc(mx+12,my-7,24,0,Math.PI*2);ctx.fill();
  for(let layer=0;layer<3;layer++){
   const factor=.12+layer*.13,spacing=layer===2?210:150;ctx.fillStyle=['#263953','#203448','#142e39'][layer];
   const offset=camera.x*factor;
   for(let i=-2;i<12;i++){
    const x=i*spacing-((offset%spacing)+spacing)%spacing,bottom=h+30-camera.y*(.05+layer*.025),height=250+(i+12)*37%180;
    ctx.beginPath();ctx.moveTo(x-8,bottom);ctx.lineTo(x-3,bottom-height);ctx.quadraticCurveTo(x-65,bottom-height-80,x-37,bottom-height-105);ctx.quadraticCurveTo(x-10,bottom-height-150,x+30,bottom-height-115);ctx.quadraticCurveTo(x+95,bottom-height-75,x+8,bottom-height);ctx.lineTo(x+13,bottom);ctx.fill();
    if(layer===2){ctx.strokeStyle='#31545b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+2,bottom-height*.7);ctx.lineTo(x+36,bottom-height*.82);ctx.stroke();}
   }
  }
  const mist=ctx.createLinearGradient(0,h*.55,0,h);mist.addColorStop(0,'transparent');mist.addColorStop(1,color+'18');ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);
  const count=window.gameSettings?.particles==='low'?8:window.gameSettings?.particles==='medium'?16:28;
  for(let i=0;i<count;i++){const x=((i*91.7-camera.x*.4)%w+w)%w,y=h*.42+(i*53)%260;ctx.fillStyle=i%3?color:'#ffe6a4';ctx.globalAlpha=.25+progress*.5;ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
 }
}
window.World=World;
