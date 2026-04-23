const mineflayer = require('mineflayer');
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
    
    // Move to bed and sleep
    bot.pathfinder.goto(new (require('vec3'))(bedPos.x, bedPos.y, bedPos.z), () => {
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
        }
      });
    });
  }
}

// ============== JUMPING ==============

function performJump() {
  bot.entity.velocity.y = 0.42; // Jump velocity
  console.log('⬆️ Jump!');
}

// ============== MOVEMENT ==============

function moveForward() {
  bot.setControlState('forward', true);
  setTimeout(() => {
    bot.setControlState('forward', false);
  }, config.moveDuration);
  console.log('🚶 Moving Forward...');
}

function moveBackward() {
  bot.setControlState('back', true);
  setTimeout(() => {
    bot.setControlState('back', false);
  }, config.moveDuration);
  console.log('🚶 Moving Backward...');
}

function strafeLeft() {
  bot.setControlState('left', true);
  setTimeout(() => {
    bot.setControlState('left', false);
  }, config.moveDuration);
  console.log('🚶 Strafing Left...');
}

function strafeRight() {
  bot.setControlState('right', true);
  setTimeout(() => {
    bot.setControlState('right', false);
  }, config.moveDuration);
  console.log('🚶 Strafing Right...');
}

// ============== AFK ROUTINE ==============

function startAFKRoutine() {
  console.log('🎮 Starting AFK routine...');

  // Jump every 30 seconds
  setInterval(() => {
    if (!isSleeping) {
      performJump();
    }
  }, config.jumpInterval);

  // Movement routine every 45 seconds
  setInterval(() => {
    if (!isSleeping) {
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
    const pos = bot.entity.position;
    console.log(`📊 Status - X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}, Z: ${Math.round(pos.z)}, Health: ${bot.health}/20`);
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
