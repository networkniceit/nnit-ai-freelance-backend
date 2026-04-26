const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('Email error:', err.message);
    return false;
  }
};

const sendWelcomeEmail = async (email, name) => {
  return sendEmail(email, 'Welcome to NNIT Freelance! 🎉', `
    <h1>Welcome ${name}!</h1>
    <p>Your account has been created successfully.</p>
    <p>Visit your platform: <a href="https://freelance.nnit.de">freelance.nnit.de</a></p>
    <br>
    <p>Best regards,<br>NNIT Team</p>
  `);
};

const sendJobApplicationEmail = async (email, jobTitle) => {
  return sendEmail(email, 'Job Application Submitted ✅', `
    <h1>Application Submitted!</h1>
    <p>You have successfully applied for: <strong>${jobTitle}</strong></p>
    <p>Visit: <a href="https://freelance.nnit.de">freelance.nnit.de</a></p>
    <br>
    <p>Best regards,<br>NNIT Team</p>
  `);
};

module.exports = { sendEmail, sendWelcomeEmail, sendJobApplicationEmail };