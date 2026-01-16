/**
 * UI Manager
 * Event listeners and UI initialization
 * @author IXI Labs
 */

// Virtual Joystick Configuration
const JOYSTICK_CONFIG = {
    SIZE: 120,                // Joystick base size
    KNOB_SIZE: 50,            // Joystick knob size
    MAX_DISTANCE: 50,         // Maximum knob travel distance
    DEADZONE: 0.2,            // Deadzone radius (0-1)
    RETURN_SPEED: 0.15,       // Speed knob returns to center
    OPACITY: 0.6,             // Visual opacity
    SHOW_ALWAYS: false,       // Show always or only when touched
    POSITION_LEFT: 50,        // Position from left edge
    POSITION_BOTTOM: 50       // Position from bottom edge
};

let joystick = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    touchId: null,
    baseElement: null,
    knobElement: null,
    side: 'right' // 'left' or 'right'
};

async function setupTouchControls() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        await loadJoystickPreference();
        setupVirtualJoystick();
    }
}

async function loadJoystickPreference() {
    try {
        const saved = await SpixiAppSdk.getStorageData('settings', 'joystickSide');
        if (saved) {
            joystick.side = saved;
        }

        // Update radio buttons
        if (ui.joystickLeft && ui.joystickRight) {
            if (joystick.side === 'left') {
                ui.joystickLeft.checked = true;
            } else {
                ui.joystickRight.checked = true;
            }
        }
    } catch (error) {
        console.log('Could not load joystick preference:', error);
    }
}

async function setJoystickSide(side) {
    joystick.side = side;

    try {
        await SpixiAppSdk.setStorageData('settings', 'joystickSide', side);
    } catch (error) {
        console.log('Could not save joystick preference:', error);
    }

    // Reposition controls
    updateJoystickSide();
}

function updateJoystickSide() {
    if (!joystick.baseElement) return;

    const positionBottom = JOYSTICK_CONFIG.POSITION_BOTTOM;

    if (joystick.side === 'left') {
        joystick.baseElement.style.left = `${JOYSTICK_CONFIG.POSITION_LEFT}px`;
        joystick.baseElement.style.right = 'auto';
    } else {
        joystick.baseElement.style.left = 'auto';
        joystick.baseElement.style.right = `${JOYSTICK_CONFIG.POSITION_LEFT}px`;
    }
    joystick.baseElement.style.bottom = `${positionBottom}px`;
}

function setupVirtualJoystick() {
    // Create joystick base
    const base = document.createElement('div');
    base.id = 'joystickBase';
    base.style.cssText = `
        position: fixed;
        width: ${JOYSTICK_CONFIG.SIZE}px;
        height: ${JOYSTICK_CONFIG.SIZE}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(100,100,150,${JOYSTICK_CONFIG.OPACITY}) 0%, rgba(50,50,100,${JOYSTICK_CONFIG.OPACITY}) 100%);
        border: 3px solid rgba(200,200,255,0.5);
        z-index: 1000;
        touch-action: none;
        opacity: ${JOYSTICK_CONFIG.SHOW_ALWAYS ? '1' : '0.3'};
        transition: opacity 0.2s;
    `;

    // Create joystick knob
    const knob = document.createElement('div');
    knob.id = 'joystickKnob';
    knob.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        width: ${JOYSTICK_CONFIG.KNOB_SIZE}px;
        height: ${JOYSTICK_CONFIG.KNOB_SIZE}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(200,200,255,0.9) 0%, rgba(150,150,200,0.9) 100%);
        border: 2px solid rgba(255,255,255,0.8);
        transform: translate(-50%, -50%);
        transition: transform 0.1s;
    `;

    base.appendChild(knob);
    document.body.appendChild(base);

    joystick.baseElement = base;
    joystick.knobElement = knob;

    // Position based on side preference
    updateJoystickSide();

    // Touch event handlers
    base.addEventListener('touchstart', handleJoystickStart, { passive: false });
    base.addEventListener('touchmove', handleJoystickMove, { passive: false });
    base.addEventListener('touchend', handleJoystickEnd, { passive: false });
    base.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

    // Also listen on document for better tracking
    document.addEventListener('touchmove', handleJoystickMove, { passive: false });
    document.addEventListener('touchend', handleJoystickEnd, { passive: false });
}
function handleJoystickStart(e) {
    e.preventDefault();

    const touch = e.touches[0];
    if (!touch) return;

    joystick.active = true;
    joystick.touchId = touch.identifier;

    const rect = joystick.baseElement.getBoundingClientRect();
    joystick.startX = rect.left + rect.width / 2;
    joystick.startY = rect.top + rect.height / 2;
    joystick.currentX = touch.clientX;
    joystick.currentY = touch.clientY;

    if (JOYSTICK_CONFIG.SHOW_ALWAYS === false) {
        joystick.baseElement.style.opacity = '1';
    }

    updateJoystickPosition();
}

function handleJoystickMove(e) {
    if (!joystick.active) return;

    e.preventDefault();

    // Find the touch with matching identifier
    for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystick.touchId) {
            joystick.currentX = e.touches[i].clientX;
            joystick.currentY = e.touches[i].clientY;
            updateJoystickPosition();
            break;
        }
    }
}

function handleJoystickEnd(e) {
    if (!joystick.active) return;

    // Check if the released touch is ours
    let touchEnded = true;
    if (e.touches.length > 0) {
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joystick.touchId) {
                touchEnded = false;
                break;
            }
        }
    }

    if (!touchEnded) return;

    e.preventDefault();

    joystick.active = false;
    joystick.touchId = null;

    if (JOYSTICK_CONFIG.SHOW_ALWAYS === false) {
        joystick.baseElement.style.opacity = '0.3';
    }

    // Return knob to center with animation
    joystick.knobElement.style.transform = 'translate(-50%, -50%)';

    // Reset input
    gameState.keys['ArrowLeft'] = false;
    gameState.keys['ArrowRight'] = false;
}

function updateJoystickPosition() {
    const dx = joystick.currentX - joystick.startX;
    const dy = joystick.currentY - joystick.startY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Clamp distance to max
    const clampedDist = Math.min(distance, JOYSTICK_CONFIG.MAX_DISTANCE);

    // Update knob position
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    joystick.knobElement.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    // Calculate input values
    const normalizedDist = clampedDist / JOYSTICK_CONFIG.MAX_DISTANCE;

    // Apply deadzone
    if (normalizedDist < JOYSTICK_CONFIG.DEADZONE) {
        gameState.keys['ArrowLeft'] = false;
        gameState.keys['ArrowRight'] = false;
        return;
    }

    const normalizedX = Math.cos(angle) * normalizedDist;

    if (normalizedX < 0) {
        gameState.keys['ArrowLeft'] = true;
        gameState.keys['ArrowRight'] = false;
    }
    else if (normalizedX > 0) {
        gameState.keys['ArrowLeft'] = false;
        gameState.keys['ArrowRight'] = true;
    }
    else if (normalizedX == 0) {
        gameState.keys['ArrowLeft'] = false;
        gameState.keys['ArrowRight'] = false;
    }
}
