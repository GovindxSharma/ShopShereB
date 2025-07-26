import nodemailer from "nodemailer"

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
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
    console.log(`✅ Email sent to ${to}`)
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message || error)
    throw error // so controller can handle it
  }
}
