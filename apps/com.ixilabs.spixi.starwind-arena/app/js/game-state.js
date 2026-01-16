/**
 * Game State Management
 * @author IXI Labs
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Base canvas dimensions (updated on resize)
let baseCanvasWidth = window.innerWidth;
let baseCanvasHeight = 1000;

canvas.width = baseCanvasWidth;
canvas.height = baseCanvasHeight;

const robotImgs = ROBOT_IMAGES.map(src => {
    const img = new Image();
    img.src = `img/${src}`;
    return img;
});

const soundManager = new SoundManager();

// ============================================================================
// GAME STATE
// ============================================================================
/**
 * Central game state object
 * Contains all mutable game state including players, entities, and configuration
 */
let gameState = {
    initialized: false,
    sessionId: null,
    myAddress: null,
    connectedPlayers: new Set(),
    addressToPlayerIndex: new Map(),
    lastSeenTime: new Map(),
    disconnectedPlayers: new Map(),
    connectionFrozen: false,
    pingInterval: null,
    
    players: [],
    myPlayerIndex: 0,
    currentTurnIndex: 0,
    turnTimeLeft: TURN_TIME,
    turnTimerInterval: null,
    fired: 0,
    
    terrain: [],
    originalTerrain: [],
    wind: 0,
    nextWind: 0,
    mapSize: DEFAULT_MAP_SIZE,
    worldWidth: MAP_SIZES[DEFAULT_MAP_SIZE].width,
    
    projectiles: [],
    explosions: [],
    powerups: [],
    activePowerups: new Map(),
    powerupSpawnTimer: null,
    
    gameId: null,
    gameStarted: false,
    inLobby: true,
    isHost: false,
    
    keys: {},
    touchMoving: null,
    isAiming: false,
    lastMoveSound: 0,
    isMoving: false,
    moveSyncInterval: null,
    
    zoom: 1,
    cameraX: 0,
    cameraY: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartCameraX: 0,
    dragStartCameraY: 0,
    manualCameraControl: false,
    lastManualCameraTime: 0,
    
    touches: [],
    lastTouchDistance: 0,
    messages: []
};

// ============================================================================
// UI REFERENCES
// ============================================================================
const ui = {    
    // Status Display
    turnTimer: document.getElementById('turnTimer'),
    playerInfo: document.getElementById('playerInfo'),
    gameStatus: document.getElementById('gameStatus'),
    windIndicator: null,
    
    // Menu System
    menuBtn: document.getElementById('menuBtn'),
    menuOverlay: document.getElementById('menuOverlay'),
    resumeBtn: document.getElementById('resumeBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    controlsBtn: document.getElementById('controlsBtn'),
    helpBtn: document.getElementById('helpBtn'),
    aboutBtn: document.getElementById('aboutBtn'),
    donateBtn: document.getElementById('donateBtn'),
    
    // Modals
    controlsModal: document.getElementById('controlsModal'),
    helpModal: document.getElementById('helpModal'),
    aboutModal: document.getElementById('aboutModal'),
    donateModal: document.getElementById('donateModal'),
        
    // Dynamic UI Elements (created at runtime)
    backBtn: null,
    mapSizeSelect: null,
    messageBtn: null,
    messageInput: null,
    messagePanel: null,

    joystickLeft: null,
    joystickRight: null
};
