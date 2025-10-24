import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Trimflow - Free Online Video Trimmer | Trim Videos in Browser",
  description:
    "Trim and cut videos online for free. Fast, secure browser-based video editor supporting MP4, MOV, and AVI. No upload required - your videos stay private on your device.",
  keywords: [
    "video trimmer",
    "online video editor",
    "trim video online",
    "cut video",
    "video cutter",
    "free video editor",
    "browser video editor",
    "MP4 trimmer",
    "MOV editor",
    "AVI cutter",
    "client-side video editing",
  ],
  authors: [{ name: "Trimflow" }],
  creator: "Trimflow",
  publisher: "Trimflow",
  metadataBase: new URL("https://trimflow.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://trimflow.app",
    title: "Trimflow - Free Online Video Trimmer",
    description:
      "Trim and cut videos online for free. Fast, secure browser-based video editor. No upload required - your videos stay private.",
    siteName: "Trimflow",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Trimflow - Online Video Trimmer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trimflow - Free Online Video Trimmer",
    description: "Trim videos instantly in your browser. Fast, private, and completely free.",
    images: ["/og-image.jpg"],
    creator: "@trimflow",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Trimflow",
              url: "https://trimflow.app",
              description: "Free online video trimming tool. Trim and cut videos in your browser without uploading.",
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Trim videos online",
                "No upload required",
                "Supports MP4, MOV, AVI",
                "Client-side processing",
                "Free to use",
              ],
              browserRequirements: "Requires JavaScript. Requires HTML5.",
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
