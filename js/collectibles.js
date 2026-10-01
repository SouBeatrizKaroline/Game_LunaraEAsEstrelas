/**
 * Lunara: As Estrelas Perdidas
 * Collectibles Manager
 */
class StarCollectible {
  constructor(id, x, y, isSecret = false, hint = '') {
    this.id = id;
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
    this.isSecret = isSecret;
    this.hint = hint;

    this.collected = false;
    this.isFlyingToPlayer = false;
    this.flyTimer = 0;

    this.radius = isSecret ? 16 : 14;
    this.phase = Math.random() * Math.PI * 2;
    this.spin = Math.random() * Math.PI;
    this.spinSpeed = 1.6;

    this.glowColor = isSecret ? 'rgba(211, 143, 255, 0.45)' : 'rgba(255, 209, 92, 0.45)';
    this.coreColor = isSecret ? '#f2caff' : '#fff3a8';
  }

  update(dt, player, particles, sound, onCollectCallback) {
    if (this.collected) return;
    this.phase += window.gameSettings?.reduceMotion ? 0 : dt * 3.0;

    if (this.isFlyingToPlayer) {
      this.flyTimer += dt;
      this.spinSpeed = 16.0;
      this.spin += window.gameSettings?.reduceMotion ? 0 : dt * this.spinSpeed;

      const targetX = player.x + player.width * 0.5;
      const targetY = player.y + 20;

      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.max(.001, Math.hypot(dx, dy));

      const speed = 750 * (0.3 + this.flyTimer * 2.5);
      this.x += (dx / dist) * Math.min(dist, speed * dt);
      this.y += (dy / dist) * Math.min(dist, speed * dt);

      if (!window.gameSettings?.reduceMotion && Math.random() < (window.gameSettings?.particles === 'low' ? .05 : .25)) {
        particles.particles.push({
          x: this.x,
          y: this.y,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          gravity: 0,
          friction: 0.9,
          size: 2,
          color: this.isSecret ? '#d38fff' : '#ffd15c',
          life: 0.25,
          maxLife: 0.25,
          type: 'sparkle'
        });
      }

      if (dist < 26 || this.flyTimer > 0.45) {
        this.collected = true;
        this.isFlyingToPlayer = false;
        particles.spawnStarBurst(targetX, targetY, this.isSecret);
        sound.playCollect(this.isSecret);
        player.pulsePendantOnCollect();
        if (onCollectCallback) onCollectCallback(this);
      }
      return;
    }

    this.y = this.baseY + Math.sin(this.phase) * 6;
    this.spin += window.gameSettings?.reduceMotion ? 0 : dt * this.spinSpeed;

    const px = player.x + player.width * 0.5;
    const py = player.y + player.height * 0.5;
    const dist = Math.hypot(px - this.x, py - this.y);

    if (dist < 42) {
      this.isFlyingToPlayer = true;
      this.flyTimer = 0;
    }
  }

  render(ctx, camera) {
    if (this.collected) return;
    if (
      this.x + 50 < camera.x ||
      this.x - 50 > camera.x + camera.viewportWidth ||
      this.y + 50 < camera.y ||
      this.y - 50 > camera.y + camera.viewportHeight
    ) {
      return;
    }

    const highContrast = window.gameSettings && window.gameSettings.highContrast;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (highContrast) {
      ctx.strokeStyle = this.isSecret ? '#ff00ea' : '#ffff00';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 2.2 + Math.sin(this.phase * 2) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    const pulse = 1.0 + Math.sin(this.phase) * 0.18;
    const haloRadius = this.radius * 3.2 * pulse;
    const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
    haloGrad.addColorStop(0, this.isSecret ? 'rgba(211, 143, 255, 0.7)' : 'rgba(255, 224, 102, 0.7)');
    haloGrad.addColorStop(0.5, this.isSecret ? 'rgba(164, 88, 240, 0.25)' : 'rgba(255, 185, 45, 0.25)');
    haloGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(this.spin);

    if (!this.isSecret) {
      ctx.fillStyle = this.coreColor;
      this.drawStar(ctx, 0, 0, 5, this.radius * 1.25, this.radius * 0.55);
      ctx.fill();

      ctx.strokeStyle = '#f5aa1b';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = this.coreColor;
      this.drawStar(ctx, 0, 0, 8, this.radius * 1.35, this.radius * 0.45);
      ctx.fill();

      ctx.strokeStyle = '#b64bf7';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
}

class CollectiblesManager {
  constructor() {
    this.stars = [];
    this.mainCollected = 0;
    this.secretsCollected = 0;
  }

  init(starDefinitions) {
    this.stars = starDefinitions.map(def => new StarCollectible(
      def.id,
      def.x,
      def.y,
      def.isSecret,
      def.hint || ''
    ));
    this.mainCollected = 0;
    this.secretsCollected = 0;
  }

  update(dt, player, particles, sound, onProgressUpdate) {
    for (const star of this.stars) {
      star.update(dt, player, particles, sound, (collectedStar) => {
        if (collectedStar.isSecret) {
          this.secretsCollected++;
        } else {
          this.mainCollected++;
        }
        if (onProgressUpdate) {
          onProgressUpdate(this.mainCollected, this.secretsCollected);
        }
      });
    }
  }

  render(ctx, camera) {
    for (const star of this.stars) {
      star.render(ctx, camera);
    }
  }

  getForestProgressRatio() {
    return Math.min(1.0, this.mainCollected / CONFIG.TOTAL_MAIN_STARS);
  }
}

window.CollectiblesManager = CollectiblesManager;

