module.exports = {
  // Server settings
  host: 'localhost',
  port: 25565,
  username: 'AFKBot',
  password: null, // Set to null for offline servers, or your password
  version: '1.20.4',

  // AFK Behavior
  jumpInterval: 30000,         // Jump every 30 seconds
  movementInterval: 45000,     // Move every 45 seconds
  moveDuration: 2000,          // Duration of each movement (ms)
  
  // Auto-sleep settings
  autoSleep: true,             // Enable auto-sleep
  bedSearchRadius: 32,         // Radius to search for beds (blocks)
  sleepInterval: 300000,       // Try to sleep every 5 minutes
  sleepDuration: 10000,        // Sleep for 10 seconds

  // Advanced
  reconnect: true,             // Auto-reconnect on disconnect
  reconnectDelay: 5000         // Delay before reconnecting (ms)
};