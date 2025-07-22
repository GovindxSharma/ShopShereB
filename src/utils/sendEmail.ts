import nodemailer from "nodemailer"

export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const mailOptions = {
    from: `"Shopshere" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  }

  await transporter.sendMail(mailOptions)
}
