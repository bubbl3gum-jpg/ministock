#!/usr/bin/env node
// scripts/start-electron.js
// Launch electron pointing at the `frontend` folder so the renderer loads `frontend/index.html`.
const { spawn } = require('child_process');
const path = require('path');

const electronCmd = process.env.npm_execpath && process.env.npm_execpath.includes('yarn')
    ? 'electron'
    : 'npx';

const frontendPath = path.join(__dirname, '..', 'frontend');

// Use npx to run electron so local node_modules electron is used when available
const child = spawn(electronCmd, electronCmd === 'npx' ? ['electron', frontendPath] : [frontendPath], {
    stdio: 'inherit',
    shell: false
});

child.on('close', (code) => {
    process.exit(code);
});
