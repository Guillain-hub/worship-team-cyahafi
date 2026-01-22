import { redirect } from "next/navigation"

export default function RegisterPage() {
  // Redirect to the unified login page which includes the register option
  redirect('/login')
}
