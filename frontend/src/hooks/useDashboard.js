import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'

export const useDashboardStats = (period = 'Monthly') => {
  // Map frontend display values to backend-expected values
  const periodMap = {
    'This Week': 'weekly',
    'Monthly': 'monthly',
    'This Year': 'yearly'
  }
  const backendPeriod = periodMap[period] || period

  return useQuery({
    queryKey: ['dashboard', 'stats', backendPeriod],
    queryFn: () => dashboardApi.getStats(backendPeriod).then((res) => res.data),
    refetchInterval: 60000 // Refetch every 60 seconds
  })
}
