/**
 * Email Service
 * Sends follow-up reminder emails using Nodemailer.
 * Configure EMAIL_* env vars in your .env to activate.
 */

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Email] EMAIL_USER or EMAIL_PASS not set — email notifications disabled.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

/**
 * Send follow-up reminder email for a single job application.
 */
async function sendFollowUpEmail(job) {
  const t = getTransporter();
  if (!t) return false;

  const to = process.env.EMAIL_TO || process.env.EMAIL_USER;
  const appliedDate = new Date(job.applied_date).toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; margin: 0; padding: 24px; }
        .card { background: #fff; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; }
        .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        h2 { color: #0f172a; margin: 0 0 8px; font-size: 22px; }
        .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        .detail-row { display: flex; gap: 8px; margin-bottom: 8px; font-size: 14px; }
        .label { color: #94a3b8; min-width: 100px; }
        .value { color: #1e293b; font-weight: 500; }
        .cta { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #0f172a; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
        .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">⏰ Follow-Up Reminder</span>
        <h2>${job.role} at ${job.company}</h2>
        <p class="meta">Applied ${appliedDate} &mdash; 7+ days with no update</p>

        <div class="detail-row"><span class="label">Company</span><span class="value">${job.company}</span></div>
        <div class="detail-row"><span class="label">Role</span><span class="value">${job.role}</span></div>
        <div class="detail-row"><span class="label">Location</span><span class="value">${job.location}</span></div>
        <div class="detail-row"><span class="label">Status</span><span class="value">${job.status}</span></div>
        ${job.notes ? `<div class="detail-row"><span class="label">Notes</span><span class="value">${job.notes}</span></div>` : ""}

        ${job.apply_link ? `<a class="cta" href="${job.apply_link}" target="_blank">View Job Listing</a>` : ""}

        <p class="footer">Sent by your Germany Visa Job Tracker &bull; Update your application status in the dashboard</p>
      </div>
    </body>
    </html>
  `;

  try {
    await t.sendMail({
      from: `"Visa Job Tracker" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: `⏰ Follow-up: ${job.role} at ${job.company} — 7 days, no update`,
      html,
    });
    console.log(`[Email] Sent follow-up reminder for job #${job.id}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err.message);
    return false;
  }
}

/**
 * Send a digest email for multiple stale applications.
 */
async function sendDigestEmail(jobs) {
  const t = getTransporter();
  if (!t || !jobs.length) return false;

  const to = process.env.EMAIL_TO || process.env.EMAIL_USER;

  const jobRows = jobs
    .map(
      (job) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9">${job.company}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9">${job.role}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9">${new Date(job.applied_date).toLocaleDateString("en-GB")}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9">${job.status}</td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; padding: 24px; }
        .card { background: #fff; border-radius: 12px; padding: 32px; max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; }
        h2 { color: #0f172a; margin: 0 0 4px; }
        .sub { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; padding: 8px; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        .footer { margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>📋 Application Follow-Up Digest</h2>
        <p class="sub">${jobs.length} application${jobs.length > 1 ? "s" : ""} with no update in 7+ days</p>
        <table>
          <thead>
            <tr>
              <th>Company</th><th>Role</th><th>Applied</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${jobRows}</tbody>
        </table>
        <p class="footer">Sent by your Germany Visa Job Tracker &bull; Open your dashboard to update statuses</p>
      </div>
    </body>
    </html>
  `;

  try {
    await t.sendMail({
      from: `"Visa Job Tracker" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: `📋 Follow-Up Digest: ${jobs.length} application${jobs.length > 1 ? "s" : ""} need attention`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[Email] Digest send failed:", err.message);
    return false;
  }
}

module.exports = { sendFollowUpEmail, sendDigestEmail };
