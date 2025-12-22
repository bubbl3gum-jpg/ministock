// server/api.js

const express = require('express');
const router = express.Router();   

// --- Module Imports ---
const db = require('./db');
const { v4: uuidv4 } = require('uuid'); 

// CRITICAL: Import the middleware to fix the "Token" issue
// Ensure you have auth.js in the same folder!
const { authenticateToken } = require('./auth');

// ----------------------------------------------------------------
// ITEM ROUTES (AUTHENTICATION REQUIRED)
// ----------------------------------------------------------------

// GET /api/items: List all items (ONLY for the logged-in user)
router.get('/items', authenticateToken, (req, res) => {
    const userId = req.user.userId; // Extracted from token
    const searchTerm = req.query.search;
    
    // CHANGE: Filter by user_id
    let sql = 'SELECT * FROM Item WHERE user_id = ?';
    let params = [userId];

    if (searchTerm) {
        // Search by name OR category
        sql += ' AND (name LIKE ? OR category LIKE ?)';
        const likeTerm = `%${searchTerm}%`;
        params.push(likeTerm, likeTerm);
    }
    
    sql += ' ORDER BY name';

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('❌ GET /items error:', err.message);
            return res.status(500).json({ status: 'error', message: 'Failed to fetch items: ' + err.message });
        }
        console.log(`✅ GET /items: Retrieved ${rows ? rows.length : 0} items for user ${userId}`);
        res.json({ status: 'ok', data: rows || [] });
    });
});


// POST /api/items: Create a new item (Stamped with user_id)
router.post('/items', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { name, category, restock_level } = req.body;
    const id = uuidv4();
    const currentTimestamp = new Date().toISOString();

    if (!name || !restock_level) {
        console.warn('⚠️  POST /items: Missing required fields');
        return res.status(400).json({ status: 'error', message: 'Name and Restock Level are required.' });
    }

    // CHANGE: Insert user_id
    const sql = `
        INSERT INTO Item (id, user_id, name, category, stock_quantity, restock_level, last_updated) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [id, userId, name, category || 'Uncategorized', 0, restock_level, currentTimestamp];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('❌ POST /items error:', err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ status: 'error', message: 'Item name already exists' });
            }
            return res.status(500).json({ status: 'error', message: 'Failed to create item: ' + err.message });
        }
        
        console.log(`✅ POST /items: Created item "${name}" for user ${userId}`);
        res.status(201).json({ 
            status: 'ok', 
            message: 'Item created successfully.', 
            data: { id, name, category: category || 'Uncategorized', stock_quantity: 0, restock_level } 
        });
    });
});

// POST /api/items/:id/adjust: Update stock quantity (Only if user owns item)
router.post('/items/:id/adjust', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const itemId = req.params.id;
    const { change_amount } = req.body;
    const change = parseInt(change_amount, 10);

    if (isNaN(change) || change === 0) {
        return res.status(400).json({ status: 'error', message: 'A valid, non-zero change amount is required.' });
    }

    // 1. Get current stock (Check user_id)
    db.get('SELECT stock_quantity FROM Item WHERE id = ? AND user_id = ?', [itemId, userId], (err, row) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Database error' });
        
        if (!row) {
            return res.status(404).json({ status: 'error', message: 'Item not found or unauthorized.' });
        }

        const currentStock = row.stock_quantity;
        if (change < 0 && currentStock < Math.abs(change)) {
            return res.status(400).json({ status: 'error', message: `Stock not enough. Only ${currentStock} available.` });
        }

        const newStock = row.stock_quantity + change;
        const currentTimestamp = new Date().toISOString();

        // 2. Update (Check user_id again for safety)
        db.run('UPDATE Item SET stock_quantity = ?, last_updated = ? WHERE id = ? AND user_id = ?', 
            [newStock, currentTimestamp, itemId, userId], (updateErr) => {
            if (updateErr) return res.status(500).json({ status: 'error', message: 'Database error' });

            res.json({ status: 'ok', message: 'Stock adjusted successfully.', data: { id: itemId, stock_quantity: newStock } });
        });
    });
});

// DELETE /api/items/:id: Delete an item
router.delete('/items/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const itemId = req.params.id;

    // CHANGE: Ensure user only deletes their own items
    db.run('DELETE FROM Item WHERE id = ? AND user_id = ?', [itemId, userId], function(err) {
        if (err) return res.status(500).json({ status: 'error', message: 'Database error' });
        
        if (this.changes === 0) {
            return res.status(404).json({ status: 'error', message: 'Item not found or unauthorized.' });
        }
        
        console.log(`✅ DELETE /items/:id: Item ${itemId} deleted.`);
        res.sendStatus(204);
    });
});

// GET /api/export: Download CSV (Re-adding this feature for you)
router.get('/export', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    // Filter by user_id
    db.all("SELECT * FROM Item WHERE user_id = ?", [userId], (err, rows) => {
        if (err) {
            console.error('❌ Export error:', err.message);
            return res.status(500).send('Error fetching data');
        }

        const headers = ['ID', 'Name', 'Category', 'Stock', 'Restock Level', 'Last Updated'];
        const csvRows = rows.map(row => {
            return [
                `"${row.id}"`,
                `"${row.name.replace(/"/g, '""')}"`, 
                `"${row.category ? row.category.replace(/"/g, '""') : ''}"`,
                row.stock_quantity,
                row.restock_level,
                `"${new Date(row.last_updated).toLocaleString()}"`
            ].join(',');
        });

        const csvString = [headers.join(','), ...csvRows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory_export.csv"');
        res.status(200).send(csvString);
    });
});

module.exports = router;