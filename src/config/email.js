const axios = require('axios');

const sendVerificationEmail = async (toEmail, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

  const emailData = {
    sender: {
      name: "TeamCollab",
      email: process.env.SMTP_FROM
    },
    to: [{ email: toEmail }],
    subject: 'Verify Your Email Address - TeamCollab',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;border-radius:12px;text-align:center;margin-bottom:20px;">
          <h1 style="color:#fff;margin:0;font-size:28px;">✅ Verify Your Email</h1>
        </div>
        
        <div style="background:#f8f9fa;padding:25px;border-radius:12px;margin-bottom:20px;">
          <p style="font-size:16px;color:#333;margin:0 0 15px;">Welcome to TeamCollab!</p>
          <p style="font-size:14px;color:#666;margin:0 0 15px;">Please verify your email address to complete your registration and activate your account.</p>
        </div>
        
        <div style="text-align:center;margin:30px 0;">
          <a href="${verificationUrl}" 
             style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
            Verify Email Address →
          </a>
        </div>
        
        <div style="background:#f0f0f0;padding:15px;border-radius:8px;margin:20px 0;">
          <p style="color:#666;margin:0;font-size:12px;text-align:center;">
            Or copy and paste this link in your browser:
          </p>
          <p style="color:#667eea;margin:10px 0 0;font-size:12px;word-break:break-all;text-align:center;">
            ${verificationUrl}
          </p>
        </div>
        
        <div style="background:#fff3cd;padding:15px;border-radius:8px;border:1px solid #ffc107;">
          <p style="color:#856404;margin:0;font-size:12px;">
            ℹ️ <strong>Note:</strong> This verification link expires in 24 hours.
          </p>
        </div>
        
        <p style="color:#6c757d;font-size:12px;text-align:center;margin-top:30px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `
  };

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );
    
    console.log('📧 Verification email sent:', response.data.messageId);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error('❌ Email error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

const sendInvitationEmail = async (toEmail, inviterName, teamName, tempPassword, loginUrl = null) => { 
  const defaultLoginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const finalLoginUrl = loginUrl || `${defaultLoginUrl}/login`;
 
  const emailData = {
    sender: {
      name: "TeamCollab",
      email: process.env.SMTP_FROM
    },
    to: [{ email: toEmail }],
    subject: `You're invited to join ${teamName} on TeamCollab`,
    htmlContent: ` 
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;"> 
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;border-radius:12px;text-align:center;margin-bottom:20px;">
          <h1 style="color:#fff;margin:0;font-size:28px;">🎉 You're Invited!</h1>
        </div>
        
        <div style="background:#f8f9fa;padding:25px;border-radius:12px;margin-bottom:20px;">
          <p style="font-size:16px;color:#333;margin:0 0 15px;"><strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on TeamCollab.</p>
          
          <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #667eea;">
            <p style="margin:0 0 10px;"><strong>📧 Email:</strong> ${toEmail}</p>
            <p style="margin:0;"><strong>🔐 Temporary Password:</strong> <code style="background:#e9ecef;padding:4px 8px;border-radius:4px;font-family:monospace;">${tempPassword}</code></p>
          </div>
        </div>
        
        <div style="text-align:center;margin:30px 0;">
          <a href="${finalLoginUrl}" 
             style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(102,126,234,0.4);"> 
            Login to TeamCollab →
          </a>
        </div>
        
        <div style="background:#fff3cd;padding:15px;border-radius:8px;border:1px solid #ffc107;">
          <p style="color:#856404;margin:0;font-size:14px;">
            ⚠️ <strong>Important:</strong> Please change your password after your first login. This temporary password expires in 7 days.
          </p>
        </div>
        
        <p style="color:#6c757d;font-size:12px;text-align:center;margin-top:30px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div> 
    `
  };

  try { 
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );
    
    console.log('📧 Email sent via Brevo API:', response.data.messageId); 
    return { success: true, messageId: response.data.messageId }; 
  } catch (error) { 
    console.error('❌ Email error:', error.response?.data || error.message); 
    return { success: false, error: error.response?.data || error.message }; 
  } 
}; 

const verifyConnection = async () => {
  try {
    await axios.get('https://api.brevo.com/v3/account', {
      headers: { 'api-key': process.env.BREVO_API_KEY }
    });
    console.log('✅ Brevo API connected');
    return true;
  } catch (error) {
    console.error('❌ Brevo API failed:', error.response?.data || error.message);
    return false;
  }
};

module.exports = { verifyConnection, sendInvitationEmail, sendVerificationEmail };
