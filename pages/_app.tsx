import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Import GlobalErrorHandler dynamically with no SSR
const GlobalErrorHandler = dynamic(
  () => import('@/components/GlobalErrorHandler'),
  {
    ssr: false,
    loading: () => <div>Loading...</div>
  }
)

// Type the NoSSR component props
interface NoSSRProps {
  children: ReactNode;
}

// Create NoSSR wrapper component with proper typing
const NoSSR: React.FC<NoSSRProps> = ({ children }) => {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

// Main App component
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NoSSR>
      <GlobalErrorHandler>
        <Component {...pageProps} />
      </GlobalErrorHandler>
    </NoSSR>
  )
}

export default MyApp