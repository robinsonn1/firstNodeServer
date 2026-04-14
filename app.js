require('dotenv').config();

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const mysql = require('mysql2');
const twilio = require('twilio');

const app = express();

// =========================
// MIDDLEWARE (IMPORTANT ORDER)
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// DB CONNECTION
// =========================
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'messaging_app'
}).promise();

// DB TEST
db.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL error:', err.message);
  });

// =========================
// TWILIO CLIENT
// =========================
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// =========================
// MULTER (IMAGE UPLOAD)
// =========================
const upload = multer({ storage: multer.memoryStorage() });

// =========================
// HEALTH CHECK
// =========================
app.get('/', (req, res) => {
  res.send('API running 🚀');
});

// =========================
// IMAGE ROUTE
// =========================
app.post('/imagen', upload.single('imagen'), async (req, res) => {
  try {
    const buffer = await sharp(req.file.buffer)
      .resize(800, 600, { fit: "contain", background: "#FFF" })
      .toBuffer();

    fs.writeFileSync('nuevaruta/prueba.png', buffer);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =========================
// SEND RCS
// =========================
async function sendRCS(to, message) {
  console.log('🚀 Sending RCS...');

  return await client.messages.create({
    messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
    to,
    body: message,
    statusCallback: `${process.env.BASE_URL}/status`
  });
}

// =========================
// SMS FALLBACK
// =========================
async function sendSMSFallback(to, message) {
  console.log('📲 Sending SMS fallback...');

  return await client.messages.create({
    from: process.env.SMS_NUMBER,
    to,
    body: message
  });
}

// =========================
// SEND MESSAGE (MAIN FLOW)
// =========================
app.post('/messages/send', async (req, res) => {
  const { to, message } = req.body;

  try {
    console.log('📤 Sending:', { to, message });

    const tempSid = `local_${Date.now()}`;

    // 1. INSERT FIRST
    await db.execute(
      `INSERT INTO messages (sid, phone, message, channel, status)
       VALUES (?, ?, ?, ?, ?)`,
      [tempSid, to, message, 'pending', 'queued']
    );

    // 2. SEND MESSAGE
    let response;
    let channel = 'rcs';

    try {
      response = await sendRCS(to, message);
    } catch (err) {
      console.log('❌ RCS failed → SMS fallback');
      channel = 'sms';
      response = await sendSMSFallback(to, message);
    }

    // 3. UPDATE DB WITH REAL SID
    await db.execute(
      `UPDATE messages
       SET sid = ?, channel = ?, status = ?
       WHERE sid = ?`,
      [response.sid, channel, response.status, tempSid]
    );

    console.log('💾 Message stored in DB');

    res.json({
      success: true,
      sid: response.sid,
      channel,
      status: response.status
    });

  } catch (err) {
    console.error('🔥 SEND ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// =========================
// WEBHOOK (DELIVERY STATUS)
// =========================
app.post('/status', async (req, res) => {
  console.log('📩 WEBHOOK RECEIVED:', req.body);

  const sid = req.body.MessageSid || req.body.SmsSid;
  const status = req.body.MessageStatus || req.body.SmsStatus;

  if (!sid || !status) {
    console.log('⚠️ Missing webhook fields');
    return res.sendStatus(200);
  }

  try {
    const [result] = await db.execute(
      `UPDATE messages SET status = ? WHERE sid = ?`,
      [status, sid]
    );

    console.log(`✅ Updated ${sid} → ${status} (${result.affectedRows} rows)`);

  } catch (err) {
    console.error('❌ DB UPDATE ERROR:', err.message);
  }

  res.sendStatus(200);
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});