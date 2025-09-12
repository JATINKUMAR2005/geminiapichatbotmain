import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, type, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !type || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Create email content
    const emailContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Type: ${type}
Subject: ${subject}

Message:
${message}

---
Sent from AI Assistant Contact Form
Time: ${new Date().toLocaleString()}
    `.trim()

    // In a real application, you would integrate with an email service like:
    // - Resend
    // - SendGrid
    // - Nodemailer with SMTP
    // - AWS SES

    // For now, we'll simulate sending the email
    console.log("Email would be sent to: jatinkumar787829@gmail.com")
    console.log("Email content:", emailContent)

    // You can integrate with email services here
    // Example with Resend:
    /*
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'contact@yourdomain.com',
      to: 'jatinkumar787829@gmail.com',
      subject: `Contact Form: ${subject}`,
      text: emailContent,
      replyTo: email
    })
    */

    return NextResponse.json({ message: "Message sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
