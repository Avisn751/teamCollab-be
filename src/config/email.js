const nodemailer = require('nodemailer'); 
 
// Brevo SMTP Transporter with SSL (Port 465)
const transporter = nodemailer.createTransport({ 
  host: process.env.SMTP_HOST, // smtp-relay.brevo.com 
  port: Number(process.env.SMTP_PORT) || 465, // Changed to 465
  secure: true, // MUST be true for 465 (SSL)
  auth: { 
    user: process.env.SMTP_USER, // 9ec54d001@smtp-brevo.com 
    pass: process.env.SMTP_PASS, // Your SMTP key 
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
}); 
 
// Verify SMTP connection on startup 
const verifyConnection = async () => { 
  try { 
    await transporter.verify(); 
    console.log('✅ Brevo SMTP connected'); 
    return true; 
  } catch (error) { 
    console.error('❌ Brevo SMTP failed:', error); 
    return false; 
  } 
}; 
 
// Send invitation email 
const sendInvitationEmail = async (toEmail, inviterName, teamName, tempPassword) => { 
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; 
 
  const mailOptions = { 
    from: process.env.SMTP_FROM, // MUST be verified in Brevo
    to: toEmail, 
    subject: `You're invited to join ${teamName} on TeamCollab`, 
    html: ` 
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
    `, 
  }; 
 
  try { 
    const info = await transporter.sendMail(mailOptions); 
    console.log('📧 Email sent:', info.messageId); 
    return { success: true, messageId: info.messageId }; 
  } catch (error) { 
    console.error('❌ Email error:', error); 
    return { success: false, error: error.message }; 
  } 
}; 
 
module.exports = { 
  transporter, 
  verifyConnection, 
  sendInvitationEmail, 
};