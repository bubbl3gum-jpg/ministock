// ministock-server/server.js 
const express = require('express');
const cors = require('cors'); // Essential for allowing the client to connect
const path = require('path'); // Node.js module for working with file paths
const db = require('./db'); // Initialize database connection first
const router = require('./api'); // Loads the router defined in api.js
const authRouter = require('./auth'); // Auth routes (register, login, profile)
const app = express();
const PORT = 3000; // MUST match the port your client is requesting!

// --- Serve Static Frontend Files ---
// This tells Express to serve all files from the 'frontend' directory
// The path is constructed to go up one level from 'backend' and then into 'frontend'
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true
}));

app.use(express.json());


// Health check endpoint - useful for debugging
app.get('/api/health', (req, res) => {
    db.get("SELECT 1", (err) => {
        if (err) {
            console.error('❌ Health check failed:', err.message);
   
            return res.status(500).json({ status: 'error', message: 'Database connection failed' });
        }
        res.json({ status: 'ok', message: 'Server and database are healthy' });
    });
});

// Mount the API router: All routes in api.js now start with /api
// Mount auth routes under /api/auth
app.use('/api/auth', authRouter);

// Mount main API router
app.use('/api', router); 

// --- Fallback for Single-Page-Application ---
// This sends the index.html for any GET request that doesn't match an API route or a static file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        status: 'error', 
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the server with a safe error handler
// Start the server with a safe error handler
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
});

// Handle server errors (e.g. port already in use) gracefully
server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} already in use. Another process is listening on this port.`);
        process.exit(1);
    }
    console.error('❌ Server error:', err);
    process.exit(1);
});