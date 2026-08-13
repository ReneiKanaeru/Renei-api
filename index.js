const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'renbot678@gmail.com',
    pass: 'jxefgaemogmhcuzw'
  }
});

const magicLinks = {};

app.post('/api/tools/am/send-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi!' });

  const magicLink = `https://alight-creative.firebaseapp.com/__/auth/links?link=https://alightcreative.com/auth_action/?email=${encodeURIComponent(email)}`;
  magicLinks[email] = { link: magicLink, createdAt: Date.now() };

  try {
    await transporter.sendMail({
      to: email,
      subject: '✨ Magic Link - Alight Motion Premium',
      html: `<p>Klik link ini untuk verifikasi:</p><p>${magicLink}</p>`
    });
    res.json({ success: true, message: `Magic link sent to ${email}` });
  } catch (e) {
    res.json({ success: false, message: 'Gagal kirim: ' + e.message });
  }
});

app.post('/api/tools/am/verif-email', (req, res) => {
  const { email, magicLink } = req.body;
  if (!email || !magicLink) return res.status(400).json({ success: false, message: 'Data tidak lengkap!' });

  const linkData = magicLinks[email];
  if (!linkData || linkData.link !== magicLink) {
    return res.json({ success: false, message: 'Link tidak valid!' });
  }
  if (Date.now() - linkData.createdAt > 3600000) {
    delete magicLinks[email];
    return res.json({ success: false, message: 'Link sudah kadaluarsa!' });
  }
  delete magicLinks[email];

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
app.listen(PORT, () => console.log('✅ API berjalan!'));

