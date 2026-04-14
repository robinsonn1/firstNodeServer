require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
app.use(express.json());

// =========================
// TWILIO CLIENT
// =========================
const client = require('twilio')(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// =========================
// MULTER CONFIG
// =========================
const upload = multer({
  storage: multer.memoryStorage()
});

// =========================
// HEALTH CHECK
// =========================
app.get('/', (req, res) => {
  res.send('API running 🚀');
});

// =========================
// IMAGE PROCESSING
// =========================
app.post('/imagen', upload.single('imagen'), async (req, res) => {
  try {
    const resizedImageBuffer = await sharp(req.file.buffer)
      .resize(800, 600, {
        fit: "contain",
        background: "#FFF"
      })
      .toBuffer();

    fs.writeFileSync('nuevaruta/prueba.png', resizedImageBuffer);

    res.json({ success: true });
  } catch (err) {
    console.error('Image error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =========================
// SMART MESSAGE SENDER
// =========================
async function sendSMSFallback(to, message) {
  console.log('📲 Sending SMS fallback...');

  return await client.messages.create({
    from: process.env.SMS_NUMBER,
    to,
    body: message
  });
}

async function sendRCS(to, message) {
  console.log('🚀 Sending RCS via Messaging Service...');

  return await client.messages.create({
    messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
    to,
    body: message,
    statusCallback: `${process.env.BASE_URL}/status`
  });
}

// =========================
// MAIN ENDPOINT
// =========================
app.post('/messages/send', async (req, res) => {
  const { to, message } = req.body;

  try {
    console.log('📤 Sending message:', { to, message });

    let response;

    // 1. TRY RCS FIRST
    try {
      response = await sendRCS(to, message);
      console.log('✅ RCS response:', response.sid);
    } catch (rcsError) {
      console.error('❌ RCS failed:', {
        message: rcsError.message,
        code: rcsError.code,
        moreInfo: rcsError.moreInfo
      });

      // 2. FALLBACK TO SMS
      response = await sendSMSFallback(to, message);
      console.log('📲 SMS fallback response:', response.sid);
    }

    res.json({
      success: true,
      sid: response.sid,
      status: response.status,
      to: response.to,
      channel: response.messagingServiceSid ? 'rcs/sms-service' : 'sms'
    });

  } catch (err) {
    console.error('🔥 FINAL ERROR:', {
      message: err.message,
      code: err.code,
      moreInfo: err.moreInfo,
      stack: err.stack
    });

    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
});

// =========================
// FULL DELIVERY STATUS WEBHOOK
// =========================
app.post('/status', (req, res) => {
  console.log('📩 ===== TWILIO WEBHOOK =====');

  console.log(JSON.stringify({
    event: 'delivery_update',
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: req.headers
  }, null, 2));

  res.sendStatus(200);
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});