const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendInvitationEmail = async (toEmail, inviterName, teamName, tempPassword) => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Ensure sender is defined
  const senderEmail = process.env.SMTP_FROM;
  if (!senderEmail) {
    console.error("Error: SMTP_FROM environment variable is not set or verified in Brevo.");
    return { success: false, error: "Sender email is missing or unverified." };
  }

  const htmlContent = `
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
  `;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
    sender: { email: senderEmail, name: 'TeamCollab' },
    to: [{ email: toEmail }],
    subject: `You've been invited to join ${teamName} on TeamCollab`,
    htmlContent,
  });

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Invitation email sent, messageId:', response['messageId']);
    return { success: true, messageId: response['messageId'] };
  } catch (error) {
    console.error('Error sending invitation email:', error.response ? error.response.body : error);
    return { success: false, error: error.message || JSON.stringify(error) };
  }
};

module.exports = { sendInvitationEmail };
