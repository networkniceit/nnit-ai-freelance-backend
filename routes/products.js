const express = require('express');
const router = express.Router();

// Setup - create table
router.post('/setup', async (req, res) => {
  try {
    await global.pgPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(100),
        price DECIMAL(10,2),
        original_price DECIMAL(10,2),
        rating INTEGER DEFAULT 4,
        description TEXT,
        badge VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    res.json({ success: true, message: "Products table created!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all products
router.get('/', async (req, res) => {
  try {
    const { rows } = await global.pgPool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ success: true, products: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add product
router.post('/', async (req, res) => {
  try {
    const { name, category, price, originalPrice, rating, description, badge } = req.body;
    const { rows } = await global.pgPool.query(
      'INSERT INTO products (name, category, price, original_price, rating, description, badge) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, category, price, originalPrice, rating || 4, description || '', badge || 'NEW']
    );
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
