const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const DB_PATH = path.join(__dirname, 'magic-links.json');
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'renbot678@gmail.com',
    pass: 'jxefgaemogmhcuzw'
  }
});

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

app.post('/api/tools/am/send-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi!' });

  const magicLink = `https://alight-creative.firebaseapp.com/__/auth/links?link=https://alightcreative.com/auth_action/?email=${encodeURIComponent(email)}`;
  
  const db = readDB();
  db[email] = { link: magicLink, createdAt: Date.now() };
  saveDB(db);

  try {
    await transporter.sendMail({
      to: email,
      subject: '✨ Magic Link - Alight Motion Premium',
      html: `
        <div style="font-family:Arial;max-width:500px;margin:auto;">
          <h2>🔑 Verifikasi Email Kamu</h2>
          <p>Klik link di bawah untuk mengaktifkan Premium:</p>
          <p style="background:#f5f5f5;padding:12px;border-radius:6px;word-break:break-all;">
            <a href="${magicLink}" target="_blank">${magicLink}</a>
          </p>
          <p style="color:#666;font-size:12px;margin-top:20px;">Link berlaku 1 jam</p>
        </div>
      `
    });
    res.json({ success: true, message: `Magic link sent to ${email}` });
  } catch (e) {
    res.json({ success: false, message: 'Gagal kirim email: ' + e.message });
  }
});

app.post('/api/tools/am/verif-email', (req, res) => {
  const { email, magicLink } = req.body;
  if (!email || !magicLink) return res.status(400).json({ success: false, message: 'Email & link wajib diisi!' });

  const db = readDB();
  const linkData = db[email];
  
  if (!linkData) return res.json({ success: false, message: 'Link tidak ditemukan!' });
  if (linkData.link !== magicLink) return res.json({ success: false, message: 'Link tidak cocok!' });
  
  const expired = Date.now() - linkData.createdAt > 3600000;
  if (expired) { delete db[email]; saveDB(db); return res.json({ success: false, message: 'Link sudah kadaluarsa!' }); }

  delete db[email]; saveDB(db);
  res.json({
    success: true,
    data: {
      premium: {
        success: true,
        message: '✅ Premium berhasil diaktifkan! Selamat menikmati fitur premium.',
        data: { codeOrder: `0000-${Math.floor(Math.random() * 90000) + 10000}` }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API berjalan di port ${PORT}`));
