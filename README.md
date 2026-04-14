# 📡 Messaging API (RCS + SMS + MySQL Tracking)

A Node.js backend that sends messages via Twilio with **RCS-first delivery**, **SMS fallback**, and **full delivery tracking using MySQL**.

---

## 🚀 Features

- 📩 Send messages via RCS (Twilio Messaging Service)
- 🔁 Automatic SMS fallback if RCS fails
- 📊 Delivery status tracking via webhooks
- 💾 MySQL persistence (message lifecycle storage)
- 🧠 Message state tracking (queued → sent → delivered/failed)
- 🖼️ Image processing endpoint (Sharp)
- 🔔 Real-time webhook logging

---

## 🧱 Tech Stack

- Node.js
- Express.js
- MySQL (XAMPP / local)
- Twilio API
- Multer
- Sharp
- dotenv

---

## 📦 Installation

```bash
npm install