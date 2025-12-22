// server/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./api');

const app = express();
const PORT = 3002; // Use a fixed port for localhost access

// Middleware
app.use(cors()); // Allow requests from your web client (e.g., http://localhost:8080)
app.use(bodyParser.json());

// API Routes
app.use('/api', apiRoutes);

function startServer() {
    return new Promise((resolve) => {
        const server = app.listen(PORT, '127.0.0.1', () => {
            console.log(`✅ MiniStock API Server running at http://localhost:${PORT}`);
            resolve(server);
        });
    });
}

module.exports = { startServer };