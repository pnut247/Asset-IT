import { json, handleErrors, assertDbConfigured } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    assertDbConfigured()
    const user = await getCurrentUser()
    return json({ user })
  } catch (err) {
    return handleErrors(err)
  }
}
