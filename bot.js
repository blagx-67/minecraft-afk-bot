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
let isSleeping = false;
let lastHealth = 20;

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

// ============== DAMAGE DETECTION & RECOVERY ==============

bot.on('health', () => {
  const currentHealth = bot.health;
  
  // If bot took damage
  if (currentHealth < lastHealth) {
    console.log(`❤️ Bot took damage! Health: ${currentHealth}/20`);
    
    // Stop sneaking and jump to recover
    if (bot.entity) {
      bot.setControlState('sneak', false);
      bot.entity.velocity.y = 0.42; // Jump to recover
      console.log('⬆️ Jumping to recover from damage!');
      
      // Resume activity after 1 second
      setTimeout(() => {
        if (!isSleeping) {
          performSneak();
        }
      }, 1000);
    }
  }
  
  lastHealth = currentHealth;
});

// ============== AUTO-SLEEP ==============

function findAndUseBed() {
  try {
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
      
      if (bedBlock) {
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
      }
    }
  } catch (err) {
    console.log('⚠️ Sleep error:', err.message);
  }
}

// ============== JUMPING ==============

function performJump() {
  try {
    if (bot.entity && !isSleeping) {
      bot.entity.velocity.y = 0.42;
      console.log('⬆️ Jump!');
    }
  } catch (err) {
    console.log('⚠️ Jump error:', err.message);
  }
}

// ============== SNEAKING ==============

function performSneak() {
  try {
    if (bot.entity && !isSleeping) {
      bot.setControlState('sneak', true);
      console.log('🤫 Sneaking...');
      
      // Sneak for 2 seconds then stop
      setTimeout(() => {
        bot.setControlState('sneak', false);
      }, 2000);
    }
  } catch (err) {
    console.log('⚠️ Sneak error:', err.message);
  }
}

// ============== HEAD MOVEMENT ==============

function moveHead() {
  try {
    if (bot.entity && !isSleeping) {
      // Random head rotation (pitch and yaw)
      const yaw = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * Math.PI;
      
      bot.look(yaw, pitch);
      console.log('🔄 Head moved');
    }
  } catch (err) {
    console.log('⚠️ Head movement error:', err.message);
  }
}

// ============== AFK ROUTINE ==============

function startAFKRoutine() {
  console.log('🎮 Starting AFK routine...');

  // Jump every 15 seconds
  setInterval(() => {
    if (!isSleeping && bot.entity) {
      performJump();
    }
  }, 15000);

  // Sneak every 20 seconds
  setInterval(() => {
    if (!isSleeping && bot.entity) {
      performSneak();
    }
  }, 20000);

  // Move head every 10 seconds
  setInterval(() => {
    if (!isSleeping && bot.entity) {
      moveHead();
    }
  }, 10000);

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

bot.on('message', (message) => {
  const msg = message.toString();
  
  if (msg.includes('stop')) {
    bot.quit();
    console.log('👋 Bot stopped by command');
  }
});

console.log('🚀 Starting Minecraft AFK Bot...');
