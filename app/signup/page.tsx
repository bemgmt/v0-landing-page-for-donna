import { redirect } from "next/navigation"

export default function SignupPage() {
  redirect("https://donna-production.auth.us-east-1.amazoncognito.com/signup?client_id=pnjqk91v6gmtskghdmm3m6uho&response_type=code&scope=openid+email+profile&redirect_uri=https%3A%2F%2Faidonna.co%2Fapi%2Fauth%2Fcallback%2Fcognito")
}
