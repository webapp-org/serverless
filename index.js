import mysql from "mysql2/promise";
import formData from "form-data";
import Mailgun from "mailgun.js";
import { cloudEvent } from "@google-cloud/functions-framework";

// Function to update db on email sent
const updateEmailSentStatus = async (
  email,
  verificationTokenExpires,
  emailSentTime
) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      database: process.env.DATABASE,
    });
    console.log("Successfully connected to the database");

    const [results] = await connection.execute(
      "UPDATE Users SET emailSent = true, verificationTokenExpires = ?, emailSentTime = ? WHERE username = ?",
      [verificationTokenExpires, emailSentTime, email]
    );
    console.log("Database updated successfully:", results);
    // Close the database connection
    await connection.end();
  } catch (error) {
    console.error("Failed to connect to the database:", error);
  }
};

// send email function
export const sendEmail = async (cloudEvent) => {
  const { email: recipientEmail, verificationLink } = JSON.parse(
    Buffer.from(cloudEvent.data.message.data, "base64").toString()
  );

  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = "mail.chinmaygulhane.me";

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: "api", key: MAILGUN_API_KEY });

  const emailSubject = "Please Verify Your Email Address";
  const emailBody =
    `
    <p>Thank you for registering. Please verify your email by clicking the link below:</p>` +
    `<a href="${verificationLink}" target="_blank">Verify Email</a>`;

  try {
    await mg.messages.create(MAILGUN_DOMAIN, {
      from: "Cloud Webapp <mailgun@mail.chinmaygulhane.me>",
      to: [recipientEmail],
      subject: emailSubject,
      text: emailBody,
      html: `<p>${emailBody}</p>`,
    });
    console.log("Email sent successfully");
    const verificationTokenExpires = new Date(Date.now() + 120000);
    const emailSentTime = new Date();
    // Update the database once the email is sent
    await updateEmailSentStatus(
      recipientEmail,
      verificationTokenExpires,
      emailSentTime
    );
  } catch (err) {
    console.log("Failed to send email or update the database:", err);
  }
};

cloudEvent("sendEmail", sendEmail);
