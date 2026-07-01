import './globals.css'

export const metadata = {
  title: 'Sistema IGE — Importaciones Generales Elio',
  description: 'Sistema de gestión y trazabilidad',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
