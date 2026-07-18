export function getVerificationEmailTemplate(url: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333333; text-align: center;">Welcome to our Hotel!</h2>
      <p>Thank you for registering with the Hotel Management System. Please click the button below to verify your email address and activate your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #666666; font-size: 12px;">If the button above doesn't work, copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #007bff;">${url}</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="color: #999999; font-size: 12px; text-align: center;">This is an automated email. Please do not reply to it.</p>
    </div>
  `;
}

export function getResetPasswordEmailTemplate(
  url: string,
  token: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333333; text-align: center;">Password Reset Request</h2>
      <p>We received a request to reset the password for your account. Please use the following token to complete the password reset:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
        <span style="font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #333;">${token}</span>
      </div>
      <p>Post this token along with your new password to the reset endpoint: <strong style="word-break: break-all;">${url}</strong></p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="color: #999999; font-size: 12px; text-align: center;">This is an automated email. Please do not reply to it.</p>
    </div>
  `;
}
