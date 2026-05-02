const express = require('express');
const router = express.Router();

router.post('/setup', async (req, res) => {
  try {
    await global.pgPool.query(`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), price DECIMAL(10,2), original_price DECIMAL(10,2), rating INTEGER DEFAULT 4, description TEXT, badge VARCHAR(50), image TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    await global.pgPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT');
    res.json({ success: true, message: 'Products table ready!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/fix-categories', async (req, res) => {
  try {
    await global.pgPool.query("UPDATE products SET category=LOWER(category)");
    res.json({ success: true, message: 'Categories fixed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/nuke', async (req, res) => {
  try {
    const result = await global.pgPool.query('DELETE FROM products WHERE id > 234');
    res.json({ success: true, message: "Nuked!", deleted: result.rowCount });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await global.pgPool.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 2000');
    res.json({ success: true, products: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, price, originalPrice, rating, description, badge, image } = req.body;
    const { rows } = await global.pgPool.query(
      'INSERT INTO products (name, category, price, original_price, rating, description, badge, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, category, price, originalPrice, rating || 4, description || '', badge || 'NEW', image]
    );
    res.json({ success: true, product: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, originalPrice, rating, description, badge, image } = req.body;
    const { rows } = await global.pgPool.query(
      'UPDATE products SET name=COALESCE($1,name), category=COALESCE($2,category), price=COALESCE($3,price), original_price=COALESCE($4,original_price), rating=COALESCE($5,rating), description=COALESCE($6,description), badge=COALESCE($7,badge), image=COALESCE($8,image) WHERE id=$9 RETURNING *',
      [name, category, price, originalPrice, rating, description, badge, image, id]
    );
    res.json({ success: true, product: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await global.pgPool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
