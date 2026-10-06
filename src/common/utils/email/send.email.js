import nodemailer from "nodemailer";
import {
  APP_EMAIL,
  APP_NAME,
  APP_PASSWORD,
} from "../../../../config/config.service.js";
import { BadRequestException } from "../../exceptions/error.exception.js";
export const userEmailKey = ({ email, subject }) => {
  return `User::${email}::${subject}::otp`;
};
export const userEmailTrialsKey = ({ email, subject }) => {
  return `${userEmailKey({ email, subject })}::Trials`;
};
// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: APP_EMAIL,
    pass: APP_PASSWORD,
  },
});

export const sendEmail = async ({
  to, // list of recipients
  cc,
  bcc,
  subject, // subject line
  text, // plain text body
  html, // HTML body
  attachments = [],
}) => {
  try {
    if (!to?.length && !cc?.length && !bcc?.length) {
      throw BadRequestException({ message: "Missing email recipients" });
    }
    if (!text?.length && !html?.length && !attachments?.length) {
      throw BadRequestException({ message: "Missing email content" });
    }
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${APP_EMAIL}>`, // sender address
      to, // list of recipients
      cc,
      bcc,
      subject, // subject line
      text, // plain text body
      html, // HTML body
      attachments,
    });

    console.log("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
};
