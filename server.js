import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ใส่ URL และ API KEY จาก Supabase (Service Role key ถ้าใช้ insert ผ่าน backend)
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

app.post('/upload-json', async (req, res) => {
  try {
    const orders = req.body.orders;
    const formattedOrders = orders.map(o => ({
      order_id: o.order_id,
      date: o.date,
      platform: o.platform,
      item: o.item,
      qty: o.qty,
      price: o.price,
    }));

    const { data, error } = await supabase
      .from('orders')
      .insert(formattedOrders);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Insert failed', details: error.message });
    }

    res.json({ message: 'Insert data success', inserted: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
