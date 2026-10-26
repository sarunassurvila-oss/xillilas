import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { SITE } from '@/lib/site'
import './globals.css'

const display = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], variable: '--font-display-face', display: 'swap' })
const body = Figtree({ subsets: ['latin', 'latin-ext'], variable: '--font-body-face', display: 'swap' })

export const metadata: Metadata = {
  title: { default: `${SITE.name} – butai, namai ir sklypai visoje Lietuvoje`, template: `%s | ${SITE.name}` },
  description: 'Nekilnojamojo turto skelbimai: butai, namai, sklypai, patalpos ir garažai pardavimui bei nuomai visoje Lietuvoje.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#211812' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
