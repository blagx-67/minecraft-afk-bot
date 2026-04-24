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

// Add skin if configured
if (config.skinPath) {
  botOptions.skinPath = config.skinPath;
}

let bot;
let reconnectAttempt = 0;
const maxReconnectAttempts = 5;

// ============== CREATE BOT ==============

function createBot() {
  bot = mineflayer.createBot(botOptions);

  // Track bot state
  let isSleeping = false;
  let lastHealth = 20;

  // ============== EVENTS ==============

  bot.on('login', () => {
    console.log('✅ Bot logged in!');
    console.log(`📍 Position: X=${Math.round(bot.entity.position.x)}, Y=${Math.round(bot.entity.position.y)}, Z=${Math.round(bot.entity.position.z)}`);
    if (config.skinPath) {
      console.log(`👤 Skin applied: ${config.skinPath}`);
    }
    reconnectAttempt = 0; // Reset reconnect counter on successful login
    startAFKRoutine();
  });

  bot.on('end', (reason) => {
    console.log(`❌ Bot disconnected: ${reason}`);
    console.log(`🔄 Reconnecting in 30 seconds... (Attempt ${reconnectAttempt + 1})`);
    reconnectAttempt++;
    
    // Reconnect after 30 seconds
    setTimeout(() => {
      if (reconnectAttempt <= maxReconnectAttempts) {
        console.log('🔗 Attempting to reconnect...');
        createBot();
      } else {
        console.log('❌ Max reconnection attempts reached. Stopping bot.');
        process.exit(1);
      }
    }, 30000);
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
          // Try to sleep with error handling
          bot.sleep(bedBlock, (err) => {
            if (err) {
              // Silently ignore "not night" errors - just try again later
              if (err.message && err.message.includes('not night')) {
                // Do nothing, will try again next interval
              } else if (err.message && err.message.includes('thunderstorm')) {
                // Do nothing, will try again next interval
              } else {
                console.log('⚠️ Sleep error:', err.message);
              }
            } else {
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
    const jumpInterval = setInterval(() => {
      if (!isSleeping && bot.entity) {
        performJump();
      }
    }, 15000);

    // Sneak every 20 seconds
    const sneakInterval = setInterval(() => {
      if (!isSleeping && bot.entity) {
        performSneak();
      }
    }, 20000);

    // Move head every 10 seconds
    const headInterval = setInterval(() => {
      if (!isSleeping && bot.entity) {
        moveHead();
      }
    }, 10000);

    // Sleep routine every 5 minutes (if enabled)
    let sleepInterval;
    if (config.autoSleep) {
      sleepInterval = setInterval(() => {
        findAndUseBed();
      }, config.sleepInterval);
    }

    // Log status every 2 minutes
    const statusInterval = setInterval(() => {
      if (bot.entity) {
        const pos = bot.entity.position;
        console.log(`📊 Status - X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}, Z: ${Math.round(pos.z)}, Health: ${bot.health}/20`);
      }
    }, 120000);

    // Clear intervals on disconnect
    bot.once('end', () => {
      clearInterval(jumpInterval);
      clearInterval(sneakInterval);
      clearInterval(headInterval);
      if (sleepInterval) clearInterval(sleepInterval);
      clearInterval(statusInterval);
    });
  }

  // ============== COMMANDS ==============

  bot.on('message', (message) => {
    const msg = message.toString();
    
    if (msg.includes('stop')) {
      bot.quit();
      console.log('👋 Bot stopped by command');
      process.exit(0);
    }
  });
}

console.log('🚀 Starting Minecraft AFK Bot...');
createBot();
