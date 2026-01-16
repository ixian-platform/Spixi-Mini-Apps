/**
 * Game Constants and Configuration
 * Centralized configuration for Ixian Starwind Arena
 * @author IXI Labs
 */

// ============================================================================
// PHYSICS CONSTANTS
// ============================================================================
const GRAVITY = 0.4;
const WIND_EFFECT = 0.06;
const POWERUP_GRAVITY_FACTOR = 0.5;

// ============================================================================
// GAME TIMING (milliseconds)
// ============================================================================
const TURN_TIME = 30;
const TURN_END_DELAY = 1500;
const RAPID_FIRE_REENABLE_DELAY = 500;
const LOBBY_BROADCAST_INTERVAL = 2000;
const POSITION_SYNC_INTERVAL = 3000;
const MOVEMENT_SYNC_INTERVAL = 50;
const MANUAL_CAMERA_TIMEOUT = 3000;

// Connection and Disconnection Constants
const DISCONNECTION_TIMEOUT = 3000;  // ms before considering player disconnected
const PING_INTERVAL = 1000;  // ms between ping messages
const RECONNECT_TIMEOUT = 60000;  // ms to wait for reconnection before ending game

// ============================================================================
// GAMEPLAY CONSTANTS
// ============================================================================
const EXPLOSION_RADIUS = 40;
const EXPLOSION_MEGA_MULTIPLIER = 2;
const TANK_WIDTH = 46;
const TANK_HEIGHT = 46;
const TERRAIN_HEIGHT = 150;
const TANK_MOVE_SPEED = 1;
const TANK_INITIAL_HEALTH = 100;
const DAMAGE_MULTIPLIER = 60;
const DAMAGE_RADIUS_MULTIPLIER = 1.5;
const SHIELD_DAMAGE_REDUCTION = 0.5;
const PROJECTILE_RADIUS = 5;
const PROJECTILE_POWER_DIVISOR = 5;
const BARREL_LENGTH = 30;
const BARREL_WIDTH = 5;

const PHYSICS_TICK_RATE = 60;

// ============================================================================
// CAMERA CONSTANTS
// ============================================================================
const CAMERA_SMOOTH_FACTOR = 0.08;
const CAMERA_LERP_SPEED = 0.15;

// ============================================================================
// MAP CONFIGURATIONS
// ============================================================================
const MAP_SIZES = {
    small: { width: 1200, segments: 60, name: 'Small' },
    medium: { width: 2400, segments: 100, name: 'Medium' },
    large: { width: 4800, segments: 150, name: 'Large' }
};

const DEFAULT_MAP_SIZE = 'medium';

// Terrain generation parameters
const TERRAIN_CONFIG = {
    NOISE_1_AMPLITUDE: 40,
    NOISE_1_FREQUENCY: 0.08,
    NOISE_2_AMPLITUDE: 25,
    NOISE_2_FREQUENCY: 0.15,
    NOISE_3_AMPLITUDE: 10,
    NOISE_3_FREQUENCY: 0.3,
    PILLAR_CHANCE: 0.15,
    PILLAR_HEIGHT: 180,
    VALLEY_CHANCE: 0.10,
    VALLEY_DEPTH: 100,
    MIN_HEIGHT: 60,
    MAX_HEIGHT: 350,
    SMOOTHING_THRESHOLD: 100,
    SMOOTHING_MAX: 120
};

// ============================================================================
// UI CONSTANTS
// ============================================================================
const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
const ROBOT_IMAGES = ['robot-red.svg', 'robot-cyan.svg', 'robot-blue.svg', 'robot-orange.svg'];
const MOVE_SOUND_INTERVAL = 150; // ms between move sounds

// Default control values
const DEFAULT_ANGLE = 45;
const DEFAULT_POWER = 50;
const MAX_ANGLE = 90;

// Player spawn constraints
const SPAWN_EDGE_MARGIN = 100;
const SPAWN_MIN_DISTANCE = 0.25; // As fraction of world width
const SPAWN_MAX_TERRAIN_HEIGHT = 300;
const SPAWN_MIN_TERRAIN_HEIGHT = 100;
const SPAWN_MAX_ATTEMPTS = 100;

// ============================================================================
// COLLISION DEBUG
// ============================================================================
const COLLISION_DEBUG_ENABLED = false; // Set to true to visualize collision boxes
const COLLISION_DEBUG_TERRAIN = true;  // Show terrain collision
const COLLISION_DEBUG_TANKS = true;    // Show tank collision boxes
const COLLISION_DEBUG_PROJECTILES = true; // Show projectile collision

// ============================================================================
// POWERUP CONSTANTS
// ============================================================================
const POWERUP_SPAWN_INTERVAL = 15000;
const POWERUP_FIRST_SPAWN_DELAY = 10000;
const POWERUP_DURATION = 10000;
const POWERUP_SIZE = 30;
const HEALTH_POWERUP_AMOUNT = 30;

const POWERUP_TYPES = [
    { id: 'rapidfire', name: 'Rapid Fire', color: '#FFD700', emoji: '⚡', effect: 'No turn delay after firing' },
    { id: 'megapower', name: 'Mega Power', color: '#FF4500', emoji: '💥', effect: 'Double explosion radius' },
    { id: 'shield', name: 'Shield', color: '#00CED1', emoji: '🛡️', effect: 'Absorb 50% damage' },
    { id: 'multishot', name: 'Multi-Shot', color: '#FF1493', emoji: '🎯', effect: 'Fire 3 projectiles' },
    { id: 'health', name: 'Health Pack', color: '#32CD32', emoji: '❤️', effect: 'Restore 30 health' },
    { id: 'teleport', name: 'Teleport', color: '#9370DB', emoji: '🌀', effect: 'Random repositioning' }
];
