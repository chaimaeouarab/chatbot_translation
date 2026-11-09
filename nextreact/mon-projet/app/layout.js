import "./globals.css"

export const metadata = {
  title: "Chatbot",
  description: "Chatbot Next.js + Flask + Qwen",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}