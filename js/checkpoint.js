/**
 * Lunara: As Estrelas Perdidas
 * Checkpoint System
 */
class Checkpoint {
  constructor(id, x, y, name = '') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.name = name;
    this.width = 46;
    this.height = 70;
    this.spawnX = x + 10;
    this.spawnY = y - 48;
    this.isActive = false;
    this.runeGlowPhase = 0;
  }

  update(dt, player, particles, sound, onActivate) {
    this.runeGlowPhase += dt * 2.5;

    const px = player.x + player.width * 0.5;
    const py = player.y + player.height * 0.5;

    if (
      !this.isActive &&
      px >= this.x - 20 &&
      px <= this.x + this.width + 20 &&
      py >= this.y - this.height &&
      py <= this.y + 10
    ) {
      this.isActive = true;
      sound.playCheckpoint();
      particles.spawnCheckpointBurst(this.x + this.width * 0.5, this.y - this.height * 0.5);
      if (onActivate) onActivate(this);
    }
  }

  render(ctx, camera) {
    if (
      this.x + 80 < camera.x ||
      this.x - 80 > camera.x + camera.viewportWidth ||
      this.y + 20 < camera.y ||
      this.y - 100 > camera.y + camera.viewportHeight
    ) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = '#1c223a';
    ctx.beginPath();
    ctx.roundRect(-6, -10, this.width + 12, 12, 4);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(4, -10);
    ctx.lineTo(8, -this.height + 12);
    ctx.lineTo(this.width * 0.5, -this.height);
    ctx.lineTo(this.width - 8, -this.height + 12);
    ctx.lineTo(this.width - 4, -10);
    ctx.closePath();

    const stoneGrad = ctx.createLinearGradient(0, -this.height, 0, 0);
    stoneGrad.addColorStop(0, '#2b3459');
    stoneGrad.addColorStop(1, '#151a30');
    ctx.fillStyle = stoneGrad;
    ctx.fill();

    ctx.strokeStyle = '#47568c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#2f5745';
    ctx.beginPath();
    ctx.ellipse(8, -8, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.width - 8, -12, 8, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const runeX = this.width * 0.5;
    const runeY = -this.height * 0.52;

    if (this.isActive) {
      const pulse = Math.sin(this.runeGlowPhase) * 0.2 + 0.8;
      const auraRadius = 28 * pulse;

      const auraGrad = ctx.createRadialGradient(runeX, runeY, 2, runeX, runeY, auraRadius);
      auraGrad.addColorStop(0, 'rgba(104, 240, 223, 0.75)');
      auraGrad.addColorStop(0.5, 'rgba(70, 160, 240, 0.25)');
      auraGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(runeX, runeY, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#a4f8ff';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#68f0df';
      ctx.shadowBlur = 12;

      this.drawRuneSymbol(ctx, runeX, runeY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(runeX, runeY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#273052';
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 0;
      this.drawRuneSymbol(ctx, runeX, runeY);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawRuneSymbol(ctx, cx, cy) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 9, cy);
    ctx.lineTo(cx, cy + 14);
    ctx.lineTo(cx - 9, cy);
    ctx.closePath();

    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.moveTo(cx - 6, cy);
    ctx.lineTo(cx + 6, cy);
  }
}

class CheckpointManager {
  constructor() {
    this.checkpoints = [];
    this.activeCheckpoint = null;
  }

  init(definitions) {
    this.checkpoints = definitions.map(def => new Checkpoint(def.id, def.x, def.y, def.name));
    if (this.checkpoints.length > 0) {
      this.checkpoints[0].isActive = true;
      this.activeCheckpoint = this.checkpoints[0];
    }
  }

  update(dt, player, particles, sound) {
    for (const cp of this.checkpoints) {
      cp.update(dt, player, particles, sound, (activatedCp) => {
        for (const other of this.checkpoints) {
          other.isActive = (other.id === activatedCp.id);
        }
        this.activeCheckpoint = activatedCp;
      });
    }
  }

  render(ctx, camera) {
    for (const cp of this.checkpoints) {
      cp.render(ctx, camera);
    }
  }

  respawnPlayer(player, particles, sound) {
    player.isRespawning = true;
    player.respawnTime = .4;
    player.vx = player.vy = 0;
    player.support = null;
    player.buffer = player.coyote = 0;
    window.gameInstance?.clearInput();
    sound.playRespawn();
    window.gameInstance?.camera.shake(5);
    document.getElementById('fade-curtain')?.classList.add('fade-in');
  }
}

window.CheckpointManager = CheckpointManager;

