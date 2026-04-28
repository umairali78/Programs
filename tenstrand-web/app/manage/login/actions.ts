'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: { error: string }, formData: FormData) {
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/manage/programs'
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || password !== adminPassword) {
    return { error: 'Incorrect password' } satisfies { error: string }
  }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', adminPassword, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  redirect(next)
}
