// utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  level?: LogLevel
  timestamp?: boolean
  metadata?: Record<string, any>
}

export const Logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true' || process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString()
      console.log(`[INFO] [${timestamp}] ${message}`, ...args)
    }
  },

  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString()
    console.error(`[ERROR] [${timestamp}] ${message}`, error)
    
    // Additional error tracking could be added here
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true') {
      const timestamp = new Date().toISOString()
      console.warn(`[WARN] [${timestamp}] ${message}`, ...args)
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true') {
      const timestamp = new Date().toISOString()
      console.debug(`[DEBUG] [${timestamp}] ${message}`, ...args)
    }
  },

  // New method for logging with custom options
  log: (level: LogLevel, message: string, options?: LoggerOptions, ...args: any[]) => {
    const shouldLog = 
      process.env.NODE_ENV === 'development' || 
      process.env.NEXT_PUBLIC_DEBUG === 'true' || 
      level === 'error'

    if (!shouldLog) return

    const timestamp = options?.timestamp ? new Date().toISOString() : undefined
    const metadata = options?.metadata ? JSON.stringify(options.metadata) : ''
    const logMessage = [
      `[${level.toUpperCase()}]`,
      timestamp ? `[${timestamp}]` : '',
      metadata ? `[${metadata}]` : '',
      message
    ].filter(Boolean).join(' ')

    switch (level) {
      case 'debug':
        console.debug(logMessage, ...args)
        break
      case 'info':
        console.log(logMessage, ...args)
        break
      case 'warn':
        console.warn(logMessage, ...args)
        break
      case 'error':
        console.error(logMessage, ...args)
        // Log stack trace if last argument is an Error
        const lastArg = args[args.length - 1]
        if (lastArg instanceof Error) {
          console.error('Stack trace:', lastArg.stack)
        }
        break
    }
  }
}

// Usage examples:
/*
Logger.info('Application started', { version: '1.0.0' })
Logger.error('Failed to process transaction', new Error('Network error'))
Logger.warn('Performance degradation detected', { latency: 500 })
Logger.debug('Processing request', { requestId: '123', payload: {} })

Logger.log('info', 'Custom log message', {
  timestamp: true,
  metadata: { userId: '123', action: 'login' }
})
*/

export default Logger