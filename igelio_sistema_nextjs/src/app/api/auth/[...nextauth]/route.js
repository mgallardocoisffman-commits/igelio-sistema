import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: usuario, error } = await supabaseAdmin
          .from('usuarios')
          .select('*')
          .eq('email', credentials.email)
          .eq('activo', true)
          .single()

        if (error || !usuario) return null

        const passwordOk = await bcrypt.compare(credentials.password, usuario.password_hash)
        if (!passwordOk) return null

        return {
          id: String(usuario.id),
          name: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          sede: usuario.sede,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = user.rol
        token.sede = user.sede
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.rol = token.rol
        session.user.sede = token.sede
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
