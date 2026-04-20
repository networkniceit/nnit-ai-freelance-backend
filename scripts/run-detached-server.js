const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'backend-server-production.js');

const out = spawn(process.execPath, [serverPath], {
  detached: true,
  stdio: 'ignore'
});

out.unref();
console.log('Started detached server with pid', out.pid);
