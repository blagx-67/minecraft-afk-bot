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
  let isAttemptingSleep = false; // Guard against concurrent sleep attempts
  let wakeTimeout = null;        // Track wake timer so it can be cancelled
  let lastHealth = 20;

  // ============== EVENTS ==============

  bot.on('login', () => {
    console.log('✅ Bot logged in!');
    console.log(`📍 Position: X=${Math.round(bot.entity.position.x)}, Y=${Math.round(bot.entity.position.y)}, Z=${Math.round(bot.entity.position.z)}`);
    if (config.skinPath) {
      console.log(`👤 Skin applied: ${config.skinPath}`);
    }
    reconnectAttempt = 0;
    startAFKRoutine();
  });

  bot.on('end', (reason) => {
    console.log(`❌ Bot disconnected: ${reason}`);
    isSleeping = false;
    isAttemptingSleep = false;
    if (wakeTimeout) {
      clearTimeout(wakeTimeout);
      wakeTimeout = null;
    }
    reconnectAttempt++;
    setTimeout(() => {
      if (reconnectAttempt <= maxReconnectAttempts) {
        console.log(`🔗 Attempting to reconnect... (Attempt ${reconnectAttempt})`);
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

  // ============== SLEEP / WAKE EVENTS ==============
  // These fire when the server confirms the state change,
  // so they are the single source of truth for isSleeping.

  bot.on('sleep', () => {
    console.log('🛏️ Sleeping...');
    isSleeping = true;
    isAttemptingSleep = false;

    // Schedule a wake-up; cancel it if bot wakes naturally first
    wakeTimeout = setTimeout(async () => {
      wakeTimeout = null;
      if (isSleeping) {
        try {
          await bot.wake();
          // 'wake' event below will set isSleeping = false
        } catch (err) {
          // Already awake (e.g. night ended) — just sync the flag
          isSleeping = false;
          console.log('⏰ Already awake (night ended).');
        }
      }
    }, config.sleepDuration);
  });

  bot.on('wake', () => {
    console.log('⏰ Woke up!');
    isSleeping = false;
    isAttemptingSleep = false;
    // Cancel the scheduled wake timer if the server woke us naturally
    if (wakeTimeout) {
      clearTimeout(wakeTimeout);
      wakeTimeout = null;
    }
  });

  // ============== DAMAGE DETECTION & RECOVERY ==============

  bot.on('health', () => {
    const currentHealth = bot.health;

    if (currentHealth < lastHealth) {
      console.log(`❤️ Bot took damage! Health: ${currentHealth}/20`);

      if (bot.entity && !isSleeping) {
        bot.setControlState('sneak', false);
        bot.entity.velocity.y = 0.42;
        console.log('⬆️ Jumping to recover from damage!');

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

  async function findAndUseBed() {
    // Don't try if already sleeping or mid-attempt
    if (isSleeping || isAttemptingSleep) return;

    try {
      const beds = bot.findBlocks({
        matching: (block) => block.name && block.name.includes('bed'),
        maxDistance: config.bedSearchRadius,
        count: 1
      });

      if (beds.length === 0) return;

      const bedBlock = bot.blockAt(beds[0]);
      if (!bedBlock) return;

      isAttemptingSleep = true;

      // bot.sleep() is Promise-based in Mineflayer v4+
      await bot.sleep(bedBlock);
      // Success is handled by the 'sleep' event above

    } catch (err) {
      isAttemptingSleep = false;

      // Silently ignore expected "can't sleep" conditions
      const msg = err.message || '';
      if (
        msg.includes('not night') ||
        msg.includes('thunderstorm') ||
        msg.includes('too far') ||
        msg.includes('obstructed') ||
        msg.includes('can\'t sleep')
      ) {
        // Not an error worth logging — just try again next interval
        return;
      }

      console.log('⚠️ Sleep error:', msg);
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

    const jumpInterval = setInterval(() => {
      if (!isSleeping && bot.entity) performJump();
    }, config.jumpInterval || 15000);

    const sneakInterval = setInterval(() => {
      if (!isSleeping && bot.entity) performSneak();
    }, config.sneakInterval || 20000);

    const headInterval = setInterval(() => {
      if (!isSleeping && bot.entity) moveHead();
    }, config.headMoveInterval || 10000);

    let sleepInterval;
    if (config.autoSleep) {
      sleepInterval = setInterval(() => {
        findAndUseBed();
      }, config.sleepInterval);
    }

    const statusInterval = setInterval(() => {
      if (bot.entity) {
        const pos = bot.entity.position;
        console.log(`📊 Status - X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}, Z: ${Math.round(pos.z)}, Health: ${bot.health}/20`);
      }
    }, 120000);

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
