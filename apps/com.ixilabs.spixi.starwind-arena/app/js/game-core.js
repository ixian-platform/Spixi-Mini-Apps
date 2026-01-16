SpixiAppSdk.onInit = async function(sessionId, myAddress) {
    if (gameState.initialized) return;
    gameState.initialized = true;

    gameState.sessionId = sessionId;
    gameState.myAddress = myAddress;
    broadcast({type: 'requestState'});
    await soundManager.init();
    initUI();
    startGameLoop();
    ui.gameStatus.textContent = 'Waiting in lobby...';
    if ('ontouchstart' in window || navigator.maxTouchPoints>0) ui.touchControls?.classList.remove('hidden');
    broadcast({type:'lobbyJoin'});
    setInterval(() => gameState.inLobby && broadcast({type:'lobbyJoin'}), LOBBY_BROADCAST_INTERVAL);
    setInterval(() => {
        if (gameState.gameStarted && !gameState.isMoving) {
            const p = gameState.players[gameState.myPlayerIndex];
            p?.tank && broadcast({type:'tankSync',tank:{x:p.tank.x,y:p.tank.y}});
        }
    }, POSITION_SYNC_INTERVAL);
    gameState.pingInterval = setInterval(() => {
        if (gameState.gameStarted) {
            broadcast({type:'ping',timestamp:Date.now()});
        } else {
            broadcast({type: 'requestState'});
        }
        checkConnectionStatus();
    }, PING_INTERVAL);
};
SpixiAppSdk.onNetworkData = function(senderAddress, raw) {
    try { handleNetworkMessage(senderAddress, JSON.parse(raw)); } catch(e) {}
};
window.onload = SpixiAppSdk.fireOnLoad;

function startGameAsHost() {
    if (!gameState.inLobby) return;
    if (gameState.connectedPlayers.size == 0) return;
    gameState.isHost = true;
    gameState.inLobby = false;
    generateTerrain();
    gameState.wind = (Math.random()-0.5)*2;
    gameState.nextWind = gameState.wind;
    gameState.myPlayerIndex = 0;
    const n = gameState.connectedPlayers.size+1;
    const pos = generatePlayerPositions(n);
    const sorted = Array.from(gameState.connectedPlayers).sort();
    const addrMap = {[gameState.myAddress]:0};
    gameState.addressToPlayerIndex.set(gameState.myAddress,0);
    sorted.forEach((a,i) => { const idx=i+1; addrMap[a]=idx; gameState.addressToPlayerIndex.set(a,idx); });
    gameState.players = [createPlayer(pos[0],0,true)];
    sorted.forEach((a,i) => gameState.players.push(createPlayer(pos[i+1],i+1,false)));
    const hMap = {};
    gameState.players.forEach((p,i) => {
        const addr = [...gameState.addressToPlayerIndex.entries()].find(([,pIdx]) => pIdx===i)?.[0];
        if (addr) hMap[addr] = p.tank.health;
    });
    broadcast({
        type: 'gameStart',
        gameId: gameState.gameId,
        terrain: gameState.terrain,
        positions: pos,
        addressMapping: addrMap,
        wind: gameState.wind,
        nextWind: gameState.nextWind,
        worldWidth: gameState.worldWidth,
        playerHealthMap: hMap
    });
    ui.gameStatus.textContent = 'Game starting...';
    const sb = document.getElementById('startBtn');
    if (sb) sb.style.display='none';
    setTimeout(() => {
        startGame();
        updateWindDisplay();
        const mc = document.getElementById('mapSizeContainer');
        if (mc) mc.style.display='none';
    }, 1000);
}

function generatePlayerPositions(n) {
    const pos = [];
    const minDist = gameState.worldWidth * SPAWN_MIN_DISTANCE;
    for (let i=0; i<n; i++) {
        let x,y,attempts=0,valid=false;
        do {
            x = SPAWN_EDGE_MARGIN + Math.random()*(gameState.worldWidth-2*SPAWN_EDGE_MARGIN);
            const h = gameState.terrain.length>0 ? gameState.terrain[Math.floor((x/gameState.worldWidth)*gameState.terrain.length)].height : TERRAIN_HEIGHT;
            if (h<SPAWN_MIN_TERRAIN_HEIGHT || h>SPAWN_MAX_TERRAIN_HEIGHT) { attempts++; continue; }
            y = getTerrainHeight(x) - TANK_HEIGHT;
            valid = pos.every(p => Math.abs(p.x-x)>=minDist);
            attempts++;
        } while (!valid && attempts<SPAWN_MAX_ATTEMPTS);
        pos.push({x,y});
    }
    return pos;
}

function createPlayer(pos, idx, isLocal=false) {
    let addr = null;
    if (isLocal) {
        addr = gameState.myAddress;
    } else
    {
        for (const [a, i] of gameState.addressToPlayerIndex.entries())
        {
            if (i === idx) { addr=a; break; }
        }
    }
    const h = TANK_INITIAL_HEALTH;
    return {
        tank: {x:pos.x,y:pos.y,health:h,angle:DEFAULT_ANGLE,power:DEFAULT_POWER,vy:0,grounded:true,targetX:pos.x,targetY:pos.y,smoothX:pos.x,smoothY:pos.y,facing:'right'},
        color: PLAYER_COLORS[idx%PLAYER_COLORS.length],
        alive: h>0,
        isLocal: isLocal,
        address: addr
    };
}

function startGame() {
    if (gameState.gameStarted) return;
    const alive = gameState.players.filter(p => p.alive);
    if (alive.length<2) return;
    gameState.gameId = Date.now() + Math.random();
    gameState.gameStarted = true;
    gameState.currentTurnIndex = 0;
    gameState.fired = 0;
    gameState.turnTimeLeft = TURN_TIME;
    updateWindDisplay();
    updateTurnState();
    soundManager.play('gameStart');
    const mc = document.getElementById('mapSizeContainer');
    if (mc) mc.style.display='none';
    if (gameState.turnTimerInterval) clearInterval(gameState.turnTimerInterval);
    gameState.turnTimerInterval = setInterval(updateTurnTimer, 1000);
    startPowerupSpawning();
}
function updateTurnState() {
    if (!gameState.gameStarted) { return; }
    const cur = gameState.players[gameState.currentTurnIndex];
    const my = gameState.currentTurnIndex === gameState.myPlayerIndex && cur?.alive;
    ui.gameStatus.textContent = my ? 'YOUR TURN!' : `Opponent's Turn`;
    gameState.wind = gameState.nextWind;
    updateWindDisplay();
    updatePlayerInfo();
    if (my) soundManager.play('turnStart');
}
function updateTurnTimer() {
    // Don't update timer while connection is frozen
    if (!gameState.gameStarted || gameState.connectionFrozen || gameState.projectiles.length>0) return;
    gameState.turnTimeLeft--;
    ui.turnTimer.textContent = gameState.turnTimeLeft;
    ui.turnTimer.classList.toggle('warning', gameState.turnTimeLeft<=10);
    if (gameState.turnTimeLeft<=0) {
        const cur = gameState.players[gameState.currentTurnIndex];
        if (gameState.currentTurnIndex === gameState.myPlayerIndex && cur?.isLocal && cur?.alive) fireMissile();
        gameState.turnTimeLeft = TURN_TIME;
    }
}
function endTurn() {
    if (gameState.projectiles.length>0 || !gameState.gameStarted) return;
    let next = gameState.currentTurnIndex, attempts=0, max=gameState.players.length;
    do {
        next = (next+1)%gameState.players.length;
        attempts++;
        if (attempts >= max) {
            const alive = gameState.players.filter(p => p.alive);
            if (alive.length <= 1) { gameState.gameStarted=false; returnToLobby(); }
            return;
        }
    } while (!gameState.players[next]?.alive);
    gameState.currentTurnIndex = next;
    gameState.fired = 0;
    gameState.turnTimeLeft = TURN_TIME;
    updateTurnState();
    updateWindDisplay();
}

function fireMissile() {
    if (!gameState.gameStarted
        || gameState.currentTurnIndex !== gameState.myPlayerIndex
        || gameState.projectiles.length > 0
        || gameState.fired > 0) return;

    const my = gameState.players[gameState.myPlayerIndex];
    if (!my?.alive || !my?.tank) return;
    
    gameState.fired++;

    // Update wind for next round
    gameState.nextWind = (Math.random()-0.5)*2;
    
    const t = my.tank;
    const aa = t.facing==='left' ? 180-t.angle : t.angle;
    const a = (aa*Math.PI) / 180;
    const p = t.power / 3;
    const ap = gameState.activePowerups.get(gameState.myPlayerIndex);
    const sc = ap?.type==='multishot' ? 3 : 1;
    const spread = 10 * Math.PI / 180;
    for (let i=0; i<sc; i++) {
        const sa = a + (i-Math.floor(sc/2))*spread;
        
        const perp = sa + Math.PI/2;

        const proj = {
            x: t.x + (TANK_WIDTH / 2) + Math.cos(sa) * BARREL_LENGTH,
            y: t.y + (TANK_HEIGHT / 2) - Math.sin(sa) * BARREL_LENGTH - Math.sin(perp) * BARREL_WIDTH,
            vx: Math.cos(sa)*p,
            vy: -Math.sin(sa)*p,
            radius: 5,
            firedBy: gameState.myPlayerIndex,
            megaPower: ap?.type==='megapower'
        };
        gameState.projectiles.push(proj);
        broadcast({
            type: 'fire',
            playerIndex: gameState.myPlayerIndex,
            power: t.power,
            x: proj.x,
            y: proj.y,
            vx: proj.vx,
            vy: proj.vy,
            megaPower: proj.megaPower,
            nextWind: gameState.nextWind
        });
    }
    soundManager.play('fire');
}

function startPowerupSpawning() {
    if (gameState.powerupSpawnTimer) clearInterval(gameState.powerupSpawnTimer);
    // Start powerup spawning after initial delay
    gameState.powerupSpawnTimer = setInterval(() => {
        if (gameState.gameStarted && gameState.isHost) {
            spawnPowerup();
        }
    }, POWERUP_SPAWN_INTERVAL);
}

function spawnPowerup() {
    if (!gameState.isHost || !gameState.gameStarted) return;
    if (!gameState.terrain || gameState.terrain.length < 2 || gameState.worldWidth <= 0) return;
    
    const t = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
    if (!t) return;
    
    const x = Math.max(100, Math.min(gameState.worldWidth - 100, Math.random()*(gameState.worldWidth-200)+100));
    const terrainY = getTerrainHeightAtPoint(x);
    const y = Math.max(0, terrainY - POWERUP_SIZE - 50);
    
    const p = {
        id: Date.now() + Math.random(),
        type: t.id,
        x: x,
        y: y,
        vy: 0,
        rotation: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        spawnTime: Date.now()
    };
    
    gameState.powerups.push(p);
    broadcast({type: 'powerupSpawn', powerup: p});
}
function collectPowerup(idx, p) {
    const pt = POWERUP_TYPES.find(t => t.id===p.type);
    if (!pt) return;
    soundManager.play('turnStart');
    if (p.type==='health') {
        const pl = gameState.players[idx];
        if (pl?.tank) { pl.tank.health=Math.min(TANK_INITIAL_HEALTH,pl.tank.health+HEALTH_POWERUP_AMOUNT); updatePlayerInfo(); }
    } else if (p.type==='teleport') {
        const pl = gameState.players[idx];
        if (pl?.tank) { const nx=Math.random()*(gameState.worldWidth-200)+100; pl.tank.x=nx; pl.tank.y=getTerrainHeight(nx)-TANK_HEIGHT; }
    } else {
        gameState.activePowerups.set(idx, {type:p.type,startTime:Date.now()});
    }
    if (idx===gameState.myPlayerIndex) {
        ui.gameStatus.textContent = `⭐ ${pt.name} collected!`;
        setTimeout(updateTurnState, 2000);
    }
    broadcast({type:'powerupCollect',powerupId:p.id,playerIdx:idx,powerupType:p.type});
}

function returnToLobby() { 
    gameState.inLobby = true;
    gameState.gameStarted = false;
    gameState.isHost = false;
    gameState.players = [];
    gameState.addressToPlayerIndex.clear();
    gameState.projectiles = [];
    gameState.explosions = [];
    gameState.powerups = [];
    gameState.activePowerups.clear();
    gameState.messages = [];
    gameState.currentTurnIndex = 0;
    gameState.fired = 0;
    gameState.wind = 0;
    gameState.zoom = 1;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    [gameState.turnTimerInterval,gameState.powerupSpawnTimer].forEach(i => { if(i) clearInterval(i); });
    gameState.turnTimerInterval = null;
    gameState.powerupSpawnTimer = null;
    gameState.connectionFrozen = false;
    gameState.lastSeenTime.clear();
    gameState.connectedPlayers.clear();
    gameState.disconnectedPlayers.clear();
    ui.gameStatus.textContent = 'Waiting in lobby...';
    ui.gameStatus.style.color = '#00ffff';
    ui.windIndicator.style.display = 'none';
    document.getElementById('startBtn').style.display = 'inline-block';
    const mc = document.getElementById('mapSizeContainer');
    if (mc) mc.style.display='flex';
    broadcast({type:'lobbyJoin'});
    updateLobbyStatus();
}

function checkConnectionStatus() {
    if (!gameState.gameStarted || gameState.players.length <= 1) return;
    
    const now = Date.now();
    let anyDC = false;
    const disconnectedAddresses = [];
    
    // Check for new disconnections
    for (const [addr, idx] of gameState.addressToPlayerIndex.entries()) {
        if (addr === gameState.myAddress) continue;
        
        const last = gameState.lastSeenTime.get(addr) || 0;
        const timeSinceLastSeen = now - last;
        
        // If haven't seen this player recently, mark as disconnected
        if (timeSinceLastSeen > DISCONNECTION_TIMEOUT) {
            if (!gameState.disconnectedPlayers.has(addr)) {
                gameState.disconnectedPlayers.set(addr, now);
                console.warn(`Player ${addr} disconnected at ${new Date(now).toISOString()}`);
            }
            disconnectedAddresses.push(addr);
            anyDC = true;
        } else if (gameState.disconnectedPlayers.has(addr)) {
            // Player has reconnected!
            gameState.disconnectedPlayers.delete(addr);
            console.log(`Player ${addr} reconnected at ${new Date(now).toISOString()}`);
        }
    }
    
    // Check if disconnected players have exceeded reconnection timeout
    for (const [addr, dcTime] of gameState.disconnectedPlayers.entries()) {
        if (now - dcTime > RECONNECT_TIMEOUT) {
            console.log(`Player ${addr} exceeded reconnection timeout - ending game`);
            returnToLobby();
            ui.gameStatus.textContent = '⚠️ Opponent did not reconnect - Game ended';
            ui.gameStatus.style.color = '#ff3366';
            return;
        }
    }
    
    // Update frozen state
    if (anyDC && !gameState.connectionFrozen) {
        freezeGame();
    } else if (!anyDC && gameState.connectionFrozen) {
        unfreezeGame();
    }
}

function freezeGame() {
    gameState.connectionFrozen = true;
    if (gameState.turnTimerInterval) { 
        clearInterval(gameState.turnTimerInterval); 
        gameState.turnTimerInterval = null; 
    }
    ui.gameStatus.textContent = '⚠️ Connection lost - Game paused';
    ui.gameStatus.style.color = '#ff3366';
}

function unfreezeGame() {
    gameState.connectionFrozen = false;
    if (gameState.gameStarted) {
        // Always ensure turn timer is running when unfreezing
        if (gameState.turnTimerInterval) {
            clearInterval(gameState.turnTimerInterval);
        }
        gameState.turnTimerInterval = setInterval(updateTurnTimer, 1000);
        updateTurnState();
    }
}

function updatePowerAnimation() {
    // Update power animation while aiming, independent of mouse/touch movement
    if (gameState.isAiming) {
        const myPlayer = gameState.players[gameState.myPlayerIndex];
        if (myPlayer?.tank) {
            const holdDuration = Date.now() - gameState.aimStartTime;
            // Oscillate power from 10 to 100 and back to 0, repeating every 2.5 seconds (2500ms)
            // First 1.25 seconds: 10 to 100, Second 1.25 seconds: 100 to 0
            const cycle = holdDuration % 2500;
            let power;
            if (cycle < 1250) {
                // Ascending: 10 to 100
                power = 10 + (cycle / 1250) * 90;
            } else {
                // Descending: 100 to 0
                power = 100 - ((cycle - 1250) / 1250) * 100;
            }
            const roundedPower = Math.round(power);
            // Only update UI if power changed to prevent excessive reflows
            if (myPlayer.tank.power !== roundedPower) {
                myPlayer.tank.power = roundedPower;
            }
        }
    }
}

const physicsDeltaTime = 1 / PHYSICS_TICK_RATE;
var lastPhysicsTime = 0;
var accumulator = 0;
function startGameLoop() {

    (function loop(currentTime) {
        if (lastPhysicsTime === 0 && currentTime) lastPhysicsTime = currentTime;
        
        const deltaTime = (currentTime - lastPhysicsTime) / 1000; // Convert to seconds
        if (deltaTime > 0)
        {
            lastPhysicsTime = currentTime;
            
            // Cap deltaTime to prevent spiral of death
            const cappedDelta = Math.min(deltaTime, 0.1);
            accumulator += cappedDelta;
            
            while (accumulator >= physicsDeltaTime) {
                if (!gameState.connectionFrozen) {
                    updateTanks(physicsDeltaTime);
                    updateProjectiles(physicsDeltaTime);
                    updateExplosions(physicsDeltaTime);
                    updatePowerups(physicsDeltaTime);
                }
                accumulator -= physicsDeltaTime;
            }
        }
        
        updateMessages();
        updateCamera();
        updatePowerAnimation();
        render();
        setTimeout(() => requestAnimationFrame(loop), 0);
    })(performance.now());
}

window.addEventListener('resize', () => {
    baseCanvasWidth = window.innerWidth;
    baseCanvasHeight = 1000;
    canvas.width = baseCanvasWidth;
    canvas.height = baseCanvasHeight;
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && gameState.gameStarted) {
        console.log('Page resumed - requesting state sync');
        returnToLobby();
    }
});
