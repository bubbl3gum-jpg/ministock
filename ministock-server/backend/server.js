// ministock-server/server.js 
const express = require('express');
const cors = require('cors'); // Essential for allowing the client to connect
const path = require('path'); // Node.js module for working with file paths
const db = require('./db'); // Initialize database connection first
const router = require('./api'); // Loads the router defined in api.js
const authRouter = require('./auth'); // Auth routes (register, login, profile)
const app = express();
// Use the platform-provided port in production (Render/Heroku/etc.), fall back to 3000 locally.
const PORT = process.env.PORT || 3000;

// --- Serve Static Frontend Files ---
// In production we serve the built Vite output (frontend/dist). Fall back to the raw
// frontend folder if a build hasn't been produced yet (keeps local dev forgiving).
const fs = require('fs');
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const FRONTEND_DIR = fs.existsSync(DIST_DIR)
    ? DIST_DIR
    : path.join(__dirname, '..', 'frontend');

app.use((req, res, next) => {
    console.log(`📡 CONNECTION INCOMING: ${req.method} ${req.url}`);
    next();
});

app.use(express.static(FRONTEND_DIR));

// Middleware
app.use(cors({
    origin: true, // Allow any origin (easiest for development)
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
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
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
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
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