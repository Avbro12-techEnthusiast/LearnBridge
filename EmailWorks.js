// ============================================================
// FILE: backend/workers/emailWorker.js (EmailWorks.js)
// Handles email generation and sending via Nodemailer
// ============================================================

const nodemailer = require('nodemailer');
require('dotenv').config();

// Helper to determine if real SMTP credentials are provided
const hasValidSmtpConfig = () => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return host && user && pass &&
         !user.includes('your_smtp') &&
         !pass.includes('your_smtp') &&
         host !== 'smtp.example.com';
};

// Create reusable transporter
let transporter = null;
if (hasValidSmtpConfig()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  console.log('ℹ️ EmailWorker: SMTP credentials not fully configured in .env. Running in development simulation mode.');
}

/**
 * Build a friendly HTML email body for a parent
 */
function buildEmailBody({ studentName, parentName, badges = [], teacherName = 'Your Teacher', trackingUrl = '' }) {
  const badgeRows = (badges || []).map(b => {
    let dateStr = 'Today';
    try {
      const rawDate = b.awarded_at || b.created_at || Date.now();
      dateStr = new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      dateStr = 'Recently';
    }

    return `
      <tr>
        <td style="padding:10px 14px; font-size:24px; text-align:center; vertical-align:middle;">${b.badge_emoji || '⭐'}</td>
        <td style="padding:10px 14px; font-weight:600; color:#1e293b; vertical-align:middle;">${b.badge_label || 'Achievement'}</td>
        <td style="padding:10px 14px; color:#64748b; font-size:14px; vertical-align:middle;">${b.notes || 'Great effort and positive participation!'}</td>
        <td style="padding:10px 14px; color:#94a3b8; font-size:13px; text-align:right; vertical-align:middle;">${dateStr}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Student Progress Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
    
    <!-- Header banner -->
    <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:36px 36px 32px;color:#ffffff;">
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Classroom Achievement Notice</p>
      <h1 style="margin:10px 0 0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">${studentName || 'Student'} earned badges! 🎉</h1>
    </div>

    <!-- Body content -->
    <div style="padding:32px 36px;">
      <p style="color:#1e293b;font-size:16px;font-weight:600;margin-top:0;">Dear ${parentName || 'Parent / Guardian'},</p>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin-bottom:24px;">
        We are thrilled to share that <strong>${studentName || 'your student'}</strong> has been recognized with positive behavior badges by their teacher, <strong>${teacherName}</strong>.
      </p>

      <!-- Badges Table -->
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#ede9fe;border-bottom:1px solid #ddd6fe;">
            <th style="padding:10px 14px;text-align:center;color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:50px;">Badge</th>
            <th style="padding:10px 14px;text-align:left;color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Achievement</th>
            <th style="padding:10px 14px;text-align:left;color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Teacher Note</th>
            <th style="padding:10px 14px;text-align:right;color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:70px;">Date</th>
          </tr>
        </thead>
        <tbody>
          ${badgeRows}
        </tbody>
      </table>

      <p style="color:#475569;font-size:15px;line-height:1.6;margin-top:24px;">
        Positive reinforcement plays an invaluable role in building confidence and consistent habits. Please celebrate this achievement together at home!
      </p>

      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9;">
        <p style="color:#94a3b8;font-size:13px;margin:0;">Warm regards,</p>
        <p style="color:#1e293b;font-size:15px;font-weight:600;margin:4px 0 0;">${teacherName}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:18px 36px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">This automated notification was generated by LearnBridge Teacher Dashboard. Please do not reply directly to this email.</p>
    </div>

    ${trackingUrl ? `<img src="${trackingUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />` : ''}
  </div>
</body>
</html>
  `;
}

/**
 * Generate email content for a student (does NOT send yet)
 */
function generateEmailContent({ student, badges = [], teacherName = 'Your Teacher', trackingToken = '', appUrl = 'http://localhost:4000' }) {
  const token = trackingToken || (student && student.id) || Date.now().toString();
  const trackingUrl = `${appUrl}/api/track/${token}`;
  const studentName = (student && student.name) || 'Student';
  const badgeCount = (badges && badges.length) || 1;
  const subject = `🌟 ${studentName} earned ${badgeCount} badge${badgeCount > 1 ? 's' : ''} today!`;
  
  const body = buildEmailBody({
    studentName,
    parentName: (student && student.parent_name) || 'Parent',
    badges,
    teacherName,
    trackingUrl,
  });

  return { subject, body };
}

/**
 * Send a single email
 */
async function sendEmail({ to, subject, html }) {
  if (transporter && hasValidSmtpConfig()) {
    return await transporter.sendMail({
      from: `"LearnBridge Teacher Dashboard" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }

  // Development simulation fallback
  console.log(`📨 [Email Simulated] To: ${to} | Subject: "${subject}"`);
  return {
    simulated: true,
    messageId: `sim-${Date.now()}@learnbridge.local`,
    to,
    subject,
  };
}

module.exports = {
  buildEmailBody,
  generateEmailContent,
  sendEmail,
};
