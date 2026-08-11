export const verificationEmailTemplate = (verificationUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Welcome to AlgoForge!</h2>

        <p>Thanks for creating your AlgoForge account.</p>

        <p>Please verify your email address by clicking the button below:</p>

        <a
          href="${verificationUrl}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#000;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Verify Email
        </a>

        <p>This verification link will expire soon.</p>

        <p>If you did not create this account, you can safely ignore this email.</p>

        <p>— AlgoForge Team</p>
      </body>
    </html>
  `;
};

export const passwordResetEmailTemplate = (resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Reset your AlgoForge password</h2>

        <p>We received a request to reset your password.</p>

        <p>Click the button below to create a new password:</p>

        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#000;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Reset Password
        </a>

        <p>This reset link will expire in 15 minutes.</p>

        <p>
          If you did not request a password reset, you can safely ignore
          this email.
        </p>

        <p>— AlgoForge Team</p>
      </body>
    </html>
  `;
};
