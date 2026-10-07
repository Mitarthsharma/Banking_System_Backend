require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
async function sendRegistrationEmail(userEmail, name) {

    const subject = "Welcome to Banking System";

    const text = `Hello ${name},

Welcome to our Banking System!

Your account has been successfully created.

You can now log in and start using the banking system.

Thank you!`;

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Welcome to Banking System, ${name}! 🎉</h2>

            <p>
                Your account has been successfully created.
            </p>

            <p>
                You can now log in and start using the banking system.
            </p>

            <p>
                Thank you for registering with us!
            </p>

            <br>

            <p>
                Regards,<br>
                Banking System Team
            </p>
        </div>
    `;

    await sendEmail(
        userEmail,
        subject,
        text,
        html
    );
}
module.exports = {sendRegistrationEmail};