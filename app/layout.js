export const metadata = {
  icons: { icon: '/favicon.svg' }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
