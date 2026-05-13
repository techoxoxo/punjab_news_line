import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { query } from './db'
import { User } from './types'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        try {
          const result = await query(
            'SELECT user_code, user_name as name, user_login as username, active FROM ox_user WHERE user_login = $1 AND user_pwd = $2 AND active IN (1, 2)',
            [credentials.username, credentials.password]
          )

          if (result && result.length > 0) {
            const row = result[0] as User
            return {
              id: row.user_code.toString(),
              name: row.name,
              username: row.username,
              role: 'admin', // Defaulting to admin for now, can be parsed from right_list later
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
        }
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
}
