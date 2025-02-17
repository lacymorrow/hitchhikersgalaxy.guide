import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { Space_Grotesk as FontSans, Noto_Serif as FontSerif } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TRPCReactProvider } from '@/lib/trpc/react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { cn } from '@/lib/utils'
import { PagesLayout } from '@/components/layouts/pages-layout'

const fontSerif = FontSerif({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
})

const fontSans = FontSans({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sans',
})

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <TooltipProvider delayDuration={100}>
            <div className={cn(
              'min-h-screen flex items-center justify-center antialiased',
              'font-sans font-normal leading-relaxed',
              fontSans.variable,
              fontSerif.variable
            )}>
              <PagesLayout>
                <Component {...pageProps} />
              </PagesLayout>
              <Toaster />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </TRPCReactProvider>
    </SessionProvider>
  )
}
