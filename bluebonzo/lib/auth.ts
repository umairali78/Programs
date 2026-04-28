import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { isDbAvailable } from '@/lib/db/client'

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name: string | null; tier: string; image?: string | null }
  }
  interface User { id: string; tier: string }
}

declare module 'next-auth/jwt' {
  interface JWT { id: string; tier: string }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Demo mode: allow demo@bluebonzo.ai / demo123
        if (!isDbAvailable()) {
          if (credentials.email === 'demo@bluebonzo.ai' && credentials.password === 'demo123') {
            return { id: 'demo-user', email: 'demo@bluebonzo.ai', name: 'Demo User', tier: 'enterprise' }
          }
          return null
        }

        const { db } = await import('@/lib/db/client')
        const { users } = await import('@/lib/db/schema')
        const { eq } = await import('drizzle-orm')

        const [user] = await db!.select().from(users).where(eq(users.email, credentials.email)).limit(1)
        if (!user?.password) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name, tier: user.tier }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tier = user.tier
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.tier = token.tier as string
      return session
    },
  },
}

export const getSession = () => getServerSession(authOptions)

export async function requireAuth() {
  const session = await getSession()
  if (!session) throw new Error('Unauthenticated')
  return session
}
