// src/server.js
const app = require('./app');
const os = require('os');
const { ensureExpiryScheduler, processExpiryAndActivateRenewals } = require('./src/utils/scheduler.util');
const PORT = process.env.PORT || 4000;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

app.listen(PORT, () => {
  const ip = getLocalIp();
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Server listening on http://${ip}:${PORT}`);
  ensureExpiryScheduler();
  processExpiryAndActivateRenewals();
});
