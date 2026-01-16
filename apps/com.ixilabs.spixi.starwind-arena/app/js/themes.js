/**
 * Game Themes System
 * Provides different visual themes for Ixian Starwind Arena
 * Themes are client-side only and don't affect gameplay
 */

const THEMES = {
    neon: {
        name: 'Neon',
        description: 'Classic futuristic neon aesthetic',
        sky: {
            gradient: [
                { stop: 0, color: '#0a0a1a' },
                { stop: 0.3, color: '#1a0a2e' },
                { stop: 0.6, color: '#2d1b4e' },
                { stop: 1, color: '#16213e' }
            ],
            starColor: 'rgba(255, 255, 255, %brightness%)',
            nebulaColor: 'rgba(138, 43, 226, %opacity%)'
        },
        terrain: {
            gradient: [
                { stop: 0, color: '#1a1a2e' },
                { stop: 0.3, color: '#16213e' },
                { stop: 0.7, color: '#0f3460' },
                { stop: 1, color: '#1a0a2e' }
            ],
            outline: '#00ffff',
            destroyed: {
                gradient: [
                    { stop: 0, color: '#3a1a1a' },
                    { stop: 0.5, color: '#2a1616' },
                    { stop: 1, color: '#1a0a0a' }
                ],
                outline: '#ff6b6b',
                outlineGlow: '#ff0000'
            }
        },
        ui: {
            primaryGlow: 'rgba(0, 255, 255, 0.5)',
            primaryColor: '#00ffff',
            accentColor: '#ff00ff',
            textColor: 'white'
        },
        projectile: {
            trail: 'rgba(255, 200, 0, 0.6)',
            trailGlow: '#ff8800',
            glow: [
                { stop: 0, color: 'rgba(255, 255, 100, 1)' },
                { stop: 0.3, color: 'rgba(255, 150, 0, 0.8)' },
                { stop: 0.7, color: 'rgba(255, 50, 0, 0.4)' },
                { stop: 1, color: 'rgba(255, 0, 0, 0)' }
            ],
            core: '#fff'
        },
        explosion: {
            outline: 'rgba(255, 255, 255, %alpha%)',
            outlineGlow: '#ffaa00',
            inner: [
                { stop: 0, color: 'rgba(255, 100, 0, %alpha%)' },
                { stop: 0.5, color: 'rgba(255, 50, 0, %alpha%)' },
                { stop: 1, color: 'rgba(100, 0, 0, 0)' }
            ],
            middle: [
                { stop: 0, color: 'rgba(255, 255, 200, %alpha%)' },
                { stop: 0.3, color: 'rgba(255, 150, 0, %alphamul:0.8%)' },
                { stop: 0.7, color: 'rgba(255, 50, 0, %alphamul:0.5%)' },
                { stop: 1, color: 'rgba(255, 0, 0, 0)' }
            ],
            spark: 'rgba(255, 200, 0, %alpha%)',
            sparkGlow: '#f60'
        }
    },
    cyberpunk: {
        name: 'Cyberpunk',
        description: 'Dark industrial cyberpunk theme',
        sky: {
            gradient: [
                { stop: 0, color: '#0d0221' },
                { stop: 0.3, color: '#1a0033' },
                { stop: 0.6, color: '#2d0052' },
                { stop: 1, color: '#1a0f33' }
            ],
            starColor: 'rgba(255, 0, 127, %brightness%)',
            nebulaColor: 'rgba(255, 0, 127, %opacity%)'
        },
        terrain: {
            gradient: [
                { stop: 0, color: '#0a0a15' },
                { stop: 0.3, color: '#15101f' },
                { stop: 0.7, color: '#0f0520' },
                { stop: 1, color: '#0d0221' }
            ],
            outline: '#ff007f',
            destroyed: {
                gradient: [
                    { stop: 0, color: '#2a0a1a' },
                    { stop: 0.5, color: '#1a0510' },
                    { stop: 1, color: '#0a0a0a' }
                ],
                outline: '#ff0066',
                outlineGlow: '#cc0055'
            }
        },
        ui: {
            primaryGlow: 'rgba(255, 0, 127, 0.5)',
            primaryColor: '#ff007f',
            accentColor: '#00ff88',
            textColor: '#e0e0e0'
        },
        projectile: {
            trail: 'rgba(255, 0, 127, 0.6)',
            trailGlow: '#ff0066',
            glow: [
                { stop: 0, color: 'rgba(255, 0, 127, 1)' },
                { stop: 0.3, color: 'rgba(255, 0, 100, 0.8)' },
                { stop: 0.7, color: 'rgba(200, 0, 80, 0.4)' },
                { stop: 1, color: 'rgba(150, 0, 0, 0)' }
            ],
            core: '#ffff00'
        },
        explosion: {
            outline: 'rgba(255, 0, 127, %alpha%)',
            outlineGlow: '#ff0066',
            inner: [
                { stop: 0, color: 'rgba(255, 0, 100, %alpha%)' },
                { stop: 0.5, color: 'rgba(200, 0, 80, %alpha%)' },
                { stop: 1, color: 'rgba(100, 0, 0, 0)' }
            ],
            middle: [
                { stop: 0, color: 'rgba(255, 200, 0, %alpha%)' },
                { stop: 0.3, color: 'rgba(255, 0, 127, %alpha%)' },
                { stop: 0.7, color: 'rgba(200, 0, 80, %alpha%)' },
                { stop: 1, color: 'rgba(150, 0, 0, 0)' }
            ],
            spark: 'rgba(255, 0, 127, %alpha%)',
            sparkGlow: '#ff0066'
        }
    },
    forest: {
        name: 'Forest',
        description: 'Photorealistic forest environment with dynamic lighting',
        sky: {
            gradient: [
                { stop: 0, color: '#1e4d7b' },          // Deep zenith blue
                { stop: 0.3, color: '#3a7bd5' },        // Rich sky blue
                { stop: 0.6, color: '#6dd5fa' },        // Bright atmospheric blue
                { stop: 0.85, color: '#b8e9f7' },       // Horizon haze
                { stop: 1, color: '#e0f7fa' }           // Horizon glow
            ],
            starColor: 'rgba(255, 250, 230, %brightness%)',     // Sun glare
            nebulaColor: 'rgba(255, 255, 255, %opacity%)'       // Clouds
        },
        terrain: {
            gradient: [
                { stop: 0, color: '#1e3c00' },          // Deep shadow grass
                { stop: 0.2, color: '#2d5a00' },        // Forest floor
                { stop: 0.4, color: '#4b7a00' },        // Mid-tone grass
                { stop: 0.6, color: '#6aa81f' },        // Sunlit grass
                { stop: 0.8, color: '#8bc34a' },        // Highlights
                { stop: 1, color: '#33691e' }           // Texture depth
            ],
            outline: '#1b3308',                          // Dark organic edge
            destroyed: {
                gradient: [
                    { stop: 0, color: '#3e2723' },      // Dark peat
                    { stop: 0.3, color: '#5d4037' },    // Rich soil
                    { stop: 0.5, color: '#795548' },    // Dry earth
                    { stop: 0.7, color: '#4e342e' },    // Shadowed dirt
                    { stop: 1, color: '#281a16' }       // Deep crater
                ],
                outline: '#1a100d',                      // Crater edge
                outlineGlow: '#000000'                   // Shadow
            }
        },
        ui: {
            primaryGlow: 'rgba(100, 221, 23, 0.4)',     // Vibrant leaf glow
            primaryColor: '#76ff03',                     // High-vis green
            accentColor: '#ff6f00',                      // Amber accent
            textColor: '#f1f8e9'                         // Light text for contrast
        },
        projectile: {
            trail: 'rgba(255, 255, 255, 0.4)',          // Smoke trail
            trailGlow: '#cfd8dc',                        // Smoke glow
            glow: [
                { stop: 0, color: 'rgba(255, 160, 0, 1)' },         // Muzzle flash/Heat
                { stop: 0.3, color: 'rgba(255, 87, 34, 0.9)' },     // Fire
                { stop: 0.7, color: 'rgba(62, 39, 35, 0.5)' },      // Smoke
                { stop: 1, color: 'rgba(0, 0, 0, 0)' }              // Dissipate
            ],
            core: '#263238'                              // Metallic shell
        },
        explosion: {
            outline: 'rgba(255, 255, 255, %alpha%)',    // Shockwave
            outlineGlow: '#ffeb3b',                      // Flash
            inner: [
                { stop: 0, color: 'rgba(255, 235, 59, %alpha%)' },     // White hot center
                { stop: 0.4, color: 'rgba(255, 152, 0, %alpha%)' },    // Fire body
                { stop: 1, color: 'rgba(191, 54, 12, 0)' }             // Dark fire
            ],
            middle: [
                { stop: 0, color: 'rgba(255, 87, 34, %alpha%)' },      // Fire cloud
                { stop: 0.3, color: 'rgba(121, 85, 72, %alphamul:0.8%)' }, // Dirt/Smoke
                { stop: 0.7, color: 'rgba(62, 39, 35, %alphamul:0.6%)' },  // Dark smoke
                { stop: 1, color: 'rgba(0, 0, 0, 0)' }                     // Clear
            ],
            spark: 'rgba(255, 193, 7, %alpha%)',        // Sparks
            sparkGlow: '#ff6f00'                         // Spark glow
        }
    },
    ocean: {
        name: 'Ocean',
        description: 'Cool blue oceanic theme',
        sky: {
            gradient: [
                { stop: 0, color: '#001a33' },
                { stop: 0.3, color: '#001d4d' },
                { stop: 0.6, color: '#002266' },
                { stop: 1, color: '#000d1a' }
            ],
            starColor: 'rgba(100, 200, 255, %brightness%)',
            nebulaColor: 'rgba(0, 191, 255, %opacity%)'
        },
        terrain: {
            gradient: [
                { stop: 0, color: '#001a33' },
                { stop: 0.3, color: '#001f40' },
                { stop: 0.7, color: '#001a4d' },
                { stop: 1, color: '#000d1a' }
            ],
            outline: '#00bfff',
            destroyed: {
                gradient: [
                    { stop: 0, color: '#1a2a3a' },
                    { stop: 0.5, color: '#101820' },
                    { stop: 1, color: '#0a0a0a' }
                ],
                outline: '#ff5555',
                outlineGlow: '#dd0000'
            }
        },
        ui: {
            primaryGlow: 'rgba(0, 191, 255, 0.5)',
            primaryColor: '#00bfff',
            accentColor: '#00ffff',
            textColor: '#ffffff'
        },
        projectile: {
            trail: 'rgba(100, 200, 255, 0.6)',
            trailGlow: '#0099ff',
            glow: [
                { stop: 0, color: 'rgba(100, 200, 255, 1)' },
                { stop: 0.3, color: 'rgba(0, 150, 255, 0.8)' },
                { stop: 0.7, color: 'rgba(0, 100, 200, 0.4)' },
                { stop: 1, color: 'rgba(0, 50, 150, 0)' }
            ],
            core: '#ffff99'
        },
        explosion: {
            outline: 'rgba(255, 255, 255, %alpha%)',
            outlineGlow: '#0099ff',
            inner: [
                { stop: 0, color: 'rgba(100, 200, 255, %alpha%)' },
                { stop: 0.5, color: 'rgba(50, 150, 255, %alpha%)' },
                { stop: 1, color: 'rgba(0, 50, 150, 0)' }
            ],
            middle: [
                { stop: 0, color: 'rgba(135, 206, 250, %alpha%)' },
                { stop: 0.3, color: 'rgba(100, 200, 255, %alpha%)' },
                { stop: 0.7, color: 'rgba(0, 150, 255, %alpha%)' },
                { stop: 1, color: 'rgba(0, 100, 200, 0)' }
            ],
            spark: 'rgba(100, 200, 255, %alpha%)',
            sparkGlow: '#0099ff'
        }
    },
    lava: {
        name: 'Lava',
        description: 'Hot volcanic theme',
        sky: {
            gradient: [
                { stop: 0, color: '#330a0a' },
                { stop: 0.3, color: '#4d0f0a' },
                { stop: 0.6, color: '#6b2c1f' },
                { stop: 1, color: '#1a0a0a' }
            ],
            starColor: 'rgba(255, 140, 0, %brightness%)',
            nebulaColor: 'rgba(255, 69, 0, %opacity%)'
        },
        terrain: {
            gradient: [
                { stop: 0, color: '#2a1a0a' },
                { stop: 0.3, color: '#3a2010' },
                { stop: 0.7, color: '#4a2a15' },
                { stop: 1, color: '#1a0a0a' }
            ],
            outline: '#ff6600',
            destroyed: {
                gradient: [
                    { stop: 0, color: '#4a1a0a' },
                    { stop: 0.5, color: '#2a1010' },
                    { stop: 1, color: '#0a0a0a' }
                ],
                outline: '#ff3300',
                outlineGlow: '#ff0000'
            }
        },
        ui: {
            primaryGlow: 'rgba(255, 69, 0, 0.5)',
            primaryColor: '#ff6600',
            accentColor: '#ffaa00',
            textColor: '#ffffff'
        },
        projectile: {
            trail: 'rgba(255, 140, 0, 0.6)',
            trailGlow: '#ff5500',
            glow: [
                { stop: 0, color: 'rgba(255, 140, 0, 1)' },
                { stop: 0.3, color: 'rgba(255, 100, 0, 0.8)' },
                { stop: 0.7, color: 'rgba(200, 70, 0, 0.4)' },
                { stop: 1, color: 'rgba(150, 40, 0, 0)' }
            ],
            core: '#ffff99'
        },
        explosion: {
            outline: 'rgba(255, 200, 100, %alpha%)',
            outlineGlow: '#ff5500',
            inner: [
                { stop: 0, color: 'rgba(255, 140, 0, %alpha%)' },
                { stop: 0.5, color: 'rgba(255, 100, 0, %alpha%)' },
                { stop: 1, color: 'rgba(200, 50, 0, 0)' }
            ],
            middle: [
                { stop: 0, color: 'rgba(255, 160, 0, %alpha%)' },
                { stop: 0.3, color: 'rgba(255, 140, 0, %alpha%)' },
                { stop: 0.7, color: 'rgba(255, 100, 0, %alpha%)' },
                { stop: 1, color: 'rgba(255, 0, 0, 0)' }
            ],
            spark: 'rgba(255, 140, 0, %alpha%)',
            sparkGlow: '#ff5500'
        }
    }
};

// Current active theme
let currentTheme = THEMES.neon;

/**
 * Set the current theme
 * @param {string} themeName - The name of the theme (key in THEMES object)
 */
function setTheme(themeName) {
    if (THEMES[themeName]) {
        currentTheme = THEMES[themeName];
        SpixiAppSdk.setStorageData('settings', 'selectedTheme', themeName);
    }
}

/**
 * Get the current theme
 * @returns {object} The current theme object
 */
function getTheme() {
    return currentTheme;
}

/**
 * Initialize theme from localStorage
 */
async function initializeTheme() {
    const saved = await SpixiAppSdk.getStorageData('settings', 'selectedTheme');
    if (saved && THEMES[saved]) {
        setTheme(saved);
    }
}

/**
 * Interpolate color variables in theme strings
 * Supports: %alpha%, %brightness%, %opacity%, etc.
 * @param {string} colorStr - Color string with potential %variable% placeholders
 * @param {object} vars - Variables to interpolate
 * @returns {string} Interpolated color string
 */
function interpolateColor(colorStr, vars = {}) {
    let result = colorStr;
    
    // Handle special %alphamul:value% syntax for multiplied alpha
    if (result.includes('%alphamul:')) {
        const alphamulMatch = result.match(/%alphamul:([\d.]+)%/);
        if (alphamulMatch && vars.alpha !== undefined) {
            const multiplier = parseFloat(alphamulMatch[1]);
            const newAlpha = vars.alpha * multiplier;
            result = result.replace(/%alphamul:[\d.]+%/, newAlpha);
        }
    }
    
    // Replace standard variables
    for (const [key, value] of Object.entries(vars)) {
        if (key !== 'alpha') { // alpha is handled separately
            result = result.replace(new RegExp(`%${key}%`, 'g'), value);
        }
    }
    
    // Replace remaining %alpha% placeholders
    if (vars.alpha !== undefined) {
        result = result.replace(/%alpha%/g, vars.alpha);
    }
    
    return result;
}
