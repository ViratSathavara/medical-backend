import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      if (env.SMTP_HOST && env.SMTP_USER) {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD
          }
        });
      } else {
        logger.info('[EmailService] SMTP credentials not fully configured. Using simulation logger mode.');
      }
    } catch (err) {
      logger.error('[EmailService] Failed to initialize mail transporter:', err);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.info(`[Email SIMULATION] To: ${options.to} | Subject: ${options.subject}`);
        return true;
      }

      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        html: options.html
      });

      return true;
    } catch (error) {
      logger.error(`[EmailService] Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendAppointmentConfirmation(patientEmail: string, appointmentData: any): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0284c7;">MedPulse Hospital - Appointment Confirmed</h2>
        <p>Dear Patient,</p>
        <p>Your appointment has been successfully scheduled:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p><strong>Appointment ID:</strong> ${appointmentData.appointmentNumber}</p>
          <p><strong>Doctor:</strong> Dr. ${appointmentData.doctorName}</p>
          <p><strong>Department:</strong> ${appointmentData.departmentName}</p>
          <p><strong>Date:</strong> ${new Date(appointmentData.appointmentDate).toDateString()}</p>
          <p><strong>Time Slot:</strong> ${appointmentData.appointmentTime}</p>
        </div>
        <p>Please arrive 15 minutes before your scheduled appointment time.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">MedPulse Hospital &bull; 742 Evergreen Medical Park, New York &bull; 24/7 Helpline: +1 (555) 911-0000</p>
      </div>
    `;

    return this.sendEmail({
      to: patientEmail,
      subject: `Appointment Confirmed - ${appointmentData.appointmentNumber}`,
      html
    });
  }

  async sendWelcomeEmail(email: string, name: string, role: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0284c7;">Welcome to MedPulse Healthcare System</h2>
        <p>Hello ${name},</p>
        <p>Your account as a <strong>${role}</strong> has been created successfully.</p>
        <p>You can now log in to the portal using your credentials to view your health records, schedule appointments, and stay connected with your care team.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">MedPulse Hospital Management System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to MedPulse Healthcare',
      html
    });
  }
}

export const emailService = new EmailService();
