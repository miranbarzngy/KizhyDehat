'use client'

import GlobalLoader from './common/GlobalLoader'

interface DashboardLoaderProps {
  message?: string
}

export default function DashboardLoader({ message = 'چاوەڕوانبە...' }: DashboardLoaderProps) {
  return <GlobalLoader message={message} />
}
