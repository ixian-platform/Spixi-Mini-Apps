function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(gameState.zoom, gameState.zoom);
    ctx.translate(-gameState.cameraX, -gameState.cameraY);
    drawSkyAndStars();
    if (typeof WindSystem !== 'undefined' && WindSystem.initialized) { WindSystem.update(); WindSystem.draw(); }
    drawDestroyedTerrain();
    drawTerrain();
    drawPowerups();
    drawRobots();
    drawProjectiles();
    drawExplosions();
    drawCollisionDebug(ctx);
    ctx.restore();
    drawMessages();
}

function drawSkyAndStars() {
    const theme = getTheme();
    const skyGradient = ctx.createLinearGradient(0, 0, 0, baseCanvasHeight);
    theme.sky.gradient.forEach(stop => {
        skyGradient.addColorStop(stop.stop, stop.color);
    });
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, gameState.worldWidth, baseCanvasHeight);
    
    const starCount = Math.floor((gameState.worldWidth / baseCanvasWidth) * 100);
    for (let i = 0; i < starCount; i++) {
        const x = (i * 137.5) % gameState.worldWidth;
        const y = (i * 73.3) % (baseCanvasHeight * 0.7);
        const size = (i % 3) * 0.5 + 0.5;
        const brightness = 0.4 + (i % 5) * 0.15;
        ctx.fillStyle = interpolateColor(theme.sky.starColor, { brightness });
        ctx.shadowBlur = size * 2;
        ctx.shadowColor = interpolateColor(theme.sky.starColor, { brightness: 0.8 });
        ctx.fillRect(x, y, size, size);
    }
    ctx.shadowBlur = 0;
    
    const nebulaCount = Math.floor((gameState.worldWidth / baseCanvasWidth) * 5);
    for (let i = 0; i < nebulaCount; i++) {
        const x = (i * 271.3) % gameState.worldWidth;
        const y = (i * 157.7) % (baseCanvasHeight * 0.4);
        const nebulaGradient = ctx.createRadialGradient(x, y, 0, x, y, 100 + i * 20);
        nebulaGradient.addColorStop(0, interpolateColor(theme.sky.nebulaColor, { opacity: 0.1 + i * 0.02 }));
        nebulaGradient.addColorStop(0.5, interpolateColor(theme.sky.nebulaColor, { opacity: 0.05 + i * 0.01 }));
        nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebulaGradient;
        ctx.beginPath();
        ctx.arc(x, y, 100 + i * 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawDestroyedTerrain() {
    if (gameState.originalTerrain.length > 0 && gameState.gameStarted) {
        const theme = getTheme();
        ctx.globalAlpha = 0.15;
        const destroyedGradient = ctx.createLinearGradient(0, baseCanvasHeight - 250, 0, baseCanvasHeight);
        theme.terrain.destroyed.gradient.forEach(stop => {
            destroyedGradient.addColorStop(stop.stop, stop.color);
        });
        ctx.fillStyle = destroyedGradient;
        ctx.beginPath();
        ctx.moveTo(0, baseCanvasHeight);
        gameState.originalTerrain.forEach(point => {
            ctx.lineTo(point.x, baseCanvasHeight - point.height);
        });
        ctx.lineTo(gameState.worldWidth, baseCanvasHeight);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = theme.terrain.destroyed.outline;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.shadowBlur = 5;
        ctx.shadowColor = theme.terrain.destroyed.outlineGlow;
        ctx.beginPath();
        gameState.originalTerrain.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, baseCanvasHeight - point.height);
            else ctx.lineTo(point.x, baseCanvasHeight - point.height);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

function drawTerrain() {
    const theme = getTheme();
    const terrainGradient = ctx.createLinearGradient(0, baseCanvasHeight - 250, 0, baseCanvasHeight);
    theme.terrain.gradient.forEach(stop => {
        terrainGradient.addColorStop(stop.stop, stop.color);
    });
    ctx.fillStyle = terrainGradient;
    ctx.beginPath();
    ctx.moveTo(0, baseCanvasHeight);
    gameState.terrain.forEach(point => {
        ctx.lineTo(point.x, baseCanvasHeight - point.height);
    });
    ctx.lineTo(gameState.worldWidth, baseCanvasHeight);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = theme.terrain.outline;
    ctx.lineWidth = 1;
    for (let i = 0; i < gameState.terrain.length; i += 5) {
        const point = gameState.terrain[i];
        ctx.beginPath();
        ctx.moveTo(point.x, baseCanvasHeight - point.height);
        ctx.lineTo(point.x, baseCanvasHeight);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    ctx.strokeStyle = theme.terrain.outline;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = theme.terrain.outline;
    ctx.beginPath();
    gameState.terrain.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, baseCanvasHeight - point.height);
        else ctx.lineTo(point.x, baseCanvasHeight - point.height);
    });
    ctx.stroke();
    
    const outlineColor = theme.terrain.outline;
    const r = parseInt(outlineColor.slice(1, 3), 16);
    const g = parseInt(outlineColor.slice(3, 5), 16);
    const b = parseInt(outlineColor.slice(5, 7), 16);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    gameState.terrain.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, baseCanvasHeight - point.height);
        else ctx.lineTo(point.x, baseCanvasHeight - point.height);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawPowerups() {
    gameState.powerups.forEach(powerup => {
        const powerupType = POWERUP_TYPES.find(p => p.id === powerup.type);
        if (!powerupType) return;
        
        const pulse = 0.8 + Math.sin(powerup.pulsePhase) * 0.2;
        
        ctx.save();
        ctx.translate(powerup.x, powerup.y);
        ctx.rotate(powerup.rotation);
        
        const glowGradient = ctx.createRadialGradient(0, 0, POWERUP_SIZE * 0.5, 0, 0, POWERUP_SIZE * 1.5);
        glowGradient.addColorStop(0, powerupType.color + 'AA');
        glowGradient.addColorStop(0.5, powerupType.color + '44');
        glowGradient.addColorStop(1, powerupType.color + '00');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, POWERUP_SIZE * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        const boxGradient = ctx.createLinearGradient(-POWERUP_SIZE, -POWERUP_SIZE, POWERUP_SIZE, POWERUP_SIZE);
        boxGradient.addColorStop(0, powerupType.color);
        boxGradient.addColorStop(0.5, '#ffffff');
        boxGradient.addColorStop(1, powerupType.color);
        ctx.fillStyle = boxGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = powerupType.color;
        ctx.fillRect(-POWERUP_SIZE / 2, -POWERUP_SIZE / 2, POWERUP_SIZE, POWERUP_SIZE);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-POWERUP_SIZE / 2, -POWERUP_SIZE / 2, POWERUP_SIZE, POWERUP_SIZE);
        
        ctx.shadowBlur = 0;
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerupType.emoji, 0, 0);
        
        ctx.restore();
        
        for (let i = 0; i < 3; i++) {
            const angle = (powerup.rotation + i * Math.PI * 2 / 3) * 2;
            const dist = POWERUP_SIZE * 1.2;
            const px = powerup.x + Math.cos(angle) * dist;
            const py = powerup.y + Math.sin(angle) * dist;
            ctx.fillStyle = powerupType.color + '88';
            ctx.shadowBlur = 10;
            ctx.shadowColor = powerupType.color;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    });
}

function drawRobots() {
    gameState.players.forEach((p,idx) => {
        if (!p?.tank || !p.alive) return;
        const t = p.tank;
        if (!isValidTank(t)) return;
        const isActive = idx===gameState.currentTurnIndex;
        const isMoving = p.isLocal && isActive && (gameState.keys['ArrowLeft']||gameState.keys['a']||gameState.keys['A']||gameState.keys['ArrowRight']||gameState.keys['d']||gameState.keys['D']||gameState.touchMoving);
        const time = performance.now()/600;
        const hov = (isMoving||isActive) ? Math.sin(time)*3 : 0;
        const dy = t.y+hov;
        const rImg = robotImgs[idx%robotImgs.length];
        if (rImg.complete) ctx.drawImage(rImg,t.x,dy,TANK_WIDTH,TANK_HEIGHT);
        else { ctx.fillStyle=p.color; ctx.fillRect(t.x,dy,TANK_WIDTH,TANK_HEIGHT); }
        if (isActive) {
            drawActiveGlow(t.x,dy);
            drawFacingIndicator(t.x,dy,t.facing);
        }
        drawPowerupIndicator(t.x,dy,idx);
        drawBarrel(t.x,dy,t.angle,t.facing);
        if (isActive && gameState.isAiming && idx===gameState.myPlayerIndex) drawPowerIndicator(t.x,dy,t.angle,t.facing,t.power);
        drawHealthBar(t.x,dy,t.health);
    });
}
function drawActiveGlow(x,y) {
    const g = ctx.createRadialGradient(x+TANK_WIDTH/2,y+TANK_HEIGHT/2,0,x+TANK_WIDTH/2,y+TANK_HEIGHT/2,TANK_WIDTH*1.5);
    g.addColorStop(0,'rgba(0,255,255,0.4)'); g.addColorStop(0.5,'rgba(0,255,255,0.2)'); g.addColorStop(1,'rgba(0,255,255,0)');
    ctx.fillStyle=g;
    ctx.fillRect(x-TANK_WIDTH*0.5,y-TANK_HEIGHT*0.5,TANK_WIDTH*2,TANK_HEIGHT*2);
}
function drawFacingIndicator(x,y,facing) {
    const ay=y-25, sz=8, cx=x+TANK_WIDTH/2;
    ctx.save();
    ctx.fillStyle='rgba(0,255,255,0.7)'; ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=2; ctx.shadowBlur=10; ctx.shadowColor='#00ffff';
    ctx.beginPath();
    if (facing==='left') { ctx.moveTo(cx-sz,ay); ctx.lineTo(cx+sz,ay-sz); ctx.lineTo(cx+sz,ay+sz); }
    else { ctx.moveTo(cx+sz,ay); ctx.lineTo(cx-sz,ay-sz); ctx.lineTo(cx-sz,ay+sz); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0; ctx.restore();
}
function drawPowerupIndicator(x,y,idx) {
    const ap = gameState.activePowerups.get(idx);
    if (!ap) return;
    const pt = POWERUP_TYPES.find(p => p.id===ap.type);
    if (!pt) return;
    const pulse = Math.sin(Date.now()/200)*0.3+0.7;
    ctx.fillStyle=pt.color+'88'; ctx.shadowBlur=15*pulse; ctx.shadowColor=pt.color;
    ctx.beginPath(); ctx.arc(x+TANK_WIDTH/2,y-15,12,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.font='bold 16px Arial'; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(pt.emoji,x+TANK_WIDTH/2,y-15);
}
function getActualAngle(angle,facing) { return facing==='left' ? 180-angle : angle; }

function drawBarrel(x,y,angle,facing='right') {
    const aa = getActualAngle(angle,facing);
    const ar = (aa*Math.PI)/180;
    const bx = x+TANK_WIDTH/2, by = y+TANK_HEIGHT/2;
    const ex = bx+Math.cos(ar)*BARREL_LENGTH, ey = by-Math.sin(ar)*BARREL_LENGTH;
    const lg1 = ctx.createLinearGradient(bx,by,ex,ey);
    lg1.addColorStop(0,'rgba(255,0,255,0.3)'); lg1.addColorStop(1,'rgba(0,255,255,0.3)');
    ctx.strokeStyle=lg1; ctx.lineWidth=10; ctx.shadowBlur=20; ctx.shadowColor='#ff00ff';
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(ex,ey); ctx.stroke();
    const lg2 = ctx.createLinearGradient(bx,by,ex,ey);
    lg2.addColorStop(0,'rgba(255,0,255,0.9)'); lg2.addColorStop(0.5,'rgba(255,255,255,0.9)'); lg2.addColorStop(1,'rgba(0,255,255,0.9)');
    ctx.strokeStyle=lg2; ctx.lineWidth=5; ctx.shadowBlur=10; ctx.shadowColor='#00ffff';
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(ex,ey); ctx.stroke(); ctx.shadowBlur=0;
}
function drawPowerIndicator(x,y,angle,facing,power) {
    const aa = getActualAngle(angle,facing), ar = (aa*Math.PI)/180;
    const bx = x+TANK_WIDTH/2, by = y+TANK_HEIGHT/2;
    const pp = (power-10)/90, maxL = 30+pp*70, segs = 8;
    const cols = ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#4B0082','#9400D3','#FF00FF'];
    for (let i=0; i<segs; i++) {
        const sl = (maxL/segs)*(i+1), ex = bx+Math.cos(ar)*sl, ey = by-Math.sin(ar)*sl;
        ctx.strokeStyle=cols[i]; ctx.lineWidth=6-i*0.5; ctx.shadowBlur=15; ctx.shadowColor=cols[i]; ctx.globalAlpha=0.8-i*0.08;
        ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(ex,ey); ctx.stroke();
    }
    ctx.globalAlpha=1.0; ctx.shadowBlur=0;
}

function drawHealthBar(x,y,health) {
    const w=TANK_WIDTH, h=6, pct=Math.max(0,health/TANK_INITIAL_HEALTH);
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(x,y-15,w,h);
    const g = ctx.createLinearGradient(x,0,x+w*pct,0);
    if (pct>0.6) { g.addColorStop(0,'#00ff00'); g.addColorStop(1,'#88ff00'); }
    else if (pct>0.3) { g.addColorStop(0,'#ffaa00'); g.addColorStop(1,'#ff8800'); }
    else { g.addColorStop(0,'#ff0000'); g.addColorStop(1,'#cc0000'); }
    ctx.fillStyle=g; ctx.fillRect(x,y-15,w*pct,h);
    ctx.strokeStyle='#00ffff'; ctx.lineWidth=1; ctx.strokeRect(x,y-15,w,h);
}

function drawProjectiles() {
    const theme = getTheme();
    gameState.projectiles.forEach(p => {
        ctx.strokeStyle = interpolateColor(theme.projectile.trail, { 0: 0.6 });
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.projectile.trailGlow;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        theme.projectile.glow.forEach(stop => {
            g1.addColorStop(stop.stop, stop.color);
        });
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = theme.projectile.core;
        ctx.shadowBlur = 25;
        ctx.shadowColor = theme.projectile.trailGlow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        for (let i = 0; i < 3; i++) {
            const a = (Date.now() / 100 + i * Math.PI * 2 / 3) % (Math.PI * 2);
            const d = p.radius * 2;
            const sx = p.x + Math.cos(a) * d;
            const sy = p.y + Math.sin(a) * d;
            ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawExplosions() {
    const theme = getTheme();
    gameState.explosions.forEach(e => {
        if (!e || e.maxRadius <= 0 || e.radius <= 0) return;
        const prog = e.radius / e.maxRadius;
        const a = 1 - prog;
        
        ctx.strokeStyle = interpolateColor(theme.explosion.outline, { alpha: a * 0.8 });
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = theme.explosion.outlineGlow;
        ctx.beginPath();
        ctx.arc(e.x, e.y, Math.max(0.1, e.radius * 1.8), 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        const g1 = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * 1.5);
        theme.explosion.inner.forEach(stop => {
            g1.addColorStop(stop.stop, interpolateColor(stop.color, { alpha: a * 0.6 }));
        });
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, Math.max(0.1, e.radius * 1.5), 0, Math.PI * 2);
        ctx.fill();
        
        const g2 = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
        theme.explosion.middle.forEach(stop => {
            g2.addColorStop(stop.stop, interpolateColor(stop.color, { alpha: a }));
        });
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, Math.max(0.1, e.radius), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = interpolateColor(theme.explosion.outline, { alpha: a });
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.explosion.outlineGlow;
        ctx.beginPath();
        ctx.arc(e.x, e.y, Math.max(0.1, e.radius * 0.8), 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const d = Math.max(0, e.radius * 1.2 * prog);
            const px = e.x + Math.cos(ang) * d;
            const py = e.y + Math.sin(ang) * d;
            const ps = 3 * (1 - prog);
            ctx.fillStyle = interpolateColor(theme.explosion.spark, { alpha: a });
            ctx.shadowBlur = 8;
            ctx.shadowColor = theme.explosion.sparkGlow;
            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.1, ps), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        if (e.megaPower) {
            ctx.strokeStyle = `rgba(255, 0, 255, ${a * 0.7})`;
            ctx.lineWidth = 5;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#f0f';
            ctx.beginPath();
            ctx.arc(e.x, e.y, Math.max(0.1, e.radius * 1.2), 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(0, 255, 255, ${a * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(e.x, e.y, Math.max(0.1, e.radius * 2), 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

function drawMessages() {
    gameState.messages.forEach(m => {
        const isMe = m.address===gameState.myAddress;
        const p = gameState.players.find(p => p?.tank && gameState.addressToPlayerIndex.get(m.address)===gameState.players.indexOf(p));
        const name = isMe ? 'You' : (m.address ? m.address.substring(0,6)+'...' : 'Player');
        const col = p?.color || (isMe ? '#00ffff' : '#9be8ff');
        ctx.globalAlpha = m.alpha;
        ctx.font='bold 14px Arial'; const nw = ctx.measureText(name).width; ctx.font='16px Arial'; const tw = ctx.measureText(m.text).width;
        const bw = Math.max(nw,tw)+20, x = (canvas.width-bw)/2;
        ctx.fillStyle='rgba(26,26,46,0.9)'; ctx.strokeStyle=col; ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(x,m.y,bw,50,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='bold 14px Arial'; ctx.fillText(name,x+10,m.y+20);
        ctx.fillStyle='#fff'; ctx.font='16px Arial'; ctx.fillText(m.text,x+10,m.y+42,250);
        ctx.globalAlpha=1;
    });
}

/**
 * Wind particle system
 * - Renders many small IXI-logo particles on the game canvas
 * - Uses an offscreen cached logo canvas and a simple particle pool
 * - Particles move according to `gameState.wind` and wrap around world bounds
 */
const WindSystem = {
    particles: [],
    logoCanvas: null,
    initialized: false,
    lastUpdate: 0,
    particleCount: 0,
    maxSize: 18,
    minSize: 8,
    density: 0.0005, // base particles per screen pixel (tune for performance)
    minDensity: 0.00008,
    maxDensity: 0.0008,
    adaptive: true,
    frameSamples: [],
    lastAdjustTime: 0,
    adjustInterval: 1000, // ms

    init() {
        if (this.initialized) return;
        this.createLogoCanvas();
        this.baseDensity = this.density;
        this.lastUpdate = performance.now();
        // If on a touch/mobile device, start with a lower density
        const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (isMobile) this.density = Math.max(this.minDensity, this.density * 0.35);
        this.resize();
        this.initialized = true;
        // Recompute on resize
        window.addEventListener('resize', () => this.resize());
    },

    createLogoCanvas() {
        // Create an offscreen canvas for the cached logo
        const size = 24; // base offscreen logo size
        const off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        const cx = off.getContext('2d');

        // Fallback: draw a compact IXI text logo initially
        cx.clearRect(0, 0, size, size);
        cx.fillStyle = '#00ffff';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.font = 'bold 12px Arial';
        cx.fillText('IXI', size / 2, size / 2 + 1);
        cx.lineWidth = 1.5;
        cx.strokeStyle = 'rgba(0,0,0,0.25)';
        cx.strokeText('IXI', size / 2, size / 2 + 1);

        this.logoCanvas = off;

        // Try to rasterize the SVG logo into the offscreen canvas for higher fidelity
        try {
            const img = new Image();
            img.onload = () => {
                // Draw the loaded SVG into the offscreen canvas scaled to size
                cx.clearRect(0, 0, off.width, off.height);
                // maintain aspect ratio and center
                cx.drawImage(img, 0, 0, off.width, off.height);
                this.logoCanvas = off;
            };
            img.onerror = () => {
                // keep text fallback if SVG fails to load
                console.warn('WindSystem: failed to load svg logo, using text fallback');
            };
            img.src = 'img/ixi-logo.svg';
            this.logoImage = img;
        } catch (e) {
            console.warn('WindSystem: svg rasterize failed', e);
        }
    },

    resize() {
        if (this.density == 0) return;

        // Determine ideal particle count by screen area
        const area = baseCanvasWidth * baseCanvasHeight;
        const desired = Math.floor(area * this.density);
        this.particleCount = Math.min(1500, desired);

        // If existing pool is larger, trim; else create new particles
        if (this.particles.length > this.particleCount) {
            this.particles.length = this.particleCount;
        } else {
            for (let i = this.particles.length; i < this.particleCount; i++) {
                this.particles.push(this.createParticle(true));
            }
        }
    },

    createParticle(randomizeY) {
        const worldW = gameState.worldWidth || baseCanvasWidth;
        const x = Math.random() * worldW;
        const y = (randomizeY ? Math.random() : 0.5) * baseCanvasHeight * 0.45; // keep in top area
        const size = this.minSize + Math.random() * (this.maxSize - this.minSize);
        return {
            x,
            y,
            size,
            speed: 0.6 + Math.random() * 1.4, // base multiplier
            verticalDrift: -0.1 + Math.random() * 0.2,
            alpha: 0.6 + Math.random() * 0.4
        };
    },

    update() {
        if (this.density == 0) return;

        const now = performance.now();
        const dt = Math.min(50, now - this.lastUpdate) / 16.6667; // ~frames
        this.lastUpdate = now;

        // Track frame time samples for adaptive LOD
        if (this.adaptive) {
            this.frameSamples.push(now);
            // keep only recent samples
            while (this.frameSamples.length > 60) this.frameSamples.shift();
        }

        const wind = gameState.wind || 0;
        const worldW = gameState.worldWidth || baseCanvasWidth;
        const worldH = baseCanvasHeight;

        // Slightly vary movement per particle and move according to wind
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            // Move horizontally with wind; scale by particle speed and dt
            // Increased multiplier so movement is visually noticeable
            p.x += wind * 3.5 * p.speed * dt;
            // Vertical drift for natural look
            p.y += p.verticalDrift * p.speed * dt;

            // Slight random wobble
            p.x += (Math.sin((now + i * 997) / 1200) * 0.2) * dt;

            // Wrap horizontally across world
            if (p.x < -50) p.x += worldW + 100;
            if (p.x > worldW + 50) p.x -= worldW + 100;

            // Keep particles within a band at top (re-seed if drifted too low/high)
            if (p.y < 10 || p.y > worldH * 0.6) {
                p.y = Math.random() * worldH * 0.45;
                p.x = Math.random() * worldW;
            }
        }

        // Adaptive density adjustment (once per adjustInterval)
        if (this.adaptive && now - this.lastAdjustTime > this.adjustInterval) {
            this.lastAdjustTime = now;
            if (this.frameSamples.length >= 2) {
                // compute average frame interval (ms)
                let diffs = 0;
                for (let i = 1; i < this.frameSamples.length; i++) diffs += (this.frameSamples[i] - this.frameSamples[i-1]);
                const avgMs = diffs / (this.frameSamples.length - 1);

                // If ms per frame is high (low FPS), reduce density; otherwise gently increase toward base
                const targetDensity = (baseCanvasWidth * baseCanvasHeight) ? this.density : this.density;
                let newDensity = this.density;
                if (avgMs > 30) {
                    // <33 FPS: reduce aggressively
                    newDensity = Math.max(this.minDensity, this.density * 0.5);
                } else if (avgMs > 22) {
                    // 30-45 FPS: moderate reduction
                    newDensity = Math.max(this.minDensity, this.density * 0.75);
                } else if (avgMs < 18) {
                    // Good FPS: allow increase toward maxDensity slowly
                    newDensity = Math.min(this.maxDensity, this.density * 1.05);
                }

                // If density changed, apply and resize pool
                if (Math.abs(newDensity - this.density) / Math.max(1e-6, this.density) > 0.05) {
                    this.density = newDensity;
                    this.resize();
                }
            }
        }
    },

    /**
     * Set graphics quality for wind particles
     * low: no particles, med: reduced density, high: base density
     */
    setQuality(q) {
        const qualityMap = {
            'low': 0,
            'med': this.baseDensity * 0.4,
            'high': this.baseDensity * 1.0
        };
        this.density = qualityMap[q] ?? this.baseDensity;
        this.resize();
    },

    draw() {        
        if (this.density == 0) return;

        if (!this.logoCanvas) return;
        // compute wind angle for orientation
        const wind = gameState.wind || 0;
        const angle = wind === 0 ? 0 : (wind > 0 ? 0 : Math.PI);

        // Use faster composite and no shadows
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const size = Math.max(2, p.size * (0.6 + Math.abs(gameState.wind) * 0.3));

            // Draw rotated logo (cheap: small canvas + no expensive styles)
            ctx.save();
            ctx.translate(p.x, p.y);
            if (angle !== 0) ctx.rotate(angle);
            ctx.globalAlpha = p.alpha * (0.6 + Math.min(1, Math.abs(gameState.wind)) * 0.5);
            ctx.drawImage(this.logoCanvas, -size / 2, -size / 2, size, size);
            ctx.restore();
        }

        ctx.restore();
    }
};
