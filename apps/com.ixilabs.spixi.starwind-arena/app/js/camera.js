
// ============================================================================
// CAMERA
// ============================================================================

/**
 * Adjust camera position when zooming to keep bottom of world visible
 */
function adjustCameraForZoom() {
    const windowHeight = window.innerHeight;
    const visibleHeight = baseCanvasHeight * gameState.zoom;
    if (visibleHeight <= windowHeight)
    {
        gameState.cameraY = -(windowHeight / 2 - visibleHeight / 2) / gameState.zoom;
    } else if (gameState.cameraY * gameState.zoom > visibleHeight - windowHeight)
    {
        gameState.cameraY = (visibleHeight - windowHeight) / gameState.zoom;
    } else if (gameState.cameraY < 0)
    {
        gameState.cameraY = 0;
    }

    const windowWidth = window.innerWidth;
    const visibleWidth = gameState.worldWidth * gameState.zoom;
    if (visibleWidth <= windowWidth)
    {
        gameState.cameraX = -(windowWidth / 2 - visibleWidth / 2) / gameState.zoom;
    } else if (gameState.cameraX * gameState.zoom > visibleWidth - windowWidth)
    {
        gameState.cameraX = (visibleWidth - windowWidth) / gameState.zoom;
    } else if (gameState.cameraX < 0)
    {
        gameState.cameraX = 0;
    }
}

/**
 * Update camera position to follow player or respect manual control
 */
function updateCamera() {
    const timeSinceManual = Date.now() - gameState.lastManualCameraTime;
    
    // Auto-follow if not manually controlled
    if (gameState.gameStarted && !gameState.dragging && !gameState.manualCameraControl) {
        if (gameState.fired
            || gameState.projectiles.length > 0) {
            const projectile = gameState.projectiles[0];
            if (projectile) {
                const targetX = projectile.x - baseCanvasWidth / (2 * gameState.zoom) + PROJECTILE_RADIUS / 2;
                const targetY = projectile.y - window.innerHeight / (2 * gameState.zoom) + PROJECTILE_RADIUS / 2;

                gameState.cameraX += (targetX - gameState.cameraX);
                gameState.cameraY += (targetY - gameState.cameraY);
            }
        } else {
            const player = gameState.players[gameState.currentTurnIndex];
            if (player?.tank) {
                const targetX = player.tank.x - baseCanvasWidth / (2 * gameState.zoom) + TANK_WIDTH / 2;
                const targetY = player.tank.y - window.innerHeight / (2 * gameState.zoom) + TANK_HEIGHT / 2;
            
                gameState.cameraX += (targetX - gameState.cameraX) * CAMERA_SMOOTH_FACTOR;
                gameState.cameraY += (targetY - gameState.cameraY) * CAMERA_SMOOTH_FACTOR;
            }
        }
    }
    
    // Disable manual control after timeout
    if (gameState.manualCameraControl && timeSinceManual > MANUAL_CAMERA_TIMEOUT) {
        gameState.manualCameraControl = false;
    }
        
    adjustCameraForZoom();
}
