import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, role, useCase, type } = body

    // Validate required fields
    if (!name || !email || !company || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("SMTP credentials not configured")
      return NextResponse.json(
        { error: "Email service not configured. Please contact support." },
        { status: 500 }
      )
    }

    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Verify SMTP connection
    try {
      await transporter.verify()
      console.log("SMTP connection verified")
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError)
      return NextResponse.json(
        { error: "Email server connection failed. Please contact support." },
        { status: 500 }
      )
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: `DONNA ${type === "waitlist" ? "Waitlist Signup" : "Demo Request"} - ${name}`,
      html: `
        <h2>New ${type === "waitlist" ? "Waitlist Signup" : "Demo Request"}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Use Case:</strong></p>
        <p>${useCase || "Not provided"}</p>
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      `,
    }

    console.log("Sending notification email to:", process.env.SMTP_USER)
    await transporter.sendMail(mailOptions)
    console.log("Notification email sent successfully")

    // Also send confirmation to user
    const userMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "DONNA - We Received Your Request",
      html: `
        <h2>Thank you, ${name}!</h2>
        <p>We've received your ${type === "waitlist" ? "waitlist signup" : "demo request"}. Our team will be in touch within 24 hours.</p>
        <p>In the meantime, feel free to check out our documentation at <a href="#">docs.donna.ai</a></p>
        <p>Best regards,<br>The DONNA Team</p>
      `,
    }

    console.log("Sending confirmation email to:", email)
    await transporter.sendMail(userMailOptions)
    console.log("Confirmation email sent successfully")

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Email error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to send email: ${errorMessage}` }, { status: 500 })
  }
}
