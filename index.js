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
  const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
  const MAILGUN_SENDER_EMAIL = process.env.MAILGUN_SENDER_EMAIL;

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: "api", key: MAILGUN_API_KEY });

  const emailSubject = "Please Verify Your Email Address";
  let emailBody =
    "<html>" +
    "<body>" +
    "<h1>Welcome to Cloud Webapp !</h1>" +
    "<p>Please click the following link to verify your email:</p>" +
    '<a href="' +
    verificationLink +
    '">Verify Email</a>' +
    "<h3>Thanks<h3>" +
    "<p>Cloud Webapp Team </p>" +
    "</body>" +
    "</html>";

  try {
    await mg.messages.create(MAILGUN_DOMAIN, {
      from: MAILGUN_SENDER_EMAIL,
      to: [recipientEmail],
      subject: emailSubject,
      html: emailBody,
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
