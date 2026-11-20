const express = require('express');
const router = express.Router();

// Make sure the products table always exists, so a fresh or restarted database never breaks the shop.
let tableReady = null;
// If the table is empty (new database), refill it from the saved catalog so the shop is never empty.
async function seedIfEmpty() {
  let data;
  try { data = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'data', 'shop-products.json'), 'utf8')); } catch (e) { return; }
  const list = Array.isArray(data) ? data : (data.products || []), version = Array.isArray(data) ? 'legacy' : (data.version || 'v1');
  await global.pgPool.query('CREATE TABLE IF NOT EXISTS shop_meta (key TEXT PRIMARY KEY, value TEXT)');
  const cur = (await global.pgPool.query("SELECT value FROM shop_meta WHERE key='catalog_version'")).rows[0];
  const n = (await global.pgPool.query('SELECT COUNT(*)::int AS n FROM products')).rows[0].n;
  if (cur && cur.value === version && n > 0) return;
  if (!list.length) return;
  // New or changed saved catalog: replace the catalog so the shop matches it exactly, with no duplicates.
  await global.pgPool.query('DELETE FROM products');
  for (const p of list) {
    await global.pgPool.query('INSERT INTO products (name, category, price, original_price, rating, description, badge, image, link) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [p.name, String(p.category || '').toLowerCase(), p.price, p.originalPrice, 4, p.description || '', p.badge || 'NEW', p.image, p.link || null]);
  }
  await global.pgPool.query("INSERT INTO shop_meta (key, value) VALUES ('catalog_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [version]);
}
router.use(async (req, res, next) => {
  try {
    if (!tableReady) tableReady = (async () => { await global.pgPool.query(`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), price DECIMAL(10,2), original_price DECIMAL(10,2), rating INTEGER DEFAULT 4, description TEXT, badge VARCHAR(50), image TEXT, created_at TIMESTAMP DEFAULT NOW())`); await global.pgPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT'); await global.pgPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS link TEXT'); await seedIfEmpty(); })();
    await tableReady;
  } catch (e) { tableReady = null; }
  next();
});

// Only the owner (header x-admin-key) may change products. Reading stays public.
const requireAdminKey = (req, res, next) => {
  const k = process.env.SHOP_ADMIN_KEY;
  if (!k || req.get('x-admin-key') !== k) return res.status(401).json({ success: false, message: 'Admin key required' });
  next();
};

router.post('/setup', requireAdminKey, async (req, res) => {
  try {
    await global.pgPool.query(`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), price DECIMAL(10,2), original_price DECIMAL(10,2), rating INTEGER DEFAULT 4, description TEXT, badge VARCHAR(50), image TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    await global.pgPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT');
    await global.pgPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS link TEXT');
    res.json({ success: true, message: 'Products table ready!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/fix-categories', requireAdminKey, async (req, res) => {
  try {
    await global.pgPool.query("UPDATE products SET category=LOWER(category)");
    res.json({ success: true, message: 'Categories fixed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});



router.get('/count', async (req, res) => {
  try {
    const { rows } = await global.pgPool.query('SELECT COUNT(*) as total, category, COUNT(*) FROM products GROUP BY category ORDER BY category');
    const total = await global.pgPool.query('SELECT COUNT(*) as total FROM products');
    res.json({ success: true, total: total.rows[0].total, byCategory: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.get('/', async (req, res) => {
  try {
    const { rows } = await global.pgPool.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 2000');
    res.json({ success: true, products: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', requireAdminKey, async (req, res) => {
  try {
    const { name, category, price, originalPrice, rating, description, badge, image, link } = req.body;
    const { rows } = await global.pgPool.query(
      'INSERT INTO products (name, category, price, original_price, rating, description, badge, image, link) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, category, price, originalPrice, rating || 4, description || '', badge || 'NEW', image, link || null]
    );
    res.json({ success: true, product: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', requireAdminKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, originalPrice, rating, description, badge, image, link } = req.body;
    const { rows } = await global.pgPool.query(
      'UPDATE products SET name=COALESCE($1,name), category=COALESCE($2,category), price=COALESCE($3,price), original_price=COALESCE($4,original_price), rating=COALESCE($5,rating), description=COALESCE($6,description), badge=COALESCE($7,badge), image=COALESCE($8,image), link=COALESCE($9,link) WHERE id=$10 RETURNING *',
      [name, category, price, originalPrice, rating, description, badge, image, link, id]
    );
    res.json({ success: true, product: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', requireAdminKey, async (req, res) => {
  try {
    const { id } = req.params;
    await global.pgPool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;


