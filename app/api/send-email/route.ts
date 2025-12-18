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
    const port = parseInt(process.env.SMTP_PORT || "465")
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: port,
      secure: port === 465, // true for 465, false for other ports (like 587)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Try to verify SMTP connection (optional - will fail gracefully if it doesn't work)
    try {
      await transporter.verify()
      console.log("SMTP connection verified")
    } catch (verifyError) {
      console.warn("SMTP verification failed, but will attempt to send anyway:", verifyError)
      // Don't return error here - sometimes verification fails but sending works
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
    try {
      await transporter.sendMail(mailOptions)
      console.log("Notification email sent successfully")
    } catch (sendError) {
      console.error("Failed to send notification email:", sendError)
      const errorMessage = sendError instanceof Error ? sendError.message : "Unknown error"
      // Check for common Gmail errors
      if (errorMessage.includes("Invalid login") || errorMessage.includes("authentication")) {
        return NextResponse.json(
          { error: "Gmail authentication failed. Please check your app-specific password." },
          { status: 500 }
        )
      }
      if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("timeout")) {
        return NextResponse.json(
          { error: "Could not connect to Gmail SMTP server. Please check your network connection." },
          { status: 500 }
        )
      }
      throw sendError // Re-throw to be caught by outer catch
    }

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
    try {
      await transporter.sendMail(userMailOptions)
      console.log("Confirmation email sent successfully")
    } catch (sendError) {
      console.error("Failed to send confirmation email:", sendError)
      // Don't fail the whole request if confirmation email fails
      // The notification email was already sent
    }

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Email error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to send email: ${errorMessage}` }, { status: 500 })
  }
}
