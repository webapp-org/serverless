import mysql from "mysql2/promise";
import formData from "form-data";
import Mailgun from "mailgun.js";
import { cloudEvent } from "@google-cloud/functions-framework";

// Create a MySQL pool for database connections
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DATABASE_PORT,
});

// Mailgun client setup
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

// Function to update the emailSent field in your database
const updateEmailSentStatus = (email, callback) => {
  pool.query(
    "UPDATE your_table_name SET emailSent = true WHERE email = ?",
    [email],
    (error, results) => {
      if (error) throw error;
      console.log("Database updated successfully:", results);
      callback();
    }
  );
};

// Cloud Function to send email and update database
export const sendEmail = (cloudEvent) => {
  const { email: recipientEmail, verificationLink } = JSON.parse(
    Buffer.from(cloudEvent.data.message.data, "base64").toString()
  );

  const emailSubject = "Please Verify Your Email Address";
  const emailBody = `Thank you for registering. Please verify your email by clicking the link: ${verificationLink}`;

  mg.messages
    .create(process.env.VERIFICATION_DOMAIN, {
      from: "Cloud Webapp <mailgun@mail.chinmaygulhane.me>",
      to: [recipientEmail],
      subject: emailSubject,
      text: emailBody,
      html: `<p>${emailBody}</p>`,
    })
    .then((msg) => {
      console.log("Email sent successfully:", msg);
      // Update the database once the email is sent
      updateEmailSentStatus(recipientEmail, () =>
        console.log("Email sent status updated in database.")
      );
    })
    .catch((err) => console.log("Failed to send email:", err));
};

// Registering the Cloud Function
cloudEvent("sendEmail", sendEmail);
