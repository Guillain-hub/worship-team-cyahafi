import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
// <CHANGE> Added ThemeProvider import for dark mode support
import { ThemeProvider } from "@/components/theme-provider"
// Auth provider
import { AuthProvider } from "@/components/auth-provider"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Worship Team ADEPR Cyahafi - Community & Events Management",
  description: "Manage your worship team activities, members, contributions, and events with our comprehensive platform. Join ADEPR Cyahafi community today.",
  generator: 'v0.app',
  manifest: "/manifest.json",
  keywords: ["worship team", "community management", "events", "activities", "church", "ADEPR", "Cyahafi"],
  authors: [{ name: "ADEPR Cyahafi" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Worship Team ADEPR Cyahafi",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://worship-team-cyahafi.vercel.app",
    siteName: "Worship Team ADEPR Cyahafi",
    title: "Worship Team ADEPR Cyahafi - Community & Events Management",
    description: "Manage your worship team activities, members, contributions, and events with our comprehensive platform.",
    images: [
      {
        url: "https://worship-team-cyahafi.vercel.app/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Worship Team ADEPR Cyahafi",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Worship Team ADEPR Cyahafi",
    description: "Worship team management and coordination platform",
    images: ["https://worship-team-cyahafi.vercel.app/icons/icon-512.png"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0612",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="ADEPR Cyahafi" />
        <link rel="canonical" href="https://worship-team-cyahafi.vercel.app" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased overflow-x-hidden`}>
        {/* <CHANGE> Wrapped children with ThemeProvider for dark/light mode switching */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Provide auth context to client UI; cookie is source-of-truth */}
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
