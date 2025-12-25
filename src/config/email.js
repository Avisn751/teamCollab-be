const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendInvitationEmail = async (toEmail, inviterName, teamName, tempPassword) => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: `You've been invited to join ${teamName} on TeamCollab`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .credentials { background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited!</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on TeamCollab - a real-time team collaboration platform.</p>
            
            <div class="credentials">
              <p><strong>Your login credentials:</strong></p>
              <p>📧 Email: <strong>${toEmail}</strong></p>
              <p>🔑 Temporary Password: <strong>${tempPassword}</strong></p>
            </div>
            
            <p>Click the button below to login and start collaborating:</p>
            
            <div style="text-align: center;">
              <a href="${loginUrl}/login" class="button">Login to TeamCollab</a>
            </div>
            
            <p><strong>What you can do on TeamCollab:</strong></p>
            <ul>
              <li>📋 Manage projects and tasks with Kanban boards</li>
              <li>💬 Chat with your team in real-time</li>
              <li>🤖 Use AI assistant to manage tasks with natural language</li>
              <li>👥 Collaborate seamlessly with your team</li>
            </ul>
            
            <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after your first login for security.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TeamCollab. All rights reserved.</p>
            <p>If you didn't expect this invitation, you can ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Invitation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
};

const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
};

module.exports = {
  transporter,
  sendInvitationEmail,
  verifyConnection,
};
