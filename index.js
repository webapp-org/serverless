import { cloudEvent } from "@google-cloud/functions-framework";
import formData from "form-data";
import Mailgun from "mailgun.js";

export const sendEmail = async (cloudEvent) => {
  const { email: recipientEmail, verificationLink } = JSON.parse(
    Buffer.from(cloudEvent.data.message.data, "base64").toString()
  );

  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = "mail.chinmaygulhane.me";

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: "api", key: MAILGUN_API_KEY });

  const emailSubject = "Please Verify Your Email Address";
  const emailBody = `Thank you for registering. Please verify your email by clicking the link: ${verificationLink}`;

  mg.messages
    .create(MAILGUN_DOMAIN, {
      from: "Cloud Webapp <mailgun@mail.chinmaygulhane.me>",
      to: [recipientEmail],
      subject: emailSubject,
      text: emailBody,
      html: `<p>${emailBody}</p>`,
    })
    .then((msg) => console.log("Email sent successfully:", msg))
    .catch((err) => console.log("Failed to send email:", err));
};

cloudEvent("sendEmail", sendEmail);
