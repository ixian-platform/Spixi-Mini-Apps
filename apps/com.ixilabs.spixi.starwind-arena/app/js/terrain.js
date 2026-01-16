/**
 * Terrain
 * Handles world generation and collision detection
 * @author IXI Labs
 */

/**
 * Generate procedural terrain for the game world using multi-layer noise
 * Terrain is stored as an array of {x, height} points
 */
function generateTerrain() {
    const mapConfig = MAP_SIZES[gameState.mapSize];
    const segments = mapConfig.segments;
    const worldWidth = mapConfig.width;
    const segmentWidth = worldWidth / segments;
    const seed = Math.random() * 1000;
    
    gameState.worldWidth = worldWidth;
    
    // Generate base terrain with multi-layer noise
    gameState.terrain = Array.from({ length: segments + 1 }, (_, i) => {
        const x = i * segmentWidth;
        const noise1 = Math.sin((i + seed) * TERRAIN_CONFIG.NOISE_1_FREQUENCY) * TERRAIN_CONFIG.NOISE_1_AMPLITUDE;
        const noise2 = Math.sin((i + seed) * TERRAIN_CONFIG.NOISE_2_FREQUENCY) * TERRAIN_CONFIG.NOISE_2_AMPLITUDE;
        const noise3 = Math.sin((i + seed) * TERRAIN_CONFIG.NOISE_3_FREQUENCY) * TERRAIN_CONFIG.NOISE_3_AMPLITUDE;
        let height = TERRAIN_HEIGHT + noise1 + noise2 + noise3;
        
        // Add random pillars and valleys for variety
        const obstacleChance = Math.random();
        if (obstacleChance < TERRAIN_CONFIG.PILLAR_CHANCE) {
            height += Math.random() * 100 + (TERRAIN_CONFIG.PILLAR_HEIGHT - 100);
        } else if (obstacleChance < TERRAIN_CONFIG.PILLAR_CHANCE + TERRAIN_CONFIG.VALLEY_CHANCE) {
            height -= Math.random() * 60 + (TERRAIN_CONFIG.VALLEY_DEPTH - 60);
        }
        
        return { 
            x, 
            height: Math.max(TERRAIN_CONFIG.MIN_HEIGHT, Math.min(TERRAIN_CONFIG.MAX_HEIGHT, height)) 
        };
    });
    
    // Smooth out extreme terrain changes
    for (let i = 1; i < gameState.terrain.length - 1; i++) {
        const prev = gameState.terrain[i - 1].height;
        const curr = gameState.terrain[i].height;
        const next = gameState.terrain[i + 1].height;
        const diff = Math.abs(curr - prev);
        
        if (diff > TERRAIN_CONFIG.SMOOTHING_THRESHOLD && diff < TERRAIN_CONFIG.SMOOTHING_MAX) {
            gameState.terrain[i].height = (prev + curr + next) / 3;
        }
    }
    
    // Store original terrain for visual damage overlay
    gameState.originalTerrain = gameState.terrain.map(point => ({ ...point }));
}

/**
 * Get terrain height at a specific x coordinate
 * @deprecated Use getTerrainHeightAtPoint for interpolated accuracy
 * @param {number} x - World x coordinate
 * @returns {number} Y coordinate of terrain surface
 */
function getTerrainHeight(x) {
    return getTerrainHeightAtPoint(x);
}

// ============================================================================
// COLLISION DETECTION UTILITIES
// ============================================================================

/**
 * Get terrain height at a specific x coordinate with interpolation
 * Provides accurate collision surface at any point
 * @param {number} x - World x coordinate
 * @returns {number} Y coordinate of terrain surface (canvas space)
 */
function getTerrainHeightAtPoint(x) {
    if (gameState.terrain.length < 2) {
        return baseCanvasHeight - TERRAIN_HEIGHT;
    }
    
    const clampedX = Math.max(0, Math.min(x, gameState.worldWidth));
    const normalizedIndex = (clampedX / gameState.worldWidth) * (gameState.terrain.length - 1);
    const floorIndex = Math.floor(normalizedIndex);
    const ceilIndex = Math.ceil(normalizedIndex);
    const fraction = normalizedIndex - floorIndex;
    
    const height1 = gameState.terrain[floorIndex]?.height || TERRAIN_HEIGHT;
    const height2 = gameState.terrain[ceilIndex]?.height || TERRAIN_HEIGHT;
    
    // Linear interpolation for smooth terrain height
    const interpolatedHeight = height1 + (height2 - height1) * fraction;
    return baseCanvasHeight - interpolatedHeight;
}

/**
 * Check if a point is inside terrain (solid collision)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if point collides with terrain
 */
function isPointInTerrain(x, y) {
    if (gameState.terrain.length < 2) {
        return y >= baseCanvasHeight - TERRAIN_HEIGHT;
    }
    
    const clampedX = Math.max(0, Math.min(x, gameState.worldWidth));
    const normalizedIndex = (clampedX / gameState.worldWidth) * (gameState.terrain.length - 1);
    const floorIndex = Math.floor(normalizedIndex);
    const ceilIndex = Math.ceil(normalizedIndex);
    
    const p1 = gameState.terrain[floorIndex] || { x: 0, height: TERRAIN_HEIGHT };
    const p2 = gameState.terrain[ceilIndex] || { x: gameState.worldWidth, height: TERRAIN_HEIGHT };
    
    const x1 = p1.x;
    const y1 = baseCanvasHeight - p1.height;
    const x2 = p2.x;
    const y2 = baseCanvasHeight - p2.height;
    
    // Check if below terrain
    const terrainY = y1 + (y2 - y1) * ((clampedX - x1) / (x2 - x1 || 1));
    if (y >= terrainY) return true;
    
    // Check distance to slope line (catches side hits)
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return false;
    
    let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
    
    return dist < 10;
}

/**
 * Get the collision response when an AABB collides with terrain
 * Returns the push vector and collision normal
 * @param {number} boxX - Box left edge
 * @param {number} boxY - Box top edge
 * @param {number} boxW - Box width
 * @param {number} boxH - Box height
 * @returns {Object|null} {pushY, colliding} or null if no collision
 */
function getTerrainCollisionResponse(boxX, boxY, boxW, boxH) {
    // Sample terrain height at multiple points across box width
    // Use more samples to catch sharp spikes and slopes accurately
    const samples = 17; // Increased for better precision
    let maxTerrainY = -Infinity;
    let colliding = false;
    
    for (let i = 0; i < samples; i++) {
        const sampleX = boxX + (boxW / (samples - 1)) * i;
        const terrainY = getTerrainHeightAtPoint(sampleX);
        
        // Check if box bottom penetrates terrain
        if (boxY + boxH > terrainY) {
            colliding = true;
            maxTerrainY = Math.max(maxTerrainY, terrainY);
        }
    }
    
    if (colliding) {
        // Add small buffer to prevent floating point precision issues
        const pushY = maxTerrainY - boxH - 0.5;
        return {
            pushY: pushY,
            colliding: true
        };
    }
    
    return null;
}

/**
 * Check circular collision with terrain
 * Properly detects collisions with terrain sides (spikes/mountains)
 * @param {number} x - Circle center X
 * @param {number} y - Circle center Y
 * @param {number} radius - Circle radius
 * @returns {Object|null} Collision info or null
 */
function checkCircleTerrainCollision(x, y, radius) {
    // Check center point
    if (isPointInTerrain(x, y)) {
        return {
            x: x,
            y: y,
            colliding: true
        };
    }
    
    // Check multiple points around the circle perimeter for comprehensive coverage
    const checkPoints = 32;
    for (let i = 0; i < checkPoints; i++) {
        const angle = (i / checkPoints) * Math.PI * 2;
        const checkX = x + Math.cos(angle) * radius;
        const checkY = y + Math.sin(angle) * radius;
        
        if (isPointInTerrain(checkX, checkY)) {
            return {
                x: x,
                y: y,
                colliding: true
            };
        }
    }
    
    // Additional check: sample points along both horizontal and vertical lines
    const sampleCount = 12;
    for (let i = 0; i < sampleCount; i++) {
        const t = i / (sampleCount - 1) - 0.5;
        
        // Check horizontal line
        const hCheckX = x + t * radius * 2;
        if (isPointInTerrain(hCheckX, y)) {
            return {
                x: x,
                y: y,
                colliding: true
            };
        }
        
        // Check vertical line
        const vCheckY = y + t * radius * 2;
        if (isPointInTerrain(x, vCheckY)) {
            return {
                x: x,
                y: y,
                colliding: true
            };
        }
    }
    
    return null;
}
