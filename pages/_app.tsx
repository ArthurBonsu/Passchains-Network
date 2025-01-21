import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { ReactNode, useState, useEffect } from 'react'

// Import GlobalErrorHandler dynamically with SSR
const GlobalErrorHandler = dynamic(
  () => import('@/components/GlobalErrorHandler'),
  {
    ssr: true,
    loading: () => null  // Use null instead of a loading div
  }
)

// Type the NoSSR component props
interface NoSSRProps {
  children: ReactNode;
}

// Create NoSSR wrapper component with proper typing
const NoSSR: React.FC<NoSSRProps> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}

// Main App component
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GlobalErrorHandler>
      <NoSSR>
        <Component {...pageProps} />
      </NoSSR>
    </GlobalErrorHandler>
  )
}

export default MyApp