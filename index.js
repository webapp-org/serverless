import { cloudEvent } from "@google-cloud/functions-framework";
import formData from "form-data";
import Mailgun from "mailgun.js";

cloudEvent("sendEmail", async (cloudEvent) => {
  const messageData = JSON.parse(
    Buffer.from(cloudEvent.data.message.data, "base64").toString()
  );

  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = "mail.chinmaygulhane.me";
  const recipientEmail = messageData.email;

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: "api", key: MAILGUN_API_KEY });

  mg.messages
    .create(MAILGUN_DOMAIN, {
      from: "Excited User <mailgun@mail.chinmaygulhane.me>",
      to: [recipientEmail],
      subject: "Hello",
      text: "Testing some Mailgun awesomeness!",
      html: "<h1>Testing some Mailgun awesomeness!</h1>",
    })
    .then((msg) => console.log(msg))
    .catch((err) => console.log(err));
});
