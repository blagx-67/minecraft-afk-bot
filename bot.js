'use strict';

const { Bot } = require('mineflayer');

const bot = Bot.createBot({
    host: 'localhost',
    port: 25565,
    username: 'Bot'
});

bot.on('spawn', () => {
    // Start moving immediately and move more frequently
    setInterval(() => {
        const directions = ['forward', 'back', 'left', 'right'];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        bot.move(randomDirection);
    }, 1000); // Move every 1 second
});

bot.on('error', (err) => console.log('Error:', err));
bot.on('end', () => console.log('Bot has ended.'));