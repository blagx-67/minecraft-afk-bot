const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const config = require('./config');
require('dotenv').config();

const botOptions = {
  host: process.env.HOST || config.host,
  port: process.env.PORT || config.port,
  username: process.env.USERNAME || config.username,
  password: process.env.PASSWORD || config.password,
  version: config.version
};

const bot = mineflayer.createBot(botOptions);

// Load pathfinder plugin
bot.loadPlugin(pathfinder);

// Track bot state
let isMoving = false;
let isSleeping = false;

// ============== EVENTS ==============

bot.on('login', () => {
  console.log('✅ Bot logged in!');
  console.log(`📍 Position: X=${Math.round(bot.entity.position.x)}, Y=${Math.round(bot.entity.position.y)}, Z=${Math.round(bot.entity.position.z)}`);
  startAFKRoutine();
});

bot.on('end', (reason) => {
  console.log(`❌ Bot disconnected: ${reason}`);
  process.exit(0);
});

bot.on('error', (err) => {
  console.error(`⚠️ Error: ${err.message}`);
});

bot.on('kicked', (reason) => {
  console.log(`🚫 Kicked from server: ${reason}`);
});

bot.on('spawn', () => {
  console.log('🌍 Bot spawned into the world!');
});

// ============== AUTO-SLEEP ==============

function findAndUseBed() {
  if (!bot.pathfinder) {
    console.log('⚠️ Pathfinder not ready yet');
    return;
  }

  const beds = bot.findBlocks({
    matching: (block) => {
      const name = block.name;
      return name && name.includes('bed');
    },
    maxDistance: config.bedSearchRadius,
    count: 1
  });

  if (beds.length > 0) {
    const bedPos = beds[0];
    const bedBlock = bot.blockAt(bedPos);
    
    if (!bedBlock) {
      console.log('⚠️ Bed block not found');
      return;
    }
    
    // Move to bed and sleep
    bot.pathfinder.goto(bedBlock.position, () => {
      bot.sleep(bedBlock, (err) => {
        if (!err) {
          console.log('🛏️ Sleeping...');
          isSleeping = true;
          setTimeout(() => {
            bot.wake((err) => {
              if (!err) {
                console.log('⏰ Woke up!');
                isSleeping = false;
              }
            });
          }, config.sleepDuration);
        } else {
          console.log('⚠️ Could not sleep:', err.message);
        }
      });
    });
  }
}

// ============== JUMPING ==============

function performJump() {
  try {
    bot.entity.velocity.y = 0.42; // Jump velocity
    console.log('⬆️ Jump!');
  } catch (err) {
    console.log('⚠️ Jump failed:', err.message);
  }
}

// ============== MOVEMENT ==============

function moveForward() {
  try {
    bot.setControlState('forward', true);
    setTimeout(() => {
      bot.setControlState('forward', false);
    }, config.moveDuration);
    console.log('🚶 Moving Forward...');
  } catch (err) {
    console.log('⚠️ Move forward failed:', err.message);
  }
}

function moveBackward() {
  try {
    bot.setControlState('back', true);
    setTimeout(() => {
      bot.setControlState('back', false);
    }, config.moveDuration);
    console.log('🚶 Moving Backward...');
  } catch (err) {
    console.log('⚠️ Move backward failed:', err.message);
  }
}

function strafeLeft() {
  try {
    bot.setControlState('left', true);
    setTimeout(() => {
      bot.setControlState('left', false);
    }, config.moveDuration);
    console.log('🚶 Strafing Left...');
  } catch (err) {
    console.log('⚠️ Strafe left failed:', err.message);
  }
}

function strafeRight() {
  try {
    bot.setControlState('right', true);
    setTimeout(() => {
      bot.setControlState('right', false);
    }, config.moveDuration);
    console.log('🚶 Strafing Right...');
  } catch (err) {
    console.log('⚠️ Strafe right failed:', err.message);
  }
}

// ============== AFK ROUTINE ==============

function startAFKRoutine() {
  console.log('🎮 Starting AFK routine...');

  // Jump every 30 seconds
  setInterval(() => {
    if (!isSleeping && bot.entity) {
      performJump();
    }
  }, config.jumpInterval);

  // Movement routine every 45 seconds
  setInterval(() => {
    if (!isSleeping && bot.entity) {
      const movements = [moveForward, moveBackward, strafeLeft, strafeRight];
      const randomMovement = movements[Math.floor(Math.random() * movements.length)];
      randomMovement();
    }
  }, config.movementInterval);

  // Sleep routine every 5 minutes (if enabled)
  if (config.autoSleep) {
    setInterval(() => {
      findAndUseBed();
    }, config.sleepInterval);
  }

  // Log status every 2 minutes
  setInterval(() => {
    if (bot.entity) {
      const pos = bot.entity.position;
      console.log(`📊 Status - X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}, Z: ${Math.round(pos.z)}, Health: ${bot.health}/20`);
    }
  }, 120000);
}

// ============== COMMANDS ==============

// Optional: Chat commands
bot.on('message', (message) => {
  const msg = message.toString();
  
  if (msg.includes('stop')) {
    bot.quit();
    console.log('👋 Bot stopped by command');
  }
});

console.log('🚀 Starting Minecraft AFK Bot...');
