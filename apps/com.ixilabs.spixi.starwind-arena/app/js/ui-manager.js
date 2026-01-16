async function initUI() {    
    // Keyboard
    window.addEventListener('keydown', (e) => { gameState.keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { gameState.keys[e.key] = false; });

    setupTouchControls();
    
    // Menu
    const showMenu = () => { ui.menuOverlay.classList.remove('hidden'); ui.menuOverlay.setAttribute('aria-hidden','false'); soundManager.play('turnStart'); };
    const hideMenu = () => { ui.menuOverlay.classList.add('hidden'); ui.menuOverlay.setAttribute('aria-hidden','true'); soundManager.play('turnStart'); };
    ui.menuBtn.addEventListener('click', showMenu);
    ui.resumeBtn.addEventListener('click', hideMenu);
    ui.soundToggleBtn.addEventListener('click', () => {
        const e = soundManager.toggle();
        ui.soundToggleBtn.textContent = e ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        soundManager.play('turnStart');
    });
    ui.soundToggleBtn.textContent = soundManager.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    [[ui.helpBtn,ui.helpModal,'closeHelp'],[ui.aboutBtn,ui.aboutModal,'closeAbout'],[ui.donateBtn,ui.donateModal,'closeDonate'],[ui.controlsBtn,ui.controlsModal,'closeControls']].forEach(([btn,modal,cId]) => {
        if (!btn || !modal) return;
        btn.addEventListener('click', () => { hideMenu(); modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); soundManager.play('turnStart'); });
        const cb = document.getElementById(cId);
        if (cb) cb.addEventListener('click', () => { modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); });
        modal.addEventListener('click', (e) => { if (e.target===modal) { modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }});
    });
    const dBtn = document.getElementById('sendDonationBtn');
    if (dBtn) dBtn.addEventListener('click', () => sendDonation(document.getElementById('donateAmount').value));

    // Joystick side radio buttons
    ui.joystickLeft = document.getElementById('joystickLeft');
    ui.joystickRight = document.getElementById('joystickRight');
    if (ui.joystickLeft) {
        ui.joystickLeft.addEventListener('change', () => {
            setJoystickSide('left');
        });
    }
    if (ui.joystickRight) {
        ui.joystickRight.addEventListener('change', () => {
            setJoystickSide('right');
        });
    }

    // Back button
    ui.backBtn = document.createElement('button');
    ui.backBtn.id = 'backBtn';
    ui.backBtn.innerHTML = '← Back';
    ui.backBtn.addEventListener('mouseenter', () => { ui.backBtn.classList.add('hover'); });
    ui.backBtn.addEventListener('mouseleave', () => { ui.backBtn.classList.remove('hover'); });
    ui.backBtn.addEventListener('click', () => { soundManager.play('turnStart'); SpixiAppSdk.back(); });
    document.body.appendChild(ui.backBtn);
    
    // Map size selector
    const mapContainer = document.createElement('div');
    mapContainer.id = 'mapSizeContainer';
    const mapLabel = document.createElement('div');
    mapLabel.textContent = 'Map Size:';
    mapLabel.className = 'map-label';
    ui.mapSizeSelect = document.createElement('select');
    ui.mapSizeSelect.id = 'mapSizeSelect';
    Object.entries(MAP_SIZES).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value.name;
        if (key === 'medium') option.selected = true;
        ui.mapSizeSelect.appendChild(option);
    });
    ui.mapSizeSelect.addEventListener('change', (e) => {
        if (gameState.inLobby) {
            gameState.mapSize = e.target.value;
            gameState.worldWidth = MAP_SIZES[gameState.mapSize].width;
            soundManager.play('turnStart');
        } else {
            e.target.value = gameState.mapSize;
            soundManager.play('turnStart');
        }
    });
    mapContainer.appendChild(mapLabel);
    mapContainer.appendChild(ui.mapSizeSelect);
    document.body.appendChild(mapContainer);
    
    // Message system
    ui.messageBtn = document.createElement('button');
    ui.messageBtn.id = 'messageBtn';
    ui.messageBtn.innerHTML = '💬';
    ui.messageBtn.addEventListener('click', () => {
        ui.messagePanel.classList.toggle('visible');
        if (ui.messagePanel.classList.contains('visible')) ui.messageInput.focus();
        soundManager.play('turnStart');
    });
    ui.messagePanel = document.createElement('div');
    ui.messagePanel.id = 'messagePanel';
    ui.messageInput = document.createElement('input');
    ui.messageInput.id = 'messageInput';
    ui.messageInput.type = 'text';
    ui.messageInput.placeholder = 'Type a message...';
    ui.messageInput.maxLength = 60;
    const sendBtn = document.createElement('button');
    sendBtn.className = 'send-btn';
    sendBtn.textContent = 'Send';
    const sendMessage = () => {
        const text = ui.messageInput.value.trim();
        if (text) {
            const message = { text, address: gameState.myAddress, timestamp: Date.now() };
            addMessage(message);
            broadcast({ type: 'message', message });
            ui.messageInput.value = '';
            soundManager.play('turnStart');
        }
    };
    sendBtn.addEventListener('click', sendMessage);
    ui.messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    ui.messagePanel.appendChild(ui.messageInput);
    ui.messagePanel.appendChild(sendBtn);
    document.body.appendChild(ui.messagePanel);
    document.body.appendChild(ui.messageBtn);
    
    // Start button
    const btn = document.createElement('button');
    btn.id = 'startBtn';
    btn.textContent = 'START GAME';
    btn.onclick = startGameAsHost;
    mapContainer.appendChild(btn);
    
    // Wind indicator
    ui.windIndicator = document.createElement('div');
    ui.windIndicator.id = 'windIndicator';
    document.body.appendChild(ui.windIndicator);
    
    // Aim controls with touch-hold power charging
    const updateAngle = (clientX, clientY) => {
        if (!gameState.gameStarted || gameState.currentTurnIndex !== gameState.myPlayerIndex || gameState.projectiles.length > 0) return false;
        const myPlayer = gameState.players[gameState.myPlayerIndex];
        if (!myPlayer?.alive || !myPlayer?.tank) return false;
        const rect = canvas.getBoundingClientRect();
        const canvasY = clientY - rect.top;
        const worldX = ((clientX - rect.left) / gameState.zoom) + gameState.cameraX;
        const worldY = (canvasY / gameState.zoom) + gameState.cameraY;
        // Calculate angle from tank center (barrel origin), not from tank.x
        const tankCenterX = myPlayer.tank.x + TANK_WIDTH / 2;
        const tankCenterY = myPlayer.tank.y + TANK_HEIGHT / 2;
        const angle = calculateAngleToTarget(worldX, worldY, tankCenterX, tankCenterY, myPlayer.tank);
        myPlayer.tank.angle = angle;
        return true;
    };
    const handleAimStart = (clientX, clientY, e) => {
        if (!gameState.gameStarted || gameState.currentTurnIndex !== gameState.myPlayerIndex || gameState.projectiles.length > 0) return;
        const myPlayer = gameState.players[gameState.myPlayerIndex];
        if (!myPlayer?.alive || !myPlayer?.tank) return;
        const rect = canvas.getBoundingClientRect();
        const canvasY = clientY - rect.top;
        if (e) e.preventDefault();
        gameState.isAiming = true;
        gameState.aimStartTime = Date.now();
        gameState.aimStartX = clientX;
        gameState.aimStartY = clientY;
        gameState.dragging = false;
        myPlayer.tank.power = 10;
        canvas.style.cursor = 'crosshair';
    };
    const handleAimMove = (clientX, clientY) => {
        const canUpdate = updateAngle(clientX, clientY);
    };
    const handleAimEnd = (isTouch = false) => {
        if (!gameState.isAiming) return;
        const wasAiming = gameState.isAiming;
        gameState.isAiming = false;
        canvas.style.cursor = 'default';
        if (wasAiming && !isTouch) {
            const myPlayer = gameState.players[gameState.myPlayerIndex];
            if (myPlayer?.alive && myPlayer?.tank && gameState.currentTurnIndex === gameState.myPlayerIndex && gameState.projectiles.length === 0) {
                fireMissile();
            }
        }
    };
    // Wind settings
    const menu = document.getElementById('menuPanel');
    if (menu) {
        const div = document.createElement('div');
        div.className = 'graphics-quality-div';
        const label = document.createElement('div');
        label.textContent = 'Graphics Quality:';
        const sel = document.createElement('select');
        sel.id = 'graphicsQualitySelect';
        sel.className = 'graphics-quality-select';
        [['low','Low'],['med','Medium'],['high','High']].forEach(([v,t]) => {
            const o = document.createElement('option');
            o.value = v;
            o.textContent = t;
            sel.appendChild(o);
        });
        const saved = await SpixiAppSdk.getStorageData('settings', 'graphicsQuality');
        if (saved) sel.value = saved;
        sel.addEventListener('change', (e) => {
            SpixiAppSdk.setStorageData('settings', 'graphicsQuality', e.target.value);
            if (typeof WindSystem !== 'undefined' && WindSystem.initialized) WindSystem.setQuality(e.target.value);
        });
        div.appendChild(label);
        div.appendChild(sel);
        menu.appendChild(div);
        if (typeof WindSystem !== 'undefined' && WindSystem.initialized) WindSystem.setQuality(sel.value);
        
        // Theme selector
        const themeDiv = document.createElement('div');
        themeDiv.className = 'theme-div';
        const themeLabel = document.createElement('div');
        themeLabel.textContent = 'Theme:';
        const themeSel = document.createElement('select');
        themeSel.id = 'themeSelect';
        Object.entries(THEMES).forEach(([key, theme]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${theme.name} - ${theme.description}`;
            themeSel.appendChild(option);
        });
        const savedTheme = await SpixiAppSdk.getStorageData('settings', 'selectedTheme') || 'neon';
        themeSel.value = savedTheme;
        themeSel.addEventListener('change', (e) => {
            setTheme(e.target.value);
            soundManager.play('turnStart');
        });
        themeDiv.appendChild(themeLabel);
        themeDiv.appendChild(themeSel);
        menu.appendChild(themeDiv);
    }
    
    // Wind system
    if (typeof WindSystem !== 'undefined') {
        WindSystem.init();
        const q = await SpixiAppSdk.getStorageData('settings', 'graphicsQuality');
        if (q) WindSystem.setQuality(q);
    }
    
    // Initialize theme system
    if (typeof initializeTheme === 'function') {
        initializeTheme();
    }
    
    // Touch pan/zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = (mouseX / gameState.zoom) + gameState.cameraX;
        const worldY = (mouseY / gameState.zoom) + gameState.cameraY;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.3, Math.min(3, gameState.zoom * zoomFactor));
        gameState.cameraX = worldX - (mouseX / newZoom);
        gameState.cameraY = worldY - (mouseY / newZoom);
        gameState.zoom = newZoom;
        adjustCameraForZoom();
    }, { passive: false });
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0 && !e.ctrlKey) {
            handleAimStart(e.clientX, e.clientY, e);
        } else if (e.button === 2 || e.ctrlKey) {
            if (gameState.isAiming) return;
            gameState.dragging = true;
            gameState.manualCameraControl = true;
            gameState.lastManualCameraTime = Date.now();
            gameState.dragStartX = e.clientX;
            gameState.dragStartY = e.clientY;
            gameState.dragStartCameraX = gameState.cameraX;
            gameState.dragStartCameraY = gameState.cameraY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        handleAimMove(e.clientX, e.clientY);
        if (gameState.dragging) {
            const dx = (e.clientX - gameState.dragStartX) / gameState.zoom;
            const dy = (e.clientY - gameState.dragStartY) / gameState.zoom;
            gameState.cameraX = gameState.dragStartCameraX - dx;
            gameState.cameraY = gameState.dragStartCameraY - dy;
            gameState.lastManualCameraTime = Date.now();
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0 && !e.ctrlKey) handleAimEnd();
        gameState.dragging = false;
        canvas.style.cursor = 'default';
    });
    
    canvas.addEventListener('mouseleave', () => {
        gameState.dragging = false;
        canvas.style.cursor = 'default';
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    canvas.addEventListener('touchstart', (e) => {
        gameState.touches = Array.from(e.touches);
        
        if (gameState.touches.length === 1) {
            const touch = gameState.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            const player = gameState.players[gameState.myPlayerIndex];
            const isOnTank = checkAABBCollision(player.tank.x, player.tank.y, TANK_WIDTH, TANK_HEIGHT, (touchX / gameState.zoom) + gameState.cameraX, (touchY / gameState.zoom) + gameState.cameraY, 50, 50);

            updateAngle(touch.clientX, touch.clientY);
            
            // Start touch-hold power charging
            const canAim = gameState.gameStarted && gameState.currentTurnIndex === gameState.myPlayerIndex && gameState.projectiles.length === 0 && gameState.players[gameState.myPlayerIndex]?.alive;
            if (canAim && isOnTank) {
                e.preventDefault();
                handleAimStart(touch.clientX, touch.clientY, e);
            } else if (!gameState.isAiming) {
                gameState.dragging = true;
                gameState.manualCameraControl = true;
                gameState.lastManualCameraTime = Date.now();
                gameState.dragStartX = touch.clientX;
                gameState.dragStartY = touch.clientY;
                gameState.dragStartCameraX = gameState.cameraX;
                gameState.dragStartCameraY = gameState.cameraY;
            }
        } else if (gameState.touches.length === 2) {
            gameState.dragging = false;
            gameState.isAiming = false;
            const dx = gameState.touches[0].clientX - gameState.touches[1].clientX;
            const dy = gameState.touches[0].clientY - gameState.touches[1].clientY;
            gameState.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        gameState.touches = Array.from(e.touches);
        
        if (gameState.touches.length === 1) {
            const touch = gameState.touches[0];
            updateAngle(touch.clientX, touch.clientY);
            // Continue charging power during touch-hold
            handleAimMove(touch.clientX, touch.clientY);
            
            if (gameState.dragging && !gameState.isAiming) {
                const dx = (touch.clientX - gameState.dragStartX) / gameState.zoom;
                const dy = (touch.clientY - gameState.dragStartY) / gameState.zoom;
                gameState.cameraX = gameState.dragStartCameraX - dx;
                gameState.cameraY = gameState.dragStartCameraY - dy;
                gameState.lastManualCameraTime = Date.now();
            }
        } else if (gameState.touches.length === 2 && !gameState.isAiming) {
            const dx = gameState.touches[0].clientX - gameState.touches[1].clientX;
            const dy = gameState.touches[0].clientY - gameState.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (gameState.lastTouchDistance > 0) {
                const rect = canvas.getBoundingClientRect();
                const centerX = (gameState.touches[0].clientX + gameState.touches[1].clientX) / 2 - rect.left;
                const centerY = (gameState.touches[0].clientY + gameState.touches[1].clientY) / 2 - rect.top;
                const worldX = (centerX / gameState.zoom) + gameState.cameraX;
                const worldY = (centerY / gameState.zoom) + gameState.cameraY;
                const zoomFactor = distance / gameState.lastTouchDistance;
                const newZoom = Math.max(0.3, Math.min(3, gameState.zoom * zoomFactor));
                gameState.cameraX = worldX - (centerX / newZoom);
                gameState.cameraY = worldY - (centerY / newZoom);
                gameState.zoom = newZoom;
                adjustCameraForZoom();
            }
            gameState.lastTouchDistance = distance;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        gameState.touches = Array.from(e.touches);
        if (gameState.touches.length < 2) gameState.lastTouchDistance = 0;
        
        // Fire projectile when releasing touch after charging
        if (gameState.isAiming) {
            handleAimEnd(true);
            const myPlayer = gameState.players[gameState.myPlayerIndex];
            if (myPlayer?.alive && myPlayer?.tank && gameState.currentTurnIndex === gameState.myPlayerIndex && gameState.projectiles.length === 0) {
                fireMissile();
            }
        }
        
        if (gameState.touches.length === 0) {
            gameState.dragging = false;
        } else if (gameState.touches.length === 1) {
            const touch = gameState.touches[0];
            const rect = canvas.getBoundingClientRect();
            gameState.dragging = true;
            gameState.dragStartX = touch.clientX;
            gameState.dragStartY = touch.clientY;
            gameState.dragStartCameraX = gameState.cameraX;
            gameState.dragStartCameraY = gameState.cameraY;
        }
    }, { passive: true });
}



// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Update player info display showing health and active turn
 */
function updatePlayerInfo() {
    ui.playerInfo.innerHTML = gameState.players.map((p,i) => {
        const cls = ['player-card', i === gameState.currentTurnIndex&&'active', !p.alive&&'dead'].filter(Boolean).join(' ');
        return `<div class="${cls}">${p.isLocal?`P${i + 1} (You)`:`P${i + 1}`}: ${Math.max(0,Math.round(p.tank.health))}❤️</div>`;
    }).join('');
}

function updateWindDisplay() {
    if (!ui.windIndicator) return;

    const windStr = Math.abs(gameState.wind).toFixed(1);
    const windStrength = Math.abs(gameState.wind);

    ui.windIndicator.innerHTML = '';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'wind-icon-container';

    const arrow = gameState.wind === 0 ? '·' : (gameState.wind > 0 ? '➜' : '⬅');
    const windText = document.createElement('span');
    windText.textContent = `${arrow} wind ${windStr}`;
    windText.className = 'wind-text';

    if (gameState.wind > 0) {
        ui.windIndicator.appendChild(windText);
        ui.windIndicator.appendChild(iconContainer);
    } else {
        ui.windIndicator.appendChild(iconContainer);
        ui.windIndicator.appendChild(windText);
    }

    ui.windIndicator.style.opacity = windStrength === 0 ? '0.4' : '1';
    ui.windIndicator.style.display = gameState.gameStarted ? 'flex' : 'none';
}

function addMessage(message) {
    const msg = { ...message, alpha: 1, y: 180 + gameState.messages.length * 45 };
    gameState.messages.push(msg);
    setTimeout(() => {
        const idx = gameState.messages.indexOf(msg);
        if (idx>-1) { gameState.messages.splice(idx,1); gameState.messages.forEach((m,i) => m.y=180+i*45); }
    }, 5000);
}
function updateMessages() { gameState.messages.forEach(m => { const a=Date.now()-m.timestamp; if(a>4000) m.alpha=Math.max(0,1-(a-4000)/1000); }); }

async function sendDonation(amount) {
    const recipient = '12DjT6SFys29CLdy2vASv6iYdRZ4XXUebfYMXsExfksmpcgvr';
    
    try {
        await SpixiAppSdk.sendPayment(recipient, amount);
        ui.donateModal.classList.add('hidden');
        ui.gameStatus.textContent = `Thank you for your donation of ${amount} IXI! 💝`;
    } catch (e) {
        console.error('Donation failed:', e);
        alert('Failed to send donation. Please try again.');
    }
}

function updateLobbyStatus() {
    if (gameState.inLobby) {
        const n = gameState.connectedPlayers.size+1;
        ui.gameStatus.textContent = `Lobby: ${n} player${n!==1?'s':''} connected`;
    }
}

/**
 * Calculate angle from tank to target position
 * @param {number} targetX - Target world X coordinate
 * @param {number} targetY - Target world Y coordinate
 * @param {number} tankCenterX - Tank center X coordinate
 * @param {number} tankCenterY - Tank center Y coordinate
 * @param {Object} tank - Tank object
 * @returns {number} Angle in degrees (0-90)
 */
function calculateAngleToTarget(targetX, targetY, tankCenterX, tankCenterY, tank) {
    const cx = tankCenterX !== undefined ? tankCenterX : tank.x + TANK_WIDTH / 2;
    const cy = tankCenterY !== undefined ? tankCenterY : tank.y + TANK_HEIGHT / 2;
    const dx = targetX - cx;
    const dy = targetY - cy;

    let angle;
    if (dx < 0) {
        tank.facing = 'left';
        // Mirror angle for left: 0 = horizontal left, 90 = up
        angle = Math.atan2(-dy, -dx) * 180 / Math.PI;
    } else {
        tank.facing = 'right';
        // 0 = horizontal right, 90 = up
        angle = Math.atan2(-dy, dx) * 180 / Math.PI;
    }

    // Clamp angle to 0-90 degrees
    return Math.max(0, Math.min(90, angle));
}


