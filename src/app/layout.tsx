import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "YouTube Video Transcript Summarizer",
  description: "AI-powered YouTube video transcript summary and analysis tool",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark:bg-gray-900" suppressHydrationWarning>
      <body className="dark:text-white">
        {children}
      </body>
    </html>
  )
}