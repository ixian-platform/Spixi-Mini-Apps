/**
 * Physics
 * Handles physics simulation, and collision detection
 * @author IXI Labs
 */

/**
 * Check AABB (axis-aligned bounding box) collision between two rectangles
 * @param {number} x1 - Box 1 X
 * @param {number} y1 - Box 1 Y
 * @param {number} w1 - Box 1 width
 * @param {number} h1 - Box 1 height
 * @param {number} x2 - Box 2 X
 * @param {number} y2 - Box 2 Y
 * @param {number} w2 - Box 2 width
 * @param {number} h2 - Box 2 height
 * @returns {boolean} True if boxes overlap
 */
function checkAABBCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return (x1 <= x2 + w2 && x1 + w1 >= x2) &&
               (y1 <= y2 + h2 && y1 + h1 >= y2);
}

/**
 * Check circular collision between two circles
 * @param {number} x1 - Circle 1 X
 * @param {number} y1 - Circle 1 Y
 * @param {number} r1 - Circle 1 radius
 * @param {number} x2 - Circle 2 X
 * @param {number} y2 - Circle 2 Y
 * @param {number} r2 - Circle 2 radius
 * @returns {boolean} True if circles collide
 */
function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distSquared = dx * dx + dy * dy;
    const minDist = r1 + r2;
    return distSquared < minDist * minDist;
}

/**
 * Separate two overlapping circles
 * Pushes circles apart to prevent overlap
 * @param {Object} obj1 - First object {x, y, radius}
 * @param {Object} obj2 - Second object {x, y, radius}
 * @returns {Object} Separation info {x1, y1, x2, y2}
 */
function separateCircles(obj1, obj2) {
    const dx = obj2.x - obj1.x;
    const dy = obj2.y - obj1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) {
        // Objects at same position, push randomly
        return separateCircles(obj1, { ...obj2, x: obj2.x + 0.1 });
    }
    
    const minDist = obj1.radius + obj2.radius;
    const overlap = minDist - dist;
    const pushX = (dx / dist) * overlap * 0.5;
    const pushY = (dy / dist) * overlap * 0.5;
    
    return {
        x1: obj1.x - pushX,
        y1: obj1.y - pushY,
        x2: obj2.x + pushX,
        y2: obj2.y + pushY
    };
}

// ============================================================================
// PHYSICS UPDATES
// ============================================================================

/**
 * Validate tank has valid coordinates
 * @param {Object} tank - Tank object to validate
 * @returns {boolean} True if valid
 */
function isValidTank(tank) {
    return tank && !isNaN(tank.x) && !isNaN(tank.y);
}

/**
 * Update all tank positions and apply gravity
 */
function updateTanks(deltaTime) {
    gameState.players.forEach((p, idx) => {
        if (!p?.alive || !p.tank) return;
        
        // Validate tank position
        if (!isValidTank(p.tank)) {
            console.error('Tank position invalid:', p.tank);
            resetTankToSafePosition(p.tank);
            return;
        }
        
        // Smooth interpolation for remote players
        if (!p.isLocal) {
            interpolateRemotePlayer(p.tank, deltaTime);
        }
        
        // Handle local player movement
        if (p.isLocal && gameState.currentTurnIndex === idx && gameState.gameStarted) {
            handleLocalPlayerMovement(p.tank, deltaTime);
        }
        
        // Apply gravity and collision to keep tank on terrain
        applyGravityToTank(p.tank, deltaTime);
    });
    
    // Check and resolve tank-to-tank collisions
    checkTankTankCollisions();
}

/**
 * Reset tank to a safe position if coordinates become invalid
 * @param {Object} tank - Tank object to reset
 */
function resetTankToSafePosition(tank) {
    const safeX = gameState.worldWidth / 2;
    const safeY = getTerrainHeightAtPoint(safeX) - TANK_HEIGHT;
    tank.x = safeX;
    tank.y = safeY;
    tank.targetX = safeX;
    tank.targetY = safeY;
    tank.smoothX = safeX;
    tank.smoothY = safeY;
}

/**
 * Smoothly interpolate remote player position to reduce network jitter
 * @param {Object} tank - Remote player's tank
 * @param {number} deltaTime - Time delta in seconds
 */
function interpolateRemotePlayer(tank, deltaTime) {
    const lerpSpeed = CAMERA_LERP_SPEED * PHYSICS_TICK_RATE * deltaTime;
    tank.smoothX += (tank.targetX - tank.smoothX) * lerpSpeed;
    tank.smoothY += (tank.targetY - tank.smoothY) * lerpSpeed;
    
    // Snap to target when close enough
    if (Math.abs(tank.smoothX - tank.targetX) < 0.5) {
        tank.smoothX = tank.targetX;
    }
    if (Math.abs(tank.smoothY - tank.targetY) < 0.5) {
        tank.smoothY = tank.targetY;
    }
    
    tank.x = tank.smoothX;
    tank.y = tank.smoothY;
}

/**
 * Handle keyboard and touch input for local player movement
 * @param {Object} tank - Local player's tank
 * @param {number} deltaTime - Time delta in seconds
 */
function handleLocalPlayerMovement(tank, deltaTime) {
    let moving = false;
    const scaledSpeed = TANK_MOVE_SPEED * deltaTime * PHYSICS_TICK_RATE;
    
    // Check for left movement
    if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A'] || 
        gameState.touchMoving === 'left') {
        tank.x -= scaledSpeed;
        tank.x = Math.max(0, tank.x);
        tank.facing = 'left';
        moving = true;
        
        // Check if movement caused terrain collision
        const collision = getTerrainCollisionResponse(tank.x, tank.y, TANK_WIDTH, TANK_HEIGHT);
        if (collision) {
            tank.y = collision.pushY;
        }
    }
    
    // Check for right movement
    if (gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D'] || 
        gameState.touchMoving === 'right') {
        tank.x += scaledSpeed;
        tank.x = Math.min(gameState.worldWidth - TANK_WIDTH, tank.x);
        tank.facing = 'right';
        moving = true;
        
        // Check if movement caused terrain collision
        const collision = getTerrainCollisionResponse(tank.x, tank.y, TANK_WIDTH, TANK_HEIGHT);
        if (collision) {
            tank.y = collision.pushY;
        }
    }
    
    // Handle movement state changes and sound
    if (moving) {
        if (!gameState.isMoving) {
            gameState.isMoving = true;
            startMovementSync();
        }
        
        const currentTime = Date.now();
        if (currentTime - gameState.lastMoveSound > MOVE_SOUND_INTERVAL) {
            soundManager.play('move');
            gameState.lastMoveSound = currentTime;
        }
    } else {
        if (gameState.isMoving) {
            gameState.isMoving = false;
            stopMovementSync();
        }
    }
}

/**
 * Apply gravity to tank and keep it on terrain surface
 * @param {Object} tank - Tank to update
 * @param {number} deltaTime - Time delta in seconds
 */
function applyGravityToTank(tank, deltaTime) {
    // Apply gravity
    tank.vy += GRAVITY * deltaTime * PHYSICS_TICK_RATE;
    tank.y += tank.vy * deltaTime * PHYSICS_TICK_RATE;
    
    // Check for terrain collision using AABB
    const collision = getTerrainCollisionResponse(tank.x, tank.y, TANK_WIDTH, TANK_HEIGHT);
    
    if (collision) {
        // Push tank out of terrain
        tank.y = collision.pushY;
        tank.vy = 0;
        tank.grounded = true;
    } else {
        tank.grounded = false;
    }
}

/**
 * Check and resolve collisions between tanks
 * Prevents tanks from overlapping each other
 */
function checkTankTankCollisions() {
    const aliveTanks = gameState.players
        .filter((p, i) => p?.alive && p.tank)
        .map((p, i, arr) => ({
            player: p,
            tank: p.tank,
            // Use proper collision radius from tank dimensions
            radius: Math.max(TANK_WIDTH, TANK_HEIGHT) / 2,
            index: gameState.players.indexOf(p)
        }));
    
    // Check all pairs
    for (let i = 0; i < aliveTanks.length; i++) {
        for (let j = i + 1; j < aliveTanks.length; j++) {
            const tank1 = aliveTanks[i];
            const tank2 = aliveTanks[j];
            
            if (checkCircleCollision(
                tank1.tank.x + TANK_WIDTH / 2, tank1.tank.y + TANK_HEIGHT / 2, tank1.radius,
                tank2.tank.x + TANK_WIDTH / 2, tank2.tank.y + TANK_HEIGHT / 2, tank2.radius
            )) {
                // Separate colliding tanks
                const separation = separateCircles(
                    { x: tank1.tank.x + TANK_WIDTH / 2, y: tank1.tank.y + TANK_HEIGHT / 2, radius: tank1.radius },
                    { x: tank2.tank.x + TANK_WIDTH / 2, y: tank2.tank.y + TANK_HEIGHT / 2, radius: tank2.radius }
                );
                
                tank1.tank.x = separation.x1 - TANK_WIDTH / 2;
                tank1.tank.y = separation.y1 - TANK_HEIGHT / 2;
                tank2.tank.x = separation.x2 - TANK_WIDTH / 2;
                tank2.tank.y = separation.y2 - TANK_HEIGHT / 2;
            }
        }
    }
}

/**
 * Update all projectiles in flight
 * @param {number} deltaTime - Time delta in seconds
 */
function updateProjectiles(deltaTime) {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        
        // Apply physics
        proj.vy += GRAVITY * deltaTime * PHYSICS_TICK_RATE;
        proj.vx += gameState.wind * WIND_EFFECT * deltaTime * PHYSICS_TICK_RATE;
        proj.x += proj.vx * deltaTime * PHYSICS_TICK_RATE;
        proj.y += proj.vy * deltaTime * PHYSICS_TICK_RATE;
        
        // Check for collision using circle detection
        let collision = checkCircleTerrainCollision(proj.x, proj.y, PROJECTILE_RADIUS);
        if (!collision) {
            gameState.players.forEach((player, idx) => {
                if (!player.alive || !player.tank) return;
                const collided = checkAABBCollision(
                    player.tank.x, player.tank.y, TANK_WIDTH, TANK_HEIGHT,
                    proj.x, proj.y, PROJECTILE_RADIUS * 2, PROJECTILE_RADIUS * 2
                );
                if (collided) {
                    collision = true;
                    return;
                }
            });
        }

        if (collision) {
            // Hit terrain
            createExplosion(proj.x, proj.y, proj.megaPower);
            checkDamage(proj.x, proj.y, proj.megaPower, proj.firedBy);
            gameState.projectiles.splice(i, 1);
            shakeScreen();
            
            // Handle turn end or rapid fire
            if (gameState.projectiles.length === 0) {
                handleProjectileEnd();
            }
        } 
        // Check for out of bounds
        else if (proj.x < 0 || proj.x > gameState.worldWidth || proj.y < -200) {
            gameState.projectiles.splice(i, 1);
            
            if (gameState.projectiles.length === 0) {
                setTimeout(endTurn, TURN_END_DELAY);
            }
        }
    }
}

/**
 * Handle end of projectile - either enable rapid fire or end turn
 */
function handleProjectileEnd() {
    const activePowerup = gameState.activePowerups.get(gameState.currentTurnIndex);

    if (activePowerup?.type === 'rapidfire') {
        const isMyTurn = gameState.currentTurnIndex === gameState.myPlayerIndex;
        if (isMyTurn) {
            setTimeout(() => {
                gameState.fired = 0;
            }, RAPID_FIRE_REENABLE_DELAY);
        }
    } else {
        setTimeout(endTurn, TURN_END_DELAY);
    }
}

/**
 * Update all active explosions
 * @param {number} deltaTime - Time delta in seconds
 */
function updateExplosions(deltaTime) {
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const exp = gameState.explosions[i];
        exp.radius += (exp.maxRadius / 10) * (deltaTime * PHYSICS_TICK_RATE);
        if (--exp.life <= 0) {
            gameState.explosions.splice(i, 1);
        }
    }
}

/**
 * Update all powerups - apply physics and check for collection
 * @param {number} deltaTime - Time delta in seconds
 */
function updatePowerups(deltaTime) {
    const currentTime = Date.now();
    
    // Update powerup physics and check for collection
    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
        const powerup = gameState.powerups[i];
        
        // Check if powerup has expired (60 seconds)
        if (powerup.spawnTime && (currentTime - powerup.spawnTime > 60000)) {
            gameState.powerups.splice(i, 1);
            continue;
        }
        
        // Apply gravity (powerups fall slower)
        powerup.vy += GRAVITY * POWERUP_GRAVITY_FACTOR * deltaTime;
        powerup.y += powerup.vy * deltaTime;
        
        // Animate rotation and pulse
        powerup.rotation += 0.05 * deltaTime * 60;
        powerup.pulsePhase += 0.1 * deltaTime * 60;
        
        // Land on terrain
        const terrainY = getTerrainHeightAtPoint(powerup.x);
        if (powerup.y >= terrainY - POWERUP_SIZE) {
            powerup.y = terrainY - POWERUP_SIZE;
            powerup.vy = 0;
        }
        
        // Check for collection by any player
        checkPowerupCollection(powerup, i);
    }
    
    // Remove expired active powerups
    removeExpiredPowerups();
}

/**
 * Check if any player has collected a powerup
 * Uses bounding box collision for more accurate detection
 * @param {Object} powerup - Powerup to check
 * @param {number} index - Array index of powerup
 */
function checkPowerupCollection(powerup, index) {
    gameState.players.forEach((player, idx) => {
        if (!player.alive || !player.tank) return;
        
        // Use AABB collision detection for better accuracy
        const powerupSize = POWERUP_SIZE;
        const collided = checkAABBCollision(
            player.tank.x, player.tank.y, TANK_WIDTH, TANK_HEIGHT,
            powerup.x - powerupSize / 2, powerup.y - powerupSize / 2, powerupSize, powerupSize
        );
        
        if (collided) {
            collectPowerup(idx, powerup);
            gameState.powerups.splice(index, 1);
        }
    });
}

/**
 * Remove powerups that have expired
 */
function removeExpiredPowerups() {
    gameState.activePowerups.forEach((powerup, playerIdx) => {
        if (Date.now() - powerup.startTime > POWERUP_DURATION) {
            gameState.activePowerups.delete(playerIdx);
            if (playerIdx === gameState.myPlayerIndex) {
                ui.gameStatus.textContent = 'Powerup expired!';
                setTimeout(updateTurnState, 1500);
            }
        }
    });
}

// ============================================================================
// EXPLOSIONS & DAMAGE
// ============================================================================

/**
 * Create an explosion at specified coordinates
 * @param {number} x - World x coordinate
 * @param {number} y - World y coordinate
 * @param {boolean} megaPower - Whether this is a mega power explosion
 */
function createExplosion(x, y, megaPower = false) {
    const explosionRadius = megaPower ? EXPLOSION_RADIUS * EXPLOSION_MEGA_MULTIPLIER : EXPLOSION_RADIUS;
    
    gameState.explosions.push({ 
        x, 
        y, 
        radius: 0, 
        maxRadius: explosionRadius, 
        life: 30, 
        megaPower 
    });
    
    soundManager.play('explosion');
    
    // Damage terrain within explosion radius
    // Loop through all terrain segments and check distance directly
    for (let i = 0; i < gameState.terrain.length - 1; i++) {
        const p1 = gameState.terrain[i];
        const p2 = gameState.terrain[i + 1];
        
        // Check distance from explosion center to terrain line segment
        const x1 = p1.x;
        const y1 = baseCanvasHeight - p1.height;
        const x2 = p2.x;
        const y2 = baseCanvasHeight - p2.height;
        
        // Find closest point on line segment to explosion
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;
        
        let t = 0;
        if (lengthSq > 0) {
            t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
        }
        
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        const dist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
        
        if (dist < explosionRadius) {
            // Damage proportional to proximity
            const damageAmount = (explosionRadius - dist) * 1.2;
            p1.height -= damageAmount;
            p1.height = Math.max(20, p1.height);
            if (i < gameState.terrain.length - 1) {
                p2.height -= damageAmount * 0.5;
                p2.height = Math.max(20, p2.height);
            }
        }
    }
}

/**
 * Check and apply damage to all players within damage radius
 * Only the attacker calculates and broadcasts damage (authoritative)
 * Other clients will receive hit messages and apply them
 * @param {number} x - Explosion x coordinate
 * @param {number} y - Explosion y coordinate
 * @param {boolean} megaPower - Whether explosion has mega power
 * @param {number} firedBy - Index of player who fired the projectile
 */
function checkDamage(x, y, megaPower = false, firedBy = null) {
    const explosionRadius = megaPower ? EXPLOSION_RADIUS * EXPLOSION_MEGA_MULTIPLIER : EXPLOSION_RADIUS;
    const damageRadius = explosionRadius * DAMAGE_RADIUS_MULTIPLIER;
    
    // Only the player who fired calculates and broadcasts damage (prevents conflicts)
    const isMyShot = (firedBy === gameState.myPlayerIndex);
    
    if (!isMyShot) {
        // Not my shot - damage will come via hit messages from attacker
        // But we still check for game over in case we missed a message
        checkGameOver();
        return;
    }

    // I fired this shot - calculate damage for all players and broadcast
    gameState.players.forEach((p, i) => {
        if (!p.alive) return;
        
        const dist = Math.sqrt((p.tank.x - x) ** 2 + (p.tank.y - y) ** 2);
        
        if (dist < damageRadius) {
            let damage = ((1 - dist / damageRadius) * DAMAGE_MULTIPLIER);
            
            // Apply shield reduction if player has shield
            const activePowerup = gameState.activePowerups.get(i);
            if (activePowerup?.type === 'shield') {
                damage *= SHIELD_DAMAGE_REDUCTION;
            }
            
            p.tank.health -= damage;
            
            // Broadcast damage to all players (even for myself, for consistency)
            broadcast({ 
                type: 'hit', 
                targetIndex: i, 
                newHealth: p.tank.health
            });
            
            // Check for death
            if (p.tank.health <= 0) {
                p.alive = false;
                updatePlayerInfo();
            }
        }
    });
    
    // Check for game over
    checkGameOver();
}

/**
 * Check if game is over and handle win/loss state
 */
function checkGameOver() {
    const alivePlayers = gameState.players.filter(p => p.alive);
    
    if (alivePlayers.length <= 1) {
        gameState.gameStarted = false;
        
        if (gameState.turnTimerInterval) {
            clearInterval(gameState.turnTimerInterval);
            gameState.turnTimerInterval = null;
        }
        
        const result = alivePlayers.length === 0 ? '💀 Draw!' : 
            (alivePlayers[0].isLocal ? '🏆 You won!' : '💀 You lost!');
        ui.gameStatus.textContent = result;
        
        setTimeout(() => {
            returnToLobby();
        }, 3000);
    }
}

/**
 * Create screen shake effect on explosion
 */
function shakeScreen() {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
}

// ============================================================================
// COLLISION DEBUG VISUALIZATION
// ============================================================================

/**
 * Draw collision debug information on canvas
 * Only renders if COLLISION_DEBUG_ENABLED is true
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
function drawCollisionDebug(ctx) {
    if (!COLLISION_DEBUG_ENABLED) return;
    
    ctx.save();
    
    // Draw terrain collision points
    if (COLLISION_DEBUG_TERRAIN && gameState.terrain) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < gameState.terrain.length - 1; i++) {
            const point1 = gameState.terrain[i];
            const point2 = gameState.terrain[i + 1];
            const y1 = baseCanvasHeight - point1.height;
            const y2 = baseCanvasHeight - point2.height;
            
            ctx.fillRect(point1.x - 2, y1 - 2, 4, 4);
            ctx.strokeRect(point1.x - 3, y1 - 3, 6, 6);
        }
    }
    
    // Draw tank collision boxes
    if (COLLISION_DEBUG_TANKS) {
        gameState.players.forEach((p, idx) => {
            if (!p?.alive || !p.tank) return;
            
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            
            // Draw bounding box
            ctx.strokeRect(p.tank.x, p.tank.y, TANK_WIDTH, TANK_HEIGHT);
            
            // Draw collision circle
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(
                p.tank.x + TANK_WIDTH / 2,
                p.tank.y + TANK_HEIGHT / 2,
                TANK_WIDTH / 2,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        });
    }
    
    // Draw projectile collision
    if (COLLISION_DEBUG_PROJECTILES) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.lineWidth = 1;
        
        gameState.projectiles.forEach(proj => {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, PROJECTILE_RADIUS + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    ctx.restore();
}
