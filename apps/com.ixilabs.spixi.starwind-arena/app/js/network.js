/**
 * Network Communication
 * Handles P2P messaging and game state synchronization
 * @author IXI Labs
 */

// ============================================================================
// NETWORK MESSAGE HANDLING
// ============================================================================

/**
 * Main handler for incoming network messages from other players
 * Routes messages to appropriate handlers based on type
 * @param {string} senderAddress - Address of the sending player
 * @param {Object} msg - Parsed message object
 */
function handleNetworkMessage(senderAddress, msg) {
    // Validate message structure
    if (!msg || !msg.type) {
        console.warn('Invalid message format from', senderAddress);
        return;
    }
    
    // Update last seen time for any message
    gameState.lastSeenTime.set(senderAddress, Date.now());
    
    // Clear disconnection timer if player reconnects
    if (gameState.disconnectedPlayers.has(senderAddress)) {
        gameState.disconnectedPlayers.delete(senderAddress);
    }
    
    // Handle ping messages immediately
    if (msg.type === 'ping') {
        return;
    }
    
    // Handle lobby messages (before game starts)
    if (msg.type === 'lobbyJoin') {
        handleLobbyJoin(senderAddress);
        return;
    }
    
    if (msg.type === 'gameStart') {
        handleGameStart(senderAddress, msg);
        return;
    }
    
    // Handle chat messages anytime (lobby or in-game)
    if (msg.type === 'message' && msg.message) {
        addMessage(msg.message);
        return;
    }
        
    // Handle gameState for resuming
    if (msg.type === 'gameState') {
        handleGameState(senderAddress, msg);
        return;
    }
    
    // Get sender's player index for in-game messages
    let senderPlayerIndex = gameState.addressToPlayerIndex.get(senderAddress);
    
    // Ignore game messages if game not started or sender unknown
    if (!gameState.gameStarted || senderPlayerIndex === undefined) {
        return;
    }
    
    // Route in-game messages
    switch (msg.type) {
        case 'fire':
            handleFireMessage(msg, senderPlayerIndex);
            break;
        
        case 'hit':
            handleHitMessage(msg);
            break;
            
        case 'powerupSpawn':
            handlePowerupSpawnMessage(msg);
            break;
            
        case 'powerupCollect':
            handlePowerupCollectMessage(msg);
            break;
            
        case 'tankSync':
            handleTankSync(senderAddress, msg);
            break;
            
        case 'requestState':
            // Any player who has game state should respond
            broadcastGameState(msg);
            break;

        default:
            console.warn('Unknown message type:', msg.type);
    }
}

function broadcastGameState() {
    if (!gameState.gameStarted) {
        return;
    }
    var msg = {
        type: 'gameState',
        gameId: gameState.gameId,
        terrain: gameState.terrain,
        originalTerrain: gameState.originalTerrain,
        wind: gameState.wind,
        nextWind: gameState.nextWind,
        worldWidth: gameState.worldWidth,
        addressMapping: Object.fromEntries(gameState.addressToPlayerIndex),
        positions: gameState.players.map(p => ({x: p.tank.x, y: p.tank.y, health: p.tank.health})),
        currentTurnIndex: gameState.currentTurnIndex,
        turnTimeLeft: gameState.turnTimeLeft,
        projectiles: gameState.projectiles,
        powerups: gameState.powerups,
        activePowerups: Array.from(gameState.activePowerups.entries()),
        connectionFrozen: gameState.connectionFrozen,
        isHost: gameState.isHost
    };
    console.info('Broadcasting game state ', msg);
    broadcast(msg);
}

/**
 * Handle a player joining the lobby
 * @param {string} senderAddress - Address of joining player
 */
function handleLobbyJoin(senderAddress) {
    if (!gameState.connectedPlayers.has(senderAddress)) {
        gameState.connectedPlayers.add(senderAddress);
        updateLobbyStatus();
        broadcast({ type: 'lobbyJoin' });
    }
}

/**
 * Handle game start message from host
 * @param {string} senderAddress - Address of host
 * @param {Object} msg - Game start message with initial state
 */
function handleGameStart(senderAddress, msg) {
    try {
         if (!gameState.inLobby)
         {
            broadcastGameState();
            return;
         }

        // Validate required fields
        if (!msg.terrain || !msg.addressMapping || !msg.positions) {
            console.error('Invalid game start message - missing required fields');
            return;
        }
        
        gameState.inLobby = false;
        gameState.isHost = false;        
        gameState.gameId = msg.gameId;
        gameState.terrain = msg.terrain;
        gameState.originalTerrain = msg.terrain.map(point => ({ ...point }));
        gameState.wind = msg.wind;
        gameState.nextWind = msg.nextWind;
        gameState.worldWidth = msg.worldWidth;
        gameState.addressToPlayerIndex.clear();
        gameState.currentTurnIndex = 0;
        gameState.fired = 0;

        // Build address to player index mapping
        Object.entries(msg.addressMapping).forEach(([addr, idx]) => {
            gameState.addressToPlayerIndex.set(addr, idx);
        });
                
        // Find our player index
        gameState.myPlayerIndex = msg.addressMapping[gameState.myAddress];
        if (gameState.myPlayerIndex === undefined) {
            console.error('My address not in mapping!');
            return;
        }
        
        // Create player objects
        gameState.players = msg.positions.map((pos, idx) => 
            createPlayer(pos, idx, idx === gameState.myPlayerIndex)
        );
        
        // Hide start button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.style.display = 'none';
        }
        
        // Start game after brief delay
        setTimeout(startGame, 500);
    } catch (error) {
        console.error('Failed to handle game start:', error);
    }
}

/**
 * Handle game state message for resuming after restart or reconnection
 * @param {string} senderAddress - Address of host
 * @param {Object} msg - Game state message with current state
 */
function handleGameState(senderAddress, msg) {
    try {
        // Validate required fields
        if (!msg.terrain || !msg.addressMapping || !msg.positions) {
            console.error('Invalid game state message - missing required fields');
            return;
        }

        if (msg.gameId > gameState.gameId) {
            if (!gameState.inLobby) {
                broadcastGameState();
                return;
            }
        } else if (msg.gameId === gameState.gameId && !gameState.gameStarted) {
            return;
        }
        
        gameState.inLobby = false;
        
        // Only update hostAddress if sender is confirmed as host
        if (msg.isHost === true) {
            gameState.isHost = false;
        }
        
        gameState.terrain = msg.terrain;
        gameState.originalTerrain = msg.originalTerrain;
        gameState.wind = msg.wind;
        gameState.nextWind = msg.nextWind;
        gameState.worldWidth = msg.worldWidth;
        gameState.addressToPlayerIndex.clear();

        // Build address to player index mapping
        Object.entries(msg.addressMapping).forEach(([addr, idx]) => {
            gameState.addressToPlayerIndex.set(addr, idx);
        });
                
        // Find our player index
        gameState.myPlayerIndex = msg.addressMapping[gameState.myAddress];
        if (gameState.myPlayerIndex === undefined) {
            console.error('My address not in mapping!');
            return;
        }
        
        // Create player objects with current positions and health
        gameState.players = msg.positions.map((pos, idx) => {
            const player = createPlayer({x: pos.x, y: pos.y}, idx, idx === gameState.myPlayerIndex);
            if (pos.health !== undefined) {
                player.tank.health = pos.health;
                player.alive = pos.health > 0;
            }
            return player;
        });
        
        gameState.currentTurnIndex = msg.currentTurnIndex || 0;        
        gameState.fired = 0;
        gameState.turnTimeLeft = msg.turnTimeLeft || TURN_TIME;
        gameState.projectiles = msg.projectiles || [];
        gameState.powerups = msg.powerups || [];
        gameState.activePowerups = new Map(msg.activePowerups || []);
        
        gameState.gameId = msg.gameId;
        gameState.gameStarted = true;
        
        // If connection was frozen, unfreeze it on successful state recovery
        const wasDisconnected = gameState.connectionFrozen;
        if (msg.connectionFrozen !== undefined) {
            gameState.connectionFrozen = msg.connectionFrozen;
        } else {
            gameState.connectionFrozen = false;
        }
        
        // Clear disconnection tracking
        gameState.disconnectedPlayers.clear();
        
        // Hide lobby UI elements
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.style.display = 'none';
        }
        const mapContainer = document.getElementById('mapSizeContainer');
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
        
        // Start the game loop and UI
        updatePlayerInfo();
        updateWindDisplay();
        
        // Ensure turn timer is running
        if (gameState.turnTimerInterval) {
            clearInterval(gameState.turnTimerInterval);
        }
        gameState.turnTimerInterval = setInterval(updateTurnTimer, 1000);
        
        if (wasDisconnected) {
            ui.gameStatus.textContent = '✓ Reconnected! Game resuming...';
            ui.gameStatus.style.color = '#00ff00';
            setTimeout(() => {
                updateTurnState();
            }, 1000);
        } else {
            updateTurnState();
        }        
    } catch (error) {
        console.error('Failed to handle game state:', error);
    }
}

/**
 * Handle tank position synchronization from remote player
 * @param {string} senderAddress - Address of player sending update
 * @param {Object} msg - Message containing tank state
 */
function handleTankSync(senderAddress, msg) {
    let senderPlayerIndex = gameState.addressToPlayerIndex.get(senderAddress);
    
    // Update remote player's tank state
    if (senderPlayerIndex !== undefined && senderPlayerIndex !== gameState.myPlayerIndex) {
        const player = gameState.players[senderPlayerIndex];
        if (player?.tank && !player.isLocal) {
            player.tank.targetX = msg.tank.x;
            player.tank.targetY = msg.tank.y;
            
            // Initialize smooth position on first sync
            if (player.tank.smoothX === undefined) {
                player.tank.smoothX = msg.tank.x;
            }
            if (player.tank.smoothY === undefined) {
                player.tank.smoothY = msg.tank.y;
            }
        }
    }
}

/**
 * Handle fire message from remote player
 * @param {Object} msg - Fire message with angle, power, position
 * @param {number} senderPlayerIndex - Index of firing player
 */
function handleFireMessage(msg, senderPlayerIndex) {
    // Update wind from fire message
    gameState.nextWind = msg.nextWind;
    
    gameState.projectiles.push({
        x: msg.x,
        y: msg.y,
        vx: msg.vx,
        vy: msg.vy,
        radius: PROJECTILE_RADIUS,
        firedBy: senderPlayerIndex,
        megaPower: msg.megaPower || false
    });
}

/**
 * Handle hit message (damage to player)
 * @param {Object} msg - Message with target index and new health
 */
function handleHitMessage(msg) {
    const target = gameState.players[msg.targetIndex];
    if (target) {
        target.tank.health = msg.newHealth;
        target.alive = msg.newHealth > 0;
        updatePlayerInfo();
    }
}

/**
 * Handle powerup spawn message from host
 * @param {Object} msg - Message with powerup data
 */
function handlePowerupSpawnMessage(msg) {
    if (!gameState.isHost && msg.powerup) {
        gameState.powerups.push(msg.powerup);
    }
}

/**
 * Handle powerup collection message
 * @param {Object} msg - Message with powerup ID, type, and player index
 */
function handlePowerupCollectMessage(msg) {
    // Remove powerup from world
    gameState.powerups = gameState.powerups.filter(p => p.id !== msg.powerupId);
    
    const powerupType = POWERUP_TYPES.find(p => p.id === msg.powerupType);
    if (powerupType && msg.playerIdx !== undefined) {
        if (msg.powerupType === 'health') {
            // Health powerup - instant effect
            const player = gameState.players[msg.playerIdx];
            if (player?.tank) {
                player.tank.health = Math.min(TANK_INITIAL_HEALTH, player.tank.health + HEALTH_POWERUP_AMOUNT);
                updatePlayerInfo();
            }
        } else if (msg.powerupType === 'teleport') {
            // Teleport handled by sender
        } else {
            // Timed powerup - add to active powerups
            gameState.activePowerups.set(msg.playerIdx, {
                type: msg.powerupType,
                startTime: Date.now()
            });
        }
    }
}

/**
 * Broadcast message to all connected players
 */
function broadcast(obj) {
    try {
        SpixiAppSdk.sendNetworkData(JSON.stringify(obj));
    } catch (error) {
        console.error('Failed to broadcast message:', error);
    }
}

// ============================================================================
// MOVEMENT SYNCHRONIZATION
// ============================================================================

function startMovementSync() {
    if (gameState.moveSyncInterval) return;
    
    gameState.moveSyncInterval = setInterval(() => {
        const player = gameState.players[gameState.myPlayerIndex];
        if (gameState.isMoving && gameState.gameStarted && player?.tank) {
            broadcast({
                type: 'tankSync',
                tank: { 
                    x: player.tank.x, 
                    y: player.tank.y
                }
            });
        }
    }, MOVEMENT_SYNC_INTERVAL);
}

function stopMovementSync() {
    if (gameState.moveSyncInterval) {
        clearInterval(gameState.moveSyncInterval);
        gameState.moveSyncInterval = null;
    }
    
    const player = gameState.players[gameState.myPlayerIndex];
    if (gameState.gameStarted && player?.tank) {
        broadcast({
            type: 'tankSync',
            tank: { 
                x: player.tank.x, 
                y: player.tank.y
            }
        });
    }
}
