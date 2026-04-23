# Minecraft AFK Bot 🤖

A powerful Minecraft AFK bot built with **Mineflayer** that automatically performs actions to keep you active on AFK servers.

## Features ✨

- **Auto-Sleep** 🛏️ - Automatically finds and uses beds when configured
- **Auto-Jump** ⬆️ - Performs jumping at regular intervals to prevent AFK kicks
- **Auto-Move** 🚶 - Randomly walks forward, backward, left, and right
- **Configurable** ⚙️ - Easy-to-customize timings and behaviors
- **Error Handling** ✅ - Robust connection management
- **Status Logging** 📊 - Real-time position and health tracking

## Requirements 📦

- **Node.js** 14.0.0 or higher
- **npm** (comes with Node.js)
- A Minecraft Java Edition server to connect to

## Installation 🚀

1. **Clone the repository:**
   ```bash
   git clone https://github.com/blagx-67/minecraft-afk-bot.git
   cd minecraft-afk-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your server details:**
   ```
   HOST=your.server.ip
   PORT=25565
   USERNAME=YourUsername
   PASSWORD=your_password
   ```
   - `PASSWORD` can be left empty for offline servers
   - `HOST` is your server IP address
   - `PORT` is usually 25565 (default Minecraft port)

## Usage 🎮

Start the bot:
```bash
npm start
```

The bot will:
- Log into your Minecraft server
- Begin jumping every 30 seconds
- Move randomly every 45 seconds
- Sleep in a bed every 5 minutes (if enabled and available)
- Log its position and health every 2 minutes

## Configuration ⚙️

Edit `config.js` to customize bot behavior:

```javascript
jumpInterval: 30000,         // Jump every 30 seconds
movementInterval: 45000,     // Move every 45 seconds
moveDuration: 2000,          // Duration of each movement (2 seconds)
autoSleep: true,             // Enable auto-sleeping
bedSearchRadius: 32,         // Search radius for beds
sleepInterval: 300000,       // Try to sleep every 5 minutes
sleepDuration: 10000,        // Sleep for 10 seconds
```

## Stopping the Bot 🛑

Press `Ctrl + C` in your terminal to stop the bot gracefully.

## Troubleshooting 🔧

**Bot can't connect to server:**
- Verify the `HOST` and `PORT` in `.env`
- Make sure your username is correct
- Check if the server is online
- For offline servers, remove the password

**Bot gets kicked for inactivity:**
- Reduce `jumpInterval` to jump more frequently
- Reduce `movementInterval` for more movement
- Enable `autoSleep` if beds are available

**Bot isn't moving:**
- Check if movement values in `config.js` are correct
- Verify the bot has space to move around

## Security ⚠️

- Never commit your `.env` file to version control
- Keep your Minecraft password secure
- Use `.gitignore` to prevent accidental exposure

## License 📄

MIT License - Feel free to use and modify!

## Support 💬

For issues or questions, open a GitHub issue in this repository.

---

**Made with ❤️ for AFK gaming**
