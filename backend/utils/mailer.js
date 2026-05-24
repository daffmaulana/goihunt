// ngirim ngemail lewat smtp gmail
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  logger: true, 
  debug: true,
});

exports.sendResetPasswordEmail = async (to, username, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset?token=${resetToken}`;

  await transporter.sendMail({
    from: `"GoiHunt" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset Password',
    html: `
      <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #dddddd;">
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #3e96cd;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GoiHunt</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin-top: 0;font-size: 14px;">Halo <strong>${username}</strong>,</p>
              <p style="font-size: 14px; color: #666666;">
              GoiHunt menerima permintaan untuk reset password akun kamu. Klik tombol di bawah ini untuk melanjutkan:</p>
              
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 5px;" bgcolor="#3e96cd">
                    <a href="${resetLink}" target="_blank" style="padding: 12px 25px; color: #ffffff; text-decoration: none; font-weight: bold; display: inline-block;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666;">
                Link ini berlaku selama <strong>30 menit</strong>. Jika kamu tidak merasa meminta reset password, abaikan email ini.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px; text-align: center; font-size: 12px; color: #999999; background-color: #fafafa;">
              <p style="margin: 0;">&copy; 2026 GoiHunt. Dibuat dengan 🩵 oleh Daffa Maulana.</p>
            </td>
          </tr>
        </table>
      </div>
    `
  });
};
