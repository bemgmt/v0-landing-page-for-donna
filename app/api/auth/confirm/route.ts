import { NextResponse } from "next/server"
import { CognitoIdentityProviderClient, ConfirmSignUpCommand, ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider"
import crypto from "crypto"
import { z } from "zod"

const confirmSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1).optional(),
  action: z.enum(["confirm", "resend"]),
})

function getSecretHash(username: string): string {
  const clientId = process.env.COGNITO_CLIENT_ID || ""
  const clientSecret = process.env.COGNITO_CLIENT_SECRET || ""
  if (!clientSecret) return ""
  return crypto.createHmac("sha256", clientSecret).update(username + clientId).digest("base64")
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = confirmSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { email, code, action } = parsed.data
    const clientId = process.env.COGNITO_CLIENT_ID
    if (!clientId) throw new Error("Missing COGNITO_CLIENT_ID")

    const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "us-east-1" })
    
    if (action === "resend") {
      const command = new ResendConfirmationCodeCommand({
        ClientId: clientId,
        Username: email,
        SecretHash: getSecretHash(email),
      })
      await client.send(command)
      return NextResponse.json({ success: true, message: "Code resent successfully" })
    }

    if (action === "confirm") {
      if (!code) {
        return NextResponse.json({ error: "Confirmation code is required" }, { status: 400 })
      }
      
      const command = new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
        SecretHash: getSecretHash(email),
      })

      try {
        await client.send(command)
        return NextResponse.json({ success: true, message: "Account confirmed successfully" })
      } catch (confirmErr: any) {
        // Treat "Current status is CONFIRMED" as success
        if (confirmErr.name === "NotAuthorizedException" && confirmErr.message.includes("Current status is CONFIRMED")) {
          return NextResponse.json({ success: true, message: "Account is already confirmed" })
        }
        throw confirmErr
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (err: any) {
    console.error("[confirm] error:", err.name, err.message)
    return NextResponse.json({ error: err.message || "An error occurred during confirmation" }, { status: 400 })
  }
}
