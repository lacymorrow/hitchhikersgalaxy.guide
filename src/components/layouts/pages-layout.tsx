import { TRPCReactProvider } from '@/lib/trpc/react'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { ReactNode } from 'react'

interface PagesLayoutProps {
  children: ReactNode
}

export const PagesLayout = ({ children }: PagesLayoutProps) => {
  return (
					<SessionProvider>
						<TRPCReactProvider>
							<ThemeProvider attribute="class" defaultTheme="dark">
								<TooltipProvider delayDuration={100}>
									{/* Content */}
									{children}

									{/* Toast - Display messages to the user */}
									<Toaster />
								</TooltipProvider>
							</ThemeProvider>
						</TRPCReactProvider>
					</SessionProvider>
  )
}
