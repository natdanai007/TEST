const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // คุณต้องใส่ .env ให้ถูกต้อง
  ssl: { rejectUnauthorized: false }
});

app.post('/upload-json', async (req, res) => {
  const orders = req.body.orders;
  try {
    for (let o of orders) {
      await pool.query(
        'INSERT INTO orders (date, order_id, platform, item, qty, price) VALUES ($1, $2, $3, $4, $5, $6)',
        [o.date, o.order_id, o.platform, o.item, o.qty, o.price]
      );
    }
    res.json({ message: 'อัปโหลดเข้า Database แล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดระหว่าง insert' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
