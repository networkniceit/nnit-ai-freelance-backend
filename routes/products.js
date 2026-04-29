const express = require('express');
const router = express.Router();

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
      'INSERT INTO products (name, category, price, original_price, rating, description, badge, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *',
      [name, category, price, originalPrice, rating || 4, description || '', badge || 'NEW']
    );
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
