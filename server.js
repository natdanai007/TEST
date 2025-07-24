const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

const pool = mysql.createPool({
  host: 'localhost',
  user: 'youruser',
  password: 'yourpassword',
  database: 'yourdb',
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = path.resolve(req.file.path);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const conn = await pool.getConnection();

    for (const row of data) {
      if (!row['order_id'] || !row['date']) continue;

      let date = row['date'];
      if (typeof date === 'number') {
        const utc_days = Math.floor(date - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        const offset = date_info.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date_info.getTime() + offset);
        date = correctedDate.toISOString().slice(0, 10);
      }

      await conn.query(
        `INSERT INTO orders (order_id, date, platform, item, quantity, price) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          row['order_id'] || '',
          date,
          row['platform'] || '',
          row['item'] || '',
          parseInt(row['quantity'] || 0),
          parseFloat(row['price'] || 0),
        ]
      );
    }

    conn.release();
    fs.unlinkSync(req.file.path); // ลบไฟล์ออกหลังใช้เสร็จ

    res.json({ message: 'Upload and insert to DB successful', rowsInserted: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
