// Resend email integration for Binda

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

// Check if Resend is configured
export const isResendConfigured = (): boolean => {
  return !!resend;
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend) {
    console.warn('Resend is not configured. Email not sent.');
    console.log(`Would send email to ${options.to}: ${options.subject}`);
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || 'Binda <noreply@binda.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log(`Email sent successfully. ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  details: {
    customer_name: string;
    service_title: string;
    date: string;
    time: string;
    address: string;
    provider_name: string;
    provider_email: string;
    provider_phone: string;
    amount: string;
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${details.customer_name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <div class="detail-row">
            <span class="label">Service:</span> ${details.service_title}
          </div>
          <div class="detail-row">
            <span class="label">Date:</span> ${details.date}
          </div>
          <div class="detail-row">
            <span class="label">Time:</span> ${details.time}
          </div>
          <div class="detail-row">
            <span class="label">Address:</span> ${details.address}
          </div>
          <div class="detail-row">
            <span class="label">Amount:</span> ${details.amount}
          </div>
          
          <h3 style="margin-top: 20px;">Provider Information</h3>
          <div class="detail-row">
            <span class="label">Name:</span> ${details.provider_name}
          </div>
          <div class="detail-row">
            <span class="label">Email:</span> ${details.provider_email}
          </div>
          <div class="detail-row">
            <span class="label">Phone:</span> ${details.provider_phone}
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from Binda. Please do not reply to this email.</p>
          <p>If you need to make changes to your booking, please contact your service provider directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Booking Confirmed: ${details.service_title} on ${details.date}`,
    html,
  });
}

/**
 * Send booking reminder email
 */
export async function sendBookingReminderEmail(
  to: string,
  details: {
    customer_name: string;
    service_title: string;
    date: string;
    time: string;
    provider_name: string;
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background-color: #fffbeb; padding: 20px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reminder: Upcoming Appointment</h1>
        </div>
        <div class="content">
          <p>Hi ${details.customer_name},</p>
          <p>This is a reminder that you have an upcoming appointment:</p>
          <p><strong>${details.service_title}</strong> with ${details.provider_name}</p>
          <p><strong>When:</strong> ${details.date} at ${details.time}</p>
          <p>We look forward to seeing you!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Reminder: ${details.service_title} appointment ${details.date}`,
    html,
  });
}


