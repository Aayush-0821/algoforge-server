import nodemailer from "nodemailer";

import { env } from "../../config/env";

import { verificationEmailTemplate, passwordResetEmailTemplate } from "./email.templates";

class EmailService {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: "Verify your AlgoForge account",
      html: verificationEmailTemplate(verificationUrl),
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: "Reset your AlgoForge password",
      html: passwordResetEmailTemplate(resetUrl),
    });
  }

  async verifyConnection(): Promise<void> {
    await this.transporter.verify();
  }
}

export const emailService = new EmailService();
