// server/api.js

const express = require('express');
const router = express.Router();   

// --- Module Imports ---
const db = require('./db');
const { v4: uuidv4 } = require('uuid'); 

// ----------------------------------------------------------------
// ITEM ROUTES (NO AUTHENTICATION REQUIRED)
// ----------------------------------------------------------------

// GET /api/items: List all items (with optional search)
router.get('/items', (req, res) => {
    const searchTerm = req.query.search;
    let sql = 'SELECT * FROM Item';
    let params = [];

    if (searchTerm) {
        // Search by name OR category
        sql += ' WHERE name LIKE ? OR category LIKE ?';
        const likeTerm = `%${searchTerm}%`;
        params.push(likeTerm, likeTerm);
    }
    
    sql += ' ORDER BY name';

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('❌ GET /items error:', err.message);
            return res.status(500).json({ status: 'error', message: 'Failed to fetch items: ' + err.message });
        }
        console.log(`✅ GET /items: Retrieved ${rows ? rows.length : 0} items`);
        res.json({ status: 'ok', data: rows || [] });
    });
});


// POST /api/items: Create a new item
router.post('/items', (req, res) => {
    const { name, category, restock_level } = req.body;
    const id = uuidv4();
    const currentTimestamp = new Date().toISOString();

    if (!name || !restock_level) {
        console.warn('⚠️  POST /items: Missing required fields - name or restock_level');
        return res.status(400).json({ status: 'error', message: 'Name and Restock Level are required.' });
    }

    const sql = `
        INSERT INTO Item (id, name, category, stock_quantity, restock_level, last_updated) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [id, name, category || 'Uncategorized', 0, restock_level, currentTimestamp];

    db.run(sql, params, function(err) {
        if (err) {
    console.error('❌ POST /items error:', err.message);
    // Check if it's a duplicate name error
    if (err.message.includes('UNIQUE constraint failed')) {
        return res
            .status(409)
            .json({ status: 'error', message: 'Item name already exists' });
    }
    return res
        .status(500)
        .json({ status: 'error', message: 'Failed to create item: ' + err.message });
}

        
        console.log(`✅ POST /items: Created item "${name}" with ID ${id}`);
        res.status(201).json({ 
            status: 'ok', 
            message: 'Item created successfully.', 
            data: { id, name, category: category || 'Uncategorized', stock_quantity: 0, restock_level } 
        });
    });
});

// POST /api/items/:id/adjust: Update stock quantity
router.post('/items/:id/adjust', (req, res) => {
    const itemId = req.params.id;
    // The frontend will now send change_amount (positive for restock, negative for sale) and reason
    const { change_amount } = req.body;
    const change = parseInt(change_amount, 10);

    if (isNaN(change) || change === 0) {
        console.warn(`⚠️  POST /items/:id/adjust: Invalid change_amount for item ${itemId}`);
        return res.status(400).json({ status: 'error', message: 'A valid, non-zero change amount is required.' });
    }

    // 1. Get current stock
    db.get('SELECT stock_quantity FROM Item WHERE id = ?', [itemId], (err, row) => {
        if (err) {
            console.error(`❌ POST /items/:id/adjust error (GET): ${err.message}`);
            return res.status(500).json({ status: 'error', message: 'Database error: ' + err.message });
        }
        
        if (!row) {
            console.warn(`⚠️  POST /items/:id/adjust: Item not found - ${itemId}`);
            return res.status(404).json({ status: 'error', message: 'Item not found.' });
        }

        const currentStock = row.stock_quantity;

        // Check for sufficient stock if it's a sale (negative change_amount)
        if (change < 0 && currentStock < Math.abs(change)) {
            console.warn(`⚠️  POST /items/:id/adjust: Insufficient stock for item ${itemId}. Current: ${currentStock}, Sale Amount: ${Math.abs(change)}`);
            return res.status(400).json({ status: 'error', message: `Stock not enough. Only ${currentStock} available.` });
        }

        const newStock = row.stock_quantity + change;

        const currentTimestamp = new Date().toISOString();

        // 2. Update the stock quantity
        db.run('UPDATE Item SET stock_quantity = ?, last_updated = ? WHERE id = ?', [newStock, currentTimestamp, itemId], (updateErr) => {
            if (updateErr) {
                console.error(`❌ POST /items/:id/adjust error (UPDATE): ${updateErr.message}`);
                return res.status(500).json({ status: 'error', message: 'Database error: ' + updateErr.message });
            }

            console.log(`✅ [STOCK ADJUSTMENT] Item: ${itemId}, Change: ${change}, Old Stock: ${row.stock_quantity}, New Stock: ${newStock}`);

            // Send back the updated item data
            const updatedItem = { ...row, stock_quantity: newStock, id: itemId };
            res.json({ status: 'ok', message: 'Stock adjusted successfully.', data: updatedItem });
        });
    });
});

// DELETE /api/items/:id: Delete an item (Optional for demo, but good practice)
router.delete('/items/:id', (req, res) => {
    const itemId = req.params.id;

    db.run('DELETE FROM Item WHERE id = ?', [itemId], function(err) {
        if (err) {
            console.error(`❌ DELETE /items/:id error: ${err.message}`);
            return res.status(500).json({ status: 'error', message: 'Database error: ' + err.message });
        }
        
        if (this.changes === 0) {
            console.warn(`⚠️  DELETE /items/:id: Item not found - ${itemId}`);
            return res.status(404).json({ status: 'error', message: 'Item not found.' });
        }
        
        console.log(`✅ DELETE /items/:id: Item ${itemId} deleted successfully.`);
        // Return 204 No Content on successful delete (no response body)
        res.sendStatus(204);
    });
});


module.exports = router;