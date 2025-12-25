const nodemailer = require('nodemailer');

// Transporter config for Gmail SMTP on Render
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true', // true for SSL (465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Must be Gmail App Password
  },
});

// Verify SMTP connection (call on startup)
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
};

// Send invitation email
const sendInvitationEmail = async (toEmail, inviterName, teamName, tempPassword) => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: `You've been invited to join ${teamName} on TeamCollab`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width:600px; margin:0 auto; padding:20px;">
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:30px; text-align:center; border-radius:10px 10px 0 0;">
          <h1>🎉 You're Invited!</h1>
        </div>
        <div style="background:#f9f9f9; padding:30px; border-radius:0 0 10px 10px;">
          <p>Hi there!</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on TeamCollab.</p>
          
          <div style="background:#fff; padding:15px; border-radius:5px; margin:20px 0; border-left:4px solid #667eea;">
            <p><strong>Your login credentials:</strong></p>
            <p>📧 Email: <strong>${toEmail}</strong></p>
            <p>🔑 Temporary Password: <strong>${tempPassword}</strong></p>
          </div>
          
          <p style="text-align:center;">
            <a href="${loginUrl}/login" style="display:inline-block; background:#667eea; color:white; padding:12px 30px; text-decoration:none; border-radius:5px; margin:20px 0;">Login to TeamCollab</a>
          </p>
          
          <ul>
            <li>📋 Manage projects and tasks</li>
            <li>💬 Chat with your team</li>
            <li>🤖 Use AI assistant</li>
            <li>👥 Collaborate seamlessly</li>
          </ul>
          
          <p style="color:#e74c3c;"><strong>Important:</strong> Please change your password after your first login.</p>
        </div>
        <div style="text-align:center; margin-top:20px; color:#666; font-size:12px;">
          <p>© ${new Date().getFullYear()} TeamCollab. All rights reserved.</p>
          <p>If you didn't expect this invitation, you can ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Invitation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  transporter,
  sendInvitationEmail,
  verifyConnection,
};
