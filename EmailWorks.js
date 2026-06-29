// ============================================================
// FILE: backend/workers/emailWorker.js
// Handles email generation and sending via Nodemailer
// ============================================================

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Build a friendly HTML email body for a parent
 */
function buildEmailBody({ studentName, parentName, badges, teacherName, trackingUrl }) {
  // FIXED: added safe fallback parameter to prevent 'Invalid Date' formatting errors
  const badgeRows = badges.map(b => `
    <tr>
      <td style="padding:8px 12px; font-size:22px;">${b.badge_emoji}</td>
      <td style="padding:8px 12px; font-weight:600; color:#1e293b;">${b.badge_label}</td>
      <td style="padding:8px 12px; color:#64748b;">${b.notes || 'Great effort!'}</td>
      <td style="padding:8px 12px; color:#94a3b8; font-size:13px;">${new Date(b.awarded_at || b.created_at || Date.now()).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 36px;">
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">Student Progress Update</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;">${studentName} earned badges! 🎉</h1>
    </div>

    <div style="padding:32px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.6;">Dear ${parentName},</p>
      <p style="color:#475569;font-size:15px;line-height:1.6;">
        We are delighted to share that <strong>${studentName}</strong> has received the following 
        behaviour badges from their teacher <strong>${teacherName}</strong>:
      </p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#ede9fe;">
            <th style="padding:10px 12px;text-align:left;color:#7c3aed;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Badge</th>
            <th style="padding:10px 12px;text-align:left;color:#7c3aed;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Achievement</th>
            <th style="padding:10px 12px;text-align:left;color:#7c3aed;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Note</th>
            <th style="padding:10px 12px;text-align:left;color:#7c3aed;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
          </tr>
        </thead>
        <tbody>${badgeRows}</tbody>
      </table>

      <p style="color:#475569;font-size:15px;line-height:1.6;">
        Keep encouraging ${studentName} to keep up this fantastic work at home. Small celebrations make a big difference!
      </p>

      <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Warm regards,<br><strong style="color:#475569;">${teacherName}</strong></p>
    </div>

    <div style="background:#f1f5f9;padding:16px 36px;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">This email was sent by your school's teacher dashboard. Please do not reply directly.</p>
    </div>

    <img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />
  </div>
</body>
</html>
  `;
}

/**
 * Generate email content for a student (does NOT send yet)
 */
function generateEmailContent({ student, badges, teacherName, trackingToken, appUrl }) {
  const trackingUrl = `${appUrl}/api/track/${trackingToken}`;
  const subject = `🌟 ${student.name} earned ${badges.length} badge${badges.length > 1 ? 's' : ''} today!`;
  const body = buildEmailBody({
    studentName: student.name,
    parentName: student.parent_name,
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
  await transporter.sendMail({
    from: `"Teacher Dashboard" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { generateEmailContent, sendEmail };