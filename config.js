module.exports = {
  // Server settings
  host: 'localhost',
  port: 25565,
  username: 'AFKBot',
  password: null, // Set to null for offline servers, or your password
  version: '1.20.4',

  // Skin settings
  skinPath: null, // Path to your skin file (e.g., './skin.png') or null for default

  // AFK Behavior
  jumpInterval: 15000,         // Jump every 15 seconds
  sneakInterval: 20000,        // Sneak every 20 seconds
  headMoveInterval: 10000,     // Move head every 10 seconds
  
  // Auto-sleep settings
  autoSleep: true,             // Enable auto-sleep (only works at night!)
  bedSearchRadius: 32,         // Radius to search for beds (blocks)
  sleepInterval: 300000,       // Try to sleep every 5 minutes
  sleepDuration: 10000,        // Sleep for 10 seconds

  // Advanced
  reconnect: true,             // Auto-reconnect on disconnect
  reconnectDelay: 5000         // Delay before reconnecting (ms)
};
