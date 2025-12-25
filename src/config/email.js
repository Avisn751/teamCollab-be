const axios = require('axios'); // npm install axios

// Send invitation email via Brevo API
const sendInvitationEmail = async (toEmail, inviterName, teamName, tempPassword) => { 
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; 
 
  const emailData = {
    sender: {
      name: "TeamCollab",
      email: process.env.SMTP_FROM // avisn751@gmail.com
    },
    to: [
      {
        email: toEmail
      }
    ],
    subject: `You're invited to join ${teamName} on TeamCollab`,
    htmlContent: ` 
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"> 
        <h2>🎉 You're Invited!</h2> 
        <p><strong>${inviterName}</strong> invited you to join <strong>${teamName}</strong>.</p> 
 
        <p><b>Email:</b> ${toEmail}</p> 
        <p><b>Temporary Password:</b> ${tempPassword}</p> 
 
        <a href="${loginUrl}/login" 
           style="display:inline-block;padding:12px 24px;background:#667eea;color:#fff;text-decoration:none;border-radius:6px"> 
          Login to TeamCollab 
        </a> 
 
        <p style="color:#e74c3c"><b>Change your password after login.</b></p> 
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

// Verify API connection
const verifyConnection = async () => {
  try {
    await axios.get('https://api.brevo.com/v3/account', {
      headers: {
        'api-key': process.env.BREVO_API_KEY
      }
    });
    console.log('✅ Brevo API connected');
    return true;
  } catch (error) {
    console.error('❌ Brevo API failed:', error.response?.data || error.message);
    return false;
  }
};

module.exports = { 
  verifyConnection, 
  sendInvitationEmail, 
};