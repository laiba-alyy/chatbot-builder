const nodemailer = require('nodemailer');

// ✅ FIX: Lazy init - won't crash on startup if env vars missing
const getTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // ✅ FIX: matches .env variable name
    }
  });
};

// ✅ Dev mode detection
const isDevMode = () => {
  return (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    process.env.EMAIL_USER === 'your@gmail.com' ||
    process.env.EMAIL_PASS === 'your-app-password'
  );
};

const sendEmail = async (options) => {
  // ✅ FIX: Log instead of crashing in dev mode
  if (isDevMode()) {
    console.log(`\n📧 [EMAIL - DEV MODE - Not sent]`);
    console.log(`   To:      ${options.email}`);
    console.log(`   Subject: ${options.subject}`);
    console.log(`   Body:    ${options.html || options.message}\n`);
    return;
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'BuildSmart'}" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html || options.message // accept both html and message
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`✅ [EMAIL] Sent to ${options.email}`);
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw new Error('Email could not be sent');
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────

const templates = {
  passwordReset: (resetToken, username) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #40e0d0;">BuildSmart</h2>
      <h3>Password Reset Request</h3>
      <p>Hello ${username},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
         style="display: inline-block; padding: 10px 20px; background: #40e0d0; color: #000; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Reset Password
      </a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr/>
      <p style="font-size: 12px; color: #666;">© 2024 BuildSmart. All rights reserved.</p>
    </div>
  `,

  welcome: (username) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #40e0d0;">Welcome to BuildSmart! 🚀</h2>
      <p>Hello ${username},</p>
      <p>Thank you for joining BuildSmart. You can now start building amazing chatbots.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard" 
         style="display: inline-block; padding: 10px 20px; background: #6464ff; color: #fff; text-decoration: none; border-radius: 5px;">
        Go to Dashboard
      </a>
    </div>
  `,

  invoice: (invoiceNumber, amount, date) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #40e0d0;">BuildSmart</h2>
      <h3>Invoice ${invoiceNumber}</h3>
      <p>Your payment of <strong>$${amount}</strong> was successful on ${date}.</p>
      <p>Thank you for your business!</p>
      <hr/>
      <p style="font-size: 12px; color: #666;">© 2024 BuildSmart. All rights reserved.</p>
    </div>
  `,

  teamInvite: (inviterName, teamName, role, inviteToken) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #40e0d0;">BuildSmart</h2>
      <h3>You're Invited!</h3>
      <p>${inviterName} has invited you to join <strong>${teamName}</strong> on BuildSmart.</p>
      <p><strong>Role:</strong> ${role}</p>
      <a href="${process.env.FRONTEND_URL}/team/invite?token=${inviteToken}"
         style="display: inline-block; padding: 10px 20px; background: #40e0d0; color: #000; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Accept Invitation
      </a>
      <p>This link will expire in 7 days.</p>
      <hr/>
      <p style="font-size: 12px; color: #666;">© 2024 BuildSmart. All rights reserved.</p>
    </div>
  `
};

// ✅ FIX: Consistent export - both sendEmail and templates available
module.exports = { sendEmail, templates };