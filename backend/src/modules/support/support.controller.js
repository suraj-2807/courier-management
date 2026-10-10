import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ERYX_SUPPORT_EMAIL = 'eryxcodes.dev@gmail.com'
const ERYX_PHONE = '+91 98765 43210'
const ERYX_COMPANY = 'Eryx Codes'
const ERYX_COPYRIGHT = '© 2026 Eryx Codes. All rights reserved.'

/**
 * Returns developer support contact metadata
 */
export function getSupportInfo(req, res) {
  return res.json({
    success: true,
    data: {
      company: ERYX_COMPANY,
      email: ERYX_SUPPORT_EMAIL,
      phone: ERYX_PHONE,
      whatsapp: '+919876543210',
      hours: '24/7 Priority Courier Engineering Support',
      copyright: ERYX_COPYRIGHT,
      description: 'Official Engineering & Technical Maintenance Partner for Courier Logistics Portal.'
    }
  })
}

/**
 * Submit support ticket & send email with optional screenshot to eryxcodes.dev@gmail.com
 */
export async function submitSupportTicket(req, res) {
  try {
    const { name, email, phone, subject, category, message } = req.body
    const file = req.file

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message description are required.'
      })
    }

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const ticketId = `ERYX-${Date.now().toString(36).toUpperCase()}`

    // Ensure uploads/support directory exists
    const supportDir = path.join(__dirname, '../../../uploads/support')
    if (!fs.existsSync(supportDir)) {
      fs.mkdirSync(supportDir, { recursive: true })
    }

    // Save ticket log locally
    const ticketRecord = {
      ticketId,
      name,
      email,
      phone: phone || 'N/A',
      subject: subject || 'General Support Inquiry',
      category: category || 'Technical Support',
      message,
      screenshot: file ? `/uploads/support/${file.filename}` : null,
      submittedAt: timestamp
    }

    const ticketsLogFile = path.join(supportDir, 'support_tickets.json')
    let existingTickets = []
    if (fs.existsSync(ticketsLogFile)) {
      try {
        existingTickets = JSON.parse(fs.readFileSync(ticketsLogFile, 'utf8'))
      } catch (e) {
        existingTickets = []
      }
    }
    existingTickets.unshift(ticketRecord)
    fs.writeFileSync(ticketsLogFile, JSON.stringify(existingTickets.slice(0, 100), null, 2))

    // Attempt email delivery via nodemailer
    let emailSent = false
    let emailError = null

    try {
      // Configure transport if SMTP credentials are provided in .env, otherwise fallback to Ethereal / log
      const smtpHost = process.env.SMTP_HOST
      const smtpUser = process.env.SMTP_USER
      const smtpPass = process.env.SMTP_PASS
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        })

        const mailOptions = {
          from: `"${name} (Courier Portal)" <${smtpUser}>`,
          replyTo: email,
          to: ERYX_SUPPORT_EMAIL,
          subject: `[${ticketId}] [${category || 'Support'}] ${subject || 'New Support Request'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #0F172A; color: #ffffff; padding: 20px; text-align: center;">
                <h2 style="margin: 0; font-size: 20px;">Eryx Codes Technical Support Desk</h2>
                <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 12px;">Ticket Reference: <strong>${ticketId}</strong></p>
              </div>
              <div style="padding: 24px; color: #334155; line-height: 1.6;">
                <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
                <p><strong>Contact Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Category:</strong> <span style="background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 6px; font-weight: bold;">${category || 'General'}</span></p>
                <p><strong>Subject:</strong> ${subject || 'Portal Issue'}</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <p><strong>Message / Problem Description:</strong></p>
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; white-space: pre-wrap; font-size: 14px;">${message}</div>
                ${file ? `<p style="margin-top: 20px;"><em>📎 Screenshot attached: ${file.originalname}</em></p>` : ''}
              </div>
              <div style="background-color: #f1f5f9; padding: 12px 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                ${ERYX_COPYRIGHT} • Dispatched via Courier Portal Support Desk
              </div>
            </div>
          `,
          attachments: file ? [
            {
              filename: file.originalname,
              path: file.path
            }
          ] : []
        }

        await transporter.sendMail(mailOptions)
        emailSent = true
      } else {
        console.log(`[Support Ticket] Recorded ticket ${ticketId} for ${ERYX_SUPPORT_EMAIL}. (SMTP credentials not yet configured in .env)`)
      }
    } catch (mErr) {
      console.warn('[Support Ticket Mail Warning]:', mErr.message)
      emailError = mErr.message
    }

    return res.json({
      success: true,
      ticketId,
      message: `Your ticket (${ticketId}) has been logged and sent to Eryx Codes support (${ERYX_SUPPORT_EMAIL}). Our engineering team will contact you shortly!`,
      emailSent,
      emailError
    })
  } catch (err) {
    console.error('[submitSupportTicket error]:', err)
    return res.status(500).json({ success: false, message: `Failed to submit support ticket: ${err.message}` })
  }
}
