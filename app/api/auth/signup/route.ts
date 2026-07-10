import { NextResponse } from "next/server"
import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider"
import crypto from "crypto"
import { z } from "zod"

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
    const parsed = signupSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 })
    }

    const { email, password } = parsed.data
    const clientId = process.env.COGNITO_CLIENT_ID
    if (!clientId) throw new Error("Missing COGNITO_CLIENT_ID")

    const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "us-east-1" })
    
    const command = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      SecretHash: getSecretHash(email),
      UserAttributes: [
        { Name: "email", Value: email }
      ]
    })

    const response = await client.send(command)

    return NextResponse.json({ 
      success: true, 
      userConfirmed: response.UserConfirmed,
      userSub: response.UserSub
    })

  } catch (err: any) {
    console.error("[signup] error:", err.name, err.message)
    return NextResponse.json({ error: err.message || "An error occurred during sign up" }, { status: 400 })
  }
}
