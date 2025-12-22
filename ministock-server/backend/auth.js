const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Register a new user (stores into the users table)
router.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        // 1. Check if user already exists
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });

        if (existingUser) {
            return res.status(409).json({ status: 'error', message: 'User already exists.' });
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert the new user into the database
        const result = await new Promise((resolve, reject) => {
            // Use the 'users' table and 'password' column from db.js
            // The 'id' is autoincremented by the DB, so we don't provide it.
            db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
                if (err) return reject(err);
                // 'this.lastID' gives us the ID of the inserted row
                resolve({ id: this.lastID });
            });
        });

        console.log(`✅ /api/auth/register: Created user ${email} (${result.id})`);
        res.status(201).json({ status: 'ok', message: 'User registered successfully.', data: { id: result.id, email } });
    } catch (error) {
        console.error('❌ /api/auth/register - Error:', error.message);
        // Pass the error to the global error handler in server.js
        next(error);
    }
});

// Login endpoint - returns JWT on success
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        // Find user by email in the 'users' table
        const user = await new Promise((resolve, reject) => {
            // Select the 'password' column, not 'password_hash'
            db.get('SELECT id, email, password FROM users WHERE email = ?', [email], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
        }

        // Compare the provided password with the stored hash
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
        }

        const token = generateToken({ userId: user.id, email: user.email });
        console.log(`✅ /api/auth/login: User ${user.email} authenticated`);
        res.json({ status: 'ok', token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('❌ /api/auth/login - Error:', error.message);
        next(error);
    }
});

// Middleware to protect routes
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ status: 'error', message: 'Invalid or expired token.' });
        }
        req.user = payload;
        next();
    });
}

// Example protected route: get current user's profile
router.get('/profile', authenticateToken, (req, res) => {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(400).json({ status: 'error', message: 'Invalid token payload.' });

    db.get('SELECT id, email, created_at FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error('❌ /api/auth/profile - DB error:', err.message);
            return res.status(500).json({ status: 'error', message: 'Database error.' });
        }
        if (!row) return res.status(404).json({ status: 'error', message: 'User not found.' });
        res.json({ status: 'ok', data: row });
    });
});

// Attach middleware to router for external use if needed
router.authenticateToken = authenticateToken;

module.exports = router;
