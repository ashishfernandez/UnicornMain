/**
 * Game Logic Module for Unicorn Ranch
 * Contains pure functions that can be unit tested independently
 */

// ============================================
// CONSTANTS
// ============================================

const BASE_DRAIN = { hunger: 1.0, thirst: 1.0, energy: 1.0, fun: 1.0 };
const BASE_RECHARGE = {
  lake: { thirst: 6 },
  field: { hunger: 6 },
  barn: { energy: 8 },
  play: { fun: 6 }
};
const DRAIN_GROWTH = 0.80;    // drain +80% per level
const RECHARGE_GROWTH = 0.30; // recharge +30% per level
const LEVEL_TIME = 30;        // seconds per level

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clamps a value between min and max bounds
 * @param {number} v - The value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} The clamped value
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ============================================
// GAME STATE FUNCTIONS
// ============================================

/**
 * Creates the initial game state
 * @returns {object} Initial game state object
 */
function createInitialState() {
  return {
    x: 15,
    y: 25,
    needs: { hunger: 100, thirst: 100, energy: 100, fun: 100 },
    level: 1,
    levelTime: LEVEL_TIME,
    status: null,
    eaten: false,
    monster: { x: -20, y: 50, chomp: false }
  };
}

/**
 * Calculates the drain multiplier based on level
 * @param {number} level - Current game level
 * @returns {number} The drain multiplier
 */
function calculateDrainMultiplier(level) {
  return 1 + (level - 1) * DRAIN_GROWTH;
}

/**
 * Calculates the recharge multiplier based on level
 * @param {number} level - Current game level
 * @returns {number} The recharge multiplier
 */
function calculateRechargeMultiplier(level) {
  return 1 + (level - 1) * RECHARGE_GROWTH;
}

/**
 * Applies drain to all needs based on level and time delta
 * @param {object} needs - Current needs object {hunger, thirst, energy, fun}
 * @param {number} level - Current game level
 * @param {number} dt - Time delta in seconds
 * @returns {object} Updated needs object
 */
function applyDrain(needs, level, dt) {
  const drainMult = calculateDrainMultiplier(level);
  return {
    hunger: clamp(needs.hunger - BASE_DRAIN.hunger * drainMult * dt, 0, 100),
    thirst: clamp(needs.thirst - BASE_DRAIN.thirst * drainMult * dt, 0, 100),
    energy: clamp(needs.energy - BASE_DRAIN.energy * drainMult * dt, 0, 100),
    fun: clamp(needs.fun - BASE_DRAIN.fun * drainMult * dt, 0, 100)
  };
}

/**
 * Applies recharge to needs based on current zone
 * @param {object} needs - Current needs object {hunger, thirst, energy, fun}
 * @param {string|null} zone - Current zone ('lake', 'field', 'barn', 'play', or null)
 * @param {number} level - Current game level
 * @param {number} dt - Time delta in seconds
 * @returns {object} Updated needs object
 */
function applyRecharge(needs, zone, level, dt) {
  const rechargeMult = calculateRechargeMultiplier(level);
  const updated = { ...needs };

  if (zone === 'lake') {
    updated.thirst = clamp(updated.thirst + BASE_RECHARGE.lake.thirst * rechargeMult * dt, 0, 100);
  }
  if (zone === 'field') {
    updated.hunger = clamp(updated.hunger + BASE_RECHARGE.field.hunger * rechargeMult * dt, 0, 100);
  }
  if (zone === 'barn') {
    updated.energy = clamp(updated.energy + BASE_RECHARGE.barn.energy * rechargeMult * dt, 0, 100);
  }
  if (zone === 'play') {
    updated.fun = clamp(updated.fun + BASE_RECHARGE.play.fun * rechargeMult * dt, 0, 100);
  }

  return updated;
}

/**
 * Updates needs for a single game tick
 * @param {object} needs - Current needs object
 * @param {string|null} zone - Current zone the unicorn is in
 * @param {number} level - Current game level
 * @param {number} dt - Time delta in seconds
 * @returns {object} Updated needs object
 */
function updateNeeds(needs, zone, level, dt) {
  const drained = applyDrain(needs, level, dt);
  return applyRecharge(drained, zone, level, dt);
}

/**
 * Checks if any need has reached zero (game over condition)
 * @param {object} needs - Current needs object
 * @returns {boolean} True if any need is at or below zero
 */
function checkGameOver(needs) {
  return Object.values(needs).some(v => v <= 0);
}

/**
 * Checks if level time has expired (level complete condition)
 * @param {number} levelTime - Current remaining time
 * @returns {boolean} True if level time is at or below zero
 */
function checkLevelComplete(levelTime) {
  return levelTime <= 0;
}

/**
 * Creates the next level state
 * @param {object} currentState - Current game state
 * @returns {object} New state for next level
 */
function createNextLevelState(currentState) {
  return {
    ...currentState,
    level: currentState.level + 1,
    needs: { hunger: 100, thirst: 100, energy: 100, fun: 100 },
    levelTime: LEVEL_TIME,
    status: null,
    eaten: false,
    monster: { x: -20, y: 50, chomp: false }
  };
}

/**
 * Updates the level timer
 * @param {number} currentTime - Current remaining time
 * @param {number} dt - Time delta in seconds
 * @returns {number} New remaining time
 */
function updateLevelTimer(currentTime, dt) {
  return currentTime - dt;
}

/**
 * Creates monster chase state when a need reaches zero
 * @param {object} currentState - Current game state
 * @returns {object} State with monster chase initiated
 */
function createMonsterChaseState(currentState) {
  return {
    ...currentState,
    eaten: true,
    monster: { x: -20, y: currentState.y, chomp: false }
  };
}

/**
 * Gets the zone mapping for display purposes
 * @param {string} zone - Zone identifier
 * @returns {string} Display string for the zone
 */
function getZoneDisplay(zone) {
  const displays = {
    lake: 'Lake 💧',
    field: 'Field 🍎',
    barn: 'Barn 💤',
    play: 'Play 🎈'
  };
  return displays[zone] || null;
}

/**
 * Validates if a position is within valid bounds
 * @param {number} x - X position as percentage (0-100)
 * @param {number} y - Y position as percentage (0-100)
 * @returns {boolean} True if position is valid
 */
function isValidPosition(x, y) {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

/**
 * Clamps a position to valid bounds
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {object} Clamped position {x, y}
 */
function clampPosition(x, y) {
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100)
  };
}

/**
 * Calculates the net change for a specific need based on zone
 * @param {string} needType - The type of need ('hunger', 'thirst', 'energy', 'fun')
 * @param {string|null} zone - The current zone
 * @param {number} level - Current game level
 * @param {number} dt - Time delta
 * @returns {number} Net change (positive = gaining, negative = losing)
 */
function calculateNetNeedChange(needType, zone, level, dt) {
  const drainMult = calculateDrainMultiplier(level);
  const rechargeMult = calculateRechargeMultiplier(level);

  let change = -BASE_DRAIN[needType] * drainMult * dt;

  const zoneToNeed = {
    lake: 'thirst',
    field: 'hunger',
    barn: 'energy',
    play: 'fun'
  };

  if (zone && zoneToNeed[zone] === needType) {
    const rechargeValue = Object.values(BASE_RECHARGE[zone])[0];
    change += rechargeValue * rechargeMult * dt;
  }

  return change;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Constants
  BASE_DRAIN,
  BASE_RECHARGE,
  DRAIN_GROWTH,
  RECHARGE_GROWTH,
  LEVEL_TIME,

  // Utility Functions
  clamp,

  // Game State Functions
  createInitialState,
  calculateDrainMultiplier,
  calculateRechargeMultiplier,
  applyDrain,
  applyRecharge,
  updateNeeds,
  checkGameOver,
  checkLevelComplete,
  createNextLevelState,
  updateLevelTimer,
  createMonsterChaseState,
  getZoneDisplay,
  isValidPosition,
  clampPosition,
  calculateNetNeedChange
};
