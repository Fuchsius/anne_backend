const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');
const os = require('os');

router.get('/', (req, res) => {
  // Add explicit CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Get uptime in a readable format
  const uptimeSeconds = process.uptime();
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
  const formattedUptime = `${uptimeHours}h ${uptimeMinutes}m`;
  
  // Basic response for all environments
  const response = {
    status: 'ok',
    version: packageInfo.version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
  
  // Add detailed info only in development environment
  if (process.env.NODE_ENV !== 'production') {
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100;
    const memoryTotalMB = Math.round(os.totalmem() / 1024 / 1024 * 100) / 100;
    
    response.uptime = formattedUptime;
    response.memory = {
      used: `${memoryUsedMB} MB`,
      total: `${memoryTotalMB} MB`
    };
    response.platform = process.platform;
    response.nodeVersion = process.version;
  }
  
  res.json(response);
});

module.exports = router; 