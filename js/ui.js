class GameUI {
 constructor(game){this.game=game;this.dialog=null;this.returnTo='menu';this.bind();this.loadSettings();}
 $(id){return document.getElementById(id);}
 bind(){
  this.$('btn-play').onclick=()=>this.newJourney();
  this.$('btn-continue').onclick=()=>this.game.start();
  this.$('btn-map').onclick=()=>this.map();
  this.$('btn-open-story').onclick=()=>this.help();
  this.$('btn-open-settings').onclick=()=>this.settings();
  this.$('btn-close-settings').onclick=()=>this.closeDialog();
  this.$('btn-settings-toggle').onclick=()=>this.pause();
  this.$('power-status').onclick=()=>{if(this.game.state==='playing')this.game.player.useStarPower();};
  this.$('btn-sound-toggle').onclick=()=>{
   const muted=window.soundEngine.toggleMute();this.$('btn-sound-toggle').textContent=muted?'♪':'♫';this.$('btn-sound-toggle').setAttribute('aria-pressed',String(muted));
   this.$('btn-sound-toggle').setAttribute('aria-label',muted?'Ativar áudio':'Silenciar áudio');
  };
  for(const [id,key]of [['btn-touch-left','touch-left'],['btn-touch-right','touch-right'],['btn-touch-jump','touch-jump']]){
   const button=this.$(id);let pointer=null;
   button.addEventListener('pointerdown',e=>{if(this.game.state!=='playing'||pointer!==null)return;e.preventDefault();pointer=e.pointerId;button.setPointerCapture(pointer);this.game.input(key,true);});
   const off=e=>{if(e.pointerId!==pointer)return;pointer=null;this.game.input(key,false);};
   button.addEventListener('pointerup',off);button.addEventListener('pointercancel',off);button.addEventListener('lostpointercapture',off);
  }
  document.addEventListener('keydown',e=>{
   if(e.key!=='Tab'||this.game.state==='playing')return;
   const visible=[...document.querySelectorAll('.screen-overlay:not(.hidden) button:not(:disabled),.screen-overlay:not(.hidden) input,.screen-overlay:not(.hidden) select')];
   if(!visible.length)return;const first=visible[0],last=visible[visible.length-1];
   if(e.shiftKey&&(document.activeElement===first||!visible.includes(document.activeElement))){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&(document.activeElement===last||!visible.includes(document.activeElement))){e.preventDefault();first.focus();}
  });
 }
 loadSettings(){
  let saved;try{saved=JSON.parse(localStorage.getItem(SETTINGS_KEY));}catch{}
  const s={...CONFIG.SETTINGS_DEFAULT,touchControls:matchMedia('(pointer: coarse)').matches};
  if(saved&&typeof saved==='object'){
   for(const key of ['screenShake','reduceMotion','highContrast','touchControls'])if(typeof saved[key]==='boolean')s[key]=saved[key];
   for(const key of ['musicVolume','sfxVolume'])if(Number.isFinite(saved[key]))s[key]=Math.max(0,Math.min(1,saved[key]));
   if(['low','medium','high'].includes(saved.particles))s.particles=saved.particles;
  }else s.reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.gameSettings=s;
  const fields=[['slider-music','musicVolume','volume'],['slider-sfx','sfxVolume','volume'],['toggle-screen-shake','screenShake','boolean'],['toggle-reduce-motion','reduceMotion','boolean'],['toggle-high-contrast','highContrast','boolean'],['toggle-touch','touchControls','boolean'],['select-particles','particles','select']];
  for(const [id,key,type]of fields){
   const el=this.$(id);if(type==='boolean')el.checked=s[key];else el.value=type==='volume'?Math.round(s[key]*100):s[key];
   el.addEventListener('input',()=>{s[key]=type==='boolean'?el.checked:type==='volume'?Number(el.value)/100:el.value;this.applySettings();persist(SETTINGS_KEY,s);});
  }
  this.applySettings();
 }
 applySettings(){
  const s=window.gameSettings;window.soundEngine.setMusicVolume(s.musicVolume);window.soundEngine.setSfxVolume(s.sfxVolume);
  this.$('label-music').textContent=Math.round(s.musicVolume*100)+'%';this.$('label-sfx').textContent=Math.round(s.sfxVolume*100)+'%';
  document.body.classList.toggle('reduce-motion',s.reduceMotion);this.showGameplay(this.game.state==='playing');
 }
 hideOverlays(){for(const id of ['title-screen','dialog-screen','settings-modal'])this.$(id).classList.add('hidden');this.dialog=null;}
 showGameplay(show){
  this.$('hud').classList.toggle('hidden',!show);this.$('touch-controls').classList.toggle('hidden',!show||!window.gameSettings?.touchControls);
  this.$('gameCanvas').setAttribute('aria-hidden',String(!show));
 }
 menu(){
  this.game.clearInput();this.game.state='menu';this.hideOverlays();this.showGameplay(false);this.$('title-screen').classList.remove('hidden');
  const saved=Object.keys(this.game.progress.records).length>0;
  this.$('btn-continue').classList.toggle('hidden',!saved);this.$('btn-play').classList.toggle('btn-secondary',saved);this.$('btn-play').classList.toggle('btn-primary',!saved);
  this.$('btn-play').textContent=saved?'Nova jornada':'Começar jornada';
  this.$('menu-progress').textContent=saved?this.game.progress.completed.length+' / 6 capítulos restaurados · progresso salvo neste navegador':'Uma aventura sem pressa. Nenhuma vida para perder.';
  this.$(saved?'btn-continue':'btn-play').focus();
 }
 renderDialog(kind,eyebrow,title,body,actions){
  this.game.clearInput();this.game.state=kind==='chapter'?'chapter':'paused';this.hideOverlays();this.showGameplay(false);this.dialog=kind;
  this.$('dialog-eyebrow').textContent=eyebrow;this.$('dialog-title').textContent=title;this.$('dialog-body').innerHTML=body;
  const root=this.$('dialog-actions');root.replaceChildren();
  for(const [label,fn,secondary]of actions){const b=document.createElement('button');b.className=secondary?'btn-secondary':'btn-primary';b.textContent=label;b.onclick=fn;root.append(b);}
  this.$('dialog-screen').classList.remove('hidden');root.querySelector('button')?.focus();
 }
 newJourney(){
  if(Object.keys(this.game.progress.records).length){
   this.renderDialog('reset','UM NOVO COMEÇO','Recomeçar a jornada?','<p>Os fragmentos, memórias e capítulos salvos serão reiniciados. Suas configurações serão mantidas.</p>',[['Recomeçar',()=>this.game.start(0,true)],['Manter minha jornada',()=>this.menu(),true]]);
  }else this.game.start(0,true);
 }
 chapter(stage){
  const c=CHAPTERS[stage];
  this.renderDialog('chapter','CAPÍTULO '+(stage+1)+' / 6 · '+c.place,c.name,'<p>'+c.text+'</p><p class="chapter-goal">'+c.goal+'</p><p class="lesson">'+c.lesson+'</p>',[['Entrar no capítulo',()=>this.game.enter()],['Voltar ao menu',()=>{this.game.save();this.menu();},true]]);
 }
 pause(){
  this.game.save();this.renderDialog('pause','UMA PAUSA NO CAMINHO','A floresta pode esperar','<p>'+CHAPTERS[this.game.activeStage].place+'</p><p class="stat-line">★ '+this.game.collectibles.mainCollected+' / 5 &nbsp; ◆ '+this.game.collectibles.secretsCollected+' / 1</p><p class="small-note">'+(this.game.saveAvailable?'Progresso salvo neste navegador.':'O navegador bloqueou o salvamento. A jornada continua disponível nesta sessão.')+'</p>',[['Retomar',()=>this.game.enter()],['Como jogar',()=>this.help(),true],['Configurações',()=>this.settings(),true],['Capítulos',()=>this.map(),true],['Menu principal',()=>this.menu(),true]]);
 }
 settings(){
  this.returnTo=this.game.state==='playing'||this.dialog==='pause'?'pause':'menu';if(this.game.state==='playing')this.game.save();
  this.game.clearInput();this.game.state='paused';this.hideOverlays();this.showGameplay(false);this.dialog='settings';this.$('settings-modal').classList.remove('hidden');this.$('slider-music').focus();
 }
 closeDialog(){this.returnTo==='pause'?this.pause():this.menu();}
 help(){
  this.returnTo=this.game.state==='playing'||this.dialog==='pause'?'pause':'menu';
  this.renderDialog('help','PEQUENOS PASSOS, GRANDES CONSTELAÇÕES','Como jogar','<ul class="help-grid"><li><strong>A / D · ← / →</strong> — mover. Shift — correr.</li><li><strong>W · ↑ · Espaço</strong> — pular. Segure para saltar mais alto; solte para saltar menos.</li><li><strong>E · ✦</strong> — poder estelar após cinco fragmentos. Recarrega em seis segundos; após dez, permite um segundo salto durante a ativação.</li><li><strong>★</strong> — encontre os cinco fragmentos da fase e atravesse o portal. As cinco luzes acima dele mostram o progresso.</li><li><strong>◆</strong> — memória opcional. Encontre as seis para conhecer o nome da guardiã.</li><li><strong>Monólitos verdes</strong> — checkpoints. Cair preserva todos os fragmentos.</li><li><strong>Esc · ⏸</strong> — pausar. No celular, use as setas e ↑. O progresso é salvo neste navegador.</li></ul>',[['Voltar',()=>this.closeDialog()]]);
 }
 map(){
  if(this.game.state==='playing'||this.dialog==='pause')this.game.save();
  const rows=CHAPTERS.map((c,i)=>'<button class="chapter-row" data-stage="'+i+'" '+(i>this.game.progress.unlocked?'disabled':'')+'><div>'+String(i+1).padStart(2,'0')+' · '+c.place+'<small>'+c.name+'</small></div><span>'+(i>this.game.progress.unlocked?'◇':this.game.progress.completed.includes(i)?'★':'→')+'</span></button>').join('');
  this.renderDialog('map','O CAMINHO DAS ESTRELAS','Seis capítulos, um céu','<div class="constellation" aria-hidden="true">'+CHAPTERS.map((c,i)=>'<span class="chapter-node '+(this.game.progress.completed.includes(i)?'done':'')+'" style="display:grid;place-items:center">'+(i>this.game.progress.unlocked?'·':i+1)+'</span>').join('')+'</div><div class="chapter-list">'+rows+'</div>',[['Menu principal',()=>this.menu(),true]]);
  for(const b of this.$('dialog-body').querySelectorAll('[data-stage]'))b.onclick=()=>this.game.start(Number(b.dataset.stage));
 }
 completed(){
  const c=CHAPTERS[this.game.activeStage];this.renderDialog('complete','CAPÍTULO RESTAURADO',c.name,'<p class="stat-line">★ 5 / 5 &nbsp; ◆ '+this.game.collectibles.secretsCollected+' / 1</p><p>A constelação ganhou mais um caminho. A floresta já se lembra de um pouco mais da sua luz.</p>',[['Próximo capítulo',()=>this.game.start(this.game.activeStage+1)],['Capítulos',()=>this.map(),true]]);
 }
 ending(){
  const memories=this.game.total('secret');
  const text=memories===6?'As seis memórias revelaram seu nome: Aurora. A guardiã renasceu na semente do pingente, e Lunara ouviu seu agradecimento entre as folhas. Agora, cada estrela guarda uma história — e nenhuma delas precisa brilhar sozinha.':'O pingente floresceu, a Árvore despertou e a constelação voltou ao firmamento. Lunara se deitou entre as raízes ao nascer do dia. A voz da guardiã ainda vive nas memórias violetas que esperam pela floresta.';
  this.renderDialog('ending','FIM DA JORNADA · INÍCIO DE UMA NOVA LUZ',memories===6?'Aurora volta a brilhar':'O céu se lembra', '<p>'+text+'</p><p class="stat-line">★ '+this.game.total('main')+' / 30 &nbsp; ◆ '+memories+' / 6</p><p class="small-note">Lunara · As Estrelas Perdidas<br>Criação de SouBeatrizKaroline</p>',[['Revisitar capítulos',()=>this.map()],['Nova jornada',()=>this.newJourney(),true],['Menu principal',()=>this.menu(),true]]);
 }
 update(){
  this.$('star-count-text').textContent=this.game.collectibles.mainCollected+' / 5';this.$('secret-count-text').textContent=this.game.collectibles.secretsCollected+' / 1';this.updatePower();
 }
 updatePower(){
  const p=this.game.player,b=this.$('power-status');b.disabled=!p.powerReady;b.classList.toggle('ready',p.powerReady);
  b.setAttribute('aria-label',p.powerReady?'Ativar poder estelar':p.powerLevel?'Poder estelar recarregando':'Poder estelar bloqueado');
  this.$('power-dots').textContent='•'.repeat(p.powerLevel);
 }
}
window.GameUI=GameUI;
