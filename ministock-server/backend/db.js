// ministock-server/db.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Use a file-based database. If the file doesn't exist, it will be created.
// Resolve relative to this file (not the process cwd) so the path is stable
// no matter where the server is launched from (e.g. Render runs from the repo root).
// DB_DIR can point at a mounted persistent disk in production.
const DB_SOURCE = path.join(process.env.DB_DIR || __dirname, 'ministock.sqlite');

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error('❌ Error opening database', err.message);
        throw err;
    } else {
        console.log('✅ Connected to the ministock SQLite database.');
        // Use serialize to ensure table creation runs in order
        db.serialize(() => {
            // SQL statement to create the 'users' table if it doesn't exist
            const createTableSql = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            db.run(createTableSql, (err) => {
                if (err) {
                    console.error("❌ Error creating 'users' table", err);
                } else {
                    console.log("👍 'users' table is ready.");
                }
            });

            // SQL statement to create the 'Item' table if it doesn't exist
            // CHANGE: Added user_id column
            const createItemTableSql = `
                CREATE TABLE IF NOT EXISTS Item (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER, 
                    name TEXT NOT NULL,
                    category TEXT DEFAULT 'Uncategorized',
                    stock_quantity INTEGER DEFAULT 0,
                    restock_level INTEGER NOT NULL,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            `;
            db.run(createItemTableSql, (err) => {
                if (err) {
                    console.error("❌ Error creating 'Item' table", err);
                } else {
                    console.log("👍 'Item' table is ready.");
                }
            });

            // Seed the database with a demo user if it doesn't exist
            const demoEmail = 'demo@example.com';
            const demoPassword = 'demopassword';

            // We need to hash the password before inserting
            bcrypt.hash(demoPassword, 10, (err, hashedPassword) => {
                if (err) {
                    console.error("❌ Error hashing demo password", err);
                    return;
                }
                // 'INSERT OR IGNORE' will not insert if the email already exists
                const insertSql = `INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)`;
                db.run(insertSql, [demoEmail, hashedPassword], function(err) {
                    if (err) {
                        console.error("❌ Error seeding demo user", err);
                    } else if (this.changes > 0) {
                        console.log(`🔑 Demo user created. Email: ${demoEmail}, Password: ${demoPassword}`);
                    }
                });
            });
        });
    }
});

module.exports = db;