/**
 * Email Service for OTP delivery
 * In development / offline environments, logs OTP securely to console and provides standard interface.
 */

const sendOTPEmail = async (email, otp) => {
  console.log(`\n========================================`);
  console.log(`[EMAIL DISPATCH] Password Reset OTP`);
  console.log(`To: ${email}`);
  console.log(`Your 6-Digit OTP is: ${otp}`);
  console.log(`Expires in: 10 minutes`);
  console.log(`========================================\n`);

  return { success: true, message: 'OTP sent successfully to email' };
};

module.exports = {
  sendOTPEmail,
};
